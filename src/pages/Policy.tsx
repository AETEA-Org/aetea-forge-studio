import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PolicyContent } from "@/components/legal/PolicyReview";
import { Footer } from "@/components/landing/Footer";
import { LegalDocument, legalDocuments } from "@/services/legal";

export default function Policy({ kind }: { kind: LegalDocument["kind"] }) {
  const [document, setDocument] = useState<LegalDocument | null>(null);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let cancelled = false;
    setDocument(null); setError("");
    legalDocuments().then((docs) => { if (!cancelled) setDocument(docs.find((doc) => doc.kind === kind) ?? null); })
      .catch((err) => { if (!cancelled) setError(err.message); });
    window.scrollTo(0, 0);
    return () => { cancelled = true; };
  }, [kind, retry]);
  return <div className="dark min-h-screen bg-background text-foreground grain">
    <header className="max-w-3xl mx-auto px-6 py-8"><Link to="/" className="text-sm text-muted-foreground hover:text-foreground">← Back to AETEA</Link></header>
    <main className="max-w-3xl mx-auto px-6 pb-20">
      {error ? <p role="alert">{error} <button className="underline" onClick={() => setRetry((n) => n + 1)}>Try again</button></p> : !document ? <p role="status">Loading document…</p> : <>
        <p className="uppercase tracking-widest text-xs text-primary mb-3">AETEA · Legal</p>
        <h1 className="text-3xl sm:text-4xl font-display font-bold mb-4">{document.title}</h1>
        <p className="text-sm text-muted-foreground mb-5">Version {document.version} · Effective {document.effective_date}</p>
        <p className="text-xs text-muted-foreground border border-border rounded-lg p-4 mb-10">Contact <a href="mailto:support@aetea.studio" className="underline">support@aetea.studio</a> with questions.</p>
        <PolicyContent document={document} />
      </>}
    </main><Footer />
  </div>;
}
