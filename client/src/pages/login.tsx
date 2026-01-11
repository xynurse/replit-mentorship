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

const tracks = [
  { name: 'Scientist', icon: Microscope, desc: 'Research & Evidence-Based Practice', color: '#60A5FA' },
  { name: 'Innovator', icon: Lightbulb, desc: 'Design Thinking & Solutions', color: '#FBBF24' },
  { name: 'Entrepreneur', icon: Rocket, desc: 'Healthcare Ventures & Startups', color: '#F472B6' },
  { name: 'Intrapreneur', icon: Building2, desc: 'Organizational Change & Innovation', color: '#34D399' },
  { name: 'Leader', icon: Crown, desc: 'Executive & Strategic Leadership', color: '#A78BFA' },
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
    <div 
      className="min-h-screen relative overflow-hidden bg-background dark:bg-[#0F172A]"
      style={{
        fontFamily: "'Outfit', 'Segoe UI', sans-serif",
      }}
    >
      {/* Dark mode animated background */}
      {theme === 'dark' && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div 
            className="absolute rounded-full"
            style={{
              top: '-20%',
              right: '-10%',
              width: '600px',
              height: '600px',
              background: 'radial-gradient(circle, rgba(96,165,250,0.15) 0%, transparent 70%)',
              animation: 'float 8s ease-in-out infinite',
            }} 
          />
          <div 
            className="absolute rounded-full"
            style={{
              bottom: '-30%',
              left: '-15%',
              width: '800px',
              height: '800px',
              background: 'radial-gradient(circle, rgba(20,184,166,0.12) 0%, transparent 70%)',
              animation: 'float 10s ease-in-out infinite reverse',
            }} 
          />
          <div 
            className="absolute inset-0"
            style={{
              backgroundImage: `
                linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)
              `,
              backgroundSize: '60px 60px'
            }} 
          />
        </div>
      )}

      {/* Light mode subtle background */}
      {theme === 'light' && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div 
            className="absolute rounded-full opacity-30"
            style={{
              top: '-20%',
              right: '-10%',
              width: '600px',
              height: '600px',
              background: 'radial-gradient(circle, rgba(20,184,166,0.2) 0%, transparent 70%)',
            }} 
          />
          <div 
            className="absolute rounded-full opacity-20"
            style={{
              bottom: '-30%',
              left: '-15%',
              width: '800px',
              height: '800px',
              background: 'radial-gradient(circle, rgba(96,165,250,0.15) 0%, transparent 70%)',
            }} 
          />
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');
        
        .track-card:hover {
          transform: translateY(-4px);
        }
      `}</style>

      {/* Header */}
      <header 
        className="relative z-10 px-6 md:px-12 py-6 flex justify-between items-center transition-opacity duration-600"
        style={{ opacity: isLoaded ? 1 : 0 }}
      >
        <div className="flex items-center gap-3">
          <div 
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #14B8A6 0%, #0D9488 100%)',
              boxShadow: '0 8px 24px -8px rgba(20,184,166,0.5)'
            }}
          >
            <Heart size={26} strokeWidth={2.5} className="text-white" />
          </div>
          <div>
            <div className="text-[22px] font-bold tracking-tight text-foreground">SONSIEL</div>
            <div className="text-[11px] text-muted-foreground tracking-[2px] uppercase font-medium">Mentorship Hub</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <button 
            onClick={() => setShowLoginForm(true)}
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium transition-all duration-300 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 dark:bg-white/10 dark:hover:bg-white/15 dark:text-slate-50 dark:border-white/20"
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
              transform: isLoaded ? 'translateY(0)' : 'translateY(30px)',
              transitionDelay: '0.2s'
            }}
          >
            <div 
              className="inline-flex items-center gap-2 rounded-full px-4 py-2 mb-6 text-[13px] bg-primary/10 border border-primary/30 text-primary dark:bg-teal-500/15 dark:border-teal-500/30 dark:text-teal-300"
            >
              <Calendar size={14} />
              2026 Cohort Now Active
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-6 text-foreground tracking-tight">
              Advancing{' '}
              <span className="bg-gradient-to-r from-teal-500 to-blue-500 bg-clip-text text-transparent">
                Nursing Excellence
              </span>{' '}
              Through Mentorship
            </h1>
            
            <p className="text-lg text-muted-foreground leading-relaxed mb-8 max-w-lg">
              The <strong className="text-foreground">Society of Nurse Scientists, Innovators, Entrepreneurs & Leaders</strong> connects nursing professionals with expert mentors across five specialized career tracks.
            </p>

            {/* Stats */}
            <div className="flex gap-10 pt-6 border-t border-border">
              <div>
                <div className="text-3xl font-bold text-teal-500">5</div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider">Career Tracks</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-blue-500">6-12</div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider">Month Programs</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-purple-500">
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
              transform: isLoaded ? 'translateX(0)' : 'translateX(30px)',
              transitionDelay: '0.4s'
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
                        className="track-card cursor-pointer transition-all duration-400 relative overflow-hidden rounded-2xl p-5 flex items-center gap-4"
                        onClick={() => setActiveTrack(index)}
                        style={{
                          background: isActive 
                            ? `linear-gradient(135deg, ${track.color}15 0%, ${track.color}08 100%)`
                            : theme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                          border: `1px solid ${isActive ? track.color + '40' : theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
                        }}
                        data-testid={`track-card-${track.name.toLowerCase()}`}
                      >
                        {isActive && (
                          <div 
                            className="absolute left-0 top-0 bottom-0 w-1 rounded-r"
                            style={{ background: track.color }}
                          />
                        )}
                        <div 
                          className="w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300"
                          style={{
                            background: isActive ? `${track.color}25` : theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                          }}
                        >
                          <Icon size={24} color={isActive ? track.color : theme === 'dark' ? '#64748B' : '#94A3B8'} />
                        </div>
                        <div className="flex-1">
                          <div 
                            className="text-base font-semibold mb-1"
                            style={{ color: isActive ? (theme === 'dark' ? '#F8FAFC' : '#1e293b') : (theme === 'dark' ? '#CBD5E1' : '#64748B') }}
                          >
                            {track.name} Track
                          </div>
                          <div 
                            className="text-sm"
                            style={{ color: isActive ? (theme === 'dark' ? '#94A3B8' : '#64748B') : (theme === 'dark' ? '#475569' : '#94A3B8') }}
                          >
                            {track.desc}
                          </div>
                        </div>
                        <ChevronRight 
                          size={18} 
                          color={isActive ? track.color : '#475569'} 
                          style={{ opacity: isActive ? 1 : 0 }}
                          className="transition-opacity duration-300"
                        />
                      </div>
                    );
                  })}
                </div>
                <button 
                  onClick={() => setShowLoginForm(true)}
                  className="w-full mt-6 py-4 rounded-xl text-base font-semibold text-white flex items-center justify-center gap-2 transition-all duration-300 hover:-translate-y-0.5"
                  style={{
                    background: 'linear-gradient(135deg, #14B8A6 0%, #0D9488 100%)',
                    boxShadow: '0 12px 32px -8px rgba(20,184,166,0.4)'
                  }}
                  data-testid="button-sign-in-cta"
                >
                  Sign In to Your Account
                  <ChevronRight size={18} />
                </button>
              </>
            ) : (
              /* Login Form */
              <div 
                className="rounded-2xl p-8 bg-card dark:bg-white/5 border border-border dark:border-white/10"
                style={{ backdropFilter: 'blur(20px)' }}
              >
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-foreground mb-2">Welcome back</h2>
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
                      className="w-full h-12 text-base font-semibold"
                      disabled={loginMutation.isPending}
                      style={{
                        background: 'linear-gradient(135deg, #14B8A6 0%, #0D9488 100%)',
                      }}
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
          className="mt-16 rounded-3xl p-8 grid grid-cols-2 md:grid-cols-4 gap-8 transition-all duration-800 bg-card/50 dark:bg-white/[0.03] border border-border dark:border-white/[0.08]"
          style={{
            opacity: isLoaded ? 1 : 0,
            transform: isLoaded ? 'translateY(0)' : 'translateY(30px)',
            transitionDelay: '0.6s'
          }}
        >
          <div className="text-center">
            <div 
              className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{
                background: 'linear-gradient(135deg, rgba(20,184,166,0.2) 0%, rgba(20,184,166,0.05) 100%)',
              }}
            >
              <Users size={26} className="text-teal-500" />
            </div>
            <div className="text-[15px] font-semibold text-foreground mb-1">1:1 Matching</div>
            <div className="text-[13px] text-muted-foreground leading-relaxed">
              Personalized mentor-mentee pairing
            </div>
          </div>
          <div className="text-center">
            <div 
              className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{
                background: 'linear-gradient(135deg, rgba(96,165,250,0.2) 0%, rgba(96,165,250,0.05) 100%)',
              }}
            >
              <Microscope size={26} className="text-blue-500" />
            </div>
            <div className="text-[15px] font-semibold text-foreground mb-1">SMART Goals</div>
            <div className="text-[13px] text-muted-foreground leading-relaxed">
              Structured goal-setting framework
            </div>
          </div>
          <div className="text-center">
            <div 
              className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{
                background: 'linear-gradient(135deg, rgba(167,139,250,0.2) 0%, rgba(167,139,250,0.05) 100%)',
              }}
            >
              <Globe size={26} className="text-purple-500" />
            </div>
            <div className="text-[15px] font-semibold text-foreground mb-1">Global Community</div>
            <div className="text-[13px] text-muted-foreground leading-relaxed">
              Worldwide nursing network
            </div>
          </div>
          <div className="text-center">
            <div 
              className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{
                background: 'linear-gradient(135deg, rgba(251,191,36,0.2) 0%, rgba(251,191,36,0.05) 100%)',
              }}
            >
              <Lightbulb size={26} className="text-yellow-500" />
            </div>
            <div className="text-[15px] font-semibold text-foreground mb-1">Track Resources</div>
            <div className="text-[13px] text-muted-foreground leading-relaxed">
              Specialized tools & templates
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer 
        className="relative z-10 px-6 md:px-12 py-6 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4 transition-opacity duration-600"
        style={{ opacity: isLoaded ? 1 : 0, transitionDelay: '0.8s' }}
      >
        <div className="text-[13px] text-muted-foreground">
          © 2026 SONSIEL - Society of Nurse Scientists, Innovators, Entrepreneurs & Leaders
        </div>
        <div className="text-[13px] text-muted-foreground flex items-center gap-2">
          <span 
            className="inline-block w-2 h-2 rounded-full animate-pulse"
            style={{ background: '#22C55E' }}
          />
          Empowering the next generation of nursing leaders
        </div>
      </footer>
    </div>
  );
}
