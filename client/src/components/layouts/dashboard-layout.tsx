import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import {
  Heart,
  LayoutDashboard,
  Users,
  MessageSquare,
  Calendar,
  FileText,
  Settings,
  LogOut,
  Menu,
  Search,
  ChevronDown,
  Shield,
  UserCog,
  ListTodo,
  Target,
  Award,
  UsersRound,
  GraduationCap,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationBell } from "@/components/notification-bell";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
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
import { cn } from "@/lib/utils";
import { UserRole } from "@shared/schema";
import { AnimatedBackground } from "@/components/animated-background";

interface DashboardLayoutProps {
  children: ReactNode;
}

const getNavItems = (role: UserRole) => {
  const baseItems = [
    { title: "Dashboard", url: "/", icon: LayoutDashboard },
    { title: "Search", url: "/search", icon: Search },
    { title: "Tasks", url: "/tasks", icon: ListTodo },
    { title: "Messages", url: "/messages", icon: MessageSquare },
    { title: "Calendar", url: "/calendar", icon: Calendar },
    { title: "Documents", url: "/documents", icon: FileText },
    { title: "Certificates", url: "/certificates", icon: Award },
  ];

  const adminItems = [
    { title: "Admin Panel", url: "/admin", icon: Shield },
  ];

  const mentorCommunityItem = { title: "Mentor Community", url: "/community", icon: UsersRound };
  const menteeCommunityItem = { title: "Mentee Community", url: "/mentee-community", icon: GraduationCap };

  if (role === "SUPER_ADMIN" || role === "ADMIN") {
    return [
      ...baseItems.slice(0, 3),
      { title: "Goals", url: "/goals", icon: Target },
      ...baseItems.slice(3),
      mentorCommunityItem,
      menteeCommunityItem,
      ...adminItems
    ];
  }

  if (role === "MENTOR") {
    return [
      ...baseItems,
      { title: "My Mentees", url: "/connections", icon: Users },
      { title: "Mentee Goals", url: "/goals", icon: Target },
      mentorCommunityItem,
    ];
  }

  // Mentee - has their own Goals and Community
  return [
    ...baseItems.slice(0, 3),
    { title: "Goals", url: "/goals", icon: Target },
    ...baseItems.slice(3),
    { title: "My Mentor", url: "/connections", icon: Users },
    menteeCommunityItem,
  ];
};

function getRoleBadgeVariant(role: UserRole) {
  switch (role) {
    case "SUPER_ADMIN":
      return "destructive";
    case "ADMIN":
      return "default";
    case "MENTOR":
      return "secondary";
    default:
      return "outline";
  }
}

function getRoleLabel(role: UserRole) {
  switch (role) {
    case "SUPER_ADMIN":
      return "Super Admin";
    case "ADMIN":
      return "Admin";
    case "MENTOR":
      return "Mentor";
    case "MENTEE":
      return "Mentee";
    default:
      return role;
  }
}

function NavLink({ href, children, isActive }: { href: string; children: React.ReactNode; isActive: boolean }) {
  const { setOpenMobile, isMobile } = useSidebar();
  
  const handleClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <SidebarMenuButton asChild isActive={isActive} onClick={handleClick}>
      <Link href={href}>
        {children}
      </Link>
    </SidebarMenuButton>
  );
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();

  if (!user) return null;

  const navItems = getNavItems(user.role as UserRole);
  const userInitials = `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase();

  const sidebarStyle = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "4rem",
  } as React.CSSProperties;

  return (
    <SidebarProvider style={sidebarStyle}>
      <AnimatedBackground />
      <div className="flex h-screen w-full relative z-10">
        <Sidebar>
          <SidebarHeader className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-primary/10">
                <Heart className="h-5 w-5 text-primary" />
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-sm">SONSIEL</span>
                <span className="text-xs text-muted-foreground">Mentorship Hub</span>
              </div>
            </div>
          </SidebarHeader>

          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Navigation</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navItems.map((item) => {
                    const isActive = location === item.url;
                    return (
                      <SidebarMenuItem key={item.title}>
                        <NavLink href={item.url} isActive={isActive}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </NavLink>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="p-4">
            <SidebarMenu>
              <SidebarMenuItem>
                <NavLink href="/settings" isActive={location === "/settings"}>
                  <Settings className="h-4 w-4" />
                  <span>Settings</span>
                </NavLink>
              </SidebarMenuItem>
            </SidebarMenu>

            <div className="mt-4 pt-4 border-t">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="w-full justify-start gap-3 h-auto p-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.profileImage || undefined} />
                      <AvatarFallback className="text-xs">{userInitials}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col items-start text-left flex-1 min-w-0">
                      <span className="text-sm font-medium truncate w-full">
                        {user.firstName} {user.lastName}
                      </span>
                      <Badge variant={getRoleBadgeVariant(user.role as UserRole)} className="text-xs mt-0.5">
                        {getRoleLabel(user.role as UserRole)}
                      </Badge>
                    </div>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col">
                      <span>{user.firstName} {user.lastName}</span>
                      <span className="text-xs font-normal text-muted-foreground">{user.email}</span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/settings">
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/privacy" data-testid="link-privacy">
                      <Shield className="mr-2 h-4 w-4" />
                      Privacy & Data
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => logoutMutation.mutate()}
                    className="text-destructive focus:text-destructive"
                    data-testid="button-logout"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </SidebarFooter>
        </Sidebar>

        <div className="flex flex-col flex-1 min-w-0">
          <header className="h-14 border-b bg-card flex items-center justify-between gap-4 px-4 sticky top-0 z-50">
            <div className="flex items-center gap-4">
              <SidebarTrigger data-testid="button-sidebar-toggle">
                <Menu className="h-5 w-5" />
              </SidebarTrigger>

              <div className="hidden md:flex relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search..."
                  className="pl-9 w-64"
                  data-testid="input-search"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              {(user.role === "SUPER_ADMIN" || user.role === "ADMIN") && (
                <Link href="/admin">
                  <Button variant="outline" size="sm" className="gap-2" data-testid="button-admin-view">
                    <Shield className="h-4 w-4" />
                    <span className="hidden sm:inline">Admin View</span>
                  </Button>
                </Link>
              )}
              <ThemeToggle />
              
              <NotificationBell />

              <div className="md:hidden">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.profileImage || undefined} />
                        <AvatarFallback className="text-xs">{userInitials}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>
                      {user.firstName} {user.lastName}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => logoutMutation.mutate()}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
