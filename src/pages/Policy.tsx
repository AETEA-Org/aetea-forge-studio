import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { PolicyContent } from "@/components/legal/PolicyReview";
import { Footer } from "@/components/landing/Footer";
import { LegalDocument, legalDocuments } from "@/services/legal";
import { SupportLink } from "@/components/support/SupportLink";
import { legalPageHead } from "@/seo/pages";
import { usePageMetadata } from "@/seo/usePageMetadata";

/** Id of the JSON snapshot `scripts/prerender.mjs` writes into privacy.html and terms.html. */
export const LEGAL_SNAPSHOT_ID = "legal-snapshot";

/**
 * The document baked into the prerendered page, if this load is one. It is
 * only a first paint: the live document is still fetched and replaces it.
 */
function readSnapshot(kind: LegalDocument["kind"]): LegalDocument | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.document.getElementById(LEGAL_SNAPSHOT_ID)?.textContent;
    const snapshot = raw ? (JSON.parse(raw) as LegalDocument) : null;
    return snapshot?.kind === kind ? snapshot : null;
  } catch {
    return null;
  }
}

export default function Policy({ kind, initialDocument }: {
  kind: LegalDocument["kind"];
  /** Build-time render only (`src/entry-server.tsx`). */
  initialDocument?: LegalDocument;
}) {
  const [document, setDocument] = useState<LegalDocument | null>(() => initialDocument ?? readSnapshot(kind));
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let cancelled = false;
    setDocument((current) => (current?.kind === kind ? current : null)); setError("");
    legalDocuments().then((docs) => { if (!cancelled) setDocument(docs.find((doc) => doc.kind === kind) ?? null); })
      .catch((err) => { if (!cancelled) setError(err.message); });
    window.scrollTo(0, 0);
    return () => { cancelled = true; };
  }, [kind, retry]);
  // Between /privacy and /terms React keeps this component, so for one render
  // `document` can still be the other kind; never show or describe that one.
  const shown = document?.kind === kind ? document : null;
  usePageMetadata(useMemo(() => legalPageHead(kind, shown ?? undefined), [kind, shown]));
  return <div className="dark min-h-screen bg-background text-foreground grain">
    <header className="max-w-3xl mx-auto px-6 py-8"><Link to="/" className="text-sm text-muted-foreground hover:text-foreground">← Back to AETEA</Link></header>
    <main className="max-w-3xl mx-auto px-6 pb-20">
      {error ? <p role="alert">{error} <button className="underline" onClick={() => setRetry((n) => n + 1)}>Try again</button></p> : !shown ? <p role="status">Loading document…</p> : <>
        <p className="uppercase tracking-widest text-xs text-primary mb-3">AETEA · Legal</p>
        <h1 className="text-3xl sm:text-4xl font-display font-bold mb-4">{shown.title}</h1>
        <p className="text-sm text-muted-foreground mb-5">Version {shown.version} · Effective {shown.effective_date}</p>
        <p className="text-xs text-muted-foreground border border-border rounded-lg p-4 mb-10">Contact <SupportLink>support</SupportLink> with questions.</p>
        <PolicyContent document={shown} />
      </>}
    </main><Footer />
  </div>;
}
