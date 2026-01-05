import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { AdminLayout } from "@/components/layouts/admin-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  MapPin,
  Briefcase,
  Calendar,
  Users,
  Globe,
  MessageSquare,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { MentorProfile, User } from "@shared/schema";

type MentorProfileWithUser = MentorProfile & { user: User };

const statusColors: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  INACTIVE: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
  ON_LEAVE: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  PENDING: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
};

const regionLabels: Record<string, string> = {
  NORTH_AMERICA: "North America",
  SOUTH_AMERICA: "South America",
  EUROPE: "Europe",
  ASIA: "Asia",
  AFRICA: "Africa",
  OCEANIA: "Oceania",
  OTHER: "Other",
};

const frequencyLabels: Record<string, string> = {
  WEEKLY: "Weekly",
  BIWEEKLY: "Biweekly",
  MONTHLY: "Monthly",
  FLEXIBLE: "Flexible",
};

const formatLabels: Record<string, string> = {
  VIRTUAL: "Virtual",
  IN_PERSON: "In Person",
  HYBRID: "Hybrid",
  FLEXIBLE: "Flexible",
};

export default function AdminMentorProfileDetail() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [match, params] = useRoute("/admin/mentor-profiles/:userId");
  const userId = params?.userId;
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<MentorProfile>>({});

  const { data: profile, isLoading, error } = useQuery<MentorProfileWithUser>({
    queryKey: ["/api/admin/mentor-profiles", userId],
    enabled: !!userId,
    queryFn: async () => {
      const response = await fetch(`/api/admin/mentor-profiles/${userId}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch mentor profile");
      return response.json();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<MentorProfile>) => {
      const response = await apiRequest("PATCH", `/api/admin/mentor-profiles/${userId}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/mentor-profiles", userId] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/mentor-profiles"] });
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
        preferredName: profile.preferredName || "",
        pronouns: profile.pronouns || "",
        biography: profile.biography || "",
        previouslyServedAsMentor: profile.previouslyServedAsMentor ?? false,
        mentorshipExperienceDescription: profile.mentorshipExperienceDescription || "",
        region: profile.region || null,
        languages: profile.languages || [],
        mentoringTracks: profile.mentoringTracks || [],
        expertiseDescription: profile.expertiseDescription || "",
        skillsToShare: profile.skillsToShare || "",
        mentoringGoals: profile.mentoringGoals || "",
        preferredMeetingFrequency: profile.preferredMeetingFrequency || null,
        preferredMeetingFormat: profile.preferredMeetingFormat || null,
        additionalNotes: profile.additionalNotes || "",
        maxMentees: profile.maxMentees || 2,
        cohortYear: profile.cohortYear || new Date().getFullYear(),
        status: profile.status || "ACTIVE",
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
          <Button variant="ghost" onClick={() => setLocation("/admin/mentor-profiles")} data-testid="button-back">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Mentor Profiles
          </Button>
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground">Mentor profile not found</p>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    );
  }

  const user = profile.user;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => setLocation("/admin/mentor-profiles")} data-testid="button-back">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Mentor Profiles
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
                  <h2 className="text-xl font-semibold" data-testid="text-mentor-name">
                    {profile.preferredName || `${user.firstName} ${user.lastName}`}
                  </h2>
                  {profile.pronouns && (
                    <p className="text-sm text-muted-foreground">{profile.pronouns}</p>
                  )}
                  <Badge className={`mt-2 ${statusColors[profile.status || "PENDING"]}`} data-testid="badge-status">
                    {profile.status || "PENDING"}
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
                  {profile.region && (
                    <div className="flex items-center gap-3">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{regionLabels[profile.region] || profile.region}</span>
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
                <CardTitle className="text-lg">Capacity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-muted-foreground" />
                    <span>Current Mentees</span>
                  </div>
                  <span className="font-semibold" data-testid="text-current-mentees">
                    {profile.currentMenteeCount || 0} / {isEditing ? (
                      <Input
                        type="number"
                        min="1"
                        max="10"
                        value={editData.maxMentees ?? ""}
                        onChange={(e) => setEditData({...editData, maxMentees: parseInt(e.target.value)})}
                        className="w-16 inline"
                        data-testid="input-max-mentees"
                      />
                    ) : (
                      profile.maxMentees || 2
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <span>Cohort Year</span>
                  </div>
                  {isEditing ? (
                    <Input
                      type="number"
                      value={editData.cohortYear ?? ""}
                      onChange={(e) => setEditData({...editData, cohortYear: parseInt(e.target.value)})}
                      className="w-20"
                      data-testid="input-cohort-year"
                    />
                  ) : (
                    <span className="font-semibold" data-testid="text-cohort-year">{profile.cohortYear || "-"}</span>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Status</CardTitle>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <Select value={editData.status as string} onValueChange={(v) => setEditData({...editData, status: v as any})}>
                    <SelectTrigger data-testid="select-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="INACTIVE">Inactive</SelectItem>
                      <SelectItem value="ON_LEAVE">On Leave</SelectItem>
                      <SelectItem value="PENDING">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge className={statusColors[profile.status || "PENDING"]}>
                    {profile.status || "PENDING"}
                  </Badge>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditing ? (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label>Preferred Name</Label>
                        <Input
                          value={editData.preferredName || ""}
                          onChange={(e) => setEditData({...editData, preferredName: e.target.value})}
                          data-testid="input-preferred-name"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label>Pronouns</Label>
                        <Input
                          value={editData.pronouns || ""}
                          onChange={(e) => setEditData({...editData, pronouns: e.target.value})}
                          data-testid="input-pronouns"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label>Region</Label>
                        <Select value={editData.region as string || ""} onValueChange={(v) => setEditData({...editData, region: v as any})}>
                          <SelectTrigger data-testid="select-region">
                            <SelectValue placeholder="Select region" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="NORTH_AMERICA">North America</SelectItem>
                            <SelectItem value="SOUTH_AMERICA">South America</SelectItem>
                            <SelectItem value="EUROPE">Europe</SelectItem>
                            <SelectItem value="ASIA">Asia</SelectItem>
                            <SelectItem value="AFRICA">Africa</SelectItem>
                            <SelectItem value="OCEANIA">Oceania</SelectItem>
                            <SelectItem value="OTHER">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label>Languages (comma-separated)</Label>
                        <Input
                          value={(editData.languages || []).join(", ")}
                          onChange={(e) => setEditData({...editData, languages: e.target.value.split(",").map(s => s.trim()).filter(Boolean)})}
                          data-testid="input-languages"
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="grid gap-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-muted-foreground">Preferred Name</Label>
                        <p>{profile.preferredName || "-"}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Pronouns</Label>
                        <p>{profile.pronouns || "-"}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-muted-foreground">Region</Label>
                        <p>{regionLabels[profile.region || ""] || profile.region || "-"}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Languages</Label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {(profile.languages || []).length > 0 ? (
                            profile.languages?.map((lang, i) => (
                              <Badge key={i} variant="outline">{lang}</Badge>
                            ))
                          ) : (
                            <span>-</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Mentoring Tracks</CardTitle>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <div className="grid gap-2">
                    <Label>Tracks (comma-separated)</Label>
                    <Input
                      value={(editData.mentoringTracks || []).join(", ")}
                      onChange={(e) => setEditData({...editData, mentoringTracks: e.target.value.split(",").map(s => s.trim()).filter(Boolean)})}
                      data-testid="input-tracks"
                    />
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {(profile.mentoringTracks || []).length > 0 ? (
                      profile.mentoringTracks?.map((track, i) => (
                        <Badge key={i} variant="secondary">{track}</Badge>
                      ))
                    ) : (
                      <span className="text-muted-foreground">No tracks assigned</span>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {(profile.biography || editData.biography || isEditing) && (
              <Card>
                <CardHeader>
                  <CardTitle>Biography</CardTitle>
                </CardHeader>
                <CardContent>
                  {isEditing ? (
                    <Textarea
                      value={editData.biography || ""}
                      onChange={(e) => setEditData({...editData, biography: e.target.value})}
                      placeholder="Professional biography..."
                      data-testid="input-biography"
                    />
                  ) : (
                    <p className="whitespace-pre-wrap">{profile.biography || "-"}</p>
                  )}
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Mentorship Experience</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditing ? (
                  <>
                    <div className="flex items-center gap-2">
                      <Switch
                        id="previouslyServedAsMentor"
                        checked={editData.previouslyServedAsMentor ?? false}
                        onCheckedChange={(checked) => setEditData({...editData, previouslyServedAsMentor: checked, mentorshipExperienceDescription: checked ? editData.mentorshipExperienceDescription : ""})}
                        data-testid="switch-previously-mentor"
                      />
                      <Label htmlFor="previouslyServedAsMentor">Previously served as a mentor</Label>
                    </div>
                    {editData.previouslyServedAsMentor && (
                      <div className="grid gap-2">
                        <Label>Experience Description</Label>
                        <Textarea
                          value={editData.mentorshipExperienceDescription || ""}
                          onChange={(e) => setEditData({...editData, mentorshipExperienceDescription: e.target.value})}
                          placeholder="Describe your mentorship experience..."
                          data-testid="input-mentorship-experience"
                        />
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div>
                      <Label className="text-muted-foreground">Previously Served as Mentor</Label>
                      <p className="mt-1">{profile.previouslyServedAsMentor ? "Yes" : "No"}</p>
                    </div>
                    {profile.previouslyServedAsMentor && profile.mentorshipExperienceDescription && (
                      <div>
                        <Label className="text-muted-foreground">Experience Description</Label>
                        <p className="mt-1 whitespace-pre-wrap">{profile.mentorshipExperienceDescription}</p>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Expertise & Skills</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditing ? (
                  <>
                    <div className="grid gap-2">
                      <Label>Expertise Description</Label>
                      <Textarea
                        value={editData.expertiseDescription || ""}
                        onChange={(e) => setEditData({...editData, expertiseDescription: e.target.value})}
                        data-testid="input-expertise"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Skills to Share</Label>
                      <Textarea
                        value={editData.skillsToShare || ""}
                        onChange={(e) => setEditData({...editData, skillsToShare: e.target.value})}
                        data-testid="input-skills"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <Label className="text-muted-foreground">Expertise Description</Label>
                      <p className="mt-1 whitespace-pre-wrap">{profile.expertiseDescription || "-"}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Skills to Share</Label>
                      <p className="mt-1 whitespace-pre-wrap">{profile.skillsToShare || "-"}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Mentoring Goals</CardTitle>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <Textarea
                    value={editData.mentoringGoals || ""}
                    onChange={(e) => setEditData({...editData, mentoringGoals: e.target.value})}
                    data-testid="input-goals"
                  />
                ) : (
                  <p className="whitespace-pre-wrap">{profile.mentoringGoals || "-"}</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Meeting Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditing ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Meeting Frequency</Label>
                      <Select 
                        value={editData.preferredMeetingFrequency || ""} 
                        onValueChange={(v) => setEditData({...editData, preferredMeetingFrequency: v as any})}
                      >
                        <SelectTrigger data-testid="select-frequency">
                          <SelectValue placeholder="Select frequency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="WEEKLY">Weekly</SelectItem>
                          <SelectItem value="BIWEEKLY">Biweekly</SelectItem>
                          <SelectItem value="MONTHLY">Monthly</SelectItem>
                          <SelectItem value="FLEXIBLE">Flexible</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label>Meeting Format</Label>
                      <Select 
                        value={editData.preferredMeetingFormat || ""} 
                        onValueChange={(v) => setEditData({...editData, preferredMeetingFormat: v as any})}
                      >
                        <SelectTrigger data-testid="select-format">
                          <SelectValue placeholder="Select format" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="VIRTUAL">Virtual</SelectItem>
                          <SelectItem value="IN_PERSON">In Person</SelectItem>
                          <SelectItem value="HYBRID">Hybrid</SelectItem>
                          <SelectItem value="FLEXIBLE">Flexible</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground">Preferred Frequency</Label>
                      <p className="flex items-center gap-2 mt-1">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {frequencyLabels[profile.preferredMeetingFrequency || ""] || profile.preferredMeetingFrequency || "-"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Preferred Format</Label>
                      <p className="flex items-center gap-2 mt-1">
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                        {formatLabels[profile.preferredMeetingFormat || ""] || profile.preferredMeetingFormat || "-"}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Additional Notes</CardTitle>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <Textarea
                    value={editData.additionalNotes || ""}
                    onChange={(e) => setEditData({...editData, additionalNotes: e.target.value})}
                    data-testid="input-notes"
                  />
                ) : (
                  <p className="whitespace-pre-wrap">{profile.additionalNotes || "-"}</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
