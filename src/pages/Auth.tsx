import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import logo from "@/assets/aetea-auth-wordmark.png";
import { z } from "zod";

import { PolicyDialog, PolicyReview } from "@/components/legal/PolicyReview";
import { GoogleSignIn } from "@/components/legal/GoogleSignIn";
import { LegalAcceptance, LegalDocument, legalDocuments } from "@/services/legal";
import { RegistrationError } from "@/services/registration";

const emailSchema = z.string().email("Please enter a valid email address");
const passwordSchema = z.string().min(6, "Password must be at least 6 characters");

export default function Auth() {
  const [documents, setDocuments] = useState<LegalDocument[]>([]);
  const [policyError, setPolicyError] = useState("");
  const [acceptance, setAcceptance] = useState<LegalAcceptance | null>(null);
  const [pendingGoogle, setPendingGoogle] = useState<{ token: string; challenge: string } | null>(null);
  const [googleAttempt, setGoogleAttempt] = useState(0);
  const [openPolicy, setOpenPolicy] = useState<LegalDocument["kind"] | null>(null);
  const handlePolicyOpen = useCallback(() => setOpenPolicy(null), []);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  
  const { user, loading, signIn, signUp, signInWithGoogle } = useAuth();
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

  const loadPolicies = async () => {
    try { setDocuments(await legalDocuments()); setPolicyError(""); }
    catch (error) { setPolicyError(error instanceof Error ? error.message : "Could not load policies."); }
  };
  useEffect(() => { void loadPolicies(); }, []);

  const handleGoogle = async (token: string, challenge: string) => {
    setIsSubmitting(true);
    try {
      await signInWithGoogle(token, challenge, !isLogin && acceptance ? acceptance : undefined);
      setPendingGoogle(null);
    } catch (error) {
      if (error instanceof RegistrationError && error.code === "LEGAL_ACCEPTANCE_REQUIRED") {
        setPendingGoogle({ token, challenge }); setIsLogin(false);
        toast({ title: "Review our policies", description: "Review both documents and agree to create your Google account." });
      } else {
        setPendingGoogle(null);
        setGoogleAttempt((attempt) => attempt + 1);
        toast({ title: "Google sign-in failed", description: error instanceof Error ? error.message : "Please try again.", variant: "destructive" });
        void loadPolicies();
      }
    } finally { setIsSubmitting(false); }
  };

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};
    
    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      newErrors.email = emailResult.error.errors[0].message;
    }
    
    const passwordResult = passwordSchema.safeParse(password);
    if (!passwordResult.success) {
      newErrors.password = passwordResult.error.errors[0].message;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isLogin && !acceptance) return;
    if (pendingGoogle) { await handleGoogle(pendingGoogle.token, pendingGoogle.challenge); return; }
    if (!validateForm()) return;
    
    setIsSubmitting(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message.includes("Invalid login credentials")) {
            toast({
              title: "Invalid credentials",
              description: "Please check your email and password.",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Sign in failed",
              description: error.message,
              variant: "destructive",
            });
          }
        } else {
          toast({
            title: "Welcome back!",
            description: "You've successfully signed in.",
          });
        }
      } else {
        const { error } = await signUp(email, password, username, acceptance!);
        if (error) {
          void loadPolicies();
          if (error.message.includes("already registered")) {
            toast({
              title: "Account exists",
              description: "This email is already registered. Try signing in instead.",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Sign up failed",
              description: error.message,
              variant: "destructive",
            });
          }
        } else {
          toast({
            title: "Check your email",
            description: "We've sent you a confirmation link to complete your registration.",
          });
        }
      }
    } finally {
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
        <div className="w-full max-w-md">
          <div className="text-center mb-10">
            <img src={logo} alt="AETEA" className="mx-auto mb-2 h-auto w-40 max-w-full" />
            <h1 className="font-display text-2xl font-bold mb-2">
              {isLogin ? "Welcome back" : "Create account"}
            </h1>
            <p className="text-muted-foreground text-sm">
              {isLogin ? "Sign in to continue" : "Sign up to get started"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-8 rounded-2xl glass space-y-5">
            <GoogleSignIn attempt={googleAttempt} onCredential={handleGoogle} disabled={isSubmitting || (!isLogin && !acceptance)} />
            {pendingGoogle && <p className="text-sm text-primary">Your Google identity is ready. Review and agree below to finish creating your account.</p>}

            {!pendingGoogle && <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border/50" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-transparent px-2 text-muted-foreground">Or continue with email</span>
              </div>
            </div>}

            {!isLogin && !pendingGoogle && (
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Choose a username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="bg-background/50 border-border/50"
                />
              </div>
            )}
            
            {!pendingGoogle && <><div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors({ ...errors, email: undefined });
                }}
                className="bg-background/50 border-border/50"
              />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors({ ...errors, password: undefined });
                }}
                className="bg-background/50 border-border/50"
              />
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password}</p>
              )}
            </div>
            </>}

            {!isLogin && <div>
              {policyError && <p role="alert" className="text-xs text-destructive mb-3">{policyError} <button type="button" className="underline" onClick={() => void loadPolicies()}>Retry</button></p>}
              {documents.length > 0 ? <PolicyReview documents={documents} onChange={setAcceptance} openKind={openPolicy} onOpenHandled={handlePolicyOpen} /> : !policyError && <p role="status" className="text-xs text-muted-foreground">Loading policies…</p>}
            </div>}

            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting || (!isLogin && !acceptance)}
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isLogin ? (
                "Sign in"
              ) : (
                "Create account"
              )}
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setErrors({}); setPendingGoogle(null); setAcceptance(null);
                }}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
              </button>
            </div>
          </form>

          <p className="text-center text-xs text-muted-foreground/50 mt-8">
            <button type="button" className="underline disabled:opacity-50" disabled={!documents.length} onClick={() => setOpenPolicy("terms")}>Terms & Conditions</button> · <button type="button" className="underline disabled:opacity-50" disabled={!documents.length} onClick={() => setOpenPolicy("privacy")}>Privacy Policy</button>
            <span className="block mt-2">Questions? <a href="mailto:support@aetea.studio" className="underline">Contact support</a></span>
          </p>
          {isLogin && openPolicy && documents.find((doc) => doc.kind === openPolicy) && <PolicyDialog document={documents.find((doc) => doc.kind === openPolicy)!} onClose={() => setOpenPolicy(null)} onReview={() => setOpenPolicy(null)} />}
          {isLogin && policyError && <p role="alert" className="text-xs text-muted-foreground text-center mt-3">{policyError} <button type="button" className="underline" onClick={() => void loadPolicies()}>Retry policies</button></p>}
        </div>
      </div>
    </div>
  );
}
