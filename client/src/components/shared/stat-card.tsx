import * as React from "react";
import { Link } from "wouter";
import { TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface StatCardProps {
  title: string;
  value: string;
  /** Small caption under the value (trend, hint, or context). */
  change?: string;
  icon: React.ReactNode;
  href?: string;
}

/**
 * Standard dashboard stat card (extracted from home.tsx): muted title,
 * large value, optional caption, sage icon chip. Always primary-toned —
 * stat cards don't get per-card colors.
 */
export function StatCard({ title, value, change, icon, href }: StatCardProps) {
  const body = (
    <Card className={href ? "hover-elevate cursor-pointer transition-shadow" : ""}>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-semibold mt-1">{value}</p>
            {change && (
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <TrendingUp className="h-3 w-3 text-primary" />
                {change}
              </p>
            )}
          </div>
          <div className="p-3 rounded-md bg-primary/10 text-primary">{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}
