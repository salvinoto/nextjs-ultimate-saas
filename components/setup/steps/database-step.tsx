"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Database, ChevronLeft, ChevronRight, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { testDatabaseConnection } from "@/lib/setup/actions";
import { validateDatabaseUrl } from "@/lib/setup/validation";
import type { DatabaseConfig } from "@/lib/setup/types";

interface DatabaseStepProps {
  data: DatabaseConfig;
  onUpdate: (data: Partial<DatabaseConfig>) => void;
  onNext: () => void;
  onPrev: () => void;
}

export function DatabaseStep({ data, onUpdate, onNext, onPrev }: DatabaseStepProps) {
  const [isPending, startTransition] = useTransition();
  const [connectionStatus, setConnectionStatus] = useState<{
    tested: boolean;
    success: boolean;
    message: string;
  } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleTestConnection = () => {
    const validation = validateDatabaseUrl(data.DATABASE_URL);
    if (!validation.valid) {
      setErrors({ DATABASE_URL: validation.error! });
      return;
    }

    setErrors({});
    startTransition(async () => {
      const result = await testDatabaseConnection(data.DATABASE_URL);
      setConnectionStatus({
        tested: true,
        success: result.success,
        message: result.success
          ? `Connected! ${result.data?.version.split(" ").slice(0, 2).join(" ")}`
          : result.error || "Connection failed",
      });
    });
  };

  const handleNext = () => {
    const validation = validateDatabaseUrl(data.DATABASE_URL);
    if (!validation.valid) {
      setErrors({ DATABASE_URL: validation.error! });
      return;
    }
    setErrors({});
    onNext();
  };

  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-500/5 border border-blue-500/20">
          <Database className="w-8 h-8 text-blue-500" />
        </div>
        <h2 className="text-3xl font-bold tracking-tight">Database Configuration</h2>
        <p className="text-muted-foreground max-w-lg mx-auto">
          Connect to your PostgreSQL database. You can use a local database or a
          cloud provider like Supabase, Neon, or Railway.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Connection Details</CardTitle>
          <CardDescription>
            Enter your PostgreSQL connection string
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="database-url">
              Database URL <span className="text-destructive">*</span>
            </Label>
            <Input
              id="database-url"
              type="password"
              placeholder="postgresql://user:password@localhost:5432/dbname"
              value={data.DATABASE_URL}
              onChange={(e) => {
                onUpdate({ DATABASE_URL: e.target.value });
                setConnectionStatus(null);
                setErrors({});
              }}
              aria-invalid={!!errors.DATABASE_URL}
            />
            {errors.DATABASE_URL && (
              <p className="text-sm text-destructive">{errors.DATABASE_URL}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Format: postgresql://user:password@host:port/database
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="direct-url">Direct URL (Optional)</Label>
            <Input
              id="direct-url"
              type="password"
              placeholder="Same as above if not using connection pooling"
              value={data.DIRECT_URL || ""}
              onChange={(e) => onUpdate({ DIRECT_URL: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              Required if using connection pooling (e.g., Supabase Transaction mode)
            </p>
          </div>

          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={handleTestConnection}
              disabled={isPending || !data.DATABASE_URL}
            >
              {isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Test Connection
            </Button>

            {connectionStatus?.tested && (
              <Alert
                variant={connectionStatus.success ? "default" : "destructive"}
                className="flex-1 py-2"
              >
                {connectionStatus.success ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4" />
                )}
                <AlertDescription className="ml-2">
                  {connectionStatus.message}
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between pt-4">
        <Button variant="ghost" onClick={onPrev}>
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button onClick={handleNext} disabled={!data.DATABASE_URL}>
          Continue
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}

