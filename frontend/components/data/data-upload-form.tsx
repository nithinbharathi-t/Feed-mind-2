"use client";

import { useState, useCallback, useEffect } from "react";
import { Upload, File, X, CheckCircle, AlertCircle, BarChart3, RefreshCw, Brain, Zap, Clock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/lib/use-toast";

interface UploadedFile {
  filename: string;
  size: number;
  uploadedAt: string;
  path: string;
}

interface DatasetStats {
  total_files: number;
  total_records: number;
  sentiment_distribution: Record<string, number>;
  category_distribution: Record<string, number>;
  avg_text_length: number;
}

export function DataUploadForm() {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [stats, setStats] = useState<DatasetStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [isTraining, setIsTraining] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [trainingJobId, setTrainingJobId] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch existing files on mount
  useEffect(() => {
    fetchUploadedFiles();
    fetchStats();
  }, []);

  const fetchUploadedFiles = async () => {
    try {
      const response = await fetch("/api/data/upload");
      if (response.ok) {
        const data = await response.json();
        setUploadedFiles(data.files || []);
      }
    } catch (error) {
      console.error("Failed to fetch uploaded files:", error);
    }
  };

  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      // This would call the Python NLP API for stats
      // For now, we'll use mock data
      // In production, you'd call: http://localhost:8001/api/v1/data/stats
      setLoadingStats(false);
    } catch (error) {
      console.error("Failed to fetch stats:", error);
      setLoadingStats(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files);
    setFiles((prev) => [...prev, ...droppedFiles]);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...selectedFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadFiles = async () => {
    if (files.length === 0) {
      toast({
        title: "No files selected",
        description: "Please select files to upload",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    const newUploadedFiles: UploadedFile[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const formData = new FormData();
      formData.append("file", file);

      try {
        const response = await fetch("/api/data/upload", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Upload failed");
        }

        const result = await response.json();
        newUploadedFiles.push({
          filename: result.filename,
          size: result.size,
          uploadedAt: new Date().toISOString(),
          path: result.path
        });

        setUploadProgress(((i + 1) / files.length) * 100);
      } catch (error) {
        toast({
          title: "Upload failed",
          description: error instanceof Error ? error.message : "Failed to upload file",
          variant: "destructive"
        });
      }
    }

    setUploading(false);
    setFiles([]);
    setUploadedFiles((prev) => [...newUploadedFiles, ...prev]);

    // Refresh the file list and stats
    fetchUploadedFiles();
    fetchStats();

    if (newUploadedFiles.length > 0) {
      toast({
        title: "Upload successful",
        description: `${newUploadedFiles.length} file(s) uploaded successfully`,
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  const getFileIcon = (filename: string) => {
    const ext = filename.split(".").pop()?.toLowerCase();
    if (["jpg", "jpeg", "png", "gif"].includes(ext || "")) return "🖼️";
    if (ext === "pdf") return "📄";
    if (ext === "csv") return "📊";
    if (["xls", "xlsx"].includes(ext || "")) return "📗";
    return "📁";
  };

  const startTraining = async () => {
    if (uploadedFiles.length === 0) {
      toast({
        title: "No data uploaded",
        description: "Please upload training data files first",
        variant: "destructive"
      });
      return;
    }

    setIsTraining(true);
    setTrainingProgress(0);

    try {
      const res = await fetch("/api/data/train", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trainingType: "question_generation",
          config: {
            epochs: 10,
            batch_size: 8,
            learning_rate: 0.0005
          }
        })
      });

      if (!res.ok) {
        throw new Error("Failed to start training");
      }

      const data = await res.json();
      setTrainingJobId(data.jobId);

      toast({
        title: "Training started",
        description: "The model is now training on uploaded data. This may take several minutes.",
      });

      // Poll for training status
      const pollInterval = setInterval(async () => {
        try {
          const statusRes = await fetch(`/api/data/train?jobId=${data.jobId}`);
          if (statusRes.ok) {
            const status = await statusRes.json();
            setTrainingProgress(status.progress || 0);
            
            if (status.status === "completed") {
              clearInterval(pollInterval);
              setIsTraining(false);
              setTrainingProgress(100);
              toast({
                title: "Training completed!",
                description: "The model has been trained successfully and is now available globally.",
              });
            } else if (status.status === "failed") {
              clearInterval(pollInterval);
              setIsTraining(false);
              toast({
                title: "Training failed",
                description: status.error || "An error occurred during training",
                variant: "destructive"
              });
            }
          }
        } catch (err) {
          console.error("Error polling training status:", err);
        }
      }, 5000); // Poll every 5 seconds

      // Stop polling after 30 minutes
      setTimeout(() => clearInterval(pollInterval), 30 * 60 * 1000);

    } catch (error) {
      setIsTraining(false);
      toast({
        title: "Training failed",
        description: error instanceof Error ? error.message : "Failed to start training",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Drop Zone */}
      <Card className="p-8">
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-12 text-center hover:border-blue-500 transition-colors cursor-pointer"
        >
          <input
            type="file"
            id="file-upload"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            accept=".csv,.pdf,.jpg,.jpeg,.png,.xls,.xlsx,.txt"
          />
          <label htmlFor="file-upload" className="cursor-pointer">
            <Upload className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-semibold">Upload Training Data</h3>
            <p className="mt-2 text-sm text-gray-500">
              Drag and drop files here, or click to browse
            </p>
            <p className="mt-1 text-xs text-gray-400">
              Supported formats: CSV, PDF, Images (JPG, PNG), Excel, Text
            </p>
            <p className="text-xs text-gray-400">Max file size: 10MB</p>
          </label>
        </div>
      </Card>

      {/* Selected Files */}
      {files.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Selected Files ({files.length})</h3>
          <div className="space-y-3">
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                <div className="flex items-center space-x-3 flex-1">
                  <span className="text-2xl">{getFileIcon(file.name)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(index)}
                  disabled={uploading}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          {uploading && (
            <div className="mt-4">
              <Progress value={uploadProgress} className="h-2" />
              <p className="text-sm text-center mt-2 text-gray-500">
                Uploading... {Math.round(uploadProgress)}%
              </p>
            </div>
          )}

          <div className="flex justify-end space-x-3 mt-4">
            <Button
              variant="outline"
              onClick={() => setFiles([])}
              disabled={uploading}
            >
              Clear All
            </Button>
            <Button
              onClick={uploadFiles}
              disabled={uploading}
            >
              {uploading ? "Uploading..." : `Upload ${files.length} File(s)`}
            </Button>
          </div>
        </Card>
      )}

      {/* Uploaded Files History */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Recently Uploaded Files</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              fetchUploadedFiles();
              fetchStats();
            }}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
        {uploadedFiles.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <File className="mx-auto h-12 w-12 text-gray-300 mb-2" />
            <p>No files uploaded yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {uploadedFiles.slice(0, 10).map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg"
              >
                <div className="flex items-center space-x-3 flex-1">
                  <CheckCircle className="h-5 w-5 text-green-600" />

      {/* Model Training Card */}
      <Card className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-800">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-600 text-white">
              <Brain className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-100">
                Train Global AI Model
              </h3>
              <p className="text-sm text-purple-800 dark:text-purple-200 mt-1">
                Train the AI model on uploaded data. The trained model will be available to all platform users
                for generating intelligent survey questions.
              </p>
              {uploadedFiles.length > 0 && (
                <p className="text-sm font-medium text-purple-900 dark:text-purple-100 mt-2">
                  Ready to train on {uploadedFiles.length} uploaded file(s)
                </p>
              )}
            </div>
          </div>
        </div>

        {isTraining && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-purple-900 dark:text-purple-100">
                Training in progress...
              </span>
              <span className="text-sm text-purple-700 dark:text-purple-300">
                {trainingProgress}%
              </span>
            </div>
            <Progress value={trainingProgress} className="h-2" />
            <p className="text-xs text-purple-700 dark:text-purple-300 mt-2 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              This may take 5-15 minutes depending on data size
            </p>
          </div>
        )}

        <div className="flex gap-3 mt-4">
          <Button
            onClick={startTraining}
            disabled={isTraining || uploadedFiles.length === 0}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            {isTraining ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Training...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-2" />
                Start Training
              </>
            )}
          </Button>
          {isTraining && (
            <Button
              variant="outline"
              disabled
              className="border-purple-300 dark:border-purple-700"
            >
              Training cannot be interrupted
            </Button>
          )}
        </div>

        <div className="mt-4 p-3 bg-purple-100/50 dark:bg-purple-800/20 rounded-lg">
          <p className="text-xs text-purple-800 dark:text-purple-200">
            <strong>Note:</strong> The model will improve as more data is uploaded by the community.
            Every training session enhances the AI's ability to generate relevant questions.
          </p>
        </div>
      </Card>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.filename}</p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(file.size)} • {new Date(file.uploadedAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Dataset Statistics */}
      {stats && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="h-5 w-5" />
            <h3 className="text-lg font-semibold">Dataset Statistics</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">{stats.total_files}</p>
              <p className="text-sm text-gray-500">Total Files</p>
            </div>
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-2xl font-bold text-green-600">{stats.total_records}</p>
              <p className="text-sm text-gray-500">Total Records</p>
            </div>
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-2xl font-bold text-purple-600">
                {Math.round(stats.avg_text_length)}
              </p>
              <p className="text-sm text-gray-500">Avg Text Length</p>
            </div>
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-2xl font-bold text-orange-600">
                {Object.keys(stats.sentiment_distribution).length}
              </p>
              <p className="text-sm text-gray-500">Sentiments</p>
            </div>
          </div>
          {Object.keys(stats.sentiment_distribution).length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-medium mb-2">Sentiment Distribution:</p>
              <div className="flex gap-2 flex-wrap">
                {Object.entries(stats.sentiment_distribution).map(([sentiment, count]) => (
                  <span
                    key={sentiment}
                    className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-sm"
                  >
                    {sentiment}: {count}
                  </span>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Info Card */}
      <Card className="p-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <div className="flex items-start space-x-3">
          <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-semibold text-blue-900 dark:text-blue-100">
              Training Data Format
            </h4>
            <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">
              For CSV files, include the following columns:
            </p>
            <ul className="text-sm text-blue-800 dark:text-blue-200 mt-2 space-y-1 list-disc list-inside">
              <li><strong>feedback_text</strong> (required): The text feedback</li>
              <li><strong>rating</strong> (required): Rating from 1-5</li>
              <li><strong>category</strong> (optional): Feedback category</li>
              <li><strong>performance_score</strong> (optional): Performance score 0-100</li>
            </ul>
            <p className="text-sm text-blue-800 dark:text-blue-200 mt-2">
              Images and PDFs will be processed for text extraction automatically.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
