import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { UsageStatus, MeterSlug } from "@/lib/metering";
import {
  Activity,
  HardDrive,
  Sparkles,
  Users,
  type LucideIcon,
} from "lucide-react";

interface UsageCardProps {
  meterSlug: MeterSlug;
  status: UsageStatus;
  className?: string;
}

const METER_CONFIG: Record<
  MeterSlug,
  {
    label: string;
    icon: LucideIcon;
    unit: string;
    formatValue: (value: number) => string;
  }
> = {
  api_requests: {
    label: "API Requests",
    icon: Activity,
    unit: "requests",
    formatValue: (v) => v.toLocaleString(),
  },
  storage_gb: {
    label: "Storage",
    icon: HardDrive,
    unit: "GB",
    formatValue: (v) => v.toFixed(2),
  },
  ai_tokens: {
    label: "AI Tokens",
    icon: Sparkles,
    unit: "tokens",
    formatValue: (v) => v.toLocaleString(),
  },
  team_seats: {
    label: "Team Seats",
    icon: Users,
    unit: "seats",
    formatValue: (v) => Math.floor(v).toString(),
  },
};

export function UsageCard({ meterSlug, status, className }: UsageCardProps) {
  const config = METER_CONFIG[meterSlug];
  const Icon = config.icon;

  const percentage =
    status.limit !== null && status.limit > 0
      ? Math.min((status.current / status.limit) * 100, 100)
      : 0;

  const isOverLimit = status.limit !== null && status.current >= status.limit;
  const isNearLimit =
    status.limit !== null && status.current >= status.limit * 0.8;

  return (
    <Card className={cn("relative overflow-hidden", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{config.label}</CardTitle>
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
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold">
              {config.formatValue(status.current)}
            </span>
            {status.limit !== null ? (
              <span className="text-sm text-muted-foreground">
                / {config.formatValue(status.limit)} {config.unit}
              </span>
            ) : (
              <span className="text-sm text-muted-foreground">Unlimited</span>
            )}
          </div>

          {status.limit !== null && (
            <>
              <Progress
                value={percentage}
                className={cn(
                  "h-2",
                  isOverLimit && "[&>div]:bg-destructive",
                  isNearLimit && !isOverLimit && "[&>div]:bg-yellow-500"
                )}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>
                  {status.remaining !== null
                    ? `${config.formatValue(status.remaining)} remaining`
                    : ""}
                </span>
                <span>{percentage.toFixed(0)}% used</span>
              </div>
            </>
          )}

          {!status.allowed && status.reason && (
            <p className="text-xs text-destructive mt-2">{status.reason}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
