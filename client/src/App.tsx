import { Suspense, lazy } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { ProgramProvider } from "@/hooks/use-program";
import { ThemeProvider } from "@/components/theme-provider";
import { ProtectedRoute, AdminRoute } from "@/lib/protected-route";
import { Loader2 } from "lucide-react";

const LoginPage = lazy(() => import("@/pages/login"));
const RegisterPage = lazy(() => import("@/pages/register"));
const ForgotPasswordPage = lazy(() => import("@/pages/forgot-password"));
const ResetPasswordPage = lazy(() => import("@/pages/reset-password"));
const ChangePasswordPage = lazy(() => import("@/pages/change-password"));
const CompleteProfilePage = lazy(() => import("@/pages/complete-profile"));
const MentorshipProfileSetupPage = lazy(() => import("@/pages/mentorship-profile-setup"));
const HomePage = lazy(() => import("@/pages/home"));
const NotFound = lazy(() => import("@/pages/not-found"));

const AdminDashboard = lazy(() => import("@/pages/admin/index"));
const AdminUsers = lazy(() => import("@/pages/admin/users"));
const AdminCohorts = lazy(() => import("@/pages/admin/cohorts"));
const AdminApplications = lazy(() => import("@/pages/admin/applications"));
const AdminMatchingPage = lazy(() => import("@/pages/admin/matching"));
const AdminDocuments = lazy(() => import("@/pages/admin/documents"));
const AdminAnalytics = lazy(() => import("@/pages/admin/analytics"));
const AdminAuditLogs = lazy(() => import("@/pages/admin/audit-logs"));
const AdminErrorLogs = lazy(() => import("@/pages/admin/error-logs"));
const AdminSurveys = lazy(() => import("@/pages/admin/surveys"));
const AdminCertificates = lazy(() => import("@/pages/admin/certificates"));
const AdminMentorProfiles = lazy(() => import("@/pages/admin/mentor-profiles"));
const AdminMentorProfileDetail = lazy(() => import("@/pages/admin/mentor-profile-detail"));
const AdminMenteeProfiles = lazy(() => import("@/pages/admin/mentee-profiles"));
const AdminMenteeProfileDetail = lazy(() => import("@/pages/admin/mentee-profile-detail"));
const AdminCohortDetail = lazy(() => import("@/pages/admin/cohort-detail"));
const AdminSettings = lazy(() => import("@/pages/admin/settings"));
const AdminConnections = lazy(() => import("@/pages/admin/connections"));
const AdminMeetings = lazy(() => import("@/pages/admin/meetings"));
const AdminCommunity = lazy(() => import("@/pages/admin/community"));
const AdminReminders = lazy(() => import("@/pages/admin/reminders"));
const AdminPlatformStatus = lazy(() => import("@/pages/admin/platform-status"));
const AdminSubmissions = lazy(() => import("@/pages/admin/submissions"));
const AdminPrograms = lazy(() => import("@/pages/admin/programs"));
const AdminUserProfile = lazy(() => import("@/pages/admin/user-profile"));

