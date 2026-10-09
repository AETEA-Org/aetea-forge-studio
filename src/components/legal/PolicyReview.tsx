import { useEffect, useRef, useState } from "react";
import { Check, ArrowUpRight } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { documentKey, LegalAcceptance, LegalDocument } from "@/services/legal";

export function PolicyContent({ document }: { document: LegalDocument }) {
  return <article className="space-y-8 text-sm leading-7">
    {document.sections.map((section, index) => <section key={index}>
      <h2 className="font-display text-lg font-semibold mb-3">{index + 1}. {section.heading}</h2>
      {section.paragraphs.map((paragraph, i) => <p key={i} className="text-muted-foreground mb-3 whitespace-pre-line">{paragraph}</p>)}
    </section>)}
  </article>;
}

export function PolicyDialog({ document, onClose, onReview }: {
  document: LegalDocument; onClose: () => void; onReview: () => void;
}) {
  const body = useRef<HTMLDivElement>(null);
  const [atEnd, setAtEnd] = useState(false);
  useEffect(() => {
    const element = body.current;
    if (!element) return;
    const check = () => { if (element.scrollHeight - element.scrollTop - element.clientHeight <= 8) setAtEnd(true); };
    check();
    const observer = new ResizeObserver(check);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
    <DialogContent className="dark flex flex-col gap-0 max-w-3xl w-[calc(100%-2rem)] h-[85dvh] p-0 overflow-hidden rounded-2xl">
      <div className="p-6 pr-12 border-b border-border">
        <DialogTitle className="font-display text-xl">{document.title}</DialogTitle>
        <DialogDescription className="mt-2">Version {document.version} · Effective {document.effective_date}</DialogDescription>
      </div>
      <div ref={body} tabIndex={0} aria-label={`${document.title} document`} className="overflow-y-auto min-h-0 flex-1 p-6 focus-visible:outline focus-visible:outline-primary"
        onScroll={(event) => { const el = event.currentTarget; if (el.scrollHeight - el.scrollTop - el.clientHeight <= 8) setAtEnd(true); }}>
        <PolicyContent document={document} />
        <p className="mt-8 border-t border-border pt-5 text-sm text-muted-foreground">End of document. Questions? Contact support@aetea.studio.</p>
      </div>
      <div className="border-t border-border p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-3">
        <p aria-live="polite" className="text-xs text-muted-foreground flex-1">{atEnd ? "Confirm your review when you are ready." : "Scroll to the end to enable review confirmation."}</p>
        <Button type="button" disabled={!atEnd} onClick={onReview}>I have reviewed this document</Button>
      </div>
    </DialogContent>
  </Dialog>;
}

export function PolicyReview({ documents, onChange, updating = false, openKind, onOpenHandled }: {
  documents: LegalDocument[]; onChange: (acceptance: LegalAcceptance | null) => void; updating?: boolean;
  openKind?: LegalDocument["kind"] | null; onOpenHandled?: () => void;
}) {
  const [active, setActive] = useState<LegalDocument | null>(null);
  const [reviewed, setReviewed] = useState<Set<string>>(new Set());
  const [agreed, setAgreed] = useState(false);
  useEffect(() => {
    if (!openKind) return;
    const document = documents.find((doc) => doc.kind === openKind);
    if (document) { setActive(document); onOpenHandled?.(); }
  }, [openKind, documents, onOpenHandled]);
  const allReviewed = documents.length > 0 && documents.every((doc) => reviewed.has(documentKey(doc)));
  useEffect(() => {
    onChange(allReviewed && agreed ? {
      documents: documents.map((doc) => ({ kind: doc.kind, version: doc.version, content_hash: doc.content_hash, reviewed: true })),
      agreed: true, eligible: true,
    } : null);
  }, [allReviewed, agreed, documents, onChange]);
  return <div className="space-y-4">
    <p className="text-xs text-muted-foreground">Open and review {documents.length === 1 ? "the updated document" : "each document"}, then confirm your agreement.</p>
    <div className="space-y-2">{documents.map((doc) => <button key={documentKey(doc)} type="button"
      onClick={() => setActive(doc)} className="flex w-full items-center justify-between gap-3 rounded-lg border border-border p-3 text-left hover:bg-muted/40 focus-visible:outline focus-visible:outline-primary">
      <span><span className="block text-sm font-medium">{doc.title}</span><span className="block text-xs text-muted-foreground mt-1">{updating ? doc.change_summary.join(" ") : `Version ${doc.version}`}</span></span>
      {reviewed.has(documentKey(doc)) ? <Check aria-label="Reviewed" className="h-4 w-4 shrink-0 text-primary" /> : <ArrowUpRight className="h-4 w-4 shrink-0" />}
    </button>)}</div>
    {documents.some((doc) => doc.kind === "privacy") && <p className="text-xs leading-5 text-muted-foreground">We store your account and workspace information to provide AETEA. Relevant prompts and uploads go to external AI, search and hosting services and may be processed outside Canada. Avoid submitting highly sensitive information. See the Privacy Policy for providers, retention and your choices.</p>}
    <label className={`flex gap-3 text-xs leading-5 ${allReviewed ? "cursor-pointer" : "text-muted-foreground"}`}>
      <input type="checkbox" className="mt-1 accent-[hsl(var(--primary))]" disabled={!allReviewed} checked={agreed && allReviewed} onChange={(event) => setAgreed(event.target.checked)} />
      <span>I am at least 18 and have legal capacity to enter this agreement. {updating ? "I agree to the updated documents shown above, including any necessary processing described in the Privacy Policy." : "I agree to the Terms & Conditions and consent to the necessary processing described in the Privacy Policy."}</span>
    </label>
    {active && <PolicyDialog key={documentKey(active)} document={active} onClose={() => setActive(null)} onReview={() => {
      setReviewed((current) => new Set([...current, documentKey(active)])); setActive(null); setAgreed(false);
    }} />}
  </div>;
}
