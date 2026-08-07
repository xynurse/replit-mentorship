import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { AdminLayout } from "@/components/layouts/admin-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { TableSkeleton } from "@/components/skeletons";
import { 
  Plus, 
  ClipboardList, 
  Trash2, 
  BarChart3, 
  Eye, 
  Copy,
  CheckCircle2,
  XCircle,
  Clock
} from "lucide-react";
import type { Survey, SurveyQuestion } from "@shared/schema";
import { PageHeader } from "@/components/shared/page-header";

const surveySchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  type: z.enum(["MID_PROGRAM", "END_PROGRAM", "MATCH_FEEDBACK", "CUSTOM"]),
  isAnonymous: z.boolean().default(false),
  status: z.enum(["DRAFT", "ACTIVE", "CLOSED", "ARCHIVED"]).default("ACTIVE"),
});

type SurveyFormValues = z.infer<typeof surveySchema>;

const questionTypes = [
  { value: "TEXT", label: "Short Text" },
  { value: "TEXTAREA", label: "Long Text" },
  { value: "SELECT", label: "Single Choice" },
  { value: "MULTISELECT", label: "Multiple Choice" },
  { value: "RATING", label: "Rating (1-5)" },
  { value: "CHECKBOX", label: "Checkbox" },
  { value: "DATE", label: "Date" },
];

const surveyTypes = [
  { value: "MID_PROGRAM", label: "Mid-Program Review" },
  { value: "END_PROGRAM", label: "End-Program Review" },
  { value: "MATCH_FEEDBACK", label: "Match Feedback" },
  { value: "CUSTOM", label: "Custom Survey" },
];

