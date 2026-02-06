import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRoute } from "wouter";
import { Loader2, Save, ArrowLeft, User, Briefcase, GraduationCap, Users } from "lucide-react";
import { useState, useEffect } from "react";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
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
import { Link } from "wouter";
import { AdminLayout } from "@/components/layouts/admin-layout";

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

const USER_ROLES = [
  { value: "MENTEE", label: "Mentee" },
  { value: "MENTOR", label: "Mentor" },
  { value: "ADMIN", label: "Admin" },
  { value: "SUPER_ADMIN", label: "Super Admin" },
];

const profileSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email required"),
  role: z.string(),
  jobTitle: z.string().optional(),
  organizationName: z.string().optional(),
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

export default function AdminUserProfilePage() {
  const { toast } = useToast();
  const [, params] = useRoute("/admin/users/:userId/profile");
  const userId = params?.userId;
  const [activeTab, setActiveTab] = useState("core");

  const { data: profileData, isLoading } = useQuery<{
    user: any;
    menteeProfile: any;
    mentorProfileExtended: any;
    mentorshipRole: string | null;
  }>({
    queryKey: ["/api/admin/users", userId, "profile"],
    queryFn: async () => {
      const res = await fetch(`/api/admin/users/${userId}/profile`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch profile");
      return res.json();
    },
    enabled: !!userId,
  });

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      role: "MENTEE",
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
        firstName: userData?.firstName || "",
        lastName: userData?.lastName || "",
        email: userData?.email || "",
        role: userData?.role || "MENTEE",
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
        firstName: values.firstName,
        lastName: values.lastName,
        role: values.role,
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

      return apiRequest("PUT", `/api/admin/users/${userId}/profile`, {
        userUpdates,
        mentorshipRole: values.mentorshipRoleChoice,
        menteeProfile: values.mentorshipRoleChoice === "seeking_mentor" || values.mentorshipRoleChoice === "both" ? menteeProfile : undefined,
        mentorProfileExtended: values.mentorshipRoleChoice === "providing_mentorship" || values.mentorshipRoleChoice === "both" ? mentorProfileExtended : undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users", userId, "profile"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "Profile updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update profile", variant: "destructive" });
    },
  });

  const onSubmit = (values: ProfileFormValues) => {
    saveProfileMutation.mutate(values);
  };

  const mentorshipRole = form.watch("mentorshipRoleChoice");
  const previouslyServedAsMentor = form.watch("previouslyServedAsMentor");

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AdminLayout>
    );
  }

  const userName = profileData?.user ? `${profileData.user.firstName} ${profileData.user.lastName}` : "User";

  return (
    <AdminLayout>
      <div className="container max-w-4xl py-6">
        <div className="mb-6">
          <Link href="/admin/users">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Users
            </Button>
          </Link>
          <h1 className="text-2xl font-semibold">Edit Profile: {userName}</h1>
          <p className="text-muted-foreground">Manage this user's profile information and mentorship preferences</p>
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
                    <CardDescription>User's basic contact and identification details</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name *</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-first-name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Last Name *</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-last-name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email *</FormLabel>
                          <FormControl>
                            <Input {...field} disabled data-testid="input-email" />
                          </FormControl>
                          <FormDescription>Email cannot be changed</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="role"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>System Role</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-role">
                                <SelectValue placeholder="Select role" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {USER_ROLES.map((role) => (
                                <SelectItem key={role.value} value={role.value}>
                                  {role.label}
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
                        name="jobTitle"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Current Position/Title</FormLabel>
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
                            <FormLabel>Institution/Organization</FormLabel>
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
                    <CardDescription>User's expertise, education, and experience</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="fieldsOfExpertise"
                      render={() => (
                        <FormItem>
                          <FormLabel>Primary Field(s) of Expertise</FormLabel>
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
                          <FormLabel>Highest Level of Education</FormLabel>
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
                            <FormLabel>Years of Experience</FormLabel>
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
                            <FormLabel>Years in SIEL Areas</FormLabel>
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
                          <FormControl>
                            <Textarea {...field} rows={3} data-testid="input-certifications" />
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
                    <CardDescription>What is this user looking for in the mentorship program?</CardDescription>
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
                                  <div className="text-sm text-muted-foreground">User wants to be mentored</div>
                                </Label>
                              </div>
                              <div className="flex items-center space-x-3 p-4 border rounded-lg hover-elevate cursor-pointer">
                                <RadioGroupItem value="providing_mentorship" id="providing_mentorship" data-testid="radio-providing-mentorship" />
                                <Label htmlFor="providing_mentorship" className="flex-1 cursor-pointer">
                                  <div className="font-medium">Providing Mentorship</div>
                                  <div className="text-sm text-muted-foreground">User wants to mentor others</div>
                                </Label>
                              </div>
                              <div className="flex items-center space-x-3 p-4 border rounded-lg hover-elevate cursor-pointer">
                                <RadioGroupItem value="both" id="both" data-testid="radio-both" />
                                <Label htmlFor="both" className="flex-1 cursor-pointer">
                                  <div className="font-medium">Both</div>
                                  <div className="text-sm text-muted-foreground">User wants to both mentor and be mentored</div>
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
                            <FormLabel>Previously been mentored</FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="hopingToGain"
                      render={() => (
                        <FormItem>
                          <FormLabel>What they're hoping to gain</FormLabel>
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
                          <FormLabel>Specific skills or knowledge seeking</FormLabel>
                          <FormControl>
                            <Textarea {...field} rows={3} />
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
                          <FormLabel>Primary motivations</FormLabel>
                          <FormControl>
                            <Textarea {...field} rows={3} />
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
                          <FormLabel>Preferred mentorship duration</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || ""}>
                            <FormControl>
                              <SelectTrigger>
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

                    <FormField
                      control={form.control}
                      name="menteePastChallenges"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Past challenges or successes</FormLabel>
                          <FormControl>
                            <Textarea {...field} rows={3} />
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
                          <FormLabel>Effective structures found</FormLabel>
                          <FormControl>
                            <Textarea {...field} rows={3} />
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
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Previously served as a mentor</FormLabel>
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
                            <FormLabel>Mentorship experience description</FormLabel>
                            <FormControl>
                              <Textarea {...field} rows={3} />
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
                          <FormLabel>Skills to share</FormLabel>
                          <FormControl>
                            <Textarea {...field} rows={3} />
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
                          <FormLabel>Primary motivations for mentoring</FormLabel>
                          <FormControl>
                            <Textarea {...field} rows={3} />
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
                          <FormLabel>Monthly hours available</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || ""}>
                            <FormControl>
                              <SelectTrigger>
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
                          <FormLabel>Best days/times</FormLabel>
                          <FormControl>
                            <Textarea {...field} rows={2} />
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
                          <FormLabel>Preferred mentoring duration</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || ""}>
                            <FormControl>
                              <SelectTrigger>
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
                    <CardTitle>Past Experience & Program Feedback</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="mentorPastChallenges"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Past challenges</FormLabel>
                          <FormControl>
                            <Textarea {...field} rows={3} />
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
                          <FormLabel>Past successes</FormLabel>
                          <FormControl>
                            <Textarea {...field} rows={3} />
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
                          <FormLabel>Effective structures found</FormLabel>
                          <FormControl>
                            <Textarea {...field} rows={3} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="resourcesNeeded"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Resources needed</FormLabel>
                          <FormControl>
                            <Textarea {...field} rows={3} />
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
                          <FormLabel>Program expectations</FormLabel>
                          <FormControl>
                            <Textarea {...field} rows={3} />
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
                          <FormLabel>Program suggestions</FormLabel>
                          <FormControl>
                            <Textarea {...field} rows={3} />
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
    </AdminLayout>
  );
}
