import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Task, TaskStatus, TaskPriority, TaskCategory, User } from "@shared/schema";
import {
  LayoutDashboard,
  Search,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Circle,
  TrendingUp,
  Users,
  ListTodo,
  BarChart3,
  Calendar,
  Flag,
  AlertTriangle,
} from "lucide-react";

const STATUS_OPTIONS: { value: TaskStatus; label: string; icon: typeof Circle }[] = [
  { value: "TODO", label: "To Do", icon: Circle },
  { value: "IN_PROGRESS", label: "In Progress", icon: Clock },
  { value: "BLOCKED", label: "Blocked", icon: AlertCircle },
  { value: "IN_REVIEW", label: "In Review", icon: Clock },
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
  if (!date) return "-";
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

function getPriorityBadgeVariant(priority: TaskPriority): "default" | "secondary" | "destructive" | "outline" {
  switch (priority) {
    case "URGENT": return "destructive";
    case "HIGH": return "default";
    case "MEDIUM": return "secondary";
    default: return "outline";
  }
}

interface TaskWithOwner extends Task {
  owner?: User;
  assignee?: User;
}

interface TaskStats {
  total: number;
  completed: number;
  inProgress: number;
  blocked: number;
  overdue: number;
  completionRate: number;
  byPriority: Record<TaskPriority, number>;
  byCategory: Record<TaskCategory, number>;
  byStatus: Record<TaskStatus, number>;
}

function calculateStats(tasks: Task[]): TaskStats {
  const now = new Date();
  const stats: TaskStats = {
    total: tasks.length,
    completed: 0,
    inProgress: 0,
    blocked: 0,
    overdue: 0,
    completionRate: 0,
    byPriority: { LOW: 0, MEDIUM: 0, HIGH: 0, URGENT: 0 },
    byCategory: { ADMIN_TASK: 0, MENTOR_TASK: 0, SELF_TASK: 0, GOAL_TASK: 0 },
    byStatus: { TODO: 0, IN_PROGRESS: 0, BLOCKED: 0, IN_REVIEW: 0, COMPLETED: 0, CANCELLED: 0 },
  };

  tasks.forEach((task) => {
    if (task.status === "COMPLETED") stats.completed++;
    if (task.status === "IN_PROGRESS") stats.inProgress++;
    if (task.status === "BLOCKED") stats.blocked++;
    if (task.dueDate && new Date(task.dueDate) < now && task.status !== "COMPLETED") {
      stats.overdue++;
    }
    if (task.priority) stats.byPriority[task.priority as TaskPriority]++;
    if (task.category) stats.byCategory[task.category as TaskCategory]++;
    if (task.status) stats.byStatus[task.status as TaskStatus]++;
  });

  stats.completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
  return stats;
}

export default function AdminTasksPage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const { data: tasks = [], isLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks/admin", statusFilter, priorityFilter, categoryFilter, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter && statusFilter !== "all") params.set("status", statusFilter);
      if (priorityFilter && priorityFilter !== "all") params.set("priority", priorityFilter);
      if (categoryFilter && categoryFilter !== "all") params.set("category", categoryFilter);
      if (searchQuery) params.set("search", searchQuery);
      params.set("allUsers", "true");
      const res = await fetch(`/api/tasks?${params.toString()}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch tasks");
      return res.json();
    },
  });

  const stats = calculateStats(tasks);

  const urgentTasks = tasks.filter((t) => t.priority === "URGENT" && t.status !== "COMPLETED");
  const overdueTasks = tasks.filter((t) => isOverdue(t.dueDate) && t.status !== "COMPLETED");
  const blockedTasks = tasks.filter((t) => t.status === "BLOCKED");

  return (
    <div className="flex flex-col h-full">
      <div className="sticky top-0 z-10 bg-background border-b p-4">
        <div className="flex items-center gap-2 mb-4">
          <LayoutDashboard className="h-6 w-6" />
          <h1 className="text-2xl font-semibold">Task Analytics</h1>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <ListTodo className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Total</span>
              </div>
              <div className="text-2xl font-bold mt-1">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-muted-foreground">In Progress</span>
              </div>
              <div className="text-2xl font-bold mt-1 text-blue-600">{stats.inProgress}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="text-sm text-muted-foreground">Completed</span>
              </div>
              <div className="text-2xl font-bold mt-1 text-green-600">{stats.completed}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <span className="text-sm text-muted-foreground">Blocked</span>
              </div>
              <div className="text-2xl font-bold mt-1 text-amber-600">{stats.blocked}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <span className="text-sm text-muted-foreground">Overdue</span>
              </div>
              <div className="text-2xl font-bold mt-1 text-red-600">{stats.overdue}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Completion</span>
              </div>
              <div className="text-2xl font-bold mt-1">{stats.completionRate}%</div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all" data-testid="tab-all-tasks">All Tasks</TabsTrigger>
            <TabsTrigger value="urgent" data-testid="tab-urgent-tasks">
              Urgent ({urgentTasks.length})
            </TabsTrigger>
            <TabsTrigger value="overdue" data-testid="tab-overdue-tasks">
              Overdue ({overdueTasks.length})
            </TabsTrigger>
            <TabsTrigger value="blocked" data-testid="tab-blocked-tasks">
              Blocked ({blockedTasks.length})
            </TabsTrigger>
            <TabsTrigger value="analytics" data-testid="tab-analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  data-testid="input-admin-search-tasks"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[130px]" data-testid="select-admin-status-filter">
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
                <SelectTrigger className="w-[130px]" data-testid="select-admin-priority-filter">
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
                <SelectTrigger className="w-[130px]" data-testid="select-admin-category-filter">
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
            </div>

            {isLoading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <TaskTable tasks={tasks} />
            )}
          </TabsContent>

          <TabsContent value="urgent" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Flag className="h-5 w-5 text-red-600" />
                  Urgent Tasks
                </CardTitle>
                <CardDescription>
                  High-priority tasks requiring immediate attention
                </CardDescription>
              </CardHeader>
              <CardContent>
                {urgentTasks.length > 0 ? (
                  <TaskTable tasks={urgentTasks} />
                ) : (
                  <p className="text-muted-foreground text-center py-8">No urgent tasks</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="overdue" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  Overdue Tasks
                </CardTitle>
                <CardDescription>
                  Tasks that have passed their due date
                </CardDescription>
              </CardHeader>
              <CardContent>
                {overdueTasks.length > 0 ? (
                  <TaskTable tasks={overdueTasks} />
                ) : (
                  <p className="text-muted-foreground text-center py-8">No overdue tasks</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="blocked" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-amber-600" />
                  Blocked Tasks
                </CardTitle>
                <CardDescription>
                  Tasks that are currently blocked and need attention
                </CardDescription>
              </CardHeader>
              <CardContent>
                {blockedTasks.length > 0 ? (
                  <TaskTable tasks={blockedTasks} />
                ) : (
                  <p className="text-muted-foreground text-center py-8">No blocked tasks</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Tasks by Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {STATUS_OPTIONS.map((option) => {
                    const count = stats.byStatus[option.value];
                    const percentage = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
                    return (
                      <div key={option.value} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-2">
                            <option.icon className="h-4 w-4" />
                            {option.label}
                          </span>
                          <span className="text-muted-foreground">{count} ({percentage}%)</span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Tasks by Priority</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {PRIORITY_OPTIONS.map((option) => {
                    const count = stats.byPriority[option.value];
                    const percentage = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
                    return (
                      <div key={option.value} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-2">
                            <Flag className={`h-4 w-4 ${option.color}`} />
                            {option.label}
                          </span>
                          <span className="text-muted-foreground">{count} ({percentage}%)</span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Tasks by Category</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {CATEGORY_OPTIONS.map((option) => {
                    const count = stats.byCategory[option.value];
                    const percentage = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
                    return (
                      <div key={option.value} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span>{option.label}</span>
                          <span className="text-muted-foreground">{count} ({percentage}%)</span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Completion Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center justify-center py-8">
                    <div className="text-5xl font-bold text-green-600">{stats.completionRate}%</div>
                    <p className="text-muted-foreground mt-2">
                      {stats.completed} of {stats.total} tasks completed
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function TaskTable({ tasks }: { tasks: Task[] }) {
  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Due Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                No tasks found
              </TableCell>
            </TableRow>
          ) : (
            tasks.map((task) => (
              <TableRow key={task.id} data-testid={`row-task-${task.id}`}>
                <TableCell className="font-medium max-w-xs truncate">{task.title}</TableCell>
                <TableCell>
                  <Badge variant={getStatusBadgeVariant(task.status as TaskStatus)}>
                    {STATUS_OPTIONS.find((s) => s.value === task.status)?.label || task.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {task.priority && (
                    <Badge variant={getPriorityBadgeVariant(task.priority as TaskPriority)}>
                      {PRIORITY_OPTIONS.find((p) => p.value === task.priority)?.label || task.priority}
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  {task.category && (
                    <span className="text-sm text-muted-foreground">
                      {CATEGORY_OPTIONS.find((c) => c.value === task.category)?.label || task.category}
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <span
                    className={
                      isOverdue(task.dueDate) && task.status !== "COMPLETED"
                        ? "text-red-600 dark:text-red-400"
                        : ""
                    }
                  >
                    {formatDate(task.dueDate)}
                  </span>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
