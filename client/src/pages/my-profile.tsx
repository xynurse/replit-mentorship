import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Save, User, Briefcase, GraduationCap, Users, Camera } from "lucide-react";
import { useState, useRef } from "react";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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

const CAREER_STAGES = [
  { value: "student", label: "Student" },
  { value: "early_career", label: "Early Career" },
  { value: "mid_career", label: "Mid Career" },
  { value: "senior", label: "Senior" },
];

const COMMUNICATION_TOOLS = [
  "Email", "Zoom", "Google Meet", "Microsoft Teams", "Phone", "Slack", "WhatsApp"
];

const TIMEZONE_OPTIONS = [
  { value: "America/New_York", label: "Eastern Time (ET)" },
  { value: "America/Chicago", label: "Central Time (CT)" },
  { value: "America/Denver", label: "Mountain Time (MT)" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  { value: "America/Anchorage", label: "Alaska Time (AKT)" },
  { value: "Pacific/Honolulu", label: "Hawaii Time (HT)" },
  { value: "America/Puerto_Rico", label: "Atlantic Time (AT)" },
  { value: "Europe/London", label: "GMT / London" },
  { value: "Europe/Paris", label: "CET / Paris" },
  { value: "America/Sao_Paulo", label: "Brasilia Time (BRT)" },
  { value: "Asia/Tokyo", label: "Japan Time (JST)" },
  { value: "Australia/Sydney", label: "Australian Eastern (AEST)" },
];

const INTEREST_AREAS = [
  { key: "interestScienceResearch", label: "Science & Research" },
  { key: "interestProductDevelopment", label: "Product Development" },
  { key: "interestInnovation", label: "Innovation" },
  { key: "interestBusinessStrategy", label: "Business Strategy" },
  { key: "interestEntrepreneurship", label: "Entrepreneurship" },
  { key: "interestIntrapreneurship", label: "Intrapreneurship" },
  { key: "interestLeadership", label: "Leadership" },
  { key: "interestNetworking", label: "Networking" },
  { key: "interestProfessionalDevelopment", label: "Professional Development" },
  { key: "interestDigitalTech", label: "Digital Technology" },
  { key: "interestEthicalSocial", label: "Ethical & Social Responsibility" },
];

const COMFORT_AREAS = [
  { key: "comfortScienceResearch", label: "Science & Research" },
  { key: "comfortProductDevelopment", label: "Product Development" },
  { key: "comfortInnovation", label: "Innovation" },
  { key: "comfortBusinessStrategy", label: "Business Strategy" },
  { key: "comfortEntrepreneurship", label: "Entrepreneurship" },
  { key: "comfortIntrapreneurship", label: "Intrapreneurship" },
  { key: "comfortLeadership", label: "Leadership" },
  { key: "comfortNetworking", label: "Networking" },
  { key: "comfortProfessionalDevelopment", label: "Professional Development" },
  { key: "comfortDigitalTech", label: "Digital Technology" },
  { key: "comfortEthicalSocial", label: "Ethical & Social Responsibility" },
];

const INDUSTRIES = [
  "Healthcare", "Pharmaceuticals", "Biotechnology", "Medical Devices",
  "Digital Health", "Public Health", "Academic/Research", "Government",
  "Non-Profit", "Consulting", "Technology", "Finance", "Other"
];

const profileSchema = z.object({
  bio: z.string().max(500, "Bio must be less than 500 characters").optional(),
  jobTitle: z.string().optional().default(""),
  organizationName: z.string().optional().default(""),
  preferredLanguage: z.string().default("en"),
  fieldsOfExpertise: z.array(z.string()).default([]),
  educationLevel: z.string().optional(),
  yearsOfExperience: z.number().min(0).optional(),
  yearsInSielAreas: z.number().min(0).optional(),
  certificationsTraining: z.string().optional(),
  mentorshipRoleChoice: z.enum(["seeking_mentor", "providing_mentorship", "both"]).optional(),
  phone: z.string().optional(),
  linkedInUrl: z.string().optional(),
  timezone: z.string().default("America/New_York"),
  languagesSpoken: z.array(z.string()).default(["English"]),
  isSonsielMember: z.boolean().optional(),
  interestedInMembership: z.boolean().optional(),

  previouslyBeenMentored: z.boolean().optional(),
  menteeExperienceDescription: z.string().optional(),
  hopingToGain: z.array(z.string()).default([]),
  specificSkillsSeeking: z.string().optional(),
  menteePrimaryMotivations: z.string().optional(),
  menteePreferredMethods: z.array(z.string()).default([]),
  menteePreferredDuration: z.string().optional(),
  menteePastChallenges: z.string().optional(),
  menteePastSuccesses: z.string().optional(),
  menteeEffectiveStructures: z.string().optional(),
  careerStage: z.string().optional(),
  shortTermGoals: z.string().optional(),
  longTermVision: z.string().optional(),
  currentProjectOrIdea: z.string().optional(),
  preferredMentorCharacteristics: z.string().optional(),
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
  menteeMonthlyHoursAvailable: z.string().optional(),
  menteeAvailabilityNotes: z.string().optional(),
  menteePreferredCommunicationTools: z.array(z.string()).default([]),
  menteeResourcesNeeded: z.string().optional(),
  menteeProgramSuggestions: z.string().optional(),
  willingToPay: z.string().optional(),
  referralSource: z.string().optional(),

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
  maxMentees: z.number().min(0).default(2),
  preferredMenteeStages: z.array(z.string()).default([]),
  openToMentoringOutsideExpertise: z.boolean().optional(),
  mentorCertificationsTraining: z.string().optional(),
  notableAchievements: z.string().optional(),
  industriesExperience: z.array(z.string()).default([]),
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
  mentorAvailabilityNotes: z.string().optional(),
  mentorPreferredCommunicationTools: z.array(z.string()).default([]),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

function RatingRow({ label, value, onChange, namePrefix, testIdPrefix }: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  namePrefix: string;
  testIdPrefix: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <span className="text-sm font-medium min-w-[180px]">{label}</span>
      <RadioGroup
        value={String(value)}
        onValueChange={(v) => onChange(parseInt(v))}
        className="flex items-center gap-4"
      >
        <div className="flex items-center space-x-1">
          <RadioGroupItem value="0" id={`${namePrefix}-0`} data-testid={`${testIdPrefix}-0`} />
          <Label htmlFor={`${namePrefix}-0`} className="text-xs text-muted-foreground">0</Label>
        </div>
        <div className="flex items-center space-x-1">
          <RadioGroupItem value="1" id={`${namePrefix}-1`} data-testid={`${testIdPrefix}-1`} />
          <Label htmlFor={`${namePrefix}-1`} className="text-xs text-muted-foreground">1</Label>
        </div>
        <div className="flex items-center space-x-1">
          <RadioGroupItem value="2" id={`${namePrefix}-2`} data-testid={`${testIdPrefix}-2`} />
          <Label htmlFor={`${namePrefix}-2`} className="text-xs text-muted-foreground">2</Label>
        </div>
      </RadioGroup>
    </div>
  );
}

export default function MyProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("core");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!validTypes.includes(file.type)) {
      toast({ title: "Invalid file type", description: "Please upload a JPEG, PNG, GIF, or WebP image.", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Please upload an image smaller than 5MB.", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const urlResponse = await apiRequest("POST", "/api/uploads/request-url", {
        name: file.name, size: file.size, contentType: file.type,
      });
      const { uploadURL, objectPath } = await urlResponse.json();
      const uploadRes = await fetch(uploadURL, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
      if (!uploadRes.ok) throw new Error("Failed to upload image to storage");
      await apiRequest("PATCH", "/api/profile", { profileImage: objectPath });
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      queryClient.invalidateQueries({ queryKey: ["/api/profile/complete"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({ title: "Photo updated", description: "Your profile photo has been updated successfully." });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message || "Could not upload photo.", variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const { data: profileData, isLoading } = useQuery<{
    user: any;
    menteeProfile: any;
    mentorProfileExtended: any;
    mentorshipRole: string | null;
  }>({
    queryKey: ["/api/profile/complete"],
    refetchOnMount: "always",
  });

  function buildFormValues(data: typeof profileData): ProfileFormValues {
    const userData = data?.user;
    const menteeProfile = data?.menteeProfile;
    const mentorProfileExtended = data?.mentorProfileExtended;
    const mentorshipRole = data?.mentorshipRole;
    return {
      bio: userData?.bio || "",
      jobTitle: userData?.jobTitle || "",
      organizationName: userData?.organizationName || "",
      preferredLanguage: userData?.preferredLanguage || "en",
      fieldsOfExpertise: userData?.fieldsOfExpertise || [],
      educationLevel: userData?.educationLevel || "",
      yearsOfExperience: userData?.yearsOfExperience ?? undefined,
      yearsInSielAreas: userData?.yearsInSielAreas ?? undefined,
      certificationsTraining: userData?.certificationsTraining || "",
      mentorshipRoleChoice: mentorshipRole || userData?.mentorshipRoleChoice || undefined,
      phone: userData?.phone || "",
      linkedInUrl: userData?.linkedInUrl || "",
      timezone: userData?.timezone || "America/New_York",
      languagesSpoken: userData?.languagesSpoken || ["English"],
      isSonsielMember: userData?.isSonsielMember || false,
      interestedInMembership: userData?.interestedInMembership || false,

      previouslyBeenMentored: menteeProfile?.previouslyBeenMentored || false,
      menteeExperienceDescription: menteeProfile?.mentorshipExperienceDescription || "",
      hopingToGain: menteeProfile?.hopingToGain || [],
      specificSkillsSeeking: menteeProfile?.specificSkillsSeeking || "",
      menteePrimaryMotivations: menteeProfile?.primaryMotivations || "",
      menteePreferredMethods: menteeProfile?.preferredMethods || [],
      menteePreferredDuration: menteeProfile?.preferredDuration || "",
      menteePastChallenges: menteeProfile?.pastChallenges || "",
      menteePastSuccesses: menteeProfile?.pastSuccesses || "",
      menteeEffectiveStructures: menteeProfile?.effectiveStructures || "",
      careerStage: menteeProfile?.careerStage || "",
      shortTermGoals: menteeProfile?.shortTermGoals || "",
      longTermVision: menteeProfile?.longTermVision || "",
      currentProjectOrIdea: menteeProfile?.currentProjectOrIdea || "",
      preferredMentorCharacteristics: menteeProfile?.preferredMentorCharacteristics || "",
      interestScienceResearch: menteeProfile?.interestScienceResearch ?? 0,
      interestProductDevelopment: menteeProfile?.interestProductDevelopment ?? 0,
      interestInnovation: menteeProfile?.interestInnovation ?? 0,
      interestBusinessStrategy: menteeProfile?.interestBusinessStrategy ?? 0,
      interestEntrepreneurship: menteeProfile?.interestEntrepreneurship ?? 0,
      interestIntrapreneurship: menteeProfile?.interestIntrapreneurship ?? 0,
      interestLeadership: menteeProfile?.interestLeadership ?? 0,
      interestNetworking: menteeProfile?.interestNetworking ?? 0,
      interestProfessionalDevelopment: menteeProfile?.interestProfessionalDevelopment ?? 0,
      interestDigitalTech: menteeProfile?.interestDigitalTech ?? 0,
      interestEthicalSocial: menteeProfile?.interestEthicalSocial ?? 0,
      menteeMonthlyHoursAvailable: menteeProfile?.monthlyHoursAvailable || "",
      menteeAvailabilityNotes: menteeProfile?.availabilityNotes || "",
      menteePreferredCommunicationTools: menteeProfile?.preferredCommunicationTools || [],
      menteeResourcesNeeded: menteeProfile?.resourcesNeeded || "",
      menteeProgramSuggestions: menteeProfile?.programSuggestions || "",
      willingToPay: menteeProfile?.willingToPay || "",
      referralSource: menteeProfile?.referralSource || "",

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
      maxMentees: mentorProfileExtended?.maxMentees ?? 2,
      preferredMenteeStages: mentorProfileExtended?.preferredMenteeStages || [],
      openToMentoringOutsideExpertise: mentorProfileExtended?.openToMentoringOutsideExpertise || false,
      mentorCertificationsTraining: mentorProfileExtended?.certificationsTraining || "",
      notableAchievements: mentorProfileExtended?.notableAchievements || "",
      industriesExperience: mentorProfileExtended?.industriesExperience || [],
      comfortScienceResearch: mentorProfileExtended?.comfortScienceResearch ?? 0,
      comfortProductDevelopment: mentorProfileExtended?.comfortProductDevelopment ?? 0,
      comfortInnovation: mentorProfileExtended?.comfortInnovation ?? 0,
      comfortBusinessStrategy: mentorProfileExtended?.comfortBusinessStrategy ?? 0,
      comfortEntrepreneurship: mentorProfileExtended?.comfortEntrepreneurship ?? 0,
      comfortIntrapreneurship: mentorProfileExtended?.comfortIntrapreneurship ?? 0,
      comfortLeadership: mentorProfileExtended?.comfortLeadership ?? 0,
      comfortNetworking: mentorProfileExtended?.comfortNetworking ?? 0,
      comfortProfessionalDevelopment: mentorProfileExtended?.comfortProfessionalDevelopment ?? 0,
      comfortDigitalTech: mentorProfileExtended?.comfortDigitalTech ?? 0,
      comfortEthicalSocial: mentorProfileExtended?.comfortEthicalSocial ?? 0,
      mentorAvailabilityNotes: mentorProfileExtended?.availabilityNotes || "",
      mentorPreferredCommunicationTools: mentorProfileExtended?.preferredCommunicationTools || [],
    };
  }

  const formValues = profileData ? buildFormValues(profileData) : undefined;

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      bio: "",
      jobTitle: "",
      organizationName: "",
      preferredLanguage: "en",
      fieldsOfExpertise: [],
      educationLevel: "",
      yearsOfExperience: undefined,
      yearsInSielAreas: undefined,
      certificationsTraining: "",
      mentorshipRoleChoice: undefined,
      phone: "",
      linkedInUrl: "",
      timezone: "America/New_York",
      languagesSpoken: ["English"],
      isSonsielMember: false,
      interestedInMembership: false,
      previouslyBeenMentored: false,
      menteeExperienceDescription: "",
      hopingToGain: [],
      specificSkillsSeeking: "",
      menteePrimaryMotivations: "",
      menteePreferredMethods: [],
      menteePreferredDuration: "",
      menteePastChallenges: "",
      menteePastSuccesses: "",
      menteeEffectiveStructures: "",
      careerStage: "",
      shortTermGoals: "",
      longTermVision: "",
      currentProjectOrIdea: "",
      preferredMentorCharacteristics: "",
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
      menteeMonthlyHoursAvailable: "",
      menteeAvailabilityNotes: "",
      menteePreferredCommunicationTools: [],
      menteeResourcesNeeded: "",
      menteeProgramSuggestions: "",
      willingToPay: "",
      referralSource: "",
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
      maxMentees: 2,
      preferredMenteeStages: [],
      openToMentoringOutsideExpertise: false,
      mentorCertificationsTraining: "",
      notableAchievements: "",
      industriesExperience: [],
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
      mentorAvailabilityNotes: "",
      mentorPreferredCommunicationTools: [],
    },
    values: formValues,
  });

  const saveProfileMutation = useMutation({
    mutationFn: async (values: ProfileFormValues) => {
      const emptyToNull = (v: string | undefined) => (v === "" || v === undefined ? null : v);

      const userUpdates = {
        bio: emptyToNull(values.bio),
        jobTitle: emptyToNull(values.jobTitle),
        organizationName: emptyToNull(values.organizationName),
        preferredLanguage: values.preferredLanguage,
        fieldsOfExpertise: values.fieldsOfExpertise,
        educationLevel: values.educationLevel || null,
        yearsOfExperience: values.yearsOfExperience ?? null,
        yearsInSielAreas: values.yearsInSielAreas ?? null,
        certificationsTraining: values.certificationsTraining,
        phone: emptyToNull(values.phone),
        linkedInUrl: emptyToNull(values.linkedInUrl),
        timezone: values.timezone,
        languagesSpoken: values.languagesSpoken,
        isSonsielMember: values.isSonsielMember,
        interestedInMembership: values.interestedInMembership,
      };

      const menteeProfile = {
        previouslyBeenMentored: values.previouslyBeenMentored,
        mentorshipExperienceDescription: emptyToNull(values.menteeExperienceDescription),
        hopingToGain: values.hopingToGain,
        specificSkillsSeeking: emptyToNull(values.specificSkillsSeeking),
        primaryMotivations: emptyToNull(values.menteePrimaryMotivations),
        preferredMethods: values.menteePreferredMethods,
        preferredDuration: emptyToNull(values.menteePreferredDuration),
        pastChallenges: emptyToNull(values.menteePastChallenges),
        pastSuccesses: emptyToNull(values.menteePastSuccesses),
        effectiveStructures: emptyToNull(values.menteeEffectiveStructures),
        careerStage: emptyToNull(values.careerStage),
        shortTermGoals: emptyToNull(values.shortTermGoals),
        longTermVision: emptyToNull(values.longTermVision),
        currentProjectOrIdea: emptyToNull(values.currentProjectOrIdea),
        preferredMentorCharacteristics: emptyToNull(values.preferredMentorCharacteristics),
        interestScienceResearch: values.interestScienceResearch,
        interestProductDevelopment: values.interestProductDevelopment,
        interestInnovation: values.interestInnovation,
        interestBusinessStrategy: values.interestBusinessStrategy,
        interestEntrepreneurship: values.interestEntrepreneurship,
        interestIntrapreneurship: values.interestIntrapreneurship,
        interestLeadership: values.interestLeadership,
        interestNetworking: values.interestNetworking,
        interestProfessionalDevelopment: values.interestProfessionalDevelopment,
        interestDigitalTech: values.interestDigitalTech,
        interestEthicalSocial: values.interestEthicalSocial,
        monthlyHoursAvailable: emptyToNull(values.menteeMonthlyHoursAvailable),
        availabilityNotes: emptyToNull(values.menteeAvailabilityNotes),
        preferredCommunicationTools: values.menteePreferredCommunicationTools,
        resourcesNeeded: emptyToNull(values.menteeResourcesNeeded),
        programSuggestions: emptyToNull(values.menteeProgramSuggestions),
        willingToPay: emptyToNull(values.willingToPay),
        referralSource: emptyToNull(values.referralSource),
      };

      const mentorProfileExtended = {
        previouslyServedAsMentor: values.previouslyServedAsMentor,
        mentorshipExperienceDescription: emptyToNull(values.mentorshipExperienceDescription),
        skillsToShare: emptyToNull(values.skillsToShare),
        primaryMotivations: emptyToNull(values.mentorPrimaryMotivations),
        preferredMethods: values.mentorPreferredMethods,
        monthlyHoursAvailable: emptyToNull(values.monthlyHoursAvailable),
        bestDaysTimes: emptyToNull(values.bestDaysTimes),
        preferredDuration: emptyToNull(values.mentorPreferredDuration),
        pastChallenges: emptyToNull(values.mentorPastChallenges),
        pastSuccesses: emptyToNull(values.mentorPastSuccesses),
        effectiveStructures: emptyToNull(values.mentorEffectiveStructures),
        resourcesNeeded: emptyToNull(values.resourcesNeeded),
        programExpectations: emptyToNull(values.programExpectations),
        programSuggestions: emptyToNull(values.programSuggestions),
        maxMentees: values.maxMentees,
        preferredMenteeStages: values.preferredMenteeStages,
        openToMentoringOutsideExpertise: values.openToMentoringOutsideExpertise,
        certificationsTraining: emptyToNull(values.mentorCertificationsTraining),
        notableAchievements: emptyToNull(values.notableAchievements),
        industriesExperience: values.industriesExperience,
        comfortScienceResearch: values.comfortScienceResearch,
        comfortProductDevelopment: values.comfortProductDevelopment,
        comfortInnovation: values.comfortInnovation,
        comfortBusinessStrategy: values.comfortBusinessStrategy,
        comfortEntrepreneurship: values.comfortEntrepreneurship,
        comfortIntrapreneurship: values.comfortIntrapreneurship,
        comfortLeadership: values.comfortLeadership,
        comfortNetworking: values.comfortNetworking,
        comfortProfessionalDevelopment: values.comfortProfessionalDevelopment,
        comfortDigitalTech: values.comfortDigitalTech,
        comfortEthicalSocial: values.comfortEthicalSocial,
        availabilityNotes: emptyToNull(values.mentorAvailabilityNotes),
        preferredCommunicationTools: values.mentorPreferredCommunicationTools,
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
  const previouslyBeenMentored = form.watch("previouslyBeenMentored");

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  const profileContent = (
      <div className="container max-w-4xl p-6">
        <div className="mb-6 flex items-center gap-4">
          <div className="relative group">
            <Avatar className="h-16 w-16 border-2 border-border">
              <AvatarImage src={user?.id ? `/api/profile-photo/${user.id}` : undefined} alt={`${user?.firstName} ${user?.lastName}`} />
              <AvatarFallback className="text-lg font-semibold bg-muted text-muted-foreground">
                {`${user?.firstName?.charAt(0) || ""}${user?.lastName?.charAt(0) || ""}`.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              data-testid="button-edit-photo"
            >
              {uploading ? (
                <Loader2 className="h-5 w-5 text-white animate-spin" />
              ) : (
                <Camera className="h-5 w-5 text-white" />
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              className="hidden"
              onChange={handlePhotoUpload}
              data-testid="input-edit-photo-upload"
            />
          </div>
          <div>
            <h1 className="text-2xl font-semibold">My Profile</h1>
            <p className="text-muted-foreground">
              Manage your profile information and mentorship preferences
            </p>
          </div>
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

                    <FormField
                      control={form.control}
                      name="bio"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Biography</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder="Tell us about yourself, your background, and your interests..."
                              className="resize-none"
                              rows={4}
                              data-testid="input-bio"
                            />
                          </FormControl>
                          <FormDescription>A brief introduction about yourself (max 500 characters)</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

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
                    <CardTitle>Contact & Social</CardTitle>
                    <CardDescription>Phone, LinkedIn, timezone, and languages</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone Number</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="e.g., +1 (555) 123-4567" data-testid="input-phone" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="linkedInUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>LinkedIn Profile URL</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="https://linkedin.com/in/yourprofile" data-testid="input-linkedin-url" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

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
                              {TIMEZONE_OPTIONS.map((tz) => (
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
                      name="languagesSpoken"
                      render={() => (
                        <FormItem>
                          <FormLabel>Languages Spoken</FormLabel>
                          <FormDescription>Select all languages you speak</FormDescription>
                          <div className="grid grid-cols-3 gap-2 mt-2">
                            {["English", "Spanish", "Portuguese", "French", "German", "Mandarin", "Japanese", "Korean", "Arabic"].map((lang) => (
                              <FormField
                                key={lang}
                                control={form.control}
                                name="languagesSpoken"
                                render={({ field }) => (
                                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(lang)}
                                        onCheckedChange={(checked) => {
                                          const current = field.value || [];
                                          if (checked) {
                                            field.onChange([...current, lang]);
                                          } else {
                                            field.onChange(current.filter((v) => v !== lang));
                                          }
                                        }}
                                        data-testid={`checkbox-lang-${lang.toLowerCase()}`}
                                      />
                                    </FormControl>
                                    <FormLabel className="font-normal">{lang}</FormLabel>
                                  </FormItem>
                                )}
                              />
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Membership</CardTitle>
                    <CardDescription>SONSIEL membership status</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="isSonsielMember"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="checkbox-sonsiel-member"
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>I am a SONSIEL member</FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="interestedInMembership"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="checkbox-interested-membership"
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>I am interested in SONSIEL membership</FormLabel>
                          </div>
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
                                value={field.value ?? ""}
                                onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
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
                                value={field.value ?? ""}
                                onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
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
                    <CardTitle>Career Context</CardTitle>
                    <CardDescription>Your current career stage and goals</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="careerStage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Career Stage</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || ""}>
                            <FormControl>
                              <SelectTrigger data-testid="select-career-stage">
                                <SelectValue placeholder="Select career stage" />
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
                          <FormLabel>Short-Term Career Goals</FormLabel>
                          <FormControl>
                            <Textarea {...field} rows={3} placeholder="What do you want to accomplish in the next 6-12 months?" data-testid="input-short-term-goals" />
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
                          <FormLabel>Long-Term Vision</FormLabel>
                          <FormControl>
                            <Textarea {...field} rows={3} placeholder="Where do you see yourself in 3-5 years?" data-testid="input-long-term-vision" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="currentProjectOrIdea"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Current Project or Idea</FormLabel>
                          <FormControl>
                            <Textarea {...field} rows={3} placeholder="Describe any current project or idea you're working on..." data-testid="input-current-project" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Experience & Goals</CardTitle>
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

                    {previouslyBeenMentored && (
                      <FormField
                        control={form.control}
                        name="menteeExperienceDescription"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Please describe your mentorship experience</FormLabel>
                            <FormControl>
                              <Textarea {...field} rows={3} data-testid="input-mentee-experience-description" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

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

                    <Separator className="my-4" />

                    <FormField
                      control={form.control}
                      name="menteePastChallenges"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>What challenges have you encountered in past mentorship experiences?</FormLabel>
                          <FormControl>
                            <Textarea {...field} rows={3} data-testid="input-mentee-past-challenges" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="menteePastSuccesses"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>What successes have you had in past mentorship experiences?</FormLabel>
                          <FormControl>
                            <Textarea {...field} rows={3} data-testid="input-mentee-past-successes" />
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

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="menteeMonthlyHoursAvailable"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Monthly Hours Available</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value || ""}>
                              <FormControl>
                                <SelectTrigger data-testid="select-mentee-monthly-hours">
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
                    </div>

                    <FormField
                      control={form.control}
                      name="menteeAvailabilityNotes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Availability Notes</FormLabel>
                          <FormControl>
                            <Textarea {...field} rows={2} placeholder="Any additional availability details..." data-testid="input-mentee-availability-notes" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="menteePreferredCommunicationTools"
                      render={() => (
                        <FormItem>
                          <FormLabel>Preferred Communication Tools</FormLabel>
                          <div className="grid grid-cols-3 gap-2 mt-2">
                            {COMMUNICATION_TOOLS.map((tool) => (
                              <FormField
                                key={tool}
                                control={form.control}
                                name="menteePreferredCommunicationTools"
                                render={({ field }) => (
                                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(tool)}
                                        onCheckedChange={(checked) => {
                                          const current = field.value || [];
                                          if (checked) {
                                            field.onChange([...current, tool]);
                                          } else {
                                            field.onChange(current.filter((v) => v !== tool));
                                          }
                                        }}
                                        data-testid={`checkbox-mentee-comm-${tool.toLowerCase().replace(/\s+/g, '-')}`}
                                      />
                                    </FormControl>
                                    <FormLabel className="font-normal">{tool}</FormLabel>
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
                      name="preferredMentorCharacteristics"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>What do you look for in a mentor?</FormLabel>
                          <FormControl>
                            <Textarea {...field} rows={3} placeholder="Describe the characteristics or qualities you value in a mentor..." data-testid="input-preferred-mentor-characteristics" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Interest Areas</CardTitle>
                    <CardDescription>Rate your interest level in each area (0 = Not Interested, 1 = Somewhat, 2 = Very Interested)</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1 divide-y">
                      {INTEREST_AREAS.map((area) => (
                        <FormField
                          key={area.key}
                          control={form.control}
                          name={area.key as keyof ProfileFormValues}
                          render={({ field }) => (
                            <RatingRow
                              label={area.label}
                              value={(field.value as number) || 0}
                              onChange={field.onChange}
                              namePrefix={area.key}
                              testIdPrefix={`radio-${area.key}`}
                            />
                          )}
                        />
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Program & Resources</CardTitle>
                    <CardDescription>Help us understand your needs and how you found us</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="menteeResourcesNeeded"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>What resources do you need to succeed?</FormLabel>
                          <FormControl>
                            <Textarea {...field} rows={3} data-testid="input-mentee-resources-needed" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="menteeProgramSuggestions"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Suggestions for the program</FormLabel>
                          <FormControl>
                            <Textarea {...field} rows={3} data-testid="input-mentee-program-suggestions" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="willingToPay"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Would you be willing to pay for mentorship?</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || ""}>
                            <FormControl>
                              <SelectTrigger data-testid="select-willing-to-pay">
                                <SelectValue placeholder="Select option" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="yes">Yes</SelectItem>
                              <SelectItem value="no">No</SelectItem>
                              <SelectItem value="maybe">Maybe</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="referralSource"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>How did you hear about this program?</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="e.g., colleague, social media, website..." data-testid="input-referral-source" />
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
                    <CardTitle>Capacity & Preferences</CardTitle>
                    <CardDescription>How many mentees you can take on and who you prefer to mentor</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="maxMentees"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Maximum Number of Mentees</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              data-testid="input-max-mentees"
                            />
                          </FormControl>
                          <FormDescription>How many mentees can you support at the same time?</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="preferredMenteeStages"
                      render={() => (
                        <FormItem>
                          <FormLabel>Preferred Mentee Career Stages</FormLabel>
                          <FormDescription>Select the career stages you prefer to mentor</FormDescription>
                          <div className="grid grid-cols-2 gap-2 mt-2">
                            {CAREER_STAGES.map((stage) => (
                              <FormField
                                key={stage.value}
                                control={form.control}
                                name="preferredMenteeStages"
                                render={({ field }) => (
                                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(stage.value)}
                                        onCheckedChange={(checked) => {
                                          const current = field.value || [];
                                          if (checked) {
                                            field.onChange([...current, stage.value]);
                                          } else {
                                            field.onChange(current.filter((v) => v !== stage.value));
                                          }
                                        }}
                                        data-testid={`checkbox-mentee-stage-${stage.value}`}
                                      />
                                    </FormControl>
                                    <FormLabel className="font-normal">{stage.label}</FormLabel>
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
                      name="openToMentoringOutsideExpertise"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="checkbox-open-outside-expertise"
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Open to mentoring outside my core area of expertise</FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Experience & Motivation</CardTitle>
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

                    <Separator className="my-4" />

                    <FormField
                      control={form.control}
                      name="mentorCertificationsTraining"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Mentor-Specific Certifications or Training</FormLabel>
                          <FormControl>
                            <Textarea {...field} rows={3} placeholder="e.g., Certified Mentor, Coaching Credentials..." data-testid="input-mentor-certifications" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="notableAchievements"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notable Achievements</FormLabel>
                          <FormControl>
                            <Textarea {...field} rows={3} placeholder="Awards, publications, patents, or other notable accomplishments..." data-testid="input-notable-achievements" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="industriesExperience"
                      render={() => (
                        <FormItem>
                          <FormLabel>Industries of Experience</FormLabel>
                          <FormDescription>Select all industries you have experience in</FormDescription>
                          <div className="grid grid-cols-3 gap-2 mt-2">
                            {INDUSTRIES.map((industry) => (
                              <FormField
                                key={industry}
                                control={form.control}
                                name="industriesExperience"
                                render={({ field }) => (
                                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(industry)}
                                        onCheckedChange={(checked) => {
                                          const current = field.value || [];
                                          if (checked) {
                                            field.onChange([...current, industry]);
                                          } else {
                                            field.onChange(current.filter((v) => v !== industry));
                                          }
                                        }}
                                        data-testid={`checkbox-industry-${industry.toLowerCase().replace(/[\s/]+/g, '-')}`}
                                      />
                                    </FormControl>
                                    <FormLabel className="font-normal">{industry}</FormLabel>
                                  </FormItem>
                                )}
                              />
                            ))}
                          </div>
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

                    <Separator className="my-4" />

                    <FormField
                      control={form.control}
                      name="mentorAvailabilityNotes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Availability Notes</FormLabel>
                          <FormControl>
                            <Textarea {...field} rows={2} placeholder="Any additional availability details..." data-testid="input-mentor-availability-notes" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="mentorPreferredCommunicationTools"
                      render={() => (
                        <FormItem>
                          <FormLabel>Preferred Communication Tools</FormLabel>
                          <div className="grid grid-cols-3 gap-2 mt-2">
                            {COMMUNICATION_TOOLS.map((tool) => (
                              <FormField
                                key={tool}
                                control={form.control}
                                name="mentorPreferredCommunicationTools"
                                render={({ field }) => (
                                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(tool)}
                                        onCheckedChange={(checked) => {
                                          const current = field.value || [];
                                          if (checked) {
                                            field.onChange([...current, tool]);
                                          } else {
                                            field.onChange(current.filter((v) => v !== tool));
                                          }
                                        }}
                                        data-testid={`checkbox-mentor-comm-${tool.toLowerCase().replace(/\s+/g, '-')}`}
                                      />
                                    </FormControl>
                                    <FormLabel className="font-normal">{tool}</FormLabel>
                                  </FormItem>
                                )}
                              />
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Comfort Areas</CardTitle>
                    <CardDescription>Rate your comfort level mentoring in each area (0 = Not Comfortable, 1 = Somewhat, 2 = Very Comfortable)</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1 divide-y">
                      {COMFORT_AREAS.map((area) => (
                        <FormField
                          key={area.key}
                          control={form.control}
                          name={area.key as keyof ProfileFormValues}
                          render={({ field }) => (
                            <RatingRow
                              label={area.label}
                              value={(field.value as number) || 0}
                              onChange={field.onChange}
                              namePrefix={area.key}
                              testIdPrefix={`radio-${area.key}`}
                            />
                          )}
                        />
                      ))}
                    </div>
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
  );

  return (
    <DashboardLayout>
      {profileContent}
    </DashboardLayout>
  );
}
