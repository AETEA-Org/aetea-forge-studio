import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import logo from "@/assets/aetea-logo-white.png";

export default function Auth() {
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
            <img src={logo} alt="AETEA" className="h-8 w-auto mx-auto mb-8" />
            <h1 className="font-display text-2xl font-bold mb-2">Welcome</h1>
            <p className="text-muted-foreground text-sm">
              Sign in to start creating
            </p>
          </div>

          <div className="p-8 rounded-2xl glass">
            <div className="text-center py-8">
              <p className="text-muted-foreground text-sm mb-4">
                Authentication will be enabled once Supabase is connected.
              </p>
              <p className="text-xs text-muted-foreground/70">
                Connect your Supabase project to enable Google and email sign-in.
              </p>
            </div>
          </div>

          <p className="text-center text-xs text-muted-foreground/50 mt-8">
            By signing in, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}
