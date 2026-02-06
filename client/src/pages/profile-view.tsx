import { useQuery } from "@tanstack/react-query";
import { Link, useRoute } from "wouter";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  User,
  Mail,
  Building,
  Briefcase,
  Phone,
  Globe,
  Clock,
  Award,
  BookOpen,
  Target,
  Languages,
  Pencil,
  GraduationCap,
  Calendar,
  MapPin,
  Linkedin,
  Star,
} from "lucide-react";
import type { User as UserType } from "@shared/schema";

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

export default function ProfileViewPage() {
  const { user } = useAuth();
  const [, routeParams] = useRoute("/profile/:userId");
  const targetUserId = routeParams?.userId;
  const isOwnProfile = !targetUserId || targetUserId === user?.id;

  const { data: profileData, isLoading, error } = useQuery<UserType>({
    queryKey: isOwnProfile ? ["/api/profile"] : ["/api/profile", targetUserId],
    enabled: !!user,
    retry: false,
  });

  if (!user) return null;

  if (error) {
    const is403 = error.message?.includes("403");
    return (
      <DashboardLayout>
        <div className="container max-w-4xl py-6">
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
        <div className="container max-w-4xl py-6 space-y-6">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  const initials = `${profile.firstName?.charAt(0) || ""}${profile.lastName?.charAt(0) || ""}`.toUpperCase();
  const mentorshipRoleDisplay = formatMentorshipRole(profile.mentorshipRoleChoice);

  return (
    <DashboardLayout>
      <div className="container max-w-4xl py-6 space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-start gap-6">
              <Avatar className="h-24 w-24 border-2 border-border">
                <AvatarImage src={profile.profileImage || undefined} alt={`${profile.firstName} ${profile.lastName}`} />
                <AvatarFallback className="text-2xl font-semibold bg-muted text-muted-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-2xl font-bold" data-testid="text-profile-name">
                    {profile.firstName} {profile.lastName}
                  </h1>
                  <Badge variant={getRoleBadgeVariant(profile.role)} data-testid="badge-role">
                    {formatRole(profile.role)}
                  </Badge>
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
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <InfoRow icon={Mail} label="Email" value={profile.email} href={`mailto:${profile.email}`} />
              <InfoRow icon={Phone} label="Phone" value={profile.phone} />
              <InfoRow icon={Linkedin} label="LinkedIn" value={profile.linkedInUrl ? "View Profile" : null} href={profile.linkedInUrl || undefined} />
              <InfoRow icon={MapPin} label="Timezone" value={formatTimezone(profile.timezone)} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                Professional Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <InfoRow icon={Building} label="Organization" value={profile.organizationName} />
              <InfoRow icon={Briefcase} label="Position" value={profile.jobTitle} />
              <InfoRow icon={Clock} label="Years of Experience" value={profile.yearsOfExperience ? `${profile.yearsOfExperience} years` : null} />
              <InfoRow icon={GraduationCap} label="Education" value={profile.educationLevel} />
              <InfoRow icon={Award} label="Certifications" value={profile.certificationsTraining} />
            </CardContent>
          </Card>
        </div>

        {((profile.fieldsOfExpertise && profile.fieldsOfExpertise.length > 0) || 
          (profile.languagesSpoken && profile.languagesSpoken.length > 0)) && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="h-4 w-4" />
                Expertise & Languages
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {profile.fieldsOfExpertise && profile.fieldsOfExpertise.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Fields of Expertise</p>
                    <div className="flex flex-wrap gap-2">
                      {profile.fieldsOfExpertise.map((field) => (
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
                      {profile.languagesSpoken.map((lang) => (
                        <Badge key={lang} variant="outline" data-testid={`badge-language-${lang}`}>
                          <Languages className="h-3 w-3 mr-1" />
                          {lang}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
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
