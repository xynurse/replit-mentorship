import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Save, User, Briefcase, GraduationCap, Users, Heart } from "lucide-react";
import { useState, useEffect } from "react";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";

const EXPERTISE_AREAS = ["Science", "Innovation", "Entrepreneurship", "Intrapreneurship", "Leadership"];
const EDUCATION_LEVELS = ["Bachelor", "Master", "DNP", "PhD"];
const PREFERRED_LANGUAGES = [
  { value: "en", label: "English" },
  { value: "es", label: "Spanish" },
  { value: "pt", label: "Portuguese" },
];

const HOPING_TO_GAIN_OPTIONS = [
  "Career advice",
  "Networking opportunities",
  "Skill development",
  "Leadership skills",
  "Feedback and guidance",
  "Industry insights",
  "Work-life balance strategies",
  "Research collaboration",
];

const MENTORSHIP_METHODS = [
  "One-on-one meetings",
  "Group mentoring",
  "Virtual meetings",
  "In-person meetings",
];

const PREFERRED_DURATION_OPTIONS = [
  { value: "3_months", label: "3 Months" },
  { value: "6_months", label: "6 Months" },
  { value: "1_year", label: "1 Year" },
  { value: "1_year_plus", label: "More than 1 Year" },
  { value: "reevaluate", label: "Re-evaluate" },
  { value: "ongoing", label: "Ongoing" },
];

const MONTHLY_HOURS_OPTIONS = [
  { value: "1-2", label: "1-2 hours" },
  { value: "3-4", label: "3-4 hours" },
  { value: "5-10", label: "5-10 hours" },
  { value: "10-15", label: "10-15 hours" },
];

