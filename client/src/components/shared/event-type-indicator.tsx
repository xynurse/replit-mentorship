import { cn } from "@/lib/utils";
import {
  statusTone,
  toneBadgeClass,
  toneDotClass,
  type StatusTone,
} from "@/components/shared/status-badge";

export type EventType = "meeting" | "block" | "goal" | "task" | "reminder";

const EVENT_TONES: Record<EventType, StatusTone> = {
  meeting: "primary",
  block: "neutral",
  goal: "info",
  task: "warning",
  reminder: "info",
};

const EVENT_LABELS: Record<EventType, string> = {
  meeting: "Meeting",
  block: "Unavailable",
  goal: "Goal",
  task: "Task",
  reminder: "Reminder",
};

export function eventTone(type: string): StatusTone {
  return EVENT_TONES[type as EventType] ?? statusTone(type);
}

interface EventTypeIndicatorProps {
  type: string;
  variant?: "dot" | "badge";
  label?: string;
  className?: string;
}

/**
 * Calendar event-type indicator. Replaces inline ternary color mapping —
 * all calendar surfaces (dots, badges, legends) share this one mapping.
 */
export function EventTypeIndicator({
  type,
  variant = "dot",
  label,
  className,
}: EventTypeIndicatorProps) {
  const tone = eventTone(type);
  if (variant === "dot") {
    return (
      <span
        className={cn("inline-block h-2 w-2 shrink-0 rounded-full", toneDotClass(tone), className)}
        aria-label={label ?? EVENT_LABELS[type as EventType] ?? type}
      />
    );
  }
  return (
    <span
      className={cn(
        "whitespace-nowrap inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-medium",
        toneBadgeClass(tone),
        className,
      )}
    >
      {label ?? EVENT_LABELS[type as EventType] ?? type}
    </span>
  );
}
