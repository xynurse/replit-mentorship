import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layouts/admin-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Calendar,
  Clock,
  Video,
  MapPin,
  Phone,
  Users,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  TrendingUp,
  BarChart3,
  CalendarCheck,
  CalendarClock,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { format, isAfter, isBefore, isToday, startOfDay, endOfDay, subDays, parseISO } from "date-fns";
import type { MeetingLog } from "@shared/schema";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";

interface MeetingWithDetails {
  meeting: MeetingLog;
  mentor: { id: string; firstName: string; lastName: string; email: string; profileImage: string | null };
  mentee: { id: string; firstName: string; lastName: string; email: string; profileImage: string | null };
  cohort?: { id: string; name: string };
}

function KPICard({
  title,
  value,
  icon: Icon,
  description,
  variant = "default",
  onClick,
  active,
}: {
  title: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
  variant?: "default" | "success" | "warning" | "primary";
  onClick?: () => void;
  active?: boolean;
}) {
  const variantClasses = {
    default: "",
    success: "border-success/30 bg-success/5",
    warning: "border-warning/30 bg-warning/5",
    primary: "border-primary/30 bg-primary/5",
  };

  return (
    <Card
      className={`${variantClasses[variant]} ${onClick ? "cursor-pointer hover-elevate" : ""} ${active ? "ring-2 ring-primary" : ""}`}
      onClick={onClick}
      data-testid={`kpi-card-${title.toLowerCase().replace(/\s/g, '-')}`}
    >
      <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-5 w-5 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold" data-testid={`kpi-${title.toLowerCase().replace(/\s/g, '-')}`}>{value}</div>
        {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
      </CardContent>
    </Card>
  );
}

function getFormatIcon(format?: string | null) {
  switch (format) {
    case 'VIRTUAL':
      return <Video className="h-4 w-4 text-info" />;
    case 'IN_PERSON':
      return <MapPin className="h-4 w-4 text-success" />;
    case 'PHONE':
      return <Phone className="h-4 w-4 text-primary" />;
    default:
      return <Calendar className="h-4 w-4 text-muted-foreground" />;
  }
}

function getStatusBadge(meeting: MeetingLog) {
  const now = new Date();
  const scheduledDate = meeting.scheduledDate ? new Date(meeting.scheduledDate) : null;
  
  if (meeting.actualDate) {
    return <StatusBadge status="Completed" tone="success" />;
  }

  if (scheduledDate) {
    if (isToday(scheduledDate)) {
      return <StatusBadge status="Today" tone="info" />;
    }
    if (isAfter(scheduledDate, now)) {
      return <Badge variant="outline">Upcoming</Badge>;
    }
    if (isBefore(scheduledDate, now)) {
      return <Badge variant="destructive">Missed</Badge>;
    }
  }
  
  return <Badge variant="secondary">Scheduled</Badge>;
}

export default function AdminMeetingsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  // Default to "upcoming" so admins land on what needs attention first.
  // Click any KPI tile (Total / Completed / Upcoming / Today) to switch
  // the filter — see the onClick handlers on the cards below.
  const [statusFilter, setStatusFilter] = useState<string>("upcoming");
  const [formatFilter, setFormatFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("list");

  const { data: meetings, isLoading } = useQuery<MeetingWithDetails[]>({
    queryKey: ['/api/admin/meetings'],
  });

  const now = new Date();

  const filteredMeetings = meetings?.filter(item => {
    const { meeting, mentor, mentee, cohort } = item;
    const searchLower = searchTerm.toLowerCase();
    
    const matchesSearch = 
      mentor.firstName.toLowerCase().includes(searchLower) ||
      mentor.lastName.toLowerCase().includes(searchLower) ||
      mentee.firstName.toLowerCase().includes(searchLower) ||
      mentee.lastName.toLowerCase().includes(searchLower) ||
      cohort?.name?.toLowerCase().includes(searchLower) ||
      meeting.agenda?.toLowerCase().includes(searchLower);
    
    const scheduledDate = meeting.scheduledDate ? new Date(meeting.scheduledDate) : null;
    let matchesStatus = true;
    if (statusFilter === "upcoming") {
      matchesStatus = scheduledDate ? isAfter(scheduledDate, now) : false;
    } else if (statusFilter === "completed") {
      matchesStatus = !!meeting.actualDate;
    } else if (statusFilter === "today") {
      matchesStatus = scheduledDate ? isToday(scheduledDate) : false;
    } else if (statusFilter === "missed") {
      matchesStatus = scheduledDate ? isBefore(scheduledDate, now) && !meeting.actualDate : false;
    }
    
    const matchesFormat = formatFilter === "all" || meeting.format === formatFilter;
    
    return matchesSearch && matchesStatus && matchesFormat;
  }) || [];

  const totalMeetings = meetings?.length || 0;
  const completedMeetings = meetings?.filter(m => m.meeting.actualDate).length || 0;
  const upcomingMeetings = meetings?.filter(m => {
    const scheduled = m.meeting.scheduledDate ? new Date(m.meeting.scheduledDate) : null;
    return scheduled && isAfter(scheduled, now) && !m.meeting.actualDate;
  }).length || 0;
  const todayMeetings = meetings?.filter(m => {
    const scheduled = m.meeting.scheduledDate ? new Date(m.meeting.scheduledDate) : null;
    return scheduled && isToday(scheduled);
  }).length || 0;

  const meetingsByDay = meetings?.reduce((acc, m) => {
    if (m.meeting.scheduledDate) {
      const date = format(new Date(m.meeting.scheduledDate), 'MMM dd');
      acc[date] = (acc[date] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>) || {};

  const chartData = Object.entries(meetingsByDay)
    .slice(-14)
    .map(([date, count]) => ({ date, count }));

  const formatDistribution = meetings?.reduce((acc, m) => {
    const fmt = m.meeting.format || 'OTHER';
    acc[fmt] = (acc[fmt] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  const formatChartData = Object.entries(formatDistribution).map(([name, value]) => ({ name, value }));

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <Skeleton className="h-[400px]" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground" data-testid="heading-meetings">Meeting Management</h1>
          <p className="text-muted-foreground mt-1">Track and analyze mentor-mentee meetings across all cohorts</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <KPICard
            title="Total Meetings"
            value={totalMeetings}
            icon={Calendar}
            description="All scheduled meetings"
            onClick={() => setStatusFilter("all")}
            active={statusFilter === "all"}
          />
          <KPICard
            title="Completed"
            value={completedMeetings}
            icon={CheckCircle2}
            description={`${totalMeetings > 0 ? Math.round((completedMeetings / totalMeetings) * 100) : 0}% completion rate`}
            variant="success"
            onClick={() => setStatusFilter("completed")}
            active={statusFilter === "completed"}
          />
          <KPICard
            title="Upcoming"
            value={upcomingMeetings}
            icon={CalendarClock}
            description="Scheduled future meetings"
            variant="primary"
            onClick={() => setStatusFilter("upcoming")}
            active={statusFilter === "upcoming"}
          />
          <KPICard
            title="Today"
            value={todayMeetings}
            icon={CalendarCheck}
            description="Meetings scheduled today"
            variant="warning"
            onClick={() => setStatusFilter("today")}
            active={statusFilter === "today"}
          />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="list" data-testid="tab-list">
              <Users className="h-4 w-4 mr-2" />
              Meeting List
            </TabsTrigger>
            <TabsTrigger value="analytics" data-testid="tab-analytics">
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="mt-4">
            <Card>
              <CardHeader>
                <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
                  <div>
                    <CardTitle>All Meetings</CardTitle>
                    <CardDescription>View and filter all mentor-mentee meetings</CardDescription>
                  </div>
                  <div className="flex flex-col md:flex-row gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search meetings..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 w-full md:w-64"
                        data-testid="input-search"
                      />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-full md:w-40" data-testid="select-status">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="upcoming">Upcoming</SelectItem>
                        <SelectItem value="today">Today</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="missed">Missed</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={formatFilter} onValueChange={setFormatFilter}>
                      <SelectTrigger className="w-full md:w-40" data-testid="select-format">
                        <SelectValue placeholder="Format" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Formats</SelectItem>
                        <SelectItem value="VIRTUAL">Virtual</SelectItem>
                        <SelectItem value="IN_PERSON">In Person</SelectItem>
                        <SelectItem value="PHONE">Phone</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {filteredMeetings.length === 0 ? (
                  <EmptyState
                    icon={Calendar}
                    title="No meetings found"
                    description={
                      searchTerm || statusFilter !== "all" || formatFilter !== "all"
                        ? "Try adjusting your filters"
                        : "Meetings will appear here once they are scheduled"
                    }
                  />
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date & Time</TableHead>
                          <TableHead>Mentor</TableHead>
                          <TableHead>Mentee</TableHead>
                          <TableHead>Format</TableHead>
                          <TableHead>Cohort</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Duration</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredMeetings.map((item) => (
                          <TableRow key={item.meeting.id} data-testid={`meeting-row-${item.meeting.id}`}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <div>
                                  <div className="font-medium">
                                    {item.meeting.scheduledDate 
                                      ? format(new Date(item.meeting.scheduledDate), 'MMM dd, yyyy')
                                      : 'TBD'}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {item.meeting.scheduledDate 
                                      ? format(new Date(item.meeting.scheduledDate), 'h:mm a')
                                      : ''}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={item.mentor.profileImage || undefined} />
                                  <AvatarFallback>
                                    {item.mentor.firstName[0]}{item.mentor.lastName[0]}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="font-medium text-sm">
                                    {item.mentor.firstName} {item.mentor.lastName}
                                  </div>
                                  <div className="text-xs text-muted-foreground">{item.mentor.email}</div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={item.mentee.profileImage || undefined} />
                                  <AvatarFallback>
                                    {item.mentee.firstName[0]}{item.mentee.lastName[0]}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="font-medium text-sm">
                                    {item.mentee.firstName} {item.mentee.lastName}
                                  </div>
                                  <div className="text-xs text-muted-foreground">{item.mentee.email}</div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {getFormatIcon(item.meeting.format)}
                                <span className="text-sm capitalize">
                                  {item.meeting.format?.toLowerCase().replace('_', ' ') || 'N/A'}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {item.cohort?.name || 'General'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {getStatusBadge(item.meeting)}
                            </TableCell>
                            <TableCell>
                              {item.meeting.duration ? `${item.meeting.duration} min` : '-'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="mt-4 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Meeting Trends
                  </CardTitle>
                  <CardDescription>Meetings scheduled over the past 14 days</CardDescription>
                </CardHeader>
                <CardContent>
                  {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="date" className="text-xs" />
                        <YAxis className="text-xs" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px'
                          }} 
                        />
                        <Line 
                          type="monotone" 
                          dataKey="count" 
                          stroke="hsl(var(--primary))" 
                          strokeWidth={2}
                          dot={{ fill: 'hsl(var(--primary))' }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                      No meeting data available
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Meeting Formats
                  </CardTitle>
                  <CardDescription>Distribution of meeting types</CardDescription>
                </CardHeader>
                <CardContent>
                  {formatChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={formatChartData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="name" className="text-xs" />
                        <YAxis className="text-xs" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px'
                          }} 
                        />
                        <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                      No format data available
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Meeting Statistics Summary</CardTitle>
                <CardDescription>Overview of meeting activity across the platform</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="text-center p-4 rounded-lg bg-muted/50">
                    <div className="text-3xl font-bold text-primary">{totalMeetings}</div>
                    <div className="text-sm text-muted-foreground">Total Scheduled</div>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-success/10">
                    <div className="text-3xl font-bold text-success">{completedMeetings}</div>
                    <div className="text-sm text-muted-foreground">Completed</div>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-info/10">
                    <div className="text-3xl font-bold text-info">{upcomingMeetings}</div>
                    <div className="text-sm text-muted-foreground">Upcoming</div>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-warning/10">
                    <div className="text-3xl font-bold text-warning">
                      {totalMeetings > 0 ? Math.round((completedMeetings / totalMeetings) * 100) : 0}%
                    </div>
                    <div className="text-sm text-muted-foreground">Completion Rate</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
