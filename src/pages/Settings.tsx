import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, Palette, CreditCard, Plug, Bell, LogOut, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type SettingsTab = "profile" | "theme" | "billing" | "integrations" | "notifications";

export default function Settings() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");
  const [isSigningOut, setIsSigningOut] = useState(false);
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
      toast({
        title: "Signed out",
        description: "You've been successfully signed out.",
      });
      navigate("/");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSigningOut(false);
    }
  };

  const tabs = [
    { id: "profile" as const, label: "Profile", icon: User },
    { id: "theme" as const, label: "Display", icon: Palette },
    { id: "billing" as const, label: "Billing", icon: CreditCard, comingSoon: true },
    { id: "integrations" as const, label: "Integrations", icon: Plug, comingSoon: true },
    { id: "notifications" as const, label: "Notifications", icon: Bell, comingSoon: true },
  ];

  return (
    <div className="min-h-full p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="font-display text-2xl font-bold mb-8">Settings</h1>

        <div className="flex gap-8">
          {/* Sidebar */}
          <div className="w-48 shrink-0">
            <nav className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors",
                    activeTab === tab.id
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                  {tab.comingSoon && (
                    <span className="ml-auto text-[10px] bg-muted px-1.5 py-0.5 rounded">Soon</span>
                  )}
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1">
            <div className="glass rounded-xl p-6">
              {activeTab === "profile" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="font-medium mb-4">Profile</h2>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm text-muted-foreground">Email</label>
                        <p className="mt-1">{user?.email}</p>
                      </div>
                      {user?.user_metadata?.username && (
                        <div>
                          <label className="text-sm text-muted-foreground">Username</label>
                          <p className="mt-1">{user.user_metadata.username}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-6 border-t border-border">
                    <Button
                      variant="destructive"
                      onClick={handleSignOut}
                      disabled={isSigningOut}
                    >
                      {isSigningOut ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <LogOut className="h-4 w-4 mr-2" />
                      )}
                      Sign out
                    </Button>
                  </div>
                </div>
              )}

              {activeTab === "theme" && (
                <div>
                  <h2 className="font-medium mb-4">Display</h2>
                  <p className="text-sm text-muted-foreground mb-4">
                    Theme toggle coming soon. Currently using dark mode.
                  </p>
                </div>
              )}

              {(activeTab === "billing" || activeTab === "integrations" || activeTab === "notifications") && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    This feature is coming soon.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
