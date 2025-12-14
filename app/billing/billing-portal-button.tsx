"use client";

import { Button } from "@/components/ui/button";
import { ExternalLink, Loader2 } from "lucide-react";
import { useState } from "react";

interface BillingPortalButtonProps {
  portalUrl: string;
}

export function BillingPortalButton({ portalUrl }: BillingPortalButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = () => {
    setIsLoading(true);
    // Open in new tab or redirect
    window.location.href = portalUrl;
  };

  return (
    <Button onClick={handleClick} disabled={isLoading} className="gap-2">
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Opening Portal...
        </>
      ) : (
        <>
          Open Billing Portal
          <ExternalLink className="h-4 w-4" />
        </>
      )}
    </Button>
  );
}
