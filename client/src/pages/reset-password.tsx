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

export default function ResetPasswordPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [, setLocation] = useLocation();
  const params = useParams<{ token: string }>();
  const { resetPasswordMutation } = useAuth();

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
          <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center bg-destructive/10">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-foreground mb-2">Invalid link</h2>
            <p className="text-muted-foreground">
              This password reset link is invalid or has expired. Please request a new one.
            </p>
          </div>

          <Link href="/forgot-password">
            <Button className="w-full h-12" data-testid="link-request-new">
              Request new link
            </Button>
          </Link>
        </div>
      );
    }

    if (isSuccess) {
      return (
        <div className="text-center space-y-6">
          <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center bg-success/10 text-success">
            <CheckCircle className="h-8 w-8" />
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-foreground mb-2">Password reset successful</h2>
            <p className="text-muted-foreground">
              Your password has been changed. You can now sign in with your new password.
            </p>
          </div>

          <Button
            className="w-full h-12"
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
          <div className="mx-auto w-14 h-14 rounded-full flex items-center justify-center mb-4 bg-primary text-primary-foreground">
            <Lock className="h-7 w-7" />
          </div>
          <h2 className="text-2xl font-semibold text-foreground mb-2">Create new password</h2>
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
                        className="h-12 pr-12"
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
                        className="h-12 pr-12"
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
    <div className="min-h-screen relative overflow-hidden bg-background">
      <header
        className="relative z-10 px-6 md:px-12 py-6 flex justify-between items-center transition-opacity duration-600"
        style={{ opacity: isLoaded ? 1 : 0 }}
      >
        <Link href="/login">
          <div className="flex items-center gap-3 cursor-pointer">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-primary">
              <Heart size={24} strokeWidth={2.25} className="text-primary-foreground" />
            </div>
            <div>
              <div className="text-[22px] font-semibold tracking-tight text-foreground">SONSIEL</div>
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
          <div className="rounded-xl p-8 bg-card border border-card-border shadow-sm">
            {renderContent()}
          </div>
        </div>
      </main>
    </div>
  );
}
