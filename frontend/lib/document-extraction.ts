import { PDFParse } from "pdf-parse";

function decodeBuffer(buffer: Buffer): string {
  return buffer.toString("utf-8").replace(/\u0000/g, "").trim();
}

async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  const parser = new PDFParse({ data: buffer });
  try {
    const data = await parser.getText();
    return (data?.text || "").trim();
  } finally {
    await parser.destroy();
  }
}

async function extractTextFromImage(buffer: Buffer): Promise<string> {
  const tesseract = await import("tesseract.js");
  const result = await tesseract.recognize(buffer, "eng");
  return (result?.data?.text || "").trim();
}

function isImageMime(mimeType: string) {
  return mimeType.startsWith("image/");
}

export async function extractTextFromUploadedFile(file: {
  name: string;
  type: string;
  buffer: Buffer;
}): Promise<{ extractedText: string; method: string }> {
  const fileName = file.name.toLowerCase();
  const mimeType = (file.type || "").toLowerCase();

  if (fileName.endsWith(".pdf") || mimeType.includes("pdf")) {
    return {
      extractedText: await extractTextFromPdf(file.buffer),
      method: "pdf-parse",
    };
  }

  if (isImageMime(mimeType) || /\.(png|jpg|jpeg|webp|bmp|tiff|gif)$/i.test(fileName)) {
    return {
      extractedText: await extractTextFromImage(file.buffer),
      method: "tesseract",
    };
  }

  if (/(\.txt|\.csv|\.json)$/i.test(fileName)) {
    return {
      extractedText: decodeBuffer(file.buffer),
      method: "plain-text",
    };
  }

  // Basic fallback for unsupported office documents.
  return {
    extractedText: "",
    method: "unsupported",
  };
}
