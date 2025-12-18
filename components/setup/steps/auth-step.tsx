"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Key, ChevronLeft, ChevronRight, RefreshCw, Loader2, Eye, EyeOff } from "lucide-react";
import { generateAuthSecret } from "@/lib/setup/actions";
import { validateUrl, validateEmail } from "@/lib/setup/validation";
import type { AuthConfig } from "@/lib/setup/types";

interface AuthStepProps {
  data: AuthConfig;
  onUpdate: (data: Partial<AuthConfig>) => void;
  onNext: () => void;
  onPrev: () => void;
}

export function AuthStep({ data, onUpdate, onNext, onPrev }: AuthStepProps) {
  const [isPending, startTransition] = useTransition();
  const [showSecret, setShowSecret] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleGenerateSecret = () => {
    startTransition(async () => {
      const result = await generateAuthSecret();
      if (result.success && result.data) {
        onUpdate({ BETTER_AUTH_SECRET: result.data.secret });
      }
    });
  };

  const handleNext = () => {
    const newErrors: Record<string, string> = {};

    const urlValidation = validateUrl(data.BETTER_AUTH_URL);
    if (!urlValidation.valid) {
      newErrors.BETTER_AUTH_URL = urlValidation.error!;
    }

    const emailValidation = validateEmail(data.BETTER_AUTH_EMAIL);
    if (!emailValidation.valid) {
      newErrors.BETTER_AUTH_EMAIL = emailValidation.error!;
    }

    if (!data.BETTER_AUTH_SECRET) {
      newErrors.BETTER_AUTH_SECRET = "Auth secret is required";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    onNext();
  };

  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/20 to-purple-500/5 border border-purple-500/20">
          <Key className="w-8 h-8 text-purple-500" />
        </div>
        <h2 className="text-3xl font-bold tracking-tight">Authentication Setup</h2>
        <p className="text-muted-foreground max-w-lg mx-auto">
          Configure Better Auth for secure user authentication with support for
          email/password, 2FA, and social logins.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Auth Configuration</CardTitle>
          <CardDescription>
            Set up your authentication settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="auth-url">
              Application URL <span className="text-destructive">*</span>
            </Label>
            <Input
              id="auth-url"
              type="url"
              placeholder="http://localhost:3000"
              value={data.BETTER_AUTH_URL}
              onChange={(e) => {
                onUpdate({ BETTER_AUTH_URL: e.target.value });
                setErrors((prev) => ({ ...prev, BETTER_AUTH_URL: "" }));
              }}
              aria-invalid={!!errors.BETTER_AUTH_URL}
            />
            {errors.BETTER_AUTH_URL && (
              <p className="text-sm text-destructive">{errors.BETTER_AUTH_URL}</p>
            )}
            <p className="text-xs text-muted-foreground">
              The base URL of your application (used for callbacks)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="auth-secret">
              Auth Secret <span className="text-destructive">*</span>
            </Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="auth-secret"
                  type={showSecret ? "text" : "password"}
                  placeholder="Click generate to create a secure secret"
                  value={data.BETTER_AUTH_SECRET}
                  onChange={(e) => {
                    onUpdate({ BETTER_AUTH_SECRET: e.target.value });
                    setErrors((prev) => ({ ...prev, BETTER_AUTH_SECRET: "" }));
                  }}
                  aria-invalid={!!errors.BETTER_AUTH_SECRET}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full"
                  onClick={() => setShowSecret(!showSecret)}
                >
                  {showSecret ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </Button>
              </div>
              <Button
                variant="outline"
                onClick={handleGenerateSecret}
                disabled={isPending}
              >
                {isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                <span className="ml-2">Generate</span>
              </Button>
            </div>
            {errors.BETTER_AUTH_SECRET && (
              <p className="text-sm text-destructive">{errors.BETTER_AUTH_SECRET}</p>
            )}
            <p className="text-xs text-muted-foreground">
              A 64-character hex string used for signing tokens
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="auth-email">
              Sender Email <span className="text-destructive">*</span>
            </Label>
            <Input
              id="auth-email"
              type="email"
              placeholder="noreply@yourdomain.com"
              value={data.BETTER_AUTH_EMAIL}
              onChange={(e) => {
                onUpdate({ BETTER_AUTH_EMAIL: e.target.value });
                setErrors((prev) => ({ ...prev, BETTER_AUTH_EMAIL: "" }));
              }}
              aria-invalid={!!errors.BETTER_AUTH_EMAIL}
            />
            {errors.BETTER_AUTH_EMAIL && (
              <p className="text-sm text-destructive">{errors.BETTER_AUTH_EMAIL}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Email address used as the "from" field for auth emails
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between pt-4">
        <Button variant="ghost" onClick={onPrev}>
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button onClick={handleNext}>
          Continue
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}

