import { useState, useRef } from "react";
import { Upload, FileText, Sparkles, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useCreateProject } from "@/hooks/useCreateProject";
import { BriefAnalysisLoading } from "@/components/app/BriefAnalysisLoading";
import { cn } from "@/lib/utils";

export default function App() {
  const [briefText, setBriefText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { createProject, isSubmitting, progress, error, reset } = useCreateProject();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const handleRemoveFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    await createProject(briefText, files);
  };

  // Show loading screen when submitting
  if (isSubmitting) {
    return <BriefAnalysisLoading progress={progress} />;
  }

  // Show form when NOT submitting
  return (
    <div className="min-h-full p-8">
      <div className="max-w-2xl mx-auto">
        {/* Welcome Header */}
        <div className="text-center mb-12">
          <h1 className="font-display text-3xl font-bold mb-3">
            Start a new project
          </h1>
          <p className="text-muted-foreground">
            Upload your brief or describe your campaign to get started.
          </p>
        </div>

        {/* Brief Form */}
        <div className="glass rounded-2xl p-6 space-y-6">
          {/* File Upload */}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.ppt,.pptx"
              onChange={handleFileChange}
              className="hidden"
            />
            <div
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "border-2 border-dashed border-border/50 rounded-xl p-8 text-center cursor-pointer",
                "hover:border-primary/50 hover:bg-primary/5 transition-colors"
              )}
            >
              <Upload className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm font-medium mb-1">
                Drop files here or click to upload
              </p>
              <p className="text-xs text-muted-foreground">
                PDF, Word, or PowerPoint files
              </p>
            </div>
          </div>

          {/* Uploaded Files */}
          {files.length > 0 && (
            <div className="space-y-2">
              {files.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4 text-primary" />
                    <span className="text-sm truncate max-w-[200px]">{file.name}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveFile(index)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border/50" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-3 text-muted-foreground">Or describe your brief</span>
            </div>
          </div>

          {/* Text Brief */}
          <Textarea
            placeholder="Describe your campaign goals, target audience, deliverables, timeline, and any other relevant details..."
            value={briefText}
            onChange={(e) => {
              setBriefText(e.target.value);
              if (error) reset();
            }}
            className="min-h-[150px] bg-background/50 border-border/50 resize-none"
          />

          {/* Progress */}
          {error && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}

          {/* Submit Button */}
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || (!briefText.trim() && files.length === 0)}
            className="w-full"
            size="lg"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Start Brief
          </Button>
        </div>
      </div>
    </div>
  );
}
