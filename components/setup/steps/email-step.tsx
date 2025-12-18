"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mail, ChevronLeft, ChevronRight, ExternalLink, Info } from "lucide-react";
import type { EmailConfig } from "@/lib/setup/types";

interface EmailStepProps {
  data: EmailConfig;
  onUpdate: (data: Partial<EmailConfig>) => void;
  onNext: () => void;
  onPrev: () => void;
}

export function EmailStep({ data, onUpdate, onNext, onPrev }: EmailStepProps) {
  const [skipEmail, setSkipEmail] = useState(false);

  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500/20 to-orange-500/5 border border-orange-500/20">
          <Mail className="w-8 h-8 text-orange-500" />
        </div>
        <h2 className="text-3xl font-bold tracking-tight">Email Configuration</h2>
        <p className="text-muted-foreground max-w-lg mx-auto">
          Configure Resend for transactional emails like password resets,
          email verification, and team invitations.
        </p>
      </div>

      <Alert className="border-blue-500/20 bg-blue-500/5">
        <Info className="h-4 w-4 text-blue-500" />
        <AlertDescription className="ml-2">
          Email is optional for initial development. You can skip this step and
          configure it later. Emails will be logged to the console in development.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Resend API Key</CardTitle>
          <CardDescription>
            Get your API key from{" "}
            <a
              href="https://resend.com/api-keys"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline inline-flex items-center gap-1"
            >
              Resend Dashboard
              <ExternalLink className="w-3 h-3" />
            </a>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="resend-api-key">API Key</Label>
            <Input
              id="resend-api-key"
              type="password"
              placeholder="re_..."
              value={data.RESEND_API_KEY}
              onChange={(e) => onUpdate({ RESEND_API_KEY: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              Your Resend API key starts with "re_"
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="skip-email"
              checked={skipEmail}
              onChange={(e) => setSkipEmail(e.target.checked)}
              className="rounded border-input"
            />
            <Label htmlFor="skip-email" className="text-sm font-normal cursor-pointer">
              Skip email configuration for now
            </Label>
          </div>
        </CardContent>
      </Card>

      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="text-base">Quick Setup with Resend</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <ol className="list-decimal list-inside space-y-2">
            <li>
              Create a free account at{" "}
              <a
                href="https://resend.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                resend.com
              </a>
            </li>
            <li>Verify your domain or use their test domain</li>
            <li>Generate an API key and paste it above</li>
          </ol>
          <p className="text-xs mt-4">
            Free tier includes 3,000 emails/month — perfect for development!
          </p>
        </CardContent>
      </Card>

      <div className="flex justify-between pt-4">
        <Button variant="ghost" onClick={onPrev}>
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button onClick={onNext}>
          {skipEmail && !data.RESEND_API_KEY ? "Skip for now" : "Continue"}
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}

