import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useRoute } from "wouter";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  User,
  Mail,
  Building,
  Briefcase,
  Phone,
  Globe,
  Clock,
  Award,
  Target,
  Languages,
  Pencil,
  GraduationCap,
  Calendar,
  MapPin,
  Linkedin,
  Star,
  Camera,
  Loader2,
  Heart,
  BookOpen,
  MessageSquare,
  Users,
  CheckCircle,
  Lightbulb,
  Shield,
} from "lucide-react";

function formatRole(role: string) {
  switch (role) {
    case "SUPER_ADMIN": return "Super Admin";
    case "ADMIN": return "Admin";
    case "MENTOR": return "Mentor";
    case "MENTEE": return "Mentee";
    default: return role;
  }
}

function getRoleBadgeVariant(role: string) {
  switch (role) {
    case "SUPER_ADMIN": return "destructive" as const;
    case "ADMIN": return "default" as const;
    case "MENTOR": return "secondary" as const;
    case "MENTEE": return "outline" as const;
    default: return "outline" as const;
  }
}

function formatTimezone(tz: string | null | undefined) {
  if (!tz) return null;
  return tz.replace(/_/g, " ").replace(/\//g, " / ");
}

function formatMentorshipRole(choice: string | null | undefined) {
  switch (choice) {
    case "seeking_mentor": return "Seeking a Mentor";
    case "providing_mentorship": return "Providing Mentorship";
    case "both": return "Seeking & Providing Mentorship";
    default: return null;
  }
}

function formatCareerStage(stage: string | null | undefined) {
  if (!stage) return null;
  return stage.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

function formatDuration(duration: string | null | undefined) {
  switch (duration) {
    case "3_months": return "3 Months";
    case "6_months": return "6 Months";
    case "1_year": return "1 Year";
    case "1_year_plus": return "More than 1 Year";
    case "reevaluate": return "Re-evaluate";
    case "ongoing": return "Ongoing";
    default: return duration || null;
  }
}

function formatMeetingFormat(format: string | null | undefined) {
  switch (format) {
    case "VIRTUAL": return "Virtual";
    case "IN_PERSON": return "In-Person";
    case "HYBRID": return "Hybrid";
    case "FLEXIBLE": return "Flexible";
    default: return format || null;
  }
}

function SectionCompleteness({ section, filled, total }: { section: string; filled: number; total: number }) {
  const isComplete = filled === total && total > 0;
  return (
    <Badge
      variant={isComplete ? "default" : "secondary"}
      className="text-xs shrink-0"
      data-testid={`badge-completeness-${section}`}
    >
      <CheckCircle className={`h-3 w-3 mr-1 ${isComplete ? "" : "opacity-50"}`} />
      {filled}/{total}
    </Badge>
  );
}

function countFilled(...values: (string | number | boolean | string[] | null | undefined)[]): { filled: number; total: number } {
  let filled = 0;
  const total = values.length;
  for (const v of values) {
    if (v === null || v === undefined || v === "" || v === false) continue;
    if (Array.isArray(v) && v.length === 0) continue;
    if (typeof v === "number" && v === 0) continue;
    filled++;
  }
  return { filled, total };
}

function InfoRow({ icon: Icon, label, value, href }: { icon: any; label: string; value: string | null | undefined; href?: string }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-2">
      <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center shrink-0 mt-0.5">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        {href ? (
          <a href={href} target="_blank" rel="noopener noreferrer" className="text-sm font-medium underline hover:opacity-80 break-all" data-testid={`link-${label.toLowerCase().replace(/\s/g, '-')}`}>
            {value}
          </a>
        ) : (
          <p className="text-sm font-medium break-words" data-testid={`text-${label.toLowerCase().replace(/\s/g, '-')}`}>{value}</p>
        )}
      </div>
    </div>
  );
}

function TextBlock({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground font-medium">{label}</p>
      <p className="text-sm leading-relaxed">{value}</p>
    </div>
  );
}

