import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import {
  Heart,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Users,
  GraduationCap,
  Loader2,
  ExternalLink,
} from "lucide-react";

// ─── Constants ───────────────────────────────────────────────────────────────

const FIELDS_OF_EXPERTISE = [
  "Science & Research",
  "Innovation",
  "Leadership & Team Management",
  "Entrepreneurship",
  "Product Development",
  "Business Strategy",
  "Intrapreneurship",
  "Digital Technology",
  "Ethical & Social Responsibility",
  "Networking",
  "Professional Development",
];

const EDUCATION_LEVELS = ["High School Diploma", "Associate Degree", "Bachelor's Degree", "Master's Degree", "DNP", "PhD", "MD", "Other"];

const YEARS_EXP_OPTIONS = ["Less than 1 year", "1–5 years", "6–10 years", "11–15 years", "16–20 years", "21–25 years", "26–30 years", "30+ years"];

const HOURS_PER_MONTH = ["Less than 1 hour", "1–2 hours", "3–4 hours", "5–10 hours", "10+ hours"];

const MENTORSHIP_DURATION = ["3 months", "6 months", "1 year (re-evaluate)", "2 years", "Ongoing"];

const MENTORSHIP_METHODS = ["1:1 Sessions", "Group mentoring", "Virtual meetings", "In-person meetings"];

const MENTEE_GAINS = [
  "Career Advice",
  "Technical Guidance",
  "Networking opportunities",
  "Leadership Skills",
  "Feedback on my work",
];

const RATING_AREAS = [
  { key: "scienceResearch", label: "Science & Research" },
  { key: "productDevelopment", label: "Product Development" },
  { key: "innovation", label: "Innovation" },
  { key: "businessStrategy", label: "Business Strategy" },
  { key: "entrepreneurship", label: "Entrepreneurship" },
  { key: "intrapreneurship", label: "Intrapreneurship" },
  { key: "leadershipTeamManagement", label: "Leadership & Team Management" },
  { key: "networking", label: "Networking" },
  { key: "professionalDevelopment", label: "Professional Development" },
  { key: "digitalTech", label: "Digital & Technological Competencies" },
  { key: "ethicalSocial", label: "Ethical & Social Responsibility" },
];

const LANGUAGES = ["English", "Spanish", "French", "Portuguese", "Mandarin", "Other"];

// ─── Types ────────────────────────────────────────────────────────────────────

type Ratings = Record<string, number>; // 0 | 1 | 2

interface StepOneData {
  firstName: string;
  lastName: string;
  email: string;
  preferredLanguage: string;
  isSonsielMember: boolean | null;
  interestedInMembership: boolean | null;
}

interface StepTwoData {
  currentTitle: string;
  institution: string;
  fieldsOfExpertise: string[];
  educationLevel: string;
  healthcareYearsExp: string;
  innovationYearsExp: string;
}

interface StepThreeData {
  role: "MENTOR" | "MENTEE" | null;
}

interface MenteeData {
  previouslyMentored: boolean | null;
  hopingToGain: string[];
  preferredMethods: string[];
  pastSuccesses: string;
  pastChallenges: string;
  interestRatings: Ratings;
  specificSkillsWanted: string;
  primaryMotivations: string;
  hoursPerMonth: string;
  bestDaysTimes: string;
  desiredDuration: string;
  resourcesNeeded: string;
  programStructureSuggestions: string;
  effectiveStructures: string;
  willingToPay: boolean | null;
}

interface MentorData {
  previouslyMentored: boolean | null;
  mentorshipExperience: string;
  certifications: string;
  preferredMethods: string[];
  pastSuccesses: string;
  pastChallenges: string;
  primaryMotivations: string;
  comfortRatings: Ratings;
  specificSkillsToShare: string;
  hoursPerMonth: string;
  bestDaysTimes: string;
  mentoringDuration: string;
  resourcesNeeded: string;
  programStructureSuggestions: string;
  effectiveStructures: string;
}

