import { Suspense } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useProgram } from "@/hooks/use-program";
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
}: {
  path: string;
  component: React.ComponentType;
}) {
  const { user, isLoading } = useAuth();
  const { needsProgramSelection, isLoadingPrograms, isLoadingActiveProgram } = useProgram();

  if (isLoading) {
    return <Route path={path}><LoadingState /></Route>;
  }

  if (!user) {
    return <Route path={path}><Redirect to="/login" /></Route>;
  }

  if (user.mustChangePassword && path !== "/change-password") {
    return <Route path={path}><Redirect to="/change-password" /></Route>;
  }

  // Prevent flash: hold on loading spinner while we resolve program membership.
  // isLoadingPrograms / isLoadingActiveProgram are only true when user is set (queries
  // are enabled) but the response hasn't arrived yet. For returning users with cached
  // data this is instantaneous; for fresh logins it avoids showing protected content
  // before the program-selection redirect fires.
  if (isLoadingPrograms || isLoadingActiveProgram) {
    return <Route path={path}><LoadingState /></Route>;
  }

  // Gate: user must pick a program before accessing any protected page.
  // Exempt /select-program itself to avoid an infinite redirect loop.
  if (needsProgramSelection && path !== "/select-program") {
    return <Route path={path}><Redirect to="/select-program" /></Route>;
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
  const { needsProgramSelection, isLoadingPrograms, isLoadingActiveProgram } = useProgram();

  if (isLoading) {
    return <Route path={path}><LoadingState /></Route>;
  }

  if (!user) {
    return <Route path={path}><Redirect to="/login" /></Route>;
  }

  if (user.mustChangePassword) {
    return <Route path={path}><Redirect to="/change-password" /></Route>;
  }

  // Hold on loading while program membership resolves (same as ProtectedRoute).
  if (isLoadingPrograms || isLoadingActiveProgram) {
    return <Route path={path}><LoadingState /></Route>;
  }

  // Gate: admins must also choose a program context before accessing the admin UI.
  if (needsProgramSelection) {
    return <Route path={path}><Redirect to="/select-program" /></Route>;
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
