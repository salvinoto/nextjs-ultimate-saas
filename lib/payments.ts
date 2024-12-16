import { WebhookSubscriptionActivePayload } from "@polar-sh/sdk/models/components/webhooksubscriptionactivepayload";
import { WebhookSubscriptionCanceledPayload } from "@polar-sh/sdk/models/components/webhooksubscriptioncanceledpayload";
import { WebhookSubscriptionCreatedPayload } from "@polar-sh/sdk/models/components/webhooksubscriptioncreatedpayload";
import { WebhookSubscriptionRevokedPayload } from "@polar-sh/sdk/models/components/webhooksubscriptionrevokedpayload";
import { WebhookSubscriptionUpdatedPayload } from "@polar-sh/sdk/models/components/webhooksubscriptionupdatedpayload";
import {
    validateEvent,
} from "@polar-sh/sdk/webhooks";
import { PrismaClient } from "@prisma/client";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { updateFeatureUsage } from "./plans/db";

const prisma = new PrismaClient();

let webhookPayload: ReturnType<typeof validateEvent>;

type SubscriptionCustomFieldData = {
    userId?: string;
    organizationId?: string;
};

export async function getCurrentCustomer() {
    const session = await auth.api.getSession({
        headers: await headers()
    })
    const organization = await auth.api.getFullOrganization({
        headers: await headers(),
    });

    if (!session) {
        throw new Error("No session");
    }

    if (organization) {
        return organization;
    }

    return session.user;
}

export async function handleSubscription(payload: WebhookSubscriptionActivePayload | WebhookSubscriptionCanceledPayload | WebhookSubscriptionCreatedPayload | WebhookSubscriptionRevokedPayload | WebhookSubscriptionUpdatedPayload) {
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
}
