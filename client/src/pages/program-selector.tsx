import { useProgram } from "@/hooks/use-program";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, ArrowRight, Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import { useEffect } from "react";

export default function ProgramSelectorPage() {
  const { user } = useAuth();
  const { programs, isLoadingPrograms, setActiveProgram, isSettingProgram, activeProgram } = useProgram();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (activeProgram?.programId) {
      const role = activeProgram.role;
      if (role === "ADMIN" || user?.role === "SUPER_ADMIN" || user?.role === "ADMIN") {
        setLocation("/admin/dashboard");
      } else {
        setLocation("/dashboard");
      }
    }
  }, [activeProgram?.programId, activeProgram?.role, user?.role, setLocation]);

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

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center space-y-2">
          <Building2 className="h-12 w-12 mx-auto text-primary" />
          <h1 className="text-2xl font-bold" data-testid="text-program-selector-title">
            Select a Program
          </h1>
          <p className="text-muted-foreground">
            Welcome back, {user?.firstName}! Choose which program you'd like to work in.
          </p>
        </div>

        <div className="space-y-3">
          {programs.map((membership) => (
            <Card
              key={membership.id}
              className="hover-elevate cursor-pointer"
              data-testid={`card-program-${membership.programId}`}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <CardTitle className="text-lg">{membership.program.name}</CardTitle>
                  <Badge variant="secondary">{membership.role}</Badge>
                </div>
                {membership.program.description && (
                  <CardDescription className="text-sm">
                    {membership.program.description}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
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
              <p className="text-muted-foreground" data-testid="text-no-programs">
                You are not currently assigned to any programs. Please contact an administrator.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
