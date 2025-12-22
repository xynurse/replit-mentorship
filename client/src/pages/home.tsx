import { 
  Users, 
  Calendar, 
  MessageSquare, 
  TrendingUp, 
  Clock,
  ArrowRight,
  CheckCircle,
  UserPlus,
  FileText
} from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";

export default function HomePage() {
  const { user } = useAuth();

  if (!user) return null;

  const isMentor = user.role === "MENTOR";
  const isAdmin = user.role === "ADMIN" || user.role === "SUPER_ADMIN";

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
            <Button data-testid="button-schedule">
              <Calendar className="mr-2 h-4 w-4" />
              Schedule session
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title={isMentor ? "Active Mentees" : "Sessions Completed"}
            value={isMentor ? "3" : "8"}
            change="+2 this month"
            icon={<Users className="h-5 w-5" />}
          />
          <StatCard
            title="Upcoming Sessions"
            value="2"
            change="Next: Tomorrow"
            icon={<Calendar className="h-5 w-5" />}
          />
          <StatCard
            title="Unread Messages"
            value="5"
            change="3 new today"
            icon={<MessageSquare className="h-5 w-5" />}
          />
          <StatCard
            title="Hours This Month"
            value="12"
            change="+4 from last month"
            icon={<Clock className="h-5 w-5" />}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
                <div>
                  <CardTitle className="text-lg">Upcoming Sessions</CardTitle>
                  <CardDescription>Your scheduled mentorship sessions</CardDescription>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/calendar">
                    View all
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <SessionCard
                    name={isMentor ? "Maria Santos" : "Dr. James Wilson"}
                    role={isMentor ? "Mentee" : "Mentor"}
                    date="Tomorrow"
                    time="2:00 PM - 3:00 PM"
                    topic="Career Development Planning"
                  />
                  <SessionCard
                    name={isMentor ? "Carlos Rodriguez" : "Dr. Sarah Chen"}
                    role={isMentor ? "Mentee" : "Mentor"}
                    date="Dec 28, 2025"
                    time="10:00 AM - 11:00 AM"
                    topic="Clinical Skills Review"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
                <div>
                  <CardTitle className="text-lg">Recent Activity</CardTitle>
                  <CardDescription>Latest updates from your network</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <ActivityItem
                    icon={<CheckCircle className="h-4 w-4 text-primary" />}
                    title="Session completed"
                    description="Goal-setting session with Dr. Chen"
                    time="2 hours ago"
                  />
                  <ActivityItem
                    icon={<MessageSquare className="h-4 w-4 text-primary" />}
                    title="New message"
                    description="You have a new message from Maria Santos"
                    time="5 hours ago"
                  />
                  <ActivityItem
                    icon={<FileText className="h-4 w-4 text-primary" />}
                    title="Document shared"
                    description="Career roadmap template was shared with you"
                    time="Yesterday"
                  />
                  <ActivityItem
                    icon={<UserPlus className="h-4 w-4 text-primary" />}
                    title="New connection"
                    description="You were matched with a new mentee"
                    time="3 days ago"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Your Progress</CardTitle>
                <CardDescription>Mentorship program completion</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Profile Completion</span>
                    <span className="text-sm text-muted-foreground">85%</span>
                  </div>
                  <Progress value={85} className="h-2" />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Sessions Attended</span>
                    <span className="text-sm text-muted-foreground">8/12</span>
                  </div>
                  <Progress value={67} className="h-2" />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Goals Achieved</span>
                    <span className="text-sm text-muted-foreground">3/5</span>
                  </div>
                  <Progress value={60} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href="/messages">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Send a message
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href="/calendar">
                    <Calendar className="mr-2 h-4 w-4" />
                    Schedule session
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
                {isMentor ? (
                  <div className="space-y-3">
                    <MenteeCard name="Maria Santos" specialty="Pediatric Nursing" status="Active" />
                    <MenteeCard name="Carlos Rodriguez" specialty="Emergency Care" status="Active" />
                    <MenteeCard name="Ana Silva" specialty="ICU Nursing" status="Pending" />
                  </div>
                ) : (
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback>JW</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium">Dr. James Wilson</p>
                      <p className="text-sm text-muted-foreground">Nurse Practitioner, 15 years</p>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link href="/messages">Message</Link>
                    </Button>
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
        <div className="flex items-center justify-between">
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

function SessionCard({
  name,
  role,
  date,
  time,
  topic,
}: {
  name: string;
  role: string;
  date: string;
  time: string;
  topic: string;
}) {
  const initials = name.split(" ").map((n) => n[0]).join("");

  return (
    <div className="flex items-center gap-4 p-4 rounded-md border">
      <Avatar>
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium truncate">{name}</p>
          <Badge variant="secondary" className="text-xs">{role}</Badge>
        </div>
        <p className="text-sm text-muted-foreground">{topic}</p>
      </div>
      <div className="text-right text-sm">
        <p className="font-medium">{date}</p>
        <p className="text-muted-foreground">{time}</p>
      </div>
    </div>
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
      <div className="mt-0.5 p-1.5 rounded-full bg-primary/10">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm">{title}</p>
        <p className="text-sm text-muted-foreground truncate">{description}</p>
      </div>
      <span className="text-xs text-muted-foreground whitespace-nowrap">{time}</span>
    </div>
  );
}

function MenteeCard({
  name,
  specialty,
  status,
}: {
  name: string;
  specialty: string;
  status: "Active" | "Pending";
}) {
  const initials = name.split(" ").map((n) => n[0]).join("");

  return (
    <div className="flex items-center gap-3">
      <Avatar className="h-10 w-10">
        <AvatarFallback className="text-sm">{initials}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{name}</p>
        <p className="text-xs text-muted-foreground">{specialty}</p>
      </div>
      <Badge 
        variant={status === "Active" ? "default" : "secondary"}
        className="text-xs"
      >
        {status}
      </Badge>
    </div>
  );
}
