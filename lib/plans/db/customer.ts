import { prisma } from "@/lib/db"

/**
 * Result of resolving an external ID to user or organization
 */
export interface ResolvedBillingEntity {
    /** The user ID if the external ID maps to a user */
    userId: string | null;
    /** The organization ID if the external ID maps to an organization */
    organizationId: string | null;
    /** Whether the entity was found */
    found: boolean;
}

/**
 * Resolve an external ID (from Polar's customer.externalId) to determine
 * if it's a user ID or organization ID in our database.
 * 
 * The externalId is set during checkout as the billingEntityId which is
 * either the organization ID (if in org context) or user ID.
 * 
 * @param externalId - The external ID from Polar (your user/org ID)
 * @returns Object with userId or organizationId populated based on what was found
 */
export async function resolveExternalIdToBillingEntity(
    externalId: string
): Promise<ResolvedBillingEntity> {
    // First try to find an organization with this ID
    const organization = await prisma.organization.findUnique({
        where: { id: externalId },
        select: { id: true }
    });

    if (organization) {
        return {
            userId: null,
            organizationId: organization.id,
            found: true
        };
    }

    // If not an organization, try to find a user with this ID
    const user = await prisma.user.findUnique({
        where: { id: externalId },
        select: { id: true }
    });

    if (user) {
        return {
            userId: user.id,
            organizationId: null,
            found: true
        };
    }

    // ID not found in either table
    console.warn(`External ID ${externalId} not found in users or organizations`);
    return {
        userId: null,
        organizationId: null,
        found: false
    };
}

/**
 * Find a local customer record by Polar customer ID.
 * Used as a fallback when the Polar customer doesn't have an externalId set.
 * 
 * @param polarCustomerId - The Polar customer ID
 * @returns The customer record with userId and organizationId, or null if not found
 */
export async function findLocalCustomerByPolarId(polarCustomerId: string) {
    return await prisma.customer.findUnique({
        where: { polarCustomerId },
        select: {
            id: true,
            userId: true,
            organizationId: true,
        }
    });
}

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