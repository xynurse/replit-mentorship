import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { AdminLayout } from "@/components/layouts/admin-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Edit,
  Save,
  X,
  Mail,
  Phone,
  Briefcase,
  Clock,
  Globe,
  Target,
  GraduationCap,
  Lightbulb,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { MenteeProfile, User } from "@shared/schema";

type MenteeProfileWithUser = MenteeProfile & { user: User };

const careerStageLabels: Record<string, string> = {
  STUDENT: "Student",
  EARLY_CAREER: "Early Career",
  MID_CAREER: "Mid Career",
  SENIOR: "Senior",
  EXECUTIVE: "Executive",
  CAREER_TRANSITION: "Career Transition",
  OTHER: "Other",
};

const interestLabels: Record<string, string> = {
  interestScienceResearch: "Science/Research",
  interestProductDevelopment: "Product Development",
  interestInnovation: "Innovation",
  interestBusinessStrategy: "Business Strategy",
  interestEntrepreneurship: "Entrepreneurship",
  interestIntrapreneurship: "Intrapreneurship",
  interestLeadership: "Leadership",
  interestNetworking: "Networking",
  interestProfessionalDevelopment: "Professional Development",
  interestDigitalTech: "Digital Tech",
  interestEthicalSocial: "Ethical/Social",
};

const interestLevelLabels: Record<number, string> = {
  0: "Not Interested",
  1: "Somewhat Interested",
  2: "Very Interested",
};

