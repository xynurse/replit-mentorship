import { useProgram } from "@/hooks/use-program";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toneBadgeClass, type StatusTone } from "@/components/shared/status-badge";
import { Building2, ArrowRight, Loader2, LogOut } from "lucide-react";
import { useLocation } from "wouter";
import { useEffect } from "react";

const roleLabels: Record<string, string> = {
  ADMIN: "Admin",
  SUPER_ADMIN: "Super Admin",
  MENTOR: "Mentor",
  MENTEE: "Mentee",
};

const roleTones: Record<string, StatusTone> = {
  SUPER_ADMIN: "danger",
  ADMIN: "primary",
  MENTOR: "info",
  MENTEE: "success",
};

export default function ProgramSelectorPage() {
  const { user, logoutMutation } = useAuth();
  const { programs, isLoadingPrograms, setActiveProgram, isSettingProgram, activeProgram } = useProgram();
  const [, setLocation] = useLocation();

  // Redirect once an active program is confirmed
  useEffect(() => {
    if (activeProgram?.programId) {
      if (user?.role === "SUPER_ADMIN" || user?.role === "ADMIN") {
        setLocation("/admin");
      } else {
        setLocation("/");
      }
    }
  }, [activeProgram?.programId, user?.role, setLocation]);

  // Auto-select when there's exactly one program
  useEffect(() => {
    if (!isLoadingPrograms && programs.length === 1 && !activeProgram?.programId) {
      setActiveProgram(programs[0].programId);
    }
  }, [isLoadingPrograms, programs, activeProgram?.programId, setActiveProgram]);

  if (isLoadingPrograms) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const handleSelectProgram = (programId: string) => {
    setActiveProgram(programId);
  };

  const handleSignOut = () => {
    logoutMutation.mutate();
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center space-y-2">
          <Building2 className="h-12 w-12 mx-auto text-primary" />
          <h1 className="text-2xl font-bold" data-testid="text-program-selector-title">
            Select a Program
          </h1>
          <p className="text-muted-foreground">
            Welcome back, <span className="font-medium text-foreground">{user?.firstName}</span>! Choose which program you'd like to enter.
          </p>
        </div>

        <div className="space-y-3">
          {programs.map((membership) => (
            <Card
              key={membership.id}
              className="hover-elevate cursor-pointer transition-shadow"
              data-testid={`card-program-${membership.programId}`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <CardTitle className="text-lg leading-snug">{membership.program.name}</CardTitle>
                    {membership.program.description && (
                      <CardDescription className="text-sm">
                        {membership.program.description}
                      </CardDescription>
                    )}
                  </div>
                  <Badge className={`shrink-0 mt-0.5 ${toneBadgeClass(roleTones[membership.role] ?? "neutral")} no-default-hover-elevate no-default-active-elevate`}>
                    {roleLabels[membership.role] ?? membership.role}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <Button
                  className="w-full"
                  onClick={() => handleSelectProgram(membership.programId)}
                  disabled={isSettingProgram}
                  data-testid={`button-select-program-${membership.programId}`}
                >
                  {isSettingProgram ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <ArrowRight className="h-4 w-4 mr-2" />
                  )}
                  Enter Program
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {programs.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center">
              <Building2 className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
              <p className="font-medium mb-1">No programs assigned</p>
              <p className="text-sm text-muted-foreground" data-testid="text-no-programs">
                You are not currently enrolled in any programs. Please contact an administrator to be added.
              </p>
            </CardContent>
          </Card>
        )}

        <div className="text-center">
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground"
            onClick={handleSignOut}
            disabled={logoutMutation.isPending}
            data-testid="button-sign-out"
          >
            {logoutMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <LogOut className="h-4 w-4 mr-2" />
            )}
            Sign out
          </Button>
        </div>
      </div>
    </div>
  );
}