export default function ProfileViewPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, routeParams] = useRoute("/profile/:userId");
  const targetUserId = routeParams?.userId;
  const isOwnProfile = !targetUserId || targetUserId === user?.id;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const { data: profileData, isLoading, error } = useQuery<any>({
    queryKey: isOwnProfile ? ["/api/profile"] : ["/api/profile", targetUserId],
    enabled: !!user,
    retry: false,
  });

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!validTypes.includes(file.type)) {
      toast({ title: "Invalid file type", description: "Please upload a JPEG, PNG, GIF, or WebP image.", variant: "destructive" });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Please upload an image smaller than 5MB.", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const urlResponse = await apiRequest("POST", "/api/uploads/request-url", {
        name: file.name,
        size: file.size,
        contentType: file.type,
      });
      const { uploadURL, objectPath } = await urlResponse.json();

      const uploadRes = await fetch(uploadURL, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });
      if (!uploadRes.ok) {
        throw new Error("Failed to upload image to storage");
      }

      await apiRequest("PATCH", "/api/profile", { profileImage: objectPath });

      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({ title: "Photo updated", description: "Your profile photo has been updated successfully." });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message || "Could not upload photo. Please try again.", variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  if (!user) return null;

  if (error) {
    const is403 = error.message?.includes("403");
    return (
      <DashboardLayout>
        <div className="container max-w-4xl p-6">
          <Card>
            <CardContent className="pt-6 text-center space-y-4">
              <p className="text-muted-foreground">
                {is403
                  ? "You don't have permission to view this profile. You can only view profiles of your connected mentors or mentees."
                  : "This profile could not be found."}
              </p>
              <Link href="/">
                <Button variant="outline" size="sm">Return to Dashboard</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const profile = profileData || (isOwnProfile ? user : null);

  if (isLoading || !profile) {
    return (
      <DashboardLayout>
        <div className="container max-w-4xl p-6 space-y-6">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  const initials = `${profile.firstName?.charAt(0) || ""}${profile.lastName?.charAt(0) || ""}`.toUpperCase();
  const mentorshipRoleDisplay = formatMentorshipRole(profile.mentorshipRoleChoice);
  const menteeProfile = profile.menteeProfile;
  const mentorProfile = profile.mentorProfileExtended;
  const isMentor = profile.role === "MENTOR" || profile.role === "SUPER_ADMIN" || profile.role === "ADMIN";
  const isMentee = profile.role === "MENTEE";
  const photoUrl = profile.profileImage
    ? `/api/profile-photo/${profile.id}`
    : undefined;

  return (
    <DashboardLayout>
      <div className="container max-w-4xl p-6 space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-start gap-6">
              <div className="relative group">
                <Avatar className="h-24 w-24 border-2 border-border">
                  <AvatarImage src={photoUrl} alt={`${profile.firstName} ${profile.lastName}`} />
                  <AvatarFallback className="text-2xl font-semibold bg-muted text-muted-foreground">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                {isOwnProfile && (
                  <>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      data-testid="button-upload-photo"
                    >
                      {uploading ? (
                        <Loader2 className="h-6 w-6 text-white animate-spin" />
                      ) : (
                        <Camera className="h-6 w-6 text-white" />
                      )}
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      className="hidden"
                      onChange={handlePhotoUpload}
                      data-testid="input-photo-upload"
                    />
                  </>
                )}
              </div>

              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-2xl font-bold" data-testid="text-profile-name">
                    {profile.firstName} {profile.lastName}
                  </h1>
                  <Badge variant={getRoleBadgeVariant(profile.role)} data-testid="badge-role">
                    {formatRole(profile.role)}
                  </Badge>
                  {profile.isSonsielMember && (
                    <Badge variant="secondary" data-testid="badge-sonsiel-member">
                      <Shield className="h-3 w-3 mr-1" />
                      SONSIEL Member
                    </Badge>
                  )}
                </div>

                {profile.jobTitle && (
                  <p className="text-base text-muted-foreground" data-testid="text-job-title">
                    {profile.jobTitle}
                    {profile.organizationName && ` at ${profile.organizationName}`}
                  </p>
                )}

                {profile.bio && (
                  <p className="text-sm text-muted-foreground leading-relaxed mt-2" data-testid="text-bio">
                    {profile.bio}
                  </p>
                )}

                {mentorshipRoleDisplay && (
                  <div className="pt-1">
                    <Badge variant="outline" className="text-xs" data-testid="badge-mentorship-role">
                      <Star className="h-3 w-3 mr-1" />
                      {mentorshipRoleDisplay}
                    </Badge>
                  </div>
                )}
              </div>

              {isOwnProfile && (
                <Link href="/my-profile">
                  <Button variant="outline" size="sm" data-testid="button-edit-profile">
                    <Pencil className="h-4 w-4 mr-1" />
                    Edit Profile
                  </Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4" />
                Contact Information
              </CardTitle>
              <SectionCompleteness section="contact" {...countFilled(profile.email, profile.phone, profile.linkedInUrl, profile.timezone)} />
            </CardHeader>
            <CardContent className="space-y-1">
              <InfoRow icon={Mail} label="Email" value={profile.email} href={`mailto:${profile.email}`} />
              <InfoRow icon={Phone} label="Phone" value={profile.phone} />
              <InfoRow icon={Linkedin} label="LinkedIn" value={profile.linkedInUrl ? "View Profile" : null} href={profile.linkedInUrl || undefined} />
              <InfoRow icon={MapPin} label="Timezone" value={formatTimezone(profile.timezone)} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                Professional Details
              </CardTitle>
              <SectionCompleteness section="professional" {...countFilled(profile.organizationName, profile.jobTitle, profile.yearsOfExperience, profile.yearsInSielAreas, profile.educationLevel, profile.certificationsTraining)} />
            </CardHeader>
            <CardContent className="space-y-1">
              <InfoRow icon={Building} label="Organization" value={profile.organizationName} />
              <InfoRow icon={Briefcase} label="Position" value={profile.jobTitle} />
              <InfoRow icon={Clock} label="Years of Experience" value={profile.yearsOfExperience ? `${profile.yearsOfExperience} years` : null} />
              <InfoRow icon={Clock} label="Years in SIEL Areas" value={profile.yearsInSielAreas ? `${profile.yearsInSielAreas} years` : null} />
              <InfoRow icon={GraduationCap} label="Education" value={profile.educationLevel} />
              <InfoRow icon={Award} label="Certifications" value={profile.certificationsTraining} />
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="h-4 w-4" />
              Expertise & Languages
            </CardTitle>
            <SectionCompleteness section="expertise" {...countFilled(profile.fieldsOfExpertise, profile.languagesSpoken)} />
          </CardHeader>
          <CardContent>
            {(!profile.fieldsOfExpertise || profile.fieldsOfExpertise.length === 0) &&
             (!profile.languagesSpoken || profile.languagesSpoken.length === 0) ? (
              <p className="text-sm text-muted-foreground text-center py-4">No expertise or languages added yet</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {profile.fieldsOfExpertise && profile.fieldsOfExpertise.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Fields of Expertise</p>
                    <div className="flex flex-wrap gap-2">
                      {profile.fieldsOfExpertise.map((field: string) => (
                        <Badge key={field} variant="secondary" data-testid={`badge-expertise-${field}`}>
                          {field}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {profile.languagesSpoken && profile.languagesSpoken.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Languages Spoken</p>
                    <div className="flex flex-wrap gap-2">
                      {profile.languagesSpoken.map((lang: string) => (
                        <Badge key={lang} variant="outline" data-testid={`badge-language-${lang}`}>
                          <Languages className="h-3 w-3 mr-1" />
                          {lang}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {menteeProfile && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <GraduationCap className="h-4 w-4" />
                Mentee Profile
              </CardTitle>
              <SectionCompleteness section="mentee" {...countFilled(
                menteeProfile.careerStage,
                menteeProfile.preferredDuration,
                menteeProfile.monthlyHoursAvailable,
                menteeProfile.shortTermGoals,
                menteeProfile.longTermVision,
                menteeProfile.specificSkillsSeeking,
                menteeProfile.primaryMotivations,
                menteeProfile.hopingToGain,
                menteeProfile.preferredMethods,
              )} />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoRow icon={Target} label="Career Stage" value={formatCareerStage(menteeProfile.careerStage)} />
                <InfoRow icon={Clock} label="Preferred Duration" value={formatDuration(menteeProfile.preferredDuration)} />
                <InfoRow icon={Clock} label="Monthly Availability" value={menteeProfile.monthlyHoursAvailable ? `${menteeProfile.monthlyHoursAvailable} hours` : null} />
                <InfoRow icon={CheckCircle} label="Previously Mentored" value={menteeProfile.previouslyBeenMentored ? "Yes" : menteeProfile.previouslyBeenMentored === false ? "No" : null} />
              </div>

              {menteeProfile.previouslyBeenMentored && menteeProfile.mentorshipExperienceDescription && (
                <TextBlock label="Previous Mentorship Experience" value={menteeProfile.mentorshipExperienceDescription} />
              )}

              <TextBlock label="Short-Term Goals" value={menteeProfile.shortTermGoals} />
              <TextBlock label="Long-Term Vision" value={menteeProfile.longTermVision} />
              <TextBlock label="Current Project or Idea" value={menteeProfile.currentProjectOrIdea} />
              <TextBlock label="Primary Motivations" value={menteeProfile.primaryMotivations} />
              <TextBlock label="Specific Skills Seeking" value={menteeProfile.specificSkillsSeeking} />
              <TextBlock label="Preferred Mentor Characteristics" value={menteeProfile.preferredMentorCharacteristics} />
              <TextBlock label="Past Successes" value={menteeProfile.pastSuccesses} />
              <TextBlock label="Past Challenges" value={menteeProfile.pastChallenges} />
              <TextBlock label="Effective Structures" value={menteeProfile.effectiveStructures} />
              <TextBlock label="Resources Needed" value={menteeProfile.resourcesNeeded} />
              <TextBlock label="Program Suggestions" value={menteeProfile.programSuggestions} />
              <TextBlock label="Availability Notes" value={menteeProfile.availabilityNotes} />

              {menteeProfile.hopingToGain && menteeProfile.hopingToGain.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground font-medium">Hoping to Gain</p>
                  <div className="flex flex-wrap gap-2">
                    {menteeProfile.hopingToGain.map((item: string) => (
                      <Badge key={item} variant="outline">{item}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {menteeProfile.preferredMethods && menteeProfile.preferredMethods.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground font-medium">Preferred Methods</p>
                  <div className="flex flex-wrap gap-2">
                    {menteeProfile.preferredMethods.map((method: string) => (
                      <Badge key={method} variant="secondary">{method}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {menteeProfile.preferredCommunicationTools && menteeProfile.preferredCommunicationTools.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground font-medium">Communication Tools</p>
                  <div className="flex flex-wrap gap-2">
                    {menteeProfile.preferredCommunicationTools.map((tool: string) => (
                      <Badge key={tool} variant="outline">{tool}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {mentorProfile && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Heart className="h-4 w-4" />
                Mentor Profile
              </CardTitle>
              <SectionCompleteness section="mentor" {...countFilled(
                mentorProfile.maxMentees,
                mentorProfile.preferredDuration,
                mentorProfile.monthlyHoursAvailable,
                mentorProfile.skillsToShare,
                mentorProfile.primaryMotivations,
                mentorProfile.mentoringTracks,
                mentorProfile.preferredMethods,
                mentorProfile.notableAchievements,
                mentorProfile.programExpectations,
              )} />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoRow icon={Users} label="Max Mentees" value={mentorProfile.maxMentees ? `${mentorProfile.maxMentees}` : null} />
                <InfoRow icon={Clock} label="Preferred Duration" value={formatDuration(mentorProfile.preferredDuration)} />
                <InfoRow icon={Clock} label="Monthly Availability" value={mentorProfile.monthlyHoursAvailable ? `${mentorProfile.monthlyHoursAvailable} hours` : null} />
                <InfoRow icon={CheckCircle} label="Previously Served as Mentor" value={mentorProfile.previouslyServedAsMentor ? "Yes" : mentorProfile.previouslyServedAsMentor === false ? "No" : null} />
                <InfoRow icon={Globe} label="Open to Mentoring Outside Expertise" value={mentorProfile.openToMentoringOutsideExpertise ? "Yes" : mentorProfile.openToMentoringOutsideExpertise === false ? "No" : null} />
              </div>

              {mentorProfile.previouslyServedAsMentor && mentorProfile.mentorshipExperienceDescription && (
                <TextBlock label="Mentorship Experience" value={mentorProfile.mentorshipExperienceDescription} />
              )}

              <TextBlock label="Skills to Share" value={mentorProfile.skillsToShare} />
              <TextBlock label="Primary Motivations" value={mentorProfile.primaryMotivations} />
              <TextBlock label="Notable Achievements" value={mentorProfile.notableAchievements} />
              <TextBlock label="Certifications & Training" value={mentorProfile.certificationsTraining} />
              <TextBlock label="Past Successes" value={mentorProfile.pastSuccesses} />
              <TextBlock label="Past Challenges" value={mentorProfile.pastChallenges} />
              <TextBlock label="Availability Notes" value={mentorProfile.availabilityNotes} />
              <TextBlock label="Program Expectations" value={mentorProfile.programExpectations} />
              <TextBlock label="Program Suggestions" value={mentorProfile.programSuggestions} />
              <TextBlock label="Resources Needed" value={mentorProfile.resourcesNeeded} />

              {mentorProfile.mentoringTracks && mentorProfile.mentoringTracks.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground font-medium">Mentoring Tracks</p>
                  <div className="flex flex-wrap gap-2">
                    {mentorProfile.mentoringTracks.map((track: string) => (
                      <Badge key={track} variant="secondary">{track}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {mentorProfile.preferredMethods && mentorProfile.preferredMethods.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground font-medium">Preferred Methods</p>
                  <div className="flex flex-wrap gap-2">
                    {mentorProfile.preferredMethods.map((method: string) => (
                      <Badge key={method} variant="secondary">{method}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {mentorProfile.preferredMenteeStages && mentorProfile.preferredMenteeStages.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground font-medium">Preferred Mentee Stages</p>
                  <div className="flex flex-wrap gap-2">
                    {mentorProfile.preferredMenteeStages.map((stage: string) => (
                      <Badge key={stage} variant="outline">{formatCareerStage(stage)}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {mentorProfile.industriesExperience && mentorProfile.industriesExperience.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground font-medium">Industry Experience</p>
                  <div className="flex flex-wrap gap-2">
                    {mentorProfile.industriesExperience.map((industry: string) => (
                      <Badge key={industry} variant="outline">{industry}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {mentorProfile.preferredCommunicationTools && mentorProfile.preferredCommunicationTools.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground font-medium">Communication Tools</p>
                  <div className="flex flex-wrap gap-2">
                    {mentorProfile.preferredCommunicationTools.map((tool: string) => (
                      <Badge key={tool} variant="outline">{tool}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Account Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <InfoRow icon={Calendar} label="Member Since" value={profile.createdAt ? new Date(profile.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : null} />
            <InfoRow icon={Globe} label="Preferred Language" value={
              profile.preferredLanguage === "en" ? "English" :
              profile.preferredLanguage === "es" ? "Spanish" :
              profile.preferredLanguage === "pt" ? "Portuguese" :
              profile.preferredLanguage || null
            } />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
