import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";

export function ProtectedRoute({
  path,
  component: Component,
  requireCompleteProfile = true,
}: {
  path: string;
  component: () => React.JSX.Element;
  requireCompleteProfile?: boolean;
}) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen bg-background">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </Route>
    );
  }

  if (!user) {
    return (
      <Route path={path}>
        <Redirect to="/login" />
      </Route>
    );
  }

  if (requireCompleteProfile && !user.isProfileComplete && path !== "/complete-profile") {
    return (
      <Route path={path}>
        <Redirect to="/complete-profile" />
      </Route>
    );
  }

  return <Route path={path} component={Component} />;
}
