import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const passwordSchema = z.string().min(6, "Password must be at least 6 characters");

// Three states, because the interesting one is the third. A reset link works
// once and lasts an hour, so "expired" is not an edge case — it is what people
// hit when they open the email the next morning.
type LinkState = "checking" | "ready" | "expired";

export default function ResetPassword() {
  const { updatePassword } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [linkState, setLinkState] = useState<LinkState>("checking");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Supabase puts an expired or reused link's failure in the URL fragment
    // rather than raising, so that is the first thing to read.
    const fragment = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    if (fragment.get("error")) {
      setLinkState("expired");
      return;
    }

    // The client parses the recovery token out of the fragment on load and
    // emits PASSWORD_RECOVERY. Subscribing first avoids the race where it has
    // already finished before this effect runs.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setLinkState("ready");
    });

    void supabase.auth.getSession().then(({ data }) => {
      setLinkState((current) =>
        current === "checking" ? (data.session ? "ready" : "expired") : current);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: { password?: string; confirm?: string } = {};
    const result = passwordSchema.safeParse(password);
    if (!result.success) next.password = result.error.errors[0].message;
    if (password !== confirm) next.confirm = "Both passwords must match";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setIsSubmitting(true);
    try {
      await updatePassword(password);
      toast({
        title: "Password changed",
        description: "You're signed in with your new password.",
      });
      navigate("/app");
    } catch (error) {
      toast({
        title: "Could not change your password",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const shell = (children: React.ReactNode) => (
    <div className="min-h-screen bg-background flex flex-col dark grain">
      <div className="fixed top-1/3 left-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[150px] animate-glow-pulse pointer-events-none" />
      <header className="p-6 relative z-10">
        <Link to="/auth" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to sign in
        </Link>
      </header>
      <div className="flex-1 flex items-center justify-center p-6 relative z-10">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );

  if (linkState === "checking") {
    return shell(
      <div className="flex justify-center" role="status" aria-label="Checking your link">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (linkState === "expired") {
    return shell(
      <>
        <div className="text-center mb-10">
          <h1 className="font-display text-2xl font-bold mb-2">That link has expired</h1>
          <p className="text-muted-foreground text-sm">
            Reset links last an hour and work once.
          </p>
        </div>
        <div className="p-8 rounded-2xl glass space-y-4">
          <p className="text-sm text-muted-foreground">
            Ask for a fresh one and it will be in your inbox in a moment.
          </p>
          <Button asChild className="w-full"><Link to="/auth/forgot">Send a new link</Link></Button>
          <Button asChild variant="secondary" className="w-full"><Link to="/auth">Back to sign in</Link></Button>
        </div>
      </>
    );
  }

  return shell(
    <>
      <div className="text-center mb-10">
        <h1 className="font-display text-2xl font-bold mb-2">Choose a new password</h1>
        <p className="text-muted-foreground text-sm">You'll be signed in once it is saved.</p>
      </div>
      <form onSubmit={handleSubmit} className="p-8 rounded-2xl glass space-y-5">
        <div className="space-y-2">
          <Label htmlFor="password">New password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => { setPassword(e.target.value); if (errors.password) setErrors({ ...errors, password: undefined }); }}
            className="bg-background/50 border-border/50"
          />
          {errors.password
            ? <p className="text-xs text-destructive">{errors.password}</p>
            : <p className="text-xs text-muted-foreground">At least 6 characters. Longer is better.</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirm">Confirm new password</Label>
          <Input
            id="confirm"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            value={confirm}
            onChange={(e) => { setConfirm(e.target.value); if (errors.confirm) setErrors({ ...errors, confirm: undefined }); }}
            className="bg-background/50 border-border/50"
          />
          {errors.confirm && <p className="text-xs text-destructive">{errors.confirm}</p>}
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save and sign in"}
        </Button>
      </form>
    </>
  );
}
