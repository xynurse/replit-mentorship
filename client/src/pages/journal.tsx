import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { exportImpactReportToPDF, type ImpactReportData } from "@/lib/pdf-export";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { JournalEntry, User } from "@shared/schema";
import type { Goal, MeetingLog, MentorshipMatch } from "@shared/schema";
import {
  BookOpen,
  Plus,
  Calendar,
  Smile,
  Meh,
  Frown,
  Star,
  AlertCircle,
  Eye,
  EyeOff,
  Users,
  Edit,
  Trash2,
  MessageSquare,
  Send,
  FileDown,
  Lightbulb,
  Target,
  ChevronDown,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type JournalEntryWithUser = JournalEntry & { user?: User };

const MOOD_OPTIONS = [
  { value: "EXCELLENT", label: "Excellent", icon: Star, color: "text-yellow-500" },
  { value: "GOOD", label: "Good", icon: Smile, color: "text-green-500" },
  { value: "NEUTRAL", label: "Neutral", icon: Meh, color: "text-gray-500" },
  { value: "CHALLENGING", label: "Challenging", icon: AlertCircle, color: "text-orange-500" },
  { value: "DIFFICULT", label: "Difficult", icon: Frown, color: "text-red-500" },
];

const VISIBILITY_OPTIONS = [
  { value: "PRIVATE", label: "Private", icon: EyeOff, description: "Only you can see" },
  { value: "MENTOR_ONLY", label: "Mentor Only", icon: Users, description: "Share with your mentor" },
  { value: "PUBLIC", label: "Public", icon: Eye, description: "Visible to mentors and admins" },
];

const journalFormSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  content: z.string().min(1, "Content is required"),
  mood: z.enum(["EXCELLENT", "GOOD", "NEUTRAL", "CHALLENGING", "DIFFICULT"]).optional(),
  visibility: z.enum(["PRIVATE", "MENTOR_ONLY", "PUBLIC"]).default("PRIVATE"),
  keyLearnings: z.string().optional(),
  challenges: z.string().optional(),
  nextSteps: z.string().optional(),
  tags: z.string().optional(),
});

type JournalFormData = z.infer<typeof journalFormSchema>;

