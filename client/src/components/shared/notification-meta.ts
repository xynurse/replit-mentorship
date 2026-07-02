import type { LucideIcon } from "lucide-react";
import {
  AlertCircle,
  Bell,
  Calendar,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Clock,
  FileText,
  Flag,
  Hand,
  Hourglass,
  Info,
  Megaphone,
  MessageCircle,
  MessageSquare,
  Paperclip,
  Target,
  TrendingUp,
  UserCheck,
  Users,
  XCircle,
} from "lucide-react";
import type { StatusTone } from "./status-badge";

export interface NotificationMeta {
  icon: LucideIcon;
  tone: StatusTone;
}

const NOTIFICATION_META: Record<string, NotificationMeta> = {
  WELCOME: { icon: Hand, tone: "neutral" },
  APPLICATION_RECEIVED: { icon: FileText, tone: "neutral" },
  APPLICATION_APPROVED: { icon: CheckCircle2, tone: "success" },
  APPLICATION_REJECTED: { icon: XCircle, tone: "danger" },
  MATCH_PROPOSED: { icon: Users, tone: "neutral" },
  MATCH_CONFIRMED: { icon: UserCheck, tone: "success" },
  NEW_MESSAGE: { icon: MessageSquare, tone: "neutral" },
  NEW_ANNOUNCEMENT: { icon: Megaphone, tone: "neutral" },
  TASK_ASSIGNED: { icon: ClipboardList, tone: "neutral" },
  TASK_DUE_SOON: { icon: Clock, tone: "neutral" },
  TASK_OVERDUE: { icon: AlertCircle, tone: "danger" },
  TASK_COMPLETED: { icon: CheckCircle2, tone: "success" },
  GOAL_APPROVED: { icon: Target, tone: "success" },
  GOAL_FEEDBACK: { icon: MessageCircle, tone: "neutral" },
  GOAL_MILESTONE_DUE: { icon: Flag, tone: "neutral" },
  MEETING_REMINDER: { icon: CalendarClock, tone: "neutral" },
  MEETING_SCHEDULED: { icon: Calendar, tone: "neutral" },
  DOCUMENT_SHARED: { icon: Paperclip, tone: "neutral" },
  MENTEE_PROGRESS_UPDATE: { icon: TrendingUp, tone: "neutral" },
  COHORT_ENDING_SOON: { icon: Hourglass, tone: "neutral" },
  SYSTEM_ANNOUNCEMENT: { icon: Info, tone: "neutral" },
};

export function notificationMeta(type: string): NotificationMeta {
  return NOTIFICATION_META[type] ?? { icon: Bell, tone: "neutral" };
}

export function priorityAccentClass(priority: string | null | undefined): string {
  switch (priority) {
    case "HIGH":
      return "border-l-warning";
    case "URGENT":
      return "border-l-destructive";
    default:
      return "";
  }
}
