import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useLocation, useParams } from "wouter";
import { Loader2, CheckCircle2, ChevronRight, ChevronLeft, UserCheck, GraduationCap, AlertCircle } from "lucide-react";
import { useState, useMemo } from "react";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import type { ApplicationQuestion, Track } from "@shared/schema";

type QuestionGroup = {
  title: string;
  description: string;
  questions: ApplicationQuestion[];
};

export default function ApplyPage() {
  const { cohortId } = useParams<{ cohortId: string }>();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedRole, setSelectedRole] = useState<'MENTOR' | 'MENTEE' | null>(null);
  const [selectedTrack, setSelectedTrack] = useState<string | null>(null);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  const { data: cohort, isLoading: cohortLoading, error: cohortError } = useQuery<{
    id: string;
    name: string;
    description: string;
    applicationDeadline: string;
    startDate: string;
    endDate: string;
  }>({
    queryKey: ['/api/public/cohorts', cohortId],
    enabled: !!cohortId,
  });

  const { data: questions, isLoading: questionsLoading } = useQuery<ApplicationQuestion[]>({
    queryKey: ['/api/cohorts', cohortId, 'questions', { forRole: selectedRole }],
    enabled: !!cohortId && !!selectedRole,
  });

  const { data: tracks } = useQuery<Track[]>({
    queryKey: ['/api/tracks'],
    enabled: !!user,
  });

  const submitMutation = useMutation({
    mutationFn: async (data: { role: string; trackId: string; responses: Array<{ questionId: string; response: string }> }) => {
      const res = await apiRequest('POST', `/api/cohorts/${cohortId}/apply`, data);
      return res.json();
    },
    onSuccess: () => {
      setIsSubmitted(true);
      toast({
        title: "Application Submitted",
        description: "Your application has been received. We'll review it and get back to you soon.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Submission Failed",
        description: error.message || "Failed to submit application. Please try again.",
        variant: "destructive",
      });
    },
  });

  const groupedQuestions = useMemo(() => {
    if (!questions) return [];
    
    const groups: QuestionGroup[] = [];
    let currentGroup: QuestionGroup | null = null;
    
    for (const q of questions) {
      const sectionName = q.section || 'Application Questions';
      if (!currentGroup || currentGroup.title !== sectionName) {
        if (currentGroup) {
          groups.push(currentGroup);
        }
        currentGroup = {
          title: sectionName,
          description: '',
          questions: [q],
        };
      } else {
        currentGroup.questions.push(q);
      }
    }
    
    if (currentGroup && currentGroup.questions.length > 0) {
      groups.push(currentGroup);
    }
    
    return groups;
  }, [questions]);

  const steps = useMemo(() => {
    const baseSteps = [
      { id: 'role', title: 'Select Role', description: 'Choose your role in the mentorship program' },
      { id: 'track', title: 'Select Track', description: 'Choose your focus area' },
    ];
    
    const questionSteps = groupedQuestions.map((group, idx) => ({
      id: `questions-${idx}`,
      title: group.title,
      description: group.description,
    }));
    
    return [
      ...baseSteps,
      ...questionSteps,
      { id: 'review', title: 'Review & Submit', description: 'Review your application' },
    ];
  }, [groupedQuestions]);

  const progress = ((currentStep + 1) / steps.length) * 100;

  const canProceed = () => {
    if (currentStep === 0) return !!selectedRole;
    if (currentStep === 1) return !!selectedTrack;
    
    if (currentStep >= 2 && currentStep < steps.length - 1) {
      const groupIndex = currentStep - 2;
      const group = groupedQuestions[groupIndex];
      if (!group) return true;
      
      for (const q of group.questions) {
        if (q.isRequired && !responses[q.id]) {
          return false;
        }
      }
    }
    
    return true;
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1 && canProceed()) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    if (!selectedRole || !selectedTrack) return;
    
    const formattedResponses = Object.entries(responses).map(([questionId, response]) => ({
      questionId,
      response,
    }));
    
    submitMutation.mutate({
      role: selectedRole,
      trackId: selectedTrack,
      responses: formattedResponses,
    });
  };

  const updateResponse = (questionId: string, value: string) => {
    setResponses(prev => ({ ...prev, [questionId]: value }));
  };

  const renderQuestionInput = (question: ApplicationQuestion) => {
    const value = responses[question.id] || '';
    
    switch (question.questionType) {
      case 'TEXT':
        return (
          <Input
            value={value}
            onChange={(e) => updateResponse(question.id, e.target.value)}
            placeholder="Enter your answer"
            data-testid={`input-question-${question.id}`}
          />
        );
      
      case 'TEXTAREA':
        return (
          <Textarea
            value={value}
            onChange={(e) => updateResponse(question.id, e.target.value)}
            placeholder="Enter your answer"
            className="min-h-[100px]"
            data-testid={`textarea-question-${question.id}`}
          />
        );
      
      case 'SELECT':
        const selectOptions = Array.isArray(question.options) ? question.options as string[] : [];
        return (
          <Select value={value} onValueChange={(v) => updateResponse(question.id, v)}>
            <SelectTrigger data-testid={`select-question-${question.id}`}>
              <SelectValue placeholder="Select an option" />
            </SelectTrigger>
            <SelectContent>
              {selectOptions.map((opt) => (
                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      
      case 'MULTISELECT':
        const multiOptions = Array.isArray(question.options) ? question.options as string[] : [];
        const selectedValues = value ? ((): string[] => { try { return JSON.parse(value); } catch { return []; } })() : [];
        return (
          <div className="space-y-2">
            {multiOptions.map((opt) => (
              <div key={opt} className="flex items-center space-x-2">
                <Checkbox
                  id={`${question.id}-${opt}`}
                  checked={selectedValues.includes(opt)}
                  onCheckedChange={(checked) => {
                    const newValues = checked 
                      ? [...selectedValues, opt]
                      : selectedValues.filter(v => v !== opt);
                    updateResponse(question.id, JSON.stringify(newValues));
                  }}
                  data-testid={`checkbox-question-${question.id}-${opt}`}
                />
                <label htmlFor={`${question.id}-${opt}`} className="text-sm">{opt}</label>
              </div>
            ))}
          </div>
        );
      
      case 'RATING':
        return (
          <RadioGroup
            value={value}
            onValueChange={(v) => updateResponse(question.id, v)}
            className="flex gap-4"
          >
            {[1, 2, 3, 4, 5].map((num) => (
              <div key={num} className="flex flex-col items-center">
                <RadioGroupItem
                  value={String(num)}
                  id={`${question.id}-${num}`}
                  data-testid={`radio-question-${question.id}-${num}`}
                />
                <label htmlFor={`${question.id}-${num}`} className="text-sm text-muted-foreground mt-1">
                  {num}
                </label>
              </div>
            ))}
          </RadioGroup>
        );
      
      case 'CHECKBOX':
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={question.id}
              checked={value === 'true'}
              onCheckedChange={(checked) => updateResponse(question.id, String(checked))}
              data-testid={`checkbox-question-${question.id}`}
            />
            <label htmlFor={question.id} className="text-sm">{question.helpText || 'I agree'}</label>
          </div>
        );

      case 'DATE':
        return (
          <Input
            type="date"
            value={value}
            onChange={(e) => updateResponse(question.id, e.target.value)}
            data-testid={`input-date-question-${question.id}`}
          />
        );

      case 'FILE':
        return (
          <div className="space-y-2">
            <Input
              type="file"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  updateResponse(question.id, file.name);
                }
              }}
              data-testid={`input-file-question-${question.id}`}
            />
            {value && <p className="text-xs text-muted-foreground">Selected: {value}</p>}
          </div>
        );
      
      default:
        return (
          <Input
            value={value}
            onChange={(e) => updateResponse(question.id, e.target.value)}
            placeholder="Enter your answer"
            data-testid={`input-question-${question.id}`}
          />
        );
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <CardTitle>Sign In Required</CardTitle>
            <CardDescription>
              You need to be signed in to apply for the mentorship program.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Link href="/login">
              <Button className="w-full" data-testid="button-sign-in">Sign In</Button>
            </Link>
            <Link href="/register">
              <Button variant="outline" className="w-full" data-testid="button-register">Create Account</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (cohortLoading || questionsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (cohortError || !cohort) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <CardTitle>Application Not Available</CardTitle>
            <CardDescription>
              This cohort is not currently accepting applications or does not exist.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/">
              <Button className="w-full" data-testid="button-go-home">Go to Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <CardTitle>Application Submitted</CardTitle>
            <CardDescription>
              Thank you for applying to {cohort.name}. We'll review your application and get back to you soon.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/">
              <Button className="w-full" data-testid="button-go-dashboard">Go to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card">
        <div className="container mx-auto py-6 px-4">
          <h1 className="text-2xl font-semibold">{cohort.name}</h1>
          <p className="text-muted-foreground mt-1">Application Form</p>
        </div>
      </div>

      <div className="container mx-auto py-8 px-4 max-w-3xl">
        <div className="mb-8">
          <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
            <span>Step {currentStep + 1} of {steps.length}</span>
            <span>{Math.round(progress)}% complete</span>
          </div>
          <Progress value={progress} className="h-2" />
          <div className="mt-4">
            <h2 className="text-lg font-medium">{steps[currentStep]?.title}</h2>
            {steps[currentStep]?.description && (
              <p className="text-sm text-muted-foreground mt-1">{steps[currentStep].description}</p>
            )}
          </div>
        </div>

        <Card>
          <CardContent className="pt-6">
            {currentStep === 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setSelectedRole('MENTEE')}
                  className={cn(
                    "p-6 rounded-md border-2 text-left transition-all",
                    selectedRole === 'MENTEE'
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  )}
                  data-testid="button-role-mentee"
                >
                  <GraduationCap className={cn(
                    "h-8 w-8 mb-3",
                    selectedRole === 'MENTEE' ? "text-primary" : "text-muted-foreground"
                  )} />
                  <div className="font-semibold text-lg">Mentee</div>
                  <div className="text-sm text-muted-foreground mt-2">
                    I'm looking for guidance and want to grow professionally with support from an experienced mentor.
                  </div>
                </button>
                
                <button
                  type="button"
                  onClick={() => setSelectedRole('MENTOR')}
                  className={cn(
                    "p-6 rounded-md border-2 text-left transition-all",
                    selectedRole === 'MENTOR'
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  )}
                  data-testid="button-role-mentor"
                >
                  <UserCheck className={cn(
                    "h-8 w-8 mb-3",
                    selectedRole === 'MENTOR' ? "text-primary" : "text-muted-foreground"
                  )} />
                  <div className="font-semibold text-lg">Mentor</div>
                  <div className="text-sm text-muted-foreground mt-2">
                    I have experience to share and want to help guide others in their professional development.
                  </div>
                </button>
              </div>
            )}

            {currentStep === 1 && (
              <div className="space-y-4">
                {tracks?.map((track) => (
                  <button
                    key={track.id}
                    type="button"
                    onClick={() => setSelectedTrack(track.id)}
                    className={cn(
                      "w-full p-4 rounded-md border-2 text-left transition-all",
                      selectedTrack === track.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    )}
                    data-testid={`button-track-${track.id}`}
                  >
                    <div className="font-medium">{track.name}</div>
                    {track.description && (
                      <div className="text-sm text-muted-foreground mt-1">{track.description}</div>
                    )}
                  </button>
                ))}
              </div>
            )}

            {currentStep >= 2 && currentStep < steps.length - 1 && (
              <div className="space-y-6">
                {groupedQuestions[currentStep - 2]?.questions.map((question) => (
                  <div key={question.id} className="space-y-2">
                    <label className="text-sm font-medium">
                      {question.questionText}
                      {question.isRequired && <span className="text-destructive ml-1">*</span>}
                    </label>
                    {question.helpText && question.questionType !== 'CHECKBOX' && (
                      <p className="text-xs text-muted-foreground">{question.helpText}</p>
                    )}
                    {renderQuestionInput(question)}
                  </div>
                ))}
              </div>
            )}

            {currentStep === steps.length - 1 && (
              <div className="space-y-6">
                <div className="p-4 bg-muted/50 rounded-md">
                  <h3 className="font-medium">Application Summary</h3>
                  <div className="mt-3 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Role:</span>
                      <span className="font-medium">{selectedRole}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Track:</span>
                      <span className="font-medium">{tracks?.find(t => t.id === selectedTrack)?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Questions Answered:</span>
                      <span className="font-medium">{Object.keys(responses).length}</span>
                    </div>
                  </div>
                </div>
                
                <p className="text-sm text-muted-foreground">
                  By submitting this application, you confirm that all information provided is accurate and complete.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 0}
            data-testid="button-back"
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          
          {currentStep < steps.length - 1 ? (
            <Button
              onClick={handleNext}
              disabled={!canProceed()}
              data-testid="button-next"
            >
              Next
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={submitMutation.isPending}
              data-testid="button-submit"
            >
              {submitMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Submit Application
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
