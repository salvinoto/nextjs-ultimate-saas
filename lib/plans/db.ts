import { PrismaClient } from '@prisma/client';
import { featureDefinitions, type FeatureLimit, plans } from './features';
import { getCurrentCustomer } from '@/lib/payments';

type FeatureKey = keyof typeof featureDefinitions;

const prisma = new PrismaClient();

export interface UpdateFeatureUsageParams {
    subscriptionId: string;
    organizationId?: string;
    userId?: string;
    featureName: FeatureKey[];
    usage: number;
    limit?: FeatureLimit;
}

export interface GetFeatureUsageParams {
    subscriptionId: string;
    featureName: FeatureKey;
    organizationId?: string;
    userId?: string;
}

export interface InitializeFeatureUsageParams {
    subscriptionId: string;
    organizationId?: string;
    userId?: string;
    features: FeatureKey[];
}

export const getCurrentBillingPeriod = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1); // First day of current month
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0); // Last day of current month
    return { start, end };
};

export const updateFeatureUsage = async ({
    subscriptionId,
    organizationId,
    userId,
    featureName,
    usage,
    limit
}: UpdateFeatureUsageParams) => {
    const { start: periodStart, end: periodEnd } = getCurrentBillingPeriod();

    if (!organizationId && !userId) {
        throw new Error('Either organizationId or userId must be provided');
    }

    if (organizationId && userId) {
        throw new Error('Cannot provide both organizationId and userId. Please provide only one.');
    }

    // Only include unit if the feature has a limit with a unit
    const unit = limit?.unit;

    const updates = featureName.map(name =>
        prisma.featureUsage.upsert({
            where: {
                subscriptionId_featureName_periodStart_periodEnd: {
                    subscriptionId,
                    featureName: name,
                    periodStart,
                    periodEnd
                }
            },
            update: {
                currentUsage: usage,
                lastUpdated: new Date(),
                ...(organizationId ? { organizationId } : { userId })
            },
            create: {
                subscriptionId,
                organizationId: organizationId || null,
                userId: userId || null,
                featureName: name,
                currentUsage: usage,
                unit,
                periodStart,
                periodEnd
            }
        })
    );

    return Promise.all(updates);
};

export const getFeatureUsage = async ({
    subscriptionId,
    featureName,
    organizationId,
    userId
}: GetFeatureUsageParams) => {
    const { start: periodStart, end: periodEnd } = getCurrentBillingPeriod();

    return prisma.featureUsage.findFirst({
        where: {
            subscriptionId,
            featureName,
            periodStart,
            periodEnd,
            ...(organizationId ? { organizationId } : {}),
            ...(userId ? { userId } : {})
        }
    });
};

export const initializeFeatureUsage = async ({
    subscriptionId,
    organizationId,
    userId,
    features
}: InitializeFeatureUsageParams) => {
    if (!organizationId && !userId) {
        throw new Error('Either organizationId or userId must be provided');
    }

    if (organizationId && userId) {
        throw new Error('Cannot provide both organizationId and userId');
    }

    const { start: periodStart, end: periodEnd } = getCurrentBillingPeriod();

    // Get the subscription to determine the plan
    const subscription = await prisma.subscription.findUnique({
        where: { id: subscriptionId },
        select: { priceId: true }
    });

    if (!subscription) {
        throw new Error('Subscription not found');
    }

    const plan = plans.find(p => p.priceId === subscription.priceId);
    if (!plan) {
        throw new Error('Plan not found');
    }

    // Create feature usage records in bulk
    const featureUsageData = features.map(featureKey => {
        const featureName = featureDefinitions[featureKey].name;
        const feature = plan.features.find(f => f.name === featureName);
        const limit = feature?.limits;

        return {
            id: undefined,
            featureName,
            subscriptionId,
            organizationId,
            userId,
            currentUsage: 0,
            unit: limit?.unit,
            lastUpdated: new Date(),
            periodStart,
            periodEnd,
            resetFrequency: null
        };
    });

    // Use createMany for bulk insertion
    await prisma.featureUsage.createMany({
        data: featureUsageData,
        skipDuplicates: true,
    });

    return featureUsageData;
};

// Fetch users current subscription from db
interface GetSubscriptionParams {
    userId?: string;
    organizationId?: string;
}

export async function getCurrentSubscription() {
    const customer = await getCurrentCustomer();

    if (!customer.id) {
        throw new Error('Either userId or organizationId must be provided');
    }

    const currentDate = new Date();

    return prisma.subscription.findFirst({
        where: {
            OR: [
                { userId: customer.id },
                { organizationId: customer.id }
            ],
            AND: [
                { status: 'active' },
                { currentPeriodStart: { lte: currentDate } },
                { currentPeriodEnd: { gt: currentDate } },
                { endedAt: null }
            ]
        },
        include: {
            product: true,
            FeatureUsage: {
                where: {
                    periodStart: { lte: currentDate },
                    periodEnd: { gt: currentDate }
                }
            }
        },
        orderBy: {
            createdAt: 'desc'
        }
    });
}

export const syncFeatureLimits = async () => {
    // Get all active subscriptions
    const subscriptions = await prisma.subscription.findMany({
        where: {
            status: 'active'
        },
        include: {
            product: true
        }
    });

    const updates = subscriptions.flatMap(subscription => {
        // Find the plan that matches the subscription's product
        const plan = plans.find(p => p.priceId === subscription.priceId);
        if (!plan) {
            console.warn(`Plan not found for subscription: ${subscription.id}`);
            return [];
        }

        // Create or update feature limits for each feature in the plan
        return plan.features.map(async feature => {
            const featureKey = Object.keys(featureDefinitions).find(
                key => featureDefinitions[key as FeatureKey].name === feature.name
            ) as FeatureKey;

            if (!featureKey) {
                console.warn(`Feature not found: ${feature.name}`);
                return null;
            }

            const defaultLimit = featureDefinitions[featureKey].defaultLimit;
            const featureLimit = (feature.limits || defaultLimit) as FeatureLimit;

            return prisma.featureLimit.upsert({
                where: {
                    subscriptionId_featureKey: {
                        subscriptionId: subscription.id,
                        featureKey
                    }
                },
                update: {
                    type: featureLimit.type,
                    value: featureLimit.value ?? null,
                    unit: featureLimit.unit ?? null,
                    updatedAt: new Date()
                },
                create: {
                    subscriptionId: subscription.id,
                    featureKey,
                    type: featureLimit.type,
                    value: featureLimit.value ?? null,
                    unit: featureLimit.unit ?? null
                }
            });
        });
    });

    // Filter out any null values and execute all updates
    const validUpdates = updates.filter(update => update !== null);
    return Promise.all(validUpdates);
};