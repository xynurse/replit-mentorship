import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import type { Goal, GoalCategory, GoalStatus, Milestone } from "@shared/schema";
import {
  Target,
  Plus,
  ChevronLeft,
  ChevronRight,
  Check,
  Clock,
  Calendar,
  Flag,
  CheckCircle2,
  XCircle,
  Pause,
  TrendingUp,
  Sparkles,
  Ruler,
  Lightbulb,
  Link,
  CalendarDays,
  MoreVertical,
  Trash2,
  Edit,
  FileDown,
} from "lucide-react";
import { exportGoalsToPDF, type GoalData } from "@/lib/pdf-export";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const GOAL_CATEGORY_OPTIONS: { value: GoalCategory; label: string; description: string }[] = [
  { value: "SHORT_TERM", label: "Short Term", description: "Goals to achieve within 1-3 months" },
  { value: "LONG_TERM", label: "Long Term", description: "Goals for 6+ months" },
  { value: "MILESTONE", label: "Milestone", description: "Key achievements in your journey" },
  { value: "STRETCH", label: "Stretch Goal", description: "Ambitious goals that push your limits" },
];

const GOAL_STATUS_OPTIONS: { value: GoalStatus; label: string; icon: typeof Clock }[] = [
  { value: "NOT_STARTED", label: "Not Started", icon: Clock },
  { value: "IN_PROGRESS", label: "In Progress", icon: TrendingUp },
  { value: "COMPLETED", label: "Completed", icon: CheckCircle2 },
  { value: "ABANDONED", label: "Abandoned", icon: XCircle },
  { value: "DEFERRED", label: "Deferred", icon: Pause },
];

function formatDate(date?: Date | string | null): string {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getStatusBadgeVariant(status: GoalStatus): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "COMPLETED": return "default";
    case "IN_PROGRESS": return "secondary";
    case "ABANDONED": return "destructive";
    case "DEFERRED": return "outline";
    default: return "outline";
  }
}

function getCategoryBadgeVariant(category: GoalCategory): "default" | "secondary" | "destructive" | "outline" {
  switch (category) {
    case "STRETCH": return "destructive";
    case "LONG_TERM": return "default";
    case "MILESTONE": return "secondary";
    default: return "outline";
  }
}

function formatMeasurableMetrics(metrics: unknown): string {
  if (!metrics) return "";
  if (typeof metrics === "string") return metrics;
  if (typeof metrics === "object" && metrics !== null) {
    const desc = (metrics as Record<string, unknown>).description;
    if (typeof desc === "string") return desc;
    return JSON.stringify(metrics);
  }
  return String(metrics);
}

const SMART_STEPS = [
  { id: "specific", title: "Specific", icon: Target, description: "What exactly do you want to accomplish?" },
  { id: "measurable", title: "Measurable", icon: Ruler, description: "How will you track progress and know when you've achieved it?" },
  { id: "achievable", title: "Achievable", icon: Lightbulb, description: "Is this goal realistic given your resources and constraints?" },
  { id: "relevant", title: "Relevant", icon: Link, description: "Why is this goal important to your professional development?" },
  { id: "timeBound", title: "Time-Bound", icon: CalendarDays, description: "When do you want to achieve this goal?" },
];

const goalFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  specificDetails: z.string().optional(),
  measurableMetrics: z.string().optional(),
  achievabilityNotes: z.string().optional(),
  relevanceExplanation: z.string().optional(),
  category: z.enum(["SHORT_TERM", "LONG_TERM", "MILESTONE", "STRETCH"]).default("SHORT_TERM"),
  targetDate: z.string().optional(),
});

type GoalFormValues = z.infer<typeof goalFormSchema>;

interface GoalWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

