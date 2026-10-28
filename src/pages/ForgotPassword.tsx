import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Loader2, MailCheck } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { SupportLink } from "@/components/support/SupportLink";

const emailSchema = z.string().email("Please enter a valid email address");

export default function ForgotPassword() {
  const { requestPasswordReset } = useAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = emailSchema.safeParse(email);
    if (!result.success) {
      setError(result.error.errors[0].message);
      return;
    }
    setError("");
    setIsSubmitting(true);
    try {
      await requestPasswordReset(email);
    } catch {
      // Deliberately swallowed. Telling someone that *this* address failed is
      // how a sign-in form becomes a way to find out who has an account. The
      // screen says the same thing either way, and a genuine outage shows up
      // in our logs rather than in a stranger's browser.
    } finally {
      setIsSubmitting(false);
      setSent(true);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col dark grain">
      <div className="fixed top-1/3 left-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[150px] animate-glow-pulse pointer-events-none" />

      <header className="p-6 relative z-10">
        <Link to="/auth" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to sign in
        </Link>
      </header>

      <div className="flex-1 flex items-center justify-center p-6 relative z-10">
        <div className="w-full max-w-md">
          <div className="text-center mb-10">
            <h1 className="font-display text-2xl font-bold mb-2">Reset your password</h1>
            <p className="text-muted-foreground text-sm">
              We'll email you a link to choose a new one.
            </p>
          </div>

          {sent ? (
            <div className="p-8 rounded-2xl glass text-center space-y-4" role="status">
              <MailCheck className="h-8 w-8 mx-auto text-primary" aria-hidden="true" />
              <p className="text-sm">
                If that address has an AETEA account, a reset link is on its way.
                It is good for one hour.
              </p>
              <p className="text-xs text-muted-foreground">
                Nothing in your inbox? Check spam, then{" "}
                <button
                  type="button"
                  className="underline hover:text-foreground transition-colors"
                  onClick={() => setSent(false)}
                >
                  try a different address
                </button>
                .
              </p>
              <Button asChild variant="secondary" className="w-full">
                <Link to="/auth">Back to sign in</Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-8 rounded-2xl glass space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); if (error) setError(""); }}
                  className="bg-background/50 border-border/50"
                />
                {error && <p className="text-xs text-destructive">{error}</p>}
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send reset link"}
              </Button>
            </form>
          )}

          <p className="text-center text-xs text-muted-foreground/50 mt-8">
            Questions? <SupportLink>Contact support</SupportLink>
          </p>
        </div>
      </div>
    </div>
  );
}
