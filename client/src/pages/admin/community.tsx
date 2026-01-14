import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layouts/admin-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  Users,
  GraduationCap,
  Shield,
  ShieldCheck,
  ShieldX,
  MoreVertical,
  Pin,
  Lock,
  Unlock,
  Trash2,
  Eye,
  MessageSquare,
  Tag,
  Edit,
  Plus,
  RefreshCw,
  Clock,
  CheckCircle,
  XCircle,
  Filter,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  trackSpecialty: string | null;
  profileImage: string | null;
}

interface BoardAccess {
  id: string;
  userId: string;
  status: "ACTIVE" | "REVOKED";
  revokedAt: Date | null;
  revokedBy: string | null;
  revokedReason: string | null;
  grantedAt: Date | null;
  grantedBy: string | null;
  createdAt: Date;
  updatedAt: Date | null;
  user: User;
}

interface ThreadCategory {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  icon: string | null;
  sortOrder: number;
  isActive: boolean;
}

interface Thread {
  id: string;
  title: string;
  content: string;
  authorId: string;
  isPinned: boolean;
  isLocked: boolean;
  viewCount: number;
  replyCount: number;
  createdAt: Date;
  author: User;
  category: ThreadCategory | null;
}

function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

function formatDate(date?: Date | string | null): string {
  if (!date) return "Never";
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

function formatFullDate(date?: Date | string | null): string {
  if (!date) return "N/A";
  return format(new Date(date), "MMM d, yyyy h:mm a");
}

function MentorAccessTab() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [showRevokeDialog, setShowRevokeDialog] = useState(false);
  const [revokeReason, setRevokeReason] = useState("");
  const [userToRevoke, setUserToRevoke] = useState<string | null>(null);

  const { data: accessRecords = [], isLoading } = useQuery<BoardAccess[]>({
    queryKey: ["/api/admin/community/access"],
  });

  const { data: mentors = [] } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
    select: (users: User[]) => users.filter((u) => u.role === "MENTOR"),
  });

  const grantMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await apiRequest("POST", `/api/admin/community/access/${userId}/grant`);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Access granted" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/community/access"] });
    },
    onError: (error: any) => {
      toast({ title: "Failed to grant access", description: error.message, variant: "destructive" });
    },
  });

  const revokeMutation = useMutation({
    mutationFn: async ({ userId, reason }: { userId: string; reason?: string }) => {
      const response = await apiRequest("POST", `/api/admin/community/access/${userId}/revoke`, { reason });
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Access revoked" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/community/access"] });
      setShowRevokeDialog(false);
      setRevokeReason("");
      setUserToRevoke(null);
    },
    onError: (error: any) => {
      toast({ title: "Failed to revoke access", description: error.message, variant: "destructive" });
    },
  });

  const bulkGrantMutation = useMutation({
    mutationFn: async (userIds: string[]) => {
      await Promise.all(userIds.map((id) => apiRequest("POST", `/api/admin/community/access/${id}/grant`)));
    },
    onSuccess: () => {
      toast({ title: `Access granted to ${selectedUsers.size} mentors` });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/community/access"] });
      setSelectedUsers(new Set());
    },
  });

  const accessMap = new Map(accessRecords.map((a) => [a.userId, a]));

  const filteredMentors = mentors.filter((mentor) => {
    const matchesSearch =
      mentor.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mentor.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mentor.email.toLowerCase().includes(searchQuery.toLowerCase());

    const access = accessMap.get(mentor.id);
    const status = access?.status || "NONE";

    if (statusFilter === "all") return matchesSearch;
    if (statusFilter === "active") return matchesSearch && status === "ACTIVE";
    if (statusFilter === "revoked") return matchesSearch && status === "REVOKED";
    if (statusFilter === "none") return matchesSearch && status === "NONE";
    return matchesSearch;
  });

  const toggleSelect = (userId: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const selectAll = () => {
    if (selectedUsers.size === filteredMentors.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(filteredMentors.map((m) => m.id)));
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-1 gap-2 w-full sm:w-auto">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search mentors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="input-search-mentors"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]" data-testid="filter-mentor-status">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="revoked">Revoked</SelectItem>
              <SelectItem value="none">No Access</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {selectedUsers.size > 0 && (
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => bulkGrantMutation.mutate(Array.from(selectedUsers))}
              disabled={bulkGrantMutation.isPending}
              data-testid="button-bulk-grant-mentor"
            >
              <ShieldCheck className="h-4 w-4 mr-2" />
              Grant Access ({selectedUsers.size})
            </Button>
          </div>
        )}
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedUsers.size === filteredMentors.length && filteredMentors.length > 0}
                  onCheckedChange={selectAll}
                  data-testid="checkbox-select-all-mentors"
                />
              </TableHead>
              <TableHead>Mentor</TableHead>
              <TableHead>Track</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Changed</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredMentors.map((mentor) => {
              const access = accessMap.get(mentor.id);
              const status = access?.status || "NONE";
              return (
                <TableRow key={mentor.id} data-testid={`row-mentor-${mentor.id}`}>
                  <TableCell>
                    <Checkbox
                      checked={selectedUsers.has(mentor.id)}
                      onCheckedChange={() => toggleSelect(mentor.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={mentor.profileImage || undefined} />
                        <AvatarFallback className="text-xs">
                          {getInitials(mentor.firstName, mentor.lastName)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">
                          {mentor.firstName} {mentor.lastName}
                        </div>
                        <div className="text-sm text-muted-foreground">{mentor.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{mentor.trackSpecialty || "-"}</TableCell>
                  <TableCell>
                    {status === "ACTIVE" && (
                      <Badge variant="default" className="bg-green-600">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Active
                      </Badge>
                    )}
                    {status === "REVOKED" && (
                      <Badge variant="destructive">
                        <XCircle className="h-3 w-3 mr-1" />
                        Revoked
                      </Badge>
                    )}
                    {status === "NONE" && (
                      <Badge variant="secondary">No Access</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {access?.status === "REVOKED" && access.revokedAt
                      ? formatDate(access.revokedAt)
                      : access?.grantedAt
                      ? formatDate(access.grantedAt)
                      : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" data-testid={`menu-mentor-${mentor.id}`}>
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {status !== "ACTIVE" && (
                          <DropdownMenuItem
                            onClick={() => grantMutation.mutate(mentor.id)}
                            data-testid={`grant-mentor-${mentor.id}`}
                          >
                            <ShieldCheck className="h-4 w-4 mr-2" />
                            Grant Access
                          </DropdownMenuItem>
                        )}
                        {status === "ACTIVE" && (
                          <DropdownMenuItem
                            onClick={() => {
                              setUserToRevoke(mentor.id);
                              setShowRevokeDialog(true);
                            }}
                            className="text-destructive"
                            data-testid={`revoke-mentor-${mentor.id}`}
                          >
                            <ShieldX className="h-4 w-4 mr-2" />
                            Revoke Access
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        {filteredMentors.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">
            No mentors found matching your criteria.
          </div>
        )}
      </Card>

      <Dialog open={showRevokeDialog} onOpenChange={setShowRevokeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revoke Community Access</DialogTitle>
            <DialogDescription>
              This will remove the mentor's access to the Mentor Community Board.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Reason (optional)</label>
              <Textarea
                placeholder="Provide a reason for revoking access..."
                value={revokeReason}
                onChange={(e) => setRevokeReason(e.target.value)}
                className="mt-2"
                data-testid="textarea-revoke-reason"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRevokeDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => userToRevoke && revokeMutation.mutate({ userId: userToRevoke, reason: revokeReason })}
              disabled={revokeMutation.isPending}
              data-testid="button-confirm-revoke"
            >
              {revokeMutation.isPending ? "Revoking..." : "Revoke Access"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MenteeAccessTab() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [showRevokeDialog, setShowRevokeDialog] = useState(false);
  const [revokeReason, setRevokeReason] = useState("");
  const [userToRevoke, setUserToRevoke] = useState<string | null>(null);

  const { data: accessRecords = [], isLoading } = useQuery<BoardAccess[]>({
    queryKey: ["/api/admin/mentee-community/access"],
  });

  const { data: mentees = [] } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
    select: (users: User[]) => users.filter((u) => u.role === "MENTEE"),
  });

  const grantMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await apiRequest("POST", `/api/admin/mentee-community/access/${userId}/grant`);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Access granted" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/mentee-community/access"] });
    },
    onError: (error: any) => {
      toast({ title: "Failed to grant access", description: error.message, variant: "destructive" });
    },
  });

  const revokeMutation = useMutation({
    mutationFn: async ({ userId, reason }: { userId: string; reason?: string }) => {
      const response = await apiRequest("POST", `/api/admin/mentee-community/access/${userId}/revoke`, { reason });
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Access revoked" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/mentee-community/access"] });
      setShowRevokeDialog(false);
      setRevokeReason("");
      setUserToRevoke(null);
    },
    onError: (error: any) => {
      toast({ title: "Failed to revoke access", description: error.message, variant: "destructive" });
    },
  });

  const bulkGrantMutation = useMutation({
    mutationFn: async (userIds: string[]) => {
      await Promise.all(userIds.map((id) => apiRequest("POST", `/api/admin/mentee-community/access/${id}/grant`)));
    },
    onSuccess: () => {
      toast({ title: `Access granted to ${selectedUsers.size} mentees` });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/mentee-community/access"] });
      setSelectedUsers(new Set());
    },
  });

  const accessMap = new Map(accessRecords.map((a) => [a.userId, a]));

  const filteredMentees = mentees.filter((mentee) => {
    const matchesSearch =
      mentee.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mentee.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mentee.email.toLowerCase().includes(searchQuery.toLowerCase());

    const access = accessMap.get(mentee.id);
    const status = access?.status || "NONE";

    if (statusFilter === "all") return matchesSearch;
    if (statusFilter === "active") return matchesSearch && status === "ACTIVE";
    if (statusFilter === "revoked") return matchesSearch && status === "REVOKED";
    if (statusFilter === "none") return matchesSearch && status === "NONE";
    return matchesSearch;
  });

  const toggleSelect = (userId: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const selectAll = () => {
    if (selectedUsers.size === filteredMentees.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(filteredMentees.map((m) => m.id)));
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-1 gap-2 w-full sm:w-auto">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search mentees..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="input-search-mentees"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]" data-testid="filter-mentee-status">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="revoked">Revoked</SelectItem>
              <SelectItem value="none">No Access</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {selectedUsers.size > 0 && (
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => bulkGrantMutation.mutate(Array.from(selectedUsers))}
              disabled={bulkGrantMutation.isPending}
              data-testid="button-bulk-grant-mentee"
            >
              <ShieldCheck className="h-4 w-4 mr-2" />
              Grant Access ({selectedUsers.size})
            </Button>
          </div>
        )}
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedUsers.size === filteredMentees.length && filteredMentees.length > 0}
                  onCheckedChange={selectAll}
                  data-testid="checkbox-select-all-mentees"
                />
              </TableHead>
              <TableHead>Mentee</TableHead>
              <TableHead>Track</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Changed</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredMentees.map((mentee) => {
              const access = accessMap.get(mentee.id);
              const status = access?.status || "NONE";
              return (
                <TableRow key={mentee.id} data-testid={`row-mentee-${mentee.id}`}>
                  <TableCell>
                    <Checkbox
                      checked={selectedUsers.has(mentee.id)}
                      onCheckedChange={() => toggleSelect(mentee.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={mentee.profileImage || undefined} />
                        <AvatarFallback className="text-xs">
                          {getInitials(mentee.firstName, mentee.lastName)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">
                          {mentee.firstName} {mentee.lastName}
                        </div>
                        <div className="text-sm text-muted-foreground">{mentee.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{mentee.trackSpecialty || "-"}</TableCell>
                  <TableCell>
                    {status === "ACTIVE" && (
                      <Badge variant="default" className="bg-green-600">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Active
                      </Badge>
                    )}
                    {status === "REVOKED" && (
                      <Badge variant="destructive">
                        <XCircle className="h-3 w-3 mr-1" />
                        Revoked
                      </Badge>
                    )}
                    {status === "NONE" && (
                      <Badge variant="secondary">No Access</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {access?.status === "REVOKED" && access.revokedAt
                      ? formatDate(access.revokedAt)
                      : access?.grantedAt
                      ? formatDate(access.grantedAt)
                      : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" data-testid={`menu-mentee-${mentee.id}`}>
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {status !== "ACTIVE" && (
                          <DropdownMenuItem
                            onClick={() => grantMutation.mutate(mentee.id)}
                            data-testid={`grant-mentee-${mentee.id}`}
                          >
                            <ShieldCheck className="h-4 w-4 mr-2" />
                            Grant Access
                          </DropdownMenuItem>
                        )}
                        {status === "ACTIVE" && (
                          <DropdownMenuItem
                            onClick={() => {
                              setUserToRevoke(mentee.id);
                              setShowRevokeDialog(true);
                            }}
                            className="text-destructive"
                            data-testid={`revoke-mentee-${mentee.id}`}
                          >
                            <ShieldX className="h-4 w-4 mr-2" />
                            Revoke Access
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        {filteredMentees.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">
            No mentees found matching your criteria.
          </div>
        )}
      </Card>

      <Dialog open={showRevokeDialog} onOpenChange={setShowRevokeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revoke Community Access</DialogTitle>
            <DialogDescription>
              This will remove the mentee's access to the Mentee Community Board.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Reason (optional)</label>
              <Textarea
                placeholder="Provide a reason for revoking access..."
                value={revokeReason}
                onChange={(e) => setRevokeReason(e.target.value)}
                className="mt-2"
                data-testid="textarea-revoke-mentee-reason"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRevokeDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => userToRevoke && revokeMutation.mutate({ userId: userToRevoke, reason: revokeReason })}
              disabled={revokeMutation.isPending}
              data-testid="button-confirm-revoke-mentee"
            >
              {revokeMutation.isPending ? "Revoking..." : "Revoke Access"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ContentModerationTab() {
  const { toast } = useToast();
  const [board, setBoard] = useState<"mentor" | "mentee">("mentor");
  const [searchQuery, setSearchQuery] = useState("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [threadToDelete, setThreadToDelete] = useState<string | null>(null);

  const mentorEndpoint = "/api/community/threads";
  const menteeEndpoint = "/api/mentee-community/threads";
  const endpoint = board === "mentor" ? mentorEndpoint : menteeEndpoint;

  const { data: threads = [], isLoading } = useQuery<Thread[]>({
    queryKey: [endpoint],
  });

  const pinMutation = useMutation({
    mutationFn: async (threadId: string) => {
      const response = await apiRequest("POST", `${endpoint.replace("/threads", "")}/threads/${threadId}/pin`);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Thread pinned" });
      queryClient.invalidateQueries({ queryKey: [endpoint] });
    },
  });

  const unpinMutation = useMutation({
    mutationFn: async (threadId: string) => {
      const response = await apiRequest("POST", `${endpoint.replace("/threads", "")}/threads/${threadId}/unpin`);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Thread unpinned" });
      queryClient.invalidateQueries({ queryKey: [endpoint] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (threadId: string) => {
      await apiRequest("DELETE", `${endpoint.replace("/threads", "")}/threads/${threadId}`);
    },
    onSuccess: () => {
      toast({ title: "Thread deleted" });
      queryClient.invalidateQueries({ queryKey: [endpoint] });
      setShowDeleteDialog(false);
      setThreadToDelete(null);
    },
    onError: (error: any) => {
      toast({ title: "Failed to delete thread", description: error.message, variant: "destructive" });
    },
  });

  const filteredThreads = threads.filter((thread) =>
    thread.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    thread.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-1 gap-2 w-full sm:w-auto">
          <Select value={board} onValueChange={(v) => setBoard(v as "mentor" | "mentee")}>
            <SelectTrigger className="w-[180px]" data-testid="select-board">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mentor">
                <span className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Mentor Board
                </span>
              </SelectItem>
              <SelectItem value="mentee">
                <span className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4" />
                  Mentee Board
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search threads..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="input-search-threads"
            />
          </div>
        </div>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Thread</TableHead>
              <TableHead>Author</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Stats</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredThreads.map((thread) => (
              <TableRow key={thread.id} data-testid={`row-thread-${thread.id}`}>
                <TableCell>
                  <div className="max-w-xs">
                    <div className="font-medium truncate">{thread.title}</div>
                    <div className="text-sm text-muted-foreground truncate">{thread.content.substring(0, 100)}...</div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={thread.author?.profileImage || undefined} />
                      <AvatarFallback className="text-xs">
                        {thread.author ? getInitials(thread.author.firstName, thread.author.lastName) : "?"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">
                      {thread.author ? `${thread.author.firstName} ${thread.author.lastName}` : "Unknown"}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  {thread.category ? (
                    <Badge variant="outline">{thread.category.name}</Badge>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {thread.viewCount}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" />
                      {thread.replyCount}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    {thread.isPinned && (
                      <Badge variant="secondary" className="text-xs">
                        <Pin className="h-3 w-3 mr-1" />
                        Pinned
                      </Badge>
                    )}
                    {thread.isLocked && (
                      <Badge variant="outline" className="text-xs">
                        <Lock className="h-3 w-3 mr-1" />
                        Locked
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" data-testid={`menu-thread-${thread.id}`}>
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => window.open(`/${board === "mentor" ? "community" : "mentee-community"}/${thread.id}`, "_blank")}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Thread
                      </DropdownMenuItem>
                      {thread.isPinned ? (
                        <DropdownMenuItem onClick={() => unpinMutation.mutate(thread.id)}>
                          <Pin className="h-4 w-4 mr-2" />
                          Unpin
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem onClick={() => pinMutation.mutate(thread.id)}>
                          <Pin className="h-4 w-4 mr-2" />
                          Pin
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        onClick={() => {
                          setThreadToDelete(thread.id);
                          setShowDeleteDialog(true);
                        }}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {filteredThreads.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">
            No threads found.
          </div>
        )}
      </Card>

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
              onClick={() => threadToDelete && deleteMutation.mutate(threadToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function CategoriesTab() {
  const { toast } = useToast();
  const [board, setBoard] = useState<"mentor" | "mentee">("mentor");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ThreadCategory | null>(null);
  const [newCategory, setNewCategory] = useState({ name: "", description: "", color: "#6366F1" });

  const mentorEndpoint = "/api/community/categories";
  const menteeEndpoint = "/api/mentee-community/categories";
  const endpoint = board === "mentor" ? mentorEndpoint : menteeEndpoint;

  const { data: categories = [], isLoading } = useQuery<ThreadCategory[]>({
    queryKey: [endpoint],
  });

  const createMutation = useMutation({
    mutationFn: async (data: { name: string; description: string; color: string }) => {
      const adminEndpoint = board === "mentor" ? "/api/admin/community/categories" : "/api/admin/mentee-community/categories";
      const response = await apiRequest("POST", adminEndpoint, data);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Category created" });
      queryClient.invalidateQueries({ queryKey: [endpoint] });
      setShowAddDialog(false);
      setNewCategory({ name: "", description: "", color: "#6366F1" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to create category", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ThreadCategory> }) => {
      const adminEndpoint = board === "mentor" ? `/api/admin/community/categories/${id}` : `/api/admin/mentee-community/categories/${id}`;
      const response = await apiRequest("PATCH", adminEndpoint, data);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Category updated" });
      queryClient.invalidateQueries({ queryKey: [endpoint] });
      setEditingCategory(null);
    },
    onError: (error: any) => {
      toast({ title: "Failed to update category", description: error.message, variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <Select value={board} onValueChange={(v) => setBoard(v as "mentor" | "mentee")}>
          <SelectTrigger className="w-[180px]" data-testid="select-category-board">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="mentor">
              <span className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Mentor Board
              </span>
            </SelectItem>
            <SelectItem value="mentee">
              <span className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4" />
                Mentee Board
              </span>
            </SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={() => setShowAddDialog(true)} data-testid="button-add-category">
          <Plus className="h-4 w-4 mr-2" />
          Add Category
        </Button>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Category</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map((category) => (
              <TableRow key={category.id} data-testid={`row-category-${category.id}`}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div
                      className="h-4 w-4 rounded"
                      style={{ backgroundColor: category.color || "#6366F1" }}
                    />
                    <span className="font-medium">{category.name}</span>
                  </div>
                </TableCell>
                <TableCell className="max-w-xs truncate text-muted-foreground">
                  {category.description || "-"}
                </TableCell>
                <TableCell>
                  {category.isActive ? (
                    <Badge variant="default" className="bg-green-600">Active</Badge>
                  ) : (
                    <Badge variant="secondary">Archived</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setEditingCategory(category)}
                    data-testid={`edit-category-${category.id}`}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {categories.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">
            No categories found.
          </div>
        )}
      </Card>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Category</DialogTitle>
            <DialogDescription>
              Create a new category for the {board === "mentor" ? "Mentor" : "Mentee"} Community Board.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Name</label>
              <Input
                value={newCategory.name}
                onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                className="mt-2"
                data-testid="input-category-name"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={newCategory.description}
                onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                className="mt-2"
                data-testid="textarea-category-description"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Color</label>
              <Input
                type="color"
                value={newCategory.color}
                onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
                className="mt-2 h-10 w-20"
                data-testid="input-category-color"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => createMutation.mutate(newCategory)}
              disabled={!newCategory.name || createMutation.isPending}
              data-testid="button-save-category"
            >
              {createMutation.isPending ? "Creating..." : "Create Category"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingCategory} onOpenChange={(open) => !open && setEditingCategory(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
          </DialogHeader>
          {editingCategory && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Name</label>
                <Input
                  value={editingCategory.name}
                  onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                  className="mt-2"
                  data-testid="input-edit-category-name"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={editingCategory.description || ""}
                  onChange={(e) => setEditingCategory({ ...editingCategory, description: e.target.value })}
                  className="mt-2"
                  data-testid="textarea-edit-category-description"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Color</label>
                <Input
                  type="color"
                  value={editingCategory.color || "#6366F1"}
                  onChange={(e) => setEditingCategory({ ...editingCategory, color: e.target.value })}
                  className="mt-2 h-10 w-20"
                  data-testid="input-edit-category-color"
                />
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={editingCategory.isActive}
                  onCheckedChange={(checked) => setEditingCategory({ ...editingCategory, isActive: !!checked })}
                  id="category-active"
                  data-testid="checkbox-category-active"
                />
                <label htmlFor="category-active" className="text-sm">Active</label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingCategory(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => editingCategory && updateMutation.mutate({
                id: editingCategory.id,
                data: {
                  name: editingCategory.name,
                  description: editingCategory.description,
                  color: editingCategory.color,
                  isActive: editingCategory.isActive,
                },
              })}
              disabled={updateMutation.isPending}
              data-testid="button-update-category"
            >
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ActivityLogsTab() {
  const [board, setBoard] = useState<"mentor" | "mentee">("mentor");

  const mentorEndpoint = "/api/admin/community/access";
  const menteeEndpoint = "/api/admin/mentee-community/access";
  const endpoint = board === "mentor" ? mentorEndpoint : menteeEndpoint;

  const { data: accessRecords = [], isLoading } = useQuery<BoardAccess[]>({
    queryKey: [endpoint],
  });

  const sortedRecords = [...accessRecords].sort((a, b) => {
    const dateA = a.status === "REVOKED" ? new Date(a.revokedAt || 0) : new Date(a.grantedAt || 0);
    const dateB = b.status === "REVOKED" ? new Date(b.revokedAt || 0) : new Date(b.grantedAt || 0);
    return dateB.getTime() - dateA.getTime();
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Select value={board} onValueChange={(v) => setBoard(v as "mentor" | "mentee")}>
          <SelectTrigger className="w-[180px]" data-testid="select-logs-board">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="mentor">
              <span className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Mentor Board
              </span>
            </SelectItem>
            <SelectItem value="mentee">
              <span className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4" />
                Mentee Board
              </span>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Reason</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedRecords.map((record) => (
              <TableRow key={record.id} data-testid={`row-log-${record.id}`}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={record.user?.profileImage || undefined} />
                      <AvatarFallback className="text-xs">
                        {record.user ? getInitials(record.user.firstName, record.user.lastName) : "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">
                        {record.user ? `${record.user.firstName} ${record.user.lastName}` : "Unknown User"}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {record.user?.email || ""}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {record.status === "ACTIVE" ? (
                    <Badge variant="default" className="bg-green-600">
                      <ShieldCheck className="h-3 w-3 mr-1" />
                      Access Granted
                    </Badge>
                  ) : (
                    <Badge variant="destructive">
                      <ShieldX className="h-3 w-3 mr-1" />
                      Access Revoked
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    {record.status === "REVOKED"
                      ? formatFullDate(record.revokedAt)
                      : formatFullDate(record.grantedAt)}
                  </div>
                </TableCell>
                <TableCell className="max-w-xs">
                  {record.status === "REVOKED" && record.revokedReason ? (
                    <span className="text-sm text-muted-foreground">{record.revokedReason}</span>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {sortedRecords.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">
            No access changes recorded yet.
          </div>
        )}
      </Card>
    </div>
  );
}

export default function AdminCommunityPage() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="text-page-title">
            Community Management
          </h1>
          <p className="text-muted-foreground">
            Manage user access, moderate content, and configure community boards
          </p>
        </div>

        <Tabs defaultValue="mentor-access" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="mentor-access" data-testid="tab-mentor-access">
              <Users className="h-4 w-4 mr-2" />
              Mentor Access
            </TabsTrigger>
            <TabsTrigger value="mentee-access" data-testid="tab-mentee-access">
              <GraduationCap className="h-4 w-4 mr-2" />
              Mentee Access
            </TabsTrigger>
            <TabsTrigger value="moderation" data-testid="tab-moderation">
              <Shield className="h-4 w-4 mr-2" />
              Moderation
            </TabsTrigger>
            <TabsTrigger value="categories" data-testid="tab-categories">
              <Tag className="h-4 w-4 mr-2" />
              Categories
            </TabsTrigger>
            <TabsTrigger value="logs" data-testid="tab-logs">
              <Clock className="h-4 w-4 mr-2" />
              Activity Logs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="mentor-access">
            <Card>
              <CardHeader>
                <CardTitle>Mentor Board Access</CardTitle>
                <CardDescription>
                  Manage which mentors have access to the Mentor Community Board
                </CardDescription>
              </CardHeader>
              <CardContent>
                <MentorAccessTab />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="mentee-access">
            <Card>
              <CardHeader>
                <CardTitle>Mentee Board Access</CardTitle>
                <CardDescription>
                  Manage which mentees have access to the Mentee Community Board
                </CardDescription>
              </CardHeader>
              <CardContent>
                <MenteeAccessTab />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="moderation">
            <Card>
              <CardHeader>
                <CardTitle>Content Moderation</CardTitle>
                <CardDescription>
                  Review and moderate threads across both community boards
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ContentModerationTab />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="categories">
            <Card>
              <CardHeader>
                <CardTitle>Category Management</CardTitle>
                <CardDescription>
                  Manage discussion categories for both community boards
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CategoriesTab />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="logs">
            <Card>
              <CardHeader>
                <CardTitle>Access Change History</CardTitle>
                <CardDescription>
                  View history of access grants and revocations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ActivityLogsTab />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
