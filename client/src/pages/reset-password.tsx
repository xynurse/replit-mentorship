import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useLocation, useParams } from "wouter";
import { Loader2, Eye, EyeOff, ArrowLeft, CheckCircle, AlertCircle, Heart, Lock } from "lucide-react";
import { useState, useEffect } from "react";
import { resetPasswordSchema, ResetPasswordInput } from "@shared/schema";
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
import { ThemeToggle } from "@/components/theme-toggle";
import { useTheme } from "@/components/theme-provider";

export default function ResetPasswordPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [, setLocation] = useLocation();
  const params = useParams<{ token: string }>();
  const { resetPasswordMutation } = useAuth();
  const { theme } = useTheme();

  const form = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  function onSubmit(values: ResetPasswordInput) {
    if (!params.token) return;
    
    resetPasswordMutation.mutate(
      { token: params.token, password: values.password },
      {
        onSuccess: () => setIsSuccess(true),
      }
    );
  }

  const renderContent = () => {
    if (!params.token) {
      return (
        <div className="text-center space-y-6">
          <div 
            className="mx-auto w-16 h-16 rounded-full flex items-center justify-center bg-destructive/10"
          >
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>

          <div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Invalid link</h2>
            <p className="text-muted-foreground">
              This password reset link is invalid or has expired. Please request a new one.
            </p>
          </div>

          <Link href="/forgot-password">
            <Button 
              className="w-full h-12"
              style={{
                background: 'linear-gradient(135deg, #14B8A6 0%, #0D9488 100%)',
              }}
              data-testid="link-request-new"
            >
              Request new link
            </Button>
          </Link>
        </div>
      );
    }

    if (isSuccess) {
      return (
        <div className="text-center space-y-6">
          <div 
            className="mx-auto w-16 h-16 rounded-full flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #14B8A6 0%, #0D9488 100%)',
              boxShadow: '0 8px 24px -8px rgba(20,184,166,0.5)'
            }}
          >
            <CheckCircle className="h-8 w-8 text-white" />
          </div>

          <div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Password reset successful</h2>
            <p className="text-muted-foreground">
              Your password has been changed. You can now sign in with your new password.
            </p>
          </div>

          <Button
            className="w-full h-12"
            style={{
              background: 'linear-gradient(135deg, #14B8A6 0%, #0D9488 100%)',
            }}
            onClick={() => setLocation("/login")}
            data-testid="button-go-login"
          >
            Sign in
          </Button>
        </div>
      );
    }

    return (
      <>
        <div className="text-center mb-8">
          <div 
            className="mx-auto w-14 h-14 rounded-full flex items-center justify-center mb-4"
            style={{
              background: 'linear-gradient(135deg, #14B8A6 0%, #0D9488 100%)',
              boxShadow: '0 8px 24px -8px rgba(20,184,166,0.5)'
            }}
          >
            <Lock className="h-7 w-7 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Create new password</h2>
          <p className="text-muted-foreground">
            Enter a strong password for your account
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter new password"
                        data-testid="input-password"
                        className="h-12 bg-background/50 pr-12"
                        {...field}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                        data-testid="button-toggle-password"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
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
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm new password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm new password"
                        data-testid="input-confirm-password"
                        className="h-12 bg-background/50 pr-12"
                        {...field}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        data-testid="button-toggle-confirm-password"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full h-12 text-base font-medium"
              style={{
                background: 'linear-gradient(135deg, #14B8A6 0%, #0D9488 100%)',
              }}
              disabled={resetPasswordMutation.isPending}
              data-testid="button-reset"
            >
              {resetPasswordMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Resetting...
                </>
              ) : (
                "Reset password"
              )}
            </Button>

            <Link href="/login">
              <Button variant="ghost" className="w-full" type="button" data-testid="link-back-login">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to sign in
              </Button>
            </Link>
          </form>
        </Form>
      </>
    );
  };

  return (
    <div 
      className="min-h-screen relative overflow-hidden bg-background dark:bg-[#0F172A]"
      style={{
        fontFamily: "'Outfit', 'Segoe UI', sans-serif",
      }}
    >
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
      `}</style>

      <header 
        className="relative z-10 px-6 md:px-12 py-6 flex justify-between items-center transition-opacity duration-600"
        style={{ opacity: isLoaded ? 1 : 0 }}
      >
        <Link href="/login">
          <div className="flex items-center gap-3 cursor-pointer">
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
        </Link>
        <ThemeToggle />
      </header>

      <main className="relative z-10 flex items-center justify-center px-6 md:px-12 py-8 min-h-[calc(100vh-100px)]">
        <div 
          className="w-full max-w-md transition-all duration-800"
          style={{ 
            opacity: isLoaded ? 1 : 0,
            transform: isLoaded ? 'translateY(0)' : 'translateY(30px)',
            transitionDelay: '0.2s'
          }}
        >
          <div 
            className="rounded-2xl p-8 backdrop-blur-sm border"
            style={{
              background: theme === 'dark' 
                ? 'rgba(30, 41, 59, 0.8)'
                : 'rgba(255, 255, 255, 0.9)',
              borderColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
              boxShadow: theme === 'dark' 
                ? '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                : '0 25px 50px -12px rgba(0, 0, 0, 0.1)'
            }}
          >
            {renderContent()}
          </div>
        </div>
      </main>
    </div>
  );
}
