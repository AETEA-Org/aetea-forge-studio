import { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { PolicyReview } from "./PolicyReview";
import { acceptLegal, LegalAcceptance, LegalDocument, legalDocuments, legalStatus, LegalStatus } from "@/services/legal";
import { openPortal } from "@/services/billing";

export function AgreementBoundary({ children }: { children: ReactNode }) {
  const { user, loading, signOut } = useAuth();
  const userId = user?.id;
  const { pathname } = useLocation();
  const [result, setResult] = useState<{ userId: string; status: LegalStatus; documents: LegalDocument[] } | null>(null);
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);
  const [saving, setSaving] = useState(false);
  const [acceptance, setAcceptance] = useState<LegalAcceptance | null>(null);
  const [billingError, setBillingError] = useState("");
  const [openingBilling, setOpeningBilling] = useState(false);
  const generation = useRef(0);
  const contextGeneration = useRef(0);
  const invalidate = useCallback(() => { generation.current++; }, []);
  useEffect(() => { contextGeneration.current++; }, [userId, pathname]);
  const isProtected = pathname.startsWith("/app") || pathname === "/pricing";
  const check = useCallback(async () => {
    if (!userId) return;
    const requestGeneration = ++generation.current;
    setChecking(true);
    try {
      const status = await legalStatus();
      const documents = status.accepted ? [] : await legalDocuments();
      if (generation.current !== requestGeneration) return;
      setResult({ userId, status, documents }); setError("");
    } catch (err) {
      if (generation.current !== requestGeneration) return;
      setError(err instanceof Error ? err.message : "Could not load the policy review.");
    } finally { if (generation.current === requestGeneration) setChecking(false); }
  }, [userId]);
  useEffect(() => { invalidate(); setResult(null); setAcceptance(null); setError(""); }, [userId, invalidate]);
  useEffect(() => {
    if (!isProtected || !userId) return;
    void check();
    const focus = () => { if (document.visibilityState === "visible") void check(); };
    window.addEventListener("focus", focus);
    document.addEventListener("visibilitychange", focus);
    const required = () => { setResult(null); void check(); };
    window.addEventListener("aetea:legal-required", required);
    const timer = window.setInterval(focus, 60_000);
    return () => { invalidate(); window.removeEventListener("focus", focus); document.removeEventListener("visibilitychange", focus); window.removeEventListener("aetea:legal-required", required); window.clearInterval(timer); };
  }, [check, isProtected, pathname, userId, invalidate]);

  const documents = useMemo(() => result?.documents.filter((doc) => !result.status.required.find((required) => required.kind === doc.kind && required.version === doc.version && required.content_hash === doc.content_hash)?.accepted) ?? [], [result]);

  if (!isProtected || (!user && !loading)) return <>{children}</>;
  if (loading || (!result && checking) || (!error && (!result || result.userId !== userId))) return <div className="dark min-h-screen bg-background grid place-items-center"><Loader2 aria-label="Checking your agreement" className="animate-spin text-primary" /></div>;
  if (result?.userId === user?.id && result.status.accepted) return <>{children}</>;
  return <main className="dark min-h-screen bg-background text-foreground grain flex items-center justify-center p-5 sm:p-10">
    <div className="w-full max-w-xl rounded-2xl glass p-6 sm:p-9 space-y-6">
      <p className="text-xs tracking-widest text-primary uppercase">AETEA · Policy review</p>
      <div><h1 className="text-2xl font-display font-bold mb-3">Review before continuing</h1><p className="text-sm text-muted-foreground leading-6">Our current policies need your agreement. Review the documents below to continue to your account.</p></div>
      {error && <div role="alert" className="text-sm text-destructive">{error} <button type="button" className="underline" onClick={() => void check()}>Reload policies</button></div>}
      {documents.length > 0 && <PolicyReview documents={documents} updating onChange={setAcceptance} />}
      <Button className="w-full" disabled={!acceptance || saving || checking} onClick={async () => {
        if (!acceptance || !user) return;
        const savingContext = contextGeneration.current;
        setSaving(true); setError("");
        try {
          const status = await acceptLegal(acceptance);
          if (savingContext !== contextGeneration.current) return;
          invalidate(); setChecking(false);
          setResult({ userId: user.id, status, documents: [] });
        }
        catch (err) { if (savingContext === contextGeneration.current) { await check(); setError(err instanceof Error ? err.message : "Could not save your agreement."); } }
        finally { setSaving(false); }
      }}>{saving ? "Saving agreement…" : "Agree and continue"}</Button>
      <Button variant="outline" className="w-full" disabled={openingBilling} onClick={async () => {
        setOpeningBilling(true); setBillingError("");
        try { const url = await openPortal(); if (url) window.location.assign(url); else setBillingError("There is no subscription to manage. Contact support for other billing requests."); }
        catch (err) { setBillingError(err instanceof Error ? err.message : "Could not open billing. Please contact support."); }
        finally { setOpeningBilling(false); }
      }}>{openingBilling ? "Opening billing…" : "Manage billing / cancel subscription"}</Button>
      {billingError && <p role="status" className="text-xs text-muted-foreground">{billingError}</p>}
      <div className="flex justify-between text-xs text-muted-foreground"><button type="button" onClick={() => void signOut()} className="underline">Sign out</button><a className="underline" href="mailto:support@aetea.studio">Contact support / privacy requests</a></div>
      <p className="text-xs leading-5 text-muted-foreground">If you choose not to agree, you can sign out or contact us about your account, data access or deletion. You can always read the <a href="/terms" className="underline">Terms</a> and <a href="/privacy" className="underline">Privacy Policy</a>.</p>
    </div>
  </main>;
}
