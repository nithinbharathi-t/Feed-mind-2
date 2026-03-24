import { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { OCRUploadForm } from "@/components/ocr/ocr-upload-form";

export const metadata: Metadata = {
  title: "OCR Upload | FeedMind",
  description: "Extract and clean text from images using OCR and AI",
};

export default function OCRUploadPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        heading="OCR Text Extraction"
        description="Upload an image to extract text and automatically clean it up using AI"
      />
      <OCRUploadForm />
    </div>
  );
}
