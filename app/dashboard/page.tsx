import Link from "next/link";
import { redirect } from "next/navigation";
import { polar } from "@/polar";
import { ProductCard } from "@/components/product-card";
import { getActiveSubscription, getCurrentCustomer } from "@/lib/payments";
import { getAllUsage } from "@/lib/metering";
import { UsageOverview } from "@/components/usage/usage-overview";
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
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  CreditCard,
  User,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  let customer;
  try {
    customer = await getCurrentCustomer();
  } catch {
    redirect("/sign-in");
  }

  const [usage, subscription, productsResult] = await Promise.all([
    getAllUsage(),
    getActiveSubscription(),
    polar.products.list({
      organizationId: process.env.POLAR_ORGANIZATION_ID!,
      isArchived: false,
    }),
  ]);

  const features = [
    "Email & Password",
    "Organization | Teams",
    "Passkeys",
    "Multi Factor",
    "Password Reset",
    "Email Verification",
    "Roles & Permissions",
    "Rate Limiting",
    "Session Management",
    "Prisma Database",
    "Payments with Polar",
    "Usage-Based Billing with Polar Meters",
  ];

  // Check if any meters are at limit
  const hasLimitReached = Object.values(usage).some(
    (status) => status.allowed === false
  );

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Welcome back, {customer.user.name?.split(" ")[0] || "there"}!
          </h1>
          <p className="text-muted-foreground">
            Here&apos;s an overview of your account and usage
          </p>
        </div>
        <div className="flex items-center gap-2">
          {customer.organization ? (
            <Badge variant="outline" className="gap-1">
              <Building2 className="h-3 w-3" />
              {customer.organization.name}
            </Badge>
          ) : (
            <Badge variant="outline" className="gap-1">
              <User className="h-3 w-3" />
              Personal Account
            </Badge>
          )}
        </div>
      </div>

      {/* Subscription Status */}
      {subscription?.productId ? (
        <Card className="border-green-500/20 bg-green-500/5">
          <CardContent className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <div>
                <p className="font-medium">
                  Subscribed to {subscription.product?.name}
                </p>
                <p className="text-sm text-muted-foreground">
                  Billing period ends{" "}
                  {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/billing">
                <CreditCard className="mr-2 h-4 w-4" />
                Manage
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <UpgradePrompt
          variant="compact"
          title="No active subscription"
          description="Subscribe to a plan to unlock metered features"
        />
      )}

      {/* Limit Warning */}
      {hasLimitReached && (
        <UpgradePrompt
          variant="warning"
          title="Usage Limit Reached"
          description="One or more of your usage limits have been reached. Upgrade to continue using all features."
        />
      )}

      {/* Usage Overview Widget */}
      <UsageOverview usage={usage} />

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Try Metering Demo</CardTitle>
            <CardDescription>
              Test the metering system with interactive examples
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" size="sm" asChild className="w-full">
              <Link href="/dashboard/demo">
                Open Demo
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">View Usage Details</CardTitle>
            <CardDescription>
              See detailed breakdown of all your meters
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" size="sm" asChild className="w-full">
              <Link href="/dashboard/usage">
                View Usage
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Account Settings</CardTitle>
            <CardDescription>
              Manage your profile and organization
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" size="sm" asChild className="w-full">
              <Link href="/dashboard/account">
                Open Settings
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Features List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Available Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {features.map((feature) => (
              <Badge key={feature} variant="secondary" className="font-normal">
                {feature}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Products Section */}
      {productsResult.result.items.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Available Plans</h2>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/products">View All</Link>
            </Button>
          </div>
          <div
            className={`grid gap-6 ${
              productsResult.result.items.length === 1
                ? "grid-cols-1"
                : productsResult.result.items.length === 2
                  ? "grid-cols-1 sm:grid-cols-2"
                  : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
            }`}
          >
            {productsResult.result.items.slice(0, 3).map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                currentSubscription={subscription}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
