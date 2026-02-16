import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/app/ProtectedRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AppLayout } from "@/layouts/AppLayout";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import AppPage from "./pages/App";
import { CampaignShell } from "./layouts/CampaignShell";
import ChatOrCampaign from "./pages/ChatOrCampaign";
import TaskDetailPage from "./pages/TaskDetailPage";
import TaskReviewPage from "./pages/TaskReviewPage";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/auth" element={<Auth />} />
              
              {/* Protected App Routes */}
              <Route
                path="/app"
                element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<AppPage />} />
                <Route path="chat/:chatId" element={<CampaignShell />}>
                  <Route index element={<ChatOrCampaign />} />
                  <Route path="task/:taskId" element={<TaskDetailPage />} />
                  <Route path="task/:taskId/review" element={<TaskReviewPage />} />
                </Route>
                <Route path="settings" element={<Settings />} />
              </Route>
              
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
          <Analytics />
          <SpeedInsights />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
