"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CreditCard, ChevronLeft, ChevronRight, ExternalLink, Info } from "lucide-react";
import type { PaymentsConfig } from "@/lib/setup/types";

interface PaymentsStepProps {
  data: PaymentsConfig;
  onUpdate: (data: Partial<PaymentsConfig>) => void;
  onNext: () => void;
  onPrev: () => void;
}

export function PaymentsStep({ data, onUpdate, onNext, onPrev }: PaymentsStepProps) {
  const [skipPayments, setSkipPayments] = useState(false);

  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500/20 to-green-500/5 border border-green-500/20">
          <CreditCard className="w-8 h-8 text-green-500" />
        </div>
        <h2 className="text-3xl font-bold tracking-tight">Payments Setup</h2>
        <p className="text-muted-foreground max-w-lg mx-auto">
          Configure Polar for subscription management and usage-based billing
          with built-in metering support.
        </p>
      </div>

      <Alert className="border-blue-500/20 bg-blue-500/5">
        <Info className="h-4 w-4 text-blue-500" />
        <AlertDescription className="ml-2">
          Payments are optional for initial development. You can skip this step
          and configure it later when you're ready to monetize.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Polar Configuration</CardTitle>
          <CardDescription>
            Get your credentials from{" "}
            <a
              href="https://polar.sh/settings"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline inline-flex items-center gap-1"
            >
              Polar Settings
              <ExternalLink className="w-3 h-3" />
            </a>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Environment</Label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="polar-server"
                  value="sandbox"
                  checked={data.POLAR_SERVER === "sandbox"}
                  onChange={() => onUpdate({ POLAR_SERVER: "sandbox" })}
                  className="rounded-full"
                />
                <span className="text-sm">Sandbox (Testing)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="polar-server"
                  value="production"
                  checked={data.POLAR_SERVER === "production"}
                  onChange={() => onUpdate({ POLAR_SERVER: "production" })}
                  className="rounded-full"
                />
                <span className="text-sm">Production</span>
              </label>
            </div>
            <p className="text-xs text-muted-foreground">
              Use Sandbox for testing, Production for real payments
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="polar-token">Access Token</Label>
            <Input
              id="polar-token"
              type="password"
              placeholder="polar_..."
              value={data.POLAR_ACCESS_TOKEN}
              onChange={(e) => onUpdate({ POLAR_ACCESS_TOKEN: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              Your Polar API access token
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="polar-org">Organization ID</Label>
            <Input
              id="polar-org"
              type="text"
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              value={data.POLAR_ORGANIZATION_ID}
              onChange={(e) => onUpdate({ POLAR_ORGANIZATION_ID: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              Found in your Polar organization settings
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="polar-webhook">Webhook Secret (Optional)</Label>
            <Input
              id="polar-webhook"
              type="password"
              placeholder="whsec_..."
              value={data.POLAR_WEBHOOK_SECRET || ""}
              onChange={(e) => onUpdate({ POLAR_WEBHOOK_SECRET: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              Used to verify webhook payloads (configure in Polar dashboard)
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="skip-payments"
              checked={skipPayments}
              onChange={(e) => setSkipPayments(e.target.checked)}
              className="rounded border-input"
            />
            <Label htmlFor="skip-payments" className="text-sm font-normal cursor-pointer">
              Skip payments configuration for now
            </Label>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between pt-4">
        <Button variant="ghost" onClick={onPrev}>
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button onClick={onNext}>
          {skipPayments && !data.POLAR_ACCESS_TOKEN ? "Skip for now" : "Continue"}
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}

