import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Search,
  Plus,
  MessageSquare,
  Pin,
  Eye,
  Clock,
  Tag,
  Filter,
  SortDesc,
  ChevronRight,
  Users,
  AlertTriangle,
  ShieldAlert,
  RefreshCw,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ThreadCategory {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  icon: string | null;
  sortOrder: number;
  isActive: boolean;
}

interface ThreadAuthor {
  id: string;
  firstName: string;
  lastName: string;
  profileImage: string | null;
  role: string;
  trackSpecialty: string | null;
}

interface CommunityThread {
  id: string;
  title: string;
  content: string;
  categoryId: string | null;
  authorId: string;
  isPinned: boolean;
  isLocked: boolean;
  viewCount: number;
  replyCount: number;
  lastActivityAt: Date | null;
  createdAt: Date;
  updatedAt: Date | null;
  author: ThreadAuthor;
  category: ThreadCategory | null;
}

interface AccessInfo {
  hasAccess: boolean;
  status?: string;
  reason?: string;
  revokedAt?: Date;
  revokedReason?: string;
}

const threadFormSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(200, "Title must be less than 200 characters"),
  content: z.string().min(20, "Content must be at least 20 characters"),
  categoryId: z.string().optional(),
});

type ThreadFormValues = z.infer<typeof threadFormSchema>;

