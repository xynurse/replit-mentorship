import { useRef, useEffect, useState, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle, RotateCcw, ShieldCheck } from "lucide-react";
import { format } from "date-fns";

// ─── Signature Pad ────────────────────────────────────────────────────────────

function SignaturePad({
  onSign,
  onClear,
  hasSignature,
}: {
  onSign: (dataUrl: string) => void;
  onClear: () => void;
  hasSignature: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  const getPos = (e: MouseEvent | TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ("touches" in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    ctx.strokeStyle = "black";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    const start = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      drawing.current = true;
      lastPos.current = getPos(e, canvas);
    };
    const move = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      if (!drawing.current || !lastPos.current) return;
      const pos = getPos(e, canvas);
      ctx.beginPath();
      ctx.moveTo(lastPos.current.x, lastPos.current.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
      lastPos.current = pos;
    };
    const end = () => {
      if (!drawing.current) return;
      drawing.current = false;
      lastPos.current = null;
      onSign(canvas.toDataURL("image/png"));
    };

    canvas.addEventListener("mousedown", start);
    canvas.addEventListener("mousemove", move);
    canvas.addEventListener("mouseup", end);
    canvas.addEventListener("mouseleave", end);
    canvas.addEventListener("touchstart", start, { passive: false });
    canvas.addEventListener("touchmove", move, { passive: false });
    canvas.addEventListener("touchend", end);

    return () => {
      canvas.removeEventListener("mousedown", start);
      canvas.removeEventListener("mousemove", move);
      canvas.removeEventListener("mouseup", end);
      canvas.removeEventListener("mouseleave", end);
      canvas.removeEventListener("touchstart", start);
      canvas.removeEventListener("touchmove", move);
      canvas.removeEventListener("touchend", end);
    };
  }, [onSign]);

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    onClear();
  };

  return (
    <div className="space-y-2">
      <div className="relative border-2 border-dashed border-border rounded-lg overflow-hidden bg-white touch-none">
        <canvas
          ref={canvasRef}
          width={600}
          height={160}
          className="w-full h-40 cursor-crosshair"
        />
        {!hasSignature && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-muted-foreground text-sm select-none">Draw your signature here</p>
          </div>
        )}
      </div>
      <Button type="button" variant="ghost" size="sm" onClick={clear} className="text-muted-foreground">
        <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Clear signature
      </Button>
    </div>
  );
}

// ─── CoC Content ─────────────────────────────────────────────────────────────