export default function AdminMenteeProfileDetail() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [match, params] = useRoute("/admin/mentee-profiles/:userId");
  const userId = params?.userId;
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<MenteeProfile>>({});

  const { data: profile, isLoading, error } = useQuery<MenteeProfileWithUser>({
    queryKey: ["/api/admin/mentee-profiles", userId],
    enabled: !!userId,
    queryFn: async () => {
      const response = await fetch(`/api/admin/mentee-profiles/${userId}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch mentee profile");
      return response.json();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<MenteeProfile>) => {
      const response = await apiRequest("PATCH", `/api/admin/mentee-profiles/${userId}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/mentee-profiles", userId] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/mentee-profiles"] });
      setIsEditing(false);
      toast({ title: "Profile updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update profile", description: error.message, variant: "destructive" });
    },
  });

  const startEditing = () => {
    if (profile) {
      setEditData({
        careerStage: profile.careerStage || null,
        shortTermGoals: profile.shortTermGoals || "",
        longTermVision: profile.longTermVision || "",
        currentProjectOrIdea: profile.currentProjectOrIdea || "",
        previouslyBeenMentored: profile.previouslyBeenMentored ?? false,
        timezone: profile.timezone || "",
        monthlyHoursAvailable: profile.monthlyHoursAvailable || null,
        preferredDuration: profile.preferredDuration || null,
        interestScienceResearch: profile.interestScienceResearch ?? 0,
        interestProductDevelopment: profile.interestProductDevelopment ?? 0,
        interestInnovation: profile.interestInnovation ?? 0,
        interestBusinessStrategy: profile.interestBusinessStrategy ?? 0,
        interestEntrepreneurship: profile.interestEntrepreneurship ?? 0,
        interestIntrapreneurship: profile.interestIntrapreneurship ?? 0,
        interestLeadership: profile.interestLeadership ?? 0,
        interestNetworking: profile.interestNetworking ?? 0,
        interestProfessionalDevelopment: profile.interestProfessionalDevelopment ?? 0,
        interestDigitalTech: profile.interestDigitalTech ?? 0,
        interestEthicalSocial: profile.interestEthicalSocial ?? 0,
      });
      setIsEditing(true);
    }
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditData({});
  };

  const saveChanges = () => {
    updateMutation.mutate(editData);
  };

  if (!match || !userId) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full">
          <p>Invalid profile ID</p>
        </div>
      </AdminLayout>
    );
  }

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full">
          <p>Loading...</p>
        </div>
      </AdminLayout>
    );
  }

  if (error || !profile) {
    return (
      <AdminLayout>
        <div className="space-y-4">
          <Button variant="ghost" onClick={() => setLocation("/admin/mentee-profiles")} data-testid="button-back">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Mentee Profiles
          </Button>
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground">Mentee profile not found</p>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    );
  }

  const user = profile.user;

  const getInterestBadges = () => {
    const interests: { label: string; level: number }[] = [];
    Object.entries(interestLabels).forEach(([key, label]) => {
      const level = (profile as any)[key] as number;
      if (level >= 1) {
        interests.push({ label, level });
      }
    });
    return interests.sort((a, b) => b.level - a.level);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => setLocation("/admin/mentee-profiles")} data-testid="button-back">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Mentee Profiles
          </Button>
          {isEditing ? (
            <div className="flex gap-2">
              <Button variant="outline" onClick={cancelEditing} data-testid="button-cancel">
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
              <Button onClick={saveChanges} disabled={updateMutation.isPending} data-testid="button-save">
                <Save className="mr-2 h-4 w-4" />
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          ) : (
            <Button onClick={startEditing} data-testid="button-edit">
              <Edit className="mr-2 h-4 w-4" />
              Edit Profile
            </Button>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <Avatar className="h-24 w-24 mb-4">
                    <AvatarImage src={user.profileImage || undefined} />
                    <AvatarFallback className="text-2xl">
                      {(user.firstName?.[0] || "") + (user.lastName?.[0] || "")}
                    </AvatarFallback>
                  </Avatar>
                  <h2 className="text-xl font-semibold" data-testid="text-mentee-name">
                    {`${user.firstName} ${user.lastName}`}
                  </h2>
                  <Badge className="mt-2" variant="secondary" data-testid="badge-career-stage">
                    {careerStageLabels[profile.careerStage || ""] || profile.careerStage || "Not Set"}
                  </Badge>
                </div>

                <Separator className="my-6" />

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{user.email}</span>
                  </div>
                  {user.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{user.phone}</span>
                    </div>
                  )}
                  {profile.timezone && (
                    <div className="flex items-center gap-3">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{profile.timezone}</span>
                    </div>
                  )}
                  {user.organizationName && (
                    <div className="flex items-center gap-3">
                      <Briefcase className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{user.organizationName}</span>
                    </div>
                  )}
                  {user.jobTitle && (
                    <div className="flex items-center gap-3 pl-7">
                      <span className="text-sm text-muted-foreground">{user.jobTitle}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Availability</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                    <span>Monthly Hours</span>
                  </div>
                  {isEditing ? (
                    <Select 
                      value={editData.monthlyHoursAvailable || ""} 
                      onValueChange={(v) => setEditData({...editData, monthlyHoursAvailable: v as any})}
                    >
                      <SelectTrigger className="w-32" data-testid="select-monthly-hours">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1-2">1-2 hours</SelectItem>
                        <SelectItem value="3-4">3-4 hours</SelectItem>
                        <SelectItem value="5-6">5-6 hours</SelectItem>
                        <SelectItem value="7+">7+ hours</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <span className="font-semibold" data-testid="text-monthly-hours">
                      {profile.monthlyHoursAvailable || "-"}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between mt-4">
                  <span>Preferred Duration</span>
                  {isEditing ? (
                    <Select 
                      value={editData.preferredDuration || ""} 
                      onValueChange={(v) => setEditData({...editData, preferredDuration: v as any})}
                    >
                      <SelectTrigger className="w-32" data-testid="select-duration">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="3_months">3 Months</SelectItem>
                        <SelectItem value="6_months">6 Months</SelectItem>
                        <SelectItem value="9_months">9 Months</SelectItem>
                        <SelectItem value="12_months">12 Months</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <span className="font-semibold" data-testid="text-duration">
                      {profile.preferredDuration?.replace("_", " ") || "-"}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Mentorship History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-5 w-5 text-muted-foreground" />
                    <span>Previously Mentored</span>
                  </div>
                  {isEditing ? (
                    <Switch
                      checked={editData.previouslyBeenMentored ?? false}
                      onCheckedChange={(checked) => setEditData({...editData, previouslyBeenMentored: checked})}
                      data-testid="switch-previously-mentored"
                    />
                  ) : (
                    <Badge variant={profile.previouslyBeenMentored ? "default" : "secondary"}>
                      {profile.previouslyBeenMentored ? "Yes" : "No"}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Career Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditing ? (
                  <>
                    <div className="grid gap-2">
                      <Label>Career Stage</Label>
                      <Select 
                        value={editData.careerStage as string || ""} 
                        onValueChange={(v) => setEditData({...editData, careerStage: v as any})}
                      >
                        <SelectTrigger data-testid="select-career-stage">
                          <SelectValue placeholder="Select career stage" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="STUDENT">Student</SelectItem>
                          <SelectItem value="EARLY_CAREER">Early Career</SelectItem>
                          <SelectItem value="MID_CAREER">Mid Career</SelectItem>
                          <SelectItem value="SENIOR">Senior</SelectItem>
                          <SelectItem value="EXECUTIVE">Executive</SelectItem>
                          <SelectItem value="CAREER_TRANSITION">Career Transition</SelectItem>
                          <SelectItem value="OTHER">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label>Timezone</Label>
                      <Input
                        value={editData.timezone || ""}
                        onChange={(e) => setEditData({...editData, timezone: e.target.value})}
                        placeholder="e.g., America/New_York"
                        data-testid="input-timezone"
                      />
                    </div>
                  </>
                ) : (
                  <div className="grid gap-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-muted-foreground">Career Stage</Label>
                        <p>{careerStageLabels[profile.careerStage || ""] || profile.careerStage || "-"}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Timezone</Label>
                        <p>{profile.timezone || "-"}</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Goals & Vision
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditing ? (
                  <>
                    <div className="grid gap-2">
                      <Label>Short Term Goals</Label>
                      <Textarea
                        value={editData.shortTermGoals || ""}
                        onChange={(e) => setEditData({...editData, shortTermGoals: e.target.value})}
                        data-testid="input-short-term-goals"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Long Term Vision</Label>
                      <Textarea
                        value={editData.longTermVision || ""}
                        onChange={(e) => setEditData({...editData, longTermVision: e.target.value})}
                        data-testid="input-long-term-vision"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <Label className="text-muted-foreground">Short Term Goals</Label>
                      <p className="mt-1 whitespace-pre-wrap">{profile.shortTermGoals || "-"}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Long Term Vision</Label>
                      <p className="mt-1 whitespace-pre-wrap">{profile.longTermVision || "-"}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5" />
                  Current Project/Idea
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <Textarea
                    value={editData.currentProjectOrIdea || ""}
                    onChange={(e) => setEditData({...editData, currentProjectOrIdea: e.target.value})}
                    data-testid="input-current-project"
                  />
                ) : (
                  <p className="whitespace-pre-wrap">{profile.currentProjectOrIdea || "-"}</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Interest Areas</CardTitle>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <div className="grid gap-4">
                    {Object.entries(interestLabels).map(([key, label]) => (
                      <div key={key} className="flex items-center justify-between">
                        <Label>{label}</Label>
                        <Select
                          value={String((editData as any)[key] ?? 0)}
                          onValueChange={(v) => setEditData({...editData, [key]: parseInt(v)})}
                        >
                          <SelectTrigger className="w-48" data-testid={`select-${key}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">Not Interested</SelectItem>
                            <SelectItem value="1">Somewhat Interested</SelectItem>
                            <SelectItem value="2">Very Interested</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {getInterestBadges().length > 0 ? (
                      getInterestBadges().map(({ label, level }) => (
                        <Badge 
                          key={label} 
                          variant={level === 2 ? "default" : "secondary"}
                        >
                          {label}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-muted-foreground">No interests specified</span>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
