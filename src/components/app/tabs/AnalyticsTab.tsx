import { BarChart3 } from "lucide-react";

export function AnalyticsTab() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
        <BarChart3 className="h-8 w-8 text-primary" />
      </div>
      <h2 className="font-semibold text-lg mb-2">Analytics Coming Soon</h2>
      <p className="text-muted-foreground text-sm max-w-md">
        Track campaign performance, measure KPIs, and get actionable insights to optimize your strategy.
      </p>
    </div>
  );
}
