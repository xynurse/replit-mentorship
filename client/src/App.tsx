import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { ThemeProvider } from "@/components/theme-provider";
import { ProtectedRoute, AdminRoute } from "@/lib/protected-route";
import NotFound from "@/pages/not-found";
import LoginPage from "@/pages/login";
import RegisterPage from "@/pages/register";
import ForgotPasswordPage from "@/pages/forgot-password";
import ResetPasswordPage from "@/pages/reset-password";
import CompleteProfilePage from "@/pages/complete-profile";
import HomePage from "@/pages/home";
import AdminDashboard from "@/pages/admin/index";
import AdminUsers from "@/pages/admin/users";
import AdminCohorts from "@/pages/admin/cohorts";
import AdminApplications from "@/pages/admin/applications";
import AdminMatchingPage from "@/pages/admin/matching";
import AdminDocuments from "@/pages/admin/documents";
import AdminTasks from "@/pages/admin/tasks";
import AdminAnalytics from "@/pages/admin/analytics";
import AdminAuditLogs from "@/pages/admin/audit-logs";
import AdminErrorLogs from "@/pages/admin/error-logs";
import AdminSurveys from "@/pages/admin/surveys";
import AdminCertificates from "@/pages/admin/certificates";
import ApplyPage from "@/pages/apply";
import CertificatesPage from "@/pages/certificates";
import MessagesPage from "@/pages/messages";
import DocumentsPage from "@/pages/documents";
import TasksPage from "@/pages/tasks";
import GoalsPage from "@/pages/goals";
import NotificationsPage from "@/pages/notifications";
import PrivacyPage from "@/pages/privacy";
import SearchPage from "@/pages/search";
import OnboardingPage from "@/pages/onboarding";

function Router() {
  return (
    <Switch>
      <Route path="/login" component={LoginPage} />
      <Route path="/register" component={RegisterPage} />
      <Route path="/forgot-password" component={ForgotPasswordPage} />
      <Route path="/reset-password/:token" component={ResetPasswordPage} />
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
      <Route path="/apply/:cohortId" component={ApplyPage} />
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
      <Route component={NotFound} />
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