const COC_SECTIONS = [
  {
    title: "Purpose Statement",
    content: `The SONSIEL Mentorship Program is committed to fostering a professional, respectful, and productive environment where nursing professionals can grow, innovate, and lead. This Code of Conduct establishes the standards of behavior expected of all program participants to ensure positive mentoring experiences.

By participating in the SONSIEL Mentorship Program, all mentors and mentees agree to uphold these standards and contribute to a culture of mutual respect, integrity, and professional excellence.`,
  },
  {
    title: "Core Values",
    content: `All participants are expected to embody and uphold these core values:`,
    bullets: [
      "Integrity: Acting with honesty, transparency, and ethical behavior in all interactions",
      "Respect: Treating all individuals with dignity, courtesy, and professional regard",
      "Excellence: Striving for the highest standards in mentoring practice and professional conduct",
      "Accountability: Taking responsibility for commitments, actions, and their impact on others",
      "Inclusivity: Creating welcoming environments that value diverse perspectives and backgrounds",
      "Confidentiality: Protecting sensitive information shared within the mentoring relationship",
    ],
  },
  {
    title: "Professional Behavior Expectations",
    content: `All program participants are expected to:`,
    bullets: [
      "Demonstrate professionalism in all communications and interactions",
      "Honor commitments and fulfill agreed-upon responsibilities",
      "Approach the mentoring relationship with genuine investment in mutual growth",
      "Maintain appropriate boundaries between professional mentoring and personal relationships",
      "Represent themselves and their qualifications honestly and accurately",
      "Engage respectfully with diverse viewpoints, experiences, and backgrounds",
    ],
    subsections: [
      {
        title: "Meeting and Session Conduct",
        bullets: [
          "Arrive on time for scheduled meetings, whether virtual or in-person",
          "Come prepared with relevant materials, questions, or topics for discussion",
          "Give full attention during meetings by minimizing distractions",
          "Provide adequate notice (minimum 24–48 hours) if rescheduling is necessary",
          "Maintain a professional environment for virtual meetings",
        ],
      },
    ],
  },
  {
    title: "Communication Standards",
    content: `Timely communication is essential for maintaining productive mentoring relationships:`,
    table: [
      ["Meeting Requests", "Within 48 hours", "Acknowledge and propose times"],
      ["General Emails", "Within 48–72 hours", "Acknowledge receipt promptly"],
      ["Urgent Matters", "Within 24 hours", "Mark clearly as urgent"],
      ["Cancellations", "24–48 hours advance", "Include reschedule options"],
    ],
    after: `For preferred communication channels, discuss and agree upon methods with your mentoring partner during your first meeting. Primary channels: Email (scheduling, documents, formal communications), Video Calls (mentoring sessions), Phone/Text (urgent matters, if mutually agreed).`,
  },
  {
    title: "Confidentiality Agreement",
    content: `All participants agree to maintain confidentiality regarding:`,
    bullets: [
      "All discussions, ideas, and information shared during mentoring sessions",
      "Personal and professional information disclosed by either party",
      "Intellectual property, innovative ideas, and business concepts shared by mentees",
      "Proprietary information related to either party's organization or employer",
      "Research data, unpublished work, and grant applications",
      "Career challenges, workplace issues, and personal circumstances discussed in confidence",
    ],
    subsections: [
      {
        title: "Confidentiality Obligations",
        bullets: [
          "Not disclosing confidential information to third parties without explicit written permission",
          "Not using confidential information for personal gain or competitive advantage",
          "Storing and handling shared documents and materials securely",
          "Maintaining confidentiality obligations even after the mentoring relationship ends",
        ],
      },
      {
        title: "Exceptions to Confidentiality",
        bullets: [
          "When required by law or legal proceedings",
          "When there is imminent risk of harm to the individual or others",
          "When mandatory reporting requirements apply",
          "When explicit written consent has been obtained from the disclosing party",
        ],
      },
    ],
  },
  {
    title: "Conflict Resolution Procedures",
    content: `Even in healthy mentoring relationships, disagreements or challenges may arise.`,
    subsections: [
      {
        title: "Step 1: Direct Communication",
        bullets: [
          "Request a dedicated conversation to discuss the concern",
          'Use "I" statements to express your perspective without blame',
          "Listen actively to understand your partner's perspective",
          "Work together to identify solutions and next steps",
        ],
      },
      {
        title: "Step 2: Program Coordinator Support",
        bullets: [
          "Contact the SONSIEL Mentorship Program Coordinator",
          "The coordinator will schedule individual conversations with both parties",
          "A facilitated discussion may be arranged if appropriate",
        ],
      },
      {
        title: "Step 3: Formal Review",
        bullets: [
          "The matter will be escalated to the SONSIEL Education & Mentorship Committee",
          "A formal review of the situation will be conducted",
          "Both parties will have the opportunity to present their perspective",
          "The committee will make recommendations, which may include re-matching, mediation, or program separation",
        ],
      },
    ],
  },
  {
    title: "Prohibited Conduct",
    content: `The following behaviors are strictly prohibited and may result in immediate removal from the program:`,
    bullets: [
      "Harassment: Any unwelcome conduct based on protected characteristics",
      "Discrimination: Treating individuals unfavorably or creating a hostile environment",
      "Sexual Misconduct: Any unwanted sexual attention, advances, or inappropriate comments",
      "Bullying/Intimidation: Aggressive behavior or actions intended to intimidate or humiliate",
      "Intellectual Property Theft: Using or sharing mentee ideas without permission",
      "Breach of Confidentiality: Unauthorized disclosure of confidential information",
      "Misrepresentation: Providing false information about qualifications or experience",
      "Exploitation: Using the mentoring relationship for personal gain or solicitation",
    ],
    after: `Violations may result in: verbal or written warning, required corrective actions, suspension from the mentorship program, permanent removal, or referral to SONSIEL leadership.`,
  },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CocSigningPage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const scrollRef = useRef<HTMLDivElement>(null);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [firstName, setFirstName] = useState(user?.firstName ?? "");
  const [lastName, setLastName] = useState(user?.lastName ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const today = format(new Date(), "MM/dd/yyyy");

  // Detect scroll-to-bottom
  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 40;
    if (atBottom) setHasScrolledToBottom(true);
  }, []);

  const submitMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/onboarding/coc", {
        firstName,
        lastName,
        email,
        signatureData,
        version: "2026",
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({ title: "Code of Conduct signed", description: "Welcome to the SONSIEL Mentorship Program." });
      navigate("/");
    },
    onError: () => {
      toast({ title: "Submission failed", description: "Please try again.", variant: "destructive" });
    },
  });

  const canSubmit = hasScrolledToBottom && !!signatureData && firstName.trim() && lastName.trim() && email.trim();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <div>
            <h1 className="font-semibold text-sm">Code of Conduct &amp; Professionalism Guidelines</h1>
            <p className="text-xs text-muted-foreground">SONSIEL Mentorship Program · 2026 Cohort</p>
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-3xl mx-auto w-full px-4 py-8 space-y-8">

        {/* Scroll-to-read instruction */}
        {!hasScrolledToBottom && (
          <div className="flex items-center gap-2.5 px-4 py-3 rounded-lg bg-warning/10 border border-warning/20 text-warning text-sm">
            <span className="text-base">↓</span>
            <span>Please read the full document before signing. Scroll to the bottom to unlock the signature form.</span>
          </div>
        )}

        {/* CoC Document */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="rounded-xl border bg-card p-6 md:p-8 space-y-8 max-h-[60vh] overflow-y-auto text-sm leading-relaxed"
        >
          <div className="text-center space-y-1 pb-4 border-b">
            <h2 className="text-xl font-bold">Code of Conduct &amp; Professionalism Guidelines</h2>
            <p className="text-muted-foreground">SONSIEL Mentorship Program</p>
            <p className="text-muted-foreground text-xs">Standards for Excellence in Professional Mentoring · 2026 Cohort</p>
          </div>

          {COC_SECTIONS.map((section) => (
            <div key={section.title} className="space-y-3">
              <h3 className="font-semibold text-base">{section.title}</h3>
              {section.content && <p className="text-muted-foreground">{section.content}</p>}
              {section.bullets && (
                <ul className="space-y-1.5 list-disc list-inside text-muted-foreground">
                  {section.bullets.map((b) => <li key={b}>{b}</li>)}
                </ul>
              )}
              {section.table && (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 pr-4 font-medium">Type</th>
                        <th className="text-left py-2 pr-4 font-medium">Response Time</th>
                        <th className="text-left py-2 font-medium">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {section.table.map(([type, time, action]) => (
                        <tr key={type} className="border-b last:border-0">
                          <td className="py-2 pr-4 text-muted-foreground">{type}</td>
                          <td className="py-2 pr-4 text-muted-foreground">{time}</td>
                          <td className="py-2 text-muted-foreground">{action}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {section.after && <p className="text-muted-foreground text-xs">{section.after}</p>}
              {section.subsections?.map((sub) => (
                <div key={sub.title} className="pl-4 border-l space-y-2">
                  <p className="font-medium text-sm">{sub.title}</p>
                  <ul className="space-y-1 list-disc list-inside text-muted-foreground text-xs">
                    {sub.bullets.map((b) => <li key={b}>{b}</li>)}
                  </ul>
                </div>
              ))}
            </div>
          ))}

          {/* Bottom anchor */}
          <div className="text-center pt-4 border-t text-muted-foreground text-xs">
            — End of Code of Conduct —
          </div>
        </div>

        {/* Signature Form */}
        <div className={`space-y-6 rounded-xl border bg-card p-6 md:p-8 transition-opacity duration-300 ${!hasScrolledToBottom ? "opacity-40 pointer-events-none select-none" : ""}`}>
          <div>
            <h2 className="font-semibold text-base flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-primary" />
              Acknowledgment and Agreement
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              By signing below, you acknowledge that you have read, understood, and agree to abide by this Code of Conduct and Professionalism Guidelines.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="coc-first-name">First Name <span className="text-destructive">*</span></Label>
              <Input
                id="coc-first-name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="First name"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="coc-last-name">Last Name <span className="text-destructive">*</span></Label>
              <Input
                id="coc-last-name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Last name"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="coc-email">Email <span className="text-destructive">*</span></Label>
            <Input
              id="coc-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Signature <span className="text-destructive">*</span></Label>
            <SignaturePad
              onSign={(data) => setSignatureData(data)}
              onClear={() => setSignatureData(null)}
              hasSignature={!!signatureData}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Date</Label>
            <Input value={today} readOnly className="bg-muted/50 cursor-not-allowed" />
          </div>

          {!hasScrolledToBottom && (
            <p className="text-xs text-muted-foreground text-center">Scroll to the bottom of the document above to unlock this form.</p>
          )}

          <Button
            className="w-full"
            size="lg"
            disabled={!canSubmit || submitMutation.isPending}
            onClick={() => submitMutation.mutate()}
          >
            {submitMutation.isPending ? (
              <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Submitting…</>
            ) : (
              <><CheckCircle className="h-4 w-4 mr-2" /> I Agree &amp; Sign</>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
