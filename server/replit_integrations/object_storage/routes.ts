import type { Express, RequestHandler, Request, Response } from "express";
import { ObjectStorageService, ObjectNotFoundError, normalizeDocumentObjectKey } from "./objectStorage";

export { ObjectStorageService, ObjectNotFoundError, normalizeDocumentObjectKey };

/**
 * Document access validator function type.
 * Returns true if user has access, false otherwise.
 */
export type DocumentAccessValidator = (req: Request, objectPath: string) => Promise<boolean>;

/**
 * Register object storage routes for file uploads.
 *
 * This provides example routes for the presigned URL upload flow:
 * 1. POST /api/uploads/request-url - Get a presigned URL for uploading
 * 2. The client then uploads directly to the presigned URL
 *
 * @param app - Express application
 * @param authMiddleware - Optional authentication middleware for protected uploads
 * @param accessValidator - Optional function to validate document access before serving files
 */
export function registerObjectStorageRoutes(
  app: Express, 
  authMiddleware?: RequestHandler,
  accessValidator?: DocumentAccessValidator
): void {
  const objectStorageService = new ObjectStorageService();

  /**
   * Request a presigned URL for file upload.
   * Requires authentication to prevent unauthorized uploads.
   */
  const uploadHandler: RequestHandler = async (req, res) => {
    try {
      const { name, size, contentType } = req.body;

      if (!name) {
        return res.status(400).json({
          error: "Missing required field: name",
        });
      }

      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      const objectPath = objectStorageService.normalizeObjectEntityPath(uploadURL);

      res.json({
        uploadURL,
        objectPath,
        metadata: { name, size, contentType },
      });
    } catch (error) {
      console.error("Error generating upload URL:", error);
      res.status(500).json({ error: "Failed to generate upload URL" });
    }
  };

  // Register upload route with authentication if provided
  if (authMiddleware) {
    app.post("/api/uploads/request-url", authMiddleware, uploadHandler);
  } else {
    app.post("/api/uploads/request-url", uploadHandler);
  }

  /**
   * Serve uploaded objects.
   * Requires authentication and document ACL validation.
   * ACL check MUST happen BEFORE any file operations.
   */
  const downloadHandler: RequestHandler = async (req, res) => {
    try {
      const rawPath = (req.params as any).objectPath;
      
      // Normalize and sanitize path using centralized function
      let canonicalKey: string;
      try {
        canonicalKey = normalizeDocumentObjectKey(rawPath || '');
      } catch (error) {
        return res.status(400).json({ error: "Invalid object path" });
      }
      
      // Validate document access BEFORE any file operations
      // If no validator is provided, deny all downloads for security
      if (!accessValidator) {
        return res.status(403).json({ error: "Access validation not configured" });
      }
      
      // Pass the canonical key to the validator
      const hasAccess = await accessValidator(req, canonicalKey);
      if (!hasAccess) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      // Use the same canonical key for storage fetch
      // Prepend "/" to match Express path format expected by getObjectEntityFile
      const objectFile = await objectStorageService.getObjectEntityFile('/' + canonicalKey);
      await objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error serving object:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.status(404).json({ error: "Object not found" });
      }
      return res.status(500).json({ error: "Failed to serve object" });
    }
  };

  // Register download route with authentication if provided
  if (authMiddleware) {
    app.get("/objects/:objectPath(*)", authMiddleware, downloadHandler);
  } else {
    app.get("/objects/:objectPath(*)", downloadHandler);
  }
}

