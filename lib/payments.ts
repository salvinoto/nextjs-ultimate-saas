'use server';

import { WebhookSubscriptionActivePayload } from "@polar-sh/sdk/models/components/webhooksubscriptionactivepayload";
import { WebhookSubscriptionCanceledPayload } from "@polar-sh/sdk/models/components/webhooksubscriptioncanceledpayload";
import { WebhookSubscriptionCreatedPayload } from "@polar-sh/sdk/models/components/webhooksubscriptioncreatedpayload";
import { WebhookSubscriptionRevokedPayload } from "@polar-sh/sdk/models/components/webhooksubscriptionrevokedpayload";
import { WebhookSubscriptionUpdatedPayload } from "@polar-sh/sdk/models/components/webhooksubscriptionupdatedpayload";
import { Product } from "@polar-sh/sdk/models/components/product";
import { linkSubscriptionToCustomer, upsertCustomer } from "@/lib/plans/db/customer";
import { PrismaClient } from "@prisma/client";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { syncFeatureLimits, updateFeatureUsage } from "./plans/db/features";
import { polar } from "@/polar";

const prisma = new PrismaClient();

type CustomerResult = {
    organization: NonNullable<Awaited<ReturnType<typeof auth.api.getFullOrganization>>> | null;
    user: NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>['user'];
} & (NonNullable<Awaited<ReturnType<typeof auth.api.getFullOrganization>>> | NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>['user']);

export async function getCurrentCustomer(): Promise<CustomerResult> {
    const session = await auth.api.getSession({
        headers: await headers()
    })
    const organization = await auth.api.getFullOrganization({
        headers: await headers(),
    });

    if (!session) {
        throw new Error("No session");
    }

    const base = organization || session.user;
    const result = Object.assign(base, {
        organization: organization || null,
        user: session.user,
    });

    return result as CustomerResult;
}

// Webhook handlers
export async function handleSubscription(payload: WebhookSubscriptionActivePayload | WebhookSubscriptionCanceledPayload | WebhookSubscriptionCreatedPayload | WebhookSubscriptionRevokedPayload | WebhookSubscriptionUpdatedPayload) {
    if (!payload?.data) {
        throw new Error("No data in payload");
    }

    const subData = payload.data;

    // First, ensure the product exists in the database
    await handleProduct(payload);

    // Then create/update the subscription
    await prisma.subscription.upsert({
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
    await upsertCustomer(subData.customerId, subData.metadata.userId as string, subData.metadata.organizationId as string);
    await linkSubscriptionToCustomer({
        subscriptionId: subData.id,
        polarCustomerId: subData.customerId,
    });
}

export async function handleProduct(payload: WebhookSubscriptionActivePayload | WebhookSubscriptionCanceledPayload | WebhookSubscriptionCreatedPayload | WebhookSubscriptionRevokedPayload | WebhookSubscriptionUpdatedPayload) {
    if (!payload?.data) {
        throw new Error("No data in payload");
    }

    const subData = payload.data;

    // First, ensure the product exists in the database
    if (subData.productId && subData.product) {
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
    }
}

// Functions to call accross the app
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
    await syncFeatureLimits();
}

// Admin area functions
export async function adminSyncPolar() {
    const { result } = await polar.products.list({
        organizationId: process.env.POLAR_ORGANIZATION_ID!,
    });
    await syncPolar(result.items);
}