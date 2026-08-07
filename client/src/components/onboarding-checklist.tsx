import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { CheckCircle2, Circle, ArrowRight, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface OnboardingStep {
  key: string;
  done: boolean;
}

interface OnboardingProgress {
  steps: OnboardingStep[];
  completed: number;
  total: number;
}

/** Copy for each derived step, keyed to the server's step keys. */
function stepMeta(key: string, isMentor: boolean): { label: string; href: string } {
  switch (key) {
    case "profile":
      return { label: "Complete your profile", href: "/my-profile" };
    case "coc":
      return { label: "Accept the Code of Conduct", href: "/onboarding/coc" };
    case "match":
      return {
        label: isMentor ? "Get matched with a mentee" : "Get matched with a mentor",
        href: "/connections",
      };
    case "goal":
      return { label: "Set your first goal", href: "/goals" };
    case "message":
      return { label: "Message your match", href: "/messages" };
    case "meeting":
      return { label: "Log your first session", href: "/calendar" };
    default:
      return { label: key, href: "/" };
  }
}

/**
 * Getting-started checklist for new members. Derived from real activity by
 * the server. Renders nothing once every step is complete, so established
 * users never see it.
 */
export function OnboardingChecklist({ isMentor }: { isMentor: boolean }) {
  const { data, isLoading } = useQuery<OnboardingProgress>({
    queryKey: ["/api/onboarding/progress"],
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-2 w-full" />
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-6 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!data || data.total === 0 || data.completed >= data.total) {
    return null;
  }

  const pct = Math.round((data.completed / data.total) * 100);

  return (
    <Card className="border-primary/30 bg-primary/[0.02]" data-testid="card-onboarding-checklist">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          Getting Started
        </CardTitle>
        <CardDescription>
          {data.completed} of {data.total} steps complete
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Progress value={pct} className="h-2" />
        <ul className="space-y-1">
          {data.steps.map((step) => {
            const meta = stepMeta(step.key, isMentor);
            return (
              <li key={step.key}>
                {step.done ? (
                  <div
                    className="flex items-center gap-2 p-2 -mx-2 rounded-md text-sm text-muted-foreground"
                    data-testid={`onboarding-step-${step.key}`}
                  >
                    <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                    <span className="line-through">{meta.label}</span>
                  </div>
                ) : (
                  <Link href={meta.href}>
                    <div
                      className="group flex items-center gap-2 p-2 -mx-2 rounded-md text-sm hover-elevate cursor-pointer"
                      data-testid={`onboarding-step-${step.key}`}
                    >
                      <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="flex-1 font-medium">{meta.label}</span>
                      <ArrowRight className={cn("h-4 w-4 text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity")} />
                    </div>
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
