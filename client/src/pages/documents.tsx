import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { ObjectUploader } from "@/components/ObjectUploader";
import { useUpload } from "@/hooks/use-upload";
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
  ArrowLeft,
  Filter,
  FolderCog,
  FolderHeart,
  Users,
  Send,
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
  const { getUploadParameters } = useUpload();

  const [activeTab, setActiveTab] = useState<"system" | "personal" | "shared">("personal");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [folderPath, setFolderPath] = useState<Folder[]>([]);
  
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [shareDocumentId, setShareDocumentId] = useState<string | null>(null);
  const [shareUserId, setShareUserId] = useState<string>("");
  const [shareMessage, setShareMessage] = useState("");

  const isAdmin = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";

  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showFolderDialog, setShowFolderDialog] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderDescription, setNewFolderDescription] = useState("");

  const [uploadedFile, setUploadedFile] = useState<{
    objectPath: string;
    name: string;
    size: number;
    contentType: string;
  } | null>(null);
  const [documentName, setDocumentName] = useState("");
  const [documentDescription, setDocumentDescription] = useState("");
  const [documentCategory, setDocumentCategory] = useState<DocumentCategory>("OTHER");
  const [documentVisibility, setDocumentVisibility] = useState<DocumentVisibility>("PRIVATE");

  const { data: systemFolder } = useQuery<Folder>({
    queryKey: ["/api/folders/system"],
    enabled: activeTab === "system",
  });

  const { data: personalFolder } = useQuery<Folder>({
    queryKey: ["/api/folders/personal"],
    enabled: activeTab === "personal",
  });

  const { data: sharedDocuments, isLoading: sharedLoading } = useQuery<SharedDocument[]>({
    queryKey: ["/api/documents/shared-with-me"],
    enabled: activeTab === "shared",
  });

  const { data: shareableUsers } = useQuery<{ id: string; firstName: string; lastName: string; email: string }[]>({
    queryKey: ["/api/users/messageable"],
    enabled: showShareDialog,
  });

  const effectiveFolderId = activeTab === "system" 
    ? (currentFolderId || systemFolder?.id || null)
    : activeTab === "personal"
    ? (currentFolderId || personalFolder?.id || null)
    : null;

  const { data: documents, isLoading: docsLoading } = useQuery<Document[]>({
    queryKey: ["/api/documents", effectiveFolderId, categoryFilter, searchQuery, activeTab],
    queryFn: async () => {
      if (activeTab === "shared") return [];
      const params = new URLSearchParams();
      if (effectiveFolderId) {
        params.set("folderId", effectiveFolderId);
      }
      if (categoryFilter) params.set("category", categoryFilter);
      if (searchQuery) params.set("search", searchQuery);
      const res = await fetch(`/api/documents?${params.toString()}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch documents");
      return res.json();
    },
    enabled: activeTab !== "shared" && (activeTab === "system" ? !!systemFolder : !!personalFolder),
  });

  const { data: folders, isLoading: foldersLoading } = useQuery<Folder[]>({
    queryKey: ["/api/folders", effectiveFolderId, activeTab],
    queryFn: async () => {
      if (activeTab === "shared") return [];
      const params = new URLSearchParams();
      if (effectiveFolderId) {
        params.set("parentFolderId", effectiveFolderId);
      }
      const res = await fetch(`/api/folders?${params.toString()}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch folders");
      return res.json();
    },
    enabled: activeTab !== "shared" && (activeTab === "system" ? !!systemFolder : !!personalFolder),
  });

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
    }) => {
      const res = await apiRequest("POST", "/api/documents", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      toast({ title: "Document uploaded successfully" });
      setShowUploadDialog(false);
      resetUploadForm();
    },
    onError: () => {
      toast({ title: "Failed to create document", variant: "destructive" });
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
    mutationFn: async (data: { documentId: string; userId: string; message?: string }) => {
      const res = await apiRequest("POST", `/api/documents/${data.documentId}/share`, {
        userId: data.userId,
        message: data.message,
      });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Document shared successfully" });
      setShowShareDialog(false);
      setShareDocumentId(null);
      setShareUserId("");
      setShareMessage("");
    },
    onError: () => {
      toast({ title: "Failed to share document", variant: "destructive" });
    },
  });

  const handleShareDocument = () => {
    if (!shareDocumentId || !shareUserId) return;
    shareDocumentMutation.mutate({
      documentId: shareDocumentId,
      userId: shareUserId,
      message: shareMessage,
    });
  };

  const openShareDialog = (doc: Document) => {
    setShareDocumentId(doc.id);
    setShowShareDialog(true);
  };

  const downloadDocument = async (doc: Document) => {
    try {
      // Use fetch with credentials to get the file as a blob
      const response = await fetch(`/api/documents/${doc.id}/download`, {
        credentials: "include",
      });
      
      if (!response.ok) {
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

  const navigateToFolder = async (folder: Folder) => {
    setFolderPath([...folderPath, folder]);
    setCurrentFolderId(folder.id);
  };

  const navigateBack = () => {
    const newPath = [...folderPath];
    newPath.pop();
    setFolderPath(newPath);
    setCurrentFolderId(newPath.length > 0 ? newPath[newPath.length - 1].id : null);
  };

  const navigateToRoot = () => {
    setFolderPath([]);
    setCurrentFolderId(null);
  };

  const resetUploadForm = () => {
    setUploadedFile(null);
    setDocumentName("");
    setDocumentDescription("");
    setDocumentCategory("OTHER");
    setDocumentVisibility("PRIVATE");
  };

  const handleUploadComplete = (result: any) => {
    const files = result.successful || [];
    if (files.length > 0) {
      const file = files[0];
      const objectPath = file.response?.body?.objectPath || `/objects/uploads/${file.name}`;
      setUploadedFile({
        objectPath,
        name: file.name,
        size: file.size,
        contentType: file.type,
      });
      setDocumentName(file.name);
    }
  };

  const handleSaveDocument = () => {
    if (!uploadedFile) return;
    
    // Use effectiveFolderId to save to the correct folder based on active tab
    const targetFolderId = currentFolderId || effectiveFolderId;
    
    createDocumentMutation.mutate({
      name: documentName || uploadedFile.name,
      description: documentDescription,
      fileUrl: uploadedFile.objectPath,
      fileType: uploadedFile.contentType.split("/")[1],
      fileSize: uploadedFile.size,
      mimeType: uploadedFile.contentType,
      category: documentCategory,
      visibility: documentVisibility,
      folderId: targetFolderId,
    });
  };

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return;
    
    // Use effectiveFolderId for folder creation
    const targetParentId = currentFolderId || effectiveFolderId;
    
    createFolderMutation.mutate({
      name: newFolderName,
      description: newFolderDescription,
      parentFolderId: targetParentId,
    });
  };

  const isLoading = docsLoading || foldersLoading || sharedLoading;
  
  // Check if folders are ready for upload operations
  const isFolderReady = activeTab === "shared" ? true : 
    (activeTab === "system" ? !!systemFolder : !!personalFolder);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab as "system" | "personal" | "shared");
    setFolderPath([]);
    setCurrentFolderId(null);
    setSearchQuery("");
    setCategoryFilter("");
  };

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
                  disabled={activeTab === "shared" || !isFolderReady}
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
                        maxNumberOfFiles={1}
                        maxFileSize={52428800}
                        onGetUploadParameters={getUploadParameters}
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
                      Save Document
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
                  disabled={activeTab === "shared" || !isFolderReady}
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

        <Tabs value={activeTab} onValueChange={handleTabChange} className="flex-1 flex flex-col">
          <TabsList className="w-fit mx-4 mt-4">
            <TabsTrigger value="system" className="gap-2" data-testid="tab-system-resources">
              <FolderCog className="h-4 w-4" />
              System Resources
            </TabsTrigger>
            <TabsTrigger value="personal" className="gap-2" data-testid="tab-my-documents">
              <FolderHeart className="h-4 w-4" />
              My Documents
            </TabsTrigger>
            <TabsTrigger value="shared" className="gap-2" data-testid="tab-shared-with-me">
              <Users className="h-4 w-4" />
              Shared With Me
            </TabsTrigger>
          </TabsList>

          <TabsContent value="system" className="flex-1 flex flex-col mt-0 px-4">
            {renderFiltersAndContent()}
          </TabsContent>

          <TabsContent value="personal" className="flex-1 flex flex-col mt-0 px-4">
            {renderFiltersAndContent()}
          </TabsContent>

          <TabsContent value="shared" className="flex-1 flex flex-col mt-0 px-4">
            {renderSharedDocuments()}
          </TabsContent>
        </Tabs>

        {/* Share Document Dialog */}
        <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Share Document</DialogTitle>
              <DialogDescription>
                Share this document with another user. They will receive a notification.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Share with User</Label>
                <Select value={shareUserId} onValueChange={setShareUserId}>
                  <SelectTrigger data-testid="select-share-user">
                    <SelectValue placeholder="Select a user" />
                  </SelectTrigger>
                  <SelectContent>
                    {shareableUsers?.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.firstName} {u.lastName} ({u.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="share-message">Message (optional)</Label>
                <Textarea
                  id="share-message"
                  value={shareMessage}
                  onChange={(e) => setShareMessage(e.target.value)}
                  placeholder="Add a message for the recipient..."
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
                disabled={!shareUserId || shareDocumentMutation.isPending}
                data-testid="button-confirm-share"
              >
                <Send className="h-4 w-4 mr-2" />
                Share
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );

  function renderFiltersAndContent() {
    return (
      <>
        <div className="flex flex-wrap items-center gap-4 mt-4">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              data-testid="input-search-documents"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[150px]" data-testid="select-category-filter">
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
              data-testid="button-view-grid"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="icon"
              onClick={() => setViewMode("list")}
              data-testid="button-view-list"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {folderPath.length > 0 && (
          <div className="flex items-center gap-2 mt-4 text-sm">
            <Button variant="ghost" size="sm" onClick={navigateToRoot} data-testid="button-nav-root">
              Documents
            </Button>
            {folderPath.map((folder, index) => (
              <div key={folder.id} className="flex items-center gap-2">
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const newPath = folderPath.slice(0, index + 1);
                    setFolderPath(newPath);
                    setCurrentFolderId(folder.id);
                  }}
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
                      onClick={() => navigateToFolder(folder)}
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
                  <Button onClick={() => setShowUploadDialog(true)} data-testid="button-empty-upload">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Document
                  </Button>
                </div>
              ) : viewMode === "grid" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {documents?.map((doc) => (
                    <Card key={doc.id} className="group" data-testid={`card-document-${doc.id}`}>
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
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => downloadDocument(doc)}
                              data-testid={`button-download-${doc.id}`}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => downloadDocument(doc)}>
                                  <Download className="h-4 w-4 mr-2" />
                                  Download
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
              ) : (
                <div className="space-y-2">
                  {documents?.map((doc) => (
                    <Card key={doc.id} data-testid={`row-document-${doc.id}`}>
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
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => downloadDocument(doc)}
                              data-testid={`button-download-${doc.id}`}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => downloadDocument(doc)}>
                                  <Download className="h-4 w-4 mr-2" />
                                  Download
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

  function renderSharedDocuments() {
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
          <Card key={doc.id} data-testid={`card-shared-document-${doc.id}`}>
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
              <div className="flex items-center justify-end gap-1 mt-3 pt-3 border-t">
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
