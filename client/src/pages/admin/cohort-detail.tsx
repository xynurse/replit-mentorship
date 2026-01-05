import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation, useSearch } from "wouter";
import { AdminLayout } from "@/components/layouts/admin-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, 
  Calendar, 
  Users, 
  Edit, 
  Save, 
  X,
  Loader2,
  CheckCircle,
  Clock,
  UserPlus,
  Target
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";
import type { Cohort, CohortStatus } from "@shared/schema";

const statusColors: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
  RECRUITING: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  MATCHING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  ACTIVE: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  COMPLETED: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  ARCHIVED: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500",
};

const statusDescriptions: Record<string, string> = {
  DRAFT: "Cohort is being configured. Not visible to applicants yet.",
  RECRUITING: "Open for mentor and mentee applications.",
  MATCHING: "Applications closed. Mentors and mentees are being matched.",
  ACTIVE: "Mentorship program is currently running.",
  COMPLETED: "Mentorship program has ended.",
  ARCHIVED: "Cohort is archived and no longer active.",
};

const statusTransitions: Record<string, CohortStatus[]> = {
  DRAFT: ["RECRUITING"],
  RECRUITING: ["MATCHING", "DRAFT"],
  MATCHING: ["ACTIVE", "RECRUITING"],
  ACTIVE: ["COMPLETED"],
  COMPLETED: ["ARCHIVED"],
  ARCHIVED: [],
};