const profileSchema = z.object({
  jobTitle: z.string().min(1, "Position/title is required"),
  organizationName: z.string().min(1, "Organization is required"),
  preferredLanguage: z.string().default("en"),
  fieldsOfExpertise: z.array(z.string()).default([]),
  educationLevel: z.string().optional(),
  yearsOfExperience: z.number().min(0).optional(),
  yearsInSielAreas: z.number().min(0).optional(),
  certificationsTraining: z.string().optional(),
  mentorshipRoleChoice: z.enum(["seeking_mentor", "providing_mentorship", "both"]).optional(),
  
  previouslyBeenMentored: z.boolean().optional(),
  hopingToGain: z.array(z.string()).default([]),
  specificSkillsSeeking: z.string().optional(),
  menteePrimaryMotivations: z.string().optional(),
  menteePreferredMethods: z.array(z.string()).default([]),
  menteePreferredDuration: z.string().optional(),
  menteePastChallenges: z.string().optional(),
  menteeEffectiveStructures: z.string().optional(),
  
  previouslyServedAsMentor: z.boolean().optional(),
  mentorshipExperienceDescription: z.string().optional(),
  skillsToShare: z.string().optional(),
  mentorPrimaryMotivations: z.string().optional(),
  mentorPreferredMethods: z.array(z.string()).default([]),
  monthlyHoursAvailable: z.string().optional(),
  bestDaysTimes: z.string().optional(),
  mentorPreferredDuration: z.string().optional(),
  mentorPastChallenges: z.string().optional(),
  mentorPastSuccesses: z.string().optional(),
  mentorEffectiveStructures: z.string().optional(),
  resourcesNeeded: z.string().optional(),
  programExpectations: z.string().optional(),
  programSuggestions: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function MyProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("core");

  const { data: profileData, isLoading } = useQuery<{
    user: any;
    menteeProfile: any;
    mentorProfileExtended: any;
    mentorshipRole: string | null;
  }>({
    queryKey: ["/api/profile/complete"],
  });

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      jobTitle: "",
      organizationName: "",
      preferredLanguage: "en",
      fieldsOfExpertise: [],
      educationLevel: "",
      yearsOfExperience: 0,
      yearsInSielAreas: 0,
      certificationsTraining: "",
      mentorshipRoleChoice: undefined,
      previouslyBeenMentored: false,
      hopingToGain: [],
      specificSkillsSeeking: "",
      menteePrimaryMotivations: "",
      menteePreferredMethods: [],
      menteePreferredDuration: "",
      menteePastChallenges: "",
      menteeEffectiveStructures: "",
      previouslyServedAsMentor: false,
      mentorshipExperienceDescription: "",
      skillsToShare: "",
      mentorPrimaryMotivations: "",
      mentorPreferredMethods: [],
      monthlyHoursAvailable: "",
      bestDaysTimes: "",
      mentorPreferredDuration: "",
      mentorPastChallenges: "",
      mentorPastSuccesses: "",
      mentorEffectiveStructures: "",
      resourcesNeeded: "",
      programExpectations: "",
      programSuggestions: "",
    },
  });

  useEffect(() => {
    if (profileData) {
      const { user: userData, menteeProfile, mentorProfileExtended, mentorshipRole } = profileData;
      
      form.reset({
        jobTitle: userData?.jobTitle || "",
        organizationName: userData?.organizationName || "",
        preferredLanguage: userData?.preferredLanguage || "en",
        fieldsOfExpertise: userData?.fieldsOfExpertise || [],
        educationLevel: userData?.educationLevel || "",
        yearsOfExperience: userData?.yearsOfExperience || 0,
        yearsInSielAreas: userData?.yearsInSielAreas || 0,
        certificationsTraining: userData?.certificationsTraining || "",
        mentorshipRoleChoice: mentorshipRole || userData?.mentorshipRoleChoice || undefined,
        
        previouslyBeenMentored: menteeProfile?.previouslyBeenMentored || false,
        hopingToGain: menteeProfile?.hopingToGain || [],
        specificSkillsSeeking: menteeProfile?.specificSkillsSeeking || "",
        menteePrimaryMotivations: menteeProfile?.primaryMotivations || "",
        menteePreferredMethods: menteeProfile?.preferredMethods || [],
        menteePreferredDuration: menteeProfile?.preferredDuration || "",
        menteePastChallenges: menteeProfile?.pastChallenges || "",
        menteeEffectiveStructures: menteeProfile?.effectiveStructures || "",
        
        previouslyServedAsMentor: mentorProfileExtended?.previouslyServedAsMentor || false,
        mentorshipExperienceDescription: mentorProfileExtended?.mentorshipExperienceDescription || "",
        skillsToShare: mentorProfileExtended?.skillsToShare || "",
        mentorPrimaryMotivations: mentorProfileExtended?.primaryMotivations || "",
        mentorPreferredMethods: mentorProfileExtended?.preferredMethods || [],
        monthlyHoursAvailable: mentorProfileExtended?.monthlyHoursAvailable || "",
        bestDaysTimes: mentorProfileExtended?.bestDaysTimes || "",
        mentorPreferredDuration: mentorProfileExtended?.preferredDuration || "",
        mentorPastChallenges: mentorProfileExtended?.pastChallenges || "",
        mentorPastSuccesses: mentorProfileExtended?.pastSuccesses || "",
        mentorEffectiveStructures: mentorProfileExtended?.effectiveStructures || "",
        resourcesNeeded: mentorProfileExtended?.resourcesNeeded || "",
        programExpectations: mentorProfileExtended?.programExpectations || "",
        programSuggestions: mentorProfileExtended?.programSuggestions || "",
      });
    }
  }, [profileData, form]);

  const saveProfileMutation = useMutation({
    mutationFn: async (values: ProfileFormValues) => {
      const userUpdates = {
        jobTitle: values.jobTitle,
        organizationName: values.organizationName,
        preferredLanguage: values.preferredLanguage,
        fieldsOfExpertise: values.fieldsOfExpertise,
        educationLevel: values.educationLevel,
        yearsOfExperience: values.yearsOfExperience,
        yearsInSielAreas: values.yearsInSielAreas,
        certificationsTraining: values.certificationsTraining,
      };

      const menteeProfile = {
        previouslyBeenMentored: values.previouslyBeenMentored,
        hopingToGain: values.hopingToGain,
        specificSkillsSeeking: values.specificSkillsSeeking,
        primaryMotivations: values.menteePrimaryMotivations,
        preferredMethods: values.menteePreferredMethods,
        preferredDuration: values.menteePreferredDuration,
        pastChallenges: values.menteePastChallenges,
        effectiveStructures: values.menteeEffectiveStructures,
      };

      const mentorProfileExtended = {
        previouslyServedAsMentor: values.previouslyServedAsMentor,
        mentorshipExperienceDescription: values.mentorshipExperienceDescription,
        skillsToShare: values.skillsToShare,
        primaryMotivations: values.mentorPrimaryMotivations,
        preferredMethods: values.mentorPreferredMethods,
        monthlyHoursAvailable: values.monthlyHoursAvailable,
        bestDaysTimes: values.bestDaysTimes,
        preferredDuration: values.mentorPreferredDuration,
        pastChallenges: values.mentorPastChallenges,
        pastSuccesses: values.mentorPastSuccesses,
        effectiveStructures: values.mentorEffectiveStructures,
        resourcesNeeded: values.resourcesNeeded,
        programExpectations: values.programExpectations,
        programSuggestions: values.programSuggestions,
      };

      return apiRequest("POST", "/api/profile/setup", {
        userUpdates,
        mentorshipRole: values.mentorshipRoleChoice,
        menteeProfile: values.mentorshipRoleChoice === "seeking_mentor" || values.mentorshipRoleChoice === "both" ? menteeProfile : undefined,
        mentorProfileExtended: values.mentorshipRoleChoice === "providing_mentorship" || values.mentorshipRoleChoice === "both" ? mentorProfileExtended : undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profile/complete"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({ title: "Profile saved successfully" });
    },
    onError: () => {
      toast({ title: "Failed to save profile", variant: "destructive" });
    },
  });

  const onSubmit = (values: ProfileFormValues) => {
    saveProfileMutation.mutate(values);
  };

  const mentorshipRole = form.watch("mentorshipRoleChoice");
  const previouslyServedAsMentor = form.watch("previouslyServedAsMentor");

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container max-w-4xl py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold">My Profile</h1>
          <p className="text-muted-foreground">Manage your profile information and mentorship preferences</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="core" data-testid="tab-core">
                  <User className="h-4 w-4 mr-2" />
                  Core Info
                </TabsTrigger>
                <TabsTrigger value="gateway" data-testid="tab-gateway">
                  <Users className="h-4 w-4 mr-2" />
                  Role
                </TabsTrigger>
                <TabsTrigger 
                  value="mentee" 
                  disabled={mentorshipRole !== "seeking_mentor" && mentorshipRole !== "both"}
                  data-testid="tab-mentee"
                >
                  <GraduationCap className="h-4 w-4 mr-2" />
                  Mentee
                </TabsTrigger>
                <TabsTrigger 
                  value="mentor" 
                  disabled={mentorshipRole !== "providing_mentorship" && mentorshipRole !== "both"}
                  data-testid="tab-mentor"
                >
                  <Briefcase className="h-4 w-4 mr-2" />
                  Mentor
                </TabsTrigger>
              </TabsList>

              <TabsContent value="core" className="space-y-6 mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Personal Information</CardTitle>
                    <CardDescription>Your basic contact and identification details</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>First Name</Label>
                        <Input value={profileData?.user?.firstName || user?.firstName || ""} disabled className="bg-muted" data-testid="input-first-name" />
                      </div>
                      <div className="space-y-2">
                        <Label>Last Name</Label>
                        <Input value={profileData?.user?.lastName || user?.lastName || ""} disabled className="bg-muted" data-testid="input-last-name" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input value={profileData?.user?.email || user?.email || ""} disabled className="bg-muted" data-testid="input-email" />
                      <p className="text-sm text-muted-foreground">Name and email are managed by your administrator</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="jobTitle"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Current Position/Title *</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-job-title" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="organizationName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Institution/Organization *</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-organization" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <Separator className="my-4" />

                    <FormField
                      control={form.control}
                      name="preferredLanguage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Preferred Language</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
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
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Professional Background</CardTitle>
                    <CardDescription>Your expertise, education, and experience</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="fieldsOfExpertise"
                      render={() => (
                        <FormItem>
                          <FormLabel>Primary Field(s) of Expertise</FormLabel>
                          <FormDescription>Select all that apply</FormDescription>
                          <div className="grid grid-cols-2 gap-2 mt-2">
                            {EXPERTISE_AREAS.map((area) => (
                              <FormField
                                key={area}
                                control={form.control}
                                name="fieldsOfExpertise"
                                render={({ field }) => (
                                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(area)}
                                        onCheckedChange={(checked) => {
                                          const current = field.value || [];
                                          if (checked) {
                                            field.onChange([...current, area]);
                                          } else {
                                            field.onChange(current.filter((v) => v !== area));
                                          }
                                        }}
                                        data-testid={`checkbox-expertise-${area.toLowerCase()}`}
                                      />
                                    </FormControl>
                                    <FormLabel className="font-normal">{area}</FormLabel>
                                  </FormItem>
                                )}
                              />
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="educationLevel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Highest Level of Education Completed</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || ""}>
                            <FormControl>
                              <SelectTrigger data-testid="select-education">
                                <SelectValue placeholder="Select education level" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {EDUCATION_LEVELS.map((level) => (
                                <SelectItem key={level} value={level}>
                                  {level}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="yearsOfExperience"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Years of Experience in Your Field</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                {...field} 
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                data-testid="input-years-experience"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="yearsInSielAreas"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Years in Science/Innovation/Entrepreneurship/Leadership</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                {...field} 
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                data-testid="input-years-siel"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="certificationsTraining"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Certifications or Additional Training</FormLabel>
                          <FormDescription>List any certifications or training relevant to mentorship</FormDescription>
                          <FormControl>
                            <Textarea 
                              {...field} 
                              rows={3}
                              placeholder="e.g., Certified Executive Coach, Healthcare Leadership Certificate..."
                              data-testid="input-certifications"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="gateway" className="space-y-6 mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Mentorship Role</CardTitle>
                    <CardDescription>What are you looking for in this mentorship program?</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <FormField
                      control={form.control}
                      name="mentorshipRoleChoice"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              value={field.value}
                              className="space-y-4"
                            >
                              <div className="flex items-center space-x-3 p-4 border rounded-lg hover-elevate cursor-pointer">
                                <RadioGroupItem value="seeking_mentor" id="seeking_mentor" data-testid="radio-seeking-mentor" />
                                <Label htmlFor="seeking_mentor" className="flex-1 cursor-pointer">
                                  <div className="font-medium">Seeking a Mentor</div>
                                  <div className="text-sm text-muted-foreground">I want to be mentored and learn from experienced professionals</div>
                                </Label>
                              </div>
                              <div className="flex items-center space-x-3 p-4 border rounded-lg hover-elevate cursor-pointer">
                                <RadioGroupItem value="providing_mentorship" id="providing_mentorship" data-testid="radio-providing-mentorship" />
                                <Label htmlFor="providing_mentorship" className="flex-1 cursor-pointer">
                                  <div className="font-medium">Providing Mentorship</div>
                                  <div className="text-sm text-muted-foreground">I want to mentor others and share my expertise</div>
                                </Label>
                              </div>
                              <div className="flex items-center space-x-3 p-4 border rounded-lg hover-elevate cursor-pointer">
                                <RadioGroupItem value="both" id="both" data-testid="radio-both" />
                                <Label htmlFor="both" className="flex-1 cursor-pointer">
                                  <div className="font-medium">Both</div>
                                  <div className="text-sm text-muted-foreground">I want to both mentor others and be mentored</div>
                                </Label>
                              </div>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="mentee" className="space-y-6 mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Mentee Experience & Goals</CardTitle>
                    <CardDescription>Tell us about your mentee background and what you hope to achieve</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="previouslyBeenMentored"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="checkbox-previously-mentored"
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Have you previously been mentored?</FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="hopingToGain"
                      render={() => (
                        <FormItem>
                          <FormLabel>What are you hoping to gain from a mentor?</FormLabel>
                          <FormDescription>Select all that apply</FormDescription>
                          <div className="grid grid-cols-2 gap-2 mt-2">
                            {HOPING_TO_GAIN_OPTIONS.map((option) => (
                              <FormField
                                key={option}
                                control={form.control}
                                name="hopingToGain"
                                render={({ field }) => (
                                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(option)}
                                        onCheckedChange={(checked) => {
                                          const current = field.value || [];
                                          if (checked) {
                                            field.onChange([...current, option]);
                                          } else {
                                            field.onChange(current.filter((v) => v !== option));
                                          }
                                        }}
                                        data-testid={`checkbox-hoping-${option.toLowerCase().replace(/\s+/g, '-')}`}
                                      />
                                    </FormControl>
                                    <FormLabel className="font-normal">{option}</FormLabel>
                                  </FormItem>
                                )}
                              />
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="specificSkillsSeeking"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Specific skills or knowledge you're interested in gaining</FormLabel>
                          <FormControl>
                            <Textarea {...field} rows={3} data-testid="input-skills-seeking" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="menteePrimaryMotivations"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>What are your primary motivations for seeking a mentor?</FormLabel>
                          <FormControl>
                            <Textarea {...field} rows={3} data-testid="input-mentee-motivations" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Preferences & Logistics</CardTitle>
                    <CardDescription>Your preferred mentorship style and time commitment</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="menteePreferredMethods"
                      render={() => (
                        <FormItem>
                          <FormLabel>Preferred method of mentorship</FormLabel>
                          <div className="grid grid-cols-2 gap-2 mt-2">
                            {MENTORSHIP_METHODS.map((method) => (
                              <FormField
                                key={method}
                                control={form.control}
                                name="menteePreferredMethods"
                                render={({ field }) => (
                                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(method)}
                                        onCheckedChange={(checked) => {
                                          const current = field.value || [];
                                          if (checked) {
                                            field.onChange([...current, method]);
                                          } else {
                                            field.onChange(current.filter((v) => v !== method));
                                          }
                                        }}
                                        data-testid={`checkbox-mentee-method-${method.toLowerCase().replace(/\s+/g, '-')}`}
                                      />
                                    </FormControl>
                                    <FormLabel className="font-normal">{method}</FormLabel>
                                  </FormItem>
                                )}
                              />
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="menteePreferredDuration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>How long would you like to be mentored?</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || ""}>
                            <FormControl>
                              <SelectTrigger data-testid="select-mentee-duration">
                                <SelectValue placeholder="Select duration" />
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
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Past Experience</CardTitle>
                    <CardDescription>Share your previous mentorship experiences</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="menteePastChallenges"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>What challenges or successes have you encountered in past mentorship experiences?</FormLabel>
                          <FormControl>
                            <Textarea {...field} rows={3} data-testid="input-mentee-past-challenges" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="menteeEffectiveStructures"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>What structure have you found most effective to support mentorship?</FormLabel>
                          <FormControl>
                            <Textarea {...field} rows={3} data-testid="input-mentee-effective-structures" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="mentor" className="space-y-6 mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Mentor Experience & Motivation</CardTitle>
                    <CardDescription>Tell us about your mentoring background and what drives you</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="previouslyServedAsMentor"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="checkbox-previously-mentor"
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Have you previously served as a mentor?</FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />

                    {previouslyServedAsMentor && (
                      <FormField
                        control={form.control}
                        name="mentorshipExperienceDescription"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Please describe your mentorship experience</FormLabel>
                            <FormControl>
                              <Textarea {...field} rows={3} data-testid="input-mentorship-experience" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    <FormField
                      control={form.control}
                      name="skillsToShare"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>What specific skills or knowledge are you interested in sharing?</FormLabel>
                          <FormControl>
                            <Textarea {...field} rows={3} data-testid="input-skills-to-share" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="mentorPrimaryMotivations"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>What are your primary motivations for becoming a mentor?</FormLabel>
                          <FormControl>
                            <Textarea {...field} rows={3} data-testid="input-mentor-motivations" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Preferences & Logistics</CardTitle>
                    <CardDescription>Your availability and mentoring style preferences</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="mentorPreferredMethods"
                      render={() => (
                        <FormItem>
                          <FormLabel>Preferred method of mentorship</FormLabel>
                          <div className="grid grid-cols-2 gap-2 mt-2">
                            {MENTORSHIP_METHODS.map((method) => (
                              <FormField
                                key={method}
                                control={form.control}
                                name="mentorPreferredMethods"
                                render={({ field }) => (
                                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(method)}
                                        onCheckedChange={(checked) => {
                                          const current = field.value || [];
                                          if (checked) {
                                            field.onChange([...current, method]);
                                          } else {
                                            field.onChange(current.filter((v) => v !== method));
                                          }
                                        }}
                                        data-testid={`checkbox-mentor-method-${method.toLowerCase().replace(/\s+/g, '-')}`}
                                      />
                                    </FormControl>
                                    <FormLabel className="font-normal">{method}</FormLabel>
                                  </FormItem>
                                )}
                              />
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="monthlyHoursAvailable"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>How many hours per month can you commit to mentoring?</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || ""}>
                            <FormControl>
                              <SelectTrigger data-testid="select-monthly-hours">
                                <SelectValue placeholder="Select hours" />
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

                    <FormField
                      control={form.control}
                      name="bestDaysTimes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Are there any days/times that work best for mentorship sessions?</FormLabel>
                          <FormControl>
                            <Textarea {...field} rows={2} placeholder="e.g., Weekday evenings, Saturday mornings..." data-testid="input-best-days-times" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="mentorPreferredDuration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>How long do you plan on being a mentor?</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || ""}>
                            <FormControl>
                              <SelectTrigger data-testid="select-mentor-duration">
                                <SelectValue placeholder="Select duration" />
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
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Past Experience</CardTitle>
                    <CardDescription>Share your previous mentorship experiences as a mentor</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="mentorPastChallenges"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>What challenges have you encountered in past mentorship experiences?</FormLabel>
                          <FormControl>
                            <Textarea {...field} rows={3} data-testid="input-mentor-past-challenges" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="mentorPastSuccesses"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>What successes have you had in past mentorship experiences?</FormLabel>
                          <FormControl>
                            <Textarea {...field} rows={3} data-testid="input-mentor-past-successes" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="mentorEffectiveStructures"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>What structure have you found most effective to support mentorship?</FormLabel>
                          <FormControl>
                            <Textarea {...field} rows={3} data-testid="input-mentor-effective-structures" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Program Needs & Feedback</CardTitle>
                    <CardDescription>Help us build a better mentorship program</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="resourcesNeeded"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>What support or resources would you need to be an effective mentor?</FormLabel>
                          <FormControl>
                            <Textarea {...field} rows={3} data-testid="input-resources-needed" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="programExpectations"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>What expectations do you have from this mentorship program?</FormLabel>
                          <FormControl>
                            <Textarea {...field} rows={3} data-testid="input-program-expectations" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="programSuggestions"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Do you have any suggestions for structuring this mentorship program?</FormLabel>
                          <FormControl>
                            <Textarea {...field} rows={3} data-testid="input-program-suggestions" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end pt-4">
              <Button 
                type="submit" 
                disabled={saveProfileMutation.isPending}
                data-testid="button-save-profile"
              >
                {saveProfileMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Profile
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </DashboardLayout>
  );
}
