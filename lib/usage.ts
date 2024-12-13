'use server';

import { getCurrentCustomer } from "./payments";
import { plans, FeatureContext, FeatureLimit } from "@/lib/plans/features";
import { getFeatureUsage, updateFeatureUsage } from "@/lib/plans/db";

export interface FeatureAccessResponse {
    allowed: boolean;
    reason?: string;
    currentUsage?: number;
}

const isFeatureEnabled = (
    priceId: string,
    featureName: string,
    context?: FeatureContext
): boolean => {
    const plan = plans.find((plan) => plan.priceId === priceId);
    if (!plan) return false;

    const feature = plan.features.find((feature) => feature.name === featureName);
    if (!feature) return false;

    // Check if feature is enabled in plan
    if (!feature.enabled) return false;

    // Check dependencies
    if (feature.dependencies) {
        const missingDependencies = feature.dependencies.some(
            depName => !isFeatureEnabled(priceId, depName, context)
        );
        if (missingDependencies) return false;
    }

    return true;
};

const getFeatureLimit = (
    priceId: string,
    featureName: string,
    context?: FeatureContext
): FeatureLimit | undefined => {
    const plan = plans.find((plan) => plan.priceId === priceId);
    const feature = plan?.features.find((feature) => feature.name === featureName);

    // Check for custom limits first
    if (context?.customLimits?.[featureName]) {
        return context.customLimits[featureName];
    }

    return feature?.limits;
};

export const validateFeatureUsage = async (
    subscriptionId: string,
    organizationId: string,
    priceId: string,
    featureName: string,
    newUsage: number,
    context?: FeatureContext
): Promise<FeatureAccessResponse> => {
    const limit = getFeatureLimit(priceId, featureName, context);

    // If no limit or unlimited, update usage and allow
    if (!limit || limit.type === 'unlimited') {
        if (newUsage > 0) {
            await updateFeatureUsage({
                subscriptionId,
                organizationId,
                featureName,
                usage: newUsage,
                limit
            });
        }
        return { allowed: true, currentUsage: newUsage };
    }

    // Check against limit
    if (newUsage >= (limit.value || 0)) {
        return {
            allowed: false,
            reason: `Usage limit exceeded: ${newUsage} ${limit.unit || ''} exceeds limit of ${limit.value} ${limit.unit || ''}`,
            currentUsage: newUsage
        };
    }

    // Update usage in database
    await updateFeatureUsage({
        subscriptionId,
        organizationId,
        featureName,
        usage: newUsage,
        limit
    });

    return { allowed: true, currentUsage: newUsage };
};

export interface FeatureAccessParams {
    subscriptionId: string;
    organizationId?: string;
    userId?: string;
    priceId: string;
    featureName: string;
    context?: FeatureContext;
}

export type WithFeatureAccessParams = {
    subscriptionId: string;
    organizationId?: string;
    userId?: string;
    priceId: string;
    featureName: string;
    context?: FeatureContext;
};

export type FeatureAccessHandlers<T extends any[], R> = {
    onGranted: (...args: T) => Promise<R>;
    onDenied?: (reason: string, currentUsage?: number) => Promise<R>;
};

export const withFeatureAccess = <T extends any[], R>(
    params: WithFeatureAccessParams,
    handlers: FeatureAccessHandlers<T, R>
): ((...args: T) => Promise<R>) => {
    return async (...args: T) => {
        try {
            const customer = await getCurrentCustomer();
            const access = await hasFeatureAccess(
                params.subscriptionId,
                params.priceId,
                params.featureName,
                params.organizationId || customer.id,
                params.userId || customer.id,
                params.context
            );

            if (access.allowed) {
                return await handlers.onGranted(...args);
            } else {
                if (handlers.onDenied) {
                    return await handlers.onDenied(access.reason!, access.currentUsage);
                }
                throw new Error(access.reason);
            }
        } catch (error) {
            throw error instanceof Error ? error : new Error('Unknown error occurred');
        }
    };
};

// The base feature access check function
export const hasFeatureAccess = async (
    subscriptionId: string,
    priceId: string,
    featureName: string,
    organizationId?: string,
    userId?: string,
    context?: FeatureContext
): Promise<FeatureAccessResponse> => {
    if (!organizationId && !userId) {
        return {
            allowed: false,
            reason: 'Either organizationId or userId must be provided'
        };
    }

    const plan = plans.find((plan) => plan.priceId === priceId);
    if (!plan) {
        return {
            allowed: false,
            reason: `Plan with price ID '${priceId}' not found`
        };
    }

    // 1. Check if the feature is enabled (includes dependency checks)
    if (!isFeatureEnabled(priceId, featureName, context)) {
        const feature = plan.features.find(f => f.name === featureName);
        if (!feature) {
            return {
                allowed: false,
                reason: `Feature '${featureName}' not found in plan '${plan.name}'`
            };
        }
        if (!feature.enabled) {
            return {
                allowed: false,
                reason: `Feature '${featureName}' is not enabled in plan '${plan.name}'`
            };
        }
        if (feature.dependencies?.length) {
            return {
                allowed: false,
                reason: `Feature '${featureName}' has unmet dependencies: ${feature.dependencies.join(', ')}`
            };
        }
    }

    // 2. Get current usage from database
    const currentUsageRecord = await getFeatureUsage({
        subscriptionId,
        featureName,
        organizationId,
        userId
    });

    // 3. Validate against limits
    const limits = getFeatureLimit(priceId, featureName, context);

    // If there are no limits or it's unlimited, access is granted
    if (!limits || limits.type === 'unlimited') {
        return {
            allowed: true,
            currentUsage: currentUsageRecord?.currentUsage ?? 0
        };
    }

    // 4. Check current usage against limits
    if (currentUsageRecord?.currentUsage && currentUsageRecord.currentUsage >= (limits.value || 0)) {
        return {
            allowed: false,
            reason: `Usage limit exceeded: ${currentUsageRecord.currentUsage} ${limits.unit || ''} exceeds limit of ${limits.value} ${limits.unit || ''}`,
            currentUsage: currentUsageRecord.currentUsage
        };
    }

    return {
        allowed: true,
        currentUsage: currentUsageRecord?.currentUsage ?? 0
    };
};
