import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { AdminLayout } from "@/components/layouts/admin-layout";
import { DataTable, Column } from "@/components/ui/data-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { MoreHorizontal, Eye, Download, Upload, Plus, Search, Users, UserCheck, RefreshCw, X, GraduationCap, KeyRound, Mail, UserX } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

export default function AdminMenteeProfiles() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [careerStageFilter, setCareerStageFilter] = useState<string>("all");
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [csvData, setCsvData] = useState("");
  const [importResults, setImportResults] = useState<{
    successful: any[];
    failed: Array<{ row: number; email: string; error: string }>;
  } | null>(null);
  const [selectedProfileIds, setSelectedProfileIds] = useState<string[]>([]);
  const [showPasswordResetDialog, setShowPasswordResetDialog] = useState(false);
  const [passwordResetResults, setPasswordResetResults] = useState<any | null>(null);
  const [showCreateUserDialog, setShowCreateUserDialog] = useState(false);
  const [newUser, setNewUser] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    organizationName: "",
    jobTitle: "",
  });

  const [newProfile, setNewProfile] = useState({
    userId: "",
    biography: "",
    careerStage: "",
    shortTermGoals: "",
    longTermVision: "",
    currentProjectOrIdea: "",
    previouslyBeenMentored: false,
    mentorshipExperienceDescription: "",
    timezone: "",
    monthlyHoursAvailable: "",
    preferredDuration: "",
  });

  const buildQueryParams = () => {
    const params = new URLSearchParams();
    if (searchQuery) params.set("search", searchQuery);
    if (careerStageFilter !== "all") params.set("careerStage", careerStageFilter);
    return params.toString();
  };

  const { data: profiles = [], isLoading, refetch } = useQuery<MenteeProfileWithUser[]>({
    queryKey: ["/api/admin/mentee-profiles", { search: searchQuery, careerStage: careerStageFilter }],
    queryFn: async () => {
      const queryString = buildQueryParams();
      const response = await fetch(`/api/admin/mentee-profiles?${queryString}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch mentee profiles");
      return response.json();
    },
  });

  const { data: mentees = [], refetch: refetchMentees } = useQuery<(User & { password?: string })[]>({
    queryKey: ["/api/users", "role=MENTEE"],
    queryFn: async () => {
      const response = await fetch("/api/users?role=MENTEE", { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch mentees");
      return response.json();
    },
  });

  const createUserMutation = useMutation({
    mutationFn: async (data: typeof newUser) => {
      try {
        const response = await apiRequest("POST", "/api/admin/users", { ...data, role: "MENTEE" });
        return await response.json();
      } catch (error: any) {
        throw new Error(error.message || "Failed to create mentee");
      }
    },
    onSuccess: (user) => {
      if (user && user.id) {
        refetchMentees();
        setShowCreateUserDialog(false);
        setNewUser({ email: "", password: "", firstName: "", lastName: "", organizationName: "", jobTitle: "" });
        setNewProfile({ ...newProfile, userId: user.id });
        setShowCreateDialog(true);
        toast({ title: "Mentee user created! Now add their profile details." });
      }
    },
    onError: (error: Error) => {
      toast({ title: "Failed to create mentee", description: error.message, variant: "destructive" });
    },
  });

  const bulkPasswordResetMutation = useMutation({
    mutationFn: async ({ userIds, setPassword }: { userIds: string[]; setPassword: boolean }) => {
      try {
        const response = await apiRequest("POST", "/api/admin/users/bulk-password-reset", { userIds, setPassword });
        return await response.json();
      } catch (error: any) {
        throw new Error(error.message || "Password reset failed");
      }
    },
    onSuccess: (data) => {
      if (data && data.successful) {
        setPasswordResetResults(data);
        toast({ title: `Password reset for ${data.successful.length} mentees` });
      }
    },
    onError: (error: Error) => {
      toast({ title: "Password reset failed", description: error.message, variant: "destructive" });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ userId, activate }: { userId: string; activate: boolean }) => {
      try {
        await apiRequest("PATCH", `/api/users/${userId}/${activate ? 'activate' : 'deactivate'}`);
        return { success: true };
      } catch (error: any) {
        throw new Error(error.message || "Failed to update status");
      }
    },
    onSuccess: () => {
      refetch();
      refetchMentees();
      toast({ title: "Mentee status updated" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update status", description: error.message, variant: "destructive" });
    },
  });

  const createProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/admin/mentee-profiles", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/mentee-profiles"] });
      setShowCreateDialog(false);
      resetNewProfile();
      toast({ title: "Mentee profile created successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to create profile", description: error.message, variant: "destructive" });
    },
  });

  const importMutation = useMutation({
    mutationFn: async (profilesData: any[]) => {
      const response = await apiRequest("POST", "/api/admin/mentee-profiles/bulk-import", { profiles: profilesData });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/mentee-profiles"] });
      setImportResults(data);
      toast({
        title: "Import completed",
        description: `${data.successful.length} profiles imported, ${data.failed.length} failed`,
      });
    },
    onError: (error: Error) => {
      toast({ title: "Import failed", description: error.message, variant: "destructive" });
    },
  });

  const resetNewProfile = () => {
    setNewProfile({
      userId: "",
      biography: "",
      careerStage: "",
      shortTermGoals: "",
      longTermVision: "",
      currentProjectOrIdea: "",
      previouslyBeenMentored: false,
      mentorshipExperienceDescription: "",
      timezone: "",
      monthlyHoursAvailable: "",
      preferredDuration: "",
    });
  };

  const handleCreateProfile = () => {
    if (!newProfile.userId) {
      toast({ title: "Please select a mentee", variant: "destructive" });
      return;
    }

    const profileData = {
      userId: newProfile.userId,
      biography: newProfile.biography || null,
      careerStage: newProfile.careerStage || null,
      shortTermGoals: newProfile.shortTermGoals || null,
      longTermVision: newProfile.longTermVision || null,
      currentProjectOrIdea: newProfile.currentProjectOrIdea || null,
      previouslyBeenMentored: newProfile.previouslyBeenMentored,
      mentorshipExperienceDescription: newProfile.previouslyBeenMentored ? (newProfile.mentorshipExperienceDescription || null) : null,
      timezone: newProfile.timezone || null,
      monthlyHoursAvailable: newProfile.monthlyHoursAvailable || null,
      preferredDuration: newProfile.preferredDuration || null,
    };

    createProfileMutation.mutate(profileData);
  };

  const handleImport = () => {
    try {
      const lines = csvData.trim().split("\n");
      if (lines.length < 2) {
        toast({ title: "CSV must have at least a header row and one data row", variant: "destructive" });
        return;
      }

      const headers = lines[0].split(",").map(h => h.trim().toLowerCase().replace(/\s+/g, "_"));
      const profilesData = lines.slice(1).map(line => {
        const values = line.split(",").map(v => v.trim().replace(/^"|"$/g, ""));
        const obj: Record<string, string> = {};
        headers.forEach((header, i) => {
          obj[header] = values[i] || "";
        });
        return obj;
      });

      importMutation.mutate(profilesData);
    } catch (error) {
      toast({ title: "Failed to parse CSV", variant: "destructive" });
    }
  };

  const handleExport = async () => {
    try {
      const queryString = buildQueryParams();
      const response = await fetch(`/api/admin/mentee-profiles/export?${queryString}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Export failed");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "mentee-profiles-export.csv";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({ title: "Export completed" });
    } catch (error) {
      toast({ title: "Export failed", variant: "destructive" });
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await fetch("/api/admin/mentee-profiles/bulk-import/template", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to download template");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "mentee-profile-import-template.csv";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      toast({ title: "Failed to download template", variant: "destructive" });
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setCareerStageFilter("all");
  };

  const hasActiveFilters = searchQuery || careerStageFilter !== "all";

  const menteesWithoutProfiles = mentees.filter(
    m => !profiles.some(p => p.userId === m.id)
  );

  const selectedUserIds = profiles
    .filter(p => selectedProfileIds.includes(p.id))
    .map(p => p.userId);

  const getTopInterests = (profile: MenteeProfileWithUser): string[] => {
    const interests = Object.entries(interestLabels)
      .filter(([key]) => (profile as any)[key] >= 2)
      .map(([, label]) => label);
    return interests.slice(0, 3);
  };

  const columns: Column<MenteeProfileWithUser>[] = [
    {
      key: "select",
      header: "",
      className: "w-12",
      render: (profile) => (
        <Checkbox 
          checked={selectedProfileIds.includes(profile.id)}
          onCheckedChange={(checked) => {
            if (checked) {
              setSelectedProfileIds([...selectedProfileIds, profile.id]);
            } else {
              setSelectedProfileIds(selectedProfileIds.filter(id => id !== profile.id));
            }
          }}
          onClick={(e) => e.stopPropagation()}
          data-testid={`checkbox-select-${profile.id}`}
        />
      ),
    },
    {
      key: "mentee",
      header: "Mentee",
      render: (profile) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarImage src={profile.user.profileImage || undefined} />
            <AvatarFallback>
              {(profile.user.firstName?.[0] || "") + (profile.user.lastName?.[0] || "")}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">
              {`${profile.user.firstName} ${profile.user.lastName}`}
            </div>
            <div className="text-sm text-muted-foreground">{profile.user.email}</div>
          </div>
        </div>
      ),
    },
    {
      key: "careerStage",
      header: "Career Stage",
      render: (profile) => (
        <span className="text-sm">{careerStageLabels[profile.careerStage || ""] || profile.careerStage || "-"}</span>
      ),
    },
    {
      key: "interests",
      header: "Interest Areas",
      render: (profile) => {
        const interests = getTopInterests(profile);
        return (
          <div className="flex flex-wrap gap-1">
            {interests.length > 0 ? (
              interests.map((interest, i) => (
                <Badge key={i} variant="outline" className="text-xs">
                  {interest}
                </Badge>
              ))
            ) : (
              <span className="text-muted-foreground text-sm">-</span>
            )}
          </div>
        );
      },
    },
    {
      key: "timezone",
      header: "Timezone",
      render: (profile) => (
        <span className="text-sm">{profile.timezone || "-"}</span>
      ),
    },
    {
      key: "createdAt",
      header: "Created",
      render: (profile) => (
        <span className="text-sm">{profile.createdAt ? new Date(profile.createdAt).toLocaleDateString() : "-"}</span>
      ),
    },
    {
      key: "actions",
      header: "",
      render: (profile) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" data-testid={`button-actions-${profile.id}`}>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setLocation(`/admin/mentee-profiles/${profile.userId}`)}>
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => toggleActiveMutation.mutate({ userId: profile.userId, activate: !profile.user.isActive })}
            >
              {profile.user.isActive ? (
                <>
                  <UserX className="mr-2 h-4 w-4" />
                  Deactivate
                </>
              ) : (
                <>
                  <UserCheck className="mr-2 h-4 w-4" />
                  Activate
                </>
              )}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const totalCount = profiles.length;
  const matchedCount = profiles.filter(p => p.previouslyBeenMentored).length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight" data-testid="text-page-title">Mentee Profiles</h1>
            <p className="text-muted-foreground">Manage mentee profiles, goals, and interests</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedProfileIds.length > 0 && (
              <Button variant="outline" onClick={() => setShowPasswordResetDialog(true)} data-testid="button-bulk-password-reset">
                <KeyRound className="h-4 w-4 mr-2" />
                Reset Passwords ({selectedProfileIds.length})
              </Button>
            )}
            <Button variant="outline" onClick={() => setShowImportDialog(true)} data-testid="button-import">
              <Upload className="mr-2 h-4 w-4" />
              Import
            </Button>
            <Button variant="outline" onClick={handleExport} data-testid="button-export">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button variant="outline" onClick={() => setShowCreateUserDialog(true)} data-testid="button-create-mentee">
              <Plus className="mr-2 h-4 w-4" />
              New Mentee
            </Button>
            <Button onClick={() => setShowCreateDialog(true)} data-testid="button-create-profile">
              <Plus className="mr-2 h-4 w-4" />
              Add Profile
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Mentees</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-total-count">{totalCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Profiles</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-active-count">{totalCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Previously Mentored</CardTitle>
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-matched-count">{matchedCount}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Filter Profiles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, email, or goals..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                    data-testid="input-search"
                  />
                </div>
              </div>
              <Select value={careerStageFilter} onValueChange={setCareerStageFilter}>
                <SelectTrigger className="w-[180px]" data-testid="select-career-stage">
                  <SelectValue placeholder="Career Stage" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Stages</SelectItem>
                  <SelectItem value="STUDENT">Student</SelectItem>
                  <SelectItem value="EARLY_CAREER">Early Career</SelectItem>
                  <SelectItem value="MID_CAREER">Mid Career</SelectItem>
                  <SelectItem value="SENIOR">Senior</SelectItem>
                  <SelectItem value="EXECUTIVE">Executive</SelectItem>
                  <SelectItem value="CAREER_TRANSITION">Career Transition</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
              {hasActiveFilters && (
                <Button variant="ghost" size="icon" onClick={clearFilters} data-testid="button-clear-filters">
                  <X className="h-4 w-4" />
                </Button>
              )}
              <Button variant="outline" size="icon" onClick={() => refetch()} data-testid="button-refresh">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <DataTable
              columns={columns}
              data={profiles}
              isLoading={isLoading}
              emptyMessage="No mentee profiles found"
            />
          </CardContent>
        </Card>
      </div>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Mentee Profile</DialogTitle>
            <DialogDescription>Add a new mentee profile for an existing mentee user</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="userId">Select Mentee *</Label>
              <Select value={newProfile.userId} onValueChange={(v) => setNewProfile({...newProfile, userId: v})}>
                <SelectTrigger data-testid="select-mentee">
                  <SelectValue placeholder="Select a mentee" />
                </SelectTrigger>
                <SelectContent>
                  {menteesWithoutProfiles.map((mentee) => (
                    <SelectItem key={mentee.id} value={mentee.id}>
                      {mentee.firstName} {mentee.lastName} ({mentee.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {menteesWithoutProfiles.length === 0 && (
                <p className="text-sm text-muted-foreground">All mentees already have profiles</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="biography">Biography (Optional)</Label>
              <Textarea
                id="biography"
                value={newProfile.biography}
                onChange={(e) => setNewProfile({...newProfile, biography: e.target.value})}
                placeholder="Share a brief professional biography..."
                data-testid="input-biography"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="careerStage">Career Stage</Label>
              <Select value={newProfile.careerStage} onValueChange={(v) => setNewProfile({...newProfile, careerStage: v})}>
                <SelectTrigger data-testid="select-new-career-stage">
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
              <Label htmlFor="shortTermGoals">Short Term Goals</Label>
              <Textarea
                id="shortTermGoals"
                value={newProfile.shortTermGoals}
                onChange={(e) => setNewProfile({...newProfile, shortTermGoals: e.target.value})}
                placeholder="What are your short-term goals?"
                data-testid="input-short-term-goals"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="longTermVision">Long Term Vision</Label>
              <Textarea
                id="longTermVision"
                value={newProfile.longTermVision}
                onChange={(e) => setNewProfile({...newProfile, longTermVision: e.target.value})}
                placeholder="What is your long-term vision?"
                data-testid="input-long-term-vision"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="currentProjectOrIdea">Current Project or Idea</Label>
              <Textarea
                id="currentProjectOrIdea"
                value={newProfile.currentProjectOrIdea}
                onChange={(e) => setNewProfile({...newProfile, currentProjectOrIdea: e.target.value})}
                placeholder="Describe any current project or idea"
                data-testid="input-current-project"
              />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="previouslyBeenMentored"
                  checked={newProfile.previouslyBeenMentored}
                  onCheckedChange={(checked) => setNewProfile({...newProfile, previouslyBeenMentored: checked === true})}
                  data-testid="checkbox-previously-mentored"
                />
                <Label htmlFor="previouslyBeenMentored">Have you previously been mentored?</Label>
              </div>
            </div>
            {newProfile.previouslyBeenMentored && (
              <div className="grid gap-2">
                <Label htmlFor="mentorshipExperienceDescription">Describe your mentorship experience</Label>
                <Textarea
                  id="mentorshipExperienceDescription"
                  value={newProfile.mentorshipExperienceDescription}
                  onChange={(e) => setNewProfile({...newProfile, mentorshipExperienceDescription: e.target.value})}
                  placeholder="Share details about your previous mentorship experience..."
                  data-testid="input-mentorship-experience"
                />
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Input
                  id="timezone"
                  value={newProfile.timezone}
                  onChange={(e) => setNewProfile({...newProfile, timezone: e.target.value})}
                  placeholder="e.g., America/New_York"
                  data-testid="input-timezone"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="monthlyHours">Monthly Hours Available</Label>
                <Select value={newProfile.monthlyHoursAvailable} onValueChange={(v) => setNewProfile({...newProfile, monthlyHoursAvailable: v})}>
                  <SelectTrigger data-testid="select-monthly-hours">
                    <SelectValue placeholder="Select hours" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1-2">1-2 hours</SelectItem>
                    <SelectItem value="3-4">3-4 hours</SelectItem>
                    <SelectItem value="5-6">5-6 hours</SelectItem>
                    <SelectItem value="7+">7+ hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
            <Button onClick={handleCreateProfile} disabled={createProfileMutation.isPending} data-testid="button-submit-create">
              {createProfileMutation.isPending ? "Creating..." : "Create Profile"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Import Mentee Profiles</DialogTitle>
            <DialogDescription>
              Import mentee profiles from CSV. Make sure users exist with MENTEE role.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleDownloadTemplate} data-testid="button-download-template">
                <Download className="mr-2 h-4 w-4" />
                Download Template
              </Button>
            </div>
            <div className="grid gap-2">
              <Label>Paste CSV Data</Label>
              <Textarea
                value={csvData}
                onChange={(e) => setCsvData(e.target.value)}
                placeholder="Paste your CSV data here..."
                className="min-h-[200px] font-mono text-sm"
                data-testid="input-csv-data"
              />
            </div>
            {importResults && (
              <div className="space-y-2">
                <div className="text-sm">
                  <span className="text-green-600 font-medium">{importResults.successful.length} successful</span>
                  {" | "}
                  <span className="text-red-600 font-medium">{importResults.failed.length} failed</span>
                </div>
                {importResults.failed.length > 0 && (
                  <div className="max-h-32 overflow-y-auto border rounded-md p-2 text-sm">
                    {importResults.failed.map((f, i) => (
                      <div key={i} className="text-red-600">
                        Row {f.row} ({f.email}): {f.error}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowImportDialog(false); setImportResults(null); setCsvData(""); }}>
              Close
            </Button>
            <Button onClick={handleImport} disabled={importMutation.isPending || !csvData.trim()} data-testid="button-submit-import">
              {importMutation.isPending ? "Importing..." : "Import"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showCreateUserDialog} onOpenChange={setShowCreateUserDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create New Mentee</DialogTitle>
            <DialogDescription>Create a new mentee user account. You can add their profile details in the next step.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={newUser.firstName}
                  onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })}
                  data-testid="input-first-name"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  value={newUser.lastName}
                  onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })}
                  data-testid="input-last-name"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                data-testid="input-email"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Temporary Password *</Label>
              <Input
                id="password"
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                data-testid="input-password"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="organizationName">Organization</Label>
              <Input
                id="organizationName"
                value={newUser.organizationName}
                onChange={(e) => setNewUser({ ...newUser, organizationName: e.target.value })}
                data-testid="input-organization"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="jobTitle">Job Title</Label>
              <Input
                id="jobTitle"
                value={newUser.jobTitle}
                onChange={(e) => setNewUser({ ...newUser, jobTitle: e.target.value })}
                data-testid="input-job-title"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateUserDialog(false)}>Cancel</Button>
            <Button 
              onClick={() => createUserMutation.mutate(newUser)} 
              disabled={createUserMutation.isPending || !newUser.email || !newUser.password || !newUser.firstName || !newUser.lastName}
              data-testid="button-submit-user"
            >
              {createUserMutation.isPending ? "Creating..." : "Create & Continue"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showPasswordResetDialog} onOpenChange={(open) => {
        setShowPasswordResetDialog(open);
        if (!open) {
          setPasswordResetResults(null);
          setSelectedProfileIds([]);
        }
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Bulk Password Reset</DialogTitle>
            <DialogDescription>
              Reset passwords for {selectedProfileIds.length} selected mentee{selectedProfileIds.length !== 1 ? "s" : ""}
            </DialogDescription>
          </DialogHeader>
          {passwordResetResults ? (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-muted">
                <p className="font-medium">Reset Results</p>
                <p className="text-sm text-muted-foreground">
                  {passwordResetResults.successful.length} passwords reset successfully
                </p>
                {passwordResetResults.failed.length > 0 && (
                  <p className="text-sm text-destructive">
                    {passwordResetResults.failed.length} failed
                  </p>
                )}
              </div>
              {passwordResetResults.successful.length > 0 && passwordResetResults.successful[0].tempPassword && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">New Temporary Passwords:</p>
                  <p className="text-xs text-muted-foreground">Save these passwords - they are only shown once!</p>
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {passwordResetResults.successful.map((user: any, idx: number) => (
                      <div key={idx} className="text-xs p-2 bg-muted rounded flex justify-between gap-2">
                        <span>{user.email}</span>
                        <code className="bg-background px-1 rounded">{user.tempPassword}</code>
                      </div>
                    ))}
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      const text = passwordResetResults.successful.map((u: any) => `${u.email},${u.tempPassword}`).join("\n");
                      const blob = new Blob([`email,tempPassword\n${text}`], { type: "text/csv" });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = "reset-passwords.csv";
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    data-testid="button-download-reset-passwords"
                  >
                    Download Passwords CSV
                  </Button>
                </div>
              )}
              <DialogFooter>
                <Button onClick={() => setShowPasswordResetDialog(false)} data-testid="button-done">
                  Done
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Choose how to reset passwords for the selected mentees:
              </p>
              <div className="space-y-3">
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={() => bulkPasswordResetMutation.mutate({ userIds: selectedUserIds, setPassword: true })}
                  disabled={bulkPasswordResetMutation.isPending}
                  data-testid="button-generate-temp-passwords"
                >
                  <KeyRound className="mr-2 h-4 w-4" />
                  Generate temporary passwords
                </Button>
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={() => bulkPasswordResetMutation.mutate({ userIds: selectedUserIds, setPassword: false })}
                  disabled={bulkPasswordResetMutation.isPending}
                  data-testid="button-generate-reset-tokens"
                >
                  <Mail className="mr-2 h-4 w-4" />
                  Generate reset tokens (for email)
                </Button>
              </div>
              {bulkPasswordResetMutation.isPending && (
                <p className="text-sm text-center text-muted-foreground">Processing...</p>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowPasswordResetDialog(false)} data-testid="button-cancel">
                  Cancel
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
