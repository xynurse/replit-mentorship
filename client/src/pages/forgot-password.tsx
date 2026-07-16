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

export default function ForgotPasswordPage() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const { forgotPasswordMutation } = useAuth();

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
            {isSubmitted ? (
              <div className="text-center space-y-6">
                <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center bg-success/10 text-success">
                  <CheckCircle className="h-8 w-8" />
                </div>

                <div>
                  <h2 className="text-2xl font-semibold text-foreground mb-2">Check your email</h2>
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
                  <h2 className="text-2xl font-semibold text-foreground mb-2">Reset your password</h2>
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
                              className="h-12"
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
