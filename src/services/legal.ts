import { API_BASE_URL } from "./config";
import { backendHeaders } from "./authHeaders";
import { readErrorMessage } from "./errorDetail";

export interface LegalDocument {
  kind: "terms" | "privacy";
  version: string;
  content_hash: string;
  title: string;
  effective_date: string;
  change_summary: string[];
  status: string;
  sections: { heading: string; paragraphs: string[] }[];
}
export interface LegalStatus {
  accepted: boolean;
  required: { kind: LegalDocument["kind"]; version: string; content_hash: string; accepted: boolean }[];
}
export interface LegalAcceptance {
  documents: { kind: LegalDocument["kind"]; version: string; content_hash: string; reviewed: true }[];
  agreed: true;
  eligible: true;
}
export const documentKey = (doc: Pick<LegalDocument, "kind" | "version" | "content_hash">) =>
  `${doc.kind}:${doc.version}:${doc.content_hash}`;

export async function legalDocuments(): Promise<LegalDocument[]> {
  const response = await fetch(`${API_BASE_URL}/legal/documents`);
  if (!response.ok) throw new Error(await readErrorMessage(response, "Could not load the policies. Please try again."));
  const data = await response.json();
  if (data.documents?.length !== 2) throw new Error("The policies are temporarily unavailable. Please try again.");
  return data.documents;
}
export async function legalStatus(): Promise<LegalStatus> {
  const response = await fetch(`${API_BASE_URL}/legal/status`, { headers: await backendHeaders() });
  if (!response.ok) throw new Error(await readErrorMessage(response, "Could not check your policy agreement. Please try again."));
  return response.json();
}
export async function acceptLegal(body: LegalAcceptance): Promise<LegalStatus> {
  const response = await fetch(`${API_BASE_URL}/legal/accept`, {
    method: "POST", headers: await backendHeaders("application/json"), body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(await readErrorMessage(response, "Could not save your agreement. Please try again."));
  return response.json();
}
