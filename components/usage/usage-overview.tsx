import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { UsageStatus, MeterSlug } from "@/lib/metering";
import { Activity, HardDrive, Sparkles, Users } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface UsageOverviewProps {
  usage: Record<MeterSlug, UsageStatus>;
  className?: string;
}

const METER_CONFIG: Record<
  MeterSlug,
  {
    label: string;
    icon: React.ElementType;
    formatValue: (value: number) => string;
  }
> = {
  api_requests: {
    label: "API Requests",
    icon: Activity,
    formatValue: (v) => v.toLocaleString(),
  },
  storage_gb: {
    label: "Storage",
    icon: HardDrive,
    formatValue: (v) => `${v.toFixed(1)} GB`,
  },
  ai_tokens: {
    label: "AI Tokens",
    icon: Sparkles,
    formatValue: (v) => v.toLocaleString(),
  },
  team_seats: {
    label: "Team Seats",
    icon: Users,
    formatValue: (v) => Math.floor(v).toString(),
  },
};

export function UsageOverview({ usage, className }: UsageOverviewProps) {
  const meterSlugs: MeterSlug[] = [
    "api_requests",
    "storage_gb",
    "ai_tokens",
    "team_seats",
  ];

  // Count how many meters are near or at limit
  const warningCount = meterSlugs.filter((slug) => {
    const status = usage[slug];
    return (
      status.limit !== null &&
      status.current >= status.limit * 0.8
    );
  }).length;

  return (
    <Card className={cn("", className)}>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg">Usage Overview</CardTitle>
          {warningCount > 0 && (
            <p className="text-xs text-yellow-600 mt-1">
              {warningCount} meter{warningCount > 1 ? "s" : ""} near limit
            </p>
          )}
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/usage">View Details</Link>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {meterSlugs.map((slug) => {
            const status = usage[slug];
            const config = METER_CONFIG[slug];
            const Icon = config.icon;

            const percentage =
              status.limit !== null && status.limit > 0
                ? Math.min((status.current / status.limit) * 100, 100)
                : 0;

            const isOverLimit =
              status.limit !== null && status.current >= status.limit;
            const isNearLimit =
              status.limit !== null && status.current >= status.limit * 0.8;

            return (
              <div key={slug} className="space-y-2">
                <div className="flex items-center gap-2">
                  <Icon
                    className={cn(
                      "h-4 w-4",
                      isOverLimit
                        ? "text-destructive"
                        : isNearLimit
                          ? "text-yellow-500"
                          : "text-muted-foreground"
                    )}
                  />
                  <span className="text-sm font-medium">{config.label}</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-semibold">
                    {config.formatValue(status.current)}
                  </span>
                  {status.limit !== null && (
                    <span className="text-xs text-muted-foreground">
                      / {config.formatValue(status.limit)}
                    </span>
                  )}
                </div>
                {status.limit !== null && (
                  <Progress
                    value={percentage}
                    className={cn(
                      "h-1.5",
                      isOverLimit && "[&>div]:bg-destructive",
                      isNearLimit && !isOverLimit && "[&>div]:bg-yellow-500"
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