function formatDate(date?: Date | string | null): string {
  if (!date) return "";
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

function getRoleLabel(role: string): string {
  switch (role) {
    case "SUPER_ADMIN": return "Super Admin";
    case "ADMIN": return "Admin";
    case "MENTOR": return "Mentor";
    case "MENTEE": return "Mentee";
    default: return role;
  }
}

function getRoleBadgeVariant(role: string): "default" | "secondary" | "outline" {
  switch (role) {
    case "SUPER_ADMIN":
    case "ADMIN":
      return "default";
    case "MENTOR":
      return "secondary";
    default:
      return "outline";
  }
}

function AccessDeniedModal({ reason, revokedReason, onClose }: { reason: string; revokedReason?: string; onClose: () => void }) {
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-destructive/10 p-3">
              <ShieldAlert className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <DialogTitle>Access Denied</DialogTitle>
              <DialogDescription>
                {reason === "NOT_MENTOR" && "The Mentor Community Board is only available to mentors."}
                {reason === "REVOKED" && "Your access to the Mentor Community Board has been revoked."}
                {reason === "NO_ACCESS" && "You do not have access to the Mentor Community Board."}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        {revokedReason && (
          <div className="rounded-md bg-muted p-4">
            <p className="text-sm text-muted-foreground">
              <strong>Reason:</strong> {revokedReason}
            </p>
          </div>
        )}
        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ThreadCard({ 
  thread, 
  onClick,
  isAdmin,
  onPin,
  onUnpin,
}: { 
  thread: CommunityThread; 
  onClick: () => void;
  isAdmin: boolean;
  onPin: () => void;
  onUnpin: () => void;
}) {
  return (
    <Card 
      className="hover-elevate cursor-pointer transition-all"
      onClick={onClick}
      data-testid={`thread-card-${thread.id}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {thread.isPinned && (
                <Pin className="h-4 w-4 text-primary shrink-0" />
              )}
              <CardTitle className="text-lg truncate">{thread.title}</CardTitle>
            </div>
            {thread.category && (
              <Badge variant="outline" className="mt-2">
                <Tag className="h-3 w-3 mr-1" />
                {thread.category.name}
              </Badge>
            )}
          </div>
          {isAdmin && (
            <Button 
              variant="ghost" 
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                thread.isPinned ? onUnpin() : onPin();
              }}
              data-testid={`button-pin-${thread.id}`}
            >
              <Pin className={`h-4 w-4 ${thread.isPinned ? "text-primary" : ""}`} />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pb-3">
        <p className="text-sm text-muted-foreground line-clamp-2">
          {thread.content}
        </p>
      </CardContent>
      <CardFooter className="flex items-center justify-between gap-4 text-sm text-muted-foreground pt-3 border-t">
        <div className="flex items-center gap-3">
          <Avatar className="h-6 w-6">
            <AvatarImage src={thread.author.profileImage || undefined} />
            <AvatarFallback className="text-xs">
              {getInitials(thread.author.firstName, thread.author.lastName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col min-w-0">
            <span className="truncate font-medium text-foreground">
              {thread.author.firstName} {thread.author.lastName}
            </span>
            <div className="flex items-center gap-1 flex-wrap">
              <Badge variant={getRoleBadgeVariant(thread.author.role)} className="text-xs px-1.5 py-0">
                {getRoleLabel(thread.author.role)}
              </Badge>
              {thread.author.trackSpecialty && (
                <span className="text-xs">{thread.author.trackSpecialty}</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <div className="flex items-center gap-1">
            <MessageSquare className="h-4 w-4" />
            <span>{thread.replyCount}</span>
          </div>
          <div className="flex items-center gap-1">
            <Eye className="h-4 w-4" />
            <span>{thread.viewCount}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span className="hidden sm:inline">{formatDate(thread.lastActivityAt || thread.createdAt)}</span>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}

function CreateThreadDialog({ 
  open, 
  onOpenChange, 
  categories,
  onSuccess,
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
  categories: ThreadCategory[];
  onSuccess: () => void;
}) {
  const { toast } = useToast();
  
  const form = useForm<ThreadFormValues>({
    resolver: zodResolver(threadFormSchema),
    defaultValues: {
      title: "",
      content: "",
      categoryId: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (values: ThreadFormValues) => {
      const response = await apiRequest("POST", "/api/community/threads", {
        ...values,
        categoryId: values.categoryId || null,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Thread created successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/community/threads"] });
      form.reset();
      onOpenChange(false);
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create thread",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: ThreadFormValues) => {
    createMutation.mutate(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Start a New Discussion</DialogTitle>
          <DialogDescription>
            Share your thoughts, questions, or resources with the mentor community.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category (Optional)</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-category">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter a descriptive title for your discussion" 
                      {...field} 
                      data-testid="input-title"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Content *</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Write your discussion content here..." 
                      className="min-h-[200px] resize-y"
                      {...field} 
                      data-testid="textarea-content"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createMutation.isPending}
                data-testid="button-submit-thread"
              >
                {createMutation.isPending ? "Creating..." : "Post Discussion"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default function CommunityPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"recent" | "created" | "replies">("recent");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showAccessDenied, setShowAccessDenied] = useState(false);
  const [accessDeniedReason, setAccessDeniedReason] = useState<string>("");
  const [revokedReason, setRevokedReason] = useState<string>("");

  const isAdmin = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";

  const { data: accessInfo, isLoading: accessLoading } = useQuery<AccessInfo>({
    queryKey: ["/api/community/access"],
    enabled: !!user,
  });

  const { data: categories = [], isLoading: categoriesLoading } = useQuery<ThreadCategory[]>({
    queryKey: ["/api/community/categories"],
    enabled: accessInfo?.hasAccess,
  });

  const { data: threads = [], isLoading: threadsLoading, refetch: refetchThreads } = useQuery<CommunityThread[]>({
    queryKey: ["/api/community/threads", selectedCategory, searchQuery, sortBy],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedCategory !== "all") params.append("categoryId", selectedCategory);
      if (searchQuery) params.append("search", searchQuery);
      params.append("sortBy", sortBy);
      const response = await fetch(`/api/community/threads?${params.toString()}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch threads");
      return response.json();
    },
    enabled: accessInfo?.hasAccess,
  });

  const pinMutation = useMutation({
    mutationFn: async (threadId: string) => {
      const response = await apiRequest("POST", `/api/community/threads/${threadId}/pin`);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Thread pinned" });
      queryClient.invalidateQueries({ queryKey: ["/api/community/threads"] });
    },
    onError: (error: any) => {
      toast({ title: "Failed to pin thread", description: error.message, variant: "destructive" });
    },
  });

  const unpinMutation = useMutation({
    mutationFn: async (threadId: string) => {
      const response = await apiRequest("POST", `/api/community/threads/${threadId}/unpin`);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Thread unpinned" });
      queryClient.invalidateQueries({ queryKey: ["/api/community/threads"] });
    },
    onError: (error: any) => {
      toast({ title: "Failed to unpin thread", description: error.message, variant: "destructive" });
    },
  });

  if (accessLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  if (!accessInfo?.hasAccess) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <div className="rounded-full bg-destructive/10 p-4">
            <ShieldAlert className="h-12 w-12 text-destructive" />
          </div>
          <h2 className="text-xl font-semibold">Access Denied</h2>
          <p className="text-muted-foreground text-center max-w-md">
            {accessInfo?.reason === "NOT_MENTOR" && "The Mentor Community Board is only available to mentors and administrators."}
            {accessInfo?.reason === "REVOKED" && "Your access to the Mentor Community Board has been revoked."}
            {accessInfo?.reason === "NO_ACCESS" && "You do not have access to the Mentor Community Board."}
          </p>
          {accessInfo?.revokedReason && (
            <Card className="max-w-md">
              <CardContent className="pt-4">
                <p className="text-sm">
                  <strong>Reason:</strong> {accessInfo.revokedReason}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </DashboardLayout>
    );
  }

  const pinnedThreads = threads.filter(t => t.isPinned);
  const regularThreads = threads.filter(t => !t.isPinned);
  const sortedThreads = [...pinnedThreads, ...regularThreads];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Mentor Community Board</h1>
            <p className="text-muted-foreground">
              Connect, share, and learn with fellow mentors
            </p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)} data-testid="button-new-thread">
            <Plus className="h-4 w-4 mr-2" />
            New Discussion
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search discussions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="input-search"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full sm:w-[200px]" data-testid="filter-category">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
            <SelectTrigger className="w-full sm:w-[180px]" data-testid="sort-by">
              <SortDesc className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Most Recent</SelectItem>
              <SelectItem value="created">Newest First</SelectItem>
              <SelectItem value="replies">Most Replies</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {categoriesLoading || threadsLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/4 mt-2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-12 w-full" />
                </CardContent>
                <CardFooter>
                  <Skeleton className="h-8 w-full" />
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : sortedThreads.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No discussions yet</h3>
              <p className="text-muted-foreground text-center max-w-sm mt-2">
                Be the first to start a discussion in the mentor community!
              </p>
              <Button 
                className="mt-4" 
                onClick={() => setShowCreateDialog(true)}
                data-testid="button-first-thread"
              >
                <Plus className="h-4 w-4 mr-2" />
                Start Discussion
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {sortedThreads.map((thread) => (
              <ThreadCard
                key={thread.id}
                thread={thread}
                onClick={() => {
                  window.location.href = `/community/${thread.id}`;
                }}
                isAdmin={isAdmin}
                onPin={() => pinMutation.mutate(thread.id)}
                onUnpin={() => unpinMutation.mutate(thread.id)}
              />
            ))}
          </div>
        )}
      </div>

      <CreateThreadDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        categories={categories}
        onSuccess={() => refetchThreads()}
      />

      {showAccessDenied && (
        <AccessDeniedModal
          reason={accessDeniedReason}
          revokedReason={revokedReason}
          onClose={() => setShowAccessDenied(false)}
        />
      )}
    </DashboardLayout>
  );
}
