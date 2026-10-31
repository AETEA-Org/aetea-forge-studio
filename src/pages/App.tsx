import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, FileText, Sparkles, AlertCircle, Loader2, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useCreateProject } from "@/hooks/useCreateProject";
import { BriefAnalysisLoading } from "@/components/app/BriefAnalysisLoading";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { startTurn } from "@/services/agentRun";
import { TierPicker } from "@/components/app/ChatInput";
import { OutOfCredits } from "@/components/app/billing/OutOfCredits";
import { CampaignCostNote } from "@/components/app/billing/CampaignCostNote";
import { reportSendFailure } from "@/services/sendFailure";
import { BRIEF_EXTENSIONS, BRIEF_FILE_ACCEPT, BRIEF_TYPE_LABEL, partitionChatFiles, summarizeFileErrors } from "@/lib/chatFileValidation";
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
  
  const { createProject, isSubmitting, showLoadingScreen, steps, error, chatId: buildingChatId, reset } = useCreateProject();

  const takeBriefFiles = (incoming: File[]) => {
    const { accepted, errors } = partitionChatFiles(incoming, BRIEF_EXTENSIONS);
    if (errors.length > 0) {
      toast({
        title: "Some files were skipped",
        description: summarizeFileErrors(errors),
        variant: "destructive",
      });
    }
    if (accepted.length > 0) {
      setFiles((prev) => [...prev, ...accepted]);
      if (error) reset();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      takeBriefFiles(Array.from(e.target.files));
      e.target.value = "";
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

    takeBriefFiles(Array.from(e.dataTransfer.files));
  };

  // This page starts billable work — a brainstorm turn, and the campaign build,
  // which is the single most expensive thing in the product. It had no picker
  // and no credits handling at all, so a customer's very first turn could come
  // back as a red "failed" toast when what actually happened was an empty
  // balance.
  const [tier, setTier] = useState<string>("auto");
  const [outOfCredits, setOutOfCredits] = useState(false);

  const handleSubmit = async () => {
    if (!briefText.trim() && files.length === 0) {
      toast({
        title: "Brief required",
        description: "Add files or describe your campaign to get started.",
        variant: "destructive",
      });
      return;
    }
    await createProject(briefText, files, tier);
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
      // The run continues on the server, so navigating away from here does not
      // interrupt it — the chat view attaches to it on arrival.
      await startTurn({
        chatId: newChatId,
        message,
        mode: "brainstorm",
        files: files.length > 0 ? files : undefined,
        tier,
      });
      navigate(`/app/chat/${newChatId}`);
    } catch (error) {
      reportSendFailure(error, {
        toast,
        userEmail: user?.email,
        onOutOfCredits: () => setOutOfCredits(true),
      });
    } finally {
      setIsStartingBrainstorm(false);
    }
  };

  // Show loading screen when campaign creation started
  if (showLoadingScreen) {
    return <BriefAnalysisLoading steps={steps} chatId={buildingChatId ?? undefined} onOpenConversation={() => navigate(`/app/chat/${buildingChatId}`)} />;
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
              accept={BRIEF_FILE_ACCEPT}
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
                {BRIEF_TYPE_LABEL}
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

          {/* Text brief, shaped like the composer everywhere else in the app:
              one surface holding the text and the controls that act on it,
              rather than a bordered box with its options floating underneath.
              The upload panel above is deliberately left as it is. */}
          <div className="space-y-2 rounded-2xl border border-border bg-card/60 p-2 transition-colors focus-within:border-primary/50 focus-within:bg-card">
            <Textarea
              placeholder="Describe your campaign goals, ideas, target audience, deliverables, timeline, or any other relevant details..."
              value={briefText}
              onChange={(e) => {
                setBriefText(e.target.value);
                if (error) reset();
              }}
              className="min-h-[130px] w-full resize-none border-0 bg-transparent px-1 py-1.5 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
            />

            <div className="flex flex-wrap items-center gap-2">
              <TierPicker
                tier={tier}
                onChange={setTier}
                disabled={isSubmitting || showLoadingScreen || isStartingBrainstorm}
              />
              <div className="flex-1 min-w-[8px]" />
              {/* Two ways to begin, not two equal ones: a campaign build is the
                  page's purpose and the expensive one, so it leads and
                  brainstorming sits beside it as the lighter option. */}
              <Button
                onClick={handleStartBrainstorming}
                disabled={isSubmitting || showLoadingScreen || isStartingBrainstorm}
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 rounded-lg"
              >
                {isStartingBrainstorm ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Lightbulb className="h-3.5 w-3.5" />
                )}
                {isStartingBrainstorm ? "Opening…" : "Brainstorm"}
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || showLoadingScreen}
                size="sm"
                className="h-8 gap-1.5 rounded-lg"
              >
                {isSubmitting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5" />
                )}
                {isSubmitting ? "Processing…" : "Campaign"}
              </Button>
            </div>
          </div>

          <CampaignCostNote tier={tier} />

          {/* Progress */}
          {error && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}

          {outOfCredits && (
            <OutOfCredits
              compact
              onTopUp={() => navigate("/app/settings?tab=billing")}
            />
          )}

        </div>
      </div>
    </div>
  );
}
