/** Shared rules for chat attachments (paperclip + drag-drop). */

export const MAX_CHAT_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const ALLOWED_CHAT_FILE_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
];

export const ALLOWED_CHAT_EXTENSIONS = [
  "pdf",
  "doc",
  "docx",
  "ppt",
  "pptx",
  "jpg",
  "jpeg",
  "png",
  "gif",
  "webp",
  "svg",
];

export function validateChatFile(file: File): { valid: boolean; error?: string } {
  if (file.size > MAX_CHAT_FILE_SIZE) {
    return { valid: false, error: `${file.name} exceeds 10MB limit` };
  }

  const extension = file.name.split(".").pop()?.toLowerCase();
  const isValidExtension = extension && ALLOWED_CHAT_EXTENSIONS.includes(extension);
  const isValidMimeType = ALLOWED_CHAT_FILE_TYPES.includes(file.type);

  if (!isValidExtension && !isValidMimeType) {
    return { valid: false, error: `${file.name} is not a supported file type` };
  }

  return { valid: true };
}

export function partitionChatFiles(files: File[]): {
  accepted: File[];
  errors: string[];
} {
  const accepted: File[] = [];
  const errors: string[] = [];
  files.forEach((file) => {
    const result = validateChatFile(file);
    if (result.valid) {
      accepted.push(file);
    } else if (result.error) {
      errors.push(result.error);
    }
  });
  return { accepted, errors };
}