export default function CohortDetail() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const searchString = useSearch();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Record<string, any>>({});
  const [hasInitialized, setHasInitialized] = useState(false);

  const { data: cohort, isLoading } = useQuery<Cohort>({
    queryKey: ["/api/cohorts", id],
    enabled: !!id,
  });

  const formatDateForEdit = (date: Date | string | null | undefined): string => {
    if (!date) return "";
    const d = date instanceof Date ? date : new Date(date);
    return isNaN(d.getTime()) ? "" : d.toISOString();
  };

  useEffect(() => {
    if (cohort && !hasInitialized) {
      const params = new URLSearchParams(searchString);
      if (params.get("edit") === "true") {
        setEditData({
          name: cohort.name,
          description: cohort.description || "",
          startDate: formatDateForEdit(cohort.startDate),
          endDate: formatDateForEdit(cohort.endDate),
          applicationDeadline: formatDateForEdit(cohort.applicationDeadline),
          maxMentors: cohort.maxMentors,
          maxMentees: cohort.maxMentees,
          isPublic: cohort.isPublic ?? false,
        });
        setIsEditing(true);
      }
      setHasInitialized(true);
    }
  }, [cohort, hasInitialized, searchString]);

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<Cohort>) => {
      return apiRequest("PATCH", `/api/cohorts/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cohorts", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/cohorts"] });
      toast({ title: "Cohort updated successfully" });
      setIsEditing(false);
    },
    onError: () => {
      toast({ title: "Failed to update cohort", variant: "destructive" });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (newStatus: CohortStatus) => {
      return apiRequest("PATCH", `/api/cohorts/${id}`, { status: newStatus });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cohorts", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/cohorts"] });
      toast({ title: "Status updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update status", variant: "destructive" });
    },
  });

  const startEditing = () => {
    if (cohort) {
      setEditData({
        name: cohort.name,
        description: cohort.description || "",
        startDate: formatDateForEdit(cohort.startDate),
        endDate: formatDateForEdit(cohort.endDate),
        applicationDeadline: formatDateForEdit(cohort.applicationDeadline),
        maxMentors: cohort.maxMentors,
        maxMentees: cohort.maxMentees,
        isPublic: cohort.isPublic ?? false,
      });
      setIsEditing(true);
    }
  };

  const saveChanges = () => {
    if (!cohort) return;
    const payload: Record<string, any> = {
      name: editData.name || cohort.name,
      description: editData.description !== undefined ? (editData.description || null) : cohort.description,
      isPublic: editData.isPublic !== undefined ? Boolean(editData.isPublic) : Boolean(cohort.isPublic),
      maxMentors: editData.maxMentors !== undefined ? (editData.maxMentors === "" || editData.maxMentors === null ? null : Number(editData.maxMentors)) : cohort.maxMentors,
      maxMentees: editData.maxMentees !== undefined ? (editData.maxMentees === "" || editData.maxMentees === null ? null : Number(editData.maxMentees)) : cohort.maxMentees,
      startDate: editData.startDate !== undefined ? (editData.startDate || null) : cohort.startDate,
      endDate: editData.endDate !== undefined ? (editData.endDate || null) : cohort.endDate,
      applicationDeadline: editData.applicationDeadline !== undefined ? (editData.applicationDeadline || null) : cohort.applicationDeadline,
    };
    updateMutation.mutate(payload);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditData({});
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AdminLayout>
    );
  }

  if (!cohort) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-2">Cohort not found</h2>
          <Button onClick={() => navigate("/admin/cohorts")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Cohorts
          </Button>
        </div>
      </AdminLayout>
    );
  }

  const availableTransitions = statusTransitions[cohort.status || "DRAFT"] || [];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/admin/cohorts")} data-testid="button-back">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight" data-testid="text-cohort-name">
                {cohort.name}
              </h1>
              <p className="text-muted-foreground">{cohort.description || "No description"}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <Button variant="outline" onClick={cancelEditing} data-testid="button-cancel-edit">
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
                <Button onClick={saveChanges} disabled={updateMutation.isPending} data-testid="button-save">
                  {updateMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Save Changes
                </Button>
              </>
            ) : (
              <Button onClick={startEditing} data-testid="button-edit">
                <Edit className="mr-2 h-4 w-4" />
                Edit Cohort
              </Button>
            )}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge className={`${statusColors[cohort.status || 'DRAFT']} no-default-hover-elevate no-default-active-elevate`}>
                    {cohort.status}
                  </Badge>
                  {cohort.isPublic && (
                    <Badge variant="outline">Public</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {statusDescriptions[cohort.status || 'DRAFT']}
                </p>
                {availableTransitions.length > 0 && (
                  <div className="pt-2 border-t">
                    <Label className="text-sm font-medium mb-2 block">Change Status</Label>
                    <div className="flex flex-wrap gap-2">
                      {availableTransitions.map((status) => (
                        <Button
                          key={status}
                          size="sm"
                          variant="outline"
                          onClick={() => updateStatusMutation.mutate(status)}
                          disabled={updateStatusMutation.isPending}
                          data-testid={`button-status-${status.toLowerCase()}`}
                        >
                          {updateStatusMutation.isPending ? (
                            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                          ) : null}
                          Move to {status}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Timeline</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditing ? (
                  <>
                    <div className="grid gap-2">
                      <Label>Start Date</Label>
                      <Input
                        type="date"
                        value={editData.startDate ? format(new Date(editData.startDate as string), "yyyy-MM-dd") : ""}
                        onChange={(e) => setEditData({...editData, startDate: e.target.value ? new Date(e.target.value).toISOString() : ""})}
                        data-testid="input-start-date"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>End Date</Label>
                      <Input
                        type="date"
                        value={editData.endDate ? format(new Date(editData.endDate as string), "yyyy-MM-dd") : ""}
                        onChange={(e) => setEditData({...editData, endDate: e.target.value ? new Date(e.target.value).toISOString() : ""})}
                        data-testid="input-end-date"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Application Deadline</Label>
                      <Input
                        type="date"
                        value={editData.applicationDeadline ? format(new Date(editData.applicationDeadline as string), "yyyy-MM-dd") : ""}
                        onChange={(e) => setEditData({...editData, applicationDeadline: e.target.value ? new Date(e.target.value).toISOString() : ""})}
                        data-testid="input-deadline"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Start Date</span>
                      </div>
                      <span className="font-medium" data-testid="text-start-date">
                        {cohort.startDate ? format(new Date(cohort.startDate), "MMM d, yyyy") : "Not set"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">End Date</span>
                      </div>
                      <span className="font-medium" data-testid="text-end-date">
                        {cohort.endDate ? format(new Date(cohort.endDate), "MMM d, yyyy") : "Not set"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Application Deadline</span>
                      </div>
                      <span className="font-medium" data-testid="text-deadline">
                        {cohort.applicationDeadline ? format(new Date(cohort.applicationDeadline), "MMM d, yyyy") : "Not set"}
                      </span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Capacity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditing ? (
                  <>
                    <div className="grid gap-2">
                      <Label>Max Mentors</Label>
                      <Input
                        type="number"
                        min="1"
                        value={editData.maxMentors || ""}
                        onChange={(e) => setEditData({...editData, maxMentors: e.target.value ? Number(e.target.value) : null})}
                        data-testid="input-max-mentors"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Max Mentees</Label>
                      <Input
                        type="number"
                        min="1"
                        value={editData.maxMentees || ""}
                        onChange={(e) => setEditData({...editData, maxMentees: e.target.value ? Number(e.target.value) : null})}
                        data-testid="input-max-mentees"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Max Mentors</span>
                      </div>
                      <span className="font-medium" data-testid="text-max-mentors">
                        {cohort.maxMentors || "Unlimited"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Max Mentees</span>
                      </div>
                      <span className="font-medium" data-testid="text-max-mentees">
                        {cohort.maxMentees || "Unlimited"}
                      </span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2 space-y-6">
            {isEditing && (
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-2">
                    <Label>Cohort Name</Label>
                    <Input
                      value={editData.name || ""}
                      onChange={(e) => setEditData({...editData, name: e.target.value})}
                      data-testid="input-name"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Description</Label>
                    <Textarea
                      value={editData.description || ""}
                      onChange={(e) => setEditData({...editData, description: e.target.value})}
                      className="resize-none"
                      rows={3}
                      data-testid="textarea-description"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isPublic"
                      checked={editData.isPublic || false}
                      onChange={(e) => setEditData({...editData, isPublic: e.target.checked})}
                      className="h-4 w-4"
                      data-testid="checkbox-public"
                    />
                    <Label htmlFor="isPublic">Allow public applications</Label>
                  </div>
                </CardContent>
              </Card>
            )}

            <Tabs defaultValue="overview">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="mentors">Mentors</TabsTrigger>
                <TabsTrigger value="mentees">Mentees</TabsTrigger>
                <TabsTrigger value="matches">Matches</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Cohort Overview</CardTitle>
                    <CardDescription>Summary of this cohort's activity</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                      <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-md">
                        <UserPlus className="h-8 w-8 text-blue-500" />
                        <div>
                          <p className="text-2xl font-bold">0</p>
                          <p className="text-sm text-muted-foreground">Applications</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-md">
                        <Users className="h-8 w-8 text-green-500" />
                        <div>
                          <p className="text-2xl font-bold">0</p>
                          <p className="text-sm text-muted-foreground">Active Mentors</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-md">
                        <Users className="h-8 w-8 text-purple-500" />
                        <div>
                          <p className="text-2xl font-bold">0</p>
                          <p className="text-sm text-muted-foreground">Active Mentees</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-md">
                        <Target className="h-8 w-8 text-orange-500" />
                        <div>
                          <p className="text-2xl font-bold">0</p>
                          <p className="text-sm text-muted-foreground">Active Matches</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="mentors" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Mentors</CardTitle>
                    <CardDescription>Mentors enrolled in this cohort</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No mentors enrolled yet</p>
                      <p className="text-sm">Mentors will appear here once they join this cohort</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="mentees" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Mentees</CardTitle>
                    <CardDescription>Mentees enrolled in this cohort</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No mentees enrolled yet</p>
                      <p className="text-sm">Mentees will appear here once they join this cohort</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="matches" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Mentorship Matches</CardTitle>
                    <CardDescription>Mentor-mentee pairings in this cohort</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8 text-muted-foreground">
                      <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No matches created yet</p>
                      <p className="text-sm">Matches will appear here once mentors and mentees are paired</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
