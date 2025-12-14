import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import UserCard from "./user-card";
import { OrganizationCard } from "./organization-card";
import AccountSwitcher from "@/components/account-switch";
import { getCurrentCustomer, getActiveSubscription } from "@/lib/payments";
import { getAllUsage, type MeterSlug } from "@/lib/metering";
import { UsageOverview } from "@/components/usage/usage-overview";
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
  Building2,
  Calendar,
  CreditCard,
  ExternalLink,
  User,
} from "lucide-react";

// Type assertion helper for organization API
const getFullOrganization = (
  auth.api as unknown as {
    getFullOrganization: (opts: {
      headers: Headers;
    }) => Promise<{ id: string; name: string } | null>;
  }
).getFullOrganization;

export default async function AccountPage() {
  const requestHeaders = await headers();

  const [session, activeSessions, organization] = await Promise.all([
    auth.api.getSession({
      headers: requestHeaders,
    }),
    auth.api.listSessions({
      headers: requestHeaders,
    }),
    getFullOrganization({
      headers: requestHeaders,
    }),
  ]).catch(() => {
    throw redirect("/sign-in");
  });

  // Get billing information
  let customer;
  let subscription;
  let usage: Record<MeterSlug, { allowed: boolean; current: number; limit: number | null; remaining: number | null }>;

  try {
    [customer, subscription, usage] = await Promise.all([
      getCurrentCustomer(),
      getActiveSubscription(),
      getAllUsage(),
    ]);
  } catch {
    // If billing info fails, continue with just auth info
    customer = null;
    subscription = null;
    usage = {
      api_requests: { allowed: true, current: 0, limit: null, remaining: null },
      storage_gb: { allowed: true, current: 0, limit: null, remaining: null },
      ai_tokens: { allowed: true, current: 0, limit: null, remaining: null },
      team_seats: { allowed: true, current: 0, limit: null, remaining: null },
    };
  }

  // Device sessions may have been merged with listSessions in Better Auth v1.4
  const deviceSessions = activeSessions;

  const billingPeriodEnd = subscription?.currentPeriodEnd
    ? new Date(subscription.currentPeriodEnd).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <div className="w-full space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Account Settings</h1>
        <p className="text-muted-foreground">
          Manage your account, organization, and billing
        </p>
      </div>

      {/* Billing Entity Card */}
      {customer && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Billing Information</CardTitle>
              <Button variant="outline" size="sm" asChild>
                <Link href="/billing">
                  <CreditCard className="mr-2 h-4 w-4" />
                  Manage Billing
                  <ExternalLink className="ml-2 h-3 w-3" />
                </Link>
              </Button>
            </div>
            <CardDescription>
              Your billing context and subscription status
            </CardDescription>
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
                  <p className="font-medium">{customer.billingEntityName}</p>
                  <p className="text-sm text-muted-foreground">
                    {customer.organization ? "Organization" : "Personal Account"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    ID: {customer.billingEntityId.slice(0, 8)}...
                  </p>
                </div>
              </div>

              {/* Subscription */}
              <div className="flex items-start gap-3">
                <CreditCard className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">
                    {subscription?.product?.name || "No Subscription"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {subscription?.status === "active" ? (
                      <Badge variant="secondary" className="text-xs">
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs">
                        Inactive
                      </Badge>
                    )}
                  </p>
                </div>
              </div>

              {/* Billing Period */}
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">
                    {billingPeriodEnd || "No active period"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {billingPeriodEnd ? "Period ends" : "Subscribe to start"}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Usage Overview */}
      {customer && <UsageOverview usage={usage} />}

      {/* Account Switcher */}
      <AccountSwitcher
        sessions={JSON.parse(JSON.stringify(deviceSessions))}
      />

      {/* User Card */}
      <UserCard
        session={JSON.parse(JSON.stringify(session))}
        activeSessions={JSON.parse(JSON.stringify(activeSessions))}
      />

      {/* Organization Card */}
      <OrganizationCard
        session={JSON.parse(JSON.stringify(session))}
        activeOrganization={JSON.parse(JSON.stringify(organization))}
      />
    </div>
  );
}