const ApplyPage = lazy(() => import("@/pages/apply"));
const CertificatesPage = lazy(() => import("@/pages/certificates"));
const DocumentsPage = lazy(() => import("@/pages/documents"));
const GoalsPage = lazy(() => import("@/pages/goals"));
const NotificationsPage = lazy(() => import("@/pages/notifications"));
const PrivacyPage = lazy(() => import("@/pages/privacy"));
const SearchPage = lazy(() => import("@/pages/search"));
const OnboardingPage = lazy(() => import("@/pages/onboarding"));
const SettingsPage = lazy(() => import("@/pages/settings"));
const ConnectionsPage = lazy(() => import("@/pages/connections"));
const CalendarPage = lazy(() => import("@/pages/calendar"));
const CommunityPage = lazy(() => import("@/pages/community"));
const CommunityThreadPage = lazy(() => import("@/pages/community-thread"));
const MenteeCommunityPage = lazy(() => import("@/pages/mentee-community"));
const MenteeCommunityThreadPage = lazy(() => import("@/pages/mentee-community-thread"));
const JournalPage = lazy(() => import("@/pages/journal"));
const RemindersPage = lazy(() => import("@/pages/reminders"));
const SubmissionsPage = lazy(() => import("@/pages/submissions"));
const MyProfilePage = lazy(() => import("@/pages/my-profile"));
const ProfileViewPage = lazy(() => import("@/pages/profile-view"));
const MenteeDetailPage = lazy(() => import("@/pages/mentee-detail"));
const ProgramSelectorPage = lazy(() => import("@/pages/program-selector"));

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
      <ProtectedRoute path="/change-password" component={ChangePasswordPage} requireCompleteProfile={false} />
      <ProtectedRoute path="/complete-profile" component={CompleteProfilePage} requireCompleteProfile={false} />
      <ProtectedRoute path="/profile/setup" component={MentorshipProfileSetupPage} requireCompleteProfile={false} />
      <ProtectedRoute path="/select-program" component={ProgramSelectorPage} requireCompleteProfile={false} />
      <AdminRoute path="/admin/users" component={AdminUsers} />
      <AdminRoute path="/admin/cohorts" component={AdminCohorts} />
      <AdminRoute path="/admin/cohorts/:id" component={AdminCohortDetail} />
      <AdminRoute path="/admin/applications" component={AdminApplications} />
      <AdminRoute path="/admin/matching/:cohortId" component={AdminMatchingPage} />
      <AdminRoute path="/admin/documents" component={AdminDocuments} />
      <AdminRoute path="/admin/analytics" component={AdminAnalytics} />
      <AdminRoute path="/admin/audit-logs" component={AdminAuditLogs} />
      <AdminRoute path="/admin/error-logs" component={AdminErrorLogs} />
      <AdminRoute path="/admin/surveys" component={AdminSurveys} />
      <AdminRoute path="/admin/certificates" component={AdminCertificates} />
      <AdminRoute path="/admin/mentor-profiles" component={AdminMentorProfiles} />
      <AdminRoute path="/admin/mentor-profiles/:userId" component={AdminMentorProfileDetail} />
      <AdminRoute path="/admin/mentee-profiles" component={AdminMenteeProfiles} />
      <AdminRoute path="/admin/mentee-profiles/:userId" component={AdminMenteeProfileDetail} />
      <AdminRoute path="/admin/settings" component={AdminSettings} />
      <AdminRoute path="/admin/connections" component={AdminConnections} />
      <AdminRoute path="/admin/meetings" component={AdminMeetings} />
      <AdminRoute path="/admin/community" component={AdminCommunity} />
      <AdminRoute path="/admin/reminders" component={AdminReminders} />
      <AdminRoute path="/admin/platform-status" component={AdminPlatformStatus} />
      <AdminRoute path="/admin/submissions" component={AdminSubmissions} />
      <AdminRoute path="/admin/programs" component={AdminPrograms} />
      <AdminRoute path="/admin/users/:userId/profile" component={AdminUserProfile} />
      <AdminRoute path="/admin" component={AdminDashboard} />
      <LazyRoute path="/apply/:cohortId" component={ApplyPage} />
      <ProtectedRoute path="/documents" component={DocumentsPage} />
      <ProtectedRoute path="/goals" component={GoalsPage} />
      <ProtectedRoute path="/notifications" component={NotificationsPage} />
      <ProtectedRoute path="/privacy" component={PrivacyPage} />
      <ProtectedRoute path="/search" component={SearchPage} />
      <ProtectedRoute path="/certificates" component={CertificatesPage} />
      <ProtectedRoute path="/onboarding" component={OnboardingPage} requireCompleteProfile={false} />
      <ProtectedRoute path="/settings" component={SettingsPage} />
      <ProtectedRoute path="/connections" component={ConnectionsPage} />
      <ProtectedRoute path="/mentee/:id" component={MenteeDetailPage} />
      <ProtectedRoute path="/calendar" component={CalendarPage} />
      <ProtectedRoute path="/community" component={CommunityPage} />
      <ProtectedRoute path="/community/:id" component={CommunityThreadPage} />
      <ProtectedRoute path="/mentee-community" component={MenteeCommunityPage} />
      <ProtectedRoute path="/mentee-community/:id" component={MenteeCommunityThreadPage} />
      <ProtectedRoute path="/journal" component={JournalPage} />
      <ProtectedRoute path="/reminders" component={RemindersPage} />
      <ProtectedRoute path="/feedback" component={SubmissionsPage} />
      <ProtectedRoute path="/profile/:userId" component={ProfileViewPage} />
      <ProtectedRoute path="/profile" component={ProfileViewPage} />
      <ProtectedRoute path="/my-profile" component={MyProfilePage} />
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
            <ProgramProvider>
              <Toaster />
              <Router />
            </ProgramProvider>
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
