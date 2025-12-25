import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { Users, MessageSquare, Target, Calendar, Mail, Building, Briefcase, UserPlus } from "lucide-react";
import type { MentorshipMatch, User } from "@shared/schema";

// API returns only public user fields for security
type PublicUserInfo = Pick<User, 'id' | 'firstName' | 'lastName' | 'email' | 'role' | 'profileImage' | 'bio' | 'jobTitle' | 'organizationName' | 'linkedInUrl'>;

interface ConnectionWithUser extends MentorshipMatch {
  mentor?: PublicUserInfo;
  mentee?: PublicUserInfo;
}

export default function ConnectionsPage() {
  const { user } = useAuth();
  const isMentor = user?.role === "MENTOR";

  const { data: matches = [], isLoading } = useQuery<ConnectionWithUser[]>({
    queryKey: ["/api/matches/my"],
  });

  const activeMatches = matches.filter(m => m.status === "ACTIVE");
  const pendingMatches = matches.filter(m => m.status === "PROPOSED");

  if (!user) return null;

  return (
    <DashboardLayout>
      <div className="p-6 max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="text-connections-title">
            <Users className="h-6 w-6" />
            {isMentor ? "My Mentees" : "My Mentor"}
          </h1>
          <p className="text-muted-foreground">
            {isMentor 
              ? "View and manage your mentee relationships" 
              : "Connect with your mentor and track your progress"}
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <Skeleton className="h-16 w-16 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-5 w-48" />
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-64" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : activeMatches.length === 0 && pendingMatches.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <UserPlus className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Connections Yet</h3>
              <p className="text-muted-foreground mb-4">
                {isMentor 
                  ? "You haven't been matched with any mentees yet. Matches will appear here once assigned." 
                  : "You haven't been matched with a mentor yet. Apply to a program to get started."}
              </p>
              {!isMentor && (
                <Link href="/">
                  <Button data-testid="button-find-programs">Find Programs</Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {activeMatches.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Badge variant="default">Active</Badge>
                  Active Connections ({activeMatches.length})
                </h2>
                <div className="grid gap-4">
                  {activeMatches.map((match) => {
                    const connectedUser = isMentor ? match.mentee : match.mentor;
                    if (!connectedUser) return null;
                    
                    const initials = `${connectedUser.firstName?.[0] || ""}${connectedUser.lastName?.[0] || ""}`.toUpperCase();
                    
                    return (
                      <Card key={match.id} data-testid={`card-connection-${match.id}`}>
                        <CardContent className="p-6">
                          <div className="flex flex-col md:flex-row md:items-start gap-4">
                            <Avatar className="h-16 w-16">
                              <AvatarImage src={connectedUser.profileImage || undefined} />
                              <AvatarFallback className="text-lg">{initials}</AvatarFallback>
                            </Avatar>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2 mb-1">
                                <h3 className="font-semibold text-lg">
                                  {connectedUser.firstName} {connectedUser.lastName}
                                </h3>
                                <Badge variant="secondary">
                                  {isMentor ? "Mentee" : "Mentor"}
                                </Badge>
                              </div>
                              
                              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-3">
                                {connectedUser.jobTitle && (
                                  <span className="flex items-center gap-1">
                                    <Briefcase className="h-4 w-4" />
                                    {connectedUser.jobTitle}
                                  </span>
                                )}
                                {connectedUser.organizationName && (
                                  <span className="flex items-center gap-1">
                                    <Building className="h-4 w-4" />
                                    {connectedUser.organizationName}
                                  </span>
                                )}
                              </div>
                              
                              {connectedUser.bio && (
                                <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                                  {connectedUser.bio}
                                </p>
                              )}
                              
                              <div className="flex flex-wrap gap-2">
                                <Link href="/messages">
                                  <Button size="sm" data-testid={`button-message-${match.id}`}>
                                    <MessageSquare className="h-4 w-4 mr-2" />
                                    Message
                                  </Button>
                                </Link>
                                <Link href="/goals">
                                  <Button size="sm" variant="outline" data-testid={`button-goals-${match.id}`}>
                                    <Target className="h-4 w-4 mr-2" />
                                    Goals
                                  </Button>
                                </Link>
                                <Link href="/calendar">
                                  <Button size="sm" variant="outline" data-testid={`button-schedule-${match.id}`}>
                                    <Calendar className="h-4 w-4 mr-2" />
                                    Schedule
                                  </Button>
                                </Link>
                              </div>
                            </div>
                            
                            <div className="text-sm text-muted-foreground">
                              <p>Matched since</p>
                              <p className="font-medium">
                                {match.matchedAt 
                                  ? new Date(match.matchedAt).toLocaleDateString() 
                                  : "Recently"}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {pendingMatches.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Badge variant="outline">Pending</Badge>
                  Pending Connections ({pendingMatches.length})
                </h2>
                <div className="grid gap-4">
                  {pendingMatches.map((match) => {
                    const connectedUser = isMentor ? match.mentee : match.mentor;
                    if (!connectedUser) return null;
                    
                    const initials = `${connectedUser.firstName?.[0] || ""}${connectedUser.lastName?.[0] || ""}`.toUpperCase();
                    
                    return (
                      <Card key={match.id} className="opacity-75" data-testid={`card-pending-${match.id}`}>
                        <CardContent className="p-6">
                          <div className="flex items-center gap-4">
                            <Avatar className="h-12 w-12">
                              <AvatarImage src={connectedUser.profileImage || undefined} />
                              <AvatarFallback>{initials}</AvatarFallback>
                            </Avatar>
                            
                            <div className="flex-1">
                              <h3 className="font-medium">
                                {connectedUser.firstName} {connectedUser.lastName}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                Match pending approval
                              </p>
                            </div>
                            
                            <Badge variant="secondary">Pending</Badge>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
