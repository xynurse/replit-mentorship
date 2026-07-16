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
import { Separator } from "@/components/ui/separator";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { toneBadgeClass } from "@/components/shared/status-badge";
import { notificationMeta, priorityAccentClass } from "@/components/shared/notification-meta";
import { EmptyState } from "@/components/shared/empty-state";
import * as Ably from "ably";
import type { Notification } from "@shared/schema";

function getPriorityStyle(priority: string | null) {
  const accent = priorityAccentClass(priority);
  return accent ? cn("border-l-2", accent) : "";
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
  const { icon: TypeIcon, tone } = notificationMeta(notification.type);
  const priorityStyle = getPriorityStyle(notification.priority);

  return (
    <div
      className={cn(
        "p-3 hover-elevate transition-colors",
        !notification.isRead && "bg-primary/5",
        priorityStyle
      )}
      data-testid={`notification-item-${notification.id}`}
    >
      <div className="flex gap-3">
        <div
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-md",
            toneBadgeClass(tone)
          )}
        >
          <TypeIcon className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {!notification.isRead && (
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
            )}
            <p className={cn("text-sm font-medium truncate", !notification.isRead && "font-semibold")}>
              {notification.title}
            </p>
          </div>
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
  const ablyRef = useRef<Ably.Realtime | null>(null);
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

    const client = new Ably.Realtime({
      authUrl: "/api/ably/auth",
      authMethod: "POST",
    });
    ablyRef.current = client;

    const chan = client.channels.get(`user:${user.id}`);
    chan.subscribe("notification:new", () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
    });
    chan.subscribe("notification:count", (msg) => {
      const { count } = msg.data as { count: number };
      setRealtimeCount(count);
    });

    return () => {
      chan.unsubscribe();
      client.close();
      ablyRef.current = null;
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
            <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
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
            <EmptyState
              icon={Bell}
              title="No notifications"
              description="You're all caught up"
              className="px-8 py-8"
            />
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