const defaultMenteeData: MenteeData = {
  previouslyMentored: null,
  hopingToGain: [],
  preferredMethods: [],
  pastSuccesses: "",
  pastChallenges: "",
  interestRatings: Object.fromEntries(RATING_AREAS.map((a) => [a.key, 0])),
  specificSkillsWanted: "",
  primaryMotivations: "",
  hoursPerMonth: "",
  bestDaysTimes: "",
  desiredDuration: "",
  resourcesNeeded: "",
  programStructureSuggestions: "",
  effectiveStructures: "",
  willingToPay: null,
};

const defaultMentorData: MentorData = {
  previouslyMentored: null,
  mentorshipExperience: "",
  certifications: "",
  preferredMethods: [],
  pastSuccesses: "",
  pastChallenges: "",
  primaryMotivations: "",
  comfortRatings: Object.fromEntries(RATING_AREAS.map((a) => [a.key, 0])),
  specificSkillsToShare: "",
  hoursPerMonth: "",
  bestDaysTimes: "",
  mentoringDuration: "",
  resourcesNeeded: "",
  programStructureSuggestions: "",
  effectiveStructures: "",
};

// ─── Small reusable components ────────────────────────────────────────────────

function FieldRow({ label, required, children, hint }: { label: string; required?: boolean; children: React.ReactNode; hint?: string }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      {children}
    </div>
  );
}

