/**
 * Shared rules for support-form screenshots.
 * Keep aligned with AETEA-AI/app/router/support.py, which checks the bytes.
 * This only stops an obviously wrong file before it is uploaded.
 *
 * Images only, and `svg` is excluded although `chatFileValidation` allows it:
 * an SVG is a script document, and these bytes are opened in a mail client
 * rather than stored for the agent to read.
 */

export const MAX_SUPPORT_FILE_SIZE = 5 * 1024 * 1024;
export const MAX_SUPPORT_TOTAL_SIZE = 12 * 1024 * 1024;
export const MAX_SUPPORT_FILES = 4;

export const SUPPORT_EXTENSIONS = ["png", "jpg", "jpeg", "webp", "gif"] as const;

export const SUPPORT_FILE_ACCEPT = SUPPORT_EXTENSIONS.map((ext) => `.${ext}`).join(",");

export const SUPPORT_DROP_HINT = "PNG, JPG, WEBP or GIF · up to 4 files · 5MB each";

export const SUPPORT_MESSAGE_MIN = 20;
export const SUPPORT_MESSAGE_MAX = 4000;

const extensionOf = (name: string) =>
  name.includes(".") ? name.split(".").pop()!.toLowerCase() : "";

export type SupportFileError = { file: string; reason: string };

/**
 * Split a selection into what may be sent and what may not, with a reason per
 * refusal. Accepting the good ones and naming the bad ones beats refusing the
 * whole drop because one file was a PDF.
 */
export function partitionSupportFiles(
  incoming: File[],
  already: File[] = []
): { accepted: File[]; errors: SupportFileError[] } {
  const accepted: File[] = [];
  const errors: SupportFileError[] = [];
  let count = already.length;
  let total = already.reduce((sum, file) => sum + file.size, 0);

  for (const file of incoming) {
    const extension = extensionOf(file.name);
    if (!SUPPORT_EXTENSIONS.includes(extension as (typeof SUPPORT_EXTENSIONS)[number])) {
      errors.push({ file: file.name, reason: "is not an image" });
      continue;
    }
    if (file.size > MAX_SUPPORT_FILE_SIZE) {
      errors.push({ file: file.name, reason: "is larger than 5MB" });
      continue;
    }
    if (count >= MAX_SUPPORT_FILES) {
      errors.push({ file: file.name, reason: "is one screenshot too many" });
      continue;
    }
    if (total + file.size > MAX_SUPPORT_TOTAL_SIZE) {
      errors.push({ file: file.name, reason: "would take the total over 12MB" });
      continue;
    }
    accepted.push(file);
    count += 1;
    total += file.size;
  }
  return { accepted, errors };
}

export function summarizeSupportFileErrors(errors: SupportFileError[]): string {
  return errors.map(({ file, reason }) => `${file} ${reason}`).join("; ");
}
