"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, AlertTriangle } from "lucide-react";
import Link from "next/link";
import type { UsageStatus } from "@/lib/metering";

interface UsageLimitGateProps {
  /** The usage status for the meter being checked */
  usageStatus: UsageStatus;
  /** Label for the feature being gated */
  featureLabel: string;
  /** The action to perform when allowed */
  onAction: () => Promise<void>;
  /** Button text */
  buttonText?: string;
  /** Button variant */
  variant?: "default" | "secondary" | "outline" | "destructive";
  /** Button size */
  size?: "default" | "sm" | "lg" | "icon";
  /** Custom className for the button */
  className?: string;
  /** Disable the button */
  disabled?: boolean;
  /** Children to render inside the button */
  children?: React.ReactNode;
}

export function UsageLimitGate({
  usageStatus,
  featureLabel,
  onAction,
  buttonText = "Continue",
  variant = "default",
  size = "default",
  className,
  disabled = false,
  children,
}: UsageLimitGateProps) {
  const [isPending, startTransition] = useTransition();
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = () => {
    setError(null);

    if (!usageStatus.allowed) {
      setShowUpgradeDialog(true);
      return;
    }

    startTransition(async () => {
      try {
        await onAction();
      } catch (e) {
        const message = e instanceof Error ? e.message : "An error occurred";
        if (message.includes("limit") || message.includes("exceeded")) {
          setShowUpgradeDialog(true);
        } else {
          setError(message);
        }
      }
    });
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={handleClick}
        disabled={disabled || isPending}
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          children || buttonText
        )}
      </Button>

      {error && (
        <p className="text-sm text-destructive mt-2">{error}</p>
      )}

      <Dialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Usage Limit Reached
            </DialogTitle>
            <DialogDescription>
              You&apos;ve reached your {featureLabel.toLowerCase()} limit.
              {usageStatus.limit !== null && (
                <span className="block mt-2">
                  Current usage: {usageStatus.current.toLocaleString()} /{" "}
                  {usageStatus.limit.toLocaleString()}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              Upgrade your plan to continue using this feature or wait until
              your next billing cycle when your limits reset.
            </p>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setShowUpgradeDialog(false)}
            >
              Cancel
            </Button>
            <Button asChild>
              <Link href="/billing">Upgrade Plan</Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
