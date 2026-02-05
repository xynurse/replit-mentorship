import { useQuery } from "@tanstack/react-query";
import { 
  Users, 
  Calendar, 
  MessageSquare, 
  TrendingUp, 
  Clock,
  ArrowRight,
  CheckCircle,
  UserPlus,
  FileText,
  Target
} from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import type { MentorshipMatch, Goal, User, Notification, MeetingLog } from "@shared/schema";

type PublicUserInfo = Pick<User, 'id' | 'firstName' | 'lastName' | 'email' | 'role' | 'profileImage' | 'bio' | 'jobTitle' | 'organizationName' | 'linkedInUrl'>;

interface ConnectionWithUser extends MentorshipMatch {
  mentor?: PublicUserInfo;
  mentee?: PublicUserInfo;
}

export default function HomePage() {
  const { user } = useAuth();

  const { data: matches = [], isLoading: loadingMatches } = useQuery<ConnectionWithUser[]>({
    queryKey: ["/api/matches/my"],
  });

  const { data: goals = [], isLoading: loadingGoals } = useQuery<Goal[]>({
    queryKey: ["/api/goals"],
  });

  const { data: meetings = [], isLoading: loadingMeetings } = useQuery<MeetingLog[]>({
    queryKey: ["/api/meetings"],
  });

  const { data: notifications = [], isLoading: loadingNotifications } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
  });

  if (!user) return null;

  const isMentor = user.role === "MENTOR";
  const isAdmin = user.role === "ADMIN" || user.role === "SUPER_ADMIN";

  const activeMatches = matches.filter(m => m.status === "ACTIVE");
  const completedGoals = goals.filter(g => g.status === "COMPLETED");
  const inProgressGoals = goals.filter(g => g.status === "IN_PROGRESS");
  const unreadNotifications = notifications.filter(n => !n.isRead);
  const upcomingMeetings = meetings.filter(m => m.scheduledDate && new Date(m.scheduledDate) > new Date());

  const isLoading = loadingMatches || loadingGoals || loadingNotifications || loadingMeetings;

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">
              Welcome back, {user.firstName}!
            </h1>
            <p className="text-muted-foreground mt-1">
              Here's what's happening with your mentorship journey.
            </p>
          </div>
          {!isAdmin && (
            <Link href="/calendar">
              <Button data-testid="button-schedule">
                <Calendar className="mr-2 h-4 w-4" />
                Schedule session
              </Button>
            </Link>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {isLoading ? (
            <>
              {[1, 2, 3, 4].map((i) => (
                <Card key={i}>
                  <CardContent className="pt-6">
                    <Skeleton className="h-16 w-full" />
                  </CardContent>
                </Card>
              ))}
            </>
          ) : (
            <>
              <StatCard
                title={isMentor ? "Active Mentees" : "Active Connections"}
                value={String(activeMatches.length)}
                change={activeMatches.length > 0 ? "Active matches" : "No matches yet"}
                icon={<Users className="h-5 w-5" />}
              />
              <StatCard
                title="Upcoming Meetings"
                value={String(upcomingMeetings.length)}
                change={upcomingMeetings.length > 0 ? "Sessions scheduled" : "No meetings scheduled"}
                icon={<Calendar className="h-5 w-5" />}
              />
              <StatCard
                title="Unread Messages"
                value={String(unreadNotifications.length)}
                change={unreadNotifications.length > 0 ? "New notifications" : "No new messages"}
                icon={<MessageSquare className="h-5 w-5" />}
              />
              <StatCard
                title="Goals Progress"
                value={`${completedGoals.length}/${goals.length}`}
                change={inProgressGoals.length > 0 ? `${inProgressGoals.length} in progress` : "Set your goals"}
                icon={<Target className="h-5 w-5" />}
              />
            </>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
                <div>
                  <CardTitle className="text-lg">Recent Activity</CardTitle>
                  <CardDescription>Latest updates from your network</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                {loadingNotifications ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : notifications.length > 0 ? (
                  <div className="space-y-4">
                    {notifications.slice(0, 4).map((notification) => (
                      <ActivityItem
                        key={notification.id}
                        icon={getNotificationIcon(notification.type)}
                        title={notification.title}
                        description={notification.message}
                        time={formatTimeAgo(new Date(notification.createdAt!))}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No recent activity</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Your Progress</CardTitle>
                <CardDescription>Mentorship program overview</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-8 w-full" />
                    ))}
                  </div>
                ) : (
                  <>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Goals Achieved</span>
                        <span className="text-sm text-muted-foreground">
                          {completedGoals.length}/{goals.length}
                        </span>
                      </div>
                      <Progress value={goals.length > 0 ? (completedGoals.length / goals.length) * 100 : 0} className="h-2" />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Active Connections</span>
                        <span className="text-sm text-muted-foreground">
                          {activeMatches.length}
                        </span>
                      </div>
                      <Progress value={activeMatches.length > 0 ? 100 : 0} className="h-2" />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href="/calendar">
                    <Calendar className="mr-2 h-4 w-4" />
                    View calendar
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href="/documents">
                    <FileText className="mr-2 h-4 w-4" />
                    View documents
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">
                  {isMentor ? "Your Mentees" : "Your Mentor"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingMatches ? (
                  <div className="space-y-3">
                    {[1, 2].map((i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : activeMatches.length > 0 ? (
                  <div className="space-y-3">
                    {activeMatches.slice(0, 3).map((match) => {
                      const connectedUser = isMentor ? match.mentee : match.mentor;
                      if (!connectedUser) return null;
                      const initials = `${connectedUser.firstName?.[0] || ""}${connectedUser.lastName?.[0] || ""}`.toUpperCase();
                      
                      return (
                        <div key={match.id} className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={connectedUser.profileImage || undefined} />
                            <AvatarFallback>{initials}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">
                              {connectedUser.firstName} {connectedUser.lastName}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {connectedUser.jobTitle || connectedUser.role}
                            </p>
                          </div>
                          <Button variant="outline" size="sm" asChild>
                            <Link href="/connections">View</Link>
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    <UserPlus className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">
                      {isMentor ? "No mentees matched yet" : "No mentor matched yet"}
                    </p>
                    <Link href="/connections">
                      <Button variant="ghost" size="sm" className="mt-2">View connections</Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function StatCard({
  title,
  value,
  change,
  icon,
}: {
  title: string;
  value: string;
  change: string;
  icon: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-semibold mt-1">{value}</p>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-primary" />
              {change}
            </p>
          </div>
          <div className="p-3 rounded-md bg-primary/10 text-primary">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ActivityItem({
  icon,
  title,
  description,
  time,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  time: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="p-2 rounded-md bg-primary/10 shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{title}</p>
        <p className="text-xs text-muted-foreground truncate">{description}</p>
      </div>
      <span className="text-xs text-muted-foreground shrink-0">{time}</span>
    </div>
  );
}

function getNotificationIcon(type: string) {
  switch (type) {
    case "GOAL_APPROVED":
    case "GOAL_COMPLETED":
      return <CheckCircle className="h-4 w-4 text-primary" />;
    case "NEW_MESSAGE":
      return <MessageSquare className="h-4 w-4 text-primary" />;
    case "DOCUMENT_SHARED":
      return <FileText className="h-4 w-4 text-primary" />;
    case "MATCH_CONFIRMED":
    case "MATCH_PROPOSED":
      return <UserPlus className="h-4 w-4 text-primary" />;
    default:
      return <Clock className="h-4 w-4 text-primary" />;
  }
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}