function formatDate(date?: Date | string | null): string {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getMoodIcon(mood: string | null | undefined) {
  const option = MOOD_OPTIONS.find(m => m.value === mood);
  if (!option) return null;
  const Icon = option.icon;
  return <Icon className={`h-4 w-4 ${option.color}`} />;
}

function getVisibilityBadge(visibility: string | null | undefined) {
  const option = VISIBILITY_OPTIONS.find(v => v.value === visibility);
  if (!option) return null;
  const Icon = option.icon;
  return (
    <Badge variant="outline" className="gap-1">
      <Icon className="h-3 w-3" />
      {option.label}
    </Badge>
  );
}

export default function JournalPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntryWithUser | null>(null);
  const [feedbackText, setFeedbackText] = useState("");

  const isMentor = user?.role === "MENTOR";
  const isAdmin = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";

  const { data: myEntries = [], isLoading: loadingMyEntries } = useQuery<JournalEntry[]>({
    queryKey: ["/api/journal"],
  });

  const { data: menteeEntries = [], isLoading: loadingMenteeEntries } = useQuery<JournalEntryWithUser[]>({
    queryKey: ["/api/journal/mentee-entries"],
    enabled: isMentor || isAdmin,
  });

  const { data: goals = [] } = useQuery<Goal[]>({
    queryKey: ["/api/goals"],
    enabled: !isMentor && !isAdmin,
  });

  const { data: meetings = [] } = useQuery<MeetingLog[]>({
    queryKey: ["/api/meetings"],
    enabled: !isMentor && !isAdmin,
  });

  const { data: matches = [] } = useQuery<any[]>({
    queryKey: ["/api/matches/my"],
    enabled: !isMentor && !isAdmin,
  });

  const handleExportImpactReport = () => {
    if (!user) return;

    const activeMatch = matches.find((m: any) => m.status === 'ACTIVE');
    const mentor = activeMatch?.mentor;

    const reportData: ImpactReportData = {
      user: {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        organizationName: user.organizationName,
        jobTitle: user.jobTitle,
      },
      mentor: mentor ? {
        firstName: mentor.firstName,
        lastName: mentor.lastName,
        email: mentor.email,
      } : null,
      mentorshipStartDate: activeMatch?.matchedAt,
      goals: goals.map(g => ({
        title: g.title,
        description: g.description,
        category: g.category,
        status: g.status,
        progress: g.progress,
        targetDate: g.targetDate,
        specificDetails: g.specificDetails,
        measurableMetrics: g.measurableMetrics,
        achievabilityNotes: g.achievabilityNotes,
        relevanceExplanation: g.relevanceExplanation,
      })),
      meetings: meetings.map(m => ({
        scheduledDate: m.scheduledDate,
        format: m.format,
        agenda: m.agenda,
        notes: m.notes,
        durationMinutes: m.durationMinutes,
        status: m.status,
      })),
      journalEntries: myEntries.map(j => ({
        title: j.title,
        content: j.content,
        mood: j.mood,
        keyLearnings: j.keyLearnings,
        challenges: j.challenges,
        nextSteps: j.nextSteps,
        createdAt: j.createdAt,
      })),
      programName: 'SONSIEL Mentorship Program',
    };

    exportImpactReportToPDF(reportData);
    toast({ title: "Success", description: "Impact report exported" });
  };

  const createMutation = useMutation({
    mutationFn: async (data: JournalFormData) => {
      const tagsArray = data.tags ? data.tags.split(",").map(t => t.trim()).filter(Boolean) : undefined;
      return apiRequest("POST", "/api/journal", {
        ...data,
        tags: tagsArray,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/journal"] });
      setIsCreateOpen(false);
      toast({ title: "Success", description: "Journal entry created" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create entry", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: JournalFormData }) => {
      const tagsArray = data.tags ? data.tags.split(",").map(t => t.trim()).filter(Boolean) : undefined;
      return apiRequest("PATCH", `/api/journal/${id}`, {
        ...data,
        tags: tagsArray,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/journal"] });
      setIsEditOpen(false);
      setSelectedEntry(null);
      toast({ title: "Success", description: "Journal entry updated" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update entry", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/journal/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/journal"] });
      setIsDeleteOpen(false);
      setSelectedEntry(null);
      toast({ title: "Success", description: "Journal entry deleted" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete entry", variant: "destructive" });
    },
  });

  const feedbackMutation = useMutation({
    mutationFn: async ({ id, feedback }: { id: string; feedback: string }) => {
      return apiRequest("POST", `/api/journal/${id}/feedback`, { feedback });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/journal/mentee-entries"] });
      setIsFeedbackOpen(false);
      setSelectedEntry(null);
      setFeedbackText("");
      toast({ title: "Success", description: "Feedback added" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to add feedback", variant: "destructive" });
    },
  });

  const createForm = useForm<JournalFormData>({
    resolver: zodResolver(journalFormSchema),
    defaultValues: {
      title: "",
      content: "",
      visibility: "PRIVATE",
      keyLearnings: "",
      challenges: "",
      nextSteps: "",
      tags: "",
    },
  });

  const editForm = useForm<JournalFormData>({
    resolver: zodResolver(journalFormSchema),
  });

  const handleEdit = (entry: JournalEntry) => {
    setSelectedEntry(entry);
    editForm.reset({
      title: entry.title,
      content: entry.content,
      mood: entry.mood as any,
      visibility: (entry.visibility || "PRIVATE") as any,
      keyLearnings: entry.keyLearnings || "",
      challenges: entry.challenges || "",
      nextSteps: entry.nextSteps || "",
      tags: entry.tags?.join(", ") || "",
    });
    setIsEditOpen(true);
  };

  const handleDelete = (entry: JournalEntry) => {
    setSelectedEntry(entry);
    setIsDeleteOpen(true);
  };

  const handleFeedback = (entry: JournalEntryWithUser) => {
    setSelectedEntry(entry);
    setFeedbackText(entry.mentorFeedback || "");
    setIsFeedbackOpen(true);
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold flex items-center gap-2">
              <BookOpen className="h-6 w-6" />
              Mentorship Journal
            </h1>
            <p className="text-muted-foreground mt-1">
              {isMentor || isAdmin
                ? "View and provide feedback on mentee reflections"
                : "Track your growth, learnings, and reflections"}
            </p>
          </div>
          {!isMentor && !isAdmin && (
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleExportImpactReport} data-testid="button-export-impact-report">
                <FileDown className="mr-2 h-4 w-4" />
                Export Impact Report
              </Button>
              <Button onClick={() => setIsCreateOpen(true)} data-testid="button-create-entry">
                <Plus className="mr-2 h-4 w-4" />
                New Entry
              </Button>
            </div>
          )}
        </div>

        {isMentor || isAdmin ? (
          <Tabs defaultValue="mentee" className="space-y-6">
            <TabsList>
              <TabsTrigger value="mentee" data-testid="tab-mentee-entries">
                Mentee Entries ({menteeEntries.length})
              </TabsTrigger>
              <TabsTrigger value="my" data-testid="tab-my-entries">
                My Entries ({myEntries.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="mentee" className="space-y-4">
              {loadingMenteeEntries ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-48 w-full" />
                  ))}
                </div>
              ) : menteeEntries.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground">No shared journal entries from your mentees yet</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {menteeEntries.map(entry => (
                    <JournalCard
                      key={entry.id}
                      entry={entry}
                      showAuthor
                      onFeedback={() => handleFeedback(entry)}
                      isMentor
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="my" className="space-y-4">
              <div className="flex justify-end">
                <Button onClick={() => setIsCreateOpen(true)} data-testid="button-create-entry-mentor">
                  <Plus className="mr-2 h-4 w-4" />
                  New Entry
                </Button>
              </div>
              <JournalList
                entries={myEntries}
                loading={loadingMyEntries}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            </TabsContent>
          </Tabs>
        ) : (
          <JournalList
            entries={myEntries}
            loading={loadingMyEntries}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>New Journal Entry</DialogTitle>
              <DialogDescription>
                Reflect on your mentorship journey, learnings, and growth
              </DialogDescription>
            </DialogHeader>
            <Form {...createForm}>
              <form onSubmit={createForm.handleSubmit(data => createMutation.mutate(data))} className="space-y-4">
                <FormField
                  control={createForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="What's this entry about?" {...field} data-testid="input-title" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={createForm.control}
                    name="mood"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>How are you feeling?</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-mood">
                              <SelectValue placeholder="Select mood" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {MOOD_OPTIONS.map(option => (
                              <SelectItem key={option.value} value={option.value}>
                                <div className="flex items-center gap-2">
                                  <option.icon className={`h-4 w-4 ${option.color}`} />
                                  {option.label}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={createForm.control}
                    name="visibility"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Visibility</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-visibility">
                              <SelectValue placeholder="Who can see?" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {VISIBILITY_OPTIONS.map(option => (
                              <SelectItem key={option.value} value={option.value}>
                                <div className="flex items-center gap-2">
                                  <option.icon className="h-4 w-4" />
                                  {option.label}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>{VISIBILITY_OPTIONS.find(v => v.value === field.value)?.description}</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={createForm.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reflection</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Write about your experiences, thoughts, and feelings..."
                          className="min-h-32"
                          {...field}
                          data-testid="input-content"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-4">
                  <FormField
                    control={createForm.control}
                    name="keyLearnings"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Lightbulb className="h-4 w-4" />
                          Key Learnings
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="What did you learn today?"
                            className="min-h-20"
                            {...field}
                            data-testid="input-learnings"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={createForm.control}
                    name="challenges"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <AlertCircle className="h-4 w-4" />
                          Challenges
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="What challenges did you face?"
                            className="min-h-20"
                            {...field}
                            data-testid="input-challenges"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={createForm.control}
                    name="nextSteps"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Target className="h-4 w-4" />
                          Next Steps
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="What are your next steps?"
                            className="min-h-20"
                            {...field}
                            data-testid="input-next-steps"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={createForm.control}
                  name="tags"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tags</FormLabel>
                      <FormControl>
                        <Input placeholder="leadership, communication, growth (comma separated)" {...field} data-testid="input-tags" />
                      </FormControl>
                      <FormDescription>Add tags to organize your entries</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending} data-testid="button-save-entry">
                    {createMutation.isPending ? "Saving..." : "Save Entry"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Journal Entry</DialogTitle>
            </DialogHeader>
            <Form {...editForm}>
              <form
                onSubmit={editForm.handleSubmit(data => {
                  if (selectedEntry) {
                    updateMutation.mutate({ id: selectedEntry.id, data });
                  }
                })}
                className="space-y-4"
              >
                <FormField
                  control={editForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={editForm.control}
                    name="mood"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mood</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select mood" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {MOOD_OPTIONS.map(option => (
                              <SelectItem key={option.value} value={option.value}>
                                <div className="flex items-center gap-2">
                                  <option.icon className={`h-4 w-4 ${option.color}`} />
                                  {option.label}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editForm.control}
                    name="visibility"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Visibility</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {VISIBILITY_OPTIONS.map(option => (
                              <SelectItem key={option.value} value={option.value}>
                                <div className="flex items-center gap-2">
                                  <option.icon className="h-4 w-4" />
                                  {option.label}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={editForm.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reflection</FormLabel>
                      <FormControl>
                        <Textarea className="min-h-32" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="keyLearnings"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Key Learnings</FormLabel>
                      <FormControl>
                        <Textarea className="min-h-20" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="challenges"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Challenges</FormLabel>
                      <FormControl>
                        <Textarea className="min-h-20" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="nextSteps"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Next Steps</FormLabel>
                      <FormControl>
                        <Textarea className="min-h-20" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="tags"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tags</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={updateMutation.isPending}>
                    {updateMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Journal Entry</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{selectedEntry?.title}"? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => selectedEntry && deleteMutation.mutate(selectedEntry.id)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Dialog open={isFeedbackOpen} onOpenChange={setIsFeedbackOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Mentor Feedback</DialogTitle>
              <DialogDescription>
                Provide feedback on {selectedEntry?.user?.firstName}'s journal entry
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Your Feedback</Label>
                <Textarea
                  value={feedbackText}
                  onChange={e => setFeedbackText(e.target.value)}
                  placeholder="Share your thoughts, encouragement, or suggestions..."
                  className="min-h-32 mt-2"
                  data-testid="input-feedback"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsFeedbackOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => selectedEntry && feedbackMutation.mutate({ id: selectedEntry.id, feedback: feedbackText })}
                disabled={feedbackMutation.isPending || !feedbackText.trim()}
                data-testid="button-send-feedback"
              >
                <Send className="mr-2 h-4 w-4" />
                {feedbackMutation.isPending ? "Sending..." : "Send Feedback"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}

function JournalList({
  entries,
  loading,
  onEdit,
  onDelete,
}: {
  entries: JournalEntry[];
  loading: boolean;
  onEdit: (entry: JournalEntry) => void;
  onDelete: (entry: JournalEntry) => void;
}) {
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-48 w-full" />
        ))}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-medium mb-2">Start Your Journey</h3>
          <p className="text-muted-foreground mb-4">
            Create your first journal entry to track your mentorship growth
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      {entries.map(entry => (
        <JournalCard key={entry.id} entry={entry} onEdit={() => onEdit(entry)} onDelete={() => onDelete(entry)} />
      ))}
    </div>
  );
}

function JournalCard({
  entry,
  showAuthor,
  onEdit,
  onDelete,
  onFeedback,
  isMentor,
}: {
  entry: JournalEntryWithUser;
  showAuthor?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onFeedback?: () => void;
  isMentor?: boolean;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card className="hover-elevate">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {showAuthor && entry.user && (
              <div className="flex items-center gap-2 mb-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={entry.user.profileImage || undefined} />
                  <AvatarFallback>
                    {entry.user.firstName?.[0]}{entry.user.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm text-muted-foreground">
                  {entry.user.firstName} {entry.user.lastName}
                </span>
              </div>
            )}
            <CardTitle className="text-lg flex items-center gap-2">
              {getMoodIcon(entry.mood)}
              {entry.title}
            </CardTitle>
            <CardDescription className="flex items-center gap-2 mt-1">
              <Calendar className="h-3 w-3" />
              {formatDate(entry.createdAt)}
              {getVisibilityBadge(entry.visibility)}
            </CardDescription>
          </div>
          {(onEdit || onDelete) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onEdit && (
                  <DropdownMenuItem onClick={onEdit}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem onClick={onDelete} className="text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className={`text-sm whitespace-pre-wrap ${!isExpanded && entry.content.length > 300 ? "line-clamp-4" : ""}`}>
          {entry.content}
        </p>
        
        {entry.content.length > 300 && (
          <Button variant="ghost" size="sm" onClick={() => setIsExpanded(!isExpanded)}>
            {isExpanded ? "Show less" : "Read more"}
          </Button>
        )}

        {(entry.keyLearnings || entry.challenges || entry.nextSteps) && (
          <div className="grid gap-3 pt-2 border-t">
            {entry.keyLearnings && (
              <div>
                <p className="text-xs font-medium text-muted-foreground flex items-center gap-1 mb-1">
                  <Lightbulb className="h-3 w-3" /> Key Learnings
                </p>
                <p className="text-sm">{entry.keyLearnings}</p>
              </div>
            )}
            {entry.challenges && (
              <div>
                <p className="text-xs font-medium text-muted-foreground flex items-center gap-1 mb-1">
                  <AlertCircle className="h-3 w-3" /> Challenges
                </p>
                <p className="text-sm">{entry.challenges}</p>
              </div>
            )}
            {entry.nextSteps && (
              <div>
                <p className="text-xs font-medium text-muted-foreground flex items-center gap-1 mb-1">
                  <Target className="h-3 w-3" /> Next Steps
                </p>
                <p className="text-sm">{entry.nextSteps}</p>
              </div>
            )}
          </div>
        )}

        {entry.tags && entry.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-2">
            {entry.tags.map((tag, i) => (
              <Badge key={i} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {entry.mentorFeedback && (
          <div className="mt-4 p-3 bg-primary/5 rounded-lg border border-primary/10">
            <p className="text-xs font-medium text-primary flex items-center gap-1 mb-1">
              <MessageSquare className="h-3 w-3" /> Mentor Feedback
            </p>
            <p className="text-sm">{entry.mentorFeedback}</p>
            {entry.mentorFeedbackAt && (
              <p className="text-xs text-muted-foreground mt-1">{formatDate(entry.mentorFeedbackAt)}</p>
            )}
          </div>
        )}
      </CardContent>
      {isMentor && onFeedback && (
        <CardFooter className="pt-0">
          <Button variant="outline" size="sm" onClick={onFeedback} data-testid={`button-feedback-${entry.id}`}>
            <MessageSquare className="mr-2 h-4 w-4" />
            {entry.mentorFeedback ? "Update Feedback" : "Add Feedback"}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
