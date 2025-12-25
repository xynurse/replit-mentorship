import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  Bell, 
  Check, 
  CheckCheck, 
  Archive, 
  Trash2, 
  ExternalLink,
  Filter,
  Settings,
  Inbox,
  ArchiveIcon,
} from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatDistanceToNow, format } from "date-fns";
import { cn } from "@/lib/utils";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import type { Notification, NotificationPreference, NotificationType, EmailFrequency } from "@shared/schema";

const NOTIFICATION_TYPES: { value: NotificationType; label: string; description: string }[] = [
  { value: "WELCOME", label: "Welcome", description: "Welcome messages when you join" },
  { value: "APPLICATION_RECEIVED", label: "Application Received", description: "When someone applies to your cohort" },
  { value: "APPLICATION_APPROVED", label: "Application Approved", description: "When your application is approved" },
  { value: "APPLICATION_REJECTED", label: "Application Rejected", description: "When your application is rejected" },
  { value: "MATCH_PROPOSED", label: "Match Proposed", description: "When a new mentor/mentee match is proposed" },
  { value: "MATCH_CONFIRMED", label: "Match Confirmed", description: "When a match is confirmed" },
  { value: "NEW_MESSAGE", label: "New Message", description: "When you receive a new message" },
  { value: "NEW_ANNOUNCEMENT", label: "New Announcement", description: "Cohort or track announcements" },
  { value: "TASK_ASSIGNED", label: "Task Assigned", description: "When a task is assigned to you" },
  { value: "TASK_DUE_SOON", label: "Task Due Soon", description: "Reminder before task deadline" },
  { value: "TASK_OVERDUE", label: "Task Overdue", description: "When a task becomes overdue" },
  { value: "TASK_COMPLETED", label: "Task Completed", description: "When a task is marked complete" },
  { value: "GOAL_APPROVED", label: "Goal Approved", description: "When your goal is approved" },
  { value: "GOAL_FEEDBACK", label: "Goal Feedback", description: "When you receive goal feedback" },
  { value: "GOAL_MILESTONE_DUE", label: "Milestone Due", description: "When a goal milestone is due" },
  { value: "MEETING_REMINDER", label: "Meeting Reminder", description: "Reminder before scheduled meetings" },
  { value: "MEETING_SCHEDULED", label: "Meeting Scheduled", description: "When a meeting is scheduled" },
  { value: "DOCUMENT_SHARED", label: "Document Shared", description: "When a document is shared with you" },
  { value: "MENTEE_PROGRESS_UPDATE", label: "Mentee Progress", description: "Updates on your mentee's progress" },
  { value: "COHORT_ENDING_SOON", label: "Cohort Ending", description: "When a cohort is ending soon" },
  { value: "SYSTEM_ANNOUNCEMENT", label: "System Announcement", description: "Platform-wide announcements" },
];

const EMAIL_FREQUENCIES: { value: EmailFrequency; label: string }[] = [
  { value: "INSTANT", label: "Instant" },
  { value: "DAILY_DIGEST", label: "Daily Digest" },
  { value: "WEEKLY_DIGEST", label: "Weekly Digest" },
  { value: "NEVER", label: "Never" },
];

