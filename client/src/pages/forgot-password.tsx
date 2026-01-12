import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "wouter";
import { Loader2, ArrowLeft, Mail, CheckCircle, Heart } from "lucide-react";
import { useState, useEffect } from "react";
import { forgotPasswordSchema, ForgotPasswordInput } from "@shared/schema";
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

export default function ForgotPasswordPage() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const { forgotPasswordMutation } = useAuth();
  const { theme } = useTheme();

  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  function onSubmit(values: ForgotPasswordInput) {
    forgotPasswordMutation.mutate(values, {
      onSuccess: () => setIsSubmitted(true),
    });
  }

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
            {isSubmitted ? (
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
                  <h2 className="text-2xl font-bold text-foreground mb-2">Check your email</h2>
                  <p className="text-muted-foreground">
                    We've sent an email to{" "}
                    <span className="font-medium text-foreground">{form.getValues("email")}</span>
                    {" "}with a link to reset your password.
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    The link will expire in 1 hour.
                  </p>
                </div>

                <div className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setIsSubmitted(false)}
                    data-testid="button-try-again"
                  >
                    <Mail className="mr-2 h-4 w-4" />
                    Try a different email
                  </Button>

                  <Link href="/login">
                    <Button variant="ghost" className="w-full" data-testid="link-back-login">
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back to sign in
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <>
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-foreground mb-2">Reset your password</h2>
                  <p className="text-muted-foreground">
                    Enter your email and we'll send you a reset link
                  </p>
                </div>

                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email address</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="you@example.com"
                              data-testid="input-email"
                              className="h-12 bg-background/50"
                              {...field}
                            />
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
                      disabled={forgotPasswordMutation.isPending}
                      data-testid="button-reset"
                    >
                      {forgotPasswordMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        "Send reset link"
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
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
