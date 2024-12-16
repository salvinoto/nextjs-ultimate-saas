import { PrismaClient } from '@prisma/client';
import { FeatureLimit } from './features';
import { getCurrentCustomer } from '@/lib/payments';

const prisma = new PrismaClient();

export interface UpdateFeatureUsageParams {
    subscriptionId: string;
    organizationId?: string;
    userId?: string;
    featureName: string;
    usage: number;
    limit?: FeatureLimit;
}

export interface GetFeatureUsageParams {
    subscriptionId: string;
    featureName: string;
    organizationId?: string;
    userId?: string;
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

    // Only include unit if the feature has a limit with a unit
    const unit = limit?.unit;

    return prisma.featureUsage.upsert({
        where: {
            subscriptionId_featureName_periodStart_periodEnd: {
                subscriptionId,
                featureName,
                periodStart,
                periodEnd
            }
        },
        update: {
            currentUsage: usage,
            lastUpdated: new Date()
        },
        create: {
            subscriptionId,
            organizationId,
            userId,
            featureName,
            currentUsage: usage,
            unit,
            periodStart,
            periodEnd
        }
    });
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