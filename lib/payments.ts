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

const prisma = new PrismaClient();

let webhookPayload: ReturnType<typeof validateEvent>;

export async function getCustomer() {
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
    if (!payload.data) {
        throw new Error("No data in payload");
    }

    const customer = await getCustomer();

    const subData = payload.data;

    await prisma.subscription.upsert({
        where: { id: subData.id },
        update: {
            modifiedAt: new Date(subData.modifiedAt!),
            status: subData.status,
            currentPeriodStart: new Date(subData.currentPeriodStart),
            currentPeriodEnd: new Date(subData.currentPeriodEnd!),
            cancelAtPeriodEnd: subData.cancelAtPeriodEnd,
            endedAt: subData.endedAt ? new Date(subData.endedAt) : null,
            metadata: subData.metadata,
            customFieldData: subData.customFieldData
        },
        create: {
            id: subData.id,
            createdAt: new Date(subData.createdAt!),
            modifiedAt: new Date(subData.modifiedAt!),
            // Set either userId or organizationId based on your logic and the webhook data
            userId: customer.id,
            organizationId: customer.id,
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
