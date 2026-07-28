import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Star, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  SESSION_RATING_MAX,
  type MeetingFeedbackPair,
  type SessionFeedbackEntry,
} from "@shared/session-feedback";

interface StarInputProps {
  value: number;
  onChange?: (value: number) => void;
  readOnly?: boolean;
  size?: "sm" | "md";
}

/** 1–SESSION_RATING_MAX star control. Read-only mode is used to render results. */
function StarRating({ value, onChange, readOnly, size = "md" }: StarInputProps) {
  const [hover, setHover] = useState(0);
  const dim = size === "sm" ? "h-4 w-4" : "h-7 w-7";

  return (
    <div className="flex items-center gap-1" role={readOnly ? undefined : "radiogroup"}>
      {Array.from({ length: SESSION_RATING_MAX }, (_, i) => i + 1).map((n) => {
        const filled = (hover || value) >= n;
        return (
          <button
            key={n}
            type="button"
            disabled={readOnly}
            aria-label={`${n} star${n === 1 ? "" : "s"}`}
            aria-checked={value === n}
            role={readOnly ? undefined : "radio"}
            className={cn(
              "transition-transform",
              !readOnly && "hover:scale-110 cursor-pointer",
              readOnly && "cursor-default",
            )}
            onClick={readOnly ? undefined : () => onChange?.(n)}
            onMouseEnter={readOnly ? undefined : () => setHover(n)}
            onMouseLeave={readOnly ? undefined : () => setHover(0)}
            data-testid={`star-${n}`}
          >
            <Star
              className={cn(
                dim,
                filled ? "fill-warning text-warning" : "text-muted-foreground/40",
              )}
            />
          </button>
        );
      })}
    </div>
  );
}

function EntryCard({ label, entry }: { label: string; entry: SessionFeedbackEntry | null }) {
  return (
    <div className="rounded-md border p-3">
      <p className="text-xs font-medium text-muted-foreground mb-2">{label}</p>
      {entry ? (
        <div className="space-y-2">
          <StarRating value={entry.rating} readOnly size="sm" />
          {entry.wentWell && <p className="text-sm">{entry.wentWell}</p>}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground italic">No feedback yet</p>
      )}
    </div>
  );
}

interface SessionFeedbackDialogProps {
  meetingId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** "submit" — a participant rates the session. "view" — read both sides. */
  mode: "submit" | "view";
  /** Shown in the header, e.g. "Session with Dr. Lee". */
  title?: string;
}

export function SessionFeedbackDialog({
  meetingId,
  open,
  onOpenChange,
  mode,
  title,
}: SessionFeedbackDialogProps) {
  const { toast } = useToast();
  const [rating, setRating] = useState(0);
  const [wentWell, setWentWell] = useState("");

  const { data: feedback, isLoading } = useQuery<MeetingFeedbackPair>({
    queryKey: [`/api/meetings/${meetingId}/feedback`],
    enabled: open,
  });

  const submit = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/meetings/${meetingId}/feedback`, {
        rating,
        wentWell: wentWell.trim(),
      });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Thanks for the feedback" });
      queryClient.invalidateQueries({ queryKey: [`/api/meetings/${meetingId}/feedback`] });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({ title: "Couldn't save feedback", description: error.message, variant: "destructive" });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="dialog-session-feedback">
        <DialogHeader>
          <DialogTitle>{mode === "submit" ? "How was this session?" : "Session feedback"}</DialogTitle>
          <DialogDescription>
            {title ?? (mode === "submit"
              ? "Your answers are shared with the program admins, not your match."
              : "Feedback from both sides of this match.")}
          </DialogDescription>
        </DialogHeader>

        {mode === "view" ? (
          isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : (
            <div className="space-y-3">
              <EntryCard label="Mentor" entry={feedback?.mentor ?? null} />
              <EntryCard label="Mentee" entry={feedback?.mentee ?? null} />
            </div>
          )
        ) : (
          <div className="space-y-5 py-2">
            <div className="space-y-2">
              <Label>How productive was this session?</Label>
              <StarRating value={rating} onChange={setRating} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="went-well">
                One thing to build on or change next time{" "}
                <span className="text-muted-foreground font-normal">(optional)</span>
              </Label>
              <Textarea
                id="went-well"
                value={wentWell}
                onChange={(e) => setWentWell(e.target.value)}
                placeholder="A quick note for yourself and the program…"
                rows={3}
                maxLength={1000}
                data-testid="input-went-well"
              />
            </div>
          </div>
        )}

        {mode === "submit" && (
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)} data-testid="button-cancel-feedback">
              Cancel
            </Button>
            <Button
              onClick={() => submit.mutate()}
              disabled={submit.isPending || rating === 0}
              data-testid="button-submit-feedback"
            >
              {submit.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Submit
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
