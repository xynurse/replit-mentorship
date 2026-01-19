import { Suspense } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, ShieldX } from "lucide-react";
import { Redirect, Route, Link } from "wouter";
import { Button } from "@/components/ui/button";

function LoadingState() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}

function UnauthorizedState() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="flex flex-col items-center gap-4 text-center p-6">
        <ShieldX className="h-16 w-16 text-destructive" />
        <h1 className="text-2xl font-bold">Access Denied</h1>
        <p className="text-muted-foreground max-w-md">
          You don't have permission to access this page. This area is restricted to administrators only.
        </p>
        <Link href="/">
          <Button>Return to Dashboard</Button>
        </Link>
      </div>
    </div>
  );
}

export function ProtectedRoute({
  path,
  component: Component,
  requireCompleteProfile = true,
}: {
  path: string;
  component: React.ComponentType;
  requireCompleteProfile?: boolean;
}) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <Route path={path}><LoadingState /></Route>;
  }

  if (!user) {
    return <Route path={path}><Redirect to="/login" /></Route>;
  }

  if (user.mustChangePassword && path !== "/change-password") {
    return <Route path={path}><Redirect to="/change-password" /></Route>;
  }

  if (requireCompleteProfile && !user.isProfileComplete && path !== "/complete-profile") {
    return <Route path={path}><Redirect to="/complete-profile" /></Route>;
  }

  return (
    <Route path={path}>
      <Suspense fallback={<LoadingState />}>
        <Component />
      </Suspense>
    </Route>
  );
}

export function AdminRoute({
  path,
  component: Component,
}: {
  path: string;
  component: React.ComponentType;
}) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <Route path={path}><LoadingState /></Route>;
  }

  if (!user) {
    return <Route path={path}><Redirect to="/login" /></Route>;
  }

  if (user.mustChangePassword) {
    return <Route path={path}><Redirect to="/change-password" /></Route>;
  }

  if (!user.isProfileComplete) {
    return <Route path={path}><Redirect to="/complete-profile" /></Route>;
  }

  if (user.role !== "SUPER_ADMIN" && user.role !== "ADMIN") {
    return <Route path={path}><UnauthorizedState /></Route>;
  }

  return (
    <Route path={path}>
      <Suspense fallback={<LoadingState />}>
        <Component />
      </Suspense>
    </Route>
  );
}
