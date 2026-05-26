import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { ObjectUploader } from "@/components/ObjectUploader";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Document, Folder, DocumentCategory, DocumentVisibility, User } from "@shared/schema";
import {
  Search,
  Grid3X3,
  List,
  Plus,
  Upload,
  FolderPlus,
  File,
  FileText,
  FileImage,
  FileVideo,
  FileAudio,
  Download,
  Share2,
  Trash2,
  MoreVertical,
  Eye,
  Folder as FolderIcon,
  ChevronRight,
  ChevronDown,
  ArrowLeft,
  PanelRightClose,
  PanelRightOpen,
  Filter,
  FolderCog,
  FolderHeart,
  Users,
  Send,
  Edit,
  Loader2,
  ExternalLink,
} from "lucide-react";

type SharedDocument = Document & { sharedBy: User; sharedAt: Date };

const CATEGORY_OPTIONS: { value: DocumentCategory; label: string }[] = [
  { value: "TEMPLATE", label: "Template" },
  { value: "AGREEMENT", label: "Agreement" },
  { value: "RESOURCE", label: "Resource" },
  { value: "SUBMISSION", label: "Submission" },
  { value: "OTHER", label: "Other" },
];

const VISIBILITY_OPTIONS: { value: DocumentVisibility; label: string }[] = [
  { value: "PUBLIC", label: "Public" },
  { value: "COHORT", label: "Cohort Only" },
  { value: "TRACK", label: "Track Only" },
  { value: "MATCH", label: "Match Only" },
  { value: "PRIVATE", label: "Private" },
];

function getFileIcon(mimeType?: string | null, fileType?: string | null) {
  const type = mimeType || fileType || "";
  if (type.startsWith("image/")) return <FileImage className="h-8 w-8" />;
  if (type.startsWith("video/")) return <FileVideo className="h-8 w-8" />;
  if (type.startsWith("audio/")) return <FileAudio className="h-8 w-8" />;
  if (type.includes("pdf") || type.includes("document") || type.includes("text"))
    return <FileText className="h-8 w-8" />;
  return <File className="h-8 w-8" />;
}

