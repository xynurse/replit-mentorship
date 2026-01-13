import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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
} from "@/components/ui/form";
import type { Task, TaskStatus, TaskPriority, TaskCategory } from "@shared/schema";
import {
  Search,
  Plus,
  MoreVertical,
  CheckCircle2,
  Circle,
  Clock,
  AlertCircle,
  XCircle,
  Trash2,
  Edit,
  Calendar,
  Flag,
  User,
  ListTodo,
  Filter,
  SortDesc,
  RefreshCw,
  LayoutGrid,
  List,
  GripVertical,
} from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

const STATUS_OPTIONS: { value: TaskStatus; label: string; icon: typeof Circle }[] = [
  { value: "TODO", label: "To Do", icon: Circle },
  { value: "IN_PROGRESS", label: "In Progress", icon: Clock },
  { value: "BLOCKED", label: "Blocked", icon: AlertCircle },
  { value: "COMPLETED", label: "Completed", icon: CheckCircle2 },
  { value: "CANCELLED", label: "Cancelled", icon: XCircle },
];

const PRIORITY_OPTIONS: { value: TaskPriority; label: string; color: string }[] = [
  { value: "LOW", label: "Low", color: "text-muted-foreground" },
  { value: "MEDIUM", label: "Medium", color: "text-blue-600 dark:text-blue-400" },
  { value: "HIGH", label: "High", color: "text-amber-600 dark:text-amber-400" },
  { value: "URGENT", label: "Urgent", color: "text-red-600 dark:text-red-400" },
];

const CATEGORY_OPTIONS: { value: TaskCategory; label: string }[] = [
  { value: "ADMIN_TASK", label: "Admin Task" },
  { value: "MENTOR_TASK", label: "Mentor Task" },
  { value: "SELF_TASK", label: "Self Task" },
  { value: "GOAL_TASK", label: "Goal Task" },
];

function formatDate(date?: Date | string | null): string {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function isOverdue(dueDate?: Date | string | null): boolean {
  if (!dueDate) return false;
  return new Date(dueDate) < new Date();
}

function getStatusBadgeVariant(status: TaskStatus): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "COMPLETED": return "default";
    case "IN_PROGRESS": return "secondary";
    case "BLOCKED": return "destructive";
    case "CANCELLED": return "outline";
    default: return "outline";
  }
}

function getPriorityIcon(priority: TaskPriority) {
  const priorityOption = PRIORITY_OPTIONS.find(p => p.value === priority);
  return <Flag className={`h-4 w-4 ${priorityOption?.color || ""}`} />;
}

const taskFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  category: z.enum(["ADMIN_TASK", "MENTOR_TASK", "SELF_TASK", "GOAL_TASK"]).default("SELF_TASK"),
  dueDate: z.string().optional(),
  estimatedHours: z.union([z.coerce.number().positive(), z.literal("")]).optional().transform(val => val === "" ? undefined : val),
});

type TaskFormValues = z.infer<typeof taskFormSchema>;

const KANBAN_COLUMNS: { status: TaskStatus; label: string; icon: typeof Circle }[] = [
  { status: "TODO", label: "To Do", icon: Circle },
  { status: "IN_PROGRESS", label: "In Progress", icon: Clock },
  { status: "BLOCKED", label: "Blocked", icon: AlertCircle },
  { status: "IN_REVIEW", label: "In Review", icon: Clock },
  { status: "COMPLETED", label: "Completed", icon: CheckCircle2 },
];

interface KanbanBoardProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
  onCreateTask: () => void;
}

