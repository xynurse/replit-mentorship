import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
  FormDescription,
} from "@/components/ui/form";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Reminder, User } from "@shared/schema";
import {
  Bell,
  Plus,
  Calendar,
  Check,
  X,
  Clock,
  AlertCircle,
  Send,
  UserPlus,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  Timer,
  RefreshCw,
  User as UserIcon,
  Search,
  Filter,
  LayoutGrid,
  List,
  Users,
} from "lucide-react";
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

type ReminderWithUsers = Reminder & { createdBy: User; recipient: User | null };

const PRIORITY_OPTIONS = [
  { value: "LOW", label: "Low", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
  { value: "NORMAL", label: "Normal", color: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200" },
  { value: "HIGH", label: "High", color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200" },
  { value: "URGENT", label: "Urgent", color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" },
];

const STATUS_OPTIONS = [
  { value: "PENDING", label: "Pending", icon: Clock, color: "text-yellow-500" },
  { value: "SENT", label: "Sent", icon: Send, color: "text-blue-500" },
  { value: "COMPLETED", label: "Completed", icon: CheckCircle2, color: "text-green-500" },
  { value: "DISMISSED", label: "Dismissed", icon: XCircle, color: "text-gray-500" },
];

const TYPE_OPTIONS = [
  { value: "PERSONAL", label: "Personal", icon: UserIcon },
  { value: "MENTOR_ASSIGNED", label: "Mentor Assigned", icon: UserPlus },
  { value: "ADMIN_ASSIGNED", label: "Admin Assigned", icon: AlertCircle },
];

const adminReminderFormSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  description: z.string().optional(),
  dueDate: z.string().min(1, "Due date is required"),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).default("NORMAL"),
  recurrence: z.enum(["NONE", "DAILY", "WEEKLY", "BIWEEKLY", "MONTHLY"]).default("NONE"),
  recipientId: z.string().min(1, "Recipient is required"),
});

type AdminReminderFormData = z.infer<typeof adminReminderFormSchema>;

export default function AdminRemindersPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const { data: allReminders = [], isLoading } = useQuery<ReminderWithUsers[]>({
    queryKey: ["/api/admin/reminders"],
    enabled: !!user,
  });

  const { data: allUsers = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
    enabled: !!user && isCreateOpen,
  });

  const form = useForm<AdminReminderFormData>({
    resolver: zodResolver(adminReminderFormSchema),
    defaultValues: {
      title: "",
      description: "",
      dueDate: "",
      priority: "NORMAL",
      recurrence: "NONE",
      recipientId: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: AdminReminderFormData) => {
      return apiRequest("POST", "/api/reminders", {
        ...data,
        type: "ADMIN_ASSIGNED",
      });
    },
    onSuccess: () => {
      toast({ title: "Reminder created and sent" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/reminders"] });
      setIsCreateOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create reminder",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/reminders/${id}`);
    },
    onSuccess: () => {
      toast({ title: "Reminder deleted" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/reminders"] });
      setDeleteTarget(null);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to delete reminder",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const formatDate = (date: Date | string | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const isOverdue = (dueDate: Date | string | null, status: string) => {
    if (!dueDate || status === "COMPLETED" || status === "DISMISSED") return false;
    return new Date(dueDate) < new Date();
  };

  const getStatusBadge = (status: string) => {
    const option = STATUS_OPTIONS.find((o) => o.value === status);
    if (!option) return <Badge variant="outline">Unknown</Badge>;
    const Icon = option.icon;
    return (
      <Badge variant="outline" className={`gap-1 ${option.color}`}>
        <Icon className="h-3 w-3" />
        {option.label}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const option = PRIORITY_OPTIONS.find((o) => o.value === priority);
    if (!option) return null;
    return <Badge className={option.color}>{option.label}</Badge>;
  };

  const getTypeBadge = (type: string) => {
    const option = TYPE_OPTIONS.find((o) => o.value === type);
    if (!option) return null;
    const Icon = option.icon;
    return (
      <Badge variant="secondary" className="gap-1">
        <Icon className="h-3 w-3" />
        {option.label}
      </Badge>
    );
  };

  const filteredReminders = allReminders.filter((reminder) => {
    const matchesSearch = searchQuery === "" || 
      reminder.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reminder.recipient?.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reminder.recipient?.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reminder.createdBy?.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reminder.createdBy?.lastName?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || reminder.status === statusFilter;
    const matchesType = typeFilter === "all" || reminder.type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  const stats = {
    total: allReminders.length,
    pending: allReminders.filter((r) => r.status === "PENDING").length,
    completed: allReminders.filter((r) => r.status === "COMPLETED").length,
    overdue: allReminders.filter((r) => isOverdue(r.dueDate, r.status || "PENDING")).length,
  };

  const onSubmit = (data: AdminReminderFormData) => {
    createMutation.mutate(data);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2" data-testid="text-page-title">
              <Bell className="h-6 w-6" />
              Reminders Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage all reminders across the platform
            </p>
          </div>
          <Button onClick={() => setIsCreateOpen(true)} data-testid="button-create-reminder">
            <Plus className="h-4 w-4 mr-2" />
            Send Reminder
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Reminders</CardDescription>
              <CardTitle className="text-2xl">{stats.total}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Pending</CardDescription>
              <CardTitle className="text-2xl text-yellow-600">{stats.pending}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Completed</CardDescription>
              <CardTitle className="text-2xl text-green-600">{stats.completed}</CardTitle>
            </CardHeader>
          </Card>
          <Card className={stats.overdue > 0 ? "border-red-300 dark:border-red-700" : ""}>
            <CardHeader className="pb-2">
              <CardDescription>Overdue</CardDescription>
              <CardTitle className="text-2xl text-red-600">{stats.overdue}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle>All Reminders</CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === "table" ? "secondary" : "ghost"}
                  size="icon"
                  onClick={() => setViewMode("table")}
                  data-testid="button-view-table"
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "cards" ? "secondary" : "ghost"}
                  size="icon"
                  onClick={() => setViewMode("cards")}
                  data-testid="button-view-cards"
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search reminders..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                  data-testid="input-search"
                />
              </div>
              <div className="flex gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[140px]" data-testid="select-status-filter">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    {STATUS_OPTIONS.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-[160px]" data-testid="select-type-filter">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {TYPE_OPTIONS.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : filteredReminders.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No reminders found</p>
              </div>
            ) : viewMode === "table" ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Recipient</TableHead>
                      <TableHead>Created By</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredReminders.map((reminder) => (
                      <TableRow 
                        key={reminder.id}
                        className={isOverdue(reminder.dueDate, reminder.status || "PENDING") ? "bg-red-50 dark:bg-red-950/20" : ""}
                        data-testid={`row-reminder-${reminder.id}`}
                      >
                        <TableCell className="font-medium max-w-[200px] truncate">
                          {reminder.title}
                        </TableCell>
                        <TableCell>
                          {reminder.recipient ? (
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={reminder.recipient.profileImage || undefined} />
                                <AvatarFallback className="text-xs">
                                  {reminder.recipient.firstName?.[0]}{reminder.recipient.lastName?.[0]}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm">
                                {reminder.recipient.firstName} {reminder.recipient.lastName}
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={reminder.createdBy?.profileImage || undefined} />
                              <AvatarFallback className="text-xs">
                                {reminder.createdBy?.firstName?.[0]}{reminder.createdBy?.lastName?.[0]}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm">
                              {reminder.createdBy?.firstName} {reminder.createdBy?.lastName}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{getTypeBadge(reminder.type)}</TableCell>
                        <TableCell className={isOverdue(reminder.dueDate, reminder.status || "PENDING") ? "text-red-600 font-medium" : ""}>
                          {formatDate(reminder.dueDate)}
                          {isOverdue(reminder.dueDate, reminder.status || "PENDING") && " (Overdue)"}
                        </TableCell>
                        <TableCell>{getPriorityBadge(reminder.priority || "NORMAL")}</TableCell>
                        <TableCell>{getStatusBadge(reminder.status || "PENDING")}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setDeleteTarget(reminder.id)}
                            data-testid={`button-delete-${reminder.id}`}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredReminders.map((reminder) => (
                  <Card 
                    key={reminder.id}
                    className={`hover-elevate ${isOverdue(reminder.dueDate, reminder.status || "PENDING") ? "border-red-300 dark:border-red-700" : ""}`}
                    data-testid={`card-reminder-${reminder.id}`}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-base line-clamp-1">{reminder.title}</CardTitle>
                        {getPriorityBadge(reminder.priority || "NORMAL")}
                      </div>
                      {reminder.description && (
                        <CardDescription className="line-clamp-2">{reminder.description}</CardDescription>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex flex-wrap gap-2">
                        {getTypeBadge(reminder.type)}
                        {getStatusBadge(reminder.status || "PENDING")}
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span className={isOverdue(reminder.dueDate, reminder.status || "PENDING") ? "text-red-500" : ""}>
                          {formatDate(reminder.dueDate)}
                        </span>
                      </div>
                      {reminder.recipient && (
                        <div className="flex items-center gap-2 pt-2 border-t">
                          <Avatar className="h-5 w-5">
                            <AvatarImage src={reminder.recipient.profileImage || undefined} />
                            <AvatarFallback className="text-xs">
                              {reminder.recipient.firstName?.[0]}{reminder.recipient.lastName?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs text-muted-foreground">
                            To: {reminder.recipient.firstName} {reminder.recipient.lastName}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-end pt-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setDeleteTarget(reminder.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Send Reminder</DialogTitle>
              <DialogDescription>
                Create and send a reminder to any user on the platform
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="recipientId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Recipient</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-recipient">
                            <SelectValue placeholder="Select a user" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {allUsers.map((u) => (
                            <SelectItem key={u.id} value={u.id}>
                              {u.firstName} {u.lastName} ({u.email})
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
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Reminder title" 
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
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Add more details..." 
                          rows={3}
                          {...field} 
                          data-testid="input-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="dueDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Due Date</FormLabel>
                        <FormControl>
                          <Input 
                            type="date" 
                            {...field} 
                            data-testid="input-due-date"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Priority</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-priority">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {PRIORITY_OPTIONS.map((p) => (
                              <SelectItem key={p.value} value={p.value}>
                                {p.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="recurrence"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Recurrence</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-recurrence">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="NONE">One-time</SelectItem>
                          <SelectItem value="DAILY">Daily</SelectItem>
                          <SelectItem value="WEEKLY">Weekly</SelectItem>
                          <SelectItem value="BIWEEKLY">Bi-weekly</SelectItem>
                          <SelectItem value="MONTHLY">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter className="gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createMutation.isPending}
                    data-testid="button-submit-reminder"
                  >
                    {createMutation.isPending ? "Sending..." : "Send Reminder"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Reminder?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. The reminder will be permanently deleted.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                data-testid="button-confirm-delete"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}
