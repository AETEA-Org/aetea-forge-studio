import { useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { ImagePlus, Loader2, MailCheck, X } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { sendSupportRequest } from "@/services/support";
import {
  MAX_SUPPORT_FILES,
  SUPPORT_DROP_HINT,
  SUPPORT_FILE_ACCEPT,
  SUPPORT_MESSAGE_MAX,
  SUPPORT_MESSAGE_MIN,
  partitionSupportFiles,
  summarizeSupportFileErrors,
} from "@/lib/supportFileValidation";
import { cn } from "@/lib/utils";

const emailSchema = z.string().email("Please enter a valid email address");

export function SupportForm({ onDone }: { onDone: () => void }) {
  const { user } = useAuth();
  const location = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [email, setEmail] = useState(user?.email ?? "");
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState("");
  const [errors, setErrors] = useState<{ email?: string; message?: string }>({});
  const [sendError, setSendError] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);

  const take = (incoming: File[]) => {
    const { accepted, errors: refused } = partitionSupportFiles(incoming, files);
    setFileError(refused.length ? summarizeSupportFileErrors(refused) : "");
    if (accepted.length) setFiles((current) => [...current, ...accepted]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: { email?: string; message?: string } = {};
    const emailResult = emailSchema.safeParse(email.trim());
    if (!emailResult.success) next.email = emailResult.error.errors[0].message;
    const trimmed = message.trim();
    if (trimmed.length < SUPPORT_MESSAGE_MIN) {
      next.message = `A little more detail helps — at least ${SUPPORT_MESSAGE_MIN} characters.`;
    } else if (trimmed.length > SUPPORT_MESSAGE_MAX) {
      next.message = `That is longer than ${SUPPORT_MESSAGE_MAX} characters.`;
    }
    setErrors(next);
    if (Object.keys(next).length) return;

    setSendError("");
    setIsSending(true);
    try {
      await sendSupportRequest({
        email: email.trim(),
        message: trimmed,
        page: `${location.pathname}${location.search}`,
        files,
      });
      setSent(true);
    } catch (error) {
      // The typed message stays on screen. A toast would take it away with it,
      // and the one thing worse than a failed send is losing what was written.
      setSendError(
        error instanceof Error
          ? error.message
          : "We could not send that just now. Please try again."
      );
    } finally {
      setIsSending(false);
    }
  };

  if (sent) {
    return (
      <div className="text-center py-4 space-y-4" role="status">
        <MailCheck className="h-9 w-9 mx-auto text-primary" aria-hidden="true" />
        <div>
          <p className="font-display text-base font-semibold">Thanks — that reached us</p>
          <p className="text-sm text-muted-foreground mt-1">
            We have it{files.length > 0 ? ", with your screenshots" : ""}. You will get a reply at{" "}
            <span className="text-foreground">{email.trim()}</span>.
          </p>
        </div>
        <Button variant="secondary" className="w-full" onClick={onDone}>Close</Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="support-email">Your email</Label>
        <Input
          id="support-email"
          type="email"
          autoComplete="email"
          placeholder="you@company.com"
          value={email}
          onChange={(e) => { setEmail(e.target.value); if (errors.email) setErrors({ ...errors, email: undefined }); }}
          disabled={isSending}
        />
        {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="support-message">What's happening?</Label>
        <Textarea
          id="support-message"
          rows={5}
          placeholder="What you expected, what happened instead, and where."
          value={message}
          onChange={(e) => { setMessage(e.target.value); if (errors.message) setErrors({ ...errors, message: undefined }); }}
          disabled={isSending}
          className="max-h-56"
        />
        <p className="text-xs text-muted-foreground">
          {message.length > SUPPORT_MESSAGE_MAX - 500 && (
            <span className="float-right tabular-nums">{message.length} / {SUPPORT_MESSAGE_MAX}</span>
          )}
          The more specific, the faster we can fix it.
        </p>
        {errors.message && <p className="text-xs text-destructive">{errors.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="support-files">Add screenshots</Label>
        <input
          ref={fileInputRef}
          id="support-files"
          type="file"
          accept={SUPPORT_FILE_ACCEPT}
          multiple
          className="sr-only"
          onChange={(e) => { if (e.target.files) take(Array.from(e.target.files)); e.target.value = ""; }}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isSending || files.length >= MAX_SUPPORT_FILES}
          className={cn(
            "w-full rounded-lg border border-dashed border-border px-3 py-3 text-center text-xs",
            "text-muted-foreground transition-colors hover:border-primary/60 hover:text-foreground",
            "disabled:opacity-50 disabled:hover:border-border disabled:hover:text-muted-foreground"
          )}
        >
          <ImagePlus className="h-4 w-4 mx-auto mb-1" aria-hidden="true" />
          {files.length >= MAX_SUPPORT_FILES ? "That's the maximum" : "Choose images"}
          <span className="block mt-0.5">{SUPPORT_DROP_HINT}</span>
        </button>

        {files.length > 0 && (
          <ul className="flex flex-wrap gap-2 pt-1">
            {files.map((file, index) => (
              <li
                key={`${file.name}-${index}`}
                className="flex items-center gap-1.5 rounded-md border border-border bg-muted/40 px-2 py-1 text-xs"
              >
                <span className="max-w-[10rem] truncate">{file.name}</span>
                <button
                  type="button"
                  aria-label={`Remove ${file.name}`}
                  onClick={() => setFiles((current) => current.filter((_, i) => i !== index))}
                  disabled={isSending}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              </li>
            ))}
          </ul>
        )}
        {fileError && <p className="text-xs text-destructive">{fileError}</p>}
      </div>

      {sendError && (
        <p role="alert" className="rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-xs text-destructive-foreground">
          {sendError}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={isSending}>
        {isSending ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Sending…</> : "Send support request"}
      </Button>

      {/* Name what is actually sent. The server attaches the page, the IP and
          the browser for every caller, signed in or not — the old wording
          mentioned the page only when signed in and left out the rest. */}
      <p className="text-[11px] leading-relaxed text-muted-foreground">
        We use your email only to reply to this request. We also send the page you
        are on, your browser and your IP address, so we can see where this happened
        {user ? ", along with your account" : ""}.
      </p>
    </form>
  );
}
