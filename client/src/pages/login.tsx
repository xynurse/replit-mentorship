import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useLocation } from "wouter";
import {
  Loader2, Eye, EyeOff, Heart, Microscope, Lightbulb, Rocket,
  Building2, Crown, Users, Globe, Calendar, ArrowRight, ChevronRight
} from "lucide-react";
import { useState, useEffect } from "react";
import { loginSchema, LoginInput } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ThemeToggle } from "@/components/theme-toggle";
import { useTheme } from "@/components/theme-provider";
import { StatusBoard } from "@/components/status-board";

const tracks = [
  { name: 'Scientist', icon: Microscope, desc: 'Research & Evidence-Based Practice', color: '#4F7A5E' },
  { name: 'Innovator', icon: Lightbulb, desc: 'Design Thinking & Solutions', color: '#B07D3F' },
  { name: 'Entrepreneur', icon: Rocket, desc: 'Healthcare Ventures & Startups', color: '#C2674A' },
  { name: 'Intrapreneur', icon: Building2, desc: 'Organizational Change & Innovation', color: '#3F8A7D' },
  { name: 'Leader', icon: Crown, desc: 'Executive & Strategic Leadership', color: '#5B6B86' },
];

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [activeTrack, setActiveTrack] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [, setLocation] = useLocation();
  const { loginMutation, user } = useAuth();
  const { theme } = useTheme();

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  useEffect(() => {
    setIsLoaded(true);
    const interval = setInterval(() => {
      setActiveTrack((prev) => (prev + 1) % 5);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (user) {
      setLocation("/");
    }
  }, [user, setLocation]);

  function onSubmit(values: LoginInput) {
    loginMutation.mutate(values);
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-background">
      <style>{`
        .track-card:hover {
          transform: translateY(-2px);
        }
      `}</style>

      {/* Header */}
      <header
        className="relative z-10 px-6 md:px-12 py-6 flex justify-between items-center transition-opacity duration-600"
        style={{ opacity: isLoaded ? 1 : 0 }}
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-primary">
            <Heart size={24} strokeWidth={2.25} className="text-primary-foreground" />
          </div>
          <div>
            <div className="text-[22px] font-semibold tracking-tight text-foreground">SONSIEL</div>
            <div className="text-[11px] text-muted-foreground tracking-[2px] uppercase font-medium">Mentorship Hub</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <button
            onClick={() => setShowLoginForm(true)}
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium transition-colors bg-primary/10 hover:bg-primary/15 text-primary border border-primary/20"
            data-testid="button-show-login"
          >
            Sign In
            <ArrowRight size={16} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 px-6 md:px-12 py-8 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-start">
          {/* Left Column - Hero */}
          <div
            className="transition-all duration-800"
            style={{
              opacity: isLoaded ? 1 : 0,
              transform: isLoaded ? 'translateY(0)' : 'translateY(20px)',
              transitionDelay: '0.15s'
            }}
          >
            <div className="inline-flex items-center gap-2 rounded-full px-4 py-2 mb-6 text-[13px] bg-accent border border-border text-accent-foreground">
              <Calendar size={14} />
              2026 Cohort Now Active
            </div>

            <h1 className="text-4xl md:text-5xl font-semibold leading-tight mb-6 text-foreground tracking-tight">
              Advancing Nursing Excellence Through Mentorship
            </h1>

            <p className="text-lg text-muted-foreground leading-relaxed mb-8 max-w-lg">
              The <strong className="text-foreground font-medium">Society of Nurse Scientists, Innovators, Entrepreneurs &amp; Leaders</strong> connects nursing professionals with expert mentors across five specialized career tracks.
            </p>

            {/* Stats */}
            <div className="flex gap-10 pt-6 border-t border-border">
              <div>
                <div className="text-3xl font-semibold text-primary">5</div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider">Career Tracks</div>
              </div>
              <div>
                <div className="text-3xl font-semibold text-foreground">6-12</div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider">Month Programs</div>
              </div>
              <div>
                <div className="text-3xl font-semibold text-primary">
                  <Globe size={28} className="inline" />
                </div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider">Global Network</div>
              </div>
            </div>
          </div>

          {/* Right Column - Track Cards or Login Form */}
          <div
            className="transition-all duration-800"
            style={{
              opacity: isLoaded ? 1 : 0,
              transform: isLoaded ? 'translateX(0)' : 'translateX(20px)',
              transitionDelay: '0.3s'
            }}
          >
            {!showLoginForm ? (
              <>
                <div className="text-xs text-muted-foreground uppercase tracking-[2px] mb-4 font-semibold">
                  Specialized Mentorship Tracks
                </div>
                <div className="flex flex-col gap-3">
                  {tracks.map((track, index) => {
                    const Icon = track.icon;
                    const isActive = activeTrack === index;
                    return (
                      <div
                        key={track.name}
                        className="track-card cursor-pointer transition-all duration-300 relative overflow-hidden rounded-xl p-5 flex items-center gap-4 border bg-card"
                        onClick={() => setActiveTrack(index)}
                        style={{
                          borderColor: isActive ? track.color : 'hsl(var(--card-border))',
                          boxShadow: isActive ? 'var(--shadow-sm)' : 'none',
                        }}
                        data-testid={`track-card-${track.name.toLowerCase()}`}
                      >
                        {isActive && (
                          <div
                            className="absolute left-0 top-0 bottom-0 w-1"
                            style={{ background: track.color }}
                          />
                        )}
                        <div
                          className="w-12 h-12 rounded-lg flex items-center justify-center transition-colors duration-300 shrink-0"
                          style={{
                            background: isActive ? `${track.color}1A` : 'hsl(var(--muted))',
                          }}
                        >
                          <Icon size={22} color={isActive ? track.color : 'hsl(var(--muted-foreground))'} />
                        </div>
                        <div className="flex-1">
                          <div className={`text-base font-medium mb-0.5 ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                            {track.name} Track
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {track.desc}
                          </div>
                        </div>
                        <ChevronRight
                          size={18}
                          color={isActive ? track.color : 'hsl(var(--muted-foreground))'}
                          style={{ opacity: isActive ? 1 : 0 }}
                          className="transition-opacity duration-300"
                        />
                      </div>
                    );
                  })}
                </div>
                <Button
                  onClick={() => setShowLoginForm(true)}
                  className="w-full mt-6 h-14 text-base font-medium"
                  data-testid="button-sign-in-cta"
                >
                  Sign In to Your Account
                  <ChevronRight size={18} className="ml-1" />
                </Button>
              </>
            ) : (
              /* Login Form */
              <div className="rounded-xl p-8 bg-card border border-card-border shadow-sm">
                <div className="mb-6">
                  <h2 className="text-2xl font-semibold text-foreground mb-2">Welcome back</h2>
                  <p className="text-muted-foreground text-sm">Sign in to continue your mentorship journey</p>
                </div>

                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-foreground text-sm">Email address</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="you@example.com"
                              className="h-12"
                              data-testid="input-email"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-center justify-between">
                            <FormLabel className="text-foreground text-sm">Password</FormLabel>
                            <Link href="/forgot-password">
                              <span className="text-sm text-primary hover:text-primary/80 cursor-pointer transition-colors" data-testid="link-forgot-password">
                                Forgot password?
                              </span>
                            </Link>
                          </div>
                          <FormControl>
                            <div className="relative">
                              <Input
                                type={showPassword ? "text" : "password"}
                                placeholder="Enter your password"
                                className="h-12 pr-12"
                                data-testid="input-password"
                                {...field}
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent text-muted-foreground hover:text-foreground"
                                onClick={() => setShowPassword(!showPassword)}
                                data-testid="button-toggle-password"
                              >
                                {showPassword ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="rememberMe"
                      render={({ field }) => (
                        <FormItem className="flex items-center gap-2">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="checkbox-remember"
                            />
                          </FormControl>
                          <FormLabel className="!mt-0 font-normal text-sm text-muted-foreground cursor-pointer">
                            Remember me for 30 days
                          </FormLabel>
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      className="w-full h-12 text-base font-medium"
                      disabled={loginMutation.isPending}
                      data-testid="button-login"
                    >
                      {loginMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Signing in...
                        </>
                      ) : (
                        "Sign in"
                      )}
                    </Button>
                  </form>
                </Form>

                <button
                  onClick={() => setShowLoginForm(false)}
                  className="w-full mt-4 py-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  data-testid="button-back-to-tracks"
                >
                  ← Back to overview
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Program Features */}
        <div
          className="mt-16 rounded-xl p-8 grid grid-cols-2 md:grid-cols-4 gap-8 transition-all duration-800 bg-card border border-card-border"
          style={{
            opacity: isLoaded ? 1 : 0,
            transform: isLoaded ? 'translateY(0)' : 'translateY(20px)',
            transitionDelay: '0.45s'
          }}
        >
          <div className="text-center">
            <div className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-4 bg-accent">
              <Users size={24} className="text-primary" />
            </div>
            <div className="text-[15px] font-medium text-foreground mb-1">1:1 Matching</div>
            <div className="text-[13px] text-muted-foreground leading-relaxed">
              Personalized mentor-mentee pairing
            </div>
          </div>
          <div className="text-center">
            <div className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-4 bg-accent">
              <Microscope size={24} className="text-primary" />
            </div>
            <div className="text-[15px] font-medium text-foreground mb-1">SMART Goals</div>
            <div className="text-[13px] text-muted-foreground leading-relaxed">
              Structured goal-setting framework
            </div>
          </div>
          <div className="text-center">
            <div className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-4 bg-accent">
              <Globe size={24} className="text-primary" />
            </div>
            <div className="text-[15px] font-medium text-foreground mb-1">Global Community</div>
            <div className="text-[13px] text-muted-foreground leading-relaxed">
              Worldwide nursing network
            </div>
          </div>
          <div className="text-center">
            <div className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-4 bg-accent">
              <Lightbulb size={24} className="text-primary" />
            </div>
            <div className="text-[15px] font-medium text-foreground mb-1">Track Resources</div>
            <div className="text-[13px] text-muted-foreground leading-relaxed">
              Specialized tools &amp; templates
            </div>
          </div>
        </div>
      </main>

      {/* Status Board */}
      <div
        className="relative z-10 px-6 md:px-12 py-4 max-w-md transition-opacity duration-600"
        style={{ opacity: isLoaded ? 1 : 0, transitionDelay: '0.6s' }}
      >
        <StatusBoard />
      </div>

      {/* Footer */}
      <footer
        className="relative z-10 px-6 md:px-12 py-6 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4 transition-opacity duration-600"
        style={{ opacity: isLoaded ? 1 : 0, transitionDelay: '0.7s' }}
      >
        <div className="text-[13px] text-muted-foreground">
          © 2026 SONSIEL - Society of Nurse Scientists, Innovators, Entrepreneurs &amp; Leaders
        </div>
        <div className="text-[13px] text-muted-foreground flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-primary animate-pulse" />
          Empowering the next generation of nursing leaders
        </div>
      </footer>
    </div>
  );
}
