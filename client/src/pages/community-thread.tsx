import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
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
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Pin,
  Lock,
  Eye,
  Clock,
  Tag,
  MessageSquare,
  Edit,
  Trash2,
  RefreshCw,
  Send,
  Reply as ReplyIcon,
  MoreVertical,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDistanceToNow, format } from "date-fns";

interface ThreadCategory {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  icon: string | null;
}

interface ThreadAuthor {
  id: string;
  firstName: string;
  lastName: string;
  profileImage: string | null;
  role: string;
  trackSpecialty: string | null;
}

interface ThreadReply {
  id: string;
  threadId: string;
  authorId: string;
  content: string;
  parentReplyId: string | null;
  createdAt: Date;
  updatedAt: Date | null;
  isEdited: boolean;
  author: ThreadAuthor;
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
  replies: ThreadReply[];
}

const replyFormSchema = z.object({
  content: z.string().min(2, "Reply must be at least 2 characters"),
});

type ReplyFormValues = z.infer<typeof replyFormSchema>;

const editThreadFormSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(200, "Title must be less than 200 characters"),
  content: z.string().min(20, "Content must be at least 20 characters"),
});

type EditThreadFormValues = z.infer<typeof editThreadFormSchema>;

function formatDate(date?: Date | string | null): string {
  if (!date) return "";
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

function formatFullDate(date?: Date | string | null): string {
  if (!date) return "";
  return format(new Date(date), "MMMM d, yyyy 'at' h:mm a");
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

function canEditOrDelete(authorId: string, createdAt: Date | string, userId: string, isAdmin: boolean): boolean {
  if (isAdmin) return true;
  if (authorId !== userId) return false;
  const createdTime = new Date(createdAt).getTime();
  const now = Date.now();
  const twentyFourHours = 24 * 60 * 60 * 1000;
  return (now - createdTime) < twentyFourHours;
}

function ReplyCard({
  reply,
  userId,
  isAdmin,
  onEdit,
  onDelete,
}: {
  reply: ThreadReply;
  userId: string;
  isAdmin: boolean;
  onEdit: (reply: ThreadReply) => void;
  onDelete: (replyId: string) => void;
}) {
  const canModify = canEditOrDelete(reply.authorId, reply.createdAt, userId, isAdmin);

  return (
    <div className="flex gap-4 py-4" data-testid={`reply-${reply.id}`}>
      <Avatar className="h-10 w-10 shrink-0">
        <AvatarImage src={reply.author.profileImage || undefined} />
        <AvatarFallback>
          {getInitials(reply.author.firstName, reply.author.lastName)}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium">
              {reply.author.firstName} {reply.author.lastName}
            </span>
            <Badge variant={getRoleBadgeVariant(reply.author.role)} className="text-xs px-1.5 py-0">
              {getRoleLabel(reply.author.role)}
            </Badge>
            {reply.author.trackSpecialty && (
              <span className="text-xs text-muted-foreground">{reply.author.trackSpecialty}</span>
            )}
            <span className="text-xs text-muted-foreground">
              {formatDate(reply.createdAt)}
              {reply.isEdited && " (edited)"}
            </span>
          </div>
          {canModify && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" data-testid={`button-reply-menu-${reply.id}`}>
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(reply)} data-testid={`button-edit-reply-${reply.id}`}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => onDelete(reply.id)} 
                  className="text-destructive"
                  data-testid={`button-delete-reply-${reply.id}`}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        <p className="mt-2 text-sm whitespace-pre-wrap">{reply.content}</p>
      </div>
    </div>
  );
}

export default function CommunityThreadPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const params = useParams<{ id: string }>();
  const threadId = params.id;

  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingReply, setEditingReply] = useState<ThreadReply | null>(null);
  const [deletingReplyId, setDeletingReplyId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");

  const isAdmin = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";

  const { data: thread, isLoading, refetch } = useQuery<CommunityThread>({
    queryKey: ["/api/community/threads", threadId],
    enabled: !!threadId,
  });

  const editThreadForm = useForm<EditThreadFormValues>({
    resolver: zodResolver(editThreadFormSchema),
    defaultValues: {
      title: thread?.title || "",
      content: thread?.content || "",
    },
  });

  const editThreadMutation = useMutation({
    mutationFn: async (values: EditThreadFormValues) => {
      const response = await apiRequest("PATCH", `/api/community/threads/${threadId}`, values);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Thread updated" });
      queryClient.invalidateQueries({ queryKey: ["/api/community/threads", threadId] });
      setShowEditDialog(false);
    },
    onError: (error: any) => {
      toast({ title: "Failed to update thread", description: error.message, variant: "destructive" });
    },
  });

  const deleteThreadMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/community/threads/${threadId}`);
    },
    onSuccess: () => {
      toast({ title: "Thread deleted" });
      navigate("/community");
    },
    onError: (error: any) => {
      toast({ title: "Failed to delete thread", description: error.message, variant: "destructive" });
    },
  });

  const createReplyMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await apiRequest("POST", `/api/community/threads/${threadId}/replies`, { content });
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Reply posted" });
      setReplyContent("");
      queryClient.invalidateQueries({ queryKey: ["/api/community/threads", threadId] });
    },
    onError: (error: any) => {
      toast({ title: "Failed to post reply", description: error.message, variant: "destructive" });
    },
  });

  const editReplyMutation = useMutation({
    mutationFn: async ({ id, content }: { id: string; content: string }) => {
      const response = await apiRequest("PATCH", `/api/community/replies/${id}`, { content });
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Reply updated" });
      setEditingReply(null);
      queryClient.invalidateQueries({ queryKey: ["/api/community/threads", threadId] });
    },
    onError: (error: any) => {
      toast({ title: "Failed to update reply", description: error.message, variant: "destructive" });
    },
  });

  const deleteReplyMutation = useMutation({
    mutationFn: async (replyId: string) => {
      await apiRequest("DELETE", `/api/community/replies/${replyId}`);
    },
    onSuccess: () => {
      toast({ title: "Reply deleted" });
      setDeletingReplyId(null);
      queryClient.invalidateQueries({ queryKey: ["/api/community/threads", threadId] });
    },
    onError: (error: any) => {
      toast({ title: "Failed to delete reply", description: error.message, variant: "destructive" });
    },
  });

  const pinMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/community/threads/${threadId}/pin`);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Thread pinned" });
      queryClient.invalidateQueries({ queryKey: ["/api/community/threads", threadId] });
    },
  });

  const unpinMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/community/threads/${threadId}/unpin`);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Thread unpinned" });
      queryClient.invalidateQueries({ queryKey: ["/api/community/threads", threadId] });
    },
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <Card>
            <CardHeader>
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-1/4 mt-2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  if (!thread) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <h2 className="text-xl font-semibold">Thread not found</h2>
          <Button onClick={() => navigate("/community")} data-testid="button-back-to-community">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Community
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const canModifyThread = canEditOrDelete(thread.authorId, thread.createdAt, user?.id || "", isAdmin);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            onClick={() => navigate("/community")}
            data-testid="button-back"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  {thread.isPinned && (
                    <Pin className="h-5 w-5 text-primary shrink-0" />
                  )}
                  {thread.isLocked && (
                    <Lock className="h-5 w-5 text-muted-foreground shrink-0" />
                  )}
                  <CardTitle className="text-2xl">{thread.title}</CardTitle>
                </div>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  {thread.category && (
                    <Badge variant="outline">
                      <Tag className="h-3 w-3 mr-1" />
                      {thread.category.name}
                    </Badge>
                  )}
                  <span className="text-sm text-muted-foreground">
                    Posted {formatFullDate(thread.createdAt)}
                  </span>
                  {thread.updatedAt && thread.updatedAt !== thread.createdAt && (
                    <span className="text-sm text-muted-foreground">(edited)</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isAdmin && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => thread.isPinned ? unpinMutation.mutate() : pinMutation.mutate()}
                    data-testid="button-toggle-pin"
                  >
                    <Pin className={`h-4 w-4 mr-1 ${thread.isPinned ? "text-primary" : ""}`} />
                    {thread.isPinned ? "Unpin" : "Pin"}
                  </Button>
                )}
                {canModifyThread && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" data-testid="button-thread-menu">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem 
                        onClick={() => {
                          editThreadForm.reset({
                            title: thread.title,
                            content: thread.content,
                          });
                          setShowEditDialog(true);
                        }}
                        data-testid="button-edit-thread"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Thread
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => setShowDeleteDialog(true)}
                        className="text-destructive"
                        data-testid="button-delete-thread"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Thread
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
          </CardHeader>
          <Separator />
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <Avatar className="h-12 w-12 shrink-0">
                <AvatarImage src={thread.author.profileImage || undefined} />
                <AvatarFallback>
                  {getInitials(thread.author.firstName, thread.author.lastName)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium">
                    {thread.author.firstName} {thread.author.lastName}
                  </span>
                  <Badge variant={getRoleBadgeVariant(thread.author.role)} className="text-xs">
                    {getRoleLabel(thread.author.role)}
                  </Badge>
                  {thread.author.trackSpecialty && (
                    <span className="text-sm text-muted-foreground">{thread.author.trackSpecialty}</span>
                  )}
                </div>
                <p className="mt-4 whitespace-pre-wrap">{thread.content}</p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="border-t pt-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                <span>{thread.viewCount} views</span>
              </div>
              <div className="flex items-center gap-1">
                <MessageSquare className="h-4 w-4" />
                <span>{thread.replyCount} replies</span>
              </div>
            </div>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              <MessageSquare className="h-5 w-5 inline mr-2" />
              Replies ({thread.replies?.length || 0})
            </CardTitle>
          </CardHeader>
          <Separator />
          <CardContent className="pt-0">
            {thread.replies && thread.replies.length > 0 ? (
              <div className="divide-y">
                {thread.replies.map((reply) => (
                  <ReplyCard
                    key={reply.id}
                    reply={reply}
                    userId={user?.id || ""}
                    isAdmin={isAdmin}
                    onEdit={setEditingReply}
                    onDelete={setDeletingReplyId}
                  />
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No replies yet. Be the first to respond!</p>
              </div>
            )}

            {!thread.isLocked && (
              <div className="mt-6 pt-6 border-t">
                <div className="flex gap-4">
                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarImage src={user?.profileImage || undefined} />
                    <AvatarFallback>
                      {user ? getInitials(user.firstName, user.lastName) : "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <Textarea
                      placeholder="Write a reply..."
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      className="min-h-[100px] resize-y"
                      data-testid="textarea-reply"
                    />
                    <div className="mt-2 flex justify-end">
                      <Button
                        onClick={() => {
                          if (replyContent.trim()) {
                            createReplyMutation.mutate(replyContent);
                          }
                        }}
                        disabled={!replyContent.trim() || createReplyMutation.isPending}
                        data-testid="button-post-reply"
                      >
                        <Send className="h-4 w-4 mr-2" />
                        {createReplyMutation.isPending ? "Posting..." : "Post Reply"}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {thread.isLocked && (
              <div className="mt-6 pt-6 border-t">
                <div className="flex items-center gap-2 justify-center text-muted-foreground">
                  <Lock className="h-4 w-4" />
                  <span>This thread is locked. No new replies can be posted.</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Thread</DialogTitle>
            <DialogDescription>
              Make changes to your thread.
            </DialogDescription>
          </DialogHeader>
          <Form {...editThreadForm}>
            <form onSubmit={editThreadForm.handleSubmit((values) => editThreadMutation.mutate(values))} className="space-y-4">
              <FormField
                control={editThreadForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-edit-title" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editThreadForm.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Content</FormLabel>
                    <FormControl>
                      <Textarea {...field} className="min-h-[200px]" data-testid="textarea-edit-content" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={editThreadMutation.isPending} data-testid="button-save-thread">
                  {editThreadMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Thread?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the thread and all its replies.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteThreadMutation.mutate()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete-thread"
            >
              {deleteThreadMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!editingReply} onOpenChange={(open) => !open && setEditingReply(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Reply</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              value={editingReply?.content || ""}
              onChange={(e) => setEditingReply(prev => prev ? { ...prev, content: e.target.value } : null)}
              className="min-h-[100px]"
              data-testid="textarea-edit-reply"
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingReply(null)}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (editingReply) {
                    editReplyMutation.mutate({ id: editingReply.id, content: editingReply.content });
                  }
                }}
                disabled={editReplyMutation.isPending}
                data-testid="button-save-reply"
              >
                {editReplyMutation.isPending ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingReplyId} onOpenChange={(open) => !open && setDeletingReplyId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Reply?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingReplyId && deleteReplyMutation.mutate(deletingReplyId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete-reply"
            >
              {deleteReplyMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
