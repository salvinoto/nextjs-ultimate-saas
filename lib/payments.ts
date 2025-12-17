'use server';

import type { WebhookSubscriptionActivePayload } from "@polar-sh/sdk/models/components/webhooksubscriptionactivepayload.js";
import type { WebhookSubscriptionCanceledPayload } from "@polar-sh/sdk/models/components/webhooksubscriptioncanceledpayload.js";
import type { WebhookSubscriptionCreatedPayload } from "@polar-sh/sdk/models/components/webhooksubscriptioncreatedpayload.js";
import type { WebhookSubscriptionRevokedPayload } from "@polar-sh/sdk/models/components/webhooksubscriptionrevokedpayload.js";
import type { WebhookSubscriptionUpdatedPayload } from "@polar-sh/sdk/models/components/webhooksubscriptionupdatedpayload.js";
import type { Product } from "@polar-sh/sdk/models/components/product.js";
import { linkSubscriptionToCustomer, upsertCustomer, resolveExternalIdToBillingEntity } from "@/lib/plans/db/customer";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { polar } from "@/polar";

// ============================================
// Types
// ============================================

/**
 * Organization type from Better Auth
 */
export interface Organization {
    id: string;
    name: string;
    slug: string;
    createdAt: Date;
    logo?: string | null;
    metadata?: unknown;
}

/**
 * User type from session
 */
export type SessionUser = NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>['user'];

/**
 * Customer data from database
 */
export type CustomerData = Awaited<ReturnType<typeof prisma.customer.findFirst>>;

/**
 * Result from getCurrentCustomer - clean, simple interface
 */
export interface CurrentCustomer {
    /** The user from the session */
    user: SessionUser;
    /** The active organization (if any) */
    organization: Organization | null;
    /** The customer record from database (if exists) */
    customer: CustomerData;
    /** Convenience: ID of the billing entity (org or user) */
    billingEntityId: string;
    /** Convenience: Name of the billing entity */
    billingEntityName: string;
}

// ============================================
// Customer Functions
// ============================================

// Type assertion helper for organization API (Better Auth organization plugin)
const getFullOrganization = (auth.api as unknown as {
    getFullOrganization: (opts: { headers: Headers }) => Promise<Organization | null>
}).getFullOrganization;

/**
 * Get the current customer from the session.
 * Returns user, organization, and customer data in a clean interface.
 * 
 * @throws Error if no session found
 * 
 * @example
 * ```ts
 * const { user, organization, customer, billingEntityId } = await getCurrentCustomer();
 * await trackApiRequest(billingEntityId, '/api/generate');
 * ```
 */
export async function getCurrentCustomer(): Promise<CurrentCustomer> {
    const requestHeaders = await headers();
    
    const session = await auth.api.getSession({
        headers: requestHeaders
    });

    if (!session) {
        throw new Error("No session found");
    }

    const organization = await getFullOrganization({
        headers: requestHeaders,
    });

    // Fetch the customer data based on user or organization
    const customer = await prisma.customer.findFirst({
        where: {
            OR: [
                { userId: session.user.id },
                ...(organization?.id ? [{ organizationId: organization.id }] : [])
            ]
        }
    });

    // Use organization if active, otherwise user
    const billingEntityId = organization?.id ?? session.user.id;
    const billingEntityName = organization?.name ?? session.user.name;

    return {
        user: session.user,
        organization: organization ?? null,
        customer,
        billingEntityId,
        billingEntityName,
    };
}

/**
 * Get the active subscription for the current customer.
 * 
 * @returns The active subscription or null if none found
 */
export async function getActiveSubscription() {
    const { billingEntityId, organization } = await getCurrentCustomer();
    
    const currentDate = new Date();

    return prisma.subscription.findFirst({
        where: {
            OR: [
                { userId: billingEntityId },
                { organizationId: organization?.id }
            ],
            status: 'active',
            currentPeriodStart: { lte: currentDate },
            currentPeriodEnd: { gt: currentDate },
            endedAt: null
        },
        include: {
            product: true,
        },
        orderBy: {
            createdAt: 'desc'
        }
    });
}

// ============================================
// Webhook Handlers
// ============================================

type SubscriptionWebhookPayload = 
    | WebhookSubscriptionActivePayload 
    | WebhookSubscriptionCanceledPayload 
    | WebhookSubscriptionCreatedPayload 
    | WebhookSubscriptionRevokedPayload 
    | WebhookSubscriptionUpdatedPayload;

/**
 * Handle subscription events from Polar webhook.
 * Syncs subscription data to local database.
 * 
 * IMPORTANT: The user/org ID is extracted from customer.externalId, NOT from metadata.
 * The externalId is set during checkout creation via the externalCustomerId parameter.
 */
