import { Suspense, lazy } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { ThemeProvider } from "@/components/theme-provider";
import { ProtectedRoute, AdminRoute } from "@/lib/protected-route";
import { Loader2 } from "lucide-react";

const LoginPage = lazy(() => import("@/pages/login"));
const RegisterPage = lazy(() => import("@/pages/register"));
const ForgotPasswordPage = lazy(() => import("@/pages/forgot-password"));
const ResetPasswordPage = lazy(() => import("@/pages/reset-password"));
const CompleteProfilePage = lazy(() => import("@/pages/complete-profile"));
const HomePage = lazy(() => import("@/pages/home"));
const NotFound = lazy(() => import("@/pages/not-found"));

const AdminDashboard = lazy(() => import("@/pages/admin/index"));
const AdminUsers = lazy(() => import("@/pages/admin/users"));
const AdminCohorts = lazy(() => import("@/pages/admin/cohorts"));
const AdminApplications = lazy(() => import("@/pages/admin/applications"));
const AdminMatchingPage = lazy(() => import("@/pages/admin/matching"));
const AdminDocuments = lazy(() => import("@/pages/admin/documents"));
const AdminTasks = lazy(() => import("@/pages/admin/tasks"));
const AdminAnalytics = lazy(() => import("@/pages/admin/analytics"));
const AdminAuditLogs = lazy(() => import("@/pages/admin/audit-logs"));
const AdminErrorLogs = lazy(() => import("@/pages/admin/error-logs"));
const AdminSurveys = lazy(() => import("@/pages/admin/surveys"));
const AdminCertificates = lazy(() => import("@/pages/admin/certificates"));

const ApplyPage = lazy(() => import("@/pages/apply"));
const CertificatesPage = lazy(() => import("@/pages/certificates"));
const MessagesPage = lazy(() => import("@/pages/messages"));
const DocumentsPage = lazy(() => import("@/pages/documents"));
const TasksPage = lazy(() => import("@/pages/tasks"));
const GoalsPage = lazy(() => import("@/pages/goals"));
const NotificationsPage = lazy(() => import("@/pages/notifications"));
const PrivacyPage = lazy(() => import("@/pages/privacy"));
const SearchPage = lazy(() => import("@/pages/search"));
const OnboardingPage = lazy(() => import("@/pages/onboarding"));

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}

function LazyRoute({ path, component: Component }: { path?: string; component: React.ComponentType }) {
  return (
    <Route path={path}>
      <Suspense fallback={<PageLoader />}>
        <Component />
      </Suspense>
    </Route>
  );
}

function Router() {
  return (
    <Switch>
      <LazyRoute path="/login" component={LoginPage} />
      <LazyRoute path="/register" component={RegisterPage} />
      <LazyRoute path="/forgot-password" component={ForgotPasswordPage} />
      <LazyRoute path="/reset-password/:token" component={ResetPasswordPage} />
      <ProtectedRoute path="/complete-profile" component={CompleteProfilePage} requireCompleteProfile={false} />
      <AdminRoute path="/admin" component={AdminDashboard} />
      <AdminRoute path="/admin/users" component={AdminUsers} />
      <AdminRoute path="/admin/cohorts" component={AdminCohorts} />
      <AdminRoute path="/admin/applications" component={AdminApplications} />
      <AdminRoute path="/admin/matching/:cohortId" component={AdminMatchingPage} />
      <AdminRoute path="/admin/documents" component={AdminDocuments} />
      <AdminRoute path="/admin/tasks" component={AdminTasks} />
      <AdminRoute path="/admin/analytics" component={AdminAnalytics} />
      <AdminRoute path="/admin/audit-logs" component={AdminAuditLogs} />
      <AdminRoute path="/admin/error-logs" component={AdminErrorLogs} />
      <AdminRoute path="/admin/surveys" component={AdminSurveys} />
      <AdminRoute path="/admin/certificates" component={AdminCertificates} />
      <LazyRoute path="/apply/:cohortId" component={ApplyPage} />
      <ProtectedRoute path="/messages" component={MessagesPage} />
      <ProtectedRoute path="/documents" component={DocumentsPage} />
      <ProtectedRoute path="/tasks" component={TasksPage} />
      <ProtectedRoute path="/goals" component={GoalsPage} />
      <ProtectedRoute path="/notifications" component={NotificationsPage} />
      <ProtectedRoute path="/privacy" component={PrivacyPage} />
      <ProtectedRoute path="/search" component={SearchPage} />
      <ProtectedRoute path="/certificates" component={CertificatesPage} />
      <ProtectedRoute path="/onboarding" component={OnboardingPage} requireCompleteProfile={false} />
      <ProtectedRoute path="/" component={HomePage} />
      <LazyRoute component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <AuthProvider>
            <Toaster />
            <Router />
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
