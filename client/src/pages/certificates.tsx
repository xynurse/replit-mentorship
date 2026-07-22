import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Award, Download, ExternalLink, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";

interface Certificate {
  id: string;
  userId: string;
  cohortId: string | null;
  certificateNumber: string;
  status: "PENDING" | "GENERATED" | "DELIVERED" | "REVOKED";
  templateData: Record<string, unknown> | null;
  pdfUrl: string | null;
  verificationUrl: string | null;
  issuedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
}

const statusConfig = {
  PENDING: { label: "Pending", icon: Clock, variant: "secondary" as const, color: "text-muted-foreground" },
  GENERATED: { label: "Generated", icon: CheckCircle, variant: "default" as const, color: "text-primary" },
  DELIVERED: { label: "Delivered", icon: CheckCircle, variant: "default" as const, color: "text-success" },
  REVOKED: { label: "Revoked", icon: XCircle, variant: "destructive" as const, color: "text-destructive" },
};

export default function CertificatesPage() {
  const { data: certificates = [], isLoading } = useQuery<Certificate[]>({
    queryKey: ["/api/certificates"],
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="p-6 space-y-6">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-md" />
            <div>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-64 mt-1" />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-64" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
      <PageHeader
        title="My Certificates"
        description="View and download your earned certificates"
        titleTestId="text-page-title"
      />

      {certificates.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState
              icon={Award}
              title="No certificates yet"
              description="You haven't earned any certificates yet. Complete your mentorship program to earn your certificate."
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {certificates.map((cert) => {
            const config = statusConfig[cert.status];
            const StatusIcon = config.icon;
            const isExpired = cert.expiresAt && new Date(cert.expiresAt) < new Date();

            return (
              <Card key={cert.id} className="relative overflow-visible" data-testid={`card-certificate-${cert.id}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg leading-tight">
                      SONSIEL Mentorship Certificate
                    </CardTitle>
                    <Badge variant={isExpired ? "destructive" : config.variant} className="shrink-0">
                      {isExpired ? "Expired" : config.label}
                    </Badge>
                  </div>
                  <CardDescription className="font-mono text-xs">
                    {cert.certificateNumber}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2 text-sm">
                    {cert.issuedAt && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <CheckCircle className="h-4 w-4" />
                        <span>Issued: {format(new Date(cert.issuedAt), "MMM d, yyyy")}</span>
                      </div>
                    )}
                    {cert.expiresAt && (
                      <div className={`flex items-center gap-2 ${isExpired ? "text-destructive" : "text-muted-foreground"}`}>
                        {isExpired ? <AlertCircle className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                        <span>{isExpired ? "Expired" : "Expires"}: {format(new Date(cert.expiresAt), "MMM d, yyyy")}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 pt-2">
                    {cert.pdfUrl && cert.status !== "REVOKED" && (
                      <Button
                        variant="default"
                        size="sm"
                        className="flex-1"
                        data-testid={`button-download-${cert.id}`}
                        onClick={() => window.open(cert.pdfUrl!, "_blank")}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                    )}
                    {cert.verificationUrl && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        data-testid={`button-verify-${cert.id}`}
                        onClick={() => window.open(cert.verificationUrl!, "_blank")}
                      >
                        <ExternalLink className="h-4 w-4 mr-1" />
                        Verify
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
      </div>
    </DashboardLayout>
  );
}