function formatFileSize(bytes?: number | null): string {
  if (!bytes) return "Unknown size";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(date?: Date | string | null): string {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function DocumentsPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  // Sections are visible side-by-side now (My on top, System below, Shared
  // in a right rail). `focusedSection` tracks which one the user last
  // interacted with — drives the create-folder/create-document target and
  // the ?tab= query param.
  type Section = "personal" | "system";
  const tabFromUrl = (() => {
    if (typeof window === "undefined") return null;
    const t = new URLSearchParams(window.location.search).get("tab");
    return t === "system" || t === "personal" ? (t as Section) : null;
  })();
  const [focusedSection, setFocusedSection] = useState<Section>(tabFromUrl ?? "personal");
  const [showSharedRail, setShowSharedRail] = useState(true);

  // Collapsible state — both sections default to open.
  const [personalOpen, setPersonalOpen] = useState(true);
  const [systemOpen, setSystemOpen] = useState(true);

  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");

  // Per-section folder navigation state. Each section maintains its own
  // current folder + breadcrumb path so users can navigate deep in My
  // Documents without losing their place in System Resources.
  const [personalFolderId, setPersonalFolderId] = useState<string | null>(null);
  const [personalFolderPath, setPersonalFolderPath] = useState<Folder[]>([]);
  const [systemFolderId, setSystemFolderId] = useState<string | null>(null);
  const [systemFolderPath, setSystemFolderPath] = useState<Folder[]>([]);
  
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [shareDocumentId, setShareDocumentId] = useState<string | null>(null);
  const [shareUserIds, setShareUserIds] = useState<string[]>([]);
  const [shareMessage, setShareMessage] = useState("");
  const [shareUserSearch, setShareUserSearch] = useState("");
  
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCategory, setEditCategory] = useState<DocumentCategory>("OTHER");
  const [editVisibility, setEditVisibility] = useState<DocumentVisibility>("PRIVATE");

  const isAdmin = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";

  const [viewingDocument, setViewingDocument] = useState<Document | null>(null);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [viewLoading, setViewLoading] = useState(false);
  const [viewError, setViewError] = useState<string | null>(null);
  const [viewBlobUrl, setViewBlobUrl] = useState<string | null>(null);

  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showFolderDialog, setShowFolderDialog] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderDescription, setNewFolderDescription] = useState("");

  const [uploadedFile, setUploadedFile] = useState<{
    url: string;
    name: string;
    size: number;
    contentType: string;
  } | null>(null);
  const [documentName, setDocumentName] = useState("");
  const [documentDescription, setDocumentDescription] = useState("");
  const [documentCategory, setDocumentCategory] = useState<DocumentCategory>("OTHER");
  const [documentVisibility, setDocumentVisibility] = useState<DocumentVisibility>("PRIVATE");
  const [uploadShareUserIds, setUploadShareUserIds] = useState<string[]>([]);
  const [uploadShareSearch, setUploadShareSearch] = useState("");
  const [uploadShareEnabled, setUploadShareEnabled] = useState(false);

  const { data: systemFolder } = useQuery<Folder>({
    queryKey: ["/api/folders/system"],
    refetchOnMount: "always",
  });

  const { data: personalFolder } = useQuery<Folder>({
    queryKey: ["/api/folders/personal"],
    refetchOnMount: "always",
  });

  const { data: sharedDocuments, isLoading: sharedLoading } = useQuery<SharedDocument[]>({
    queryKey: ["/api/documents/shared-with-me"],
    refetchOnMount: "always",
  });

  const { data: shareableUsers } = useQuery<{ id: string; firstName: string; lastName: string; email: string }[]>({
    queryKey: ["/api/users/messageable"],
    enabled: showShareDialog || (uploadShareEnabled && showUploadDialog),
  });

  // Per-section effective folder ids. Falls back to the section's root
  // folder when no sub-folder is navigated into.
  const personalEffectiveFolderId = personalFolderId || personalFolder?.id || null;
  const systemEffectiveFolderId = systemFolderId || systemFolder?.id || null;

  const activeCategoryFilter = categoryFilter === "ALL" ? "" : categoryFilter;

  // Helper: build a docs query for one section. Memoized so React Query
  // sees stable keys across re-renders.
  const buildDocsQuery = (section: Section, folderId: string | null) => ({
    queryKey: ["/api/documents", section, folderId, activeCategoryFilter, searchQuery] as const,
    queryFn: async () => {
      const params = new URLSearchParams();
      if (folderId) params.set("folderId", folderId);
      if (activeCategoryFilter) params.set("category", activeCategoryFilter);
      if (searchQuery) params.set("search", searchQuery);
      const res = await fetch(`/api/documents?${params.toString()}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch documents");
      return res.json() as Promise<Document[]>;
    },
    enabled: !!folderId,
    refetchOnMount: "always" as const,
  });

  const buildFoldersQuery = (section: Section, parentId: string | null) => ({
    queryKey: ["/api/folders", section, parentId] as const,
    queryFn: async () => {
      const params = new URLSearchParams();
      if (parentId) params.set("parentFolderId", parentId);
      const res = await fetch(`/api/folders?${params.toString()}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch folders");
      return res.json() as Promise<Folder[]>;
    },
    enabled: !!parentId,
    refetchOnMount: "always" as const,
  });

  const { data: personalDocuments, isLoading: personalDocsLoading } = useQuery(
    buildDocsQuery("personal", personalEffectiveFolderId),
  );
  const { data: personalFolders, isLoading: personalFoldersLoading } = useQuery(
    buildFoldersQuery("personal", personalEffectiveFolderId),
  );
  const { data: systemDocuments, isLoading: systemDocsLoading } = useQuery(
    buildDocsQuery("system", systemEffectiveFolderId),
  );
  const { data: systemFolders, isLoading: systemFoldersLoading } = useQuery(
    buildFoldersQuery("system", systemEffectiveFolderId),
  );

  const createDocumentMutation = useMutation({
    mutationFn: async (data: {
      name: string;
      description?: string;
      fileUrl: string;
      fileType?: string;
      fileSize?: number;
      mimeType?: string;
      category: DocumentCategory;
      visibility: DocumentVisibility;
      folderId?: string | null;
      shareWithUserIds?: string[];
    }) => {
      const { shareWithUserIds, ...docData } = data;
      const res = await apiRequest("POST", "/api/documents", docData);
      const doc = await res.json();

      let shareError = false;
      let sharedCount = 0;
      if (shareWithUserIds && shareWithUserIds.length > 0) {
        try {
          if (shareWithUserIds.length === 1) {
            await apiRequest("POST", `/api/documents/${doc.id}/share`, {
              userId: shareWithUserIds[0],
            });
            sharedCount = 1;
          } else {
            const shareRes = await apiRequest("POST", `/api/documents/${doc.id}/share-bulk`, {
              userIds: shareWithUserIds,
            });
            const shareResult = await shareRes.json();
            sharedCount = shareResult.sharedCount || 0;
          }
        } catch {
          shareError = true;
        }
      }
      return { doc, sharedCount, shareError, requestedShareCount: shareWithUserIds?.length || 0 };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      if (result.shareError) {
        toast({
          title: "Document uploaded, but sharing failed",
          description: "The document was saved. You can try sharing it again from the document menu.",
          variant: "destructive",
        });
      } else if (result.sharedCount > 0) {
        toast({ title: `Document uploaded and shared with ${result.sharedCount} user${result.sharedCount !== 1 ? "s" : ""}` });
      } else {
        toast({ title: "Document uploaded successfully" });
      }
      setShowUploadDialog(false);
      resetUploadForm();
    },
    onError: () => {
      toast({ title: "Failed to upload document", variant: "destructive" });
    },
  });

  const createFolderMutation = useMutation({
    mutationFn: async (data: { name: string; description?: string; parentFolderId?: string | null }) => {
      const res = await apiRequest("POST", "/api/folders", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/folders"] });
      toast({ title: "Folder created successfully" });
      setShowFolderDialog(false);
      setNewFolderName("");
      setNewFolderDescription("");
    },
    onError: () => {
      toast({ title: "Failed to create folder", variant: "destructive" });
    },
  });

  const deleteDocumentMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/documents/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      toast({ title: "Document deleted" });
    },
    onError: () => {
      toast({ title: "Failed to delete document", variant: "destructive" });
    },
  });

  const deleteFolderMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/folders/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/folders"] });
      toast({ title: "Folder deleted" });
    },
    onError: () => {
      toast({ title: "Failed to delete folder", variant: "destructive" });
    },
  });

  const shareDocumentMutation = useMutation({
    mutationFn: async (data: { documentId: string; userIds: string[]; message?: string }) => {
      if (data.userIds.length === 1) {
        const res = await apiRequest("POST", `/api/documents/${data.documentId}/share`, {
          userId: data.userIds[0],
          message: data.message,
        });
        return res.json();
      }
      const res = await apiRequest("POST", `/api/documents/${data.documentId}/share-bulk`, {
        userIds: data.userIds,
        message: data.message,
      });
      return res.json();
    },
    onSuccess: (result: any) => {
      const count = result?.sharedCount || 1;
      toast({ title: `Document shared with ${count} user${count !== 1 ? "s" : ""} successfully` });
      setShowShareDialog(false);
      setShareDocumentId(null);
      setShareUserIds([]);
      setShareMessage("");
      setShareUserSearch("");
    },
    onError: () => {
      toast({ title: "Failed to share document", variant: "destructive" });
    },
  });

  const updateDocumentMutation = useMutation({
    mutationFn: async (data: { id: string; name?: string; description?: string; category?: DocumentCategory; visibility?: DocumentVisibility }) => {
      const res = await apiRequest("PATCH", `/api/documents/${data.id}`, {
        name: data.name,
        description: data.description,
        category: data.category,
        visibility: data.visibility,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      toast({ title: "Document updated successfully" });
      setShowEditDialog(false);
      setEditingDocument(null);
    },
    onError: () => {
      toast({ title: "Failed to update document", variant: "destructive" });
    },
  });

  const handleShareDocument = () => {
    if (!shareDocumentId || shareUserIds.length === 0) return;
    shareDocumentMutation.mutate({
      documentId: shareDocumentId,
      userIds: shareUserIds,
      message: shareMessage,
    });
  };

  const handleUpdateDocument = () => {
    if (!editingDocument) return;
    updateDocumentMutation.mutate({
      id: editingDocument.id,
      name: editName,
      description: editDescription,
      category: editCategory,
      visibility: editVisibility,
    });
  };

  const openShareDialog = (doc: Document) => {
    setShareDocumentId(doc.id);
    setShowShareDialog(true);
  };

  const openEditDialog = (doc: Document) => {
    setEditingDocument(doc);
    setEditName(doc.name);
    setEditDescription(doc.description || "");
    setEditCategory(doc.category as DocumentCategory);
    setEditVisibility(doc.visibility as DocumentVisibility);
    setShowEditDialog(true);
  };

  const downloadDocument = async (doc: Document) => {
    try {
      // Use fetch with credentials to get the file as a blob
      const response = await fetch(`/api/documents/${doc.id}/download`, {
        credentials: "include",
      });
      
      if (!response.ok) {
        // Try to get a more specific error message
        try {
          const errorData = await response.json();
          if (response.status === 404 && errorData.message?.includes("not found in storage")) {
            toast({ 
              title: "File not available", 
              description: "This file may need to be re-uploaded. Please contact an administrator.",
              variant: "destructive" 
            });
            return;
          }
        } catch {
          // Ignore JSON parsing errors
        }
        throw new Error("Download failed");
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = doc.name + (doc.mimeType === "application/pdf" ? ".pdf" : "");
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({ title: "Document downloaded successfully" });
    } catch {
      toast({ title: "Failed to download document", variant: "destructive" });
    }
  };

  const openDocumentViewer = async (doc: Document) => {
    setViewingDocument(doc);
    setViewError(null);
    setViewLoading(true);
    setViewBlobUrl(null);
    setShowViewDialog(true);

    try {
      const response = await fetch(`/api/documents/${doc.id}/view`, { credentials: 'include' });
      if (!response.ok) {
        let errorMsg = `Failed to load document (${response.status})`;
        try {
          const errorData = await response.json();
          if (errorData.message) errorMsg = errorData.message;
        } catch {}
        throw new Error(errorMsg);
      }
      const arrayBuffer = await response.arrayBuffer();
      const contentType = doc.mimeType || response.headers.get('Content-Type') || 'application/octet-stream';
      const blob = new Blob([arrayBuffer], { type: contentType });
      const url = URL.createObjectURL(blob);
      setViewBlobUrl(url);
      setViewLoading(false);
    } catch (err: any) {
      setViewLoading(false);
      setViewError(err.message || "Failed to load document preview.");
    }
  };

  const openDocumentInNewTab = () => {
    if (viewBlobUrl) {
      window.open(viewBlobUrl, '_blank');
    }
  };

  // Section-aware folder navigation. Each section has its own folder
  // breadcrumb path; clicking into a folder updates only that section's
  // state and also focuses it (so any subsequent create-folder /
  // create-document operations target this section's current folder).
  const navigateToFolder = async (section: Section, folder: Folder) => {
    if (section === "personal") {
      setPersonalFolderPath([...personalFolderPath, folder]);
      setPersonalFolderId(folder.id);
    } else {
      setSystemFolderPath([...systemFolderPath, folder]);
      setSystemFolderId(folder.id);
    }
    setFocusedSection(section);
  };

  const navigateToRoot = (section: Section) => {
    if (section === "personal") {
      setPersonalFolderPath([]);
      setPersonalFolderId(null);
    } else {
      setSystemFolderPath([]);
      setSystemFolderId(null);
    }
    setFocusedSection(section);
  };

  const navigateToBreadcrumb = (section: Section, index: number) => {
    const currentPath = section === "personal" ? personalFolderPath : systemFolderPath;
    const newPath = currentPath.slice(0, index + 1);
    if (section === "personal") {
      setPersonalFolderPath(newPath);
      setPersonalFolderId(newPath[newPath.length - 1].id);
    } else {
      setSystemFolderPath(newPath);
      setSystemFolderId(newPath[newPath.length - 1].id);
    }
    setFocusedSection(section);
  };

  const resetUploadForm = () => {
    setUploadedFile(null);
    setDocumentName("");
    setDocumentDescription("");
    setDocumentCategory("OTHER");
    setDocumentVisibility("PRIVATE");
    setUploadShareUserIds([]);
    setUploadShareSearch("");
    setUploadShareEnabled(false);
  };

  const handleUploadComplete = (result: { url: string; name: string; size: number; contentType: string }) => {
    setUploadedFile({
      url: result.url,
      name: result.name,
      size: result.size,
      contentType: result.contentType,
    });
    setDocumentName(result.name);
  };

  // Create/upload operations target the currently focused section's folder.
  const focusedEffectiveFolderId =
    focusedSection === "personal" ? personalEffectiveFolderId : systemEffectiveFolderId;

  const handleSaveDocument = () => {
    if (!uploadedFile) return;
    createDocumentMutation.mutate({
      name: documentName || uploadedFile.name,
      description: documentDescription,
      fileUrl: uploadedFile.url,
      fileType: uploadedFile.contentType.split("/")[1],
      fileSize: uploadedFile.size,
      mimeType: uploadedFile.contentType,
      category: documentCategory,
      visibility: documentVisibility,
      folderId: focusedEffectiveFolderId,
      shareWithUserIds: uploadShareEnabled ? uploadShareUserIds : undefined,
    });
  };

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return;
    createFolderMutation.mutate({
      name: newFolderName,
      description: newFolderDescription,
      parentFolderId: focusedEffectiveFolderId,
    });
  };

  const focusedFolderReady = focusedSection === "personal" ? !!personalFolder : !!systemFolder;
  const initialLoading =
    (focusedSection === "personal" && !personalFolder) ||
    (focusedSection === "system" && !systemFolder);

  // Whether the focused section's permission rules allow uploading.
  // System Resources are admin-only; My Documents is open to everyone.
  const canUploadToFocused =
    focusedSection === "personal" ||
    (focusedSection === "system" && (user?.role === "ADMIN" || user?.role === "SUPER_ADMIN"));
  const canCreateInFocused = canUploadToFocused;

  return (
    <DashboardLayout>
      <div className="flex flex-col h-full">
        <div className="sticky top-0 z-10 bg-background border-b p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold" data-testid="text-page-title">Document Library</h1>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
            <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
              <DialogTrigger asChild>
                <Button 
                  data-testid="button-upload-document"
                  disabled={!focusedFolderReady || !canUploadToFocused}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Upload Document</DialogTitle>
                  <DialogDescription>
                    Upload a file and add details about the document.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  {!uploadedFile ? (
                    <div className="flex justify-center">
                      <ObjectUploader
                        kind="document"
                        maxFileSize={52428800}
                        onComplete={handleUploadComplete}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Select File
                      </ObjectUploader>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-3 p-3 bg-muted rounded-md">
                        {getFileIcon(uploadedFile.contentType)}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{uploadedFile.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatFileSize(uploadedFile.size)}
                          </p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="doc-name">Document Name</Label>
                        <Input
                          id="doc-name"
                          value={documentName}
                          onChange={(e) => setDocumentName(e.target.value)}
                          placeholder="Enter document name"
                          data-testid="input-document-name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="doc-description">Description</Label>
                        <Textarea
                          id="doc-description"
                          value={documentDescription}
                          onChange={(e) => setDocumentDescription(e.target.value)}
                          placeholder="Describe the document..."
                          data-testid="input-document-description"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Category</Label>
                          <Select
                            value={documentCategory}
                            onValueChange={(v) => setDocumentCategory(v as DocumentCategory)}
                          >
                            <SelectTrigger data-testid="select-document-category">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {CATEGORY_OPTIONS.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Visibility</Label>
                          <Select
                            value={documentVisibility}
                            onValueChange={(v) => setDocumentVisibility(v as DocumentVisibility)}
                          >
                            <SelectTrigger data-testid="select-document-visibility">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {VISIBILITY_OPTIONS.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {isAdmin && (
                        <div className="space-y-2 border-t pt-4">
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              id="upload-share-toggle"
                              className="h-4 w-4 rounded border-input"
                              checked={uploadShareEnabled}
                              onChange={(e) => {
                                setUploadShareEnabled(e.target.checked);
                                if (!e.target.checked) {
                                  setUploadShareUserIds([]);
                                  setUploadShareSearch("");
                                }
                              }}
                              data-testid="checkbox-upload-share-toggle"
                            />
                            <Label htmlFor="upload-share-toggle" className="cursor-pointer">
                              Share with specific users after upload
                            </Label>
                          </div>
                          {uploadShareEnabled && (
                            <div className="space-y-2 pl-1">
                              <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                  placeholder="Search users..."
                                  value={uploadShareSearch}
                                  onChange={(e) => setUploadShareSearch(e.target.value)}
                                  className="pl-9"
                                  data-testid="input-upload-share-search"
                                />
                              </div>
                              {uploadShareUserIds.length > 0 && (
                                <p className="text-sm text-muted-foreground">
                                  {uploadShareUserIds.length} user{uploadShareUserIds.length !== 1 ? "s" : ""} selected
                                </p>
                              )}
                              <ScrollArea className="h-[150px] border rounded-md">
                                <div className="p-2 space-y-1">
                                  {(() => {
                                    const filtered = shareableUsers?.filter((u) => {
                                      if (!uploadShareSearch) return true;
                                      const q = uploadShareSearch.toLowerCase();
                                      return u.firstName.toLowerCase().includes(q) ||
                                        u.lastName.toLowerCase().includes(q) ||
                                        u.email.toLowerCase().includes(q);
                                    }) || [];
                                    return (
                                      <>
                                        {filtered.length > 1 && (
                                          <label className="flex items-center gap-3 p-2 rounded-md hover-elevate cursor-pointer" data-testid="checkbox-upload-select-all">
                                            <input
                                              type="checkbox"
                                              className="h-4 w-4 rounded border-input"
                                              checked={filtered.length > 0 && filtered.every(u => uploadShareUserIds.includes(u.id))}
                                              onChange={(e) => {
                                                if (e.target.checked) {
                                                  setUploadShareUserIds(prev => [...new Set([...prev, ...filtered.map(u => u.id)])]);
                                                } else {
                                                  const filteredIds = new Set(filtered.map(u => u.id));
                                                  setUploadShareUserIds(prev => prev.filter(id => !filteredIds.has(id)));
                                                }
                                              }}
                                            />
                                            <span className="text-sm font-medium">Select All ({filtered.length})</span>
                                          </label>
                                        )}
                                        {filtered.map((u) => (
                                          <label
                                            key={u.id}
                                            className="flex items-center gap-3 p-2 rounded-md hover-elevate cursor-pointer"
                                            data-testid={`checkbox-upload-user-${u.id}`}
                                          >
                                            <input
                                              type="checkbox"
                                              className="h-4 w-4 rounded border-input"
                                              checked={uploadShareUserIds.includes(u.id)}
                                              onChange={(e) => {
                                                if (e.target.checked) {
                                                  setUploadShareUserIds(prev => [...prev, u.id]);
                                                } else {
                                                  setUploadShareUserIds(prev => prev.filter(id => id !== u.id));
                                                }
                                              }}
                                            />
                                            <div className="flex flex-col min-w-0">
                                              <span className="text-sm font-medium">{u.firstName} {u.lastName}</span>
                                              <span className="text-xs text-muted-foreground truncate">{u.email}</span>
                                            </div>
                                          </label>
                                        ))}
                                        {filtered.length === 0 && (
                                          <p className="text-sm text-muted-foreground text-center py-4">No users found</p>
                                        )}
                                      </>
                                    );
                                  })()}
                                </div>
                              </ScrollArea>
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
                {uploadedFile && (
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setShowUploadDialog(false)}
                      data-testid="button-cancel-upload"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSaveDocument}
                      disabled={createDocumentMutation.isPending}
                      data-testid="button-save-document"
                    >
                      {createDocumentMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          {uploadShareEnabled && uploadShareUserIds.length > 0 ? "Uploading & Sharing..." : "Saving..."}
                        </>
                      ) : (
                        uploadShareEnabled && uploadShareUserIds.length > 0
                          ? `Save & Share with ${uploadShareUserIds.length} User${uploadShareUserIds.length !== 1 ? "s" : ""}`
                          : "Save Document"
                      )}
                    </Button>
                  </DialogFooter>
                )}
              </DialogContent>
            </Dialog>

            <Dialog open={showFolderDialog} onOpenChange={setShowFolderDialog}>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  data-testid="button-new-folder"
                  disabled={!focusedFolderReady || !canUploadToFocused}
                >
                  <FolderPlus className="h-4 w-4 mr-2" />
                  New Folder
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Folder</DialogTitle>
                  <DialogDescription>Create a new folder to organize your documents.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="folder-name">Folder Name</Label>
                    <Input
                      id="folder-name"
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      placeholder="Enter folder name"
                      data-testid="input-folder-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="folder-description">Description (optional)</Label>
                    <Textarea
                      id="folder-description"
                      value={newFolderDescription}
                      onChange={(e) => setNewFolderDescription(e.target.value)}
                      placeholder="Describe the folder..."
                      data-testid="input-folder-description"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setShowFolderDialog(false)}
                    data-testid="button-cancel-folder"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateFolder}
                    disabled={createFolderMutation.isPending || !newFolderName.trim()}
                    data-testid="button-create-folder"
                  >
                    Create Folder
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            </div>
          </div>
        </div>

        {/* New layout (per user spec): My Documents on top + System
            Resources below as stacked collapsibles in the main column,
            Shared with me pinned to a right rail. Clicking anywhere in a
            section focuses it for create-folder/create-document targeting. */}
        <div className={`flex-1 overflow-auto px-4 pt-4 grid gap-4 ${showSharedRail ? "lg:grid-cols-[1fr_320px]" : "grid-cols-1"}`}>
          <div className="space-y-4">
            <Collapsible open={personalOpen} onOpenChange={setPersonalOpen}>
              <Card
                className={focusedSection === "personal" ? "border-primary/50" : ""}
                onClick={() => setFocusedSection("personal")}
                data-testid="section-my-documents"
              >
                <CardHeader className="pb-3">
                  <CollapsibleTrigger asChild>
                    <button
                      className="flex items-center gap-2 w-full text-left"
                      data-testid="toggle-my-documents"
                    >
                      <FolderHeart className="h-4 w-4 text-primary" />
                      <CardTitle className="text-base flex-1">My Documents</CardTitle>
                      <ChevronDown className={`h-4 w-4 transition-transform ${personalOpen ? "" : "-rotate-90"}`} />
                    </button>
                  </CollapsibleTrigger>
                </CardHeader>
                <CollapsibleContent>
                  <CardContent className="pt-0">
                    {!personalFolder ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : (
                      renderFiltersAndContent("personal")
                    )}
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>

            <Collapsible open={systemOpen} onOpenChange={setSystemOpen}>
              <Card
                className={focusedSection === "system" ? "border-primary/50" : ""}
                onClick={() => setFocusedSection("system")}
                data-testid="section-system-resources"
              >
                <CardHeader className="pb-3">
                  <CollapsibleTrigger asChild>
                    <button
                      className="flex items-center gap-2 w-full text-left"
                      data-testid="toggle-system-resources"
                    >
                      <FolderCog className="h-4 w-4 text-primary" />
                      <CardTitle className="text-base flex-1">System Resources</CardTitle>
                      <ChevronDown className={`h-4 w-4 transition-transform ${systemOpen ? "" : "-rotate-90"}`} />
                    </button>
                  </CollapsibleTrigger>
                </CardHeader>
                <CollapsibleContent>
                  <CardContent className="pt-0">
                    {!systemFolder ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : (
                      renderFiltersAndContent("system")
                    )}
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          </div>

          {showSharedRail && (
            <aside className="space-y-2" data-testid="rail-shared-with-me">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-primary" />
                      <CardTitle className="text-base">Shared with Me</CardTitle>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => setShowSharedRail(false)}
                      title="Hide shared with me"
                      data-testid="button-hide-shared-rail"
                    >
                      <PanelRightClose className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {renderSharedRail()}
                </CardContent>
              </Card>
            </aside>
          )}
        </div>
        {!showSharedRail && (
          <Button
            variant="outline"
            size="sm"
            className="fixed bottom-6 right-6 shadow-md"
            onClick={() => setShowSharedRail(true)}
            data-testid="button-show-shared-rail"
          >
            <PanelRightOpen className="h-4 w-4 mr-2" />
            Shared with me
          </Button>
        )}

        {/* Share Document Dialog */}
        <Dialog open={showShareDialog} onOpenChange={(open) => {
          setShowShareDialog(open);
          if (!open) {
            setShareUserIds([]);
            setShareMessage("");
            setShareUserSearch("");
          }
        }}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Share Document</DialogTitle>
              <DialogDescription>
                Select one or more users to share this document with. They will each receive a notification.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Share with Users</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search users by name or email..."
                    value={shareUserSearch}
                    onChange={(e) => setShareUserSearch(e.target.value)}
                    className="pl-9"
                    data-testid="input-share-user-search"
                  />
                </div>
                {shareUserIds.length > 0 && (
                  <p className="text-sm text-muted-foreground">
                    {shareUserIds.length} user{shareUserIds.length !== 1 ? "s" : ""} selected
                  </p>
                )}
                <ScrollArea className="h-[200px] border rounded-md">
                  <div className="p-2 space-y-1">
                    {(() => {
                      const filtered = shareableUsers?.filter((u) => {
                        if (!shareUserSearch) return true;
                        const q = shareUserSearch.toLowerCase();
                        return u.firstName.toLowerCase().includes(q) ||
                          u.lastName.toLowerCase().includes(q) ||
                          u.email.toLowerCase().includes(q);
                      }) || [];
                      return (
                        <>
                          {filtered.length > 1 && (
                            <label
                              className="flex items-center gap-3 p-2 rounded-md hover-elevate cursor-pointer"
                              data-testid="checkbox-select-all"
                            >
                              <input
                                type="checkbox"
                                className="h-4 w-4 rounded border-input"
                                checked={filtered.length > 0 && filtered.every(u => shareUserIds.includes(u.id))}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setShareUserIds(prev => [...new Set([...prev, ...filtered.map(u => u.id)])]);
                                  } else {
                                    const filteredIds = new Set(filtered.map(u => u.id));
                                    setShareUserIds(prev => prev.filter(id => !filteredIds.has(id)));
                                  }
                                }}
                              />
                              <span className="text-sm font-medium">Select All ({filtered.length})</span>
                            </label>
                          )}
                          {filtered.map((u) => (
                            <label
                              key={u.id}
                              className="flex items-center gap-3 p-2 rounded-md hover-elevate cursor-pointer"
                              data-testid={`checkbox-user-${u.id}`}
                            >
                              <input
                                type="checkbox"
                                className="h-4 w-4 rounded border-input"
                                checked={shareUserIds.includes(u.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setShareUserIds(prev => [...prev, u.id]);
                                  } else {
                                    setShareUserIds(prev => prev.filter(id => id !== u.id));
                                  }
                                }}
                              />
                              <div className="flex flex-col min-w-0">
                                <span className="text-sm font-medium">{u.firstName} {u.lastName}</span>
                                <span className="text-xs text-muted-foreground truncate">{u.email}</span>
                              </div>
                            </label>
                          ))}
                          {filtered.length === 0 && (
                            <p className="text-sm text-muted-foreground text-center py-4">No users found</p>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </ScrollArea>
              </div>
              <div className="space-y-2">
                <Label htmlFor="share-message">Message (optional)</Label>
                <Textarea
                  id="share-message"
                  value={shareMessage}
                  onChange={(e) => setShareMessage(e.target.value)}
                  placeholder="Add a message for the recipients..."
                  data-testid="input-share-message"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowShareDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleShareDocument}
                disabled={shareUserIds.length === 0 || shareDocumentMutation.isPending}
                data-testid="button-confirm-share"
              >
                {shareDocumentMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sharing...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Share with {shareUserIds.length || ""} User{shareUserIds.length !== 1 ? "s" : ""}
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Document Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Document</DialogTitle>
              <DialogDescription>
                Update the document details. File content cannot be changed.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Document Name</Label>
                <Input
                  id="edit-name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Enter document name"
                  data-testid="input-edit-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Enter document description..."
                  data-testid="input-edit-description"
                />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={editCategory} onValueChange={(v) => setEditCategory(v as DocumentCategory)}>
                  <SelectTrigger data-testid="select-edit-category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORY_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Visibility</Label>
                <Select value={editVisibility} onValueChange={(v) => setEditVisibility(v as DocumentVisibility)}>
                  <SelectTrigger data-testid="select-edit-visibility">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {VISIBILITY_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleUpdateDocument}
                disabled={!editName || updateDocumentMutation.isPending}
                data-testid="button-save-document"
              >
                {updateDocumentMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showViewDialog} onOpenChange={(open) => {
          setShowViewDialog(open);
          if (!open) {
            if (viewBlobUrl) {
              URL.revokeObjectURL(viewBlobUrl);
              setViewBlobUrl(null);
            }
            setViewingDocument(null);
            setViewLoading(false);
            setViewError(null);
          }
        }}>
          <DialogContent className="max-w-4xl h-[85vh] flex flex-col p-0">
            <DialogHeader className="px-6 pt-6 pb-2 flex-shrink-0">
              <div className="flex items-center justify-between gap-4 pr-8">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="p-2 bg-muted rounded-md flex-shrink-0">
                    {viewingDocument && getFileIcon(viewingDocument.mimeType, viewingDocument.fileType)}
                  </div>
                  <div className="min-w-0">
                    <DialogTitle className="truncate" data-testid="text-viewer-title">
                      {viewingDocument?.name}
                    </DialogTitle>
                    <DialogDescription className="truncate">
                      {viewingDocument && formatFileSize(viewingDocument.fileSize)}
                      {viewingDocument?.category && ` · ${viewingDocument.category}`}
                    </DialogDescription>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => viewingDocument && downloadDocument(viewingDocument)}
                  data-testid="button-viewer-download"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            </DialogHeader>
            <div className="flex-1 min-h-0 px-6 pb-6 relative">
              {viewLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              )}
              {viewError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 gap-3 z-10">
                  <p className="text-destructive font-medium">{viewError}</p>
                  <Button variant="outline" onClick={() => viewingDocument && downloadDocument(viewingDocument)}>
                    <Download className="h-4 w-4 mr-2" />
                    Download Instead
                  </Button>
                </div>
              )}
              {viewingDocument && viewBlobUrl && (
                viewingDocument.mimeType === "application/pdf" ? (
                  <div className="w-full h-full flex flex-col gap-2">
                    <iframe
                      src={viewBlobUrl + "#toolbar=1"}
                      className="w-full flex-1 rounded-md border"
                      title={viewingDocument.name}
                      data-testid="iframe-document-viewer"
                    />
                    <div className="flex items-center justify-center gap-2 flex-shrink-0">
                      <Button variant="outline" size="sm" onClick={openDocumentInNewTab} data-testid="button-open-new-tab">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Open in New Tab
                      </Button>
                    </div>
                  </div>
                ) : viewingDocument.mimeType?.startsWith("image/") ? (
                  <div className="w-full h-full flex items-center justify-center bg-muted rounded-md border">
                    <img
                      src={viewBlobUrl}
                      alt={viewingDocument.name}
                      className="max-w-full max-h-full object-contain"
                      data-testid="img-document-viewer"
                    />
                  </div>
                ) : viewingDocument.mimeType?.startsWith("text/") || viewingDocument.mimeType === "application/json" ? (
                  <iframe
                    src={viewBlobUrl}
                    className="w-full h-full rounded-md border bg-background"
                    title={viewingDocument.name}
                    data-testid="iframe-text-viewer"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-muted rounded-md border gap-4 p-6">
                    <File className="h-16 w-16 text-muted-foreground" />
                    <div className="text-center max-w-md">
                      <p className="font-medium mb-1">Preview not available</p>
                      <p className="text-sm text-muted-foreground mb-4">
                        This file type ({viewingDocument.mimeType || "unknown"}) can't be previewed inline.
                        Word, Excel, and PowerPoint files need to be downloaded to view.
                      </p>
                      <Button onClick={() => viewingDocument && downloadDocument(viewingDocument)} data-testid="button-viewer-download-fallback">
                        <Download className="h-4 w-4 mr-2" />
                        Download File
                      </Button>
                    </div>
                  </div>
                )
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );

  function renderFiltersAndContent(section: Section) {
    const folderPath = section === "personal" ? personalFolderPath : systemFolderPath;
    const folders = section === "personal" ? personalFolders : systemFolders;
    const documents = section === "personal" ? personalDocuments : systemDocuments;
    const isLoading =
      section === "personal"
        ? personalDocsLoading || personalFoldersLoading
        : systemDocsLoading || systemFoldersLoading;
    const canUploadHere =
      section === "personal" ||
      (section === "system" && (user?.role === "ADMIN" || user?.role === "SUPER_ADMIN"));

    return (
      <>
        <div className="flex flex-wrap items-center gap-4 mt-2">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              data-testid={`input-search-documents-${section}`}
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[150px]" data-testid={`select-category-filter-${section}`}>
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Categories</SelectItem>
              {CATEGORY_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex border rounded-md">
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="icon"
              onClick={() => setViewMode("grid")}
              data-testid={`button-view-grid-${section}`}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="icon"
              onClick={() => setViewMode("list")}
              data-testid={`button-view-list-${section}`}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {folderPath.length > 0 && (
          <div className="flex items-center gap-2 mt-4 text-sm">
            <Button variant="ghost" size="sm" onClick={() => navigateToRoot(section)} data-testid={`button-nav-root-${section}`}>
              {section === "personal" ? "My Documents" : "System Resources"}
            </Button>
            {folderPath.map((folder, index) => (
              <div key={folder.id} className="flex items-center gap-2">
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigateToBreadcrumb(section, index)}
                  data-testid={`button-nav-folder-${folder.id}`}
                >
                  {folder.name}
                </Button>
              </div>
            ))}
          </div>
        )}

        <div className="flex-1 overflow-auto mt-4">
        {isLoading ? (
          <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" : "space-y-2"}>
            {[...Array(8)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <>
            {folders && folders.length > 0 && (
              <div className="mb-6">
                <h2 className="text-sm font-medium text-muted-foreground mb-3">Folders</h2>
                <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" : "space-y-2"}>
                  {folders.map((folder) => (
                    <Card
                      key={folder.id}
                      className="cursor-pointer hover-elevate"
                      onClick={() => navigateToFolder(section, folder)}
                      data-testid={`card-folder-${folder.id}`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-primary/10 rounded-md">
                            <FolderIcon className="h-6 w-6 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate" data-testid={`text-folder-name-${folder.id}`}>
                              {folder.name}
                            </p>
                            {folder.description && (
                              <p className="text-sm text-muted-foreground truncate">
                                {folder.description}
                              </p>
                            )}
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteFolderMutation.mutate(folder.id);
                                }}
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            <div>
              {documents && documents.length > 0 && (
                <h2 className="text-sm font-medium text-muted-foreground mb-3">Documents</h2>
              )}
              {documents && documents.length === 0 && (!folders || folders.length === 0) ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <FileText className="h-16 w-16 text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-medium mb-2">No documents yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Upload your first document to get started.
                  </p>
                  {canUploadHere && (
                    <Button onClick={() => { setFocusedSection(section); setShowUploadDialog(true); }} data-testid={`button-empty-upload-${section}`}>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Document
                    </Button>
                  )}
                </div>
              ) : viewMode === "grid" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {documents?.map((doc) => (
                    <Card key={doc.id} className="group cursor-pointer hover-elevate" data-testid={`card-document-${doc.id}`} onClick={() => openDocumentViewer(doc)}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-muted rounded-md">
                            {getFileIcon(doc.mimeType, doc.fileType)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate" data-testid={`text-document-name-${doc.id}`}>
                              {doc.name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {formatFileSize(doc.fileSize)}
                            </p>
                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                              <Badge variant="outline" className="text-xs">
                                {doc.category}
                              </Badge>
                              <Badge variant="secondary" className="text-xs">
                                {doc.visibility}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-4 pt-3 border-t">
                          <span className="text-xs text-muted-foreground">
                            {formatDate(doc.createdAt)}
                          </span>
                          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openDocumentViewer(doc)}
                              data-testid={`button-view-${doc.id}`}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openDocumentViewer(doc)} data-testid={`button-view-doc-${doc.id}`}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => downloadDocument(doc)} data-testid={`button-download-doc-${doc.id}`}>
                                  <Download className="h-4 w-4 mr-2" />
                                  Download
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => openEditDialog(doc)} data-testid={`button-edit-doc-${doc.id}`}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openShareDialog(doc)} data-testid={`button-share-doc-${doc.id}`}>
                                  <Share2 className="h-4 w-4 mr-2" />
                                  Share
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => deleteDocumentMutation.mutate(doc.id)}
                                  className="text-destructive"
                                  data-testid={`button-delete-doc-${doc.id}`}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {documents?.map((doc) => (
                    <Card key={doc.id} className="cursor-pointer hover-elevate" data-testid={`row-document-${doc.id}`} onClick={() => openDocumentViewer(doc)}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <div className="p-2 bg-muted rounded-md">
                            {getFileIcon(doc.mimeType, doc.fileType)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate" data-testid={`text-document-name-${doc.id}`}>
                              {doc.name}
                            </p>
                            {doc.description && (
                              <p className="text-sm text-muted-foreground truncate">
                                {doc.description}
                              </p>
                            )}
                          </div>
                          <div className="hidden sm:flex items-center gap-2">
                            <Badge variant="outline">{doc.category}</Badge>
                            <Badge variant="secondary">{doc.visibility}</Badge>
                          </div>
                          <span className="hidden md:block text-sm text-muted-foreground w-20">
                            {formatFileSize(doc.fileSize)}
                          </span>
                          <span className="hidden lg:block text-sm text-muted-foreground w-28">
                            {formatDate(doc.createdAt)}
                          </span>
                          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openDocumentViewer(doc)}
                              data-testid={`button-view-${doc.id}`}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openDocumentViewer(doc)}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => downloadDocument(doc)}>
                                  <Download className="h-4 w-4 mr-2" />
                                  Download
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => openEditDialog(doc)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openShareDialog(doc)}>
                                  <Share2 className="h-4 w-4 mr-2" />
                                  Share
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => deleteDocumentMutation.mutate(doc.id)}
                                  className="text-destructive"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
        </div>
      </>
    );
  }

  // Compact right-rail list of documents shared with the current user.
  // The full-page version below is unused now that Shared lives in the
  // rail, but kept around in case we restore a dedicated route later.
  function renderSharedRail() {
    if (sharedLoading) {
      return (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      );
    }
    if (!sharedDocuments || sharedDocuments.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Users className="h-8 w-8 text-muted-foreground/60 mb-2" />
          <p className="text-sm font-medium">Nothing shared yet</p>
          <p className="text-xs text-muted-foreground">
            Documents others share with you appear here.
          </p>
        </div>
      );
    }
    return (
      <ScrollArea className="max-h-[70vh] pr-2">
        <div className="space-y-2">
          {sharedDocuments.map((doc) => (
            <button
              key={doc.id}
              className="w-full text-left p-2 rounded-md border hover-elevate"
              onClick={() => openDocumentViewer(doc)}
              data-testid={`rail-shared-${doc.id}`}
            >
              <div className="flex items-start gap-2">
                <div className="p-1.5 bg-muted rounded-md flex-shrink-0">
                  {getFileIcon(doc.mimeType, doc.fileType)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{doc.name}</p>
                  <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                    <Avatar className="h-4 w-4">
                      <AvatarImage src={doc.sharedBy.id ? `/api/profile-photo/${doc.sharedBy.id}` : undefined} />
                      <AvatarFallback className="text-[10px]">
                        {doc.sharedBy.firstName?.[0]}{doc.sharedBy.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <span className="truncate">{doc.sharedBy.firstName} {doc.sharedBy.lastName}</span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </ScrollArea>
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function _renderSharedDocumentsFullPage() {
    if (sharedLoading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    if (!sharedDocuments || sharedDocuments.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Users className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No shared documents</h3>
          <p className="text-muted-foreground max-w-md">
            Documents shared with you by other users will appear here.
          </p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
        {sharedDocuments.map((doc) => (
          <Card key={doc.id} className="cursor-pointer hover-elevate" data-testid={`card-shared-document-${doc.id}`} onClick={() => openDocumentViewer(doc)}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-muted rounded-md">
                  {getFileIcon(doc.mimeType, doc.fileType)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{doc.name}</p>
                  {doc.description && (
                    <p className="text-sm text-muted-foreground truncate">{doc.description}</p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <Avatar className="h-5 w-5">
                      <AvatarImage src={doc.sharedBy.profileImage || undefined} />
                      <AvatarFallback className="text-xs">
                        {doc.sharedBy.firstName?.[0]}{doc.sharedBy.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs text-muted-foreground">
                      Shared by {doc.sharedBy.firstName} {doc.sharedBy.lastName}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDate(doc.sharedAt)}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-end gap-1 mt-3 pt-3 border-t" onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openDocumentViewer(doc)}
                  data-testid={`button-view-shared-${doc.id}`}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => downloadDocument(doc)}
                  data-testid={`button-download-shared-${doc.id}`}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }
}
