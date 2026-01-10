import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layouts/admin-layout";
import { DataTable, Column } from "@/components/ui/data-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { MoreHorizontal, UserCheck, UserX, Eye, Mail, Shield, Plus, Upload, KeyRound } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";
import type { User } from "@shared/schema";

type SafeUser = Omit<User, "password">;

const roleColors: Record<string, string> = {
  SUPER_ADMIN: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  ADMIN: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  MENTOR: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  MENTEE: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
};

export default function AdminUsers() {
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedUser, setSelectedUser] = useState<SafeUser | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showBulkImportDialog, setShowBulkImportDialog] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [importResults, setImportResults] = useState<{
    successful: any[];
    failed: Array<{ row: number; email: string; error: string }>;
  } | null>(null);
  const [defaultPassword, setDefaultPassword] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [showPasswordResetDialog, setShowPasswordResetDialog] = useState(false);
  const [passwordResetResults, setPasswordResetResults] = useState<any | null>(null);
  const [showSendEmailDialog, setShowSendEmailDialog] = useState(false);
  const [sendEmailResults, setSendEmailResults] = useState<any | null>(null);
  const [newUser, setNewUser] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    role: "MENTEE",
    organizationName: "",
    jobTitle: "",
  });

  const { data: users = [], isLoading } = useQuery<SafeUser[]>({
    queryKey: ["/api/users", { role: roleFilter !== "all" ? roleFilter : undefined, isActive: statusFilter !== "all" ? statusFilter : undefined }],
  });

  const createUserMutation = useMutation({
    mutationFn: async (data: typeof newUser) => {
      const response = await apiRequest("POST", "/api/admin/users", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setShowCreateDialog(false);
      setNewUser({
        email: "",
        password: "",
        firstName: "",
        lastName: "",
        role: "MENTEE",
        organizationName: "",
        jobTitle: "",
      });
      toast({ title: "User created successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to create user", description: error.message, variant: "destructive" });
    },
  });

  const handleCreateUser = () => {
    if (!newUser.email || !newUser.password || !newUser.firstName || !newUser.lastName) {
      toast({ title: "Please fill in all required fields", variant: "destructive" });
      return;
    }
    createUserMutation.mutate(newUser);
  };

  const bulkImportMutation = useMutation({
    mutationFn: async ({ users, defaultPassword: pwd }: { users: any[]; defaultPassword?: string }) => {
      const response = await apiRequest("POST", "/api/admin/users/bulk-import", { users, defaultPassword: pwd || undefined });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setImportResults(data);
      toast({
        title: `Import completed`,
        description: `${data.successful.length} users imported, ${data.failed.length} failed`,
      });
    },
    onError: (error: Error) => {
      toast({ title: "Import failed", description: error.message, variant: "destructive" });
    },
  });

  const bulkPasswordResetMutation = useMutation({
    mutationFn: async ({ userIds, setPassword }: { userIds: string[]; setPassword: boolean }) => {
      const response = await apiRequest("POST", "/api/admin/users/bulk-password-reset", { userIds, setPassword });
      return response.json();
    },
    onSuccess: (data) => {
      setPasswordResetResults(data);
      setSelectedUserIds([]);
      toast({
        title: "Password reset completed",
        description: `${data.successful.length} users processed`,
      });
    },
    onError: (error: Error) => {
      toast({ title: "Password reset failed", description: error.message, variant: "destructive" });
    },
  });

  const sendWelcomeEmailsMutation = useMutation({
    mutationFn: async ({ userIds }: { userIds: string[] }) => {
      const response = await apiRequest("POST", "/api/admin/users/send-welcome-emails", { userIds });
      return response.json();
    },
    onSuccess: (data) => {
      setSendEmailResults(data);
      setSelectedUserIds([]);
      toast({
        title: "Welcome emails sent",
        description: `${data.successful.length} emails sent, ${data.failed.length} failed`,
      });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to send emails", description: error.message, variant: "destructive" });
    },
  });

  const parseCSV = (csvText: string) => {
    const lines = csvText.trim().split("\n");
    if (lines.length < 2) return [];
    
    const headers = lines[0].split(",").map(h => h.trim().replace(/"/g, ""));
    const users = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map(v => v.trim().replace(/"/g, ""));
      const user: Record<string, string> = {};
      headers.forEach((header, index) => {
        user[header] = values[index] || "";
      });
      if (user.email) {
        users.push(user);
      }
    }
    return users;
  };

  const handleBulkImport = async () => {
    if (!csvFile) {
      toast({ title: "Please select a CSV file", variant: "destructive" });
      return;
    }

    const text = await csvFile.text();
    const users = parseCSV(text);
    
    if (users.length === 0) {
      toast({ title: "No valid users found in CSV", variant: "destructive" });
      return;
    }

    bulkImportMutation.mutate({ users, defaultPassword });
  };

  const handleDownloadTemplate = () => {
    window.open("/api/admin/users/bulk-import/template", "_blank");
  };

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ userId, activate }: { userId: string; activate: boolean }) => {
      return apiRequest("PATCH", `/api/users/${userId}/${activate ? 'activate' : 'deactivate'}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: "User status updated" });
    },
    onError: () => {
      toast({ title: "Failed to update user status", variant: "destructive" });
    },
  });

  const columns: Column<SafeUser>[] = [
    {
      key: "select",
      header: "",
      className: "w-12",
      render: (user) => (
        <Checkbox 
          checked={selectedUserIds.includes(user.id)}
          onCheckedChange={(checked) => {
            if (checked) {
              setSelectedUserIds([...selectedUserIds, user.id]);
            } else {
              setSelectedUserIds(selectedUserIds.filter(id => id !== user.id));
            }
          }}
          onClick={(e) => e.stopPropagation()}
          data-testid={`checkbox-select-${user.id}`}
        />
      ),
    },
    {
      key: "name",
      header: "User",
      sortable: true,
      accessor: (user) => `${user.firstName} ${user.lastName}`,
      render: (user) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarImage src={user.profileImage || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary text-sm">
              {user.firstName?.[0]}{user.lastName?.[0]}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{user.firstName} {user.lastName}</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: "role",
      header: "Role",
      sortable: true,
      render: (user) => (
        <Badge className={`${roleColors[user.role]} no-default-hover-elevate no-default-active-elevate`}>
          {user.role}
        </Badge>
      ),
    },
    {
      key: "organizationName",
      header: "Organization",
      sortable: true,
      render: (user) => user.organizationName || "-",
    },
    {
      key: "isActive",
      header: "Status",
      sortable: true,
      render: (user) => (
        <Badge variant={user.isActive ? "default" : "secondary"}>
          {user.isActive ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      key: "createdAt",
      header: "Joined",
      sortable: true,
      sortType: "date",
      accessor: (user) => user.createdAt,
      render: (user) => user.createdAt ? format(new Date(user.createdAt), "MMM d, yyyy") : "-",
    },
    {
      key: "actions",
      header: "",
      className: "w-12",
      render: (user) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" data-testid={`button-actions-${user.id}`}>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setSelectedUser(user)}>
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Mail className="mr-2 h-4 w-4" />
              Send Email
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => toggleActiveMutation.mutate({ userId: user.id, activate: !user.isActive })}
            >
              {user.isActive ? (
                <>
                  <UserX className="mr-2 h-4 w-4" />
                  Deactivate
                </>
              ) : (
                <>
                  <UserCheck className="mr-2 h-4 w-4" />
                  Activate
                </>
              )}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const handleExport = (data: SafeUser[]) => {
    const csv = [
      ["Name", "Email", "Role", "Organization", "Status", "Joined"].join(","),
      ...data.map((user) =>
        [
          `"${user.firstName} ${user.lastName}"`,
          user.email,
          user.role,
          user.organizationName || "",
          user.isActive ? "Active" : "Inactive",
          user.createdAt ? format(new Date(user.createdAt), "yyyy-MM-dd") : "",
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `users-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="text-page-title">User Management</h1>
          <p className="text-muted-foreground">View and manage all users on the platform</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <CardTitle>All Users</CardTitle>
                <CardDescription>{users.length} users total</CardDescription>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-32" data-testid="select-role-filter">
                    <SelectValue placeholder="Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                    <SelectItem value="MENTOR">Mentor</SelectItem>
                    <SelectItem value="MENTEE">Mentee</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-32" data-testid="select-status-filter">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="true">Active</SelectItem>
                    <SelectItem value="false">Inactive</SelectItem>
                  </SelectContent>
                </Select>
                {selectedUserIds.length > 0 && (
                  <>
                    <Button variant="outline" onClick={() => setShowSendEmailDialog(true)} data-testid="button-send-welcome-emails">
                      <Mail className="h-4 w-4 mr-2" />
                      Send Welcome Email ({selectedUserIds.length})
                    </Button>
                    <Button variant="outline" onClick={() => setShowPasswordResetDialog(true)} data-testid="button-bulk-password-reset">
                      <KeyRound className="h-4 w-4 mr-2" />
                      Reset Passwords ({selectedUserIds.length})
                    </Button>
                  </>
                )}
                <Button variant="outline" onClick={() => setShowBulkImportDialog(true)} data-testid="button-bulk-import">
                  <Upload className="h-4 w-4 mr-2" />
                  Bulk Import
                </Button>
                <Button onClick={() => setShowCreateDialog(true)} data-testid="button-create-user">
                  <Plus className="h-4 w-4 mr-2" />
                  Create User
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <DataTable
              data={users}
              columns={columns}
              searchPlaceholder="Search users..."
              selectable
              onExport={handleExport}
              isLoading={isLoading}
              emptyMessage="No users found"
            />
          </CardContent>
        </Card>

        <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>User Details</DialogTitle>
              <DialogDescription>View complete user information</DialogDescription>
            </DialogHeader>
            {selectedUser && (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={selectedUser.profileImage || undefined} />
                    <AvatarFallback className="text-lg bg-primary/10 text-primary">
                      {selectedUser.firstName?.[0]}{selectedUser.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-lg font-semibold">{selectedUser.firstName} {selectedUser.lastName}</h3>
                    <p className="text-muted-foreground">{selectedUser.email}</p>
                    <Badge className={`mt-1 ${roleColors[selectedUser.role]} no-default-hover-elevate no-default-active-elevate`}>
                      {selectedUser.role}
                    </Badge>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Organization</p>
                    <p className="font-medium">{selectedUser.organizationName || "-"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Job Title</p>
                    <p className="font-medium">{selectedUser.jobTitle || "-"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Phone</p>
                    <p className="font-medium">{selectedUser.phone || "-"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Timezone</p>
                    <p className="font-medium">{selectedUser.timezone || "-"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Status</p>
                    <Badge variant={selectedUser.isActive ? "default" : "secondary"}>
                      {selectedUser.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Profile Complete</p>
                    <Badge variant={selectedUser.isProfileComplete ? "default" : "secondary"}>
                      {selectedUser.isProfileComplete ? "Yes" : "No"}
                    </Badge>
                  </div>
                </div>
                {selectedUser.bio && (
                  <div>
                    <p className="text-muted-foreground text-sm">Bio</p>
                    <p className="text-sm mt-1">{selectedUser.bio}</p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
              <DialogDescription>Add a new user to the platform</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={newUser.firstName}
                    onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })}
                    placeholder="John"
                    data-testid="input-first-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={newUser.lastName}
                    onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })}
                    placeholder="Doe"
                    data-testid="input-last-name"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="john.doe@example.com"
                  data-testid="input-email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Temporary Password *</Label>
                <Input
                  id="password"
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  placeholder="Enter a secure password"
                  data-testid="input-password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role *</Label>
                <Select value={newUser.role} onValueChange={(value) => setNewUser({ ...newUser, role: value })}>
                  <SelectTrigger data-testid="select-role">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MENTEE">Mentee</SelectItem>
                    <SelectItem value="MENTOR">Mentor</SelectItem>
                    {currentUser?.role === "SUPER_ADMIN" && (
                      <>
                        <SelectItem value="ADMIN">Admin</SelectItem>
                        <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="organizationName">Organization</Label>
                <Input
                  id="organizationName"
                  value={newUser.organizationName}
                  onChange={(e) => setNewUser({ ...newUser, organizationName: e.target.value })}
                  placeholder="Healthcare Organization"
                  data-testid="input-organization"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="jobTitle">Job Title</Label>
                <Input
                  id="jobTitle"
                  value={newUser.jobTitle}
                  onChange={(e) => setNewUser({ ...newUser, jobTitle: e.target.value })}
                  placeholder="Nurse Practitioner"
                  data-testid="input-job-title"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)} data-testid="button-cancel">
                Cancel
              </Button>
              <Button onClick={handleCreateUser} disabled={createUserMutation.isPending} data-testid="button-save-user">
                {createUserMutation.isPending ? "Creating..." : "Create User"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showBulkImportDialog} onOpenChange={(open) => {
          setShowBulkImportDialog(open);
          if (!open) {
            setCsvFile(null);
            setImportResults(null);
            setDefaultPassword("");
          }
        }}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Bulk Import Users</DialogTitle>
              <DialogDescription>Import multiple users from a CSV file</DialogDescription>
            </DialogHeader>
            {importResults ? (
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-muted">
                  <p className="font-medium">Import Results</p>
                  <p className="text-sm text-muted-foreground">
                    {importResults.successful.length} users imported successfully
                  </p>
                  {importResults.failed.length > 0 && (
                    <p className="text-sm text-destructive">
                      {importResults.failed.length} users failed
                    </p>
                  )}
                </div>
                {importResults.successful.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Successfully Imported Users:</p>
                    <p className="text-xs text-muted-foreground">Save these temporary passwords - they are only shown once!</p>
                    <div className="max-h-48 overflow-y-auto space-y-2">
                      {importResults.successful.map((user: any, idx: number) => (
                        <div key={idx} className="text-xs p-2 bg-muted rounded flex justify-between gap-2">
                          <span>{user.email}</span>
                          <code className="bg-background px-1 rounded">{user.tempPassword}</code>
                        </div>
                      ))}
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        const text = importResults.successful.map((u: any) => `${u.email},${u.tempPassword}`).join("\n");
                        const blob = new Blob([`email,tempPassword\n${text}`], { type: "text/csv" });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = "imported-users-credentials.csv";
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                    >
                      Download Credentials CSV
                    </Button>
                  </div>
                )}
                {importResults.failed.length > 0 && (
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    <p className="text-sm font-medium">Failed Imports:</p>
                    {importResults.failed.map((fail, idx) => (
                      <div key={idx} className="text-xs p-2 bg-destructive/10 rounded">
                        <p>Row {fail.row}: {fail.email}</p>
                        <p className="text-destructive">{fail.error}</p>
                      </div>
                    ))}
                  </div>
                )}
                <DialogFooter>
                  <Button onClick={() => {
                    setShowBulkImportDialog(false);
                    setCsvFile(null);
                    setImportResults(null);
                  }}>
                    Done
                  </Button>
                </DialogFooter>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  <div className="border-2 border-dashed rounded-lg p-8 text-center">
                    <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
                    <p className="text-sm text-muted-foreground mb-2">
                      {csvFile ? csvFile.name : "Select a CSV file to upload"}
                    </p>
                    <Input
                      type="file"
                      accept=".csv"
                      className="max-w-xs mx-auto"
                      onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                      data-testid="input-csv-file"
                    />
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <p className="font-medium mb-2">CSV Format Requirements:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Required columns: firstName, lastName, email, role</li>
                      <li>Optional columns: password, organizationName, jobTitle, phone</li>
                      <li>Role values: MENTOR, MENTEE</li>
                      <li>If no password in CSV, uses default or auto-generates</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="defaultPassword">Default Password (Optional)</Label>
                    <Input
                      id="defaultPassword"
                      type="text"
                      value={defaultPassword}
                      onChange={(e) => setDefaultPassword(e.target.value)}
                      placeholder="Leave empty to auto-generate for each user"
                      data-testid="input-default-password"
                    />
                    <p className="text-xs text-muted-foreground">
                      Set a default password for all imported users without a password in CSV
                    </p>
                  </div>
                  <Button variant="outline" className="w-full" onClick={handleDownloadTemplate} data-testid="button-download-template">
                    Download CSV Template
                  </Button>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowBulkImportDialog(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleBulkImport} 
                    disabled={!csvFile || bulkImportMutation.isPending}
                    data-testid="button-import"
                  >
                    {bulkImportMutation.isPending ? "Importing..." : "Import Users"}
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={showPasswordResetDialog} onOpenChange={(open) => {
          setShowPasswordResetDialog(open);
          if (!open) {
            setPasswordResetResults(null);
          }
        }}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Bulk Password Reset</DialogTitle>
              <DialogDescription>
                Reset passwords for {selectedUserIds.length} selected user{selectedUserIds.length !== 1 ? "s" : ""}
              </DialogDescription>
            </DialogHeader>
            {passwordResetResults ? (
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-muted">
                  <p className="font-medium">Reset Results</p>
                  <p className="text-sm text-muted-foreground">
                    {passwordResetResults.successful.length} passwords reset successfully
                  </p>
                  {passwordResetResults.failed.length > 0 && (
                    <p className="text-sm text-destructive">
                      {passwordResetResults.failed.length} failed
                    </p>
                  )}
                </div>
                {passwordResetResults.successful.length > 0 && passwordResetResults.successful[0].tempPassword && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">New Temporary Passwords:</p>
                    <p className="text-xs text-muted-foreground">Save these passwords - they are only shown once!</p>
                    <div className="max-h-48 overflow-y-auto space-y-2">
                      {passwordResetResults.successful.map((user: any, idx: number) => (
                        <div key={idx} className="text-xs p-2 bg-muted rounded flex justify-between gap-2">
                          <span>{user.email}</span>
                          <code className="bg-background px-1 rounded">{user.tempPassword}</code>
                        </div>
                      ))}
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        const text = passwordResetResults.successful.map((u: any) => `${u.email},${u.tempPassword}`).join("\n");
                        const blob = new Blob([`email,tempPassword\n${text}`], { type: "text/csv" });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = "reset-passwords.csv";
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                      data-testid="button-download-reset-passwords"
                    >
                      Download Passwords CSV
                    </Button>
                  </div>
                )}
                <DialogFooter>
                  <Button onClick={() => setShowPasswordResetDialog(false)} data-testid="button-done">
                    Done
                  </Button>
                </DialogFooter>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Choose how to reset passwords for the selected users:
                </p>
                <div className="space-y-3">
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={() => bulkPasswordResetMutation.mutate({ userIds: selectedUserIds, setPassword: true })}
                    disabled={bulkPasswordResetMutation.isPending}
                    data-testid="button-generate-temp-passwords"
                  >
                    <KeyRound className="mr-2 h-4 w-4" />
                    Generate temporary passwords
                  </Button>
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={() => bulkPasswordResetMutation.mutate({ userIds: selectedUserIds, setPassword: false })}
                    disabled={bulkPasswordResetMutation.isPending}
                    data-testid="button-generate-reset-tokens"
                  >
                    <Mail className="mr-2 h-4 w-4" />
                    Generate reset tokens (for email)
                  </Button>
                </div>
                {bulkPasswordResetMutation.isPending && (
                  <p className="text-sm text-center text-muted-foreground">Processing...</p>
                )}
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowPasswordResetDialog(false)} data-testid="button-cancel">
                    Cancel
                  </Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={showSendEmailDialog} onOpenChange={(open) => {
          setShowSendEmailDialog(open);
          if (!open) {
            setSendEmailResults(null);
          }
        }}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Send Welcome Emails</DialogTitle>
              <DialogDescription>
                Send welcome emails with login credentials to {selectedUserIds.length} selected user{selectedUserIds.length !== 1 ? "s" : ""}
              </DialogDescription>
            </DialogHeader>
            {sendEmailResults ? (
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-muted">
                  <p className="font-medium">Email Results</p>
                  <p className="text-sm text-muted-foreground">
                    {sendEmailResults.successful.length} emails sent successfully
                  </p>
                  {sendEmailResults.failed.length > 0 && (
                    <p className="text-sm text-destructive">
                      {sendEmailResults.failed.length} failed
                    </p>
                  )}
                </div>
                {sendEmailResults.failed.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Failed Emails:</p>
                    <p className="text-xs text-muted-foreground">
                      User passwords were NOT changed for failed emails.
                    </p>
                    <div className="max-h-48 overflow-y-auto space-y-2">
                      {sendEmailResults.failed.map((user: any, idx: number) => (
                        <div key={idx} className="text-xs p-2 bg-destructive/10 rounded">
                          <span className="font-medium">{user.email}</span>: {user.error}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <DialogFooter>
                  <Button onClick={() => setShowSendEmailDialog(false)} data-testid="button-email-done">
                    Done
                  </Button>
                </DialogFooter>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-muted">
                  <p className="text-sm text-muted-foreground">
                    This will send welcome emails to the selected users with:
                  </p>
                  <ul className="text-sm text-muted-foreground list-disc ml-5 mt-2">
                    <li>Their email address</li>
                    <li>A new temporary password</li>
                    <li>A link to sign in</li>
                  </ul>
                </div>
                <p className="text-sm text-amber-600 dark:text-amber-400">
                  Note: This will generate new temporary passwords for the selected users.
                </p>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowSendEmailDialog(false)} data-testid="button-cancel-email">
                    Cancel
                  </Button>
                  <Button 
                    onClick={() => sendWelcomeEmailsMutation.mutate({ userIds: selectedUserIds })}
                    disabled={sendWelcomeEmailsMutation.isPending}
                    data-testid="button-confirm-send-emails"
                  >
                    {sendWelcomeEmailsMutation.isPending ? "Sending..." : "Send Welcome Emails"}
                  </Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
