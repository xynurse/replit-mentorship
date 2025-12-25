import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layouts/admin-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import {
  Users,
  UserCheck,
  Handshake,
  Target,
  CheckSquare,
  Calendar,
  MessageSquare,
  FileText,
  TrendingUp,
  TrendingDown,
  Activity,
  BarChart3,
  PieChart,
  RefreshCw,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
  Cell,
  PieChart as RechartsPie,
  Pie,
} from "recharts";

interface DashboardMetrics {
  userMetrics: {
    totalUsers: number;
    totalMentors: number;
    totalMentees: number;
    totalAdmins: number;
    activeUsers: number;
    newUsersThisMonth: number;
  };
  cohortMetrics: {
    totalCohorts: number;
    activeCohorts: number;
    totalApplications: number;
    pendingApplications: number;
    approvedApplications: number;
  };
  matchMetrics: {
    totalMatches: number;
    activeMatches: number;
    completedMatches: number;
    averageMatchScore: number;
  };
  meetingMetrics: {
    totalMeetings: number;
    meetingsThisMonth: number;
    completedMeetings: number;
    averageDuration: number;
  };
  taskMetrics: {
    totalTasks: number;
    completedTasks: number;
    inProgressTasks: number;
    overdueTasks: number;
    completionRate: number;
  };
  goalMetrics: {
    totalGoals: number;
    completedGoals: number;
    inProgressGoals: number;
    averageProgress: number;
    completionRate: number;
  };
  engagementMetrics: {
    totalMessages: number;
    messagesThisMonth: number;
    totalDocuments: number;
    totalConversations: number;
  };
}

interface TrendData {
  userGrowth: { date: string; count: number }[];
  matchActivity: { date: string; count: number }[];
  taskCompletion: { date: string; completed: number; created: number }[];
  goalProgress: { date: string; completed: number; created: number }[];
  meetingActivity: { date: string; count: number }[];
}

interface TrackAnalytics {
  trackId: string;
  trackName: string;
  memberCount: number;
  matchCount: number;
  goalCount: number;
  taskCount: number;
}

interface CohortAnalytics {
  cohortId: string;
  cohortName: string;
  memberCount: number;
  mentorCount: number;
  menteeCount: number;
  matchCount: number;
  completionRate: number;
}

const COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

function KPICard({ 
  title, 
  value, 
  icon: Icon, 
  description, 
  trend, 
  trendValue,
  variant = "default" 
}: {
  title: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  variant?: "default" | "success" | "warning" | "danger";
}) {
  const variantClasses = {
    default: "",
    success: "border-green-500/30 bg-green-50/50 dark:bg-green-950/20",
    warning: "border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/20",
    danger: "border-red-500/30 bg-red-50/50 dark:bg-red-950/20",
  };

  return (
    <Card className={variantClasses[variant]}>
      <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-5 w-5 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold" data-testid={`kpi-${title.toLowerCase().replace(/\s/g, '-')}`}>{value}</span>
          {trend && trendValue && (
            <span className={`flex items-center text-xs ${trend === "up" ? "text-green-600" : trend === "down" ? "text-red-600" : "text-muted-foreground"}`}>
              {trend === "up" ? <ArrowUp className="h-3 w-3" /> : trend === "down" ? <ArrowDown className="h-3 w-3" /> : null}
              {trendValue}
            </span>
          )}
        </div>
        {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
      </CardContent>
    </Card>
  );
}

function MetricProgress({ label, value, max, percentage }: { label: string; value: number; max: number; percentage: number }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{value} / {max}</span>
      </div>
      <Progress value={percentage} className="h-2" />
      <p className="text-xs text-right text-muted-foreground">{percentage}% completion</p>
    </div>
  );
}

