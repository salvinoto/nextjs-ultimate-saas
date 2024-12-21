'use server';

import { WebhookSubscriptionActivePayload, WebhookSubscriptionCanceledPayload, WebhookSubscriptionCreatedPayload, WebhookSubscriptionRevokedPayload, WebhookSubscriptionUpdatedPayload } from "@polar-sh/sdk/models/components";
import { WebhookProductCreatedPayload, WebhookProductUpdatedPayload } from "@polar-sh/sdk/models/components";
import { Product } from "@polar-sh/sdk/models/components/product";
import { linkSubscriptionToCustomer, upsertCustomer } from "@/lib/plans/db/customer";
import { PrismaClient } from "@prisma/client";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { updateSubscriptionLimits } from "./plans/db/features";
import { polar } from "@/polar";

const prisma = new PrismaClient();

type CustomerResult = {
    organization: NonNullable<Awaited<ReturnType<typeof auth.api.getFullOrganization>>> | null;
    user: NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>['user'];
    customer: NonNullable<Awaited<ReturnType<typeof prisma.customer.findFirst>>> | null;
} & (NonNullable<Awaited<ReturnType<typeof auth.api.getFullOrganization>>> | NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>['user']);

/**
 * Get the current customer from the session
 */
export async function getCurrentCustomer(): Promise<CustomerResult> {
    const session = await auth.api.getSession({
        headers: await headers()
    });
    const organization = await auth.api.getFullOrganization({
        headers: await headers(),
    });

    if (!session) {
        throw new Error("No session found");
    }

    const base = organization || session.user;

    // Fetch the customer data based on user or organization
    const customer = await prisma.customer.findFirst({
        where: {
            OR: [
                { userId: session.user.id },
                { organizationId: organization?.id }
            ]
        }
    });

    const result = Object.assign(base, {
        organization: organization || null,
        user: session.user,
        customer: customer || null,
    });

    return result as CustomerResult;
}

/**
 * Handle subscription events from webhook
 */
export async function handleSubscription(payload: WebhookSubscriptionActivePayload | WebhookSubscriptionCanceledPayload | WebhookSubscriptionCreatedPayload | WebhookSubscriptionRevokedPayload | WebhookSubscriptionUpdatedPayload) {
    if (!payload || !payload.data) {
        console.error('Invalid payload in handleSubscription:', payload);
        throw new Error("Invalid webhook payload");
    }

    const subData = payload.data;
    console.log('Processing subscription data:', JSON.stringify(subData, null, 2));

    try {
        // First, ensure the product exists if we have product data
        if (subData.productId && subData.product) {
            try {
                await handleProduct(payload);
            } catch (error) {
                console.error('Error handling product:', error);
                // Continue with subscription handling even if product fails
            }
        }

        // Then handle the subscription
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
                productId: subData.productId
            },
            create: {
                id: subData.id,
                createdAt: new Date(subData.createdAt!),
                modifiedAt: subData.modifiedAt ? new Date(subData.modifiedAt) : new Date(),
                userId: subData.metadata.userId as string,
                organizationId: subData.metadata.organizationId as string,
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
                priceId: subData.priceId,
                discountId: subData.discountId,
                checkoutId: subData.checkoutId,
                metadata: subData.metadata,
                customFieldData: subData.customFieldData
            }
        });

        // Try to upsert customer and link subscription, but don't fail if these operations fail
        try {
            await upsertCustomer(subData.customerId, subData.metadata.userId as string, subData.metadata.organizationId as string);
            await linkSubscriptionToCustomer({
                subscriptionId: subData.id,
                polarCustomerId: subData.customerId,
            });
        } catch (error) {
            console.error('Error handling customer operations:', error);
            // Continue since the main subscription operation succeeded
        }

        return subscription;
    } catch (error) {
        console.error('Error handling subscription:', error);
        throw error;
    }
}

/**
 * Handle product creation or update from webhook
 */
export async function handleProduct(payload: WebhookSubscriptionActivePayload | WebhookSubscriptionCanceledPayload | WebhookSubscriptionCreatedPayload | WebhookSubscriptionRevokedPayload | WebhookSubscriptionUpdatedPayload) {
    if (!payload || !payload.data) {
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

/**
 * Sync products from Polar to local database
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
    await updateSubscriptionLimits();
}

/**
 * Admin function to sync all products from Polar
 */
export async function adminSyncPolar() {
    const { result } = await polar.products.list({
        organizationId: process.env.POLAR_ORGANIZATION_ID!,
    });
    await syncPolar(result.items);
}