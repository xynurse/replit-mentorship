import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  ArrowLeft, User, Target, FileText, Mail, Building, Briefcase, 
  Phone, Globe, Calendar, Clock, Award,
  CheckCircle2, Circle, Clock3, Download
} from "lucide-react";
import type { Goal, Document } from "@shared/schema";

interface MenteeProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  profileImage?: string | null;
  bio?: string | null;
  jobTitle?: string | null;
  organizationName?: string | null;
  linkedInUrl?: string | null;
  phone?: string | null;
  timezone?: string | null;
  yearsOfExperience?: number | null;
  fieldsOfExpertise?: string[] | null;
  educationLevel?: string | null;
  certificationsTraining?: string | null;
  languagesSpoken?: string[] | null;
  mentorshipRoleChoice?: string | null;
  createdAt?: Date | string | null;
}

type SharedDocument = Document & { sharedAt: Date };

export default function MenteeDetailPage() {
  const { id: menteeId } = useParams<{ id: string }>();
  const { user } = useAuth();
  
  const { data: mentee, isLoading: profileLoading } = useQuery<MenteeProfile>({
    queryKey: ["/api/mentee", menteeId, "profile"],
    queryFn: async () => {
      const res = await fetch(`/api/mentee/${menteeId}/profile`);
      if (!res.ok) throw new Error("Failed to fetch mentee profile");
      return res.json();
    },
    enabled: !!menteeId,
  });

  const { data: goals = [], isLoading: goalsLoading } = useQuery<Goal[]>({
    queryKey: ["/api/mentee", menteeId, "goals"],
    queryFn: async () => {
      const res = await fetch(`/api/mentee/${menteeId}/goals`);
      if (!res.ok) throw new Error("Failed to fetch mentee goals");
      return res.json();
    },
    enabled: !!menteeId,
  });

  const { data: sharedDocs = [], isLoading: docsLoading } = useQuery<SharedDocument[]>({
    queryKey: ["/api/mentee", menteeId, "shared-documents"],
    queryFn: async () => {
      const res = await fetch(`/api/mentee/${menteeId}/shared-documents`);
      if (!res.ok) throw new Error("Failed to fetch shared documents");
      return res.json();
    },
    enabled: !!menteeId,
  });

  if (!user) return null;

  const initials = mentee 
    ? `${mentee.firstName?.[0] || ""}${mentee.lastName?.[0] || ""}`.toUpperCase()
    : "";

  const getGoalStatusIcon = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "IN_PROGRESS":
        return <Clock3 className="h-4 w-4 text-blue-500" />;
      default:
        return <Circle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getGoalStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <Badge variant="default" className="bg-green-500">Completed</Badge>;
      case "IN_PROGRESS":
        return <Badge variant="default" className="bg-blue-500">In Progress</Badge>;
      case "NOT_STARTED":
        return <Badge variant="secondary">Not Started</Badge>;
      case "ON_HOLD":
        return <Badge variant="outline">On Hold</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const completedGoals = goals.filter(g => g.status === "COMPLETED").length;
  const progressPercentage = goals.length > 0 ? (completedGoals / goals.length) * 100 : 0;

  return (
    <DashboardLayout>
      <div className="p-6 max-w-5xl mx-auto">
        <div className="mb-6">
          <Link href="/connections">
            <Button variant="ghost" size="sm" className="mb-4" data-testid="button-back">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Connections
            </Button>
          </Link>
        </div>

        {profileLoading ? (
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex items-start gap-6">
                <Skeleton className="h-24 w-24 rounded-full" />
                <div className="flex-1 space-y-3">
                  <Skeleton className="h-8 w-64" />
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </div>
            </CardContent>
          </Card>
        ) : mentee ? (
          <>
            <Card className="mb-6" data-testid="card-mentee-profile">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row items-start gap-6">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={mentee.profileImage || undefined} />
                    <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                      <h1 className="text-2xl font-bold" data-testid="text-mentee-name">
                        {mentee.firstName} {mentee.lastName}
                      </h1>
                      <Badge variant="secondary">Mentee</Badge>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
                      {mentee.jobTitle && (
                        <span className="flex items-center gap-1">
                          <Briefcase className="h-4 w-4" />
                          {mentee.jobTitle}
                        </span>
                      )}
                      {mentee.organizationName && (
                        <span className="flex items-center gap-1">
                          <Building className="h-4 w-4" />
                          {mentee.organizationName}
                        </span>
                      )}
                    </div>
                    
                    {mentee.bio && (
                      <p className="text-muted-foreground mb-4">{mentee.bio}</p>
                    )}
                    
                    <div className="flex flex-wrap gap-4 text-sm">
                      {mentee.email && (
                        <a href={`mailto:${mentee.email}`} className="flex items-center gap-1 text-primary hover:underline">
                          <Mail className="h-4 w-4" />
                          {mentee.email}
                        </a>
                      )}
                      {mentee.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-4 w-4" />
                          {mentee.phone}
                        </span>
                      )}
                      {mentee.linkedInUrl && (
                        <a href={mentee.linkedInUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline">
                          <Globe className="h-4 w-4" />
                          LinkedIn
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Tabs defaultValue="goals" className="space-y-4">
              <TabsList data-testid="tabs-mentee-detail">
                <TabsTrigger value="goals" data-testid="tab-goals">
                  <Target className="h-4 w-4 mr-2" />
                  Goals ({goals.length})
                </TabsTrigger>
                <TabsTrigger value="documents" data-testid="tab-documents">
                  <FileText className="h-4 w-4 mr-2" />
                  Shared Documents ({sharedDocs.length})
                </TabsTrigger>
                <TabsTrigger value="profile" data-testid="tab-profile">
                  <User className="h-4 w-4 mr-2" />
                  Profile Details
                </TabsTrigger>
              </TabsList>

              <TabsContent value="goals" className="space-y-4">
                {goals.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Goal Progress</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4">
                        <Progress value={progressPercentage} className="flex-1" />
                        <span className="text-sm font-medium">
                          {completedGoals} of {goals.length} completed
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {goalsLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                      <Card key={i}>
                        <CardContent className="p-4">
                          <Skeleton className="h-5 w-3/4 mb-2" />
                          <Skeleton className="h-4 w-1/2" />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : goals.length === 0 ? (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="font-semibold mb-2">No Goals Yet</h3>
                      <p className="text-muted-foreground">
                        This mentee hasn't created any goals yet.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {goals.map(goal => (
                      <Card key={goal.id} data-testid={`card-goal-${goal.id}`}>
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            {getGoalStatusIcon(goal.status || "NOT_STARTED")}
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2 mb-1">
                                <h3 className="font-medium">{goal.title}</h3>
                                {getGoalStatusBadge(goal.status || "NOT_STARTED")}
                                {goal.category && (
                                  <Badge variant="outline">{goal.category}</Badge>
                                )}
                              </div>
                              {goal.description && (
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                  {goal.description}
                                </p>
                              )}
                              {goal.targetDate && (
                                <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  Target: {new Date(goal.targetDate).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="documents" className="space-y-4">
                {docsLoading ? (
                  <div className="space-y-4">
                    {[1, 2].map(i => (
                      <Card key={i}>
                        <CardContent className="p-4">
                          <Skeleton className="h-5 w-3/4 mb-2" />
                          <Skeleton className="h-4 w-1/2" />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : sharedDocs.length === 0 ? (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="font-semibold mb-2">No Shared Documents</h3>
                      <p className="text-muted-foreground">
                        This mentee hasn't shared any documents with you yet.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {sharedDocs.map(doc => (
                      <Card key={doc.id} data-testid={`card-document-${doc.id}`}>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <FileText className="h-8 w-8 text-muted-foreground" />
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium truncate">{doc.name}</h3>
                              <p className="text-sm text-muted-foreground">
                                Shared on {new Date(doc.sharedAt).toLocaleDateString()}
                              </p>
                            </div>
                            {doc.fileUrl && (
                              <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                                <Button size="sm" variant="outline" data-testid={`button-download-${doc.id}`}>
                                  <Download className="h-4 w-4 mr-2" />
                                  Download
                                </Button>
                              </a>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="profile" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Profile Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {mentee.yearsOfExperience !== null && mentee.yearsOfExperience !== undefined && (
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground mb-1">Years of Experience</h4>
                          <p>{mentee.yearsOfExperience} years</p>
                        </div>
                      )}
                      {mentee.educationLevel && (
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground mb-1">Education Level</h4>
                          <p>{mentee.educationLevel}</p>
                        </div>
                      )}
                      {mentee.timezone && (
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground mb-1">Timezone</h4>
                          <p>{mentee.timezone}</p>
                        </div>
                      )}
                    </div>

                    {mentee.languagesSpoken && mentee.languagesSpoken.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-2">Languages Spoken</h4>
                        <div className="flex flex-wrap gap-2">
                          {mentee.languagesSpoken.map((lang: string, idx: number) => (
                            <Badge key={idx} variant="secondary">{lang}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {mentee.fieldsOfExpertise && mentee.fieldsOfExpertise.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-2">Fields of Expertise</h4>
                        <div className="flex flex-wrap gap-2">
                          {mentee.fieldsOfExpertise.map((field: string, idx: number) => (
                            <Badge key={idx} variant="outline">{field}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {mentee.certificationsTraining && (
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-2">Certifications & Training</h4>
                        <p className="flex items-center gap-1">
                          <Award className="h-4 w-4" />
                          {mentee.certificationsTraining}
                        </p>
                      </div>
                    )}

                    {mentee.createdAt && (
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-1">Member Since</h4>
                        <p className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(mentee.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">Mentee Not Found</h3>
              <p className="text-muted-foreground mb-4">
                This mentee may not exist or you may not have access to view their profile.
              </p>
              <Link href="/connections">
                <Button>Back to Connections</Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
