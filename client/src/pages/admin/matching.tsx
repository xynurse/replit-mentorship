import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams } from "wouter";
import { 
  Loader2, Users, UserCheck, GraduationCap, Check, X, AlertTriangle,
  ArrowRight, Settings2, RefreshCw, ChevronDown, ChevronUp
} from "lucide-react";
import { AdminLayout } from "@/components/layouts/admin-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Cohort, User } from "@shared/schema";

type ParticipantWithUser = {
  id: string;
  userId: string;
  user: User;
  responses?: Array<{ questionId: string; response: string }>;
};

type CompatibilityResult = {
  mentorId: string;
  menteeId: string;
  score: number;
  breakdown: Record<string, number>;
  flags: string[];
  matchReason: string;
};

type AutoMatchResult = {
  mentors: ParticipantWithUser[];
  mentees: ParticipantWithUser[];
  compatibilityMatrix: CompatibilityResult[];
  config: Record<string, number | boolean>;
};

export default function AdminMatchingPage() {
  const { cohortId } = useParams<{ cohortId: string }>();
  const { toast } = useToast();
  const [selectedMentor, setSelectedMentor] = useState<ParticipantWithUser | null>(null);
  const [selectedMentee, setSelectedMentee] = useState<ParticipantWithUser | null>(null);
  const [showConfigPanel, setShowConfigPanel] = useState(false);
  const [confirmMatchDialog, setConfirmMatchDialog] = useState(false);
  const [matchToCreate, setMatchToCreate] = useState<CompatibilityResult | null>(null);

  const { data: cohort } = useQuery<Cohort>({
    queryKey: ['/api/cohorts', cohortId],
    enabled: !!cohortId,
  });

  const { data: matchData, isLoading, refetch } = useQuery<AutoMatchResult>({
    queryKey: ['/api/cohorts', cohortId, 'auto-match'],
    queryFn: async () => {
      const res = await apiRequest('POST', `/api/cohorts/${cohortId}/auto-match`, {});
      return res.json();
    },
    enabled: !!cohortId,
  });

  const createMatchMutation = useMutation({
    mutationFn: async (data: { mentorMembershipId: string; menteeMembershipId: string; matchScore: number; matchReason: string }) => {
      const res = await apiRequest('POST', `/api/cohorts/${cohortId}/matches`, data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Match Created",
        description: "The mentorship match has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/cohorts', cohortId, 'auto-match'] });
      setConfirmMatchDialog(false);
      setMatchToCreate(null);
      setSelectedMentor(null);
      setSelectedMentee(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create match",
        variant: "destructive",
      });
    },
  });

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    if (score >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-500/10';
    if (score >= 60) return 'bg-yellow-500/10';
    if (score >= 40) return 'bg-orange-500/10';
    return 'bg-red-500/10';
  };

  const selectedCompatibility = useMemo(() => {
    if (!selectedMentor || !selectedMentee || !matchData?.compatibilityMatrix) return null;
    return matchData.compatibilityMatrix.find(
      c => c.mentorId === selectedMentor.id && c.menteeId === selectedMentee.id
    );
  }, [selectedMentor, selectedMentee, matchData]);

  const handleCreateMatch = () => {
    if (!selectedMentor || !selectedMentee || !selectedCompatibility) return;
    setMatchToCreate(selectedCompatibility);
    setConfirmMatchDialog(true);
  };

  const confirmMatch = () => {
    if (!matchToCreate || !selectedMentor || !selectedMentee) return;
    createMatchMutation.mutate({
      mentorMembershipId: selectedMentor.id,
      menteeMembershipId: selectedMentee.id,
      matchScore: matchToCreate.score,
      matchReason: matchToCreate.matchReason,
    });
  };

  const getMentorCompatibilities = (mentorId: string) => {
    return matchData?.compatibilityMatrix.filter(c => c.mentorId === mentorId) || [];
  };

  const getMenteeCompatibilities = (menteeId: string) => {
    return matchData?.compatibilityMatrix.filter(c => c.menteeId === menteeId) || [];
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  const mentors = matchData?.mentors || [];
  const mentees = matchData?.mentees || [];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold" data-testid="text-page-title">Matching</h1>
            <p className="text-muted-foreground mt-1">
              {cohort?.name ? `Match mentors and mentees for ${cohort.name}` : 'Match mentors and mentees'}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={() => refetch()} data-testid="button-refresh">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowConfigPanel(!showConfigPanel)} data-testid="button-config">
              <Settings2 className="h-4 w-4 mr-2" />
              Config
            </Button>
          </div>
        </div>

        <Collapsible open={showConfigPanel} onOpenChange={setShowConfigPanel}>
          <CollapsibleContent>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg">Matching Configuration</CardTitle>
                <CardDescription>Adjust weights for compatibility scoring</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  { label: 'Language Match', key: 'languageWeight', value: matchData?.config?.languageWeight || 25 },
                  { label: 'Track Alignment', key: 'trackWeight', value: matchData?.config?.trackWeight || 20 },
                  { label: 'Expertise/Interest', key: 'expertiseWeight', value: matchData?.config?.expertiseWeight || 25 },
                  { label: 'Availability', key: 'availabilityWeight', value: matchData?.config?.availabilityWeight || 15 },
                  { label: 'Experience Gap', key: 'experienceWeight', value: matchData?.config?.experienceWeight || 10 },
                  { label: 'Communication', key: 'communicationWeight', value: matchData?.config?.communicationWeight || 5 },
                ].map((item) => (
                  <div key={item.key} className="space-y-2">
                    <div className="flex justify-between">
                      <Label className="text-sm">{item.label}</Label>
                      <span className="text-sm text-muted-foreground">{item.value}%</span>
                    </div>
                    <Slider
                      value={[Number(item.value)]}
                      max={100}
                      step={5}
                      disabled
                      className="opacity-70"
                    />
                  </div>
                ))}
                <div className="flex items-center gap-2">
                  <Switch checked={Boolean(matchData?.config?.requireLanguageMatch)} disabled />
                  <Label className="text-sm">Require Language Match</Label>
                </div>
              </CardContent>
            </Card>
          </CollapsibleContent>
        </Collapsible>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <UserCheck className="h-4 w-4" />
                Mentors
              </CardTitle>
              <CardDescription>{mentors.length} available</CardDescription>
            </CardHeader>
            <CardContent className="max-h-[400px] overflow-y-auto space-y-2">
              {mentors.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No unmatched mentors</p>
              ) : (
                mentors.map((mentor) => {
                  const compatibilities = getMentorCompatibilities(mentor.id);
                  const bestScore = compatibilities.length > 0 
                    ? Math.max(...compatibilities.map(c => c.score)) 
                    : 0;
                  
                  return (
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
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-sm">
                            {mentor.user.firstName} {mentor.user.lastName}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {mentor.user.jobTitle || 'Healthcare Professional'}
                          </div>
                        </div>
                        {bestScore > 0 && (
                          <Badge variant="secondary" className={cn("text-xs", getScoreBgColor(bestScore))}>
                            {bestScore}%
                          </Badge>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <ArrowRight className="h-4 w-4" />
                Compatibility
              </CardTitle>
              <CardDescription>
                {selectedMentor && selectedMentee ? 'Match details' : 'Select participants'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedMentor && selectedMentee ? (
                selectedCompatibility ? (
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className={cn(
                        "inline-flex items-center justify-center w-20 h-20 rounded-full text-2xl font-bold text-white mb-2",
                        getScoreColor(selectedCompatibility.score)
                      )}>
                        {selectedCompatibility.score}%
                      </div>
                      <p className="text-sm text-muted-foreground">Compatibility Score</p>
                    </div>

                    <Separator />

                    <div className="space-y-3">
                      <h4 className="text-sm font-medium">Score Breakdown</h4>
                      {Object.entries(selectedCompatibility.breakdown).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between text-sm">
                          <span className="capitalize text-muted-foreground">{key}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                              <div 
                                className={cn("h-full", getScoreColor(value))}
                                style={{ width: `${value}%` }}
                              />
                            </div>
                            <span className="w-8 text-right">{value}%</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {selectedCompatibility.flags.length > 0 && (
                      <>
                        <Separator />
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3 text-yellow-500" />
                            Warnings
                          </h4>
                          {selectedCompatibility.flags.map((flag) => (
                            <Badge key={flag} variant="secondary" className="bg-yellow-500/10 text-yellow-700">
                              {flag.replace(/_/g, ' ')}
                            </Badge>
                          ))}
                        </div>
                      </>
                    )}

                    {selectedCompatibility.matchReason && (
                      <>
                        <Separator />
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium">Match Reasons</h4>
                          <p className="text-xs text-muted-foreground">
                            {selectedCompatibility.matchReason}
                          </p>
                        </div>
                      </>
                    )}

                    <Button 
                      className="w-full" 
                      onClick={handleCreateMatch}
                      disabled={selectedCompatibility.flags.includes('no_language_match') && Boolean(matchData?.config?.requireLanguageMatch)}
                      data-testid="button-create-match"
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Create Match
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <X className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">These participants don't meet the minimum compatibility threshold</p>
                  </div>
                )
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Select a mentor and mentee to see compatibility</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <GraduationCap className="h-4 w-4" />
                Mentees
              </CardTitle>
              <CardDescription>{mentees.length} available</CardDescription>
            </CardHeader>
            <CardContent className="max-h-[400px] overflow-y-auto space-y-2">
              {mentees.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No unmatched mentees</p>
              ) : (
                mentees.map((mentee) => {
                  const compatibilities = getMenteeCompatibilities(mentee.id);
                  const compatWithMentor = selectedMentor
                    ? compatibilities.find(c => c.mentorId === selectedMentor.id)
                    : null;
                  
                  return (
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
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-sm">
                            {mentee.user.firstName} {mentee.user.lastName}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {mentee.user.jobTitle || 'Healthcare Professional'}
                          </div>
                        </div>
                        {compatWithMentor && (
                          <Badge variant="secondary" className={cn("text-xs", getScoreBgColor(compatWithMentor.score))}>
                            {compatWithMentor.score}%
                          </Badge>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>

        {matchData?.compatibilityMatrix && matchData.compatibilityMatrix.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Compatibility Matrix</CardTitle>
              <CardDescription>Top suggested matches based on compatibility scoring</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {matchData.compatibilityMatrix.slice(0, 10).map((match, idx) => {
                  const mentor = mentors.find(m => m.id === match.mentorId);
                  const mentee = mentees.find(m => m.id === match.menteeId);
                  if (!mentor || !mentee) return null;

                  return (
                    <button
                      key={`${match.mentorId}-${match.menteeId}`}
                      onClick={() => {
                        setSelectedMentor(mentor);
                        setSelectedMentee(mentee);
                      }}
                      className={cn(
                        "w-full p-3 rounded-md border text-left transition-all flex items-center justify-between gap-4",
                        selectedMentor?.id === match.mentorId && selectedMentee?.id === match.menteeId
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      )}
                      data-testid={`button-match-suggestion-${idx}`}
                    >
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <Badge variant="outline" className="shrink-0">#{idx + 1}</Badge>
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <span className="font-medium truncate">
                            {mentor.user.firstName} {mentor.user.lastName}
                          </span>
                          <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                          <span className="truncate">
                            {mentee.user.firstName} {mentee.user.lastName}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {match.flags.length > 0 && (
                          <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        )}
                        <Badge className={cn("text-white", getScoreColor(match.score))}>
                          {match.score}%
                        </Badge>
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={confirmMatchDialog} onOpenChange={setConfirmMatchDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Match</DialogTitle>
            <DialogDescription>
              Are you sure you want to create this mentorship match?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {selectedMentor && selectedMentee && (
              <div className="flex items-center justify-center gap-4">
                <div className="text-center">
                  <div className="font-medium">{selectedMentor.user.firstName} {selectedMentor.user.lastName}</div>
                  <div className="text-sm text-muted-foreground">Mentor</div>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
                <div className="text-center">
                  <div className="font-medium">{selectedMentee.user.firstName} {selectedMentee.user.lastName}</div>
                  <div className="text-sm text-muted-foreground">Mentee</div>
                </div>
              </div>
            )}
            {matchToCreate && (
              <div className="mt-4 text-center">
                <Badge className={cn("text-white", getScoreColor(matchToCreate.score))}>
                  {matchToCreate.score}% Compatibility
                </Badge>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmMatchDialog(false)} data-testid="button-cancel-match">
              Cancel
            </Button>
            <Button onClick={confirmMatch} disabled={createMatchMutation.isPending} data-testid="button-confirm-match">
              {createMatchMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Confirm Match
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
