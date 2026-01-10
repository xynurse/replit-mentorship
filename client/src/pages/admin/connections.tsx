import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  Loader2, Users, UserCheck, GraduationCap, Check, X, Search,
  ArrowRight, Trash2, Eye, MoreHorizontal, Plus, RefreshCw
} from "lucide-react";
import { AdminLayout } from "@/components/layouts/admin-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { User, MentorshipMatch } from "@shared/schema";

type MatchWithDetails = MentorshipMatch & {
  mentor: User;
  mentee: User;
  cohort?: { id: string; name: string };
};

const statusColors: Record<string, string> = {
  PROPOSED: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
  ACTIVE: "bg-green-500/10 text-green-700 dark:text-green-400",
  PAUSED: "bg-orange-500/10 text-orange-700 dark:text-orange-400",
  COMPLETED: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  TERMINATED: "bg-red-500/10 text-red-700 dark:text-red-400",
};

export default function AdminConnectionsPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("matches");
  const [mentorSearch, setMentorSearch] = useState("");
  const [menteeSearch, setMenteeSearch] = useState("");
  const [matchSearch, setMatchSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedMentor, setSelectedMentor] = useState<User | null>(null);
  const [selectedMentee, setSelectedMentee] = useState<User | null>(null);
  const [confirmMatchDialog, setConfirmMatchDialog] = useState(false);
  const [matchToDelete, setMatchToDelete] = useState<MatchWithDetails | null>(null);
  const [matchToView, setMatchToView] = useState<MatchWithDetails | null>(null);

  const { data: mentors = [], isLoading: mentorsLoading } = useQuery<User[]>({
    queryKey: ['/api/admin/matches/available-mentors'],
  });

  const { data: mentees = [], isLoading: menteesLoading } = useQuery<User[]>({
    queryKey: ['/api/admin/matches/available-mentees'],
  });

  const { data: matches = [], isLoading: matchesLoading, refetch: refetchMatches } = useQuery<MatchWithDetails[]>({
    queryKey: ['/api/admin/matches'],
  });

  const createMatchMutation = useMutation({
    mutationFn: async (data: { mentorId: string; menteeId: string }) => {
      const res = await apiRequest('POST', '/api/admin/matches', data);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to create match');
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Match Created",
        description: "The mentor-mentee connection has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/matches'] });
      setConfirmMatchDialog(false);
      setSelectedMentor(null);
      setSelectedMentee(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMatchMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await apiRequest('PATCH', `/api/matches/${id}`, { status });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to update match');
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Match Updated",
        description: "The match status has been updated.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/matches'] });
      setMatchToView(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMatchMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest('DELETE', `/api/admin/matches/${id}`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to delete match');
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Match Deleted",
        description: "The mentor-mentee connection has been removed.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/matches'] });
      setMatchToDelete(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const filteredMentors = useMemo(() => {
    if (!mentorSearch) return mentors;
    const search = mentorSearch.toLowerCase();
    return mentors.filter(m => 
      `${m.firstName} ${m.lastName}`.toLowerCase().includes(search) ||
      m.email.toLowerCase().includes(search)
    );
  }, [mentors, mentorSearch]);

  const filteredMentees = useMemo(() => {
    if (!menteeSearch) return mentees;
    const search = menteeSearch.toLowerCase();
    return mentees.filter(m => 
      `${m.firstName} ${m.lastName}`.toLowerCase().includes(search) ||
      m.email.toLowerCase().includes(search)
    );
  }, [mentees, menteeSearch]);

  const filteredMatches = useMemo(() => {
    let filtered = matches;
    
    if (statusFilter !== "all") {
      filtered = filtered.filter(m => m.status === statusFilter);
    }
    
    if (matchSearch) {
      const search = matchSearch.toLowerCase();
      filtered = filtered.filter(m => 
        `${m.mentor?.firstName} ${m.mentor?.lastName}`.toLowerCase().includes(search) ||
        `${m.mentee?.firstName} ${m.mentee?.lastName}`.toLowerCase().includes(search) ||
        m.mentor?.email?.toLowerCase().includes(search) ||
        m.mentee?.email?.toLowerCase().includes(search)
      );
    }
    
    return filtered;
  }, [matches, statusFilter, matchSearch]);

  const handleCreateMatch = () => {
    if (!selectedMentor || !selectedMentee) return;
    setConfirmMatchDialog(true);
  };

  const confirmMatch = () => {
    if (!selectedMentor || !selectedMentee) return;
    createMatchMutation.mutate({
      mentorId: selectedMentor.id,
      menteeId: selectedMentee.id,
    });
  };

  const getInitials = (user: User) => {
    return `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase();
  };

  const isLoading = mentorsLoading || menteesLoading || matchesLoading;

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold" data-testid="text-page-title">Mentor-Mentee Connections</h1>
            <p className="text-muted-foreground mt-1">
              Easily connect mentors with mentees and manage their relationships
            </p>
          </div>
          <Button onClick={() => refetchMatches()} variant="outline" size="sm" data-testid="button-refresh">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-md bg-blue-500/10">
                <UserCheck className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{mentors.length}</p>
                <p className="text-xs text-muted-foreground">Available Mentors</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-md bg-purple-500/10">
                <GraduationCap className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{mentees.length}</p>
                <p className="text-xs text-muted-foreground">Available Mentees</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-md bg-green-500/10">
                <Users className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{matches.filter(m => m.status === 'ACTIVE').length}</p>
                <p className="text-xs text-muted-foreground">Active Connections</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-md bg-gray-500/10">
                <Users className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{matches.length}</p>
                <p className="text-xs text-muted-foreground">Total Connections</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="matches" data-testid="tab-matches">
              <Users className="h-4 w-4 mr-2" />
              All Connections
            </TabsTrigger>
            <TabsTrigger value="create" data-testid="tab-create">
              <Plus className="h-4 w-4 mr-2" />
              Create Connection
            </TabsTrigger>
          </TabsList>

          <TabsContent value="matches" className="mt-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
                  <div>
                    <CardTitle className="text-lg">All Connections</CardTitle>
                    <CardDescription>View and manage mentor-mentee relationships</CardDescription>
                  </div>
                  <div className="flex flex-col md:flex-row gap-2">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search connections..."
                        value={matchSearch}
                        onChange={(e) => setMatchSearch(e.target.value)}
                        className="pl-8 w-full md:w-[200px]"
                        data-testid="input-search-matches"
                      />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-full md:w-[140px]" data-testid="select-status-filter">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="ACTIVE">Active</SelectItem>
                        <SelectItem value="PROPOSED">Proposed</SelectItem>
                        <SelectItem value="PAUSED">Paused</SelectItem>
                        <SelectItem value="COMPLETED">Completed</SelectItem>
                        <SelectItem value="TERMINATED">Terminated</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {filteredMatches.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No connections found</p>
                    <p className="text-sm">Create a new connection in the "Create Connection" tab</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredMatches.map((match) => (
                      <div
                        key={match.id}
                        className="flex items-center justify-between p-4 border rounded-md hover-elevate"
                        data-testid={`match-row-${match.id}`}
                      >
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-9 w-9">
                                <AvatarImage src={match.mentor?.profileImage || undefined} />
                                <AvatarFallback className="bg-blue-500/10 text-blue-700">
                                  {match.mentor ? getInitials(match.mentor) : '?'}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <p className="font-medium text-sm truncate">
                                  {match.mentor?.firstName} {match.mentor?.lastName}
                                </p>
                                <p className="text-xs text-muted-foreground">Mentor</p>
                              </div>
                            </div>
                            
                            <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                            
                            <div className="flex items-center gap-2">
                              <Avatar className="h-9 w-9">
                                <AvatarImage src={match.mentee?.profileImage || undefined} />
                                <AvatarFallback className="bg-purple-500/10 text-purple-700">
                                  {match.mentee ? getInitials(match.mentee) : '?'}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <p className="font-medium text-sm truncate">
                                  {match.mentee?.firstName} {match.mentee?.lastName}
                                </p>
                                <p className="text-xs text-muted-foreground">Mentee</p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="hidden md:flex items-center gap-2 shrink-0">
                            <Badge className={cn("text-xs", statusColors[match.status || 'ACTIVE'])}>
                              {match.status || 'ACTIVE'}
                            </Badge>
                            {match.cohort && (
                              <Badge variant="outline" className="text-xs">
                                {match.cohort.name}
                              </Badge>
                            )}
                          </div>
                        </div>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" data-testid={`button-match-menu-${match.id}`}>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setMatchToView(match)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => setMatchToDelete(match)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Connection
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="create" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <UserCheck className="h-4 w-4" />
                    Select Mentor
                  </CardTitle>
                  <CardDescription>{mentors.length} available</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search mentors..."
                      value={mentorSearch}
                      onChange={(e) => setMentorSearch(e.target.value)}
                      className="pl-8"
                      data-testid="input-search-mentors"
                    />
                  </div>
                  <div className="max-h-[350px] overflow-y-auto space-y-2">
                    {filteredMentors.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">No mentors found</p>
                    ) : (
                      filteredMentors.map((mentor) => (
                        <button
                          key={mentor.id}
                          onClick={() => setSelectedMentor(mentor)}
                          className={cn(
                            "w-full p-3 rounded-md border text-left transition-all",
                            selectedMentor?.id === mentor.id
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50"
                          )}
                          data-testid={`button-mentor-${mentor.id}`}
                        >
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                              <AvatarImage src={mentor.profileImage || undefined} />
                              <AvatarFallback className="bg-blue-500/10 text-blue-700">
                                {getInitials(mentor)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                              <div className="font-medium text-sm truncate">
                                {mentor.firstName} {mentor.lastName}
                              </div>
                              <div className="text-xs text-muted-foreground truncate">
                                {mentor.jobTitle || mentor.email}
                              </div>
                            </div>
                            {selectedMentor?.id === mentor.id && (
                              <Check className="h-4 w-4 text-primary shrink-0" />
                            )}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <ArrowRight className="h-4 w-4" />
                    Connection Preview
                  </CardTitle>
                  <CardDescription>
                    {selectedMentor && selectedMentee ? 'Ready to connect' : 'Select both participants'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {selectedMentor && selectedMentee ? (
                    <div className="space-y-4">
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-4 mb-4">
                          <div className="text-center">
                            <Avatar className="h-14 w-14 mx-auto mb-2">
                              <AvatarImage src={selectedMentor.profileImage || undefined} />
                              <AvatarFallback className="bg-blue-500/10 text-blue-700 text-lg">
                                {getInitials(selectedMentor)}
                              </AvatarFallback>
                            </Avatar>
                            <p className="font-medium text-sm">{selectedMentor.firstName}</p>
                            <p className="text-xs text-muted-foreground">Mentor</p>
                          </div>
                          <ArrowRight className="h-5 w-5 text-muted-foreground" />
                          <div className="text-center">
                            <Avatar className="h-14 w-14 mx-auto mb-2">
                              <AvatarImage src={selectedMentee.profileImage || undefined} />
                              <AvatarFallback className="bg-purple-500/10 text-purple-700 text-lg">
                                {getInitials(selectedMentee)}
                              </AvatarFallback>
                            </Avatar>
                            <p className="font-medium text-sm">{selectedMentee.firstName}</p>
                            <p className="text-xs text-muted-foreground">Mentee</p>
                          </div>
                        </div>
                      </div>

                      <Separator />

                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Mentor</span>
                          <span>{selectedMentor.firstName} {selectedMentor.lastName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Mentee</span>
                          <span>{selectedMentee.firstName} {selectedMentee.lastName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Status</span>
                          <Badge className="bg-green-500/10 text-green-700">Active</Badge>
                        </div>
                      </div>

                      <Button 
                        className="w-full" 
                        onClick={handleCreateMatch}
                        data-testid="button-create-match"
                      >
                        <Check className="h-4 w-4 mr-2" />
                        Create Connection
                      </Button>

                      <Button 
                        variant="outline"
                        className="w-full" 
                        onClick={() => {
                          setSelectedMentor(null);
                          setSelectedMentee(null);
                        }}
                        data-testid="button-clear-selection"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Clear Selection
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p className="text-sm">Select a mentor and mentee from the lists to create a connection</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <GraduationCap className="h-4 w-4" />
                    Select Mentee
                  </CardTitle>
                  <CardDescription>{mentees.length} available</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search mentees..."
                      value={menteeSearch}
                      onChange={(e) => setMenteeSearch(e.target.value)}
                      className="pl-8"
                      data-testid="input-search-mentees"
                    />
                  </div>
                  <div className="max-h-[350px] overflow-y-auto space-y-2">
                    {filteredMentees.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">No mentees found</p>
                    ) : (
                      filteredMentees.map((mentee) => (
                        <button
                          key={mentee.id}
                          onClick={() => setSelectedMentee(mentee)}
                          className={cn(
                            "w-full p-3 rounded-md border text-left transition-all",
                            selectedMentee?.id === mentee.id
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50"
                          )}
                          data-testid={`button-mentee-${mentee.id}`}
                        >
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                              <AvatarImage src={mentee.profileImage || undefined} />
                              <AvatarFallback className="bg-purple-500/10 text-purple-700">
                                {getInitials(mentee)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                              <div className="font-medium text-sm truncate">
                                {mentee.firstName} {mentee.lastName}
                              </div>
                              <div className="text-xs text-muted-foreground truncate">
                                {mentee.jobTitle || mentee.email}
                              </div>
                            </div>
                            {selectedMentee?.id === mentee.id && (
                              <Check className="h-4 w-4 text-primary shrink-0" />
                            )}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={confirmMatchDialog} onOpenChange={setConfirmMatchDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Connection</DialogTitle>
            <DialogDescription>
              Are you sure you want to create this mentor-mentee connection?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {selectedMentor && selectedMentee && (
              <div className="flex items-center justify-center gap-4">
                <div className="text-center">
                  <Avatar className="h-12 w-12 mx-auto mb-2">
                    <AvatarImage src={selectedMentor.profileImage || undefined} />
                    <AvatarFallback className="bg-blue-500/10 text-blue-700">
                      {getInitials(selectedMentor)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="font-medium text-sm">{selectedMentor.firstName} {selectedMentor.lastName}</div>
                  <div className="text-xs text-muted-foreground">Mentor</div>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
                <div className="text-center">
                  <Avatar className="h-12 w-12 mx-auto mb-2">
                    <AvatarImage src={selectedMentee.profileImage || undefined} />
                    <AvatarFallback className="bg-purple-500/10 text-purple-700">
                      {getInitials(selectedMentee)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="font-medium text-sm">{selectedMentee.firstName} {selectedMentee.lastName}</div>
                  <div className="text-xs text-muted-foreground">Mentee</div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmMatchDialog(false)} data-testid="button-cancel-match">
              Cancel
            </Button>
            <Button onClick={confirmMatch} disabled={createMatchMutation.isPending} data-testid="button-confirm-match">
              {createMatchMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Connection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!matchToView} onOpenChange={(open) => !open && setMatchToView(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Connection Details</DialogTitle>
          </DialogHeader>
          {matchToView && (
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-4 py-4">
                <div className="text-center">
                  <Avatar className="h-14 w-14 mx-auto mb-2">
                    <AvatarImage src={matchToView.mentor?.profileImage || undefined} />
                    <AvatarFallback className="bg-blue-500/10 text-blue-700 text-lg">
                      {matchToView.mentor ? getInitials(matchToView.mentor) : '?'}
                    </AvatarFallback>
                  </Avatar>
                  <p className="font-medium text-sm">{matchToView.mentor?.firstName} {matchToView.mentor?.lastName}</p>
                  <p className="text-xs text-muted-foreground">Mentor</p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
                <div className="text-center">
                  <Avatar className="h-14 w-14 mx-auto mb-2">
                    <AvatarImage src={matchToView.mentee?.profileImage || undefined} />
                    <AvatarFallback className="bg-purple-500/10 text-purple-700 text-lg">
                      {matchToView.mentee ? getInitials(matchToView.mentee) : '?'}
                    </AvatarFallback>
                  </Avatar>
                  <p className="font-medium text-sm">{matchToView.mentee?.firstName} {matchToView.mentee?.lastName}</p>
                  <p className="text-xs text-muted-foreground">Mentee</p>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <Badge className={cn(statusColors[matchToView.status || 'ACTIVE'])}>
                    {matchToView.status || 'ACTIVE'}
                  </Badge>
                </div>
                {matchToView.cohort && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Cohort</span>
                    <span className="text-sm">{matchToView.cohort.name}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Created</span>
                  <span className="text-sm">
                    {matchToView.createdAt ? new Date(matchToView.createdAt).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <p className="text-sm font-medium">Change Status</p>
                <div className="flex flex-wrap gap-2">
                  {['ACTIVE', 'PAUSED', 'COMPLETED', 'TERMINATED'].map((status) => (
                    <Button
                      key={status}
                      variant={matchToView.status === status ? "default" : "outline"}
                      size="sm"
                      disabled={matchToView.status === status || updateMatchMutation.isPending}
                      onClick={() => updateMatchMutation.mutate({ id: matchToView.id, status })}
                      data-testid={`button-status-${status.toLowerCase()}`}
                    >
                      {status}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!matchToDelete} onOpenChange={(open) => !open && setMatchToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Connection</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the connection between{' '}
              <strong>{matchToDelete?.mentor?.firstName} {matchToDelete?.mentor?.lastName}</strong> and{' '}
              <strong>{matchToDelete?.mentee?.firstName} {matchToDelete?.mentee?.lastName}</strong>?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => matchToDelete && deleteMatchMutation.mutate(matchToDelete.id)}
              className="bg-red-600 hover:bg-red-700"
              data-testid="button-confirm-delete"
            >
              {deleteMatchMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
