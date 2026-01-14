import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  FileText,
  Settings,
  LogOut,
  ChevronDown,
  Bell,
  Menu,
  Shield,
  ClipboardList,
  ListTodo,
  BarChart3,
  ScrollText,
  AlertTriangle,
  MessageSquare,
  Award,
  UserCog,
  UserCheck,
  Link2,
  Calendar,
  UsersRound,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { AnimatedBackground } from "@/components/animated-background";

interface AdminLayoutProps {
  children: ReactNode;
}

const adminMenuItems = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
  { title: "Analytics", url: "/admin/analytics", icon: BarChart3 },
  { title: "Meetings", url: "/admin/meetings", icon: Calendar },
  { title: "User Management", url: "/admin/users", icon: Users },
  { title: "Connections", url: "/admin/connections", icon: Link2 },
  { title: "Mentor Profiles", url: "/admin/mentor-profiles", icon: UserCog },
  { title: "Mentee Profiles", url: "/admin/mentee-profiles", icon: UserCheck },
  { title: "Community", url: "/admin/community", icon: UsersRound },
  { title: "Cohorts", url: "/admin/cohorts", icon: GraduationCap },
  { title: "Applications", url: "/admin/applications", icon: ClipboardList },
  { title: "Task Analytics", url: "/admin/tasks", icon: ListTodo },
  { title: "Documents", url: "/admin/documents", icon: FileText },
  { title: "Surveys", url: "/admin/surveys", icon: MessageSquare },
  { title: "Certificates", url: "/admin/certificates", icon: Award },
  { title: "Audit Logs", url: "/admin/audit-logs", icon: ScrollText },
  { title: "Error Logs", url: "/admin/error-logs", icon: AlertTriangle },
  { title: "Settings", url: "/admin/settings", icon: Settings },
];

function AdminNavLink({ href, children, isActive, testId }: { href: string; children: React.ReactNode; isActive: boolean; testId?: string }) {
  const { setOpenMobile, isMobile } = useSidebar();
  
  const handleClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <SidebarMenuButton asChild isActive={isActive} onClick={handleClick} data-testid={testId}>
      <Link href={href}>
        {children}
      </Link>
    </SidebarMenuButton>
  );
}

function AdminSidebar() {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const { isMobile } = useSidebar();

  const getInitials = () => {
    if (!user) return "U";
    return `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase();
  };

  return (
    <Sidebar className="border-r">
      <SidebarHeader className="border-b p-4">
        <Link href="/admin" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
            <Shield className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-semibold text-lg">SONSIEL Admin</span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminMenuItems.map((item) => {
                const isActive = location === item.url || 
                  (item.url !== "/admin" && location.startsWith(item.url));
                return (
                  <SidebarMenuItem key={item.title}>
                    <AdminNavLink 
                      href={item.url} 
                      isActive={isActive}
                      testId={`nav-${item.title.toLowerCase()}`}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </AdminNavLink>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarImage src={user?.profileImage || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-muted-foreground truncate">{user?.role}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => logoutMutation.mutate()}
            data-testid="button-logout"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const { user } = useAuth();
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <AnimatedBackground />
      <div className="flex h-screen w-full relative z-10">
        <AdminSidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between gap-4 px-4 h-14 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex items-center gap-2">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
            </div>
            
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button variant="ghost" size="icon" className="relative" data-testid="button-notifications">
                <Bell className="h-5 w-5" />
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2">
                    <Avatar className="h-7 w-7">
                      <AvatarImage src={user?.profileImage || undefined} />
                      <AvatarFallback className="text-xs bg-primary/10 text-primary">
                        {user?.firstName?.[0]}{user?.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href="/">Back to Dashboard</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/admin/settings">Settings</Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
          <main className="flex-1 overflow-auto p-6 bg-muted/30">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
