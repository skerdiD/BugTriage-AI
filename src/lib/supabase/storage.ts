import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import {
  addServerBreadcrumb,
  captureServerException,
  withServerSpan,
} from "@/lib/observability/server-monitoring";
import { getSupabaseStorageBucket } from "@/lib/supabase/env";

export type TicketAttachmentKind = "SCREENSHOT" | "LOG" | "OTHER";
export const MAX_UPLOAD_FILES_PER_TYPE = 3;
export const MAX_TICKET_FILE_SIZE_BYTES = 10 * 1024 * 1024;
export const MIN_SIGNED_URL_TTL_SECONDS = 60;
export const MAX_SIGNED_URL_TTL_SECONDS = 60 * 15;
const FILE_SIGNATURE_BYTES = 16;
const LOG_TEXT_VALIDATION_BYTES = 512;

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

export class TicketStorageError extends Error {
  userMessage: string;

  constructor(message: string, userMessage = "We couldn't process that file upload.") {
    super(message);
    this.name = "TicketStorageError";
    this.userMessage = userMessage;
  }
}

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

function matchesPngSignature(bytes: Uint8Array) {
  const pngSignature = [137, 80, 78, 71, 13, 10, 26, 10];

  return pngSignature.every((value, index) => bytes[index] === value);
}

function matchesJpegSignature(bytes: Uint8Array) {
  return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
}

function matchesWebpSignature(bytes: Uint8Array) {
  const riff = String.fromCharCode(...bytes.slice(0, 4));
  const webp = String.fromCharCode(...bytes.slice(8, 12));

  return riff === "RIFF" && webp === "WEBP";
}

async function validateScreenshotFileContents(file: File) {
  const bytes = new Uint8Array(
    await file.slice(0, FILE_SIGNATURE_BYTES).arrayBuffer()
  );

  if (
    matchesPngSignature(bytes) ||
    matchesJpegSignature(bytes) ||
    matchesWebpSignature(bytes)
  ) {
    return;
  }

  throw new TicketStorageError(
    "Screenshot file signature did not match an allowed image format.",
    "Screenshot content did not match a valid PNG, JPG, JPEG, or WEBP file."
  );
}

async function validateLogFileContents(file: File) {
  const bytes = new Uint8Array(
    await file.slice(0, LOG_TEXT_VALIDATION_BYTES).arrayBuffer()
  );
  const decodedText = new TextDecoder().decode(bytes);
  const suspiciousCharacterMatches = decodedText.match(
    /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\uFFFD]/g
  );
  const suspiciousCharacterCount = suspiciousCharacterMatches?.length ?? 0;

  if (
    suspiciousCharacterCount >
    Math.max(8, Math.floor(decodedText.length * 0.1))
  ) {
    throw new TicketStorageError(
      "Log file contents appeared to be binary data.",
      "Log uploads must contain plain text or JSON content."
    );
  }
}

export async function validateTicketFileContents(
  file: File,
  attachmentType: TicketAttachmentKind
) {
  if (attachmentType === "SCREENSHOT") {
    await validateScreenshotFileContents(file);
  }

  if (attachmentType === "LOG") {
    await validateLogFileContents(file);
  }
}

