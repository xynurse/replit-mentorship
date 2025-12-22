import { ReactNode } from "react";
import { Heart, Users, Award, BookOpen } from "lucide-react";

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary/90 via-primary to-primary/80 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-black/20 to-transparent" />
        
        <div className="relative z-10 flex flex-col justify-between p-12 text-primary-foreground">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-md bg-white/10 backdrop-blur-sm">
                <Heart className="h-8 w-8" />
              </div>
              <span className="text-2xl font-semibold tracking-tight">SONSIEL</span>
            </div>
            <p className="text-primary-foreground/80 text-sm">Mentorship Hub</p>
          </div>

          <div className="space-y-8">
            <div>
              <h1 className="text-4xl font-semibold leading-tight mb-4">
                Empowering Healthcare<br />Professionals Through<br />Mentorship
              </h1>
              <p className="text-lg text-primary-foreground/80 max-w-md leading-relaxed">
                Connect with experienced mentors, grow your career, and make a lasting impact in healthcare.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FeatureCard 
                icon={<Users className="h-5 w-5" />}
                title="Expert Mentors"
                description="Connect with experienced professionals"
              />
              <FeatureCard 
                icon={<Award className="h-5 w-5" />}
                title="Career Growth"
                description="Accelerate your professional journey"
              />
              <FeatureCard 
                icon={<BookOpen className="h-5 w-5" />}
                title="Structured Programs"
                description="Well-designed mentorship cohorts"
              />
              <FeatureCard 
                icon={<Heart className="h-5 w-5" />}
                title="Supportive Community"
                description="Join a network of healthcare leaders"
              />
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex -space-x-3">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-10 w-10 rounded-full bg-white/20 border-2 border-white/30 flex items-center justify-center text-sm font-medium"
                >
                  {String.fromCharCode(64 + i)}
                </div>
              ))}
            </div>
            <p className="text-sm text-primary-foreground/80">
              Join <span className="font-semibold text-primary-foreground">500+</span> healthcare professionals
            </p>
          </div>
        </div>

        <div className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full bg-white/5" />
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/5" />
        <div className="absolute top-1/2 -left-20 w-60 h-60 rounded-full bg-white/5" />
      </div>

      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="p-2 rounded-md bg-primary/10">
                <Heart className="h-6 w-6 text-primary" />
              </div>
              <span className="text-xl font-semibold">SONSIEL</span>
            </div>
            <p className="text-muted-foreground text-sm">Mentorship Hub</p>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground">{title}</h2>
            {subtitle && (
              <p className="mt-2 text-muted-foreground">{subtitle}</p>
            )}
          </div>

          {children}
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ 
  icon, 
  title, 
  description 
}: { 
  icon: ReactNode; 
  title: string; 
  description: string;
}) {
  return (
    <div className="p-4 rounded-md bg-white/10 backdrop-blur-sm">
      <div className="mb-2 text-primary-foreground/90">{icon}</div>
      <h3 className="font-medium text-sm mb-1">{title}</h3>
      <p className="text-xs text-primary-foreground/70">{description}</p>
    </div>
  );
}
