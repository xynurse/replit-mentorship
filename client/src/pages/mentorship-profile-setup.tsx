import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation } from "wouter";
import { Loader2, Heart, Briefcase, Users, ClipboardList, CheckCircle, Clock, ArrowRight, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";

const EXPERTISE_AREAS = ["Science", "Innovation", "Entrepreneurship", "Intrapreneurship", "Leadership"];
const EDUCATION_LEVELS = ["Bachelor", "Master", "DNP", "PhD"];
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

const COMMUNICATION_TOOLS = ["Video Call", "Phone", "Email", "Chat/Messaging", "In-Person"];
const PREFERRED_DURATION_OPTIONS = [
  { value: "3_months", label: "3 Months" },
  { value: "6_months", label: "6 Months" },
  { value: "1_year", label: "1 Year" },
  { value: "1_year_plus", label: "More than 1 Year" },
  { value: "reevaluate", label: "Let's Reevaluate" },
  { value: "ongoing", label: "Ongoing" },
];

const MONTHLY_HOURS_OPTIONS = [
  { value: "1-2", label: "1-2 hours" },
  { value: "3-4", label: "3-4 hours" },
  { value: "5-10", label: "5-10 hours" },
  { value: "10-15", label: "10-15 hours" },
];

const DOMAIN_QUESTIONS = [
  { id: "scienceResearch", label: "Science & Research", description: "Research methods, academic writing, grant applications" },
  { id: "productDevelopment", label: "Product Development", description: "From concept to market launch" },
  { id: "innovation", label: "Innovation", description: "Creative problem-solving, design thinking" },
  { id: "businessStrategy", label: "Business Strategy", description: "Business planning, market analysis" },
  { id: "entrepreneurship", label: "Entrepreneurship", description: "Starting and growing a business" },
  { id: "intrapreneurship", label: "Intrapreneurship", description: "Innovation within organizations" },
  { id: "leadership", label: "Leadership", description: "Team building, management, influence" },
  { id: "networking", label: "Networking & Connections", description: "Building professional relationships" },
  { id: "professionalDevelopment", label: "Professional Development", description: "Career growth and skills" },
  { id: "digitalTech", label: "Digital Technology", description: "Tech tools, digital transformation" },
  { id: "ethicalSocial", label: "Ethical & Social Impact", description: "DEI, healthcare equity, social responsibility" },
];

const CAREER_STAGES = [
  { value: "student", label: "Student" },
  { value: "early_career", label: "Early Career (0-5 years)" },
  { value: "mid_career", label: "Mid Career (5-15 years)" },
  { value: "senior", label: "Senior (15+ years)" },
];

const profileSetupSchema = z.object({
  positionTitle: z.string().min(1, "Position title is required"),
  organization: z.string().min(1, "Organization is required"),
  expertiseAreas: z.array(z.string()).min(1, "Select at least one area"),
  highestEducation: z.array(z.string()).min(1, "Select your education level"),
  yearsInHealthcare: z.string().optional(),
  yearsInInnovation: z.string().optional(),
  
  mentorshipRole: z.enum(["seeking_mentor", "providing_mentorship", "both"]),
  
  careerStage: z.string().optional(),
  shortTermGoals: z.string().optional(),
  longTermVision: z.string().optional(),
  currentProjectOrIdea: z.string().optional(),
  hopingToGain: z.array(z.string()).optional(),
  
  interestScienceResearch: z.number().min(0).max(2).default(0),
  interestProductDevelopment: z.number().min(0).max(2).default(0),
  interestInnovation: z.number().min(0).max(2).default(0),
  interestBusinessStrategy: z.number().min(0).max(2).default(0),
  interestEntrepreneurship: z.number().min(0).max(2).default(0),
  interestIntrapreneurship: z.number().min(0).max(2).default(0),
  interestLeadership: z.number().min(0).max(2).default(0),
  interestNetworking: z.number().min(0).max(2).default(0),
  interestProfessionalDevelopment: z.number().min(0).max(2).default(0),
  interestDigitalTech: z.number().min(0).max(2).default(0),
  interestEthicalSocial: z.number().min(0).max(2).default(0),
  
  maxMentees: z.number().min(1).max(5).default(2),
  skillsToShare: z.string().optional(),
  previouslyServedAsMentor: z.boolean().optional(),
  mentorshipExperienceDescription: z.string().optional(),
  
  comfortScienceResearch: z.number().min(0).max(2).default(0),
  comfortProductDevelopment: z.number().min(0).max(2).default(0),
  comfortInnovation: z.number().min(0).max(2).default(0),
  comfortBusinessStrategy: z.number().min(0).max(2).default(0),
  comfortEntrepreneurship: z.number().min(0).max(2).default(0),
  comfortIntrapreneurship: z.number().min(0).max(2).default(0),
  comfortLeadership: z.number().min(0).max(2).default(0),
  comfortNetworking: z.number().min(0).max(2).default(0),
  comfortProfessionalDevelopment: z.number().min(0).max(2).default(0),
  comfortDigitalTech: z.number().min(0).max(2).default(0),
  comfortEthicalSocial: z.number().min(0).max(2).default(0),
  
  timezone: z.string().default("America/New_York"),
  monthlyHoursAvailable: z.string().optional(),
  preferredDuration: z.string().optional(),
  preferredCommunicationTools: z.array(z.string()).optional(),
  availabilityNotes: z.string().optional(),
});

type ProfileSetupFormValues = z.infer<typeof profileSetupSchema>;

function getSteps(mentorshipRole: string | undefined) {
  const baseSteps = [
    { id: 1, title: "Professional", icon: Briefcase, key: "professional" },
    { id: 2, title: "Role", icon: Users, key: "role" },
  ];
  
  let dynamicSteps: typeof baseSteps = [];
  
  if (mentorshipRole === "seeking_mentor" || mentorshipRole === "both") {
    dynamicSteps.push({ id: 3, title: "Mentee Profile", icon: ClipboardList, key: "mentee" });
  }
  
  if (mentorshipRole === "providing_mentorship" || mentorshipRole === "both") {
    dynamicSteps.push({ 
      id: mentorshipRole === "both" ? 4 : 3, 
      title: "Mentor Profile", 
      icon: ClipboardList, 
      key: "mentor" 
    });
  }
  
  const logisticsStep = { 
    id: dynamicSteps.length + 3, 
    title: "Logistics", 
    icon: Clock, 
    key: "logistics" 
  };
  
  return [...baseSteps, ...dynamicSteps, logisticsStep];
}

function RatingField({ 
  label, 
  description, 
  value, 
  onChange,
  prefix,
  testId,
}: { 
  label: string; 
  description: string; 
  value: number;
  onChange: (value: number) => void;
  prefix: "interest" | "comfort";
  testId: string;
}) {
  const labels = prefix === "interest" 
    ? ["Not Interested", "Somewhat", "Very Interested"]
    : ["Not Comfortable", "Somewhat", "Very Comfortable"];
  
  return (
    <div className="space-y-3 py-3 border-b last:border-b-0">
      <div className="flex justify-between items-start">
        <div className="space-y-0.5">
          <Label className="text-base font-medium">{label}</Label>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <Slider
          value={[value]}
          onValueChange={(v) => onChange(v[0])}
          max={2}
          step={1}
          className="flex-1"
          data-testid={testId}
        />
        <span className="text-sm font-medium min-w-[100px] text-right">
          {labels[value]}
        </span>
      </div>
    </div>
  );
}

export default function MentorshipProfileSetupPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();

  const form = useForm<ProfileSetupFormValues>({
    resolver: zodResolver(profileSetupSchema),
    defaultValues: {
      positionTitle: user?.jobTitle || "",
      organization: user?.organizationName || "",
      expertiseAreas: [],
      highestEducation: [],
      yearsInHealthcare: "",
      yearsInInnovation: "",
      mentorshipRole: "seeking_mentor",
      careerStage: "",
      shortTermGoals: "",
      longTermVision: "",
      hopingToGain: [],
      interestScienceResearch: 0,
      interestProductDevelopment: 0,
      interestInnovation: 0,
      interestBusinessStrategy: 0,
      interestEntrepreneurship: 0,
      interestIntrapreneurship: 0,
      interestLeadership: 0,
      interestNetworking: 0,
      interestProfessionalDevelopment: 0,
      interestDigitalTech: 0,
      interestEthicalSocial: 0,
      maxMentees: 2,
      skillsToShare: "",
      previouslyServedAsMentor: false,
      comfortScienceResearch: 0,
      comfortProductDevelopment: 0,
      comfortInnovation: 0,
      comfortBusinessStrategy: 0,
      comfortEntrepreneurship: 0,
      comfortIntrapreneurship: 0,
      comfortLeadership: 0,
      comfortNetworking: 0,
      comfortProfessionalDevelopment: 0,
      comfortDigitalTech: 0,
      comfortEthicalSocial: 0,
      timezone: user?.timezone || "America/New_York",
      monthlyHoursAvailable: "",
      preferredDuration: "",
      preferredCommunicationTools: [],
      availabilityNotes: "",
    },
  });

  const mentorshipRole = form.watch("mentorshipRole");
  const steps = getSteps(mentorshipRole);

  const saveProfileMutation = useMutation({
    mutationFn: async (data: ProfileSetupFormValues) => {
      const payload: Record<string, unknown> = {
        userUpdates: {
          jobTitle: data.positionTitle,
          organizationName: data.organization,
          timezone: data.timezone,
        },
        professionalProfile: {
          positionTitle: data.positionTitle,
          organization: data.organization,
          expertiseAreas: data.expertiseAreas,
          highestEducation: data.highestEducation,
          yearsInHealthcare: data.yearsInHealthcare,
          yearsInInnovation: data.yearsInInnovation,
        },
        mentorshipRole: data.mentorshipRole,
      };

      if (data.mentorshipRole === "seeking_mentor" || data.mentorshipRole === "both") {
        payload.menteeProfile = {
          careerStage: data.careerStage,
          shortTermGoals: data.shortTermGoals,
          longTermVision: data.longTermVision,
          currentProjectOrIdea: data.currentProjectOrIdea,
          hopingToGain: data.hopingToGain,
          interestScienceResearch: data.interestScienceResearch,
          interestProductDevelopment: data.interestProductDevelopment,
          interestInnovation: data.interestInnovation,
          interestBusinessStrategy: data.interestBusinessStrategy,
          interestEntrepreneurship: data.interestEntrepreneurship,
          interestIntrapreneurship: data.interestIntrapreneurship,
          interestLeadership: data.interestLeadership,
          interestNetworking: data.interestNetworking,
          interestProfessionalDevelopment: data.interestProfessionalDevelopment,
          interestDigitalTech: data.interestDigitalTech,
          interestEthicalSocial: data.interestEthicalSocial,
          monthlyHoursAvailable: data.monthlyHoursAvailable,
          timezone: data.timezone,
          preferredDuration: data.preferredDuration,
          preferredCommunicationTools: data.preferredCommunicationTools,
          availabilityNotes: data.availabilityNotes,
        };
      }

      if (data.mentorshipRole === "providing_mentorship" || data.mentorshipRole === "both") {
        payload.mentorProfileExtended = {
          maxMentees: data.maxMentees,
          skillsToShare: data.skillsToShare,
          previouslyServedAsMentor: data.previouslyServedAsMentor,
          mentorshipExperienceDescription: data.mentorshipExperienceDescription,
          comfortScienceResearch: data.comfortScienceResearch,
          comfortProductDevelopment: data.comfortProductDevelopment,
          comfortInnovation: data.comfortInnovation,
          comfortBusinessStrategy: data.comfortBusinessStrategy,
          comfortEntrepreneurship: data.comfortEntrepreneurship,
          comfortIntrapreneurship: data.comfortIntrapreneurship,
          comfortLeadership: data.comfortLeadership,
          comfortNetworking: data.comfortNetworking,
          comfortProfessionalDevelopment: data.comfortProfessionalDevelopment,
          comfortDigitalTech: data.comfortDigitalTech,
          comfortEthicalSocial: data.comfortEthicalSocial,
          monthlyHoursAvailable: data.monthlyHoursAvailable,
          timezone: data.timezone,
          preferredDuration: data.preferredDuration,
          preferredCommunicationTools: data.preferredCommunicationTools,
          availabilityNotes: data.availabilityNotes,
        };
      }

      return apiRequest("POST", "/api/profile/setup", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/profile/complete"] });
      toast({ title: "Profile setup completed successfully!" });
      setLocation("/");
    },
    onError: () => {
      toast({ title: "Failed to save profile", variant: "destructive" });
    },
  });

  const getCurrentStepKey = () => steps.find(s => s.id === currentStep)?.key || "professional";

  const nextStep = async () => {
    const stepKey = getCurrentStepKey();
    let fieldsToValidate: (keyof ProfileSetupFormValues)[] = [];
    
    if (stepKey === "professional") {
      fieldsToValidate = ["positionTitle", "organization", "expertiseAreas", "highestEducation"];
    } else if (stepKey === "role") {
      fieldsToValidate = ["mentorshipRole"];
    }

    const result = await form.trigger(fieldsToValidate);
    if (result) {
      setCurrentStep((prev) => Math.min(prev + 1, steps.length));
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  function onSubmit(values: ProfileSetupFormValues) {
    saveProfileMutation.mutate(values);
  }

  const renderStep = () => {
    const stepKey = getCurrentStepKey();

    switch (stepKey) {
      case "professional":
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-lg font-medium">Professional Background</h2>
              <p className="text-sm text-muted-foreground">
                Tell us about your professional experience and expertise.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="positionTitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Position Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Nurse Practitioner" data-testid="input-position" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="organization"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Organization</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Memorial Healthcare" data-testid="input-organization" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="expertiseAreas"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Expertise Areas</FormLabel>
                  <FormDescription>Select all areas that apply to your experience.</FormDescription>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {EXPERTISE_AREAS.map((area) => (
                      <div key={area} className="flex items-center gap-2">
                        <Checkbox
                          id={`expertise-${area}`}
                          checked={field.value?.includes(area)}
                          onCheckedChange={(checked) => {
                            const current = field.value || [];
                            if (checked) {
                              field.onChange([...current, area]);
                            } else {
                              field.onChange(current.filter((a) => a !== area));
                            }
                          }}
                          data-testid={`checkbox-expertise-${area.toLowerCase()}`}
                        />
                        <label htmlFor={`expertise-${area}`} className="text-sm cursor-pointer">
                          {area}
                        </label>
                      </div>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="highestEducation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Highest Education Level(s)</FormLabel>
                  <FormDescription>Select all degrees you hold.</FormDescription>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                    {EDUCATION_LEVELS.map((level) => (
                      <div key={level} className="flex items-center gap-2">
                        <Checkbox
                          id={`education-${level}`}
                          checked={field.value?.includes(level)}
                          onCheckedChange={(checked) => {
                            const current = field.value || [];
                            if (checked) {
                              field.onChange([...current, level]);
                            } else {
                              field.onChange(current.filter((l) => l !== level));
                            }
                          }}
                          data-testid={`checkbox-education-${level.toLowerCase()}`}
                        />
                        <label htmlFor={`education-${level}`} className="text-sm cursor-pointer">
                          {level}
                        </label>
                      </div>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="yearsInHealthcare"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Years in Healthcare</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 10" data-testid="input-years-healthcare" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="yearsInInnovation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Years in Innovation/Entrepreneurship</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 5" data-testid="input-years-innovation" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        );

      case "role":
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-lg font-medium">Mentorship Role</h2>
              <p className="text-sm text-muted-foreground">
                How would you like to participate in the mentorship program?
              </p>
            </div>

            <FormField
              control={form.control}
              name="mentorshipRole"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="grid gap-4"
                    >
                      <Card className={cn("cursor-pointer hover-elevate", field.value === "seeking_mentor" && "border-primary")}>
                        <label htmlFor="seeking_mentor" className="cursor-pointer">
                          <CardHeader className="pb-2">
                            <div className="flex items-center gap-3">
                              <RadioGroupItem value="seeking_mentor" id="seeking_mentor" data-testid="radio-seeking-mentor" />
                              <CardTitle className="text-base">I'm seeking a mentor</CardTitle>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <CardDescription>
                              I want to be matched with an experienced mentor who can guide my professional growth.
                            </CardDescription>
                          </CardContent>
                        </label>
                      </Card>

                      <Card className={cn("cursor-pointer hover-elevate", field.value === "providing_mentorship" && "border-primary")}>
                        <label htmlFor="providing_mentorship" className="cursor-pointer">
                          <CardHeader className="pb-2">
                            <div className="flex items-center gap-3">
                              <RadioGroupItem value="providing_mentorship" id="providing_mentorship" data-testid="radio-providing-mentorship" />
                              <CardTitle className="text-base">I want to be a mentor</CardTitle>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <CardDescription>
                              I have experience to share and want to help guide others in their journey.
                            </CardDescription>
                          </CardContent>
                        </label>
                      </Card>

                      <Card className={cn("cursor-pointer hover-elevate", field.value === "both" && "border-primary")}>
                        <label htmlFor="both" className="cursor-pointer">
                          <CardHeader className="pb-2">
                            <div className="flex items-center gap-3">
                              <RadioGroupItem value="both" id="both" data-testid="radio-both" />
                              <CardTitle className="text-base">Both - I want to mentor and be mentored</CardTitle>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <CardDescription>
                              I want to learn from a mentor while also sharing my expertise with others.
                            </CardDescription>
                          </CardContent>
                        </label>
                      </Card>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        );

      case "mentee":
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-lg font-medium">Mentee Profile</h2>
              <p className="text-sm text-muted-foreground">
                Tell us about your goals and what you're looking for in a mentor.
              </p>
            </div>

            <FormField
              control={form.control}
              name="careerStage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Career Stage</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-career-stage">
                        <SelectValue placeholder="Select your career stage" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {CAREER_STAGES.map((stage) => (
                        <SelectItem key={stage.value} value={stage.value}>
                          {stage.label}
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
              name="shortTermGoals"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Short-term Goals (6-12 months)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="What do you hope to achieve in the next year?"
                      className="resize-none"
                      data-testid="textarea-short-term-goals"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="longTermVision"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Long-term Vision</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Where do you see yourself in 3-5 years?"
                      className="resize-none"
                      data-testid="textarea-long-term-vision"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-3">
              <Label className="text-base font-medium">Interest Levels</Label>
              <p className="text-sm text-muted-foreground">
                Rate your level of interest in receiving mentorship for each area (0 = Not Interested, 1 = Somewhat, 2 = Very Interested)
              </p>
              <div className="border rounded-md p-4 space-y-2">
                {DOMAIN_QUESTIONS.map((domain) => {
                  const fieldName = `interest${domain.id.charAt(0).toUpperCase() + domain.id.slice(1)}` as keyof ProfileSetupFormValues;
                  return (
                    <RatingField
                      key={domain.id}
                      label={domain.label}
                      description={domain.description}
                      value={form.watch(fieldName) as number || 0}
                      onChange={(v) => form.setValue(fieldName, v)}
                      prefix="interest"
                      testId={`slider-interest-${domain.id}`}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        );

      case "mentor":
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-lg font-medium">Mentor Profile</h2>
              <p className="text-sm text-muted-foreground">
                Share your experience and expertise as a mentor.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="maxMentees"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Maximum Number of Mentees</FormLabel>
                    <Select onValueChange={(v) => field.onChange(parseInt(v))} value={String(field.value)}>
                      <FormControl>
                        <SelectTrigger data-testid="select-max-mentees">
                          <SelectValue placeholder="Select capacity" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {[1, 2, 3, 4, 5].map((num) => (
                          <SelectItem key={num} value={String(num)}>
                            {num} {num === 1 ? "mentee" : "mentees"}
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
                name="previouslyServedAsMentor"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-3 space-y-0 pt-6">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="checkbox-previous-mentor"
                      />
                    </FormControl>
                    <FormLabel className="cursor-pointer">I have previously served as a mentor</FormLabel>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="skillsToShare"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Key Skills You Can Share</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="What skills and knowledge can you offer to mentees?"
                      className="resize-none"
                      data-testid="textarea-skills-share"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="mentorshipExperienceDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mentorship Experience (if any)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe any previous mentoring experience..."
                      className="resize-none"
                      data-testid="textarea-mentor-experience"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-3">
              <Label className="text-base font-medium">Comfort Levels</Label>
              <p className="text-sm text-muted-foreground">
                Rate your comfort level mentoring in each area (0 = Not Comfortable, 1 = Somewhat, 2 = Very Comfortable)
              </p>
              <div className="border rounded-md p-4 space-y-2">
                {DOMAIN_QUESTIONS.map((domain) => {
                  const fieldName = `comfort${domain.id.charAt(0).toUpperCase() + domain.id.slice(1)}` as keyof ProfileSetupFormValues;
                  return (
                    <RatingField
                      key={domain.id}
                      label={domain.label}
                      description={domain.description}
                      value={form.watch(fieldName) as number || 0}
                      onChange={(v) => form.setValue(fieldName, v)}
                      prefix="comfort"
                      testId={`slider-comfort-${domain.id}`}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        );

      case "logistics":
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-lg font-medium">Logistics & Availability</h2>
              <p className="text-sm text-muted-foreground">
                Help us understand your availability for mentorship sessions.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="timezone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Timezone</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
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
                name="monthlyHoursAvailable"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Monthly Hours Available</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-monthly-hours">
                          <SelectValue placeholder="Select availability" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {MONTHLY_HOURS_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="preferredDuration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Preferred Mentorship Duration</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-duration">
                        <SelectValue placeholder="Select preferred duration" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {PREFERRED_DURATION_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
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
              name="preferredCommunicationTools"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Preferred Communication Methods</FormLabel>
                  <FormDescription>Select all that apply.</FormDescription>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                    {COMMUNICATION_TOOLS.map((tool) => (
                      <div key={tool} className="flex items-center gap-2">
                        <Checkbox
                          id={`comm-${tool}`}
                          checked={field.value?.includes(tool)}
                          onCheckedChange={(checked) => {
                            const current = field.value || [];
                            if (checked) {
                              field.onChange([...current, tool]);
                            } else {
                              field.onChange(current.filter((t) => t !== tool));
                            }
                          }}
                          data-testid={`checkbox-comm-${tool.toLowerCase().replace(/\s/g, "-")}`}
                        />
                        <label htmlFor={`comm-${tool}`} className="text-sm cursor-pointer">
                          {tool}
                        </label>
                      </div>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="availabilityNotes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Availability Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any specific scheduling preferences or constraints?"
                      className="resize-none"
                      data-testid="textarea-availability-notes"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        );

      default:
        return null;
    }
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
          <h1 className="text-2xl font-semibold">Mentorship Profile Setup</h1>
          <p className="text-muted-foreground mt-1">
            Welcome, {user?.firstName}! Complete your mentorship profile to get matched.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 mb-8">
          {steps.map((step, index) => {
            const StepIcon = step.icon;
            const isComplete = currentStep > step.id;
            const isCurrent = currentStep === step.id;

            return (
              <div
                key={`${step.key}-${index}`}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-md",
                  isComplete && "bg-primary/10 text-primary",
                  isCurrent && "bg-primary text-primary-foreground",
                  !isComplete && !isCurrent && "bg-muted text-muted-foreground"
                )}
              >
                {isComplete ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <StepIcon className="h-4 w-4" />
                )}
                <span className="text-sm font-medium">{step.title}</span>
              </div>
            );
          })}
        </div>

        <Card className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {renderStep()}

              <div className="flex justify-between pt-4 border-t">
                {currentStep > 1 ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={prevStep}
                    data-testid="button-back"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                ) : (
                  <div />
                )}

                {currentStep < steps.length ? (
                  <Button
                    type="button"
                    onClick={nextStep}
                    data-testid="button-next"
                  >
                    Continue
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={saveProfileMutation.isPending}
                    data-testid="button-complete"
                  >
                    {saveProfileMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Complete Setup"
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
