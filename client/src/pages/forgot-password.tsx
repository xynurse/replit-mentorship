import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "wouter";
import { Loader2, ArrowLeft, Mail, CheckCircle } from "lucide-react";
import { useState } from "react";
import { forgotPasswordSchema, ForgotPasswordInput } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { AuthLayout } from "@/components/shared/auth-layout";
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

export default function ForgotPasswordPage() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { forgotPasswordMutation } = useAuth();

  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  function onSubmit(values: ForgotPasswordInput) {
    forgotPasswordMutation.mutate(values, {
      onSuccess: () => setIsSubmitted(true),
    });
  }

  if (isSubmitted) {
    return (
      <AuthLayout
        title="Check your email"
        subtitle="We've sent password reset instructions"
      >
        <div className="text-center space-y-6">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <CheckCircle className="h-8 w-8 text-primary" />
          </div>

          <div className="space-y-2">
            <p className="text-muted-foreground">
              We've sent an email to{" "}
              <span className="font-medium text-foreground">{form.getValues("email")}</span>
              {" "}with a link to reset your password.
            </p>
            <p className="text-sm text-muted-foreground">
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
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="Enter your email and we'll send you a reset link"
    >
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
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="w-full"
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
    </AuthLayout>
  );
}
