import { useState, useCallback } from "react";

export type UploadKind = "document" | "profile-photo";

export interface UploadResult {
  url: string;
  pathname: string;
  name: string;
  size: number;
  contentType: string;
}

interface UseUploadOptions {
  onSuccess?: (result: UploadResult) => void;
  onError?: (error: Error) => void;
}

/**
 * Hook for uploading a single file directly to the server, which proxies
 * it to Vercel Blob via @vercel/blob's put(). Reports upload progress.
 */
export function useUpload(options: UseUploadOptions = {}) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [progress, setProgress] = useState(0);

  const uploadFile = useCallback(
    async (file: File, kind: UploadKind): Promise<UploadResult | null> => {
      setIsUploading(true);
      setError(null);
      setProgress(0);

      try {
        const result = await uploadToBlob(file, kind, setProgress);
        options.onSuccess?.(result);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Upload failed");
        setError(error);
        options.onError?.(error);
        return null;
      } finally {
        setIsUploading(false);
      }
    },
    [options],
  );

  return { uploadFile, isUploading, error, progress };
}

/**
 * Low-level XHR upload that reports progress. Used by the hook and by
 * the ObjectUploader modal.
 */
export function uploadToBlob(
  file: File,
  kind: UploadKind,
  onProgress?: (pct: number) => void,
): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    const url = `/api/uploads?kind=${encodeURIComponent(kind)}&name=${encodeURIComponent(file.name)}`;
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url, true);
    xhr.withCredentials = true;
    xhr.setRequestHeader(
      "Content-Type",
      file.type || "application/octet-stream",
    );

    xhr.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          resolve(data as UploadResult);
        } catch (e) {
          reject(new Error("Upload succeeded but response was not JSON"));
        }
      } else {
        let message = `Upload failed (${xhr.status})`;
        try {
          const data = JSON.parse(xhr.responseText);
          if (data?.message) message = data.message;
        } catch {
          // ignore
        }
        reject(new Error(message));
      }
    });

    xhr.addEventListener("error", () =>
      reject(new Error("Network error during upload")),
    );
    xhr.addEventListener("abort", () =>
      reject(new Error("Upload aborted")),
    );

    xhr.send(file);
  });
}