export default function AnalyticsDashboard() {
  const [trendDays, setTrendDays] = useState("30");

  const { data: dashboard, isLoading: isDashboardLoading, refetch: refetchDashboard } = useQuery<DashboardMetrics>({
    queryKey: ["/api/analytics/dashboard"],
  });

  const { data: trends, isLoading: isTrendsLoading } = useQuery<TrendData>({
    queryKey: ["/api/analytics/trends", { days: trendDays }],
  });

  const { data: trackAnalytics, isLoading: isTrackLoading } = useQuery<TrackAnalytics[]>({
    queryKey: ["/api/analytics/tracks"],
  });

  const { data: cohortAnalytics, isLoading: isCohortLoading } = useQuery<CohortAnalytics[]>({
    queryKey: ["/api/analytics/cohorts"],
  });

  const isLoading = isDashboardLoading;

  const userDistribution = dashboard ? [
    { name: "Mentors", value: dashboard.userMetrics.totalMentors },
    { name: "Mentees", value: dashboard.userMetrics.totalMentees },
    { name: "Admins", value: dashboard.userMetrics.totalAdmins },
  ] : [];

  const matchStatus = dashboard ? [
    { name: "Active", value: dashboard.matchMetrics.activeMatches },
    { name: "Completed", value: dashboard.matchMetrics.completedMatches },
    { name: "Other", value: dashboard.matchMetrics.totalMatches - dashboard.matchMetrics.activeMatches - dashboard.matchMetrics.completedMatches },
  ].filter(d => d.value > 0) : [];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight" data-testid="text-page-title">Analytics Dashboard</h1>
            <p className="text-muted-foreground">Platform metrics, KPIs, and performance insights</p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => refetchDashboard()}
            data-testid="button-refresh-analytics"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
            <TabsTrigger value="users" data-testid="tab-users">Users</TabsTrigger>
            <TabsTrigger value="mentorship" data-testid="tab-mentorship">Mentorship</TabsTrigger>
            <TabsTrigger value="productivity" data-testid="tab-productivity">Productivity</TabsTrigger>
            <TabsTrigger value="trends" data-testid="tab-trends">Trends</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {isLoading ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Card key={i}>
                    <CardHeader className="pb-2">
                      <Skeleton className="h-4 w-24" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-8 w-16" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : dashboard ? (
              <>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <KPICard
                    title="Total Users"
                    value={dashboard.userMetrics.totalUsers}
                    icon={Users}
                    description={`${dashboard.userMetrics.newUsersThisMonth} new this month`}
                    trend="up"
                    trendValue={`+${dashboard.userMetrics.newUsersThisMonth}`}
                  />
                  <KPICard
                    title="Active Matches"
                    value={dashboard.matchMetrics.activeMatches}
                    icon={Handshake}
                    description={`${dashboard.matchMetrics.totalMatches} total matches`}
                  />
                  <KPICard
                    title="Task Completion"
                    value={`${dashboard.taskMetrics.completionRate}%`}
                    icon={CheckSquare}
                    description={`${dashboard.taskMetrics.completedTasks} of ${dashboard.taskMetrics.totalTasks} tasks`}
                    variant={dashboard.taskMetrics.completionRate >= 70 ? "success" : dashboard.taskMetrics.completionRate >= 50 ? "default" : "warning"}
                  />
                  <KPICard
                    title="Goal Progress"
                    value={`${dashboard.goalMetrics.averageProgress}%`}
                    icon={Target}
                    description={`${dashboard.goalMetrics.completedGoals} goals completed`}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <KPICard
                    title="Active Cohorts"
                    value={dashboard.cohortMetrics.activeCohorts}
                    icon={UserCheck}
                    description={`${dashboard.cohortMetrics.totalCohorts} total cohorts`}
                  />
                  <KPICard
                    title="Pending Applications"
                    value={dashboard.cohortMetrics.pendingApplications}
                    icon={Activity}
                    variant={dashboard.cohortMetrics.pendingApplications > 10 ? "warning" : "default"}
                    description="Awaiting review"
                  />
                  <KPICard
                    title="Meetings This Month"
                    value={dashboard.meetingMetrics.meetingsThisMonth}
                    icon={Calendar}
                    description={`${dashboard.meetingMetrics.averageDuration} min avg duration`}
                  />
                  <KPICard
                    title="Messages Sent"
                    value={dashboard.engagementMetrics.totalMessages}
                    icon={MessageSquare}
                    description={`${dashboard.engagementMetrics.messagesThisMonth} this month`}
                  />
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <PieChart className="h-5 w-5" />
                        User Distribution
                      </CardTitle>
                      <CardDescription>Breakdown by role</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <RechartsPie>
                            <Pie
                              data={userDistribution}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={80}
                              paddingAngle={5}
                              dataKey="value"
                              label={({ name, value }) => `${name}: ${value}`}
                            >
                              {userDistribution.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </RechartsPie>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <BarChart3 className="h-5 w-5" />
                        Performance Summary
                      </CardTitle>
                      <CardDescription>Key metrics at a glance</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <MetricProgress
                        label="Tasks Completed"
                        value={dashboard.taskMetrics.completedTasks}
                        max={dashboard.taskMetrics.totalTasks}
                        percentage={dashboard.taskMetrics.completionRate}
                      />
                      <MetricProgress
                        label="Goals Achieved"
                        value={dashboard.goalMetrics.completedGoals}
                        max={dashboard.goalMetrics.totalGoals}
                        percentage={dashboard.goalMetrics.completionRate}
                      />
                      <MetricProgress
                        label="Matches Completed"
                        value={dashboard.matchMetrics.completedMatches}
                        max={dashboard.matchMetrics.totalMatches}
                        percentage={dashboard.matchMetrics.totalMatches > 0 ? Math.round((dashboard.matchMetrics.completedMatches / dashboard.matchMetrics.totalMatches) * 100) : 0}
                      />
                    </CardContent>
                  </Card>
                </div>
              </>
            ) : null}
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            {dashboard && (
              <>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <KPICard
                    title="Total Users"
                    value={dashboard.userMetrics.totalUsers}
                    icon={Users}
                    description={`${dashboard.userMetrics.activeUsers} active`}
                  />
                  <KPICard
                    title="Mentors"
                    value={dashboard.userMetrics.totalMentors}
                    icon={UserCheck}
                    description="Registered mentors"
                  />
                  <KPICard
                    title="Mentees"
                    value={dashboard.userMetrics.totalMentees}
                    icon={Users}
                    description="Registered mentees"
                  />
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">User Role Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={userDistribution}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                            <XAxis dataKey="name" className="text-xs" />
                            <YAxis className="text-xs" />
                            <Tooltip />
                            <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">User Statistics</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-muted-foreground">Total Registered</span>
                        <span className="font-semibold">{dashboard.userMetrics.totalUsers}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-muted-foreground">Active Users</span>
                        <span className="font-semibold">{dashboard.userMetrics.activeUsers}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-muted-foreground">New This Month</span>
                        <Badge variant="secondary">{dashboard.userMetrics.newUsersThisMonth}</Badge>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-muted-foreground">Administrators</span>
                        <span className="font-semibold">{dashboard.userMetrics.totalAdmins}</span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-muted-foreground">Mentor:Mentee Ratio</span>
                        <span className="font-semibold">
                          1:{dashboard.userMetrics.totalMentors > 0 ? Math.round(dashboard.userMetrics.totalMentees / dashboard.userMetrics.totalMentors) : 0}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="mentorship" className="space-y-6">
            {dashboard && (
              <>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <KPICard
                    title="Total Matches"
                    value={dashboard.matchMetrics.totalMatches}
                    icon={Handshake}
                  />
                  <KPICard
                    title="Active Matches"
                    value={dashboard.matchMetrics.activeMatches}
                    icon={Activity}
                    variant="success"
                  />
                  <KPICard
                    title="Completed Matches"
                    value={dashboard.matchMetrics.completedMatches}
                    icon={CheckSquare}
                  />
                  <KPICard
                    title="Avg Match Score"
                    value={dashboard.matchMetrics.averageMatchScore}
                    icon={TrendingUp}
                    description="Out of 100"
                  />
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Cohort Performance</CardTitle>
                      <CardDescription>Member and match statistics per cohort</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {isCohortLoading ? (
                        <div className="space-y-3">
                          {Array.from({ length: 3 }).map((_, i) => (
                            <Skeleton key={i} className="h-12 w-full" />
                          ))}
                        </div>
                      ) : cohortAnalytics && cohortAnalytics.length > 0 ? (
                        <div className="space-y-4">
                          {cohortAnalytics.slice(0, 5).map((cohort) => (
                            <div key={cohort.cohortId} className="p-3 rounded-lg bg-muted/50">
                              <div className="flex justify-between items-center mb-2">
                                <span className="font-medium">{cohort.cohortName}</span>
                                <Badge variant="outline">{cohort.completionRate}% completion</Badge>
                              </div>
                              <div className="flex gap-4 text-sm text-muted-foreground">
                                <span>{cohort.memberCount} members</span>
                                <span>{cohort.matchCount} matches</span>
                                <span>{cohort.mentorCount} mentors</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted-foreground text-center py-8">No cohort data available</p>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Meeting Statistics</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-muted-foreground">Total Meetings</span>
                        <span className="font-semibold">{dashboard.meetingMetrics.totalMeetings}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-muted-foreground">This Month</span>
                        <Badge>{dashboard.meetingMetrics.meetingsThisMonth}</Badge>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-muted-foreground">Completed</span>
                        <span className="font-semibold">{dashboard.meetingMetrics.completedMeetings}</span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-muted-foreground">Avg Duration</span>
                        <span className="font-semibold">{dashboard.meetingMetrics.averageDuration} mins</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="productivity" className="space-y-6">
            {dashboard && (
              <>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <KPICard
                    title="Total Tasks"
                    value={dashboard.taskMetrics.totalTasks}
                    icon={CheckSquare}
                  />
                  <KPICard
                    title="Completed Tasks"
                    value={dashboard.taskMetrics.completedTasks}
                    icon={CheckSquare}
                    variant="success"
                  />
                  <KPICard
                    title="Overdue Tasks"
                    value={dashboard.taskMetrics.overdueTasks}
                    icon={CheckSquare}
                    variant={dashboard.taskMetrics.overdueTasks > 0 ? "danger" : "default"}
                  />
                  <KPICard
                    title="Task Completion Rate"
                    value={`${dashboard.taskMetrics.completionRate}%`}
                    icon={TrendingUp}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <KPICard
                    title="Total Goals"
                    value={dashboard.goalMetrics.totalGoals}
                    icon={Target}
                  />
                  <KPICard
                    title="Completed Goals"
                    value={dashboard.goalMetrics.completedGoals}
                    icon={Target}
                    variant="success"
                  />
                  <KPICard
                    title="Avg Goal Progress"
                    value={`${dashboard.goalMetrics.averageProgress}%`}
                    icon={TrendingUp}
                  />
                  <KPICard
                    title="Goal Completion Rate"
                    value={`${dashboard.goalMetrics.completionRate}%`}
                    icon={TrendingUp}
                  />
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Track Performance</CardTitle>
                      <CardDescription>Activity breakdown by track</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {isTrackLoading ? (
                        <div className="space-y-3">
                          {Array.from({ length: 3 }).map((_, i) => (
                            <Skeleton key={i} className="h-12 w-full" />
                          ))}
                        </div>
                      ) : trackAnalytics && trackAnalytics.length > 0 ? (
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={trackAnalytics} layout="vertical">
                              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                              <XAxis type="number" className="text-xs" />
                              <YAxis type="category" dataKey="trackName" width={100} className="text-xs" />
                              <Tooltip />
                              <Legend />
                              <Bar dataKey="memberCount" name="Members" fill="hsl(var(--primary))" />
                              <Bar dataKey="goalCount" name="Goals" fill="hsl(var(--accent))" />
                              <Bar dataKey="taskCount" name="Tasks" fill="#10b981" />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      ) : (
                        <p className="text-muted-foreground text-center py-8">No track data available</p>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Engagement Metrics</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-muted-foreground">Total Messages</span>
                        <span className="font-semibold">{dashboard.engagementMetrics.totalMessages}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-muted-foreground">Messages This Month</span>
                        <Badge>{dashboard.engagementMetrics.messagesThisMonth}</Badge>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-muted-foreground">Total Conversations</span>
                        <span className="font-semibold">{dashboard.engagementMetrics.totalConversations}</span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-muted-foreground">Documents Uploaded</span>
                        <span className="font-semibold">{dashboard.engagementMetrics.totalDocuments}</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="trends" className="space-y-6">
            <div className="flex items-center gap-4">
              <Select value={trendDays} onValueChange={setTrendDays}>
                <SelectTrigger className="w-40" data-testid="select-trend-days">
                  <SelectValue placeholder="Time period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="14">Last 14 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="60">Last 60 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {isTrendsLoading ? (
              <div className="grid gap-6 lg:grid-cols-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Card key={i}>
                    <CardHeader>
                      <Skeleton className="h-5 w-32" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-64 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : trends ? (
              <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">User Growth</CardTitle>
                    <CardDescription>New user registrations over time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={trends.userGrowth}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis dataKey="date" className="text-xs" />
                          <YAxis className="text-xs" />
                          <Tooltip />
                          <Area type="monotone" dataKey="count" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Match Activity</CardTitle>
                    <CardDescription>New matches created over time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={trends.matchActivity}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis dataKey="date" className="text-xs" />
                          <YAxis className="text-xs" />
                          <Tooltip />
                          <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: "hsl(var(--primary))" }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Task Activity</CardTitle>
                    <CardDescription>Tasks created vs completed</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={trends.taskCompletion}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis dataKey="date" className="text-xs" />
                          <YAxis className="text-xs" />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="created" name="Created" fill="hsl(var(--accent))" />
                          <Bar dataKey="completed" name="Completed" fill="#10b981" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Goal Progress</CardTitle>
                    <CardDescription>Goals created vs completed</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={trends.goalProgress}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis dataKey="date" className="text-xs" />
                          <YAxis className="text-xs" />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="created" name="Created" fill="hsl(var(--accent))" />
                          <Bar dataKey="completed" name="Completed" fill="#10b981" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : null}
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
