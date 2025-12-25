import { useEffect, useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Bell, Check, CheckCheck, Archive, Trash2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { io, Socket } from "socket.io-client";
import type { Notification } from "@shared/schema";

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
      return "border-l-2 border-l-orange-500";
    case "URGENT":
      return "border-l-2 border-l-red-500";
    default:
      return "";
  }
}

function NotificationItem({ 
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
    <div
      className={cn(
        "p-3 hover-elevate transition-colors",
        !notification.isRead && "bg-muted/50",
        priorityStyle
      )}
      data-testid={`notification-item-${notification.id}`}
    >
      <div className="flex gap-3">
        <Badge variant="secondary" className={cn("text-xs shrink-0", typeInfo.bg)}>
          {typeInfo.label}
        </Badge>
        <div className="flex-1 min-w-0">
          <p className={cn("text-sm font-medium truncate", !notification.isRead && "font-semibold")}>
            {notification.title}
          </p>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {notification.message}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {notification.createdAt && formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1 mt-2 pt-2 border-t">
        {!notification.isRead && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={() => onMarkRead(notification.id)}
            data-testid={`button-mark-read-${notification.id}`}
          >
            <Check className="h-3 w-3 mr-1" />
            Mark read
          </Button>
        )}
        {notification.actionUrl && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            asChild
          >
            <Link href={notification.actionUrl}>
              <ExternalLink className="h-3 w-3 mr-1" />
              View
            </Link>
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs ml-auto"
          onClick={() => onArchive(notification.id)}
          data-testid={`button-archive-${notification.id}`}
        >
          <Archive className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs text-destructive"
          onClick={() => onDelete(notification.id)}
          data-testid={`button-delete-${notification.id}`}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

export function NotificationBell() {
  const { user } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const [realtimeCount, setRealtimeCount] = useState<number | null>(null);

  const { data: countData } = useQuery<{ count: number }>({
    queryKey: ["/api/notifications/unread-count"],
    refetchInterval: 30000,
  });

  const { data: notifications, isLoading } = useQuery<Notification[]>({
    queryKey: ["/api/notifications", { isArchived: false, limit: 10 }],
  });

  useEffect(() => {
    if (!user) return;

    const socket = io({
      path: "/socket.io",
      withCredentials: true,
      transports: ["websocket", "polling"],
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Notification socket connected");
    });

    socket.on("notification:new", (notification: Notification) => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
    });

    socket.on("notification:count", ({ count }: { count: number }) => {
      setRealtimeCount(count);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user]);

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

  const unreadCount = realtimeCount ?? countData?.count ?? 0;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative" 
          data-testid="button-notifications"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-96 p-0" data-testid="notifications-popover">
        <div className="flex items-center justify-between gap-4 p-4 border-b">
          <h4 className="font-semibold">Notifications</h4>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => markAllReadMutation.mutate()}
                disabled={markAllReadMutation.isPending}
                data-testid="button-mark-all-read"
              >
                <CheckCheck className="h-3 w-3 mr-1" />
                Mark all read
              </Button>
            )}
          </div>
        </div>
        
        <ScrollArea className="h-96">
          {isLoading ? (
            <div className="p-4 text-center text-muted-foreground">
              Loading notifications...
            </div>
          ) : notifications && notifications.length > 0 ? (
            <div className="divide-y">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkRead={(id) => markReadMutation.mutate(id)}
                  onArchive={(id) => archiveMutation.mutate(id)}
                  onDelete={(id) => deleteMutation.mutate(id)}
                />
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <Bell className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No notifications</p>
              <p className="text-sm text-muted-foreground">You're all caught up</p>
            </div>
          )}
        </ScrollArea>

        <Separator />
        <div className="p-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-full"
            asChild
          >
            <Link href="/notifications">
              View all notifications
            </Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
