"use client";

import { useState, useTransition, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { 
  CheckCircle2, 
  ChevronLeft, 
  Loader2, 
  Database, 
  Key, 
  Mail, 
  CreditCard,
  AlertCircle,
  Rocket,
  RefreshCw,
  Trash2,
  FileText
} from "lucide-react";
import { 
  saveConfiguration, 
  runDatabaseMigrations, 
  getCleanupFiles,
  cleanupSetupFiles,
  startSetupLog,
  writeSetupLog
} from "@/lib/setup/actions";
import type { SetupFormData } from "@/lib/setup/types";

interface CompleteStepProps {
  formData: SetupFormData;
  onPrev: () => void;
}

type SetupPhase = "review" | "saving" | "migrating" | "cleaning" | "logging" | "complete" | "error";

export function CompleteStep({ formData, onPrev }: CompleteStepProps) {
  const [phase, setPhase] = useState<SetupPhase>("review");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [shouldCleanup, setShouldCleanup] = useState(false);
  const [cleanupFiles, setCleanupFiles] = useState<string[]>([]);
  const [removedFiles, setRemovedFiles] = useState<string[]>([]);
  const [logPath, setLogPath] = useState<string | null>(null);

  useEffect(() => {
    // Get list of cleanup files on mount
    getCleanupFiles().then((result) => {
      if (result.success && result.data) {
        setCleanupFiles(result.data.files);
      }
    });
  }, []);

  const configSummary = [
    {
      icon: Database,
      label: "Database",
      configured: !!formData.database.DATABASE_URL,
      color: "text-blue-500",
    },
    {
      icon: Key,
      label: "Authentication",
      configured: !!formData.auth.BETTER_AUTH_SECRET,
      color: "text-purple-500",
    },
    {
      icon: Mail,
      label: "Email",
      configured: !!formData.email.RESEND_API_KEY,
      color: "text-orange-500",
    },
    {
      icon: CreditCard,
      label: "Payments",
      configured: !!formData.payments.POLAR_ACCESS_TOKEN,
      color: "text-green-500",
    },
  ];

  const handleComplete = () => {
    setError(null);
    startTransition(async () => {
      // Start logging
      await startSetupLog();

      // Phase 1: Save configuration
      setPhase("saving");
      const saveResult = await saveConfiguration(formData);
      if (!saveResult.success) {
        setError(saveResult.error || "Failed to save configuration");
        setPhase("error");
        return;
      }

      // Phase 2: Run migrations
      setPhase("migrating");
      const migrateResult = await runDatabaseMigrations();
      const migrationsSuccess = migrateResult.success;
      const migrationsError = migrateResult.error;

      // Phase 3: Cleanup (if requested)
      let cleanupPerformed = false;
      let cleanedFiles: string[] = [];
      if (shouldCleanup && cleanupFiles.length > 0) {
        setPhase("cleaning");
        const cleanupResult = await cleanupSetupFiles();
        if (cleanupResult.success && cleanupResult.data) {
          cleanupPerformed = true;
          cleanedFiles = cleanupResult.data.removedFiles;
          setRemovedFiles(cleanedFiles);
        }
      }

      // Phase 4: Write log
      setPhase("logging");
      let dbHost: string | undefined;
      try {
        dbHost = new URL(formData.database.DATABASE_URL).host;
      } catch {
        dbHost = undefined;
      }

      const logResult = await writeSetupLog({
        database: {
          configured: !!formData.database.DATABASE_URL,
          host: dbHost,
        },
        auth: {
          configured: !!formData.auth.BETTER_AUTH_SECRET,
          url: formData.auth.BETTER_AUTH_URL,
        },
        email: { configured: !!formData.email.RESEND_API_KEY },
        payments: {
          configured: !!formData.payments.POLAR_ACCESS_TOKEN,
          server: formData.payments.POLAR_SERVER,
        },
        migrations: {
          success: migrationsSuccess,
          error: migrationsError,
        },
        cleanup: {
          performed: cleanupPerformed,
          files: cleanedFiles,
        },
      });

      if (logResult.success && logResult.data) {
        setLogPath(logResult.data.path);
      }

      // Complete (even if migrations failed, we want to show the result)
      if (!migrationsSuccess) {
        setError(migrationsError || "Database migrations failed");
      }
      setPhase("complete");
    });
  };

  if (phase === "complete") {
    return (
      <div className="space-y-8">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-green-500/20 to-green-500/5 border border-green-500/20">
            <CheckCircle2 className="w-10 h-10 text-green-500" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight">Setup Complete!</h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Your development environment is ready. Restart the development server
            to apply the new configuration.
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Warning</AlertTitle>
            <AlertDescription>
              {error}. You may need to run migrations manually.
            </AlertDescription>
          </Alert>
        )}

        <Alert className="border-green-500/20 bg-green-500/5">
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          <AlertTitle>Configuration saved to .env.local</AlertTitle>
          <AlertDescription>
            {!error && "Database migrations have been applied successfully."}
          </AlertDescription>
        </Alert>

        {logPath && (
          <Alert className="border-blue-500/20 bg-blue-500/5">
            <FileText className="h-4 w-4 text-blue-500" />
            <AlertTitle>Setup Log Created</AlertTitle>
            <AlertDescription>
              A detailed log has been saved to <code className="text-xs bg-muted px-1 rounded">setup.log</code>
            </AlertDescription>
          </Alert>
        )}

        {removedFiles.length > 0 && (
          <Alert className="border-orange-500/20 bg-orange-500/5">
            <Trash2 className="h-4 w-4 text-orange-500" />
            <AlertTitle>Cleanup Completed</AlertTitle>
            <AlertDescription>
              Removed {removedFiles.length} setup files/directories
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Next Steps</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-muted p-4 font-mono text-sm">
              <p className="text-muted-foreground"># Restart the dev server:</p>
              <p className="text-foreground">npm run dev</p>
            </div>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                Configuration saved to <code className="text-xs bg-muted px-1 rounded">.env.local</code>
              </li>
              <li className="flex items-center gap-2">
                {error ? (
                  <AlertCircle className="w-4 h-4 text-destructive" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                )}
                Database schema {error ? "needs manual setup" : "pushed via Prisma"}
              </li>
              {logPath && (
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  Setup log saved to <code className="text-xs bg-muted px-1 rounded">setup.log</code>
                </li>
              )}
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                Ready to start building!
              </li>
            </ul>
          </CardContent>
        </Card>

        <div className="flex justify-center pt-4">
          <Button
            size="lg"
            onClick={() => window.location.href = "/"}
            className="gap-2 px-8"
          >
            <Rocket className="w-4 h-4" />
            Go to Home
          </Button>
        </div>
      </div>
    );
  }

  if (phase === "error" && !isPending) {
    return (
      <div className="space-y-8">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-destructive/20 to-destructive/5 border border-destructive/20">
            <AlertCircle className="w-10 h-10 text-destructive" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight">Setup Failed</h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Something went wrong during setup. Please check the error below and try again.
          </p>
        </div>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>

        <div className="flex justify-between pt-4">
          <Button variant="ghost" onClick={onPrev}>
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button onClick={() => setPhase("review")}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20">
          <Rocket className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-3xl font-bold tracking-tight">Ready to Complete Setup</h2>
        <p className="text-muted-foreground max-w-lg mx-auto">
          Review your configuration below. Once you're ready, we'll save the
          configuration and set up your database.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configuration Summary</CardTitle>
          <CardDescription>
            The following services will be configured
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            {configSummary.map((item) => (
              <div
                key={item.label}
                className={`flex items-center gap-3 p-4 rounded-lg ${
                  item.configured
                    ? "bg-muted/50"
                    : "bg-muted/20 border border-dashed"
                }`}
              >
                <div className={`p-2 rounded-md ${item.configured ? "bg-primary/10" : "bg-muted"}`}>
                  <item.icon className={`w-5 h-5 ${item.configured ? item.color : "text-muted-foreground"}`} />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium">{item.label}</h3>
                  <p className="text-xs text-muted-foreground">
                    {item.configured ? "Configured" : "Skipped"}
                  </p>
                </div>
                {item.configured && (
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {cleanupFiles.length > 0 && (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Trash2 className="w-4 h-4" />
              Cleanup Setup Files
            </CardTitle>
            <CardDescription>
              Once setup is complete, you can remove the setup wizard files
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <Checkbox
                id="cleanup"
                checked={shouldCleanup}
                onCheckedChange={(checked) => setShouldCleanup(checked === true)}
              />
              <div className="space-y-1">
                <Label htmlFor="cleanup" className="cursor-pointer">
                  Remove setup files after completion
                </Label>
                <p className="text-xs text-muted-foreground">
                  This will remove the following:
                </p>
                <ul className="text-xs text-muted-foreground list-disc list-inside">
                  {cleanupFiles.map((file) => (
                    <li key={file}>{file}</li>
                  ))}
                  <li>Setup scripts from package.json</li>
                  <li>Setup redirect from proxy.ts</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {(phase !== "review") && (
        <Alert className="border-primary/20 bg-primary/5">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <AlertDescription className="ml-2">
            {phase === "saving" && "Saving configuration to .env.local..."}
            {phase === "migrating" && "Running database migrations..."}
            {phase === "cleaning" && "Cleaning up setup files..."}
            {phase === "logging" && "Writing setup log..."}
          </AlertDescription>
        </Alert>
      )}

      <div className="flex justify-between pt-4">
        <Button variant="ghost" onClick={onPrev} disabled={isPending}>
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button onClick={handleComplete} disabled={isPending} size="lg" className="gap-2">
          {isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Rocket className="w-4 h-4" />
          )}
          Complete Setup
        </Button>
      </div>
    </div>
  );
}
