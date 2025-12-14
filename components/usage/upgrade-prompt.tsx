import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { UsageStatus, MeterSlug } from "@/lib/metering";

interface UpgradePromptProps {
  /** The meter that triggered the upgrade prompt */
  meterSlug?: MeterSlug;
  /** The usage status */
  usageStatus?: UsageStatus;
  /** Custom title */
  title?: string;
  /** Custom description */
  description?: string;
  /** Visual variant */
  variant?: "default" | "warning" | "compact";
  /** Custom className */
  className?: string;
}

const METER_LABELS: Record<MeterSlug, string> = {
  api_requests: "API request",
  storage_gb: "storage",
  ai_tokens: "AI token",
  team_seats: "team seat",
};

export function UpgradePrompt({
  meterSlug,
  usageStatus,
  title,
  description,
  variant = "default",
  className,
}: UpgradePromptProps) {
  const meterLabel = meterSlug ? METER_LABELS[meterSlug] : "usage";

  const defaultTitle = usageStatus?.allowed === false
    ? `${meterLabel.charAt(0).toUpperCase() + meterLabel.slice(1)} Limit Reached`
    : "Unlock More Features";

  const defaultDescription = usageStatus?.allowed === false
    ? `You've used all your available ${meterLabel}s. Upgrade to continue.`
    : "Get access to higher limits and premium features.";

  if (variant === "compact") {
    return (
      <div
        className={cn(
          "flex items-center justify-between gap-4 rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-4",
          className
        )}
      >
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-yellow-500 shrink-0" />
          <div>
            <p className="text-sm font-medium">{title || defaultTitle}</p>
            {usageStatus?.limit !== null && (
              <p className="text-xs text-muted-foreground">
                {usageStatus.current.toLocaleString()} /{" "}
                {usageStatus.limit.toLocaleString()} used
              </p>
            )}
          </div>
        </div>
        <Button size="sm" asChild>
          <Link href="/billing">
            Upgrade
            <ArrowRight className="ml-1 h-3 w-3" />
          </Link>
        </Button>
      </div>
    );
  }

  if (variant === "warning") {
    return (
      <Card
        className={cn(
          "border-yellow-500/20 bg-yellow-500/5",
          className
        )}
      >
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            {title || defaultTitle}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {description || defaultDescription}
          </p>
          {usageStatus?.limit !== null && (
            <div className="text-sm">
              <span className="font-medium">
                {usageStatus.current.toLocaleString()}
              </span>
              <span className="text-muted-foreground">
                {" "}
                / {usageStatus.limit.toLocaleString()} {meterLabel}s used
              </span>
            </div>
          )}
          <Button asChild>
            <Link href="/billing">
              Upgrade Now
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Default variant
  return (
    <Card className={cn("relative overflow-hidden", className)}>
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent" />
      <CardHeader className="relative pb-2">
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          {title || defaultTitle}
        </CardTitle>
      </CardHeader>
      <CardContent className="relative space-y-4">
        <p className="text-sm text-muted-foreground">
          {description || defaultDescription}
        </p>
        <ul className="space-y-2 text-sm">
          <li className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            Higher API request limits
          </li>
          <li className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            More storage space
          </li>
          <li className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            Increased AI token allocation
          </li>
          <li className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            Additional team seats
          </li>
        </ul>
        <Button className="w-full" asChild>
          <Link href="/billing">
            View Upgrade Options
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