export default function AdminSurveys() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [viewingResponses, setViewingResponses] = useState<Survey | null>(null);
  const [questions, setQuestions] = useState<SurveyQuestion[]>([]);
  const [newQuestion, setNewQuestion] = useState<Omit<SurveyQuestion, "id">>({
    text: "",
    type: "TEXT",
    required: false,
    options: [],
  });

  const form = useForm<SurveyFormValues>({
    resolver: zodResolver(surveySchema),
    defaultValues: {
      title: "",
      description: "",
      type: "CUSTOM",
      isAnonymous: false,
      status: "ACTIVE",
    },
  });

  const { data: surveys, isLoading: surveysLoading } = useQuery<Survey[]>({
    queryKey: ["/api/surveys"],
  });

  const { data: responses } = useQuery({
    queryKey: ["/api/surveys", viewingResponses?.id, "responses"],
    enabled: !!viewingResponses,
  });

  const createSurveyMutation = useMutation({
    mutationFn: async (data: SurveyFormValues & { questions: SurveyQuestion[] }) => {
      return apiRequest("POST", "/api/surveys", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/surveys"] });
      toast({ title: "Survey created successfully" });
      setCreateDialogOpen(false);
      form.reset();
      setQuestions([]);
    },
    onError: () => {
      toast({ title: "Failed to create survey", variant: "destructive" });
    },
  });

  const deleteSurveyMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/surveys/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/surveys"] });
      toast({ title: "Survey deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete survey", variant: "destructive" });
    },
  });

  const addQuestion = () => {
    if (!newQuestion.text.trim()) return;
    const question: SurveyQuestion = {
      ...newQuestion,
      id: crypto.randomUUID(),
    };
    setQuestions([...questions, question]);
    setNewQuestion({
      text: "",
      type: "TEXT",
      required: false,
      options: [],
    });
  };

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  const handleSubmit = (values: SurveyFormValues) => {
    if (questions.length === 0) {
      toast({ title: "Please add at least one question", variant: "destructive" });
      return;
    }
    createSurveyMutation.mutate({ ...values, questions });
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "ACTIVE":
        return <Badge variant="default"><CheckCircle2 className="w-3 h-3 mr-1" />Active</Badge>;
      case "CLOSED":
        return <Badge variant="secondary"><XCircle className="w-3 h-3 mr-1" />Closed</Badge>;
      case "DRAFT":
        return <Badge variant="outline"><Clock className="w-3 h-3 mr-1" />Draft</Badge>;
      case "ARCHIVED":
        return <Badge variant="secondary">Archived</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getTypeBadge = (type: string | null) => {
    const typeConfig: Record<string, string> = {
      MID_PROGRAM: "Mid-Program",
      END_PROGRAM: "End-Program",
      MATCH_FEEDBACK: "Match Feedback",
      CUSTOM: "Custom",
    };
    return <Badge variant="outline">{typeConfig[type || ""] || type}</Badge>;
  };

  if (!user || (user.role !== "SUPER_ADMIN" && user.role !== "ADMIN")) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">You do not have access to this page.</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <PageHeader
          title="Surveys"
          description="Create and manage feedback surveys"
          titleTestId="text-page-title"
          actions={
            <Button onClick={() => setCreateDialogOpen(true)} data-testid="button-create-survey">
              <Plus className="w-4 h-4 mr-2" />
              Create Survey
            </Button>
          }
        />

        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Survey</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Survey Title</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter survey title" data-testid="input-survey-title" />
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
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            placeholder="Enter survey description" 
                            data-testid="input-survey-description" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Survey Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-survey-type">
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {surveyTypes.map(type => (
                                <SelectItem key={type.value} value={type.value}>
                                  {type.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="isAnonymous"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between rounded-md border p-3">
                            <FormLabel className="cursor-pointer">Anonymous Responses</FormLabel>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                data-testid="switch-anonymous"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <Label className="text-base font-medium">Questions</Label>
                    
                    {questions.length > 0 && (
                      <div className="space-y-2">
                        {questions.map((q, index) => (
                          <div 
                            key={q.id} 
                            className="flex items-center justify-between gap-2 p-3 rounded-md border bg-muted/50"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{index + 1}. {q.text}</p>
                              <div className="flex flex-wrap gap-1 mt-1">
                                <Badge variant="outline" className="text-xs">
                                  {questionTypes.find(t => t.value === q.type)?.label}
                                </Badge>
                                {q.required && (
                                  <Badge variant="secondary" className="text-xs">Required</Badge>
                                )}
                              </div>
                            </div>
                            <Button 
                              type="button"
                              variant="ghost" 
                              size="icon"
                              onClick={() => removeQuestion(q.id)}
                              data-testid={`button-remove-question-${index}`}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}

                    <Card>
                      <CardContent className="pt-4 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="col-span-2">
                            <Label>Question Text</Label>
                            <Input
                              value={newQuestion.text}
                              onChange={e => setNewQuestion({ ...newQuestion, text: e.target.value })}
                              placeholder="Enter question"
                              data-testid="input-question-text"
                            />
                          </div>
                          <div>
                            <Label>Question Type</Label>
                            <Select 
                              value={newQuestion.type}
                              onValueChange={(v: SurveyQuestion["type"]) => 
                                setNewQuestion({ ...newQuestion, type: v })
                              }
                            >
                              <SelectTrigger data-testid="select-question-type">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {questionTypes.map(type => (
                                  <SelectItem key={type.value} value={type.value}>
                                    {type.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex items-end gap-4">
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={newQuestion.required}
                                onCheckedChange={v => setNewQuestion({ ...newQuestion, required: v })}
                                data-testid="switch-question-required"
                              />
                              <Label>Required</Label>
                            </div>
                            <Button 
                              type="button" 
                              onClick={addQuestion}
                              disabled={!newQuestion.text.trim()}
                              data-testid="button-add-question"
                            >
                              <Plus className="w-4 h-4 mr-1" />
                              Add
                            </Button>
                          </div>
                        </div>
                        
                        {(newQuestion.type === "SELECT" || newQuestion.type === "MULTISELECT") && (
                          <div>
                            <Label>Options (comma-separated)</Label>
                            <Input
                              value={newQuestion.options?.join(", ") || ""}
                              onChange={e => setNewQuestion({ 
                                ...newQuestion, 
                                options: e.target.value.split(",").map(s => s.trim()).filter(Boolean)
                              })}
                              placeholder="Option 1, Option 2, Option 3"
                              data-testid="input-question-options"
                            />
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setCreateDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit"
                      disabled={createSurveyMutation.isPending}
                      data-testid="button-submit-survey"
                    >
                      {createSurveyMutation.isPending ? "Creating..." : "Create Survey"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
        </Dialog>

        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all" data-testid="tab-all-surveys">All Surveys</TabsTrigger>
            <TabsTrigger value="active" data-testid="tab-active-surveys">Active</TabsTrigger>
            <TabsTrigger value="closed" data-testid="tab-closed-surveys">Closed</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {surveysLoading ? (
              <TableSkeleton rows={5} columns={5} />
            ) : !surveys || surveys.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <ClipboardList className="w-12 h-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No surveys yet</p>
                  <p className="text-sm text-muted-foreground">Create your first survey to collect feedback</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {surveys.map(survey => (
                  <Card key={survey.id} data-testid={`card-survey-${survey.id}`}>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-lg line-clamp-1">{survey.title}</CardTitle>
                        {getStatusBadge(survey.status)}
                      </div>
                      <CardDescription className="line-clamp-2">
                        {survey.description || "No description"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex flex-wrap gap-2">
                        {getTypeBadge(survey.type)}
                        {survey.isAnonymous && (
                          <Badge variant="outline">Anonymous</Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <BarChart3 className="w-4 h-4" />
                        <span>{(survey.questions as SurveyQuestion[] | null)?.length || 0} questions</span>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setViewingResponses(survey)}
                          data-testid={`button-view-responses-${survey.id}`}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Responses
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            navigator.clipboard.writeText(
                              `${window.location.origin}/survey/${survey.id}`
                            );
                            toast({ title: "Survey link copied" });
                          }}
                          data-testid={`button-copy-link-${survey.id}`}
                        >
                          <Copy className="w-4 h-4 mr-1" />
                          Copy Link
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => {
                            if (confirm("Are you sure you want to delete this survey?")) {
                              deleteSurveyMutation.mutate(survey.id);
                            }
                          }}
                          data-testid={`button-delete-survey-${survey.id}`}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="active">
            {surveys?.filter(s => s.status === "ACTIVE").length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <CheckCircle2 className="w-12 h-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No active surveys</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {surveys?.filter(s => s.status === "ACTIVE").map(survey => (
                  <Card key={survey.id}>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-lg line-clamp-1">{survey.title}</CardTitle>
                        {getStatusBadge(survey.status)}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {survey.description || "No description"}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="closed">
            {surveys?.filter(s => s.status === "CLOSED" || s.status === "ARCHIVED").length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Clock className="w-12 h-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No closed surveys</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {surveys?.filter(s => s.status === "CLOSED" || s.status === "ARCHIVED").map(survey => (
                  <Card key={survey.id}>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-lg line-clamp-1">{survey.title}</CardTitle>
                        {getStatusBadge(survey.status)}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {survey.description || "No description"}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={!!viewingResponses} onOpenChange={() => setViewingResponses(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>
              Responses — {viewingResponses?.title}
              {Array.isArray(responses) && responses.length > 0 && (
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ({responses.length} {responses.length === 1 ? "response" : "responses"})
                </span>
              )}
            </DialogTitle>
          </DialogHeader>
          {!responses || (responses as any[]).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <ClipboardList className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No responses yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Share the survey link so participants can respond.
              </p>
            </div>
          ) : (
            <Tabs defaultValue="summary" className="space-y-4">
              <TabsList>
                <TabsTrigger value="summary" data-testid="tab-response-summary">
                  <BarChart3 className="w-4 h-4 mr-1" />
                  Summary
                </TabsTrigger>
                <TabsTrigger value="individual" data-testid="tab-response-individual">
                  <Eye className="w-4 h-4 mr-1" />
                  Individual
                </TabsTrigger>
              </TabsList>

              <TabsContent value="summary">
                <ScrollArea className="max-h-[65vh] pr-1">
                  <SurveyAnalytics
                    questions={(viewingResponses?.questions as SurveyQuestion[] | null) ?? []}
                    responses={responses as any[]}
                  />
                </ScrollArea>
              </TabsContent>

              <TabsContent value="individual">
                <ScrollArea className="max-h-[65vh] pr-1">
                  <div className="space-y-4 pb-2">
                {(responses as any[]).map((response, index) => {
                  const questions = (viewingResponses?.questions as SurveyQuestion[] | null) ?? [];
                  const answers = (response.responses ?? {}) as Record<string, unknown>;
                  return (
                    <Card key={response.id}>
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between gap-2">
                          <CardTitle className="text-sm font-semibold">Response #{index + 1}</CardTitle>
                          <span className="text-xs text-muted-foreground">
                            {response.submittedAt
                              ? new Date(response.submittedAt).toLocaleString()
                              : "Unknown date"}
                            {!viewingResponses?.isAnonymous && response.userId && (
                              <span className="ml-2 text-primary/70">· Identified</span>
                            )}
                            {viewingResponses?.isAnonymous && (
                              <span className="ml-2">· Anonymous</span>
                            )}
                          </span>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {questions.length > 0 ? (
                          questions.map((q) => {
                            const raw = answers[q.id];
                            const formatted = (() => {
                              if (raw === undefined || raw === null || raw === "") return <span className="text-muted-foreground italic">No answer</span>;
                              if (Array.isArray(raw)) return raw.join(", ") || <span className="text-muted-foreground italic">None selected</span>;
                              if (typeof raw === "boolean") return raw ? "Yes" : "No";
                              if (q.type === "RATING") return `${"★".repeat(Number(raw))}${"☆".repeat(5 - Number(raw))} (${raw}/5)`;
                              return String(raw);
                            })();
                            return (
                              <div key={q.id} className="grid grid-cols-[1fr_2fr] gap-x-4 gap-y-0.5 text-sm border-b last:border-0 pb-2 last:pb-0">
                                <span className="text-muted-foreground font-medium pt-0.5 leading-snug">
                                  {q.text}
                                  {q.required && <span className="text-destructive ml-0.5">*</span>}
                                </span>
                                <span className="leading-snug">{formatted}</span>
                              </div>
                            );
                          })
                        ) : (
                          // Fallback: no question metadata, show raw key→value
                          Object.entries(answers).map(([key, val]) => (
                            <div key={key} className="grid grid-cols-[1fr_2fr] gap-x-4 text-sm border-b last:border-0 pb-2">
                              <span className="text-muted-foreground font-mono text-xs">{key}</span>
                              <span>{Array.isArray(val) ? val.join(", ") : String(val ?? "")}</span>
                            </div>
                          ))
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}

/** Aggregate view of survey responses, one block per question. */
function SurveyAnalytics({
  questions,
  responses,
}: {
  questions: SurveyQuestion[];
  responses: { responses?: Record<string, unknown> }[];
}) {
  const total = responses.length;
  const answers = responses.map((r) => (r.responses ?? {}) as Record<string, unknown>);

  if (questions.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-6 text-center">
        This survey has no question metadata, so responses can't be aggregated. See the Individual tab.
      </p>
    );
  }

  return (
    <div className="space-y-6 pb-2">
      <p className="text-sm text-muted-foreground">
        {total} {total === 1 ? "response" : "responses"} total
      </p>
      {questions.map((q) => {
        // Collect this question's non-empty answers across all responses.
        const values = answers
          .map((a) => a[q.id])
          .filter((v) => v !== undefined && v !== null && v !== "");
        const answeredCount = values.length;

        return (
          <div key={q.id} className="space-y-2 border-b last:border-0 pb-4 last:pb-0">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-medium">
                {q.text}
                {q.required && <span className="text-destructive ml-0.5">*</span>}
              </p>
              <span className="text-xs text-muted-foreground shrink-0">
                {answeredCount}/{total} answered
              </span>
            </div>

            {q.type === "RATING" ? (
              <RatingBreakdown values={values.map((v) => Number(v)).filter((n) => !Number.isNaN(n))} />
            ) : q.type === "SELECT" || q.type === "MULTISELECT" ? (
              <OptionBreakdown values={values} options={q.options ?? []} answeredCount={answeredCount} />
            ) : q.type === "CHECKBOX" ? (
              <CheckboxBreakdown values={values} answeredCount={answeredCount} />
            ) : (
              <TextAnswers values={values.map((v) => String(v))} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function StatBar({ label, count, total }: { label: string; count: number; total: number }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="w-32 shrink-0 truncate text-muted-foreground" title={label}>{label}</span>
      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
        <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
      </div>
      <span className="w-16 shrink-0 text-right text-muted-foreground">{count} ({pct}%)</span>
    </div>
  );
}

function RatingBreakdown({ values }: { values: number[] }) {
  const total = values.length;
  const avg = total > 0 ? values.reduce((s, v) => s + v, 0) / total : 0;
  return (
    <div className="space-y-2">
      <p className="text-sm">
        Average: <span className="font-semibold">{avg.toFixed(1)}</span> / 5
      </p>
      {[5, 4, 3, 2, 1].map((star) => (
        <StatBar key={star} label={`${star} ★`} count={values.filter((v) => v === star).length} total={total} />
      ))}
    </div>
  );
}

function OptionBreakdown({
  values,
  options,
  answeredCount,
}: {
  values: unknown[];
  options: string[];
  answeredCount: number;
}) {
  // MULTISELECT answers are arrays; SELECT are scalars. Flatten both.
  const flat = values.flatMap((v) => (Array.isArray(v) ? v : [v])).map((v) => String(v));
  const counts = new Map<string, number>();
  for (const v of flat) counts.set(v, (counts.get(v) ?? 0) + 1);
  // Seed declared options so zero-count options still show.
  const labels = options.length > 0 ? options : Array.from(counts.keys());
  return (
    <div className="space-y-2">
      {labels.map((opt) => (
        <StatBar key={opt} label={opt} count={counts.get(opt) ?? 0} total={answeredCount} />
      ))}
    </div>
  );
}

function CheckboxBreakdown({ values, answeredCount }: { values: unknown[]; answeredCount: number }) {
  const yes = values.filter((v) => v === true || v === "true" || v === "Yes").length;
  return (
    <div className="space-y-2">
      <StatBar label="Yes" count={yes} total={answeredCount} />
      <StatBar label="No" count={answeredCount - yes} total={answeredCount} />
    </div>
  );
}

function TextAnswers({ values }: { values: string[] }) {
  if (values.length === 0) {
    return <p className="text-sm text-muted-foreground italic">No answers</p>;
  }
  return (
    <ul className="space-y-1.5">
      {values.map((v, i) => (
        <li key={i} className="text-sm rounded-md bg-muted/50 px-3 py-2">{v}</li>
      ))}
    </ul>
  );
}