function MultiCheckbox({ options, value, onChange }: { options: string[]; value: string[]; onChange: (v: string[]) => void }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {options.map((opt) => {
        const checked = value.includes(opt);
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(checked ? value.filter((v) => v !== opt) : [...value, opt])}
            className={cn(
              "text-left px-3 py-2 rounded-md border text-sm transition-colors",
              checked
                ? "border-primary bg-primary/8 text-primary font-medium"
                : "border-border hover:border-primary/50 hover:bg-muted/50"
            )}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

function YesNoToggle({ value, onChange, labels = ["Yes", "No"] }: { value: boolean | null; onChange: (v: boolean) => void; labels?: [string, string] }) {
  return (
    <div className="flex gap-2">
      {[true, false].map((v, i) => (
        <button
          key={String(v)}
          type="button"
          onClick={() => onChange(v)}
          className={cn(
            "px-5 py-2 rounded-md border text-sm font-medium transition-colors",
            value === v
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border hover:border-primary/50"
          )}
        >
          {labels[i]}
        </button>
      ))}
    </div>
  );
}

function RatingGrid({ areas, ratings, onChange, scale }: {
  areas: typeof RATING_AREAS;
  ratings: Ratings;
  onChange: (key: string, val: number) => void;
  scale: [string, string, string];
}) {
  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="grid grid-cols-[1fr_auto] gap-0">
        <div className="px-3 py-2 bg-muted/50 text-xs font-medium text-muted-foreground">Area</div>
        <div className="px-3 py-2 bg-muted/50 text-xs font-medium text-muted-foreground flex gap-2">
          {scale.map((s) => (
            <span key={s} className="w-14 text-center">{s}</span>
          ))}
        </div>
        {areas.map((area) => (
          <div key={area.key} className="contents">
            <div className="px-3 py-2.5 text-sm border-t border-border/60">{area.label}</div>
            <div className="px-3 py-2 border-t border-border/60 flex gap-2 items-center">
              {[0, 1, 2].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => onChange(area.key, v)}
                  className={cn(
                    "w-14 h-7 rounded border text-xs font-medium transition-colors",
                    ratings[area.key] === v
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border hover:border-primary/40 text-muted-foreground"
                  )}
                >
                  {scale[v]}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide pt-2 pb-1 border-b">{children}</h3>;
}

// ─── Step Components ──────────────────────────────────────────────────────────

function Step1({ data, onChange }: { data: StepOneData; onChange: (d: Partial<StepOneData>) => void }) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <FieldRow label="First Name" required>
          <Input value={data.firstName} onChange={(e) => onChange({ firstName: e.target.value })} placeholder="Jane" />
        </FieldRow>
        <FieldRow label="Last Name" required>
          <Input value={data.lastName} onChange={(e) => onChange({ lastName: e.target.value })} placeholder="Smith" />
        </FieldRow>
      </div>
      <FieldRow label="Email Address" required>
        <Input type="email" value={data.email} onChange={(e) => onChange({ email: e.target.value })} placeholder="jane@example.com" />
      </FieldRow>
      <FieldRow label="Preferred Language">
        <Select value={data.preferredLanguage} onValueChange={(v) => onChange({ preferredLanguage: v })}>
          <SelectTrigger><SelectValue placeholder="Select language" /></SelectTrigger>
          <SelectContent>
            {LANGUAGES.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
          </SelectContent>
        </Select>
      </FieldRow>
      <FieldRow label="Are you a SONSIEL member?" required>
        <YesNoToggle
          value={data.isSonsielMember}
          onChange={(v) => onChange({ isSonsielMember: v, interestedInMembership: null })}
        />
      </FieldRow>
      {data.isSonsielMember === false && (
        <FieldRow label="Are you interested in becoming a SONSIEL member?">
          <YesNoToggle
            value={data.interestedInMembership}
            onChange={(v) => onChange({ interestedInMembership: v })}
          />
          <p className="text-xs text-muted-foreground mt-2">
            Learn more about SONSIEL membership at{" "}
            <a href="https://sonsiel.com" target="_blank" rel="noopener noreferrer" className="text-primary underline-offset-4 hover:underline inline-flex items-center gap-1">
              sonsiel.com <ExternalLink className="h-3 w-3" />
            </a>
          </p>
        </FieldRow>
      )}
    </div>
  );
}

function Step2({ data, onChange }: { data: StepTwoData; onChange: (d: Partial<StepTwoData>) => void }) {
  return (
    <div className="space-y-5">
      <FieldRow label="Current Position / Title" required>
        <Input value={data.currentTitle} onChange={(e) => onChange({ currentTitle: e.target.value })} placeholder="e.g. Nurse Scientist, Director of Innovation" />
      </FieldRow>
      <FieldRow label="Institution / Organization" required>
        <Input value={data.institution} onChange={(e) => onChange({ institution: e.target.value })} placeholder="e.g. Massachusetts General Hospital" />
      </FieldRow>
      <FieldRow label="Primary Field(s) of Expertise" hint="Select all that apply">
        <MultiCheckbox
          options={FIELDS_OF_EXPERTISE}
          value={data.fieldsOfExpertise}
          onChange={(v) => onChange({ fieldsOfExpertise: v })}
        />
      </FieldRow>
      <FieldRow label="Highest Level of Education Completed">
        <Select value={data.educationLevel} onValueChange={(v) => onChange({ educationLevel: v })}>
          <SelectTrigger><SelectValue placeholder="Select education level" /></SelectTrigger>
          <SelectContent>
            {EDUCATION_LEVELS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
          </SelectContent>
        </Select>
      </FieldRow>
      <div className="grid grid-cols-2 gap-4">
        <FieldRow label="Years in Healthcare">
          <Select value={data.healthcareYearsExp} onValueChange={(v) => onChange({ healthcareYearsExp: v })}>
            <SelectTrigger><SelectValue placeholder="Select range" /></SelectTrigger>
            <SelectContent>
              {YEARS_EXP_OPTIONS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
            </SelectContent>
          </Select>
        </FieldRow>
        <FieldRow label="Years in Science / Innovation / Entrepreneurship">
          <Select value={data.innovationYearsExp} onValueChange={(v) => onChange({ innovationYearsExp: v })}>
            <SelectTrigger><SelectValue placeholder="Select range" /></SelectTrigger>
            <SelectContent>
              {YEARS_EXP_OPTIONS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
            </SelectContent>
          </Select>
        </FieldRow>
      </div>
    </div>
  );
}

function Step3({ role, onChange }: { role: "MENTOR" | "MENTEE" | null; onChange: (r: "MENTOR" | "MENTEE") => void }) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Choose the role that best describes what you're looking for in the SONSIEL Mentorship Program.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {(["MENTEE", "MENTOR"] as const).map((r) => {
          const isMentee = r === "MENTEE";
          return (
            <button
              key={r}
              type="button"
              onClick={() => onChange(r)}
              className={cn(
                "p-5 rounded-lg border-2 text-left transition-all space-y-2",
                role === r
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/40"
              )}
            >
              <div className="flex items-center gap-2">
                {isMentee ? <GraduationCap className="h-5 w-5 text-primary" /> : <Users className="h-5 w-5 text-primary" />}
                <span className="font-semibold">{isMentee ? "I'm Seeking a Mentor" : "I Want to Be a Mentor"}</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {isMentee
                  ? "You are looking to receive guidance, develop skills, and grow within the nursing innovation space."
                  : "You have experience to share and want to support nurse innovators and entrepreneurs on their journey."}
              </p>
              {role === r && <Badge className="mt-1">Selected</Badge>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Step4Mentee({ data, onChange }: { data: MenteeData; onChange: (d: Partial<MenteeData>) => void }) {
  return (
    <div className="space-y-6">
      <SectionHeading>Mentorship Background</SectionHeading>
      <FieldRow label="Have you previously been mentored?">
        <YesNoToggle value={data.previouslyMentored} onChange={(v) => onChange({ previouslyMentored: v })} />
      </FieldRow>
      <FieldRow label="What are you hoping to gain from a mentor?" hint="Select all that apply">
        <MultiCheckbox options={MENTEE_GAINS} value={data.hopingToGain} onChange={(v) => onChange({ hopingToGain: v })} />
      </FieldRow>
      <FieldRow label="Preferred Method of Mentorship" hint="Select all that apply">
        <MultiCheckbox options={MENTORSHIP_METHODS} value={data.preferredMethods} onChange={(v) => onChange({ preferredMethods: v })} />
      </FieldRow>

      <SectionHeading>Past Experiences</SectionHeading>
      <FieldRow label="Successes in past mentorship experiences" hint="Leave blank if not applicable">
        <Textarea
          value={data.pastSuccesses}
          onChange={(e) => onChange({ pastSuccesses: e.target.value })}
          placeholder="What has worked well for you as a mentee?"
          rows={3}
        />
      </FieldRow>
      <FieldRow label="Challenges in past mentorship experiences">
        <Textarea
          value={data.pastChallenges}
          onChange={(e) => onChange({ pastChallenges: e.target.value })}
          placeholder="What has been difficult or could have been better?"
          rows={3}
        />
      </FieldRow>

      <SectionHeading>Areas of Interest</SectionHeading>
      <p className="text-xs text-muted-foreground">Rate your level of interest in each area for mentorship development.</p>
      <RatingGrid
        areas={RATING_AREAS}
        ratings={data.interestRatings}
        onChange={(key, val) => onChange({ interestRatings: { ...data.interestRatings, [key]: val } })}
        scale={["None", "Some", "Strong"]}
      />
      <FieldRow label="Specific skills or knowledge you want to gain">
        <Textarea
          value={data.specificSkillsWanted}
          onChange={(e) => onChange({ specificSkillsWanted: e.target.value })}
          placeholder="e.g. Grant writing, pitching ideas, regulatory pathways..."
          rows={2}
        />
      </FieldRow>
      <FieldRow label="Primary motivations for seeking a mentor">
        <Textarea
          value={data.primaryMotivations}
          onChange={(e) => onChange({ primaryMotivations: e.target.value })}
          placeholder="What do you most hope to achieve through this mentorship?"
          rows={2}
        />
      </FieldRow>

      <SectionHeading>Availability & Commitment</SectionHeading>
      <div className="grid grid-cols-2 gap-4">
        <FieldRow label="Hours per month available">
          <Select value={data.hoursPerMonth} onValueChange={(v) => onChange({ hoursPerMonth: v })}>
            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>
              {HOURS_PER_MONTH.map((h) => <SelectItem key={h} value={h}>{h}</SelectItem>)}
            </SelectContent>
          </Select>
        </FieldRow>
        <FieldRow label="How long would you like to be mentored?">
          <Select value={data.desiredDuration} onValueChange={(v) => onChange({ desiredDuration: v })}>
            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>
              {MENTORSHIP_DURATION.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
            </SelectContent>
          </Select>
        </FieldRow>
      </div>
      <FieldRow label="Best days / times for sessions">
        <Input value={data.bestDaysTimes} onChange={(e) => onChange({ bestDaysTimes: e.target.value })} placeholder="e.g. Monday mornings EST, flexible weekdays" />
      </FieldRow>
      <FieldRow label="Support or resources you'd need to be an effective mentee">
        <Textarea value={data.resourcesNeeded} onChange={(e) => onChange({ resourcesNeeded: e.target.value })} rows={2} placeholder="e.g. Clear communication, structured schedule..." />
      </FieldRow>

      <SectionHeading>Program Feedback</SectionHeading>
      <FieldRow label="Suggestions for structuring this mentorship program">
        <Textarea value={data.programStructureSuggestions} onChange={(e) => onChange({ programStructureSuggestions: e.target.value })} rows={2} placeholder="Optional" />
      </FieldRow>
      <FieldRow label="What structure has been most effective in past mentorships?">
        <Textarea value={data.effectiveStructures} onChange={(e) => onChange({ effectiveStructures: e.target.value })} rows={2} placeholder="Optional" />
      </FieldRow>
      <FieldRow label="Would you be willing to pay for mentorship in the future?">
        <YesNoToggle value={data.willingToPay} onChange={(v) => onChange({ willingToPay: v })} />
      </FieldRow>
    </div>
  );
}

function Step4Mentor({ data, onChange }: { data: MentorData; onChange: (d: Partial<MentorData>) => void }) {
  return (
    <div className="space-y-6">
      <SectionHeading>Mentorship Experience</SectionHeading>
      <FieldRow label="Have you previously served as a mentor?">
        <YesNoToggle value={data.previouslyMentored} onChange={(v) => onChange({ previouslyMentored: v })} />
      </FieldRow>
      {data.previouslyMentored === true && (
        <FieldRow label="Please describe your mentorship experience">
          <Textarea
            value={data.mentorshipExperience}
            onChange={(e) => onChange({ mentorshipExperience: e.target.value })}
            placeholder="Who have you mentored? In what contexts?"
            rows={3}
          />
        </FieldRow>
      )}
      <FieldRow label="Certifications or additional training relevant to mentorship">
        <Textarea
          value={data.certifications}
          onChange={(e) => onChange({ certifications: e.target.value })}
          placeholder="e.g. MBA in Innovation, ANA Innovation Accelerator..."
          rows={2}
        />
      </FieldRow>
      <FieldRow label="Preferred Method of Mentorship" hint="Select all that apply">
        <MultiCheckbox options={MENTORSHIP_METHODS} value={data.preferredMethods} onChange={(v) => onChange({ preferredMethods: v })} />
      </FieldRow>

      <SectionHeading>Past Experiences</SectionHeading>
      <FieldRow label="Successes in past mentorship experiences">
        <Textarea value={data.pastSuccesses} onChange={(e) => onChange({ pastSuccesses: e.target.value })} rows={3} placeholder="What outcomes are you most proud of?" />
      </FieldRow>
      <FieldRow label="Challenges in past mentorship experiences">
        <Textarea value={data.pastChallenges} onChange={(e) => onChange({ pastChallenges: e.target.value })} rows={3} placeholder="What has been difficult?" />
      </FieldRow>

      <SectionHeading>Areas of Expertise</SectionHeading>
      <p className="text-xs text-muted-foreground">Rate your comfort level in each area for providing mentorship.</p>
      <RatingGrid
        areas={RATING_AREAS}
        ratings={data.comfortRatings}
        onChange={(key, val) => onChange({ comfortRatings: { ...data.comfortRatings, [key]: val } })}
        scale={["None", "Some", "High"]}
      />
      <FieldRow label="Specific skills or knowledge you're interested in sharing">
        <Textarea value={data.specificSkillsToShare} onChange={(e) => onChange({ specificSkillsToShare: e.target.value })} rows={2} placeholder="e.g. Grant writing, science, intraprenuership..." />
      </FieldRow>
      <FieldRow label="Primary motivations for becoming a mentor">
        <Textarea value={data.primaryMotivations} onChange={(e) => onChange({ primaryMotivations: e.target.value })} rows={2} placeholder="What drives you to mentor others?" />
      </FieldRow>

      <SectionHeading>Availability & Commitment</SectionHeading>
      <div className="grid grid-cols-2 gap-4">
        <FieldRow label="Hours per month available">
          <Select value={data.hoursPerMonth} onValueChange={(v) => onChange({ hoursPerMonth: v })}>
            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>
              {HOURS_PER_MONTH.map((h) => <SelectItem key={h} value={h}>{h}</SelectItem>)}
            </SelectContent>
          </Select>
        </FieldRow>
        <FieldRow label="How long do you plan to mentor?">
          <Select value={data.mentoringDuration} onValueChange={(v) => onChange({ mentoringDuration: v })}>
            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>
              {MENTORSHIP_DURATION.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
            </SelectContent>
          </Select>
        </FieldRow>
      </div>
      <FieldRow label="Best days / times for sessions">
        <Input value={data.bestDaysTimes} onChange={(e) => onChange({ bestDaysTimes: e.target.value })} placeholder="e.g. Weekday evenings, flexible Mondays" />
      </FieldRow>
      <FieldRow label="Support or resources you'd need to be an effective mentor">
        <Textarea value={data.resourcesNeeded} onChange={(e) => onChange({ resourcesNeeded: e.target.value })} rows={2} placeholder="e.g. Access to other mentors for second opinions..." />
      </FieldRow>

      <SectionHeading>Program Feedback</SectionHeading>
      <FieldRow label="Suggestions for structuring this mentorship program">
        <Textarea value={data.programStructureSuggestions} onChange={(e) => onChange({ programStructureSuggestions: e.target.value })} rows={2} placeholder="Optional" />
      </FieldRow>
      <FieldRow label="What structure has been most effective in past mentorships?">
        <Textarea value={data.effectiveStructures} onChange={(e) => onChange({ effectiveStructures: e.target.value })} rows={2} placeholder="Optional" />
      </FieldRow>
    </div>
  );
}

function ReviewField({ label, value }: { label: string; value: string | boolean | null | undefined | string[] }) {
  if (value === null || value === undefined || value === "" || (Array.isArray(value) && value.length === 0)) return null;
  const display = Array.isArray(value) ? value.join(", ") : typeof value === "boolean" ? (value ? "Yes" : "No") : String(value);
  return (
    <div className="flex gap-2 py-1 text-sm border-b last:border-0">
      <span className="text-muted-foreground min-w-[160px] shrink-0">{label}</span>
      <span className="font-medium">{display}</span>
    </div>
  );
}

function Step5Review({ s1, s2, s3, menteeData, mentorData }: {
  s1: StepOneData; s2: StepTwoData; s3: StepThreeData;
  menteeData: MenteeData; mentorData: MentorData;
}) {
  const isMentee = s3.role === "MENTEE";
  return (
    <div className="space-y-6 text-sm">
      <div className="space-y-1">
        <h3 className="font-semibold">Contact Information</h3>
        <div className="bg-muted/40 rounded-lg p-3 space-y-1">
          <ReviewField label="Name" value={`${s1.firstName} ${s1.lastName}`} />
          <ReviewField label="Email" value={s1.email} />
          <ReviewField label="Language" value={s1.preferredLanguage} />
          <ReviewField label="SONSIEL Member" value={s1.isSonsielMember} />
        </div>
      </div>
      <div className="space-y-1">
        <h3 className="font-semibold">Professional Background</h3>
        <div className="bg-muted/40 rounded-lg p-3 space-y-1">
          <ReviewField label="Title" value={s2.currentTitle} />
          <ReviewField label="Institution" value={s2.institution} />
          <ReviewField label="Fields of Expertise" value={s2.fieldsOfExpertise} />
          <ReviewField label="Education" value={s2.educationLevel} />
          <ReviewField label="Healthcare Experience" value={s2.healthcareYearsExp} />
          <ReviewField label="Innovation Experience" value={s2.innovationYearsExp} />
        </div>
      </div>
      <div className="space-y-1">
        <h3 className="font-semibold">Role & Program Details</h3>
        <div className="bg-muted/40 rounded-lg p-3 space-y-1">
          <ReviewField label="Applying As" value={isMentee ? "Mentee (Seeking a Mentor)" : "Mentor"} />
          {isMentee ? (
            <>
              <ReviewField label="Hoping to Gain" value={menteeData.hopingToGain} />
              <ReviewField label="Preferred Methods" value={menteeData.preferredMethods} />
              <ReviewField label="Hours / Month" value={menteeData.hoursPerMonth} />
              <ReviewField label="Duration" value={menteeData.desiredDuration} />
            </>
          ) : (
            <>
              <ReviewField label="Preferred Methods" value={mentorData.preferredMethods} />
              <ReviewField label="Hours / Month" value={mentorData.hoursPerMonth} />
              <ReviewField label="Duration" value={mentorData.mentoringDuration} />
            </>
          )}
        </div>
      </div>
      <p className="text-xs text-muted-foreground border-t pt-4">
        By submitting this application, you confirm that all information provided is accurate. Your application will be reviewed by the SONSIEL Mentorship Program team and you will be contacted at the email address provided.
      </p>
    </div>
  );
}

// ─── Validation ───────────────────────────────────────────────────────────────

function validateStep(step: number, s1: StepOneData, s2: StepTwoData, s3: StepThreeData): string | null {
  if (step === 1) {
    if (!s1.firstName.trim()) return "First name is required";
    if (!s1.lastName.trim()) return "Last name is required";
    if (!s1.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s1.email)) return "A valid email address is required";
    if (s1.isSonsielMember === null) return "Please indicate whether you are a SONSIEL member";
  }
  if (step === 2) {
    if (!s2.currentTitle.trim()) return "Current position/title is required";
    if (!s2.institution.trim()) return "Institution/organization is required";
  }
  if (step === 3) {
    if (!s3.role) return "Please select your role (Mentor or Mentee)";
  }
  return null;
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const STEP_TITLES = ["Contact Info", "Background", "Your Role", "Program Questions", "Review"];
const TOTAL_STEPS = 5;

export default function ApplyGeneralPage() {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);

  const [s1, setS1] = useState<StepOneData>({
    firstName: "", lastName: "", email: "", preferredLanguage: "English",
    isSonsielMember: null, interestedInMembership: null,
  });
  const [s2, setS2] = useState<StepTwoData>({
    currentTitle: "", institution: "", fieldsOfExpertise: [],
    educationLevel: "", healthcareYearsExp: "", innovationYearsExp: "",
  });
  const [s3, setS3] = useState<StepThreeData>({ role: null });
  const [menteeData, setMenteeData] = useState<MenteeData>(defaultMenteeData);
  const [mentorData, setMentorData] = useState<MentorData>(defaultMentorData);

  const submitMutation = useMutation({
    mutationFn: async () => {
      const applicationData = s3.role === "MENTEE" ? menteeData : mentorData;
      const res = await fetch("/api/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...s1, ...s2, ...s3, applicationData,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Submission failed");
      }
      return res.json();
    },
    onSuccess: () => setSubmitted(true),
    onError: (err: Error) => {
      toast({ title: "Submission failed", description: err.message, variant: "destructive" });
    },
  });

  const handleNext = () => {
    const error = validateStep(step, s1, s2, s3);
    if (error) {
      toast({ title: "Please check your answers", description: error, variant: "destructive" });
      return;
    }
    if (step < TOTAL_STEPS) setStep((s) => s + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep((s) => s - 1);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-10 pb-8 space-y-4">
            <CheckCircle2 className="h-14 w-14 text-primary mx-auto" />
            <h2 className="text-xl font-bold">Application Submitted!</h2>
            <p className="text-muted-foreground text-sm">
              Thank you, <strong>{s1.firstName}</strong>. Your application to the SONSIEL Mentorship Program has been received.
            </p>
            <div className="bg-muted/40 rounded-lg p-4 text-sm text-left space-y-2">
              <p className="font-medium">What happens next:</p>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>Our team will review your application</li>
                <li>You'll receive an email at <strong>{s1.email}</strong> with our decision</li>
                <li>If approved, you'll be sent instructions to access the platform</li>
              </ol>
            </div>
            <Button asChild variant="outline" className="mt-2">
              <Link href="/">Return to Home</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-primary" />
            <span className="font-semibold text-sm tracking-tight">SONSIEL Mentorship Program</span>
          </div>
          <Link href="/" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            Already have an account? Sign in
          </Link>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">{STEP_TITLES[step - 1]}</span>
            <span className="text-muted-foreground">Step {step} of {TOTAL_STEPS}</span>
          </div>
          <Progress value={(step / TOTAL_STEPS) * 100} className="h-1.5" />
          <div className="flex gap-1">
            {STEP_TITLES.map((title, i) => (
              <div
                key={i}
                className={cn(
                  "h-1 flex-1 rounded-full transition-colors",
                  i < step ? "bg-primary" : "bg-muted"
                )}
              />
            ))}
          </div>
        </div>

        {/* Card */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">{STEP_TITLES[step - 1]}</CardTitle>
            <CardDescription>
              {step === 1 && "Tell us about yourself so we can create your application."}
              {step === 2 && "Share your professional background and areas of expertise."}
              {step === 3 && "How do you want to participate in the mentorship program?"}
              {step === 4 && (s3.role === "MENTEE"
                ? "Help us understand your mentorship goals and preferences."
                : "Tell us about your experience and what you can offer as a mentor.")}
              {step === 5 && "Please review your application before submitting."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {step === 1 && <Step1 data={s1} onChange={(d) => setS1((p) => ({ ...p, ...d }))} />}
            {step === 2 && <Step2 data={s2} onChange={(d) => setS2((p) => ({ ...p, ...d }))} />}
            {step === 3 && <Step3 role={s3.role} onChange={(r) => setS3({ role: r })} />}
            {step === 4 && s3.role === "MENTEE" && (
              <Step4Mentee data={menteeData} onChange={(d) => setMenteeData((p) => ({ ...p, ...d }))} />
            )}
            {step === 4 && s3.role === "MENTOR" && (
              <Step4Mentor data={mentorData} onChange={(d) => setMentorData((p) => ({ ...p, ...d }))} />
            )}
            {step === 5 && (
              <Step5Review s1={s1} s2={s2} s3={s3} menteeData={menteeData} mentorData={mentorData} />
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <Button variant="ghost" onClick={handleBack} disabled={step === 1}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          {step < TOTAL_STEPS ? (
            <Button onClick={handleNext}>
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={() => submitMutation.mutate()} disabled={submitMutation.isPending}>
              {submitMutation.isPending ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Submitting…</>
              ) : (
                <>Submit Application<CheckCircle2 className="h-4 w-4 ml-2" /></>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
