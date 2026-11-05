/**
 * Shared rules for chat attachments and the new-project brief form.
 * Keep the extension order aligned with AETEA-AI/app/services/upload_policy.py.
 * The server still checks the bytes; this only stops a bad file before send.
 */

export const MAX_CHAT_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const DOCUMENT_EXTENSIONS = ["pdf", "doc", "docx", "ppt", "pptx"] as const;
const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "gif", "webp", "svg"] as const;
const TEXT_EXTENSIONS = ["txt", "md", "csv", "json", "yaml", "yml"] as const;

/** Documents and plain text. The new-project form does not take images. */
export const BRIEF_EXTENSIONS = [...DOCUMENT_EXTENSIONS, ...TEXT_EXTENSIONS];

export const ALLOWED_CHAT_EXTENSIONS = [...BRIEF_EXTENSIONS, ...IMAGE_EXTENSIONS];

export const BRIEF_FILE_ACCEPT = BRIEF_EXTENSIONS.map((ext) => `.${ext}`).join(",");

export const CHAT_FILE_ACCEPT = [
  ...ALLOWED_CHAT_EXTENSIONS.map((ext) => `.${ext}`),
  "image/*",
].join(",");

export const BRIEF_TYPE_LABEL =
  "PDF, Word, PowerPoint, or plain text (TXT, Markdown, CSV, JSON, YAML)";

export const CHAT_TYPE_LABEL =
  "PDF, Word, PowerPoint, images, or plain text (TXT, Markdown, CSV, JSON, YAML)";

export const CHAT_DROP_HINT =
  "PDF, Word, PowerPoint, images, and plain text · max 10MB each";

const GENERIC_MIME = new Set(["", "application/octet-stream"]);

/** Declared types that still belong to an extension. Mirrors the server. */
const MIME_BY_EXTENSION: Record<string, readonly string[]> = {
  pdf: ["application/pdf"],
  doc: ["application/msword"],
  docx: [
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/zip",
  ],
  ppt: ["application/vnd.ms-powerpoint"],
  pptx: [
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "application/zip",
  ],
  jpg: ["image/jpeg", "image/jpg", "image/pjpeg"],
  jpeg: ["image/jpeg", "image/jpg", "image/pjpeg"],
  png: ["image/png"],
  gif: ["image/gif"],
  webp: ["image/webp"],
  svg: ["image/svg+xml", "text/plain", "text/xml", "application/xml"],
  txt: ["text/plain"],
  md: ["text/markdown", "text/x-markdown", "text/plain"],
  csv: ["text/csv", "application/csv", "text/plain", "application/vnd.ms-excel"],
  json: ["application/json", "text/json", "text/plain"],
  yaml: ["text/yaml", "text/x-yaml", "application/yaml", "application/x-yaml", "text/plain"],
  yml: ["text/yaml", "text/x-yaml", "application/yaml", "application/x-yaml", "text/plain"],
};

function labelFor(allowedExtensions: readonly string[]): string {
  return allowedExtensions.includes("png") ? CHAT_TYPE_LABEL : BRIEF_TYPE_LABEL;
}

function bareMime(type: string): string {
  return type.split(";", 1)[0]?.trim().toLowerCase() ?? "";
}

export function validateChatFile(
  file: File,
  allowedExtensions: readonly string[] = ALLOWED_CHAT_EXTENSIONS,
): { valid: boolean; error?: string } {
  if (file.size > MAX_CHAT_FILE_SIZE) {
    return { valid: false, error: `${file.name} exceeds the 10MB limit.` };
  }

  const extension = file.name.split(".").pop()?.toLowerCase();
  if (!extension || !allowedExtensions.includes(extension)) {
    return {
      valid: false,
      error: `${file.name} is not a supported file type. Use ${labelFor(allowedExtensions)}.`,
    };
  }

  const declared = bareMime(file.type);
  const allowedMimes = MIME_BY_EXTENSION[extension] ?? [];
  if (!GENERIC_MIME.has(declared) && !allowedMimes.includes(declared)) {
    return {
      valid: false,
      error: `${file.name} was sent as ${declared}, which does not match its extension.`,
    };
  }

  return { valid: true };
}

export function partitionChatFiles(
  files: File[],
  allowedExtensions: readonly string[] = ALLOWED_CHAT_EXTENSIONS,
): {
  accepted: File[];
  errors: string[];
} {
  const accepted: File[] = [];
  const errors: string[] = [];
  files.forEach((file) => {
    const result = validateChatFile(file, allowedExtensions);
    if (result.valid) {
      accepted.push(file);
    } else if (result.error) {
      errors.push(result.error);
    }
  });
  return { accepted, errors };
}

export function summarizeFileErrors(errors: string[]): string {
  return errors.slice(0, 3).join(" · ") + (errors.length > 3 ? "…" : "");
}
