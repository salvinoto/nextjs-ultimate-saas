'use server';

/**
 * Metering Limits
 * 
 * Functions for checking usage limits against Polar's customer meters.
 * Provides both direct limit checking and higher-order function patterns.
 */

import { polar } from '@/polar';
import { getCurrentCustomer } from '@/lib/payments';
import type { MeterSlug, UsageStatus } from './types';

/**
 * Check the current usage status for a specific meter.
 * 
 * @param externalCustomerId - Your customer ID (user ID or organization ID)
 * @param meterSlug - The meter to check (e.g., 'api_requests')
 * @returns UsageStatus with current usage, limit, and whether more usage is allowed
 * 
 * @example
 * ```ts
 * const status = await checkLimit('user_123', 'api_requests');
 * if (!status.allowed) {
 *   throw new Error(status.reason);
 * }
 * ```
 */
export async function checkLimit(
  externalCustomerId: string,
  meterSlug: MeterSlug
): Promise<UsageStatus> {
  try {
    // Get customer meters from Polar
    const { result } = await polar.customerMeters.list({
      externalCustomerId,
    });

    // Find the meter by matching the slug in metadata
    const customerMeter = result.items.find(
      (m) => (m.meter.metadata as Record<string, unknown>)?.slug === meterSlug
    );

    if (!customerMeter) {
      // If no meter found, assume unlimited (new customer or meter not set up)
      return {
        allowed: true,
        current: 0,
        limit: null,
        remaining: null,
      };
    }

    const current = customerMeter.consumedUnits ?? 0;
    const credited = customerMeter.creditedUnits ?? 0;
    const balance = customerMeter.balance ?? (credited - current);
    
    // If there's a credit-based limit, check the balance
    if (credited > 0) {
      const allowed = balance > 0;
      return {
        allowed,
        current,
        limit: credited,
        remaining: Math.max(0, balance),
        reason: allowed ? undefined : `Usage limit reached: ${current}/${credited} units used`,
      };
    }

    // No limit set, allow usage
    return {
      allowed: true,
      current,
      limit: null,
      remaining: null,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Failed to check limit for ${meterSlug}:`, errorMessage);
    
    // On error, be permissive to avoid blocking legitimate usage
    return {
      allowed: true,
      current: 0,
      limit: null,
      remaining: null,
      reason: `Error checking limit: ${errorMessage}`,
    };
  }
}

/**
 * Check the current usage status using the current session's customer.
 * 
 * @param meterSlug - The meter to check
 * @returns UsageStatus with current usage, limit, and whether more usage is allowed
 * 
 * @example
 * ```ts
 * const status = await checkCurrentLimit('ai_tokens');
 * if (!status.allowed) {
 *   return { error: 'Token limit reached' };
 * }
 * ```
 */
export async function checkCurrentLimit(
  meterSlug: MeterSlug
): Promise<UsageStatus> {
  try {
    const customer = await getCurrentCustomer();
    
    // Use organization ID if available, otherwise use user ID
    const externalCustomerId = customer.organization?.id ?? customer.user.id;
    
    return checkLimit(externalCustomerId, meterSlug);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Failed to get current customer:', errorMessage);
    
    return {
      allowed: false,
      current: 0,
      limit: null,
      remaining: null,
      reason: 'Unable to verify customer',
    };
  }
}

/**
 * Higher-order function that wraps an action with usage limit checking.
 * The action will only execute if the customer has remaining usage.
 * 
 * @param meterSlug - The meter to check before executing the action
 * @param action - The async action to execute if limit check passes
 * @returns The result of the action
 * @throws Error if the limit is exceeded
 * 
 * @example
 * ```ts
 * export async function generateContent(prompt: string) {
 *   return withUsageLimit('ai_tokens', async () => {
 *     const result = await callAI(prompt);
 *     await trackAiTokens(customerId, result.tokens);
 *     return result;
 *   });
 * }
 * ```
 */
export async function withUsageLimit<T>(
  meterSlug: MeterSlug,
  action: () => Promise<T>
): Promise<T> {
  const status = await checkCurrentLimit(meterSlug);
  
  if (!status.allowed) {
    throw new Error(status.reason ?? `Usage limit exceeded for ${meterSlug}`);
  }
  
  return action();
}

/**
 * Higher-order function variant that returns a result object instead of throwing.
 * Useful when you want to handle limit exceeded gracefully.
 * 
 * @param meterSlug - The meter to check before executing the action
 * @param action - The async action to execute if limit check passes
 * @returns Object with success/error and optional data
 * 
 * @example
 * ```ts
 * const result = await withUsageLimitSafe('storage_gb', async () => {
 *   return await uploadFile(file);
 * });
 * 
 * if (!result.success) {
 *   showUpgradeModal(result.error);
 * }
 * ```
 */
export async function withUsageLimitSafe<T>(
  meterSlug: MeterSlug,
  action: () => Promise<T>
): Promise<{ success: true; data: T } | { success: false; error: string; status: UsageStatus }> {
  const status = await checkCurrentLimit(meterSlug);
  
  if (!status.allowed) {
    return {
      success: false,
      error: status.reason ?? `Usage limit exceeded for ${meterSlug}`,
      status,
    };
  }
  
  try {
    const data = await action();
    return { success: true, data };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      error: errorMessage,
      status,
    };
  }
}

/**
 * Get usage status for all meters for the current customer.
 * Useful for displaying usage dashboards.
 * 
 * @returns Record of meter slugs to their usage status
 * 
 * @example
 * ```ts
 * const usage = await getAllUsage();
 * // { api_requests: { current: 150, limit: 1000, ... }, ... }
 * ```
 */
export async function getAllUsage(): Promise<Record<MeterSlug, UsageStatus>> {
  const meterSlugs: MeterSlug[] = ['api_requests', 'storage_gb', 'ai_tokens', 'team_seats'];
  
  const results = await Promise.all(
    meterSlugs.map(async (slug) => {
      const status = await checkCurrentLimit(slug);
      return [slug, status] as const;
    })
  );
  
  return Object.fromEntries(results) as Record<MeterSlug, UsageStatus>;
}
