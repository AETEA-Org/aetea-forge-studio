/**
 * Build-time render of the public marketing and legal pages (`scripts/prerender.mjs`).
 *
 * Renders the logged-out view: no session exists at build time, and the
 * AgreementBoundary is left out because it only ever gates a signed-in user.
 * The browser bundle replaces this markup on load, so it is a snapshot for
 * crawlers and the first paint, never the interactive page.
 */
import type { ReactNode } from "react";
import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router-dom/server";
import { QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { queryClient } from "@/services/queryClient";
import { SupportProvider } from "@/components/support/SupportContext";
import Landing from "./pages/Landing";
import Pricing from "./pages/Pricing";
import Advisory from "./pages/Advisory";
import Policy from "./pages/Policy";
import type { LegalDocument } from "@/services/legal";

export { renderHeadHtml } from "@/seo/head";
export { DEFAULT_PAGE, LEGAL_PAGES, MARKETING_PAGES, legalPageHead } from "@/seo/pages";
export { legalDocuments } from "@/services/legal";
export { LEGAL_SNAPSHOT_ID } from "./pages/Policy";
export {
  CREDIT_ACTIONS,
  CREDIT_RULES,
  PRICING_ADDONS,
  PRICING_PLANS,
} from "@/components/landing/pricing/pricingData";
export { ADVISORY_BOOKING_URL, ADVISORY_HERO } from "@/components/landing/advisory/advisoryData";

const PAGES = { "/": Landing, "/pricing": Pricing, "/advisory": Advisory } as const;

export function render(path: keyof typeof PAGES): string {
  const Page = PAGES[path];
  return renderAt(path, <Page />);
}

/** /privacy or /terms, with the document fetched at build time. */
export function renderLegal(path: string, document: LegalDocument): string {
  return renderAt(path, <Policy kind={document.kind} initialDocument={document} />);
}

function renderAt(path: string, page: ReactNode): string {
  return renderToString(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <StaticRouter location={path}>
            <SupportProvider>
              {page}
            </SupportProvider>
          </StaticRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>,
  );
}
