import { useRef, useState } from "react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { uploadToBlob, type UploadKind, type UploadResult } from "@/hooks/use-upload";

interface ObjectUploaderProps {
  kind: UploadKind;
  maxFileSize?: number;
  accept?: string;
  onComplete: (result: UploadResult) => void;
  buttonClassName?: string;
  children: ReactNode;
}

/**
 * Click-to-pick file uploader. Streams the selected file straight to
 * `/api/uploads`, which proxies to Vercel Blob. Shows a modal with a
 * progress bar during the upload and calls `onComplete` with the final
 * URL + metadata.
 */
export function ObjectUploader({
  kind,
  maxFileSize = 10 * 1024 * 1024,
  accept,
  onComplete,
  buttonClassName,
  children,
}: ObjectUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [activeFileName, setActiveFileName] = useState<string | null>(null);
  const { toast } = useToast();

  const handlePick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (file.size > maxFileSize) {
      toast({
        title: "File too large",
        description: `Maximum size is ${(maxFileSize / 1024 / 1024).toFixed(0)} MB.`,
        variant: "destructive",
      });
      return;
    }

    setActiveFileName(file.name);
    setProgress(0);
    setIsUploading(true);

    try {
      const result = await uploadToBlob(file, kind, setProgress);
      onComplete(result);
    } catch (err) {
      toast({
        title: "Upload failed",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setActiveFileName(null);
      setProgress(0);
    }
  };

  return (
    <>
      <Button onClick={handlePick} className={buttonClassName} disabled={isUploading}>
        {children}
      </Button>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
      />
      <Dialog open={isUploading}>
        <DialogContent
          className="sm:max-w-md overflow-hidden"
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader className="min-w-0">
            <DialogTitle>Uploading…</DialogTitle>
            <DialogDescription className="truncate" title={activeFileName ?? undefined}>
              {activeFileName ?? "Sending file to storage"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Progress value={progress} />
            <p className="text-sm text-muted-foreground">{progress}%</p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
