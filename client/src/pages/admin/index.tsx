import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layouts/admin-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, UserCheck, Handshake, ClipboardList, Calendar, AlertTriangle, ArrowRight, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";

interface DashboardStats {
  totalMentors: number;
  totalMentees: number;
  activeMatches: number;
  pendingApplications: number;
  upcomingMeetings: number;
  overdueTasks: number;
}

function StatCard({ title, value, icon: Icon, description, href, variant = "default" }: {
  title: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
  href?: string;
  variant?: "default" | "warning";
}) {
  const content = (
    <Card className={variant === "warning" && Number(value) > 0 ? "border-destructive/50" : ""}>
      <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className={`h-5 w-5 ${variant === "warning" && Number(value) > 0 ? "text-destructive" : "text-muted-foreground"}`} />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{value}</div>
        {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
      </CardContent>
    </Card>
  );

  if (href) {
    return <Link href={href} className="block hover-elevate">{content}</Link>;
  }
  return content;
}

function QuickActions() {
  const actions = [
    { label: "Manage Users", href: "/admin/users", icon: Users },
    { label: "Review Applications", href: "/admin/applications", icon: ClipboardList },
    { label: "Manage Cohorts", href: "/admin/cohorts", icon: UserCheck },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Quick Actions</CardTitle>
        <CardDescription>Common administrative tasks</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {actions.map((action) => (
          <Link key={action.href} href={action.href}>
            <Button variant="ghost" className="w-full justify-between" data-testid={`action-${action.label.toLowerCase().replace(/\s/g, '-')}`}>
              <span className="flex items-center gap-2">
                <action.icon className="h-4 w-4" />
                {action.label}
              </span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}

function RecentActivity() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Recent Activity</CardTitle>
        <CardDescription>Latest updates from the platform</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Activity className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">Platform initialized</p>
              <p className="text-xs text-muted-foreground">Ready to accept applications</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminDashboard() {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/admin/stats"],
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="text-page-title">Admin Dashboard</h1>
          <p className="text-muted-foreground">Overview of your mentorship platform</p>
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
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
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <StatCard
              title="Active Mentors"
              value={stats?.totalMentors || 0}
              icon={UserCheck}
              description="Verified mentors on platform"
              href="/admin/users?role=MENTOR"
            />
            <StatCard
              title="Active Mentees"
              value={stats?.totalMentees || 0}
              icon={Users}
              description="Enrolled mentees"
              href="/admin/users?role=MENTEE"
            />
            <StatCard
              title="Active Matches"
              value={stats?.activeMatches || 0}
              icon={Handshake}
              description="Currently paired"
            />
            <StatCard
              title="Pending Applications"
              value={stats?.pendingApplications || 0}
              icon={ClipboardList}
              description="Awaiting review"
              href="/admin/applications"
              variant={stats?.pendingApplications ? "warning" : "default"}
            />
            <StatCard
              title="Upcoming Meetings"
              value={stats?.upcomingMeetings || 0}
              icon={Calendar}
              description="This week"
            />
            <StatCard
              title="Overdue Tasks"
              value={stats?.overdueTasks || 0}
              icon={AlertTriangle}
              description="Need attention"
              variant="warning"
            />
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          <QuickActions />
          <RecentActivity />
        </div>
      </div>
    </AdminLayout>
  );
}
