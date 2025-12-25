import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">You do not have access to this page.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold" data-testid="text-page-title">Surveys</h1>
            <p className="text-muted-foreground">Create and manage feedback surveys</p>
          </div>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-create-survey">
                <Plus className="w-4 h-4 mr-2" />
                Create Survey
              </Button>
            </DialogTrigger>
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
        </div>

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
            <DialogTitle>Survey Responses: {viewingResponses?.title}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            {!responses || (responses as any[]).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <ClipboardList className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No responses yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {(responses as any[]).map((response, index) => (
                  <Card key={response.id}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between gap-2">
                        <CardTitle className="text-base">Response #{index + 1}</CardTitle>
                        <span className="text-sm text-muted-foreground">
                          {new Date(response.submittedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <pre className="text-sm whitespace-pre-wrap">
                        {JSON.stringify(response.answers, null, 2)}
                      </pre>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
