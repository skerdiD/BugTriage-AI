import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { getSupabaseStorageBucket } from "@/lib/supabase/env";

export type TicketAttachmentKind = "SCREENSHOT" | "LOG" | "OTHER";
export const MAX_UPLOAD_FILES_PER_TYPE = 3;
export const MAX_TICKET_FILE_SIZE_BYTES = 10 * 1024 * 1024;

export type UploadedTicketFile = {
  bucket: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  storagePath: string;
  attachmentType: TicketAttachmentKind;
};

type BuildTicketStoragePathInput = {
  userId: string;
  workspaceId: string;
  ticketCode: string;
  attachmentType: TicketAttachmentKind;
  fileName: string;
};

type UploadTicketFileInput = {
  supabase: SupabaseClient;
  file: File;
  userId: string;
  workspaceId: string;
  ticketCode: string;
  attachmentType: TicketAttachmentKind;
};

const screenshotMimeTypes = ["image/png", "image/jpeg", "image/webp"];
const screenshotExtensions = [".png", ".jpg", ".jpeg", ".webp"];

const logMimeTypes = [
  "",
  "text/plain",
  "application/json",
  "application/octet-stream",
];
const logExtensions = [".txt", ".log", ".json"];

export function getTicketStorageBucket() {
  return getSupabaseStorageBucket();
}

export function sanitizeFileName(fileName: string) {
  const normalized = fileName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  const safeName = normalized || "file";

  if (safeName.length <= 96) {
    return safeName;
  }

  const extensionIndex = safeName.lastIndexOf(".");

  if (extensionIndex <= 0) {
    return safeName.slice(0, 96);
  }

  const extension = safeName.slice(extensionIndex);
  const basename = safeName.slice(0, extensionIndex).slice(0, 96 - extension.length);

  return `${basename}${extension}`;
}

function hasAllowedExtension(fileName: string, extensions: string[]) {
  const normalizedFileName = fileName.toLowerCase();
  return extensions.some((extension) => normalizedFileName.endsWith(extension));
}

export function validateTicketFile(
  file: File,
  attachmentType: TicketAttachmentKind
) {
  if (file.size > MAX_TICKET_FILE_SIZE_BYTES) {
    return {
      valid: false,
      message: "File must be 10MB or smaller.",
    };
  }

  if (attachmentType === "SCREENSHOT") {
    const hasValidMimeType = screenshotMimeTypes.includes(file.type);
    const hasValidExtension = hasAllowedExtension(file.name, screenshotExtensions);

    if (!hasValidMimeType || !hasValidExtension) {
      return {
        valid: false,
        message: "Screenshot must be PNG, JPG, JPEG, or WEBP.",
      };
    }
  }

  if (attachmentType === "LOG") {
    const hasValidMimeType = logMimeTypes.includes(file.type);
    const hasValidExtension = hasAllowedExtension(file.name, logExtensions);

    if (!hasValidMimeType || !hasValidExtension) {
      return {
        valid: false,
        message: "Log file must be TXT, LOG, or JSON.",
      };
    }
  }

  return {
    valid: true,
    message: null,
  };
}

export function buildTicketStoragePath({
  userId,
  workspaceId,
  ticketCode,
  attachmentType,
  fileName,
}: BuildTicketStoragePathInput) {
  const safeFileName = sanitizeFileName(fileName);
  const folder =
    attachmentType === "SCREENSHOT"
      ? "screenshots"
      : attachmentType === "LOG"
        ? "logs"
        : "other";

  return `private/${workspaceId}/${userId}/tickets/${ticketCode}/${folder}/${Date.now()}-${safeFileName}`;
}

export function isTicketStoragePathInWorkspace(
  storagePath: string,
  workspaceId: string
) {
  return storagePath.replace(/\\/g, "/").startsWith(`private/${workspaceId}/`);
}

export async function uploadTicketFile({
  supabase,
  file,
  userId,
  workspaceId,
  ticketCode,
  attachmentType,
}: UploadTicketFileInput): Promise<UploadedTicketFile> {
  const validation = validateTicketFile(file, attachmentType);

  if (!validation.valid) {
    throw new Error(validation.message ?? "Invalid file.");
  }

  const bucket = getTicketStorageBucket();

  const storagePath = buildTicketStoragePath({
    userId,
    workspaceId,
    ticketCode,
    attachmentType,
    fileName: file.name,
  });

  const { error } = await supabase.storage.from(bucket).upload(storagePath, file, {
    cacheControl: "3600",
    contentType: file.type || "application/octet-stream",
    upsert: false,
  });

  if (error) {
    throw new Error(error.message);
  }

  return {
    bucket,
    fileName: sanitizeFileName(file.name),
    fileType: file.type || "application/octet-stream",
    fileSize: file.size,
    storagePath,
    attachmentType,
  };
}

export async function uploadScreenshotFile(
  input: Omit<UploadTicketFileInput, "attachmentType">
) {
  return uploadTicketFile({
    ...input,
    attachmentType: "SCREENSHOT",
  });
}

export async function uploadLogFile(input: Omit<UploadTicketFileInput, "attachmentType">) {
  return uploadTicketFile({
    ...input,
    attachmentType: "LOG",
  });
}

export async function createSignedTicketFileUrl(
  supabase: SupabaseClient,
  storagePath: string,
  workspaceId: string,
  expiresInSeconds = 60 * 5
) {
  if (!isTicketStoragePathInWorkspace(storagePath, workspaceId)) {
    throw new Error("Attachment storage path failed workspace validation.");
  }

  const bucket = getTicketStorageBucket();

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(storagePath, expiresInSeconds);

  if (error) {
    throw new Error(error.message);
  }

  return data.signedUrl;
}
