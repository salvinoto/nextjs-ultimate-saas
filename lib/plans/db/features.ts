import { PrismaClient } from '@prisma/client';
import { featureDefinitions, type FeatureLimit, plans } from '../rule-set';
import { getCurrentCustomer } from '@/lib/payments';

type FeatureKey = keyof typeof featureDefinitions;

const prisma = new PrismaClient();

interface BaseUsageParams {
  subscriptionId: string;
  organizationId?: string;
  userId?: string;
}

interface RecordFeatureUsageParams extends BaseUsageParams {
  features: { name: FeatureKey; usage: number; limit?: FeatureLimit }[];
}

interface GetFeatureUsageParams extends BaseUsageParams {
  featureName: FeatureKey;
}

interface BillingPeriod {
  start: Date;
  end: Date;
}

/**
 * Calculate the billing period for a given date
 * @param date Optional date to calculate billing period for, defaults to current date
 * @returns Billing period start and end dates
 */
export const getBillingPeriod = (date: Date = new Date()): BillingPeriod => {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  return { start, end };
};

/**
 * Record usage for one or more features
 */
export const recordFeatureUsage = async ({
  subscriptionId,
  organizationId,
  userId,
  features
}: RecordFeatureUsageParams) => {
  if (!organizationId && !userId) {
    throw new Error('Either organizationId or userId must be provided');
  }

  if (organizationId && userId) {
    throw new Error('Provide either organizationId or userId, not both');
  }

  const period = getBillingPeriod();

  const updates = features.map(({ name, usage, limit }) =>
    prisma.featureUsage.upsert({
      where: {
        subscriptionId_featureName_periodStart_periodEnd: {
          subscriptionId,
          featureName: name,
          periodStart: period.start,
          periodEnd: period.end
        }
      },
      update: {
        currentUsage: usage,
        lastUpdated: new Date(),
        resetFrequency: limit?.resetFrequency,
        ...(organizationId ? { organizationId } : { userId })
      },
      create: {
        subscriptionId,
        organizationId: organizationId || null,
        userId: userId || null,
        featureName: name,
        currentUsage: usage,
        unit: limit?.unit,
        resetFrequency: limit?.resetFrequency,
        periodStart: period.start,
        periodEnd: period.end
      }
    })
  );

  return Promise.all(updates);
};

/**
 * Get current usage for a specific feature
 */
export const getFeatureUsage = async ({
  subscriptionId,
  featureName,
  organizationId,
  userId
}: GetFeatureUsageParams) => {
  const period = getBillingPeriod();

  return prisma.featureUsage.findFirst({
    where: {
      subscriptionId,
      featureName,
      periodStart: period.start,
      periodEnd: period.end,
      ...(organizationId && { organizationId }),
      ...(userId && { userId })
    }
  });
};

/**
 * Initialize usage tracking for new features
 */
export const initializeFeatures = async ({
  subscriptionId,
  organizationId,
  userId,
  features
}: BaseUsageParams & { features: FeatureKey[] }) => {
  try {
    if (!organizationId && !userId) {
      throw new Error('Either organizationId or userId must be provided');
    }

    if (organizationId && userId) {
      throw new Error('Provide either organizationId or userId, not both');
    }

    const period = getBillingPeriod();

    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      select: { priceId: true }
    });

    if (!subscription) {
      console.log(`No subscription found with ID: ${subscriptionId}`);
      return null;
    }

    const plan = plans.find(p => p.priceId === subscription.priceId);
    if (!plan) {
      console.log(`No plan found for price ID: ${subscription.priceId}`);
      return null;
    }

    const featureUsageData = features.map(featureKey => {
      const featureName = featureDefinitions[featureKey].name;
      const feature = plan.features.find(f => f.name === featureName);

      return {
        featureName,
        subscriptionId,
        organizationId,
        userId,
        currentUsage: 0,
        unit: feature?.limits?.unit,
        lastUpdated: new Date(),
        periodStart: period.start,
        periodEnd: period.end,
        resetFrequency: feature?.limits?.resetFrequency
      };
    });

    return prisma.featureUsage.createMany({
      data: featureUsageData,
      skipDuplicates: true,
    });
  } catch (error) {
    console.error('Error initializing features:', error);
    return null;
  }
};

/**
 * Get active subscription with current feature usage
 */
export async function getActiveSubscription() {
  const customer = await getCurrentCustomer();
  if (!customer.id) {
    throw new Error('No customer ID found');
  }

  const currentDate = new Date();

  return prisma.subscription.findFirst({
    where: {
      OR: [
        { userId: customer.id },
        { organizationId: customer.id }
      ],
      status: 'active',
      currentPeriodStart: { lte: currentDate },
      currentPeriodEnd: { gt: currentDate },
      endedAt: null
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

/**
 * Update feature limits for all active subscriptions
 */
export const updateSubscriptionLimits = async () => {
  const activeSubscriptions = await prisma.subscription.findMany({
    where: { status: 'active' },
    include: { product: true }
  });

  const limitUpdates = activeSubscriptions.flatMap(subscription => {
    const plan = plans.find(p => p.priceId === subscription.priceId);
    if (!plan) {
      console.warn(`No plan found for subscription: ${subscription.id}`);
      return [];
    }

    return plan.features
      .map(feature => {
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
      })
      .filter((update): update is NonNullable<typeof update> => update !== null);
  });

  return Promise.all(limitUpdates);
};

/**
 * Update feature limits for a specific subscription
 */
export const updateSubscriptionLimitById = async (subscriptionId: string) => {
  try {
    const subscription = await prisma.subscription.findFirst({
      where: {
        id: subscriptionId,
        status: 'active'
      },
      include: { product: true }
    });

    if (!subscription) {
      console.log(`No active subscription found with ID: ${subscriptionId}`);
      return [];
    }

    const plan = plans.find(p => p.priceId === subscription.priceId);
    if (!plan) {
      console.log(`No plan found for subscription: ${subscription.id}`);
      return [];
    }

    const limitUpdates = plan.features
      .map(feature => {
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
      })
      .filter((update): update is NonNullable<typeof update> => update !== null);

    return Promise.all(limitUpdates);
  } catch (error) {
    console.error('Error updating subscription limits:', error);
    return [];
  }
};