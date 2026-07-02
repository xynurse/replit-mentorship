import { useState } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { CheckCircle2, Loader2, Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface SurveyQuestion {
  id: string;
  text: string;
  type: "TEXT" | "TEXTAREA" | "SELECT" | "MULTISELECT" | "RATING" | "CHECKBOX" | "DATE";
  required: boolean;
  options?: string[];
}

interface Survey {
  id: string;
  title: string;
  description: string | null;
  type: "MID_PROGRAM" | "END_PROGRAM" | "MATCH_FEEDBACK" | "CUSTOM";
  status: "DRAFT" | "ACTIVE" | "CLOSED" | "ARCHIVED";
  cohortId: string | null;
  questions: SurveyQuestion[];
  isAnonymous: boolean;
  dueDate: Date | null;
  createdById: string | null;
  createdAt: Date;
}

function RatingInput({
  value,
  onChange,
}: {
  value: number | undefined;
  onChange: (v: number) => void;
}) {
  const [hovered, setHovered] = useState<number | null>(null);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = hovered !== null ? star <= hovered : star <= (value ?? 0);
        return (
          <button
            key={star}
            type="button"
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(null)}
            onClick={() => onChange(star)}
            className="focus:outline-none"
            aria-label={`Rate ${star} out of 5`}
          >
            <Star
              className={cn(
                "h-7 w-7 transition-colors",
                filled
                  ? "fill-warning text-warning"
                  : "fill-transparent text-muted-foreground"
              )}
            />
          </button>
        );
      })}
    </div>
  );
}

function QuestionField({
  question,
  value,
  onChange,
}: {
  question: SurveyQuestion;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  switch (question.type) {
    case "TEXT":
      return (
        <Input
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Your answer"
        />
      );

    case "TEXTAREA":
      return (
        <Textarea
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Your answer"
          rows={4}
        />
      );

    case "SELECT":
      return (
        <Select value={(value as string) ?? ""} onValueChange={(v) => onChange(v)}>
          <SelectTrigger>
            <SelectValue placeholder="Select an option" />
          </SelectTrigger>
          <SelectContent>
            {(question.options ?? []).map((opt) => (
              <SelectItem key={opt} value={opt}>
                {opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );

    case "MULTISELECT": {
      const selected = (value as string[]) ?? [];
      return (
        <div className="flex flex-col gap-2">
          {(question.options ?? []).map((opt) => (
            <div key={opt} className="flex items-center gap-2">
              <Checkbox
                id={`${question.id}-${opt}`}
                checked={selected.includes(opt)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    onChange([...selected, opt]);
                  } else {
                    onChange(selected.filter((s) => s !== opt));
                  }
                }}
              />
              <Label htmlFor={`${question.id}-${opt}`} className="cursor-pointer font-normal">
                {opt}
              </Label>
            </div>
          ))}
        </div>
      );
    }

    case "RATING":
      return (
        <RatingInput
          value={value as number | undefined}
          onChange={(v) => onChange(v)}
        />
      );

    case "CHECKBOX":
      return (
        <div className="flex items-center gap-2">
          <Switch
            id={question.id}
            checked={(value as boolean) ?? false}
            onCheckedChange={(checked) => onChange(checked)}
          />
          <Label htmlFor={question.id} className="cursor-pointer font-normal">
            Yes
          </Label>
        </div>
      );

    case "DATE":
      return (
        <Input
          type="date"
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
        />
      );

    default:
      return null;
  }
}

export default function SurveyPage() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [submitted, setSubmitted] = useState(false);

  const { data: survey, isLoading, error } = useQuery<Survey>({
    queryKey: [`/api/surveys/${id}`],
    enabled: !!id,
  });

  const submitMutation = useMutation({
    mutationFn: async (responses: Record<string, unknown>) => {
      const res = await apiRequest("POST", `/api/surveys/${id}/responses`, { responses });
      return res.json();
    },
    onSuccess: () => {
      setSubmitted(true);
    },
    onError: (err: Error) => {
      toast({
        title: "Submission failed",
        description: err.message ?? "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!survey) return;

    // Validate required fields
    for (const question of survey.questions) {
      if (!question.required) continue;
      const answer = answers[question.id];
      const isEmpty =
        answer === undefined ||
        answer === null ||
        answer === "" ||
        (Array.isArray(answer) && answer.length === 0);
      if (isEmpty) {
        toast({
          title: "Required field missing",
          description: `Please answer: "${question.text}"`,
          variant: "destructive",
        });
        return;
      }
    }

    submitMutation.mutate(answers);
  }

  function setAnswer(questionId: string, value: unknown) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }

  // Loading state
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-8">
          <div className="w-full max-w-2xl space-y-4">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-5 w-1/2" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Error / not found
  if (error || !survey) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-8">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <CardTitle>Survey not found</CardTitle>
              <CardDescription>
                This survey does not exist or you do not have permission to view it.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  // Unavailable statuses
  if (survey.status === "DRAFT" || survey.status === "ARCHIVED") {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-8">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <CardTitle>{survey.title}</CardTitle>
              <CardDescription>This survey is not currently available.</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  if (survey.status === "CLOSED") {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-8">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <CardTitle>{survey.title}</CardTitle>
              <CardDescription>This survey has been closed.</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  // Thank you screen
  if (submitted) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-8">
          <Card className="w-full max-w-2xl text-center">
            <CardHeader className="items-center gap-3">
              <CheckCircle2 className="h-12 w-12 text-success" />
              <CardTitle>Thank you!</CardTitle>
              <CardDescription>
                Your response to &ldquo;{survey.title}&rdquo; has been submitted successfully.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  // Active survey form
  return (
    <DashboardLayout>
      <div className="flex justify-center py-8">
        <form onSubmit={handleSubmit} className="w-full max-w-2xl space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{survey.title}</CardTitle>
              {survey.description && (
                <CardDescription>{survey.description}</CardDescription>
              )}
              {survey.isAnonymous && (
                <p className="text-xs text-muted-foreground pt-1">
                  This survey is anonymous. Your identity will not be attached to your responses.
                </p>
              )}
            </CardHeader>
          </Card>

          {survey.questions.map((question, index) => (
            <Card key={question.id}>
              <CardHeader className="pb-3">
                <Label className="text-base font-medium leading-snug">
                  {index + 1}. {question.text}
                  {question.required && (
                    <span className="text-destructive ml-1" aria-label="required">
                      *
                    </span>
                  )}
                </Label>
              </CardHeader>
              <CardContent>
                <QuestionField
                  question={question}
                  value={answers[question.id]}
                  onChange={(v) => setAnswer(question.id, v)}
                />
              </CardContent>
            </Card>
          ))}

          <div className="flex justify-end pb-8">
            <Button type="submit" disabled={submitMutation.isPending} size="lg">
              {submitMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Submit Survey
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
