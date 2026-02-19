import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, FileText, Sparkles, AlertCircle, Loader2, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useCreateProject } from "@/hooks/useCreateProject";
import { BriefAnalysisLoading } from "@/components/app/BriefAnalysisLoading";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { startBrainstormFirstMessage } from "@/services/api";
import { cn } from "@/lib/utils";

export default function App() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [briefText, setBriefText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isStartingBrainstorm, setIsStartingBrainstorm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { createProject, isSubmitting, showLoadingScreen, progress, error, reset } = useCreateProject();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...newFiles]);
      if (error) reset(); // Clear error when files are uploaded
    }
  };

  const handleRemoveFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    // Filter for accepted file types
    const acceptedFiles = droppedFiles.filter(file => {
      const extension = file.name.split('.').pop()?.toLowerCase();
      return ['pdf', 'doc', 'docx', 'ppt', 'pptx'].includes(extension || '');
    });

    if (acceptedFiles.length > 0) {
      setFiles((prev) => [...prev, ...acceptedFiles]);
      if (error) reset(); // Clear error when files are uploaded
    }
  };

  const handleSubmit = async () => {
    if (!briefText.trim() && files.length === 0) {
      toast({
        title: "Brief required",
        description: "Add files or describe your campaign to get started.",
        variant: "destructive",
      });
      return;
    }
    await createProject(briefText, files);
  };

  const handleStartBrainstorming = async () => {
    if (!user?.email) {
      toast({
        title: "Sign in required",
        description: "Please sign in to start brainstorming.",
        variant: "destructive",
      });
      return;
    }
    if (!briefText.trim()) {
      toast({
        title: "Description required",
        description: "Add some text to describe your ideas before starting brainstorming.",
        variant: "destructive",
      });
      return;
    }
    const newChatId = crypto.randomUUID();
    const message = briefText.trim();
    setIsStartingBrainstorm(true);
    try {
      await startBrainstormFirstMessage(user.email, newChatId, message, files.length > 0 ? files : undefined);
      navigate(`/app/chat/${newChatId}`);
    } catch {
      toast({
        title: "Brainstorming failed",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsStartingBrainstorm(false);
    }
  };

  // Show loading screen when campaign creation started
  if (showLoadingScreen) {
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
              onDragOver={handleDragOver}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={cn(
                "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors",
                isDragging
                  ? "border-primary bg-primary/10 scale-[1.02]"
                  : "border-border/50 hover:border-primary/50 hover:bg-primary/5"
              )}
            >
              <Upload className={cn(
                "h-8 w-8 mx-auto mb-3 transition-colors",
                isDragging ? "text-primary" : "text-muted-foreground"
              )} />
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
            placeholder="Describe your campaign goals, ideas, target audience, deliverables, timeline, or any other relevant details..."
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

          {/* Submit Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={handleStartBrainstorming}
              disabled={isSubmitting || showLoadingScreen || isStartingBrainstorm}
              className="flex-1"
              size="lg"
            >
              {isStartingBrainstorm ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Lightbulb className="h-4 w-4 mr-2" />
              )}
              {isStartingBrainstorm ? "Opening..." : "Start Brainstorming"}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || showLoadingScreen}
              className="flex-1"
              size="lg"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4 mr-2" />
              )}
              {isSubmitting ? "Processing..." : "Start Campaign"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
