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
  FormDescription,
} from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

type ReminderWithCreator = Reminder & { createdBy?: User };
type ReminderWithRecipient = Reminder & { recipient?: User | null };

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

const RECURRENCE_OPTIONS = [
  { value: "NONE", label: "One-time" },
  { value: "DAILY", label: "Daily" },
  { value: "WEEKLY", label: "Weekly" },
  { value: "BIWEEKLY", label: "Bi-weekly" },
  { value: "MONTHLY", label: "Monthly" },
];

const reminderFormSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  description: z.string().optional(),
  dueDate: z.string().min(1, "Due date is required"),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).default("NORMAL"),
  recurrence: z.enum(["NONE", "DAILY", "WEEKLY", "BIWEEKLY", "MONTHLY"]).default("NONE"),
  recipientId: z.string().optional(),
  type: z.enum(["PERSONAL", "MENTOR_ASSIGNED", "ADMIN_ASSIGNED"]).optional(),
});

type ReminderFormData = z.infer<typeof reminderFormSchema>;

export default function RemindersPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("received");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [creatingForMentee, setCreatingForMentee] = useState(false);

  const isMentor = user?.role === "MENTOR" || user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";

  const { data: receivedReminders = [], isLoading: loadingReceived } = useQuery<ReminderWithCreator[]>({
    queryKey: ["/api/reminders"],
    enabled: !!user,
  });

  const { data: createdReminders = [], isLoading: loadingCreated } = useQuery<ReminderWithRecipient[]>({
    queryKey: ["/api/reminders/created"],
    enabled: !!user && isMentor,
  });

  const { data: mentees = [] } = useQuery<User[]>({
    queryKey: ["/api/reminders/mentees"],
    enabled: !!user && isMentor && creatingForMentee,
  });

  const form = useForm<ReminderFormData>({
    resolver: zodResolver(reminderFormSchema),
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
    mutationFn: async (data: ReminderFormData) => {
      const payload: any = {
        title: data.title,
        description: data.description || null,
        dueDate: data.dueDate,
        priority: data.priority,
        recurrence: data.recurrence,
      };

      if (creatingForMentee && data.recipientId) {
        payload.recipientId = data.recipientId;
        payload.type = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN" 
          ? "ADMIN_ASSIGNED" 
          : "MENTOR_ASSIGNED";
      } else {
        payload.type = "PERSONAL";
      }

      return apiRequest("POST", "/api/reminders", payload);
    },
    onSuccess: () => {
      toast({ title: "Reminder created successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/reminders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/reminders/created"] });
      setIsCreateOpen(false);
      setCreatingForMentee(false);
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

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ReminderFormData> }) => {
      return apiRequest("PATCH", `/api/reminders/${id}`, data);
    },
    onSuccess: () => {
      toast({ title: "Reminder updated successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/reminders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/reminders/created"] });
      setEditingReminder(null);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update reminder",
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
      queryClient.invalidateQueries({ queryKey: ["/api/reminders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/reminders/created"] });
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

  const completeMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("POST", `/api/reminders/${id}/complete`, {});
    },
    onSuccess: () => {
      toast({ title: "Reminder marked as completed" });
      queryClient.invalidateQueries({ queryKey: ["/api/reminders"] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to complete reminder",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const dismissMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("POST", `/api/reminders/${id}/dismiss`, {});
    },
    onSuccess: () => {
      toast({ title: "Reminder dismissed" });
      queryClient.invalidateQueries({ queryKey: ["/api/reminders"] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to dismiss reminder",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ReminderFormData) => {
    if (editingReminder) {
      updateMutation.mutate({ id: editingReminder.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const isOverdue = (dueDate: Date | string | null) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  const getStatusBadge = (status: string) => {
    const option = STATUS_OPTIONS.find((o) => o.value === status);
    if (!option) return null;
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
    switch (type) {
      case "PERSONAL":
        return <Badge variant="secondary" className="gap-1"><UserIcon className="h-3 w-3" />Personal</Badge>;
      case "MENTOR_ASSIGNED":
        return <Badge variant="default" className="gap-1 bg-purple-600"><UserPlus className="h-3 w-3" />From Mentor</Badge>;
      case "ADMIN_ASSIGNED":
        return <Badge variant="default" className="gap-1 bg-teal-600"><AlertCircle className="h-3 w-3" />From Admin</Badge>;
      default:
        return null;
    }
  };

  const openCreateDialog = (forMentee = false) => {
    setCreatingForMentee(forMentee);
    setEditingReminder(null);
    form.reset({
      title: "",
      description: "",
      dueDate: "",
      priority: "NORMAL",
      recurrence: "NONE",
      recipientId: "",
    });
    setIsCreateOpen(true);
  };

  const openEditDialog = (reminder: Reminder) => {
    setEditingReminder(reminder);
    form.reset({
      title: reminder.title,
      description: reminder.description || "",
      dueDate: reminder.dueDate ? new Date(reminder.dueDate).toISOString().split("T")[0] : "",
      priority: (reminder.priority || "NORMAL") as "LOW" | "NORMAL" | "HIGH" | "URGENT",
      recurrence: (reminder.recurrence || "NONE") as "NONE" | "DAILY" | "WEEKLY" | "BIWEEKLY" | "MONTHLY",
    });
    setIsCreateOpen(true);
  };

  const personalReminders = receivedReminders.filter((r) => r.type === "PERSONAL");
  const assignedReminders = receivedReminders.filter((r) => r.type !== "PERSONAL");

  const renderReminderCard = (reminder: ReminderWithCreator | ReminderWithRecipient, showRecipient = false) => {
    const isCompleted = reminder.status === "COMPLETED" || reminder.status === "DISMISSED";
    const overdue = !isCompleted && isOverdue(reminder.dueDate);

    return (
      <Card 
        key={reminder.id} 
        className={`hover-elevate transition-all ${isCompleted ? "opacity-60" : ""} ${overdue ? "border-red-300 dark:border-red-700" : ""}`}
        data-testid={`card-reminder-${reminder.id}`}
      >
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <CardTitle className={`text-base ${isCompleted ? "line-through" : ""}`}>
                {reminder.title}
              </CardTitle>
              {reminder.description && (
                <CardDescription className="mt-1 line-clamp-2">
                  {reminder.description}
                </CardDescription>
              )}
            </div>
            <div className="flex items-center gap-1">
              {getPriorityBadge(reminder.priority || "NORMAL")}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pb-2">
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span className={overdue ? "text-red-500 font-medium" : ""}>
                {formatDate(reminder.dueDate)}
                {overdue && " (Overdue)"}
              </span>
            </div>
            {getTypeBadge(reminder.type)}
            {getStatusBadge(reminder.status || "PENDING")}
            {reminder.recurrence && reminder.recurrence !== "NONE" && (
              <Badge variant="outline" className="gap-1">
                <RefreshCw className="h-3 w-3" />
                {RECURRENCE_OPTIONS.find((r) => r.value === reminder.recurrence)?.label}
              </Badge>
            )}
          </div>
          
          {showRecipient && "recipient" in reminder && reminder.recipient && (
            <div className="flex items-center gap-2 mt-3 pt-3 border-t">
              <Avatar className="h-6 w-6">
                <AvatarImage src={reminder.recipient.profileImage || undefined} />
                <AvatarFallback className="text-xs">
                  {reminder.recipient.firstName?.[0]}{reminder.recipient.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm">
                Sent to: {reminder.recipient.firstName} {reminder.recipient.lastName}
              </span>
            </div>
          )}

          {"createdBy" in reminder && reminder.createdBy && reminder.type !== "PERSONAL" && (
            <div className="flex items-center gap-2 mt-3 pt-3 border-t">
              <Avatar className="h-6 w-6">
                <AvatarImage src={reminder.createdBy.profileImage || undefined} />
                <AvatarFallback className="text-xs">
                  {reminder.createdBy.firstName?.[0]}{reminder.createdBy.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm">
                From: {reminder.createdBy.firstName} {reminder.createdBy.lastName}
              </span>
            </div>
          )}
        </CardContent>
        <CardFooter className="pt-2 gap-2 flex-wrap">
          {!isCompleted && (
            <>
              <Button 
                size="sm" 
                variant="default"
                onClick={() => completeMutation.mutate(reminder.id)}
                disabled={completeMutation.isPending}
                data-testid={`button-complete-${reminder.id}`}
              >
                <Check className="h-4 w-4 mr-1" />
                Complete
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => dismissMutation.mutate(reminder.id)}
                disabled={dismissMutation.isPending}
                data-testid={`button-dismiss-${reminder.id}`}
              >
                <X className="h-4 w-4 mr-1" />
                Dismiss
              </Button>
            </>
          )}
          {(reminder.createdById === user?.id || user?.role === "ADMIN" || user?.role === "SUPER_ADMIN") && (
            <>
              <Button 
                size="sm" 
                variant="ghost"
                onClick={() => openEditDialog(reminder)}
                data-testid={`button-edit-${reminder.id}`}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button 
                size="sm" 
                variant="ghost"
                onClick={() => setDeleteTarget(reminder.id)}
                data-testid={`button-delete-${reminder.id}`}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </>
          )}
        </CardFooter>
      </Card>
    );
  };

  const renderEmptyState = (message: string) => (
    <div className="text-center py-12 text-muted-foreground">
      <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
      <p>{message}</p>
    </div>
  );

  const renderLoadingSkeleton = () => (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2 mt-2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-4 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2" data-testid="text-page-title">
              <Bell className="h-6 w-6" />
              Reminders
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage your reminders and tasks
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => openCreateDialog(false)} data-testid="button-create-personal">
              <Plus className="h-4 w-4 mr-2" />
              Personal Reminder
            </Button>
            {isMentor && (
              <Button variant="secondary" onClick={() => openCreateDialog(true)} data-testid="button-create-for-mentee">
                <UserPlus className="h-4 w-4 mr-2" />
                Remind Mentee
              </Button>
            )}
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full md:w-auto md:inline-grid grid-cols-3 gap-1">
            <TabsTrigger value="received" data-testid="tab-received">
              Assigned to Me ({assignedReminders.filter((r) => r.status !== "COMPLETED" && r.status !== "DISMISSED").length})
            </TabsTrigger>
            <TabsTrigger value="personal" data-testid="tab-personal">
              Personal ({personalReminders.filter((r) => r.status !== "COMPLETED" && r.status !== "DISMISSED").length})
            </TabsTrigger>
            {isMentor && (
              <TabsTrigger value="sent" data-testid="tab-sent">
                Sent ({createdReminders.filter((r) => r.type !== "PERSONAL").length})
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="received" className="mt-6">
            {loadingReceived ? (
              renderLoadingSkeleton()
            ) : assignedReminders.length === 0 ? (
              renderEmptyState("No reminders assigned to you yet")
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {assignedReminders.map((r) => renderReminderCard(r))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="personal" className="mt-6">
            {loadingReceived ? (
              renderLoadingSkeleton()
            ) : personalReminders.length === 0 ? (
              renderEmptyState("No personal reminders yet. Create one to get started!")
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {personalReminders.map((r) => renderReminderCard(r))}
              </div>
            )}
          </TabsContent>

          {isMentor && (
            <TabsContent value="sent" className="mt-6">
              {loadingCreated ? (
                renderLoadingSkeleton()
              ) : createdReminders.filter((r) => r.type !== "PERSONAL").length === 0 ? (
                renderEmptyState("You haven't sent any reminders to mentees yet")
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {createdReminders
                    .filter((r) => r.type !== "PERSONAL")
                    .map((r) => renderReminderCard(r, true))}
                </div>
              )}
            </TabsContent>
          )}
        </Tabs>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {editingReminder ? "Edit Reminder" : creatingForMentee ? "Create Reminder for Mentee" : "Create Personal Reminder"}
              </DialogTitle>
              <DialogDescription>
                {editingReminder 
                  ? "Update the reminder details"
                  : creatingForMentee 
                    ? "Set a reminder for one of your mentees" 
                    : "Create a personal reminder for yourself"}
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {creatingForMentee && !editingReminder && (
                  <FormField
                    control={form.control}
                    name="recipientId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Select Mentee</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-mentee">
                              <SelectValue placeholder="Choose a mentee" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {mentees.map((mentee) => (
                              <SelectItem key={mentee.id} value={mentee.id}>
                                {mentee.firstName} {mentee.lastName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="What do you need to remember?" 
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
                          {RECURRENCE_OPTIONS.map((r) => (
                            <SelectItem key={r.value} value={r.value}>
                              {r.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Set how often this reminder should repeat
                      </FormDescription>
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
                    disabled={createMutation.isPending || updateMutation.isPending}
                    data-testid="button-submit-reminder"
                  >
                    {createMutation.isPending || updateMutation.isPending ? "Saving..." : editingReminder ? "Update" : "Create"}
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
