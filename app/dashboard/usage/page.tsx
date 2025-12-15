import { getAllUsage, type MeterSlug } from "@/lib/metering";
import { getCurrentCustomer, getActiveSubscription } from "@/lib/payments";
import { UsageCard } from "@/components/usage/usage-card";
import { UpgradePrompt } from "@/components/usage/upgrade-prompt";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { redirect } from "next/navigation";
import { 
  CreditCard, 
  RefreshCw, 
  Calendar,
  Building2,
  User
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function UsageDashboardPage() {
  let customer;
  try {
    customer = await getCurrentCustomer();
  } catch {
    redirect("/sign-in");
  }

  const [usage, subscription] = await Promise.all([
    getAllUsage(),
    getActiveSubscription(),
  ]);

  const meterSlugs: MeterSlug[] = [
    "api_requests",
    "storage_gb",
    "ai_tokens",
    "team_seats",
  ];

  // Check if any meters are over limit
  const hasLimitReached = meterSlugs.some(
    (slug) => usage[slug]?.allowed === false
  );

  // Check if any meters are near limit (>80%)
  const nearLimitMeters = meterSlugs.filter((slug) => {
    const status = usage[slug];
    return (
      status?.limit !== null &&
      status?.limit > 0 &&
      status?.current >= status?.limit * 0.8 &&
      status?.allowed !== false
    );
  });

  const billingPeriodEnd = subscription?.currentPeriodEnd
    ? new Date(subscription.currentPeriodEnd).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Usage Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor your usage across all metered features
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/demo">
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Demo
            </Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/billing">
              <CreditCard className="mr-2 h-4 w-4" />
              Manage Billing
            </Link>
          </Button>
        </div>
      </div>

      {/* Billing Context Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Billing Context</CardTitle>
            {subscription?.product?.name && (
              <Badge variant="secondary">{subscription.product.name}</Badge>
            )}
          </div>
          <CardDescription>
            Usage is tracked for your current billing entity
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center gap-3">
              {customer.organization ? (
                <Building2 className="h-5 w-5 text-muted-foreground" />
              ) : (
                <User className="h-5 w-5 text-muted-foreground" />
              )}
              <div>
                <p className="text-sm font-medium">
                  {customer.billingEntityName}
                </p>
                <p className="text-xs text-muted-foreground">
                  {customer.organization ? "Organization" : "Personal Account"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">
                  {billingPeriodEnd || "No active subscription"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {billingPeriodEnd ? "Period ends" : "Subscribe to a plan"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <CreditCard className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">
                  {subscription?.status === "active" ? "Active" : "Inactive"}
                </p>
                <p className="text-xs text-muted-foreground">
                  Subscription status
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Limit Warning */}
      {hasLimitReached && (
        <UpgradePrompt
          variant="warning"
          title="Usage Limit Reached"
          description="One or more of your usage limits have been reached. Upgrade your plan to continue using all features."
        />
      )}

      {/* Near Limit Warning */}
      {!hasLimitReached && nearLimitMeters.length > 0 && (
        <UpgradePrompt
          variant="compact"
          title={`${nearLimitMeters.length} meter${nearLimitMeters.length > 1 ? "s" : ""} approaching limit`}
        />
      )}

      {/* Usage Cards Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {meterSlugs.map((slug) => (
          <UsageCard key={slug} meterSlug={slug} status={usage[slug]} />
        ))}
      </div>

      {/* Upgrade Prompt (if no subscription) */}
      {!subscription && (
        <UpgradePrompt
          title="Get Started with a Plan"
          description="Subscribe to a plan to unlock metered features with defined limits."
        />
      )}

      {/* Usage Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Usage Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
              <span>
                <strong>API Requests</strong> are counted per billing period and
                reset automatically.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
              <span>
                <strong>Storage</strong> is measured by peak usage during the
                billing period.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
              <span>
                <strong>AI Tokens</strong> accumulate across all your AI
                operations.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
              <span>
                <strong>Team Seats</strong> count unique active users in your
                organization.
              </span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
