import { AdminLayout } from "@/components/layouts/admin-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Settings, Bell, Shield, Database, Mail } from "lucide-react";

export default function AdminSettings() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="text-page-title">Settings</h1>
          <p className="text-muted-foreground">Manage platform settings and configurations</p>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-muted-foreground" />
                <CardTitle>General Settings</CardTitle>
              </div>
              <CardDescription>Configure general platform settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="platform-name">Platform Name</Label>
                <Input id="platform-name" defaultValue="SONSIEL Mentorship Hub" data-testid="input-platform-name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="support-email">Support Email</Label>
                <Input id="support-email" type="email" placeholder="support@example.com" data-testid="input-support-email" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-muted-foreground" />
                <CardTitle>Notification Settings</CardTitle>
              </div>
              <CardDescription>Configure platform-wide notification preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">Send email notifications to users</p>
                </div>
                <Switch defaultChecked data-testid="switch-email-notifications" />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Welcome Emails</Label>
                  <p className="text-sm text-muted-foreground">Automatically send welcome emails to new users</p>
                </div>
                <Switch data-testid="switch-welcome-emails" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-muted-foreground" />
                <CardTitle>Security Settings</CardTitle>
              </div>
              <CardDescription>Configure security and access controls</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Require Email Verification</Label>
                  <p className="text-sm text-muted-foreground">Users must verify their email before accessing the platform</p>
                </div>
                <Switch defaultChecked data-testid="switch-email-verification" />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Account Lockout</Label>
                  <p className="text-sm text-muted-foreground">Lock accounts after multiple failed login attempts</p>
                </div>
                <Switch defaultChecked data-testid="switch-account-lockout" />
              </div>
              <Separator />
              <div className="space-y-2">
                <Label htmlFor="session-timeout">Session Timeout (minutes)</Label>
                <Input id="session-timeout" type="number" defaultValue="60" className="w-32" data-testid="input-session-timeout" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5 text-muted-foreground" />
                <CardTitle>Data Management</CardTitle>
              </div>
              <CardDescription>Manage platform data and backups</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Database Status</Label>
                  <p className="text-sm text-muted-foreground">PostgreSQL database is connected and operational</p>
                </div>
                <span className="text-sm font-medium text-green-600 dark:text-green-400">Connected</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <CardTitle>Email Configuration</CardTitle>
              </div>
              <CardDescription>Configure email service settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Email Provider</Label>
                  <p className="text-sm text-muted-foreground">Resend</p>
                </div>
                <span className="text-sm font-medium text-green-600 dark:text-green-400">Configured</span>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label htmlFor="from-email">From Email Address</Label>
                <Input id="from-email" type="email" defaultValue="noreply@sonsiel.org" data-testid="input-from-email" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end">
          <Button data-testid="button-save-settings">Save Settings</Button>
        </div>
      </div>
    </AdminLayout>
  );
}
