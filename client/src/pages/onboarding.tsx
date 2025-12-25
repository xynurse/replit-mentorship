import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  CheckCircle2, 
  ArrowRight, 
  UserCircle, 
  Users, 
  Target, 
  MessageSquare,
  Sparkles,
  ChevronRight,
  BookOpen
} from "lucide-react";
import type { OnboardingProgress } from "@shared/schema";

interface OnboardingStep {
  id: keyof Omit<OnboardingProgress, "id" | "userId" | "createdAt" | "updatedAt" | "completedSteps">;
  title: string;
  description: string;
  icon: typeof CheckCircle2;
  action: string;
  href: string;
}

const onboardingSteps: OnboardingStep[] = [
  {
    id: "hasSeenWelcome",
    title: "Welcome to SONSIEL",
    description: "You've started your mentorship journey!",
    icon: Sparkles,
    action: "View Welcome",
    href: "/",
  },
  {
    id: "hasCompletedTour",
    title: "Complete the Tour",
    description: "Learn about the key features of the platform",
    icon: BookOpen,
    action: "Start Tour",
    href: "/",
  },
  {
    id: "hasSetupProfile",
    title: "Complete Your Profile",
    description: "Add your professional details, skills, and interests",
    icon: UserCircle,
    action: "Edit Profile",
    href: "/complete-profile",
  },
  {
    id: "hasViewedFirstMatch",
    title: "View Your Match",
    description: "See who you've been matched with for mentorship",
    icon: Users,
    action: "View Matches",
    href: "/",
  },
  {
    id: "hasCreatedFirstGoal",
    title: "Create Your First Goal",
    description: "Set a SMART goal for your mentorship journey",
    icon: Target,
    action: "Create Goal",
    href: "/goals",
  },
  {
    id: "hasSentFirstMessage",
    title: "Send Your First Message",
    description: "Start a conversation with your mentor or mentee",
    icon: MessageSquare,
    action: "Send Message",
    href: "/messages",
  },
];

export default function OnboardingPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [currentStep, setCurrentStep] = useState(0);

  const { data: progress, isLoading } = useQuery<OnboardingProgress>({
    queryKey: ["/api/onboarding"],
  });

  const updateProgressMutation = useMutation({
    mutationFn: async (data: Partial<OnboardingProgress>) => {
      return apiRequest("PATCH", "/api/onboarding", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/onboarding"] });
    },
  });

  const handleStepAction = (step: OnboardingStep) => {
    if (step.id === "hasSeenWelcome" && progress && !progress.hasSeenWelcome) {
      updateProgressMutation.mutate({ hasSeenWelcome: true });
    }
    if (step.id === "hasCompletedTour" && progress && !progress.hasCompletedTour) {
      updateProgressMutation.mutate({ hasCompletedTour: true });
      toast({ title: "Tour marked as complete!" });
      return;
    }
    navigate(step.href);
  };

  const markWelcomeSeen = () => {
    if (!progress?.hasSeenWelcome) {
      updateProgressMutation.mutate({ hasSeenWelcome: true });
    }
    setCurrentStep(1);
  };

  const getCompletedSteps = () => {
    if (!progress) return 0;
    let count = 0;
    if (progress.hasSeenWelcome) count++;
    if (progress.hasCompletedTour) count++;
    if (progress.hasSetupProfile) count++;
    if (progress.hasViewedFirstMatch) count++;
    if (progress.hasCreatedFirstGoal) count++;
    if (progress.hasSentFirstMessage) count++;
    return count;
  };

  const isStepComplete = (stepId: OnboardingStep["id"]) => {
    if (!progress) return false;
    return !!progress[stepId];
  };

  const completedSteps = getCompletedSteps();
  const progressPercent = (completedSteps / onboardingSteps.length) * 100;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-muted" />
          <div className="h-4 w-32 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (currentStep === 0 && !progress?.hasSeenWelcome) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
        <Card className="max-w-lg w-full">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Welcome to SONSIEL Mentorship Hub!</CardTitle>
            <CardDescription className="text-base mt-2">
              {user?.role === "MENTOR" 
                ? "Thank you for joining as a mentor. Let's get you set up to guide and inspire your mentees."
                : "Welcome! Let's get you started on your journey to grow as a healthcare professional."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Complete your profile</p>
                  <p className="text-sm text-muted-foreground">Add your professional background and interests</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Connect with your {user?.role === "MENTOR" ? "mentees" : "mentor"}</p>
                  <p className="text-sm text-muted-foreground">Build meaningful professional relationships</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Set goals and track progress</p>
                  <p className="text-sm text-muted-foreground">Use SMART goals to guide your development</p>
                </div>
              </div>
            </div>
            
            <Button 
              className="w-full" 
              size="lg" 
              onClick={markWelcomeSeen}
              data-testid="button-get-started"
            >
              Get Started
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-semibold" data-testid="text-page-title">Getting Started</h1>
          <p className="text-muted-foreground">Complete these steps to get the most out of your mentorship experience</p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Your Progress</span>
              <span className="text-sm text-muted-foreground">{completedSteps} of {onboardingSteps.length} complete</span>
            </div>
            <Progress value={progressPercent} className="h-2" />
          </CardContent>
        </Card>

        <div className="space-y-4">
          {onboardingSteps.map((step, index) => {
            const isComplete = isStepComplete(step.id);
            const Icon = step.icon;
            
            return (
              <Card 
                key={step.id}
                className={isComplete ? "border-primary/30 bg-primary/5" : ""}
                data-testid={`card-step-${step.id}`}
              >
                <CardContent className="py-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      isComplete 
                        ? "bg-primary text-primary-foreground" 
                        : "bg-muted text-muted-foreground"
                    }`}>
                      {isComplete ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : (
                        <Icon className="w-5 h-5" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className={`font-medium ${isComplete ? "line-through text-muted-foreground" : ""}`}>
                          {step.title}
                        </h3>
                        {isComplete && (
                          <span className="text-xs text-primary font-medium">Complete</span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{step.description}</p>
                    </div>
                    {!isComplete && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleStepAction(step)}
                        data-testid={`button-action-${step.id}`}
                      >
                        {step.action}
                        <ChevronRight className="ml-1 w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {completedSteps === onboardingSteps.length && (
          <Card className="border-primary bg-primary/5">
            <CardContent className="py-6 text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Onboarding Complete!</h3>
                <p className="text-muted-foreground">You're all set to make the most of your mentorship experience.</p>
              </div>
              <Button onClick={() => navigate("/")} data-testid="button-go-dashboard">
                Go to Dashboard
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="text-center">
          <Button 
            variant="ghost" 
            onClick={() => navigate("/")}
            data-testid="button-skip-onboarding"
          >
            Skip for now
          </Button>
        </div>
      </div>
    </div>
  );
}
