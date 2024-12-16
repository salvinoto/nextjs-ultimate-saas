'use server';

import { getCurrentCustomer } from "./payments";
import { featureDefinitions, type FeatureContext, type FeatureLimit } from "@/lib/plans/features";
import { getFeatureUsage, updateFeatureUsage } from "@/lib/plans/db";
import { plans } from "@/lib/plans/features";

type FeatureKey = keyof typeof featureDefinitions;

export interface FeatureAccessResponse {
    allowed: boolean;
    reason?: string;
    currentUsage?: number;
}

const isFeatureEnabled = (
    priceId: string,
    featureKey: FeatureKey,
    context?: FeatureContext
): boolean => {
    const plan = plans.find((plan) => plan.priceId === priceId);
    if (!plan) return false;

    const featureName = featureDefinitions[featureKey].name;
    const feature = plan.features.find((feature) => feature.name === featureName);
    if (!feature) return false;

    // Check if feature is enabled in plan
    if (!feature.enabled) return false;

    // Check dependencies
    if (feature.dependencies) {
        const missingDependencies = feature.dependencies.some(
            depKey => !isFeatureEnabled(priceId, depKey as FeatureKey, context)
        );
        if (missingDependencies) return false;
    }

    return true;
};

const getFeatureLimit = (
    priceId: string,
    featureKey: FeatureKey,
    context?: FeatureContext
): FeatureLimit | undefined => {
    const plan = plans.find((plan) => plan.priceId === priceId);
    const featureName = featureDefinitions[featureKey].name;
    const feature = plan?.features.find((feature) => feature.name === featureName);

    // Check for custom limits first
    if (context?.customLimits?.[featureKey]) {
        return context.customLimits[featureKey];
    }

    return feature?.limits;
};

export const validateFeatureUsage = async (
    subscriptionId: string,
    organizationId: string,
    priceId: string,
    featureKey: FeatureKey,
    newUsage: number,
    context?: FeatureContext
): Promise<FeatureAccessResponse> => {
    const limit = getFeatureLimit(priceId, featureKey, context);

    // If no limit or unlimited, update usage and allow
    if (!limit || limit.type === 'unlimited') {
        if (newUsage > 0) {
            await updateFeatureUsage({
                subscriptionId,
                organizationId,
                featureName: [featureKey],
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
        featureName: [featureKey],
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
    featureKey: FeatureKey;
    context?: FeatureContext;
}

export interface WithFeatureAccessParams {
    subscriptionId: string;
    organizationId?: string;
    userId?: string;
    priceId: string;
    featureKey: FeatureKey;
    context?: FeatureContext;
}

export interface FeatureAccessHandlers<T extends any[] = any[], R = any> {
    onGranted: (...args: T) => Promise<R>;
    onDenied?: (reason: string, currentUsage?: number) => Promise<R>;
}

export async function withFeatureAccess<T extends any[] = any[], R = any>(
    params: WithFeatureAccessParams,
    handlers: FeatureAccessHandlers<T, R>
): Promise<(...args: T) => Promise<R>> {
    return async (...args: T) => {
        const result = await hasFeatureAccess(
            params.subscriptionId,
            params.priceId,
            params.featureKey,
            params.organizationId,
            params.userId,
            params.context
        );

        if (result.allowed) {
            return handlers.onGranted(...args);
        }

        if (handlers.onDenied) {
            return handlers.onDenied(result.reason || 'Access denied', result.currentUsage);
        }

        throw new Error(result.reason || 'Access denied');
    };
}

export const hasFeatureAccess = async (
    subscriptionId: string,
    priceId: string,
    featureKey: FeatureKey,
    organizationId?: string,
    userId?: string,
    context?: FeatureContext
): Promise<FeatureAccessResponse> => {
    // First check if the feature is enabled for the plan
    if (!isFeatureEnabled(priceId, featureKey, context)) {
        return {
            allowed: false,
            reason: 'Feature not enabled for this plan'
        };
    }

    // Get current usage
    const usage = await getFeatureUsage({
        subscriptionId,
        featureName: featureKey,
        organizationId,
        userId
    });

    // If no usage record exists yet, create one with 0 usage
    if (!usage) {
        await updateFeatureUsage({
            subscriptionId,
            organizationId,
            userId,
            featureName: [featureKey],
            usage: 0
        });
        return { allowed: true, currentUsage: 0 };
    }

    const limit = getFeatureLimit(priceId, featureKey, context);
    const currentUsage = usage?.currentUsage ?? 0;

    // If no limit or unlimited type, allow
    if (!limit || limit.type === 'unlimited') {
        return { allowed: true, currentUsage };
    }

    // Check against limit
    if (currentUsage >= (limit.value || 0)) {
        return {
            allowed: false,
            reason: `Usage limit exceeded: ${currentUsage} ${limit.unit || ''} of ${limit.value} ${limit.unit || ''} used`,
            currentUsage
        };
    }

    return { allowed: true, currentUsage };
};
