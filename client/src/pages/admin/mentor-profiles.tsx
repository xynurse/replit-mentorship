import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { AdminLayout } from "@/components/layouts/admin-layout";
import { DataTable, Column } from "@/components/ui/data-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { MoreHorizontal, Eye, Download, Upload, Plus, Search, Users, UserCheck, RefreshCw, X } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { MentorProfile, User, Track } from "@shared/schema";

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

export default function AdminMentorProfiles() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [regionFilter, setRegionFilter] = useState<string>("all");
  const [trackFilter, setTrackFilter] = useState<string>("all");
  const [capacityFilter, setCapacityFilter] = useState<string>("all");
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [csvData, setCsvData] = useState("");
  const [importResults, setImportResults] = useState<{
    successful: any[];
    failed: Array<{ row: number; email: string; error: string }>;
  } | null>(null);

  const [newProfile, setNewProfile] = useState({
    userId: "",
    preferredName: "",
    pronouns: "",
    region: "",
    languages: "",
    mentoringTracks: "",
    expertiseDescription: "",
    skillsToShare: "",
    mentoringGoals: "",
    preferredMeetingFrequency: "",
    preferredMeetingFormat: "",
    additionalNotes: "",
    maxMentees: "2",
    cohortYear: new Date().getFullYear().toString(),
  });

  const buildQueryParams = () => {
    const params = new URLSearchParams();
    if (searchQuery) params.set("search", searchQuery);
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (regionFilter !== "all") params.set("region", regionFilter);
    if (trackFilter !== "all") params.set("track", trackFilter);
    if (capacityFilter === "available") params.set("hasCapacity", "true");
    return params.toString();
  };

  const { data: profiles = [], isLoading, refetch } = useQuery<MentorProfileWithUser[]>({
    queryKey: ["/api/admin/mentor-profiles", { search: searchQuery, status: statusFilter, region: regionFilter, track: trackFilter, hasCapacity: capacityFilter === "available" }],
    queryFn: async () => {
      const queryString = buildQueryParams();
      const response = await fetch(`/api/admin/mentor-profiles?${queryString}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch mentor profiles");
      return response.json();
    },
  });

  const { data: tracks = [] } = useQuery<Track[]>({
    queryKey: ["/api/tracks"],
  });

  const { data: mentors = [] } = useQuery<(User & { password?: string })[]>({
    queryKey: ["/api/users", { role: "MENTOR" }],
  });

  const createProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/admin/mentor-profiles", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/mentor-profiles"] });
      setShowCreateDialog(false);
      resetNewProfile();
      toast({ title: "Mentor profile created successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to create profile", description: error.message, variant: "destructive" });
    },
  });

  const importMutation = useMutation({
    mutationFn: async (profilesData: any[]) => {
      const response = await apiRequest("POST", "/api/admin/mentor-profiles/bulk-import", { profiles: profilesData });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/mentor-profiles"] });
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
      preferredName: "",
      pronouns: "",
      region: "",
      languages: "",
      mentoringTracks: "",
      expertiseDescription: "",
      skillsToShare: "",
      mentoringGoals: "",
      preferredMeetingFrequency: "",
      preferredMeetingFormat: "",
      additionalNotes: "",
      maxMentees: "2",
      cohortYear: new Date().getFullYear().toString(),
    });
  };

  const handleCreateProfile = () => {
    if (!newProfile.userId) {
      toast({ title: "Please select a mentor", variant: "destructive" });
      return;
    }

    const profileData = {
      userId: newProfile.userId,
      preferredName: newProfile.preferredName || null,
      pronouns: newProfile.pronouns || null,
      region: newProfile.region || null,
      languages: newProfile.languages ? newProfile.languages.split(",").map(s => s.trim()) : [],
      mentoringTracks: newProfile.mentoringTracks ? newProfile.mentoringTracks.split(",").map(s => s.trim()) : [],
      expertiseDescription: newProfile.expertiseDescription || null,
      skillsToShare: newProfile.skillsToShare || null,
      mentoringGoals: newProfile.mentoringGoals || null,
      preferredMeetingFrequency: newProfile.preferredMeetingFrequency || null,
      preferredMeetingFormat: newProfile.preferredMeetingFormat || null,
      additionalNotes: newProfile.additionalNotes || null,
      maxMentees: parseInt(newProfile.maxMentees) || 2,
      cohortYear: parseInt(newProfile.cohortYear) || new Date().getFullYear(),
      status: "ACTIVE" as const,
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
      const response = await fetch(`/api/admin/mentor-profiles/export?${queryString}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Export failed");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "mentor-profiles-export.csv";
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
      const response = await fetch("/api/admin/mentor-profiles/bulk-import/template", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to download template");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "mentor-profile-import-template.csv";
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
    setStatusFilter("all");
    setRegionFilter("all");
    setTrackFilter("all");
    setCapacityFilter("all");
  };

  const hasActiveFilters = searchQuery || statusFilter !== "all" || regionFilter !== "all" || trackFilter !== "all" || capacityFilter !== "all";

  const mentorsWithoutProfiles = mentors.filter(
    m => !profiles.some(p => p.userId === m.id)
  );

  const columns: Column<MentorProfileWithUser>[] = [
    {
      key: "mentor",
      header: "Mentor",
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
              {profile.preferredName || `${profile.user.firstName} ${profile.user.lastName}`}
            </div>
            <div className="text-sm text-muted-foreground">{profile.user.email}</div>
          </div>
        </div>
      ),
    },
    {
      key: "region",
      header: "Region",
      render: (profile) => (
        <span className="text-sm">{regionLabels[profile.region || ""] || profile.region || "-"}</span>
      ),
    },
    {
      key: "tracks",
      header: "Tracks",
      render: (profile) => (
        <div className="flex flex-wrap gap-1">
          {(profile.mentoringTracks || []).slice(0, 2).map((track, i) => (
            <Badge key={i} variant="outline" className="text-xs">
              {track}
            </Badge>
          ))}
          {(profile.mentoringTracks || []).length > 2 && (
            <Badge variant="outline" className="text-xs">
              +{(profile.mentoringTracks || []).length - 2}
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: "capacity",
      header: "Capacity",
      render: (profile) => {
        const current = profile.currentMenteeCount || 0;
        const max = profile.maxMentees || 2;
        const hasCapacity = current < max;
        return (
          <div className="flex items-center gap-2">
            <span className={hasCapacity ? "text-green-600" : "text-muted-foreground"}>
              {current}/{max}
            </span>
            {hasCapacity && (
              <UserCheck className="h-4 w-4 text-green-600" />
            )}
          </div>
        );
      },
    },
    {
      key: "status",
      header: "Status",
      render: (profile) => (
        <Badge className={statusColors[profile.status || "PENDING"]}>
          {profile.status || "PENDING"}
        </Badge>
      ),
    },
    {
      key: "cohortYear",
      header: "Cohort",
      render: (profile) => (
        <span className="text-sm">{profile.cohortYear || "-"}</span>
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
            <DropdownMenuItem onClick={() => setLocation(`/admin/mentor-profiles/${profile.userId}`)}>
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const activeCount = profiles.filter(p => p.status === "ACTIVE").length;
  const withCapacityCount = profiles.filter(p => (p.currentMenteeCount || 0) < (p.maxMentees || 2)).length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight" data-testid="text-page-title">Mentor Profiles</h1>
            <p className="text-muted-foreground">Manage mentor profiles, capacity, and expertise</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setShowImportDialog(true)} data-testid="button-import">
              <Upload className="mr-2 h-4 w-4" />
              Import
            </Button>
            <Button variant="outline" onClick={handleExport} data-testid="button-export">
              <Download className="mr-2 h-4 w-4" />
              Export
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
              <CardTitle className="text-sm font-medium">Total Mentors</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-total-count">{profiles.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Mentors</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-active-count">{activeCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">With Capacity</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-capacity-count">{withCapacityCount}</div>
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
                    placeholder="Search by name, email, or expertise..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                    data-testid="input-search"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]" data-testid="select-status">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                  <SelectItem value="ON_LEAVE">On Leave</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                </SelectContent>
              </Select>
              <Select value={regionFilter} onValueChange={setRegionFilter}>
                <SelectTrigger className="w-[140px]" data-testid="select-region">
                  <SelectValue placeholder="Region" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Regions</SelectItem>
                  <SelectItem value="NORTH_AMERICA">North America</SelectItem>
                  <SelectItem value="SOUTH_AMERICA">South America</SelectItem>
                  <SelectItem value="EUROPE">Europe</SelectItem>
                  <SelectItem value="ASIA">Asia</SelectItem>
                  <SelectItem value="AFRICA">Africa</SelectItem>
                  <SelectItem value="OCEANIA">Oceania</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
              <Select value={trackFilter} onValueChange={setTrackFilter}>
                <SelectTrigger className="w-[140px]" data-testid="select-track">
                  <SelectValue placeholder="Track" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tracks</SelectItem>
                  {tracks.map((track) => (
                    <SelectItem key={track.id} value={track.name}>
                      {track.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={capacityFilter} onValueChange={setCapacityFilter}>
                <SelectTrigger className="w-[160px]" data-testid="select-capacity">
                  <SelectValue placeholder="Capacity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="available">With Capacity</SelectItem>
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
              emptyMessage="No mentor profiles found"
            />
          </CardContent>
        </Card>
      </div>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Mentor Profile</DialogTitle>
            <DialogDescription>Add a new mentor profile for an existing mentor user</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="userId">Select Mentor *</Label>
              <Select value={newProfile.userId} onValueChange={(v) => setNewProfile({...newProfile, userId: v})}>
                <SelectTrigger data-testid="select-mentor">
                  <SelectValue placeholder="Select a mentor" />
                </SelectTrigger>
                <SelectContent>
                  {mentorsWithoutProfiles.map((mentor) => (
                    <SelectItem key={mentor.id} value={mentor.id}>
                      {mentor.firstName} {mentor.lastName} ({mentor.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {mentorsWithoutProfiles.length === 0 && (
                <p className="text-sm text-muted-foreground">All mentors already have profiles</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="preferredName">Preferred Name</Label>
                <Input
                  id="preferredName"
                  value={newProfile.preferredName}
                  onChange={(e) => setNewProfile({...newProfile, preferredName: e.target.value})}
                  data-testid="input-preferred-name"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="pronouns">Pronouns</Label>
                <Input
                  id="pronouns"
                  value={newProfile.pronouns}
                  onChange={(e) => setNewProfile({...newProfile, pronouns: e.target.value})}
                  placeholder="e.g., she/her, he/him, they/them"
                  data-testid="input-pronouns"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="region">Region</Label>
                <Select value={newProfile.region} onValueChange={(v) => setNewProfile({...newProfile, region: v})}>
                  <SelectTrigger data-testid="select-new-region">
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
                <Label htmlFor="languages">Languages (comma-separated)</Label>
                <Input
                  id="languages"
                  value={newProfile.languages}
                  onChange={(e) => setNewProfile({...newProfile, languages: e.target.value})}
                  placeholder="e.g., English, Spanish"
                  data-testid="input-languages"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="mentoringTracks">Mentoring Tracks (comma-separated)</Label>
              <Input
                id="mentoringTracks"
                value={newProfile.mentoringTracks}
                onChange={(e) => setNewProfile({...newProfile, mentoringTracks: e.target.value})}
                placeholder="e.g., Leadership, Clinical Practice"
                data-testid="input-tracks"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="expertiseDescription">Expertise Description</Label>
              <Textarea
                id="expertiseDescription"
                value={newProfile.expertiseDescription}
                onChange={(e) => setNewProfile({...newProfile, expertiseDescription: e.target.value})}
                data-testid="input-expertise"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="skillsToShare">Skills to Share</Label>
              <Textarea
                id="skillsToShare"
                value={newProfile.skillsToShare}
                onChange={(e) => setNewProfile({...newProfile, skillsToShare: e.target.value})}
                data-testid="input-skills"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="mentoringGoals">Mentoring Goals</Label>
              <Textarea
                id="mentoringGoals"
                value={newProfile.mentoringGoals}
                onChange={(e) => setNewProfile({...newProfile, mentoringGoals: e.target.value})}
                data-testid="input-goals"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="preferredMeetingFrequency">Meeting Frequency</Label>
                <Select value={newProfile.preferredMeetingFrequency} onValueChange={(v) => setNewProfile({...newProfile, preferredMeetingFrequency: v})}>
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
                <Label htmlFor="preferredMeetingFormat">Meeting Format</Label>
                <Select value={newProfile.preferredMeetingFormat} onValueChange={(v) => setNewProfile({...newProfile, preferredMeetingFormat: v})}>
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
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="maxMentees">Max Mentees</Label>
                <Input
                  id="maxMentees"
                  type="number"
                  min="1"
                  max="10"
                  value={newProfile.maxMentees}
                  onChange={(e) => setNewProfile({...newProfile, maxMentees: e.target.value})}
                  data-testid="input-max-mentees"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="cohortYear">Cohort Year</Label>
                <Input
                  id="cohortYear"
                  type="number"
                  value={newProfile.cohortYear}
                  onChange={(e) => setNewProfile({...newProfile, cohortYear: e.target.value})}
                  data-testid="input-cohort-year"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="additionalNotes">Additional Notes</Label>
              <Textarea
                id="additionalNotes"
                value={newProfile.additionalNotes}
                onChange={(e) => setNewProfile({...newProfile, additionalNotes: e.target.value})}
                data-testid="input-notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
            <Button onClick={handleCreateProfile} disabled={createProfileMutation.isPending} data-testid="button-submit-profile">
              {createProfileMutation.isPending ? "Creating..." : "Create Profile"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showImportDialog} onOpenChange={(open) => { setShowImportDialog(open); if (!open) setImportResults(null); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Import Mentor Profiles</DialogTitle>
            <DialogDescription>
              Import mentor profiles from a CSV file. Mentors must already exist as users in the system.
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
              <Label htmlFor="csvData">Paste CSV Data</Label>
              <Textarea
                id="csvData"
                value={csvData}
                onChange={(e) => setCsvData(e.target.value)}
                placeholder="Paste your CSV data here..."
                className="min-h-[200px] font-mono text-sm"
                data-testid="input-csv-data"
              />
            </div>
            {importResults && (
              <div className="space-y-2">
                <p className="text-sm font-medium">
                  Import Results: {importResults.successful.length} successful, {importResults.failed.length} failed
                </p>
                {importResults.failed.length > 0 && (
                  <div className="max-h-[150px] overflow-y-auto rounded-md border p-2">
                    {importResults.failed.map((f, i) => (
                      <p key={i} className="text-sm text-destructive">
                        Row {f.row}: {f.email} - {f.error}
                      </p>
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
            <Button onClick={handleImport} disabled={importMutation.isPending || !csvData} data-testid="button-import-submit">
              {importMutation.isPending ? "Importing..." : "Import"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
