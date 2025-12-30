import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import logo from "@/assets/aetea-logo-blue-on-black.png";

export default function Auth() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="p-6">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>
      </header>

      {/* Auth Card */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <img src={logo} alt="AETEA" className="h-10 w-auto mx-auto mb-6" />
            <h1 className="text-2xl font-bold mb-2">Welcome to AETEA</h1>
            <p className="text-muted-foreground">
              Sign in to start creating
            </p>
          </div>

          <div className="bg-card rounded-2xl border border-border p-8">
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                Authentication will be enabled once Supabase is connected.
              </p>
              <p className="text-sm text-muted-foreground">
                Please connect your Supabase project to enable sign in with Google and email.
              </p>
            </div>
          </div>

          <p className="text-center text-xs text-muted-foreground mt-6">
            By signing in, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}