function clampSignedUrlTtl(expiresInSeconds: number) {
  return Math.min(
    Math.max(Math.floor(expiresInSeconds), MIN_SIGNED_URL_TTL_SECONDS),
    MAX_SIGNED_URL_TTL_SECONDS
  );
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

export function isTicketStoragePathForTicket(
  storagePath: string,
  workspaceId: string,
  ticketCode: string
) {
  const normalizedPath = storagePath.replace(/\\/g, "/");

  return (
    normalizedPath.startsWith(`private/${workspaceId}/`) &&
    normalizedPath.includes(`/tickets/${ticketCode}/`)
  );
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
    throw new TicketStorageError(
      validation.message ?? "Invalid file.",
      validation.message ?? "Invalid file."
    );
  }

  await validateTicketFileContents(file, attachmentType);

  const bucket = getTicketStorageBucket();

  const storagePath = buildTicketStoragePath({
    userId,
    workspaceId,
    ticketCode,
    attachmentType,
    fileName: file.name,
  });

  addServerBreadcrumb({
    category: "storage",
    message: "Starting ticket file upload.",
    data: {
      action: "upload-ticket-file",
      workspaceId,
      ticketCode,
      attachmentType,
      fileType: file.type || "application/octet-stream",
      fileSize: file.size,
    },
  });

  await withServerSpan(
    {
      name: "storage.ticket-file.upload",
      op: "storage.upload",
      context: {
        workspaceId,
        ticketCode,
        attachmentType,
        fileType: file.type || "application/octet-stream",
        fileSize: file.size,
      },
    },
    async () => {
      const { error } = await supabase.storage.from(bucket).upload(storagePath, file, {
        cacheControl: "3600",
        contentType: file.type || "application/octet-stream",
        upsert: false,
      });

      if (error) {
        throw new TicketStorageError(
          "Supabase Storage upload failed.",
          "We couldn't upload one of the selected files."
        );
      }
    }
  ).catch((error) => {
    captureServerException(error, {
      area: "storage",
      action: "upload-ticket-file",
      message: "[storage] ticket file upload failed",
      context: {
        workspaceId,
        ticketCode,
        attachmentType,
        fileType: file.type || "application/octet-stream",
        fileSize: file.size,
      },
    });
    throw error;
  });

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
  expiresInSeconds = 60 * 5,
  ticketCode?: string
) {
  if (!isTicketStoragePathInWorkspace(storagePath, workspaceId)) {
    throw new TicketStorageError(
      "Attachment storage path failed workspace validation.",
      "We couldn't prepare that file for download."
    );
  }

  if (
    ticketCode &&
    !isTicketStoragePathForTicket(storagePath, workspaceId, ticketCode)
  ) {
    throw new TicketStorageError(
      "Attachment storage path failed ticket validation.",
      "We couldn't prepare that file for download."
    );
  }

  const bucket = getTicketStorageBucket();
  const safeExpiresInSeconds = clampSignedUrlTtl(expiresInSeconds);

  try {
    const { data, error } = await withServerSpan(
      {
        name: "storage.ticket-file.sign-url",
        op: "storage.signed-url",
        context: {
          workspaceId,
          expiresInSeconds: safeExpiresInSeconds,
        },
      },
      () =>
        supabase.storage
          .from(bucket)
          .createSignedUrl(storagePath, safeExpiresInSeconds)
    );

    if (error) {
      throw new TicketStorageError(
        "Supabase Storage signed URL creation failed.",
        "We couldn't prepare that file for download."
      );
    }

    return data.signedUrl;
  } catch (error) {
    captureServerException(error, {
      area: "storage",
      action: "create-signed-ticket-file-url",
      message: "[storage] signed url creation failed",
      context: {
        workspaceId,
        expiresInSeconds: safeExpiresInSeconds,
      },
    });
    throw error;
  }
}

export async function deleteUploadedTicketFiles(
  supabase: SupabaseClient,
  files: Array<Pick<UploadedTicketFile, "bucket" | "storagePath">>
) {
  if (files.length === 0) {
    return;
  }

  const bucket = files[0]?.bucket ?? getTicketStorageBucket();
  const storagePaths = files.map((file) => file.storagePath);

  try {
    await withServerSpan(
      {
        name: "storage.ticket-file.cleanup",
        op: "storage.delete",
        context: {
          bucket,
          fileCount: storagePaths.length,
        },
      },
      async () => {
        const { error } = await supabase.storage.from(bucket).remove(storagePaths);

        if (error) {
          throw new TicketStorageError(
            "Supabase Storage cleanup failed after a ticket write error."
          );
        }
      }
    );
  } catch (error) {
    captureServerException(error, {
      area: "storage",
      action: "delete-uploaded-ticket-files",
      message: "[storage] ticket file cleanup failed",
      context: {
        bucket,
        fileCount: storagePaths.length,
      },
    });
  }
}