function GoalWizard({ isOpen, onClose, onSuccess }: GoalWizardProps) {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);

  const form = useForm<GoalFormValues>({
    resolver: zodResolver(goalFormSchema),
    defaultValues: {
      title: "",
      description: "",
      specificDetails: "",
      measurableMetrics: "",
      achievabilityNotes: "",
      relevanceExplanation: "",
      category: "SHORT_TERM",
      targetDate: "",
    },
  });

  const createGoalMutation = useMutation({
    mutationFn: async (data: GoalFormValues) => {
      const payload = {
        ...data,
        targetDate: data.targetDate ? new Date(data.targetDate) : null,
        measurableMetrics: data.measurableMetrics ? { description: data.measurableMetrics } : null,
      };
      return apiRequest("POST", "/api/goals", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
      toast({ title: "Goal created successfully!" });
      form.reset();
      setCurrentStep(0);
      onSuccess();
    },
    onError: () => {
      toast({ title: "Failed to create goal", variant: "destructive" });
    },
  });

  const handleNext = async () => {
    const currentStepId = SMART_STEPS[currentStep].id;
    let fieldsToValidate: (keyof GoalFormValues)[] = [];

    switch (currentStepId) {
      case "specific":
        fieldsToValidate = ["title", "description", "specificDetails"];
        break;
      case "measurable":
        fieldsToValidate = ["measurableMetrics"];
        break;
      case "achievable":
        fieldsToValidate = ["achievabilityNotes"];
        break;
      case "relevant":
        fieldsToValidate = ["relevanceExplanation", "category"];
        break;
      case "timeBound":
        fieldsToValidate = ["targetDate"];
        break;
    }

    const isValid = await form.trigger(fieldsToValidate);
    if (isValid) {
      if (currentStep < SMART_STEPS.length - 1) {
        setCurrentStep(currentStep + 1);
      } else {
        form.handleSubmit((data) => createGoalMutation.mutate(data))();
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleClose = () => {
    form.reset();
    setCurrentStep(0);
    onClose();
  };

  const currentStepData = SMART_STEPS[currentStep];
  const StepIcon = currentStepData.icon;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <StepIcon className="h-5 w-5" />
            Create SMART Goal - {currentStepData.title}
          </DialogTitle>
          <DialogDescription>{currentStepData.description}</DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-center gap-2 py-4">
          {SMART_STEPS.map((step, index) => (
            <div
              key={step.id}
              className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors ${
                index === currentStep
                  ? "bg-primary text-primary-foreground"
                  : index < currentStep
                  ? "bg-green-600 text-white"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {index < currentStep ? <Check className="h-4 w-4" /> : index + 1}
            </div>
          ))}
        </div>

        <Form {...form}>
          <form className="space-y-4">
            {currentStep === 0 && (
              <>
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Goal Title *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Complete Healthcare Leadership Certification"
                          {...field}
                          data-testid="input-goal-title"
                        />
                      </FormControl>
                      <FormDescription>A clear, concise statement of what you want to achieve</FormDescription>
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
                          placeholder="Provide more context about this goal..."
                          {...field}
                          data-testid="input-goal-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="specificDetails"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Specific Details</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Who is involved? What resources do you need? Where will this happen?"
                          className="min-h-[100px]"
                          {...field}
                          data-testid="input-goal-specific"
                        />
                      </FormControl>
                      <FormDescription>The more specific, the better you can plan your path to success</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            {currentStep === 1 && (
              <FormField
                control={form.control}
                name="measurableMetrics"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>How Will You Measure Success?</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="e.g., Complete 12 modules, Pass final exam with 80%+, Receive certificate"
                        className="min-h-[150px]"
                        {...field}
                        data-testid="input-goal-measurable"
                      />
                    </FormControl>
                    <FormDescription>Define specific metrics or milestones that indicate progress and completion</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {currentStep === 2 && (
              <FormField
                control={form.control}
                name="achievabilityNotes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>What Makes This Goal Achievable?</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Consider your skills, resources, time, and support. What obstacles might you face and how will you overcome them?"
                        className="min-h-[150px]"
                        {...field}
                        data-testid="input-goal-achievable"
                      />
                    </FormControl>
                    <FormDescription>Be realistic about what you can accomplish given your current situation</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {currentStep === 3 && (
              <>
                <FormField
                  control={form.control}
                  name="relevanceExplanation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Why Is This Goal Important?</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="How does this goal align with your career aspirations? What impact will achieving it have?"
                          className="min-h-[120px]"
                          {...field}
                          data-testid="input-goal-relevant"
                        />
                      </FormControl>
                      <FormDescription>Connect this goal to your broader professional development</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Goal Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-goal-category">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {GOAL_CATEGORY_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              <div className="flex flex-col">
                                <span>{option.label}</span>
                                <span className="text-xs text-muted-foreground">{option.description}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            {currentStep === 4 && (
              <FormField
                control={form.control}
                name="targetDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target Completion Date</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                        data-testid="input-goal-target-date"
                      />
                    </FormControl>
                    <FormDescription>Set a realistic deadline that creates urgency without being overwhelming</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </form>
        </Form>

        <DialogFooter className="flex justify-between gap-2">
          <div>
            {currentStep > 0 && (
              <Button type="button" variant="outline" onClick={handleBack}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleNext}
              disabled={createGoalMutation.isPending}
              data-testid="button-goal-next"
            >
              {currentStep === SMART_STEPS.length - 1 ? (
                createGoalMutation.isPending ? "Creating..." : "Create Goal"
              ) : (
                <>
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function GoalsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  // Mentors, Admins, and Super Admins can view mentee goals
  const isMentor = user?.role === "MENTOR" || user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";

  const [showWizard, setShowWizard] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState<{
    title: string;
    description: string;
    specificDetails: string;
    measurableMetrics: string;
    achievabilityNotes: string;
    relevanceExplanation: string;
    category: string;
    targetDate: string;
    progress: number;
  }>({
    title: "",
    description: "",
    specificDetails: "",
    measurableMetrics: "",
    achievabilityNotes: "",
    relevanceExplanation: "",
    category: "SHORT_TERM",
    targetDate: "",
    progress: 0,
  });

  // Mentors see their mentees' goals, others see their own goals
  const { data: goals, isLoading } = useQuery<Goal[]>({
    queryKey: isMentor ? ["/api/mentor/mentee-goals", statusFilter, categoryFilter] : ["/api/goals", statusFilter, categoryFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter && statusFilter !== "all") params.set("status", statusFilter);
      if (categoryFilter && categoryFilter !== "all") params.set("category", categoryFilter);
      
      // Mentors fetch their mentees' goals from dedicated endpoint
      const endpoint = isMentor ? "/api/mentor/mentee-goals" : "/api/goals";
      const res = await fetch(`${endpoint}?${params.toString()}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch goals");
      return res.json();
    },
  });

  const updateGoalMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Goal> }) => {
      return apiRequest("PATCH", `/api/goals/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
      toast({ title: "Goal updated" });
      setIsEditing(false);
    },
    onError: () => {
      toast({ title: "Failed to update goal", variant: "destructive" });
    },
  });

  const startEditing = (goal: Goal) => {
    setEditFormData({
      title: goal.title || "",
      description: goal.description || "",
      specificDetails: goal.specificDetails || "",
      measurableMetrics: formatMeasurableMetrics(goal.measurableMetrics) || "",
      achievabilityNotes: goal.achievabilityNotes || "",
      relevanceExplanation: goal.relevanceExplanation || "",
      category: goal.category || "SHORT_TERM",
      targetDate: goal.targetDate ? new Date(goal.targetDate).toISOString().split("T")[0] : "",
      progress: goal.progress || 0,
    });
    setIsEditing(true);
  };

  const saveEdits = () => {
    if (!selectedGoal) return;
    const measurableMetricsValue = editFormData.measurableMetrics 
      ? { description: editFormData.measurableMetrics } 
      : null;
    updateGoalMutation.mutate({
      id: selectedGoal.id,
      data: {
        title: editFormData.title,
        description: editFormData.description || null,
        specificDetails: editFormData.specificDetails || null,
        measurableMetrics: measurableMetricsValue,
        achievabilityNotes: editFormData.achievabilityNotes || null,
        relevanceExplanation: editFormData.relevanceExplanation || null,
        category: editFormData.category as GoalCategory,
        targetDate: editFormData.targetDate ? new Date(editFormData.targetDate) : null,
        progress: editFormData.progress,
      },
    });
    setSelectedGoal({
      ...selectedGoal,
      title: editFormData.title,
      description: editFormData.description || null,
      specificDetails: editFormData.specificDetails || null,
      measurableMetrics: measurableMetricsValue,
      achievabilityNotes: editFormData.achievabilityNotes || null,
      relevanceExplanation: editFormData.relevanceExplanation || null,
      category: editFormData.category as GoalCategory,
      targetDate: editFormData.targetDate ? new Date(editFormData.targetDate) : null,
      progress: editFormData.progress,
    });
  };

  const cancelEditing = () => {
    setIsEditing(false);
  };

  const deleteGoalMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/goals/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
      toast({ title: "Goal deleted" });
    },
    onError: () => {
      toast({ title: "Failed to delete goal", variant: "destructive" });
    },
  });

  const completedGoals = goals?.filter(g => g.status === "COMPLETED").length || 0;
  const inProgressGoals = goals?.filter(g => g.status === "IN_PROGRESS").length || 0;
  const totalGoals = goals?.length || 0;
  const avgProgress = totalGoals > 0
    ? Math.round((goals?.reduce((sum, g) => sum + (g.progress || 0), 0) || 0) / totalGoals)
    : 0;

  const handleExportPDF = () => {
    if (!goals || !user) return;
    
    const goalData: GoalData[] = goals.map(goal => ({
      title: goal.title,
      description: goal.description,
      category: goal.category,
      status: goal.status,
      progress: goal.progress,
      targetDate: goal.targetDate,
      specificDetails: goal.specificDetails,
      measurableMetrics: goal.measurableMetrics,
      achievabilityNotes: goal.achievabilityNotes,
      relevanceExplanation: goal.relevanceExplanation,
      mentorFeedback: goal.mentorFeedback,
      createdAt: goal.createdAt,
      updatedAt: goal.updatedAt,
    }));
    
    exportGoalsToPDF(goalData, {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      organizationName: user.organizationName,
      jobTitle: user.jobTitle,
    });
    
    toast({ title: "PDF downloaded successfully!" });
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col h-full">
        <div className="sticky top-0 z-10 bg-background border-b p-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2">
              <Target className="h-6 w-6" />
              <h1 className="text-2xl font-semibold">{isMentor ? "Mentee Goals" : "Goals"}</h1>
            {goals && (
              <Badge variant="secondary" className="ml-2" data-testid="text-goal-count">
                {goals.length}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              onClick={handleExportPDF}
              disabled={!goals || goals.length === 0}
              data-testid="button-export-goals-pdf"
            >
              <FileDown className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
            {!isMentor && (
              <Button onClick={() => setShowWizard(true)} data-testid="button-create-goal">
                <Sparkles className="h-4 w-4 mr-2" />
                Create SMART Goal
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{totalGoals}</div>
              <div className="text-sm text-muted-foreground">Total Goals</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-600">{inProgressGoals}</div>
              <div className="text-sm text-muted-foreground">In Progress</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">{completedGoals}</div>
              <div className="text-sm text-muted-foreground">Completed</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{avgProgress}%</div>
              <div className="text-sm text-muted-foreground">Avg Progress</div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-wrap items-center gap-2 mt-4">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]" data-testid="select-goal-status-filter">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {GOAL_STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[150px]" data-testid="select-goal-category-filter">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {GOAL_CATEGORY_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-2 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : goals && goals.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {goals.map((goal) => (
              <Card
                key={goal.id}
                className="hover-elevate cursor-pointer"
                onClick={() => {
                  setSelectedGoal(goal);
                  setShowDetailDialog(true);
                }}
                data-testid={`card-goal-${goal.id}`}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <CardTitle className="text-base line-clamp-2">{goal.title}</CardTitle>
                      {isMentor && (goal as any).mentee && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Mentee: {(goal as any).mentee.firstName} {(goal as any).mentee.lastName}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <Badge variant={getStatusBadgeVariant(goal.status as GoalStatus)}>
                          {GOAL_STATUS_OPTIONS.find(s => s.value === goal.status)?.label || goal.status}
                        </Badge>
                        {goal.category && (
                          <Badge variant={getCategoryBadgeVariant(goal.category as GoalCategory)}>
                            {GOAL_CATEGORY_OPTIONS.find(c => c.value === goal.category)?.label || goal.category}
                          </Badge>
                        )}
                        {goal.mentorApproved && (
                          <Badge variant="secondary">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Approved
                          </Badge>
                        )}
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedGoal(goal);
                            setShowDetailDialog(true);
                          }}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        {!isMentor && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm("Are you sure you want to delete this goal?")) {
                                  deleteGoalMutation.mutate(goal.id);
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  {goal.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {goal.description}
                    </p>
                  )}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">{goal.progress || 0}%</span>
                    </div>
                    <Progress value={goal.progress || 0} className="h-2" />
                  </div>
                  {goal.targetDate && (
                    <div className="flex items-center gap-1 mt-3 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      Target: {formatDate(goal.targetDate)}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-8 text-center">
            <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <CardTitle className="mb-2">No goals found</CardTitle>
            <CardDescription>
              {isMentor 
                ? "Your mentees haven't created any goals yet. Goals will appear here once they are set." 
                : "Create your first SMART goal to start tracking your professional development"}
            </CardDescription>
            {!isMentor && (
              <Button
                className="mt-4"
                onClick={() => setShowWizard(true)}
                data-testid="button-create-first-goal"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Create SMART Goal
              </Button>
            )}
          </Card>
        )}
      </div>

      <GoalWizard
        isOpen={showWizard}
        onClose={() => setShowWizard(false)}
        onSuccess={() => setShowWizard(false)}
      />

      <Dialog open={showDetailDialog} onOpenChange={(open) => {
        setShowDetailDialog(open);
        if (!open) setIsEditing(false);
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedGoal && (
            <>
              <DialogHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    {isEditing ? (
                      <Input
                        value={editFormData.title}
                        onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                        className="text-xl font-semibold"
                        placeholder="Goal title"
                        data-testid="input-edit-goal-title"
                      />
                    ) : (
                      <DialogTitle className="text-xl">{selectedGoal.title}</DialogTitle>
                    )}
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <Badge variant={getStatusBadgeVariant(selectedGoal.status as GoalStatus)}>
                        {GOAL_STATUS_OPTIONS.find(s => s.value === selectedGoal.status)?.label || selectedGoal.status}
                      </Badge>
                      {isEditing ? (
                        <Select
                          value={editFormData.category}
                          onValueChange={(val) => setEditFormData({ ...editFormData, category: val })}
                        >
                          <SelectTrigger className="w-[140px] h-7" data-testid="select-edit-goal-category">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {GOAL_CATEGORY_OPTIONS.map(opt => (
                              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : selectedGoal.category && (
                        <Badge variant={getCategoryBadgeVariant(selectedGoal.category as GoalCategory)}>
                          {GOAL_CATEGORY_OPTIONS.find(c => c.value === selectedGoal.category)?.label || selectedGoal.category}
                        </Badge>
                      )}
                    </div>
                  </div>
                  {!isMentor && !isEditing && (
                    <Button variant="outline" size="sm" onClick={() => startEditing(selectedGoal)} data-testid="button-edit-goal">
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                  )}
                </div>
              </DialogHeader>

              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Progress</Label>
                    {isEditing ? (
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={editFormData.progress}
                        onChange={(e) => setEditFormData({ ...editFormData, progress: parseInt(e.target.value) || 0 })}
                        className="w-20 h-7 text-right"
                        data-testid="input-edit-goal-progress"
                      />
                    ) : (
                      <span className="font-medium">{selectedGoal.progress || 0}%</span>
                    )}
                  </div>
                  <Progress value={isEditing ? editFormData.progress : (selectedGoal.progress || 0)} className="h-3" />
                </div>

                {isEditing ? (
                  <div>
                    <Label className="text-muted-foreground">Description</Label>
                    <Textarea
                      value={editFormData.description}
                      onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                      placeholder="Describe your goal..."
                      className="mt-1"
                      data-testid="input-edit-goal-description"
                    />
                  </div>
                ) : selectedGoal.description && (
                  <div className="bg-muted/50 p-3 rounded-lg">
                    <p className="text-sm">{selectedGoal.description}</p>
                  </div>
                )}

                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-primary/10 px-4 py-2 border-b">
                    <h4 className="font-semibold text-sm flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      SMART Goal Details
                    </h4>
                  </div>
                  
                  {isEditing ? (
                    <div className="p-4 space-y-4">
                      <div>
                        <Label className="flex items-center gap-1 text-sm font-medium">
                          <Target className="h-4 w-4 text-primary" /> Specific
                        </Label>
                        <Textarea
                          value={editFormData.specificDetails}
                          onChange={(e) => setEditFormData({ ...editFormData, specificDetails: e.target.value })}
                          placeholder="What exactly do you want to accomplish?"
                          className="mt-1"
                          data-testid="input-edit-goal-specific"
                        />
                      </div>
                      <div>
                        <Label className="flex items-center gap-1 text-sm font-medium">
                          <Ruler className="h-4 w-4 text-primary" /> Measurable
                        </Label>
                        <Textarea
                          value={editFormData.measurableMetrics}
                          onChange={(e) => setEditFormData({ ...editFormData, measurableMetrics: e.target.value })}
                          placeholder="How will you track progress?"
                          className="mt-1"
                          data-testid="input-edit-goal-measurable"
                        />
                      </div>
                      <div>
                        <Label className="flex items-center gap-1 text-sm font-medium">
                          <Lightbulb className="h-4 w-4 text-primary" /> Achievable
                        </Label>
                        <Textarea
                          value={editFormData.achievabilityNotes}
                          onChange={(e) => setEditFormData({ ...editFormData, achievabilityNotes: e.target.value })}
                          placeholder="Is this goal realistic given your resources?"
                          className="mt-1"
                          data-testid="input-edit-goal-achievable"
                        />
                      </div>
                      <div>
                        <Label className="flex items-center gap-1 text-sm font-medium">
                          <Link className="h-4 w-4 text-primary" /> Relevant
                        </Label>
                        <Textarea
                          value={editFormData.relevanceExplanation}
                          onChange={(e) => setEditFormData({ ...editFormData, relevanceExplanation: e.target.value })}
                          placeholder="Why is this goal important to your development?"
                          className="mt-1"
                          data-testid="input-edit-goal-relevant"
                        />
                      </div>
                      <div>
                        <Label className="flex items-center gap-1 text-sm font-medium">
                          <CalendarDays className="h-4 w-4 text-primary" /> Time-Bound
                        </Label>
                        <Input
                          type="date"
                          value={editFormData.targetDate}
                          onChange={(e) => setEditFormData({ ...editFormData, targetDate: e.target.value })}
                          className="mt-1 w-48"
                          data-testid="input-edit-goal-target-date"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="divide-y">
                      <div className="flex items-start gap-3 px-4 py-3 hover:bg-muted/30">
                        <div className="flex items-center gap-2 min-w-[120px] shrink-0">
                          <Target className="h-4 w-4 text-primary" />
                          <span className="font-medium text-sm">Specific</span>
                        </div>
                        <p className="text-sm flex-1">
                          {selectedGoal.specificDetails || <span className="text-muted-foreground italic">Not specified</span>}
                        </p>
                      </div>
                      
                      <div className="flex items-start gap-3 px-4 py-3 hover:bg-muted/30">
                        <div className="flex items-center gap-2 min-w-[120px] shrink-0">
                          <Ruler className="h-4 w-4 text-primary" />
                          <span className="font-medium text-sm">Measurable</span>
                        </div>
                        <p className="text-sm flex-1">
                          {formatMeasurableMetrics(selectedGoal.measurableMetrics) || <span className="text-muted-foreground italic">Not specified</span>}
                        </p>
                      </div>
                      
                      <div className="flex items-start gap-3 px-4 py-3 hover:bg-muted/30">
                        <div className="flex items-center gap-2 min-w-[120px] shrink-0">
                          <Lightbulb className="h-4 w-4 text-primary" />
                          <span className="font-medium text-sm">Achievable</span>
                        </div>
                        <p className="text-sm flex-1">
                          {selectedGoal.achievabilityNotes || <span className="text-muted-foreground italic">Not specified</span>}
                        </p>
                      </div>
                      
                      <div className="flex items-start gap-3 px-4 py-3 hover:bg-muted/30">
                        <div className="flex items-center gap-2 min-w-[120px] shrink-0">
                          <Link className="h-4 w-4 text-primary" />
                          <span className="font-medium text-sm">Relevant</span>
                        </div>
                        <p className="text-sm flex-1">
                          {selectedGoal.relevanceExplanation || <span className="text-muted-foreground italic">Not specified</span>}
                        </p>
                      </div>
                      
                      <div className="flex items-start gap-3 px-4 py-3 hover:bg-muted/30">
                        <div className="flex items-center gap-2 min-w-[120px] shrink-0">
                          <CalendarDays className="h-4 w-4 text-primary" />
                          <span className="font-medium text-sm">Time-Bound</span>
                        </div>
                        <p className="text-sm flex-1">
                          {selectedGoal.targetDate ? formatDate(selectedGoal.targetDate) : <span className="text-muted-foreground italic">No target date set</span>}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {selectedGoal.mentorFeedback && (
                  <div className="bg-muted p-4 rounded-lg">
                    <Label className="text-muted-foreground">Mentor Feedback</Label>
                    <p className="mt-1">{selectedGoal.mentorFeedback}</p>
                  </div>
                )}

                {!isEditing && (
                  <div>
                    <Label className="text-muted-foreground">Update Status</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {GOAL_STATUS_OPTIONS.map((option) => (
                        <Button
                          key={option.value}
                          size="sm"
                          variant={selectedGoal.status === option.value ? "default" : "outline"}
                          onClick={() => {
                            updateGoalMutation.mutate({
                              id: selectedGoal.id,
                              data: { status: option.value },
                            });
                            setSelectedGoal({ ...selectedGoal, status: option.value });
                          }}
                          data-testid={`button-goal-status-${option.value}`}
                        >
                          <option.icon className="h-4 w-4 mr-1" />
                          {option.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter className="flex-wrap gap-2">
                {isEditing ? (
                  <>
                    <Button variant="outline" onClick={cancelEditing} data-testid="button-cancel-edit-goal">
                      Cancel
                    </Button>
                    <Button onClick={saveEdits} disabled={updateGoalMutation.isPending} data-testid="button-save-goal">
                      {updateGoalMutation.isPending ? "Saving..." : "Save Changes"}
                    </Button>
                  </>
                ) : (
                  <>
                    {!isMentor && (
                      <Button
                        variant="destructive"
                        onClick={() => {
                          if (confirm("Are you sure you want to delete this goal?")) {
                            deleteGoalMutation.mutate(selectedGoal.id);
                            setShowDetailDialog(false);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Goal
                      </Button>
                    )}
                    <Button variant="outline" onClick={() => setShowDetailDialog(false)}>
                      Close
                    </Button>
                  </>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
      </div>
    </DashboardLayout>
  );
}
