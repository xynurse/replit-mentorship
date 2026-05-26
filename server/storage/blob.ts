import { put, del, head, get, BlobNotFoundError } from "@vercel/blob";
import type { Request, Response } from "express";
import { randomUUID } from "crypto";

export { BlobNotFoundError };

export class ObjectNotFoundError extends Error {
  constructor() {
    super("Object not found");
    this.name = "ObjectNotFoundError";
    Object.setPrototypeOf(this, ObjectNotFoundError.prototype);
  }
}

export type UploadKind = "document" | "profile-photo";

const PROFILE_PHOTO_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
]);

const PROFILE_PHOTO_MAX_BYTES = 5 * 1024 * 1024;
const DOCUMENT_MAX_BYTES = 50 * 1024 * 1024;

export interface UploadLimits {
  maxBytes: number;
  allowedContentTypes: Set<string> | null;
  pathPrefix: string;
}

export function getUploadLimits(kind: UploadKind, userId: string): UploadLimits {
  switch (kind) {
    case "profile-photo":
      return {
        maxBytes: PROFILE_PHOTO_MAX_BYTES,
        allowedContentTypes: PROFILE_PHOTO_TYPES,
        pathPrefix: `profile-photos/${userId}`,
      };
    case "document":
      return {
        maxBytes: DOCUMENT_MAX_BYTES,
        allowedContentTypes: null,
        pathPrefix: `documents`,
      };
    default: {
      const _: never = kind;
      throw new Error(`Unknown upload kind: ${_}`);
    }
  }
}

function sanitizeFilename(name: string): string {
  const base = name.split(/[\\/]/).pop() || "file";
  return base.replace(/[^\w.\-]+/g, "_").slice(0, 200);
}

export function buildPathname(kind: UploadKind, userId: string, originalName: string): string {
  const { pathPrefix } = getUploadLimits(kind, userId);
  const safeName = sanitizeFilename(originalName);
  return `${pathPrefix}/${randomUUID()}-${safeName}`;
}

export interface UploadResult {
  url: string;
  pathname: string;
  contentType: string;
  size: number;
  name: string;
}

/**
 * Stream the incoming request body directly to Vercel Blob.
 *
 * Caller is responsible for authentication, kind validation, and any
 * downstream DB writes (e.g. setting `users.profileImage` or creating
 * a `documents` row).
 */
export async function streamRequestToBlob(
  req: Request,
  opts: { kind: UploadKind; userId: string; originalName: string },
): Promise<UploadResult> {
  const { kind, userId, originalName } = opts;
  const { maxBytes, allowedContentTypes } = getUploadLimits(kind, userId);

  const contentType = req.headers["content-type"] || "application/octet-stream";
  if (allowedContentTypes && !allowedContentTypes.has(contentType)) {
    throw new UploadValidationError(
      `Content type ${contentType} not allowed for ${kind}`,
    );
  }

  const contentLength = Number(req.headers["content-length"] || 0);
  if (contentLength > maxBytes) {
    throw new UploadValidationError(
      `File too large: ${contentLength} bytes (max ${maxBytes})`,
    );
  }

  const pathname = buildPathname(kind, userId, originalName);

  const blob = await put(pathname, req, {
    access: "private",
    contentType,
    addRandomSuffix: false,
  });

  return {
    url: blob.url,
    pathname: blob.pathname,
    contentType,
    size: contentLength,
    name: sanitizeFilename(originalName),
  };
}

export class UploadValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UploadValidationError";
    Object.setPrototypeOf(this, UploadValidationError.prototype);
  }
}

/**
 * Server-mediated download. The store is private, so we use the @vercel/blob
 * SDK's get() (which adds the BLOB_READ_WRITE_TOKEN to the request) and pipe
 * the resulting stream back to the client. Used by the document view +
 * download endpoints and the profile photo route so we can enforce ACLs
 * without ever exposing the blob URL to the browser.
 *
 * Accepts either a full blob URL or a stored legacy path like
 * `objects/uploads/<uuid>` (those throw ObjectNotFoundError — handled by
 * the route which returns the helpful "please re-upload" message).
 */
export async function streamBlobToResponse(
  blobUrl: string,
  res: Response,
  opts: {
    contentType?: string;
    cacheControl?: string;
    contentDisposition?: string;
  } = {},
): Promise<void> {
  if (!isBlobUrl(blobUrl)) {
    throw new ObjectNotFoundError();
  }

  let result;
  try {
    result = await get(blobUrl, { access: "private" });
  } catch (err) {
    if (err instanceof BlobNotFoundError) {
      throw new ObjectNotFoundError();
    }
    throw err;
  }

  if (result.statusCode !== 200) {
    throw new ObjectNotFoundError();
  }

  // Buffer the whole blob then write — documents are ≤50 MB so this is
  // safe and avoids the foot-guns of piping ReadableStream → Express res
  // (Content-Length mismatch, truncated chunks, compression middleware
  // racing the stream, etc.). Profile photos are even smaller.
  const arrayBuffer = await new Response(result.stream).arrayBuffer();
  const body = Buffer.from(arrayBuffer);

  res.setHeader(
    "Content-Type",
    opts.contentType || result.blob.contentType || "application/octet-stream",
  );
  res.setHeader("Content-Length", String(body.byteLength));
  if (opts.cacheControl) res.setHeader("Cache-Control", opts.cacheControl);
  if (opts.contentDisposition)
    res.setHeader("Content-Disposition", opts.contentDisposition);

  res.end(body);
}

// Private blob URLs have hostname `<store>.[a-z0-9]+.blob.vercel-storage.com`
// (no `.public.` segment). Match either to detect a Vercel Blob URL.
const BLOB_HOSTNAME_RE =
  /^https:\/\/[a-z0-9-]+(\.[a-z0-9]+)?\.blob\.vercel-storage\.com\//i;

export function isBlobUrl(value: string): boolean {
  return BLOB_HOSTNAME_RE.test(value);
}

/**
 * Delete a blob by URL. No-op (and silent) for legacy non-blob paths so
 * old rows in the DB don't crash deletes.
 */
export async function deleteBlobIfExists(blobUrl: string): Promise<void> {
  if (!isBlobUrl(blobUrl)) return;
  try {
    await del(blobUrl);
  } catch (err) {
    if (err instanceof BlobNotFoundError) return;
    throw err;
  }
}

/**
 * Probe a blob URL to confirm it exists. Used by the document view route
 * to surface a helpful 404 before opening the stream.
 */
export async function blobExists(blobUrl: string): Promise<boolean> {
  if (!isBlobUrl(blobUrl)) return false;
  try {
    await head(blobUrl);
    return true;
  } catch (err) {
    if (err instanceof BlobNotFoundError) return false;
    throw err;
  }
}
