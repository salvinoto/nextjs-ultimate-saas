import { getAllUsage, type MeterSlug } from "@/lib/metering";
import { getCurrentCustomer } from "@/lib/payments";
import { UsageCard } from "@/components/usage/usage-card";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { redirect } from "next/navigation";
import { DemoActions } from "./demo-actions";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function DemoPage() {
  let customer;
  try {
    customer = await getCurrentCustomer();
  } catch {
    redirect("/sign-in");
  }

  const usage = await getAllUsage();
  const meterSlugs: MeterSlug[] = [
    "api_requests",
    "storage_gb",
    "ai_tokens",
    "team_seats",
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Metering Demo</h1>
        <p className="text-muted-foreground">
          Try out the metering system with these interactive examples
        </p>
      </div>

      {/* Current Usage */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Current Usage</CardTitle>
            <Badge variant="outline">
              Billing: {customer.billingEntityName}
            </Badge>
          </div>
          <CardDescription>
            Watch these meters update as you use the demo features below
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            {meterSlugs.map((slug) => (
              <UsageCard key={slug} meterSlug={slug} status={usage[slug]} />
            ))}
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Demo Actions */}
      <div className="grid gap-6 md:grid-cols-2">
        <DemoActions usage={usage} />
      </div>

      {/* How It Works */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">How Metering Works</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm dark:prose-invert max-w-none">
          <p className="text-muted-foreground">
            Each action above demonstrates a different aspect of the metering system:
          </p>
          <ol className="space-y-2 text-sm text-muted-foreground mt-4">
            <li>
              <strong>Check Limit:</strong> Before performing an action, we call{" "}
              <code className="bg-muted px-1 rounded">checkCurrentLimit()</code>{" "}
              to verify the user has remaining quota.
            </li>
            <li>
              <strong>Perform Action:</strong> If the limit check passes, we
              execute the actual operation.
            </li>
            <li>
              <strong>Track Usage:</strong> After success, we call{" "}
              <code className="bg-muted px-1 rounded">trackApiRequest()</code>,{" "}
              <code className="bg-muted px-1 rounded">trackAiTokens()</code>, etc.
              to record the usage.
            </li>
            <li>
              <strong>Polar Aggregation:</strong> Polar automatically aggregates
              these events and updates your customer meters in real-time.
            </li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
