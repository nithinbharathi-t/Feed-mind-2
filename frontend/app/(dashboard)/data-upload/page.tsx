import { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { DataUploadForm } from "@/components/data/data-upload-form";

export const metadata: Metadata = {
  title: "Upload Training Data | FeedMind",
  description: "Upload documents, images, and data to train the AI model",
};

export default function DataUploadPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        heading="Upload Training Data"
        description="Upload documents, PDFs, images, or CSV files to enhance the AI model's training dataset"
      />
      <DataUploadForm />
    </div>
  );
}
