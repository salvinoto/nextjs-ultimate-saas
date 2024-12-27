import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function upsertCustomer(polarCustomerId: string, userId?: string, organizationId?: string) {
  if (!userId && !organizationId) {
    throw new Error('Either userId or organizationId must be provided')
  }

  const identifier = userId ? { userId } : { organizationId }

  return await prisma.customer.upsert({
    where: {
      polarCustomerId,
    },
    create: {
      polarCustomerId,
      ...identifier
    },
    update: {
      ...identifier
    },
    include: {
      subscriptions: true,
      user: true,
      organization: true,
    },
  })
}

// Get customer with active subscription
export async function getCustomerWithActiveSubscription(polarCustomerId: string) {
  return await prisma.customer.findUnique({
    where: {
      polarCustomerId,
    },
    include: {
      subscriptions: {
        where: {
          AND: [
            { status: 'active' },
            { currentPeriodEnd: { gt: new Date() } },
            { cancelAtPeriodEnd: false },
          ],
        },
      },
      user: true,
      organization: true,
    },
  })
}

// Link subscription to customer
export async function linkSubscriptionToCustomer({
  subscriptionId,
  polarCustomerId,
}: {
  subscriptionId: string
  polarCustomerId: string
}) {
  try {
    const customer = await prisma.customer.findUnique({
      where: { polarCustomerId },
    });

    if (!customer) {
      console.log('Customer not found, skipping subscription link');
      return null;
    }

    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
    });

    if (!subscription) {
      console.log('Subscription not found, skipping link');
      return null;
    }

    return await prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        customerId: customer.id,
      },
      include: {
        customer: true,
      },
    });
  } catch (error) {
    console.error('Error linking subscription to customer:', error);
    // Don't throw, just return null since this is a non-critical operation
    return null;
  }
}