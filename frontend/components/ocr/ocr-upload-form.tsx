"use client";

import { useState, useCallback } from "react";
import { Upload, FileImage, X, CheckCircle, AlertCircle, Loader2, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/lib/use-toast";

interface OCRResult {
  original_ocr: string;
  refined_text: string;
  timestamp: string;
}

export function OCRUploadForm() {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<OCRResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const { toast } = useToast();

  const handleDrag = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type.startsWith("image/")) {
        setFile(droppedFile);
        setError(null);
      } else {
        setError("Please upload an image file (PNG, JPG, etc.)");
      }
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type.startsWith("image/")) {
        setFile(selectedFile);
        setError(null);
      } else {
        setError("Please upload an image file (PNG, JPG, etc.)");
      }
    }
  };

  const processImage = async () => {
    if (!file) return;

    setProcessing(true);
    setError(null);

    const formData = new FormData();
    formData.append("image", file);

    try {
      const response = await fetch("/api/ocr/process", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to process image");
      }

      const data = await response.json();
      setResult({
        original_ocr: data.original_ocr,
        refined_text: data.refined_text,
        timestamp: new Date().toLocaleString(),
      });

      toast({
        title: "Success",
        description: "Image processed successfully",
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to process image";
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Text copied to clipboard",
    });
  };

  const resetForm = () => {
    setFile(null);
    setResult(null);
    setError(null);
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      {!result ? (
        <Card className="p-8">
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors cursor-pointer ${
              dragActive
                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/10"
                : "border-gray-300 dark:border-gray-700 hover:border-blue-500"
            }`}
          >
            <input
              type="file"
              id="image-upload"
              onChange={handleFileSelect}
              className="hidden"
              accept="image/*"
            />
            <label htmlFor="image-upload" className="cursor-pointer">
              <FileImage className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold">Upload Image for OCR</h3>
              <p className="mt-2 text-sm text-gray-500">
                Drag and drop your image here, or click to browse
              </p>
              <p className="mt-1 text-xs text-gray-400">
                Supported formats: PNG, JPG, JPEG, GIF, BMP
              </p>
            </label>
          </div>

          {error && (
            <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
              <p className="text-sm text-red-700 dark:text-red-200">{error}</p>
            </div>
          )}

          {file && (
            <Card className="mt-6 p-6 bg-gray-50 dark:bg-gray-900">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1">
                  <FileImage className="h-8 w-8 text-blue-600 mt-1 shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium">{file.name}</p>
                    <p className="text-sm text-gray-500">
                      {(file.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFile(null)}
                  disabled={processing}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex gap-3 mt-6">
                <Button
                  onClick={processImage}
                  disabled={processing}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {processing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Process Image
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setFile(null)}
                  disabled={processing}
                >
                  Cancel
                </Button>
              </div>
            </Card>
          )}
        </Card>
      ) : (
        /* Results View */
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <h3 className="text-lg font-semibold">OCR Processing Complete</h3>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Processed on {result.timestamp}
            </p>

            {/* Original OCR Text */}
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-700 dark:text-gray-300">Original OCR Text</h4>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(result.original_ocr)}
                  >
                    <Copy className="h-4 w-4 mr-1" />
                    Copy
                  </Button>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 max-h-64 overflow-y-auto">
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {result.original_ocr}
                  </p>
                </div>
              </div>

              {/* Refined Text */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-700 dark:text-gray-300">Refined & Cleaned Text</h4>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(result.refined_text)}
                  >
                    <Copy className="h-4 w-4 mr-1" />
                    Copy
                  </Button>
                </div>
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800 max-h-64 overflow-y-auto">
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {result.refined_text}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                onClick={resetForm}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Upload className="h-4 w-4 mr-2" />
                Process Another Image
              </Button>
            </div>
          </Card>

          {/* Info Card */}
          <Card className="p-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
              <div>
                <h4 className="font-semibold text-blue-900 dark:text-blue-100">How it works</h4>
                <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">
                  The original text is extracted from your image using Optical Character Recognition (OCR). The refined text is then cleaned up and corrected using AI to fix typos, improve formatting, and ensure accuracy.
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
