import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

const NLP_API_URL = process.env.NLP_API_URL || "http://localhost:8000";

// Store training status in memory (in production, use Redis or database)
const trainingStatus = new Map<string, {
  status: "idle" | "running" | "completed" | "error";
  progress: number;
  message: string;
  startedAt: string;
  completedAt?: string;
  details?: any;
}>();

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { epochs = 3, batch_size = 4, learning_rate = 2e-5 } = await request.json();

    // Generate training job ID
    const jobId = `train_${Date.now()}`;
    const startedAt = new Date().toISOString();

    // Call Python API to start training
    try {
      const response = await fetch(`${NLP_API_URL}/api/v1/train`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          epochs,
          batch_size,
          learning_rate
        }),
        signal: AbortSignal.timeout(5000)
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: "Unknown error" }));
        throw new Error(error.detail || `Training API error: ${response.status}`);
      }

      const result = await response.json();

      // Store status
      trainingStatus.set(jobId, {
        status: result.status,
        progress: result.progress,
        message: result.message,
        startedAt,
        details: result.details
      });

      return NextResponse.json({
        success: true,
        jobId,
        ...result
      });

    } catch (error: any) {
      console.error("Training API call failed:", error);
      
      // Store error status
      trainingStatus.set(jobId, {
        status: "error",
        progress: 0,
        message: error.message || "Failed to start training",
        startedAt
      });

      return NextResponse.json({
        success: false,
        error: error.message || "Failed to connect to NLP API",
        message: "Make sure the Python NLP API is running (cd nlp_model && python run_api.py)"
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error("Training initialization error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to start training" },
      { status: 500 }
    );
  }
}

// Get training status
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get("jobId");

    // Call Python API for status
    try {
      const response = await fetch(`${NLP_API_URL}/api/v1/train/status`, {
        signal: AbortSignal.timeout(5000)
      });

      if (!response.ok) {
        throw new Error(`Status API error: ${response.status}`);
      }

      const pythonStatus = await response.json();

      // Update local status cache
      if (jobId && trainingStatus.has(jobId)) {
        const localStatus = trainingStatus.get(jobId)!;
        trainingStatus.set(jobId, {
          ...localStatus,
          status: pythonStatus.status,
          progress: pythonStatus.progress,
          message: pythonStatus.message,
          details: pythonStatus.details
        });
      }

      if (jobId) {
        // Get specific job status
        const status = trainingStatus.get(jobId);
        if (!status) {
          return NextResponse.json(
            { error: "Job not found" },
            { status: 404 }
          );
        }
        return NextResponse.json({ jobId, ...status });
      }

      // Return Python API status
      return NextResponse.json(pythonStatus);

    } catch (error: any) {
      console.error("Failed to get status from Python API:", error);
      
      // Fallback to local status if Python API is unavailable
      if (jobId) {
        const status = trainingStatus.get(jobId);
        if (status) {
          return NextResponse.json({ jobId, ...status });
        }
        return NextResponse.json(
          { error: "Job not found" },
          { status: 404 }
        );
      }

      return NextResponse.json({
        status: "idle",
        progress: 0,
        message: "NLP API unavailable",
        error: error.message
      });
    }

  } catch (error: any) {
    console.error("Error fetching training status:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch training status" },
      { status: 500 }
    );
  }
}
