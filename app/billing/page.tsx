import { getCurrentCustomer, getActiveSubscription } from "@/lib/payments";
import { getAllUsage, type MeterSlug } from "@/lib/metering";
import { polar } from "@/polar";
import { redirect } from "next/navigation";
import { UsageCard } from "@/components/usage/usage-card";
import { UpgradePrompt } from "@/components/usage/upgrade-prompt";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  Calendar,
  CheckCircle2,
  CreditCard,
  User,
} from "lucide-react";
import { BillingPortalButton } from "./billing-portal-button";

export const dynamic = "force-dynamic";

export default async function BillingPage() {
  let customer;
  try {
    customer = await getCurrentCustomer();
  } catch {
    redirect("/sign-in");
  }

  if (!customer) {
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

  // Check if any meters are near or at limit
  const hasLimitReached = meterSlugs.some(
    (slug) => usage[slug]?.allowed === false
  );

  const nearLimitCount = meterSlugs.filter((slug) => {
    const status = usage[slug];
    return (
      status?.limit !== null &&
      status?.limit > 0 &&
      status?.current >= status?.limit * 0.8
    );
  }).length;

  const billingPeriodStart = subscription?.currentPeriodStart
    ? new Date(subscription.currentPeriodStart).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
    : null;

  const billingPeriodEnd = subscription?.currentPeriodEnd
    ? new Date(subscription.currentPeriodEnd).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  // Generate the portal URL using externalCustomerId (billingEntityId)
  // This works even if the customer hasn't been stored in our local DB yet
  let portalUrl: string | null = null;
  
  try {
    // Use billingEntityId (user or org ID) as the external customer ID
    // This is the same ID we set during checkout with externalCustomerId
    const session = await polar.customerSessions.create({
      externalCustomerId: customer.billingEntityId,
    });

    const organizationName = (process.env.POLAR_ORGANIZATION_NAME ?? "")
      .toLowerCase()
      .replace(/\s+/g, "-");

    const baseUrl = "https://sandbox.polar.sh";
    const url = new URL(`${organizationName}/portal`, baseUrl);
    url.searchParams.set("customer_session_token", session.token);
    portalUrl = url.toString();
  } catch (error) {
    console.error("Failed to create customer session:", error);
    // If externalCustomerId fails (customer may not exist in Polar yet), 
    // the portalUrl stays null and we show the "View Plans" fallback
  }

  return (
    <div className="container max-w-4xl py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Billing & Usage
          </h1>
          <p className="text-muted-foreground">
            Manage your subscription and view usage
          </p>
        </div>
      </div>

      {/* Subscription Status Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Subscription</CardTitle>
            {subscription?.status === "active" && (
              <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                <CheckCircle2 className="mr-1 h-3 w-3" />
                Active
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            {/* Billing Entity */}
            <div className="flex items-start gap-3">
              {customer.organization ? (
                <Building2 className="h-5 w-5 text-muted-foreground mt-0.5" />
              ) : (
                <User className="h-5 w-5 text-muted-foreground mt-0.5" />
              )}
              <div>
                <p className="text-sm text-muted-foreground">Billing For</p>
                <p className="font-medium">{customer.billingEntityName}</p>
                <p className="text-xs text-muted-foreground">
                  {customer.organization ? "Organization" : "Personal"}
                </p>
              </div>
            </div>

            {/* Plan */}
            <div className="flex items-start gap-3">
              <CreditCard className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Current Plan</p>
                <p className="font-medium">
                  {subscription?.product?.name || "No Plan"}
                </p>
                {subscription?.amount && (
                  <p className="text-xs text-muted-foreground">
                    ${(subscription.amount / 100).toFixed(2)} /{" "}
                    {subscription.recurringInterval}
                  </p>
                )}
              </div>
            </div>

            {/* Billing Period */}
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Billing Period</p>
                {billingPeriodStart && billingPeriodEnd ? (
                  <>
                    <p className="font-medium">
                      {billingPeriodStart} - {billingPeriodEnd}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Resets on {billingPeriodEnd}
                    </p>
                  </>
                ) : (
                  <p className="font-medium">No active period</p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Limit Warnings */}
      {hasLimitReached && (
        <UpgradePrompt
          variant="warning"
          title="Usage Limit Reached"
          description="One or more usage limits have been reached. Upgrade your plan to continue."
        />
      )}

      {!hasLimitReached && nearLimitCount > 0 && (
        <UpgradePrompt
          variant="compact"
          title={`${nearLimitCount} meter${nearLimitCount > 1 ? "s" : ""} approaching limit`}
        />
      )}

      {/* Current Usage */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Current Period Usage</h2>
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/usage">View Details</Link>
          </Button>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {meterSlugs.map((slug) => (
            <UsageCard key={slug} meterSlug={slug} status={usage[slug]} />
          ))}
        </div>
      </div>

      {/* Portal Button */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Manage Subscription</CardTitle>
          <CardDescription>
            Access the billing portal to update payment methods, view invoices,
            or change your plan.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {portalUrl ? (
            <BillingPortalButton portalUrl={portalUrl} />
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {subscription 
                  ? "Unable to load billing portal. Please try again later."
                  : "You don't have an active subscription yet. Choose a plan to get started."
                }
              </p>
              <Button asChild>
                <Link href="/products">View Plans</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