function getNotificationIcon(type: string) {
  const iconMap: Record<string, { bg: string; label: string }> = {
    WELCOME: { bg: "bg-green-500/10 text-green-600 dark:text-green-400", label: "Welcome" },
    APPLICATION_RECEIVED: { bg: "bg-blue-500/10 text-blue-600 dark:text-blue-400", label: "Application" },
    APPLICATION_APPROVED: { bg: "bg-green-500/10 text-green-600 dark:text-green-400", label: "Approved" },
    APPLICATION_REJECTED: { bg: "bg-red-500/10 text-red-600 dark:text-red-400", label: "Rejected" },
    MATCH_PROPOSED: { bg: "bg-purple-500/10 text-purple-600 dark:text-purple-400", label: "Match" },
    MATCH_CONFIRMED: { bg: "bg-purple-500/10 text-purple-600 dark:text-purple-400", label: "Match" },
    NEW_MESSAGE: { bg: "bg-blue-500/10 text-blue-600 dark:text-blue-400", label: "Message" },
    NEW_ANNOUNCEMENT: { bg: "bg-orange-500/10 text-orange-600 dark:text-orange-400", label: "Announcement" },
    TASK_ASSIGNED: { bg: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400", label: "Task" },
    TASK_DUE_SOON: { bg: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400", label: "Task" },
    TASK_OVERDUE: { bg: "bg-red-500/10 text-red-600 dark:text-red-400", label: "Overdue" },
    TASK_COMPLETED: { bg: "bg-green-500/10 text-green-600 dark:text-green-400", label: "Completed" },
    GOAL_APPROVED: { bg: "bg-green-500/10 text-green-600 dark:text-green-400", label: "Goal" },
    GOAL_FEEDBACK: { bg: "bg-blue-500/10 text-blue-600 dark:text-blue-400", label: "Feedback" },
    GOAL_MILESTONE_DUE: { bg: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400", label: "Milestone" },
    MEETING_REMINDER: { bg: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400", label: "Meeting" },
    MEETING_SCHEDULED: { bg: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400", label: "Meeting" },
    DOCUMENT_SHARED: { bg: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400", label: "Document" },
    MENTEE_PROGRESS_UPDATE: { bg: "bg-teal-500/10 text-teal-600 dark:text-teal-400", label: "Progress" },
    COHORT_ENDING_SOON: { bg: "bg-amber-500/10 text-amber-600 dark:text-amber-400", label: "Cohort" },
    SYSTEM_ANNOUNCEMENT: { bg: "bg-gray-500/10 text-gray-600 dark:text-gray-400", label: "System" },
  };
  return iconMap[type] || { bg: "bg-gray-500/10 text-gray-600 dark:text-gray-400", label: type };
}

function getPriorityStyle(priority: string | null) {
  if (!priority) return "";
  switch (priority) {
    case "HIGH":
      return "border-l-4 border-l-orange-500";
    case "URGENT":
      return "border-l-4 border-l-red-500";
    default:
      return "";
  }
}

function NotificationCard({ 
  notification, 
  onMarkRead, 
  onArchive,
  onDelete,
}: { 
  notification: Notification; 
  onMarkRead: (id: string) => void;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const typeInfo = getNotificationIcon(notification.type);
  const priorityStyle = getPriorityStyle(notification.priority);
  
  return (
    <Card
      className={cn(
        "transition-colors",
        !notification.isRead && "bg-muted/30",
        priorityStyle
      )}
      data-testid={`notification-card-${notification.id}`}
    >
      <CardContent className="p-4">
        <div className="flex gap-4">
          <Badge variant="secondary" className={cn("text-xs shrink-0 h-6", typeInfo.bg)}>
            {typeInfo.label}
          </Badge>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className={cn("font-medium", !notification.isRead && "font-semibold")}>
                  {notification.title}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {notification.message}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  {notification.createdAt && format(new Date(notification.createdAt), "PPp")}
                  {" "}({notification.createdAt && formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })})
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {!notification.isRead && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onMarkRead(notification.id)}
                    data-testid={`button-mark-read-${notification.id}`}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                )}
                {notification.actionUrl && (
                  <Button variant="ghost" size="icon" asChild>
                    <Link href={notification.actionUrl}>
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onArchive(notification.id)}
                  data-testid={`button-archive-${notification.id}`}
                >
                  <Archive className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive"
                  onClick={() => onDelete(notification.id)}
                  data-testid={`button-delete-${notification.id}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function NotificationList({ filter }: { filter: "inbox" | "archived" }) {
  const [typeFilter, setTypeFilter] = useState<string>("all");
  
  const { data: notifications, isLoading } = useQuery<Notification[]>({
    queryKey: ["/api/notifications", { isArchived: filter === "archived", type: typeFilter === "all" ? undefined : typeFilter }],
  });

  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("POST", `/api/notifications/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/notifications/read-all");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
    },
  });

  const archiveMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("POST", `/api/notifications/${id}/archive`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/notifications/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
    },
  });

  const unreadCount = notifications?.filter(n => !n.isRead).length || 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-48" data-testid="select-notification-type">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {NOTIFICATION_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {filter === "inbox" && unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => markAllReadMutation.mutate()}
            disabled={markAllReadMutation.isPending}
            data-testid="button-mark-all-read"
          >
            <CheckCheck className="h-4 w-4 mr-2" />
            Mark all as read ({unreadCount})
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">
          Loading notifications...
        </div>
      ) : notifications && notifications.length > 0 ? (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <NotificationCard
              key={notification.id}
              notification={notification}
              onMarkRead={(id) => markReadMutation.mutate(id)}
              onArchive={(id) => archiveMutation.mutate(id)}
              onDelete={(id) => deleteMutation.mutate(id)}
            />
          ))}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            {filter === "inbox" ? (
              <>
                <Inbox className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium">No notifications</p>
                <p className="text-muted-foreground">You're all caught up!</p>
              </>
            ) : (
              <>
                <ArchiveIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium">No archived notifications</p>
                <p className="text-muted-foreground">Archived notifications will appear here</p>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function NotificationPreferencesTab() {
  const { data: preferences, isLoading } = useQuery<NotificationPreference[]>({
    queryKey: ["/api/notification-preferences"],
  });

  const updatePreferenceMutation = useMutation({
    mutationFn: async (pref: {
      notificationType: string;
      inAppEnabled?: boolean;
      emailEnabled?: boolean;
      emailFrequency?: EmailFrequency;
      pushEnabled?: boolean;
    }) => {
      await apiRequest("POST", "/api/notification-preferences", pref);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notification-preferences"] });
    },
  });

  const getPreference = (type: string) => {
    return preferences?.find(p => p.notificationType === type);
  };

  const handleToggle = (type: string, field: "inAppEnabled" | "emailEnabled" | "pushEnabled", value: boolean) => {
    const pref = getPreference(type);
    updatePreferenceMutation.mutate({
      notificationType: type,
      inAppEnabled: field === "inAppEnabled" ? value : pref?.inAppEnabled ?? true,
      emailEnabled: field === "emailEnabled" ? value : pref?.emailEnabled ?? true,
      emailFrequency: pref?.emailFrequency || "INSTANT",
      pushEnabled: field === "pushEnabled" ? value : pref?.pushEnabled ?? false,
    });
  };

  const handleEmailFrequency = (type: string, frequency: EmailFrequency) => {
    const pref = getPreference(type);
    updatePreferenceMutation.mutate({
      notificationType: type,
      inAppEnabled: pref?.inAppEnabled ?? true,
      emailEnabled: pref?.emailEnabled ?? true,
      emailFrequency: frequency,
      pushEnabled: pref?.pushEnabled ?? false,
    });
  };

  if (isLoading) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Loading preferences...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Notification Preferences</CardTitle>
          <CardDescription>
            Control how you receive notifications for different events
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-4 text-sm font-medium text-muted-foreground pb-2 border-b">
              <div>Notification Type</div>
              <div className="text-center">In-App</div>
              <div className="text-center">Email</div>
              <div>Email Frequency</div>
            </div>
            
            {NOTIFICATION_TYPES.map((type) => {
              const pref = getPreference(type.value);
              const inAppEnabled = pref?.inAppEnabled ?? true;
              const emailEnabled = pref?.emailEnabled ?? true;
              const emailFrequency = pref?.emailFrequency || "INSTANT";
              
              return (
                <div 
                  key={type.value} 
                  className="grid grid-cols-4 gap-4 items-center py-2"
                  data-testid={`preference-row-${type.value}`}
                >
                  <div>
                    <p className="font-medium text-sm">{type.label}</p>
                    <p className="text-xs text-muted-foreground">{type.description}</p>
                  </div>
                  <div className="flex justify-center">
                    <Switch
                      checked={inAppEnabled}
                      onCheckedChange={(checked) => handleToggle(type.value, "inAppEnabled", checked)}
                      data-testid={`switch-inapp-${type.value}`}
                    />
                  </div>
                  <div className="flex justify-center">
                    <Switch
                      checked={emailEnabled}
                      onCheckedChange={(checked) => handleToggle(type.value, "emailEnabled", checked)}
                      data-testid={`switch-email-${type.value}`}
                    />
                  </div>
                  <div>
                    <Select
                      value={emailFrequency}
                      onValueChange={(value) => handleEmailFrequency(type.value, value as EmailFrequency)}
                      disabled={!emailEnabled}
                    >
                      <SelectTrigger className="h-8 text-xs" data-testid={`select-frequency-${type.value}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {EMAIL_FREQUENCIES.map((freq) => (
                          <SelectItem key={freq.value} value={freq.value}>
                            {freq.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function NotificationsPage() {
  const { data: countData } = useQuery<{ count: number }>({
    queryKey: ["/api/notifications/unread-count"],
  });

  const unreadCount = countData?.count || 0;

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
            <p className="text-muted-foreground">
              Stay updated on your mentorship activities
            </p>
          </div>
          {unreadCount > 0 && (
            <Badge variant="secondary" className="text-sm">
              {unreadCount} unread
            </Badge>
          )}
        </div>

        <Tabs defaultValue="inbox" className="space-y-4">
          <TabsList>
            <TabsTrigger value="inbox" className="gap-2" data-testid="tab-inbox">
              <Inbox className="h-4 w-4" />
              Inbox
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 px-1.5">
                  {unreadCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="archived" className="gap-2" data-testid="tab-archived">
              <ArchiveIcon className="h-4 w-4" />
              Archived
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2" data-testid="tab-settings">
              <Settings className="h-4 w-4" />
              Preferences
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="inbox">
            <NotificationList filter="inbox" />
          </TabsContent>
          
          <TabsContent value="archived">
            <NotificationList filter="archived" />
          </TabsContent>
          
          <TabsContent value="settings">
            <NotificationPreferencesTab />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
