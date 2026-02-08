import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Users, Shield, UserCheck, GraduationCap, Plus, Trash2, RefreshCw, Filter, Search, UserPlus, Loader2, CheckCircle2 } from "lucide-react";
import { AdminLayout } from "@/components/layouts/admin-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Program, ProgramMembership } from "@shared/schema";

type User = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  isActive: boolean;
};

type MemberWithUser = ProgramMembership & { user: User };

function getRoleBadge(role: string) {
  switch (role) {
    case "ADMIN":
      return <Badge className="bg-purple-600 text-white" data-testid={`badge-role-${role}`}><Shield className="mr-1 h-3 w-3" />Admin</Badge>;
    case "MENTOR":
      return <Badge variant="default" data-testid={`badge-role-${role}`}><UserCheck className="mr-1 h-3 w-3" />Mentor</Badge>;
    case "MENTEE":
      return <Badge variant="secondary" data-testid={`badge-role-${role}`}><GraduationCap className="mr-1 h-3 w-3" />Mentee</Badge>;
    default:
      return <Badge variant="outline">{role}</Badge>;
  }
}

function MemberRow({ member, programId }: { member: MemberWithUser; programId: string }) {
  const { toast } = useToast();
  const [newRole, setNewRole] = useState(member.role);

  const updateRoleMutation = useMutation({
    mutationFn: async (role: string) => {
      const res = await apiRequest("PATCH", `/api/admin/program-memberships/${member.id}`, { role });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to update role");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/programs", programId, "members"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/programs"] });
      toast({ title: "Role updated", description: `${member.user.firstName} ${member.user.lastName}'s role has been updated.` });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const removeMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("DELETE", `/api/admin/program-memberships/${member.id}`);
      if (!res.ok) {
        const error = await res.json().catch(() => ({ message: "Failed to remove member" }));
        throw new Error(error.message || "Failed to remove member");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/programs", programId, "members"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/programs"] });
      toast({ title: "Member removed", description: `${member.user.firstName} ${member.user.lastName} has been removed from the program.` });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  return (
    <div className="flex items-center justify-between gap-4 p-3 rounded-md border" data-testid={`row-member-${member.id}`}>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate" data-testid={`text-member-name-${member.id}`}>
          {member.user.firstName} {member.user.lastName}
        </p>
        <p className="text-xs text-muted-foreground truncate" data-testid={`text-member-email-${member.id}`}>
          {member.user.email}
        </p>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        {getRoleBadge(member.role)}
        <span className="text-xs text-muted-foreground" data-testid={`text-member-joined-${member.id}`}>
          {member.joinedAt ? new Date(member.joinedAt).toLocaleDateString() : ""}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Select
          value={newRole}
          onValueChange={(val: "ADMIN" | "MENTOR" | "MENTEE") => {
            setNewRole(val);
            updateRoleMutation.mutate(val);
          }}
        >
          <SelectTrigger className="w-[120px]" data-testid={`select-change-role-${member.id}`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ADMIN">Admin</SelectItem>
            <SelectItem value="MENTOR">Mentor</SelectItem>
            <SelectItem value="MENTEE">Mentee</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => removeMutation.mutate()}
          disabled={removeMutation.isPending}
          data-testid={`button-remove-member-${member.id}`}
        >
          {removeMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 text-destructive" />}
        </Button>
      </div>
    </div>
  );
}

function AddMemberSection({ programId, existingMemberIds }: { programId: string; existingMemberIds: Set<string> }) {
  const { toast } = useToast();
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedRole, setSelectedRole] = useState("MENTEE");
  const [userSearch, setUserSearch] = useState("");

  const { data: allUsers } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const availableUsers = useMemo(() => {
    if (!allUsers) return [];
    return allUsers
      .filter((u) => !existingMemberIds.has(u.id) && u.isActive)
      .filter((u) => {
        if (!userSearch) return true;
        const search = userSearch.toLowerCase();
        return (
          u.firstName.toLowerCase().includes(search) ||
          u.lastName.toLowerCase().includes(search) ||
          u.email.toLowerCase().includes(search)
        );
      });
  }, [allUsers, existingMemberIds, userSearch]);

  const addMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/admin/programs/${programId}/members`, {
        userId: selectedUserId,
        role: selectedRole,
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to add member");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/programs", programId, "members"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/programs"] });
      toast({ title: "Member added" });
      setSelectedUserId("");
      setUserSearch("");
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  return (
    <div className="flex items-end gap-2 flex-wrap" data-testid="section-add-member">
      <div className="flex-1 min-w-[200px] space-y-1">
        <label className="text-sm font-medium">User</label>
        <div className="space-y-1">
          <Input
            placeholder="Search users..."
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
            data-testid="input-user-search"
          />
          <Select value={selectedUserId} onValueChange={setSelectedUserId}>
            <SelectTrigger data-testid="select-user">
              <SelectValue placeholder="Select a user" />
            </SelectTrigger>
            <SelectContent>
              {availableUsers.length === 0 ? (
                <div className="p-2 text-sm text-muted-foreground text-center">No users found</div>
              ) : (
                availableUsers.slice(0, 50).map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.firstName} {user.lastName} ({user.email})
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium">Role</label>
        <Select value={selectedRole} onValueChange={setSelectedRole}>
          <SelectTrigger className="w-[120px]" data-testid="select-add-role">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ADMIN">Admin</SelectItem>
            <SelectItem value="MENTOR">Mentor</SelectItem>
            <SelectItem value="MENTEE">Mentee</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button
        onClick={() => addMutation.mutate()}
        disabled={!selectedUserId || addMutation.isPending}
        data-testid="button-add-member"
      >
        {addMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
        Add
      </Button>
    </div>
  );
}

function BulkAddDialog({ programId, existingMemberIds, open, onOpenChange }: {
  programId: string;
  existingMemberIds: Set<string>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { toast } = useToast();
  const [bulkRole, setBulkRole] = useState("MENTEE");
  const [bulkSearch, setBulkSearch] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [isAdding, setIsAdding] = useState(false);

  const { data: allUsers } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const availableUsers = useMemo(() => {
    if (!allUsers) return [];
    return allUsers
      .filter((u) => !existingMemberIds.has(u.id) && u.isActive)
      .filter((u) => {
        if (!bulkSearch) return true;
        const search = bulkSearch.toLowerCase();
        return (
          u.firstName.toLowerCase().includes(search) ||
          u.lastName.toLowerCase().includes(search) ||
          u.email.toLowerCase().includes(search)
        );
      });
  }, [allUsers, existingMemberIds, bulkSearch]);

  const toggleUser = (userId: string) => {
    setSelectedUserIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  };

  const handleBulkAdd = async () => {
    if (selectedUserIds.size === 0) return;
    setIsAdding(true);
    let successCount = 0;
    let errorCount = 0;

    for (const userId of Array.from(selectedUserIds)) {
      try {
        await apiRequest("POST", `/api/admin/programs/${programId}/members`, {
          userId,
          role: bulkRole,
        });
        successCount++;
      } catch {
        errorCount++;
      }
    }

    queryClient.invalidateQueries({ queryKey: ["/api/admin/programs", programId, "members"] });
    queryClient.invalidateQueries({ queryKey: ["/api/admin/programs"] });

    if (errorCount > 0) {
      toast({
        title: "Bulk add completed with errors",
        description: `${successCount} added, ${errorCount} failed.`,
        variant: "destructive",
      });
    } else {
      toast({ title: "Members added", description: `${successCount} members added successfully.` });
    }

    setSelectedUserIds(new Set());
    setBulkSearch("");
    setIsAdding(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Bulk Add Members</DialogTitle>
          <DialogDescription>Select multiple users to add to this program at once.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <Input
                placeholder="Search users..."
                value={bulkSearch}
                onChange={(e) => setBulkSearch(e.target.value)}
                data-testid="input-bulk-search"
              />
            </div>
            <Select value={bulkRole} onValueChange={setBulkRole}>
              <SelectTrigger className="w-[120px]" data-testid="select-bulk-role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ADMIN">Admin</SelectItem>
                <SelectItem value="MENTOR">Mentor</SelectItem>
                <SelectItem value="MENTEE">Mentee</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {selectedUserIds.size > 0 && (
            <p className="text-sm text-muted-foreground" data-testid="text-bulk-selected-count">
              {selectedUserIds.size} user{selectedUserIds.size !== 1 ? "s" : ""} selected
            </p>
          )}

          <div className="flex-1 overflow-auto border rounded-md">
            {availableUsers.length === 0 ? (
              <div className="p-4 text-sm text-muted-foreground text-center">No available users found</div>
            ) : (
              <div className="divide-y">
                {availableUsers.slice(0, 100).map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    className={`w-full flex items-center justify-between gap-2 p-3 text-left ${
                      selectedUserIds.has(user.id) ? "bg-primary/10" : ""
                    }`}
                    onClick={() => toggleUser(user.id)}
                    data-testid={`button-bulk-select-user-${user.id}`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                    {selectedUserIds.has(user.id) && (
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} data-testid="button-bulk-cancel">
              Cancel
            </Button>
            <Button
              onClick={handleBulkAdd}
              disabled={selectedUserIds.size === 0 || isAdding}
              data-testid="button-bulk-add"
            >
              {isAdding ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <UserPlus className="mr-2 h-4 w-4" />
              )}
              Add {selectedUserIds.size > 0 ? selectedUserIds.size : ""} Member{selectedUserIds.size !== 1 ? "s" : ""}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminProgramsPage() {
  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(null);
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [memberSearch, setMemberSearch] = useState("");
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);

  const { data: programs, isLoading: programsLoading } = useQuery<Program[]>({
    queryKey: ["/api/admin/programs"],
  });

  const { data: members, isLoading: membersLoading } = useQuery<MemberWithUser[]>({
    queryKey: ["/api/admin/programs", selectedProgramId, "members"],
    enabled: !!selectedProgramId,
  });

  const selectedProgram = programs?.find((p) => p.id === selectedProgramId);

  const existingMemberIds = useMemo(() => {
    return new Set(members?.map((m) => m.userId) || []);
  }, [members]);

  const filteredMembers = useMemo(() => {
    if (!members) return [];
    return members.filter((m) => {
      if (roleFilter !== "ALL" && m.role !== roleFilter) return false;
      if (memberSearch) {
        const search = memberSearch.toLowerCase();
        const nameMatch =
          m.user.firstName.toLowerCase().includes(search) ||
          m.user.lastName.toLowerCase().includes(search);
        const emailMatch = m.user.email.toLowerCase().includes(search);
        if (!nameMatch && !emailMatch) return false;
      }
      return true;
    });
  }, [members, roleFilter, memberSearch]);

  const programMemberCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    if (members && selectedProgramId) {
      counts[selectedProgramId] = members.length;
    }
    return counts;
  }, [members, selectedProgramId]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="text-page-title">
            Programs
          </h1>
          <p className="text-muted-foreground">Manage mentorship programs and their memberships</p>
        </div>

        {programsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="pt-6">
                  <Skeleton className="h-24 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {programs?.map((program) => (
              <Card
                key={program.id}
                className={`cursor-pointer transition-colors ${
                  selectedProgramId === program.id ? "ring-2 ring-primary" : ""
                }`}
                onClick={() => setSelectedProgramId(program.id)}
                data-testid={`card-program-${program.id}`}
              >
                <CardHeader className="flex flex-row items-start justify-between gap-2 pb-2">
                  <CardTitle className="text-base" data-testid={`text-program-name-${program.id}`}>
                    {program.name}
                  </CardTitle>
                  {program.isActive ? (
                    <Badge variant="default" data-testid={`badge-status-${program.id}`}>Active</Badge>
                  ) : (
                    <Badge variant="secondary" data-testid={`badge-status-${program.id}`}>Inactive</Badge>
                  )}
                </CardHeader>
                <CardContent>
                  {program.description && (
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2" data-testid={`text-program-desc-${program.id}`}>
                      {program.description}
                    </p>
                  )}
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span data-testid={`text-member-count-${program.id}`}>
                      {selectedProgramId === program.id && members
                        ? members.length
                        : programMemberCounts[program.id] ?? "—"}{" "}
                      members
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {selectedProgram && (
          <div className="space-y-4" data-testid="section-program-members">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <h2 className="text-xl font-semibold" data-testid="text-selected-program-name">
                {selectedProgram.name} — Members
              </h2>
              <Button onClick={() => setBulkDialogOpen(true)} data-testid="button-open-bulk-add">
                <UserPlus className="mr-2 h-4 w-4" />
                Bulk Add
              </Button>
            </div>

            <Card>
              <CardContent className="pt-6 space-y-4">
                <AddMemberSection programId={selectedProgramId!} existingMemberIds={existingMemberIds} />
              </CardContent>
            </Card>

            <div className="flex items-center gap-2 flex-wrap">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-[140px]" data-testid="select-role-filter">
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Roles</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="MENTOR">Mentor</SelectItem>
                  <SelectItem value="MENTEE">Mentee</SelectItem>
                </SelectContent>
              </Select>
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search members..."
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  className="pl-8"
                  data-testid="input-member-search"
                />
              </div>
            </div>

            {membersLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-md" />
                ))}
              </div>
            ) : filteredMembers.length > 0 ? (
              <div className="space-y-2">
                {filteredMembers.map((member) => (
                  <MemberRow key={member.id} member={member} programId={selectedProgramId!} />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <Users className="mx-auto h-12 w-12 text-muted-foreground opacity-50 mb-4" />
                    <p className="text-muted-foreground" data-testid="text-no-members">
                      {members && members.length > 0
                        ? "No members match the current filters"
                        : "No members yet. Add members above."}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            <BulkAddDialog
              programId={selectedProgramId!}
              existingMemberIds={existingMemberIds}
              open={bulkDialogOpen}
              onOpenChange={setBulkDialogOpen}
            />
          </div>
        )}

        {!selectedProgramId && !programsLoading && programs && programs.length > 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <GraduationCap className="mx-auto h-12 w-12 text-muted-foreground opacity-50 mb-4" />
                <p className="text-muted-foreground" data-testid="text-select-program">
                  Select a program above to manage its members
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}
