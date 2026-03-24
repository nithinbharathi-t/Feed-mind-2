import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("image") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No image file provided" },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const buffer = await file.arrayBuffer();

    // Forward to backend OCR service
    // Make sure your backend OCR service is running on the expected port
    const backendUrl = process.env.OCR_SERVICE_URL || "http://localhost:3000";

    const requestFormData = new FormData();
    requestFormData.append("image", new Blob([buffer], { type: file.type }), file.name);

    const response = await fetch(`${backendUrl}/api/process-image`, {
      method: "POST",
      body: requestFormData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.error || "Failed to process image" },
        { status: response.status }
      );
    }

    const result = await response.json();

    return NextResponse.json(result);
  } catch (error) {
    console.error("OCR Processing Error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to process image",
      },
      { status: 500 }
    );
  }
}
