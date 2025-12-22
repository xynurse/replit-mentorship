import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation } from "wouter";
import { Loader2, Heart, Globe, Briefcase, FileText, CheckCircle } from "lucide-react";
import { useState, useCallback } from "react";
import { completeProfileSchema, CompleteProfileInput } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

const STEPS = [
  { id: 1, title: "Personal", icon: Globe },
  { id: 2, title: "Professional", icon: Briefcase },
  { id: 3, title: "About You", icon: FileText },
];

const LANGUAGES = [
  "English",
  "Spanish",
  "Portuguese",
  "French",
  "German",
  "Mandarin",
  "Hindi",
  "Arabic",
  "Japanese",
  "Korean",
];

const TIMEZONES = [
  { value: "America/New_York", label: "Eastern Time (ET)" },
  { value: "America/Chicago", label: "Central Time (CT)" },
  { value: "America/Denver", label: "Mountain Time (MT)" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  { value: "America/Sao_Paulo", label: "Brasilia Time (BRT)" },
  { value: "Europe/London", label: "Greenwich Mean Time (GMT)" },
  { value: "Europe/Paris", label: "Central European Time (CET)" },
  { value: "Asia/Tokyo", label: "Japan Standard Time (JST)" },
];

const PREFERRED_LANGUAGES = [
  { value: "en", label: "English" },
  { value: "es", label: "Spanish" },
  { value: "pt", label: "Portuguese" },
];

export default function CompleteProfilePage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [, setLocation] = useLocation();
  const { user, completeProfileMutation } = useAuth();

  const form = useForm<CompleteProfileInput>({
    resolver: zodResolver(completeProfileSchema),
    defaultValues: {
      phone: "",
      timezone: "America/New_York",
      preferredLanguage: "en",
      languagesSpoken: ["English"],
      bio: "",
      linkedInUrl: "",
      organizationName: "",
      jobTitle: "",
      yearsOfExperience: 0,
    },
  });

  function onSubmit(values: CompleteProfileInput) {
    completeProfileMutation.mutate(values, {
      onSuccess: () => setLocation("/"),
    });
  }

  const nextStep = async () => {
    let fieldsToValidate: (keyof CompleteProfileInput)[] = [];
    
    if (currentStep === 1) {
      fieldsToValidate = ["timezone", "preferredLanguage", "languagesSpoken"];
    } else if (currentStep === 2) {
      fieldsToValidate = ["organizationName", "jobTitle", "yearsOfExperience"];
    }

    const result = await form.trigger(fieldsToValidate);
    if (result) {
      setCurrentStep((prev) => Math.min(prev + 1, 3));
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-md bg-primary/10">
              <Heart className="h-6 w-6 text-primary" />
            </div>
            <span className="text-xl font-semibold">SONSIEL Mentorship Hub</span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold">Complete your profile</h1>
          <p className="text-muted-foreground mt-1">
            Welcome, {user?.firstName}! Let's set up your profile to help you get the most out of your mentorship experience.
          </p>
        </div>

        <div className="flex gap-4 mb-8">
          {STEPS.map((step) => {
            const StepIcon = step.icon;
            const isComplete = currentStep > step.id;
            const isCurrent = currentStep === step.id;

            return (
              <div
                key={step.id}
                className={cn(
                  "flex-1 relative",
                  step.id !== STEPS.length && "after:absolute after:top-5 after:left-[calc(50%+24px)] after:w-[calc(100%-48px)] after:h-0.5",
                  isComplete ? "after:bg-primary" : "after:bg-border"
                )}
              >
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors",
                      isComplete && "bg-primary border-primary text-primary-foreground",
                      isCurrent && "border-primary text-primary",
                      !isComplete && !isCurrent && "border-border text-muted-foreground"
                    )}
                  >
                    {isComplete ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      <StepIcon className="h-5 w-5" />
                    )}
                  </div>
                  <span
                    className={cn(
                      "mt-2 text-sm font-medium",
                      isCurrent ? "text-foreground" : "text-muted-foreground"
                    )}
                  >
                    {step.title}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <Card className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <h2 className="text-lg font-medium">Personal Information</h2>
                    <p className="text-sm text-muted-foreground">
                      Help us personalize your experience with language and timezone preferences.
                    </p>
                  </div>

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone number (optional)</FormLabel>
                        <FormControl>
                          <Input
                            type="tel"
                            placeholder="+1 (555) 123-4567"
                            data-testid="input-phone"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          For mentorship session reminders
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="timezone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Timezone</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-timezone">
                                <SelectValue placeholder="Select timezone" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {TIMEZONES.map((tz) => (
                                <SelectItem key={tz.value} value={tz.value}>
                                  {tz.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="preferredLanguage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Preferred language</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-language">
                                <SelectValue placeholder="Select language" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {PREFERRED_LANGUAGES.map((lang) => (
                                <SelectItem key={lang.value} value={lang.value}>
                                  {lang.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <LanguagesField form={form} />
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <h2 className="text-lg font-medium">Professional Background</h2>
                    <p className="text-sm text-muted-foreground">
                      Tell us about your professional experience in healthcare.
                    </p>
                  </div>

                  <FormField
                    control={form.control}
                    name="organizationName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Organization / Hospital</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., Memorial Healthcare System"
                            data-testid="input-organization"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="jobTitle"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Job title</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., Registered Nurse"
                              data-testid="input-job-title"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="yearsOfExperience"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Years of experience</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={0}
                              max={50}
                              placeholder="0"
                              data-testid="input-experience"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="linkedInUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>LinkedIn profile (optional)</FormLabel>
                        <FormControl>
                          <Input
                            type="url"
                            placeholder="https://linkedin.com/in/yourprofile"
                            data-testid="input-linkedin"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <h2 className="text-lg font-medium">About You</h2>
                    <p className="text-sm text-muted-foreground">
                      Share a bit about yourself to help mentors and mentees connect with you.
                    </p>
                  </div>

                  <FormField
                    control={form.control}
                    name="bio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bio</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Tell us about your background, interests, and what you hope to achieve through mentorship..."
                            className="min-h-[150px] resize-none"
                            data-testid="textarea-bio"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          {field.value?.length || 0}/500 characters
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              <div className="flex justify-between pt-4 border-t">
                {currentStep > 1 ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={prevStep}
                    data-testid="button-back"
                  >
                    Back
                  </Button>
                ) : (
                  <div />
                )}

                {currentStep < 3 ? (
                  <Button
                    type="button"
                    onClick={nextStep}
                    data-testid="button-next"
                  >
                    Continue
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={completeProfileMutation.isPending}
                    data-testid="button-complete"
                  >
                    {completeProfileMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Completing...
                      </>
                    ) : (
                      "Complete profile"
                    )}
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </Card>
      </div>
    </div>
  );
}

function LanguagesField({ form }: { form: ReturnType<typeof useForm<CompleteProfileInput>> }) {
  const selectedLanguages = useWatch({
    control: form.control,
    name: "languagesSpoken",
    defaultValue: ["English"],
  });

  const handleChange = useCallback((language: string, checked: boolean) => {
    const current = form.getValues("languagesSpoken") || [];
    if (checked) {
      form.setValue("languagesSpoken", [...current, language], { shouldValidate: true });
    } else {
      form.setValue("languagesSpoken", current.filter((l) => l !== language), { shouldValidate: true });
    }
  }, [form]);

  return (
    <FormField
      control={form.control}
      name="languagesSpoken"
      render={() => (
        <FormItem>
          <FormLabel>Languages spoken</FormLabel>
          <FormDescription>
            Select all languages you're comfortable communicating in
          </FormDescription>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
            {LANGUAGES.map((language) => {
              const isChecked = selectedLanguages?.includes(language) || false;
              return (
                <div key={language} className="flex items-center gap-2">
                  <Checkbox
                    id={`lang-${language}`}
                    checked={isChecked}
                    onCheckedChange={(checked) => handleChange(language, checked === true)}
                    data-testid={`checkbox-lang-${language.toLowerCase()}`}
                  />
                  <label
                    htmlFor={`lang-${language}`}
                    className="text-sm cursor-pointer"
                  >
                    {language}
                  </label>
                </div>
              );
            })}
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