function KanbanBoard({ tasks, onTaskClick, onStatusChange, onCreateTask }: KanbanBoardProps) {
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null);

  const getTasksByStatus = (status: TaskStatus) => {
    return tasks.filter((task) => task.status === status);
  };

  const handleDragStart = (e: React.DragEvent, task: Task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverColumn(status);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    if (draggedTask && draggedTask.status !== status) {
      onStatusChange(draggedTask.id, status);
    }
    setDraggedTask(null);
    setDragOverColumn(null);
  };

  const handleDragEnd = () => {
    setDraggedTask(null);
    setDragOverColumn(null);
  };

  if (tasks.length === 0) {
    return (
      <Card className="p-8 text-center">
        <ListTodo className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <CardTitle className="mb-2">No tasks found</CardTitle>
        <CardDescription>Create your first task to get started</CardDescription>
        <Button className="mt-4" onClick={onCreateTask} data-testid="button-kanban-create-task">
          <Plus className="h-4 w-4 mr-2" />
          Create Task
        </Button>
      </Card>
    );
  }

  return (
    <div className="flex gap-4 h-full min-h-[calc(100vh-16rem)] overflow-x-auto pb-4">
      {KANBAN_COLUMNS.map((column) => {
        const columnTasks = getTasksByStatus(column.status);
        const Icon = column.icon;

        return (
          <div
            key={column.status}
            className={`flex flex-col min-w-[280px] w-[280px] flex-shrink-0 rounded-lg border bg-muted/30 ${
              dragOverColumn === column.status ? "ring-2 ring-primary" : ""
            }`}
            onDragOver={(e) => handleDragOver(e, column.status)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, column.status)}
            data-testid={`kanban-column-${column.status}`}
          >
            <div className="flex items-center justify-between gap-2 p-3 border-b bg-muted/50 rounded-t-lg">
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium text-sm">{column.label}</span>
              </div>
              <Badge variant="secondary">{columnTasks.length}</Badge>
            </div>

            <ScrollArea className="flex-1 p-2">
              <div className="space-y-2">
                {columnTasks.map((task) => (
                  <Card
                    key={task.id}
                    className={`cursor-pointer hover-elevate ${
                      draggedTask?.id === task.id ? "opacity-50" : ""
                    }`}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task)}
                    onDragEnd={handleDragEnd}
                    onClick={() => onTaskClick(task)}
                    data-testid={`kanban-task-${task.id}`}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start gap-2">
                        <GripVertical className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0 cursor-grab" />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm line-clamp-2">{task.title}</h4>
                          {task.description && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {task.description}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            {task.priority && getPriorityIcon(task.priority as TaskPriority)}
                            {task.dueDate && (
                              <span
                                className={`flex items-center gap-1 text-xs ${
                                  isOverdue(task.dueDate) && task.status !== "COMPLETED"
                                    ? "text-red-600 dark:text-red-400"
                                    : "text-muted-foreground"
                                }`}
                              >
                                <Calendar className="h-3 w-3" />
                                {formatDate(task.dueDate)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </div>
        );
      })}
    </div>
  );
}

export default function TasksPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [showOverdueOnly, setShowOverdueOnly] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "kanban">("list");

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [isEditingTask, setIsEditingTask] = useState(false);

  const editForm = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: "",
      description: "",
      priority: "MEDIUM",
      category: "SELF_TASK",
    },
  });

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: "",
      description: "",
      priority: "MEDIUM",
      category: "SELF_TASK",
    },
  });

  const { data: tasks, isLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks", statusFilter, priorityFilter, categoryFilter, showOverdueOnly, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter && statusFilter !== "all") params.set("status", statusFilter);
      if (priorityFilter && priorityFilter !== "all") params.set("priority", priorityFilter);
      if (categoryFilter && categoryFilter !== "all") params.set("category", categoryFilter);
      if (showOverdueOnly) params.set("overdue", "true");
      if (searchQuery) params.set("search", searchQuery);
      params.set("parentTaskId", "null");
      const res = await fetch(`/api/tasks?${params.toString()}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch tasks");
      return res.json();
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: async (data: TaskFormValues) => {
      const response = await apiRequest("POST", "/api/tasks", {
        title: data.title,
        description: data.description || undefined,
        priority: data.priority,
        category: data.category,
        dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : undefined,
        estimatedHours: data.estimatedHours || undefined,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      setShowCreateDialog(false);
      form.reset();
      toast({ title: "Task created successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to create task", description: error.message, variant: "destructive" });
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, unknown> }) => {
      return apiRequest("PATCH", `/api/tasks/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({ title: "Task updated" });
    },
    onError: () => {
      toast({ title: "Failed to update task", variant: "destructive" });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/tasks/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({ title: "Task deleted" });
    },
    onError: () => {
      toast({ title: "Failed to delete task", variant: "destructive" });
    },
  });

  const handleQuickComplete = (task: Task) => {
    updateTaskMutation.mutate({
      id: task.id,
      data: {
        status: task.status === "COMPLETED" ? "TODO" : "COMPLETED",
        completedAt: task.status === "COMPLETED" ? null : new Date().toISOString(),
      },
    });
  };

  const onSubmitCreate = (data: TaskFormValues) => {
    createTaskMutation.mutate(data);
  };

  const onSubmitEdit = (data: TaskFormValues) => {
    if (!selectedTask) return;
    updateTaskMutation.mutate({
      id: selectedTask.id,
      data: {
        title: data.title,
        description: data.description || null,
        priority: data.priority,
        category: data.category,
        dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : null,
        estimatedHours: data.estimatedHours || null,
      },
    });
    setIsEditingTask(false);
  };

  const handleEditTask = () => {
    if (!selectedTask) return;
    editForm.reset({
      title: selectedTask.title,
      description: selectedTask.description || "",
      priority: (selectedTask.priority as TaskPriority) || "MEDIUM",
      category: (selectedTask.category as TaskCategory) || "SELF_TASK",
      dueDate: selectedTask.dueDate ? new Date(selectedTask.dueDate).toISOString().split("T")[0] : "",
      estimatedHours: selectedTask.estimatedHours || undefined,
    });
    setIsEditingTask(true);
  };

  const clearFilters = () => {
    setStatusFilter("all");
    setPriorityFilter("all");
    setCategoryFilter("all");
    setShowOverdueOnly(false);
    setSearchQuery("");
  };

  const activeFiltersCount = [
    statusFilter !== "all",
    priorityFilter !== "all",
    categoryFilter !== "all",
    showOverdueOnly,
    searchQuery.length > 0,
  ].filter(Boolean).length;

  return (
    <DashboardLayout>
      <div className="flex flex-col h-full">
        <div className="sticky top-0 z-10 bg-background border-b p-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2">
              <ListTodo className="h-6 w-6" />
              <h1 className="text-2xl font-semibold">Tasks</h1>
            {tasks && (
              <Badge variant="secondary" className="ml-2" data-testid="text-task-count">
                {tasks.length}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center border rounded-md">
              <Button
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="icon"
                className="rounded-r-none"
                onClick={() => setViewMode("list")}
                data-testid="button-list-view"
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "kanban" ? "secondary" : "ghost"}
                size="icon"
                className="rounded-l-none"
                onClick={() => setViewMode("kanban")}
                data-testid="button-kanban-view"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
            </div>
            <Button onClick={() => setShowCreateDialog(true)} data-testid="button-create-task">
              <Plus className="h-4 w-4 mr-2" />
              New Task
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-3 mt-4 md:flex-row md:items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="input-search-tasks"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[130px]" data-testid="select-status-filter">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-[130px]" data-testid="select-priority-filter">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                {PRIORITY_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[150px]" data-testid="select-category-filter">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {CATEGORY_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {activeFiltersCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                data-testid="button-clear-filters"
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Clear ({activeFiltersCount})
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <Skeleton className="h-5 w-5 rounded" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : viewMode === "kanban" ? (
          <KanbanBoard
            tasks={tasks || []}
            onTaskClick={(task) => {
              setSelectedTask(task);
              setShowDetailDialog(true);
            }}
            onStatusChange={(taskId, newStatus) => {
              updateTaskMutation.mutate({ id: taskId, data: { status: newStatus } });
            }}
            onCreateTask={() => setShowCreateDialog(true)}
          />
        ) : tasks && tasks.length > 0 ? (
          <div className="space-y-2">
            {tasks.map((task) => (
              <Card
                key={task.id}
                className={`hover-elevate cursor-pointer transition-colors ${
                  task.status === "COMPLETED" ? "opacity-60" : ""
                }`}
                onClick={() => {
                  setSelectedTask(task);
                  setShowDetailDialog(true);
                }}
                data-testid={`card-task-${task.id}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <button
                      className="mt-1 flex-shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleQuickComplete(task);
                      }}
                      data-testid={`button-toggle-complete-${task.id}`}
                    >
                      {task.status === "COMPLETED" ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : (
                        <Circle className="h-5 w-5 text-muted-foreground hover:text-foreground" />
                      )}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3
                          className={`font-medium ${
                            task.status === "COMPLETED" ? "line-through text-muted-foreground" : ""
                          }`}
                          data-testid={`text-task-title-${task.id}`}
                        >
                          {task.title}
                        </h3>
                        <Badge variant={getStatusBadgeVariant(task.status as TaskStatus)}>
                          {STATUS_OPTIONS.find(s => s.value === task.status)?.label || task.status}
                        </Badge>
                        {task.priority && (
                          <span className="flex items-center gap-1">
                            {getPriorityIcon(task.priority as TaskPriority)}
                          </span>
                        )}
                      </div>

                      {task.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {task.description}
                        </p>
                      )}

                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        {task.dueDate && (
                          <span
                            className={`flex items-center gap-1 ${
                              isOverdue(task.dueDate) && task.status !== "COMPLETED"
                                ? "text-red-600 dark:text-red-400"
                                : ""
                            }`}
                          >
                            <Calendar className="h-3 w-3" />
                            {formatDate(task.dueDate)}
                            {isOverdue(task.dueDate) && task.status !== "COMPLETED" && (
                              <Badge variant="destructive">Overdue</Badge>
                            )}
                          </span>
                        )}
                        {task.category && (
                          <span className="flex items-center gap-1">
                            {CATEGORY_OPTIONS.find(c => c.value === task.category)?.label || task.category}
                          </span>
                        )}
                        {task.estimatedHours && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {task.estimatedHours}h
                          </span>
                        )}
                      </div>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" data-testid={`button-task-menu-${task.id}`}>
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTask(task);
                            setShowDetailDialog(true);
                          }}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            handleQuickComplete(task);
                          }}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          {task.status === "COMPLETED" ? "Mark Incomplete" : "Mark Complete"}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm("Are you sure you want to delete this task?")) {
                              deleteTaskMutation.mutate(task.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-8 text-center">
            <ListTodo className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <CardTitle className="mb-2">No tasks found</CardTitle>
            <CardDescription>
              {activeFiltersCount > 0
                ? "Try adjusting your filters or search query"
                : "Create your first task to get started"}
            </CardDescription>
            {activeFiltersCount === 0 && (
              <Button
                className="mt-4"
                onClick={() => setShowCreateDialog(true)}
                data-testid="button-create-first-task"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Task
              </Button>
            )}
          </Card>
        )}
      </div>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create New Task</DialogTitle>
            <DialogDescription>
              Add a new task to track your progress
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitCreate)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="What needs to be done?"
                        {...field}
                        data-testid="input-task-title"
                      />
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
                        placeholder="Add more details..."
                        {...field}
                        data-testid="input-task-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priority</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-task-priority">
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {PRIORITY_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-task-category">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {CATEGORY_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Due Date</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          data-testid="input-task-due-date"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="estimatedHours"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estimated Hours</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.5"
                          min="0"
                          placeholder="e.g., 2"
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          value={field.value || ""}
                          data-testid="input-task-estimated-hours"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateDialog(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createTaskMutation.isPending}
                  data-testid="button-submit-create-task"
                >
                  {createTaskMutation.isPending ? "Creating..." : "Create Task"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={showDetailDialog} onOpenChange={(open) => {
        setShowDetailDialog(open);
        if (!open) setIsEditingTask(false);
      }}>
        <DialogContent className="max-w-2xl">
          {selectedTask && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <DialogTitle className="flex-1">
                    {isEditingTask ? "Edit Task" : selectedTask.title}
                  </DialogTitle>
                  {!isEditingTask && (
                    <Badge variant={getStatusBadgeVariant(selectedTask.status as TaskStatus)}>
                      {STATUS_OPTIONS.find(s => s.value === selectedTask.status)?.label || selectedTask.status}
                    </Badge>
                  )}
                </div>
              </DialogHeader>

              {isEditingTask ? (
                <Form {...editForm}>
                  <form onSubmit={editForm.handleSubmit(onSubmitEdit)} className="space-y-4">
                    <FormField
                      control={editForm.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Title *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="What needs to be done?"
                              {...field}
                              data-testid="input-edit-task-title"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={editForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Add more details..."
                              {...field}
                              data-testid="input-edit-task-description"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={editForm.control}
                        name="priority"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Priority</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-edit-task-priority">
                                  <SelectValue placeholder="Select priority" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {PRIORITY_OPTIONS.map((option) => (
                                  <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={editForm.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Category</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-edit-task-category">
                                  <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {CATEGORY_OPTIONS.map((option) => (
                                  <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={editForm.control}
                        name="dueDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Due Date</FormLabel>
                            <FormControl>
                              <Input
                                type="date"
                                {...field}
                                data-testid="input-edit-task-due-date"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={editForm.control}
                        name="estimatedHours"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Estimated Hours</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.5"
                                min="0"
                                placeholder="e.g., 2"
                                onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                                value={field.value || ""}
                                data-testid="input-edit-task-estimated-hours"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsEditingTask(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={updateTaskMutation.isPending}
                        data-testid="button-submit-edit-task"
                      >
                        {updateTaskMutation.isPending ? "Saving..." : "Save Changes"}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              ) : (
                <>
                  <div className="space-y-4">
                    {selectedTask.description && (
                      <div>
                        <Label className="text-muted-foreground">Description</Label>
                        <p className="mt-1">{selectedTask.description}</p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-muted-foreground">Priority</Label>
                        <div className="flex items-center gap-2 mt-1">
                          {selectedTask.priority && getPriorityIcon(selectedTask.priority as TaskPriority)}
                          <span>
                            {PRIORITY_OPTIONS.find(p => p.value === selectedTask.priority)?.label || selectedTask.priority}
                          </span>
                        </div>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Category</Label>
                        <p className="mt-1">
                          {CATEGORY_OPTIONS.find(c => c.value === selectedTask.category)?.label || selectedTask.category}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {selectedTask.dueDate && (
                        <div>
                          <Label className="text-muted-foreground">Due Date</Label>
                          <p className={`mt-1 ${isOverdue(selectedTask.dueDate) && selectedTask.status !== "COMPLETED" ? "text-red-600" : ""}`}>
                            {formatDate(selectedTask.dueDate)}
                            {isOverdue(selectedTask.dueDate) && selectedTask.status !== "COMPLETED" && " (Overdue)"}
                          </p>
                        </div>
                      )}
                      {selectedTask.estimatedHours && (
                        <div>
                          <Label className="text-muted-foreground">Estimated Hours</Label>
                          <p className="mt-1">{selectedTask.estimatedHours}h</p>
                        </div>
                      )}
                    </div>

                    <div>
                      <Label className="text-muted-foreground">Update Status</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {STATUS_OPTIONS.map((option) => (
                          <Button
                            key={option.value}
                            size="sm"
                            variant={selectedTask.status === option.value ? "default" : "outline"}
                            onClick={() => {
                              updateTaskMutation.mutate({
                                id: selectedTask.id,
                                data: { status: option.value },
                              });
                              setSelectedTask({ ...selectedTask, status: option.value });
                            }}
                            data-testid={`button-status-${option.value}`}
                          >
                            <option.icon className="h-4 w-4 mr-1" />
                            {option.label}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <DialogFooter className="gap-2">
                    <Button
                      variant="destructive"
                      onClick={() => {
                        if (confirm("Are you sure you want to delete this task?")) {
                          deleteTaskMutation.mutate(selectedTask.id);
                          setShowDetailDialog(false);
                        }
                      }}
                      data-testid="button-delete-task"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                    <Button variant="outline" onClick={handleEditTask} data-testid="button-edit-task">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button variant="outline" onClick={() => setShowDetailDialog(false)}>
                      Close
                    </Button>
                  </DialogFooter>
                </>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
      </div>
    </DashboardLayout>
  );
}
