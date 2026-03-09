import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    
    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedExtensions = [
      ".pdf", ".docx", ".doc", ".txt", ".csv", ".xlsx", ".xls",
      ".json", ".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".tiff"
    ];
    
    const filename = file.name;
    const fileExtension = filename.substring(filename.lastIndexOf(".")).toLowerCase();
    
    if (!allowedExtensions.includes(fileExtension)) {
      return NextResponse.json(
        { error: `File type not supported. Allowed:  ${allowedExtensions.join(", ")}` },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 10MB" },
        { status: 400 }
      );
    }

    // Save file locally
    const uploadsDir = join(process.cwd(), "nlp_model", "data", "uploads");
    
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    const timestamp = Date.now();
    const safeFilename = `${timestamp}_${filename}`;
    const filePath = join(uploadsDir, safeFilename);

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    return NextResponse.json({
      success: true,
      message: "File uploaded successfully",
      filename: safeFilename,
      originalName: filename,
      size: file.size,
      type: fileExtension,
      uploadedAt: new Date().toISOString()
    });

  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to upload file" },
      { status: 500 }
    );
  }
}
