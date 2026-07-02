import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Single source of truth for status → color across the app.
 * Tones map to the semantic theme tokens (index.css) — never hardcode
 * Tailwind palette colors (bg-blue-500 etc.) for statuses.
 */
export type StatusTone =
  | "success"
  | "warning"
  | "info"
  | "danger"
  | "neutral"
  | "primary";

const STATUS_TONES: Record<string, StatusTone> = {
  // Matches / connections
  PROPOSED: "info",
  PENDING: "warning",
  ACTIVE: "success",
  PAUSED: "neutral",
  COMPLETED: "primary",
  TERMINATED: "danger",
  DECLINED: "danger",
  // Applications
  REVIEWING: "info",
  APPROVED: "success",
  REJECTED: "danger",
  WAITLISTED: "warning",
  PROVISIONED: "primary",
  // Goals / tasks
  NOT_STARTED: "neutral",
  IN_PROGRESS: "info",
  DONE: "success",
  AT_RISK: "warning",
  OVERDUE: "danger",
  // Surveys / generic lifecycle
  DRAFT: "neutral",
  OPEN: "success",
  CLOSED: "neutral",
  ARCHIVED: "neutral",
  INACTIVE: "neutral",
  LOCKED: "danger",
};

const TONE_BADGE_CLASSES: Record<StatusTone, string> = {
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  info: "bg-info/10 text-info",
  danger: "bg-destructive/10 text-destructive",
  neutral: "bg-muted text-muted-foreground",
  primary: "bg-primary/10 text-primary",
};

const TONE_DOT_CLASSES: Record<StatusTone, string> = {
  success: "bg-success",
  warning: "bg-warning",
  info: "bg-info",
  danger: "bg-destructive",
  neutral: "bg-muted-foreground",
  primary: "bg-primary",
};

export function statusTone(status: string | null | undefined): StatusTone {
  if (!status) return "neutral";
  return STATUS_TONES[status.toUpperCase().replace(/[\s-]+/g, "_")] ?? "neutral";
}

export function toneBadgeClass(tone: StatusTone): string {
  return TONE_BADGE_CLASSES[tone];
}

export function toneDotClass(tone: StatusTone): string {
  return TONE_DOT_CLASSES[tone];
}

interface StatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status: string;
  /** Override the automatic status → tone mapping. */
  tone?: StatusTone;
  /** Optional display label; defaults to the status, title-cased. */
  label?: string;
}

function formatStatusLabel(status: string): string {
  return status
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function StatusBadge({
  status,
  tone,
  label,
  className,
  ...props
}: StatusBadgeProps) {
  const resolved = tone ?? statusTone(status);
  return (
    <span
      className={cn(
        "whitespace-nowrap inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-medium",
        TONE_BADGE_CLASSES[resolved],
        className,
      )}
      {...props}
    >
      {label ?? formatStatusLabel(status)}
    </span>
  );
}
