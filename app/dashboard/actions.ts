"use server";

/**
 * Server Actions with Metering
 *
 * These server actions demonstrate how to integrate the metering system
 * with your application logic. Each action:
 * 1. Gets the current customer context
 * 2. Checks usage limits before processing
 * 3. Performs the operation
 * 4. Tracks usage after success
 */

import { getCurrentCustomer } from "@/lib/payments";
import {
  trackApiRequest,
  trackAiTokens,
  trackStorageUpdate,
  trackSeatActivity,
  checkCurrentLimit,
  withUsageLimit,
  withUsageLimitSafe,
} from "@/lib/metering";

// ============================================
// API Request Demo
// ============================================

/**
 * Simulates an API call and tracks it against the api_requests meter.
 */
export async function simulateApiCall(): Promise<{
  success: boolean;
  message: string;
}> {
  const { billingEntityId } = await getCurrentCustomer();

  // Check limit first
  const status = await checkCurrentLimit("api_requests");
  if (!status.allowed) {
    return {
      success: false,
      message: status.reason || "API request limit reached",
    };
  }

  // Simulate API processing
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Track the usage after success
  const result = await trackApiRequest(billingEntityId, "/api/demo/simulate", {
    method: "POST",
    statusCode: 200,
    duration: 500,
  });

  if (!result.success) {
    console.error("Failed to track API request:", result.error);
  }

  return {
    success: true,
    message: "API call completed and tracked successfully",
  };
}

// ============================================
// AI Generation Demo
// ============================================

/**
 * Simulates AI content generation and tracks token usage.
 * Uses the withUsageLimit wrapper for cleaner code.
 */
export async function simulateAiGeneration(prompt: string): Promise<{
  success: boolean;
  content?: string;
  tokens?: number;
}> {
  const { billingEntityId } = await getCurrentCustomer();

  // Use the safe wrapper to avoid throwing
  const result = await withUsageLimitSafe("ai_tokens", async () => {
    // Simulate AI processing
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Simulate token calculation based on prompt length
    const inputTokens = Math.ceil(prompt.length / 4);
    const outputTokens = Math.floor(Math.random() * 200) + 50;
    const totalTokens = inputTokens + outputTokens;

    // Generate mock response
    const responses = [
      "Based on your request, I've analyzed the data and found some interesting patterns.",
      "Here's a creative solution that addresses your needs effectively.",
      "After careful consideration, I recommend the following approach for best results.",
      "The analysis shows promising opportunities in this area.",
      "This is a simulated AI response demonstrating the metering system.",
    ];
    const content = responses[Math.floor(Math.random() * responses.length)];

    // Track the token usage
    await trackAiTokens(billingEntityId, totalTokens, {
      model: "demo-gpt-4",
      type: "total",
    });

    return {
      content,
      tokens: totalTokens,
    };
  });

  if (!result.success) {
    return {
      success: false,
    };
  }

  return {
    success: true,
    content: result.data.content,
    tokens: result.data.tokens,
  };
}

// ============================================
// Storage Upload Demo
// ============================================

/**
 * Simulates a file upload and tracks storage usage.
 * Storage uses peak billing (max aggregation), so we track the new total.
 */
export async function simulateStorageUpload(sizeGb: number): Promise<{
  success: boolean;
  message: string;
}> {
  const { billingEntityId } = await getCurrentCustomer();

  // Check storage limit first
  const status = await checkCurrentLimit("storage_gb");
  if (!status.allowed) {
    return {
      success: false,
      message: status.reason || "Storage limit reached",
    };
  }

  // Check if adding this file would exceed the limit
  if (status.limit !== null && status.current + sizeGb > status.limit) {
    return {
      success: false,
      message: `Adding ${sizeGb} GB would exceed your ${status.limit} GB limit. Current usage: ${status.current.toFixed(2)} GB`,
    };
  }

  // Simulate upload processing
  await new Promise((resolve) => setTimeout(resolve, 800));

  // Track the new total storage size (peak billing)
  const newTotal = status.current + sizeGb;
  const result = await trackStorageUpdate(billingEntityId, newTotal, "upload");

  if (!result.success) {
    console.error("Failed to track storage:", result.error);
  }

  return {
    success: true,
    message: `Uploaded ${sizeGb} GB. New total: ${newTotal.toFixed(2)} GB`,
  };
}

// ============================================
// Team Seat Activity Demo
// ============================================

/**
 * Records user activity for seat-based billing.
 * Uses unique aggregation - multiple events for the same user only count once.
 */
export async function simulateSeatActivity(): Promise<{
  success: boolean;
  message: string;
}> {
  const { billingEntityId, user, organization } = await getCurrentCustomer();

  // Check seat limit (only relevant for organizations)
  if (organization) {
    const status = await checkCurrentLimit("team_seats");
    if (!status.allowed) {
      return {
        success: false,
        message: status.reason || "Team seat limit reached",
      };
    }
  }

  // Track the user's activity
  // For organizations, we track against the org ID with the user's ID
  // For personal accounts, this is less meaningful but still demonstrates the API
  const result = await trackSeatActivity(
    organization?.id ?? billingEntityId,
    user.id,
    "active"
  );

  if (!result.success) {
    console.error("Failed to track seat activity:", result.error);
  }

  return {
    success: true,
    message: organization
      ? `Activity recorded for ${user.name} in ${organization.name}`
      : `Activity recorded for ${user.name}`,
  };
}

// ============================================
// Generic Metered Action Example
// ============================================

/**
 * Example of a generic metered action using withUsageLimit.
 * This pattern can be used for any operation that consumes a metered resource.
 */
export async function performMeteredAction<T>(
  meterSlug: "api_requests" | "storage_gb" | "ai_tokens" | "team_seats",
  action: (billingEntityId: string) => Promise<T>
): Promise<T> {
  const { billingEntityId } = await getCurrentCustomer();

  return withUsageLimit(meterSlug, async () => {
    return action(billingEntityId);
  });
}
