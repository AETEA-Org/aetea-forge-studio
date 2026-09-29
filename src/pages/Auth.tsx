import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Loader2, Chrome } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import logo from "@/assets/aetea-auth-wordmark.png";

// Google is the only identity provider. Email/password is disabled on every
// Supabase project (`external_email_enabled: false`), so the fields this screen
// used to render could not succeed — they validated, submitted, and returned an
// error. There is also no sign-in/sign-up distinction to offer: Google either
// has an account here or creates one.
export default function Auth() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { user, loading, signInWithGoogle } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Redirect if already logged in.
  //
  // `?next=` sends them back where they came from — someone who pressed a plan
  // on the pricing page signs in and lands back on that page, where their
  // choice is still waiting. Only same-site paths are honoured: taking a full
  // URL here would turn sign-in into an open redirect.
  useEffect(() => {
    if (user && !loading) {
      const next = searchParams.get("next");
      const safe =
        next &&
        next.startsWith("/") &&
        !next.startsWith("//") &&
        // Some browsers normalise `/\host` to protocol-relative.
        !next.startsWith("/\\");
      navigate(safe ? next : "/app");
    }
  }, [user, loading, navigate, searchParams]);

  // Stays true on success: the browser is leaving for Google, and a button that
  // springs back to its resting state first reads as a failed click.
  const handleGoogle = async () => {
    setIsSubmitting(true);
    const { error } = await signInWithGoogle(searchParams.get("next") ?? undefined);
    if (error) {
      toast({
        title: "Google sign-in failed",
        description: error.message,
        variant: "destructive",
      });
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center dark grain">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col dark grain">
      {/* Gradient orbs */}
      <div className="fixed top-1/3 left-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[150px] animate-glow-pulse pointer-events-none" />

      {/* Header */}
      <header className="p-6 relative z-10">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
      </header>

      {/* Auth Card */}
      <div className="flex-1 flex items-center justify-center p-6 relative z-10">
        <div className="w-full max-w-sm">
          <div className="text-center mb-10">
            <img src={logo} alt="AETEA" className="mx-auto mb-2 h-auto w-40 max-w-full" />
            <h1 className="font-display text-2xl font-bold mb-2">Welcome</h1>
            <p className="text-muted-foreground text-sm">Sign in to continue</p>
          </div>

          <div className="p-8 rounded-2xl glass">
            <Button
              type="button"
              variant="outline"
              className="w-full bg-background/50 border-border/50 hover:bg-background/80"
              disabled={isSubmitting}
              onClick={handleGoogle}
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Chrome className="h-4 w-4 mr-2" />
                  Continue with Google
                </>
              )}
            </Button>
          </div>

          <p className="text-center text-xs text-muted-foreground/50 mt-8">
            By signing in, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}
