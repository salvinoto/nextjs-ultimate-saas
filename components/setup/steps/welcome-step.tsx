"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Database, Key, Mail, CreditCard, Rocket, CheckCircle2 } from "lucide-react";

interface WelcomeStepProps {
  onNext: () => void;
}

const features = [
  { icon: Database, label: "Database", description: "PostgreSQL with Prisma ORM" },
  { icon: Key, label: "Authentication", description: "Better Auth with 2FA support" },
  { icon: Mail, label: "Email", description: "Transactional emails with Resend" },
  { icon: CreditCard, label: "Payments", description: "Subscriptions with Polar" },
];

export function WelcomeStep({ onNext }: WelcomeStepProps) {
  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20">
          <Rocket className="w-10 h-10 text-primary" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight">
          Welcome to Next.js Ultimate SaaS
        </h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto">
          Let's get your development environment set up. This wizard will guide you
          through configuring the essential services for your SaaS application.
        </p>
      </div>

      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="text-lg">What we'll configure</CardTitle>
          <CardDescription>
            Each service is essential for the full SaaS experience
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            {features.map((feature) => (
              <div
                key={feature.label}
                className="flex items-start gap-3 p-4 rounded-lg bg-muted/50"
              >
                <div className="p-2 rounded-md bg-primary/10">
                  <feature.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">{feature.label}</h3>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
            Before you begin
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>Make sure you have the following ready:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>A PostgreSQL database (local or cloud like Supabase, Neon)</li>
            <li>A Polar account for payments (optional for initial setup)</li>
            <li>A Resend account for emails (optional for initial setup)</li>
          </ul>
        </CardContent>
      </Card>

      <div className="flex justify-center pt-4">
        <Button size="lg" onClick={onNext} className="gap-2 px-8">
          Get Started
          <Rocket className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