export async function handleSubscription(payload: SubscriptionWebhookPayload) {
    if (!payload?.data) {
        console.error('Invalid payload in handleSubscription:', payload);
        throw new Error("Invalid webhook payload");
    }

    const subData = payload.data;
    console.log('Processing subscription:', subData.id, subData.status);

    // Extract the external customer ID from the Polar customer object
    // This is the billingEntityId we set during checkout (user ID or org ID)
    const customer = subData.customer as { externalId?: string } | undefined;
    const externalId = customer?.externalId;

    if (!externalId) {
        console.error('No externalId found on customer. Subscription cannot be linked.', {
            subscriptionId: subData.id,
            customerId: subData.customerId,
        });
        throw new Error("Customer externalId is required to link subscription");
    }

    console.log('Resolving externalId:', externalId);

    // Resolve the externalId to determine if it's a user or organization
    const billingEntity = await resolveExternalIdToBillingEntity(externalId);

    if (!billingEntity.found) {
        console.error('Could not resolve externalId to user or organization:', externalId);
        throw new Error(`Could not find user or organization for externalId: ${externalId}`);
    }

    const { userId, organizationId } = billingEntity;
    console.log('Resolved billing entity:', { userId, organizationId });

    try {
        // Ensure the product exists if we have product data
        if (subData.productId && subData.product) {
            try {
                await handleProduct(payload);
            } catch (error) {
                console.error('Error handling product:', error);
            }
        }

        // Upsert the subscription with the resolved user/org IDs
        const subscription = await prisma.subscription.upsert({
            where: { id: subData.id },
            update: {
                modifiedAt: subData.modifiedAt ? new Date(subData.modifiedAt) : new Date(),
                status: subData.status,
                currentPeriodStart: new Date(subData.currentPeriodStart),
                currentPeriodEnd: new Date(subData.currentPeriodEnd!),
                cancelAtPeriodEnd: subData.cancelAtPeriodEnd,
                endedAt: subData.endedAt ? new Date(subData.endedAt) : null,
                metadata: subData.metadata,
                customFieldData: subData.customFieldData,
                productId: subData.productId,
                // Also update user/org on updates in case it changed
                userId,
                organizationId,
            },
            create: {
                id: subData.id,
                createdAt: new Date(subData.createdAt!),
                modifiedAt: subData.modifiedAt ? new Date(subData.modifiedAt) : new Date(),
                // Use resolved IDs from customer.externalId
                userId,
                organizationId,
                amount: subData.amount!,
                currency: subData.currency!,
                recurringInterval: subData.recurringInterval,
                status: subData.status,
                currentPeriodStart: new Date(subData.currentPeriodStart),
                currentPeriodEnd: new Date(subData.currentPeriodEnd!),
                cancelAtPeriodEnd: subData.cancelAtPeriodEnd,
                startedAt: new Date(subData.startedAt!),
                endedAt: subData.endedAt ? new Date(subData.endedAt) : null,
                productId: subData.productId,
                priceId: (subData as unknown as { priceId?: string }).priceId ?? subData.id,
                discountId: (subData as unknown as { discountId?: string }).discountId ?? null,
                checkoutId: (subData as unknown as { checkoutId?: string }).checkoutId ?? null,
                metadata: subData.metadata,
                customFieldData: subData.customFieldData
            }
        });

        // Link customer to subscription using resolved IDs
        try {
            await upsertCustomer(
                subData.customerId, 
                userId ?? undefined, 
                organizationId ?? undefined
            );
            await linkSubscriptionToCustomer({
                subscriptionId: subData.id,
                polarCustomerId: subData.customerId,
            });
        } catch (error) {
            console.error('Error handling customer operations:', error);
        }

        console.log('Successfully processed subscription:', subData.id);
        return subscription;
    } catch (error) {
        console.error('Error handling subscription:', error);
        throw error;
    }
}

/**
 * Handle product creation or update from webhook.
 */
export async function handleProduct(payload: SubscriptionWebhookPayload) {
    if (!payload?.data) {
        console.error('Invalid payload in handleProduct:', payload);
        throw new Error("Invalid webhook payload");
    }

    const subData = payload.data;

    if (!subData.productId || !subData.product) {
        console.log('No product data in payload, skipping product handling');
        return;
    }

    try {
        await prisma.product.upsert({
            where: { id: subData.productId },
            update: {
                modifiedAt: subData.product.modifiedAt ? new Date(subData.product.modifiedAt) : new Date(),
                name: subData.product.name,
                description: subData.product.description ?? '',
                isRecurring: subData.product.isRecurring,
                isArchived: subData.product.isArchived,
                polarOrganizationId: subData.product.organizationId,
                metadata: subData.product.metadata,
                attachedCustomFields: subData.product.attachedCustomFields
            },
            create: {
                id: subData.productId,
                createdAt: new Date(subData.product.createdAt),
                modifiedAt: subData.product.modifiedAt ? new Date(subData.product.modifiedAt) : new Date(),
                name: subData.product.name,
                description: subData.product.description ?? '',
                isRecurring: subData.product.isRecurring,
                isArchived: subData.product.isArchived,
                polarOrganizationId: subData.product.organizationId,
                metadata: subData.product.metadata,
                attachedCustomFields: subData.product.attachedCustomFields
            }
        });
    } catch (error) {
        console.error('Error upserting product:', error);
        throw error;
    }
}

// ============================================
// Product Sync
// ============================================

/**
 * Sync products from Polar to local database.
 */
export async function syncPolar(products: Product[]) {
    for (const product of products) {
        await prisma.product.upsert({
            where: { id: product.id },
            update: {
                modifiedAt: product.modifiedAt ? new Date(product.modifiedAt) : new Date(),
                name: product.name,
                description: product.description ?? '',
                isRecurring: product.isRecurring,
                isArchived: product.isArchived,
                polarOrganizationId: product.organizationId,
                metadata: product.metadata,
                attachedCustomFields: product.attachedCustomFields
            },
            create: {
                id: product.id,
                createdAt: new Date(product.createdAt),
                modifiedAt: product.modifiedAt ? new Date(product.modifiedAt) : new Date(),
                name: product.name,
                description: product.description ?? '',
                isRecurring: product.isRecurring,
                isArchived: product.isArchived,
                polarOrganizationId: product.organizationId,
                metadata: product.metadata,
                attachedCustomFields: product.attachedCustomFields
            }
        });
    }
}

/**
 * Admin function to sync all products from Polar.
 */
export async function adminSyncPolar() {
    const { result } = await polar.products.list({
        organizationId: process.env.POLAR_ORGANIZATION_ID!,
    });
    await syncPolar(result.items);
}
