import { handleSubscription } from "@/lib/payments";
import { syncFeatureLimits, updateFeatureUsage, initializeFeatureUsage } from "@/lib/plans/db/features";
import { featureDefinitions } from "@/lib/plans/rule-set";
import {
	validateEvent,
	WebhookVerificationError,
} from "@polar-sh/sdk/webhooks";
import { type NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
	const requestBody = await request.text();
	const webhookHeaders = {
		"webhook-id": request.headers.get("webhook-id") ?? "",
		"webhook-timestamp": request.headers.get("webhook-timestamp") ?? "",
		"webhook-signature": request.headers.get("webhook-signature") ?? "",
	};

	let webhookPayload: ReturnType<typeof validateEvent>;
	try {
		webhookPayload = validateEvent(
			requestBody,
			webhookHeaders,
			process.env.POLAR_WEBHOOK_SECRET ?? "",
		);
	} catch (error) {
		if (error instanceof WebhookVerificationError) {
			return new NextResponse("", { status: 403 });
		}
		throw error;
	}

	console.log("Incoming Webhook", webhookPayload.type);

	// Handle the event
	switch (webhookPayload.type) {
		// Checkout has been created
		case "checkout.created":
			break;

		// Checkout has been updated - this will be triggered when checkout status goes from confirmed -> succeeded
		case "checkout.updated":
			break;

		// Subscription has been created
		case "subscription.created":
			await handleSubscription(webhookPayload);
			break;

		// A catch-all case to handle all subscription webhook events
		case "subscription.updated":
			await handleSubscription(webhookPayload);
			break;

		// Subscription has been activated
		case "subscription.active":
			await handleSubscription(webhookPayload);
			await initializeFeatureUsage({
				subscriptionId: webhookPayload.data.priceId,
				organizationId: webhookPayload.data.metadata?.organizationId as string,
				userId: webhookPayload.data.metadata?.userId as string,
				features: Object.keys(featureDefinitions) as (keyof typeof featureDefinitions)[],
			});
			break;

		// Subscription has been revoked/peroid has ended with no renewal
		case "subscription.revoked":
			await handleSubscription(webhookPayload);
			await initializeFeatureUsage({
				subscriptionId: webhookPayload.data.priceId,
				organizationId: webhookPayload.data.metadata?.organizationId as string,
				userId: webhookPayload.data.metadata?.userId as string,
				features: Object.keys(featureDefinitions) as (keyof typeof featureDefinitions)[],
			});
			break;

		// Subscription has been explicitly canceled by the user
		case "subscription.canceled":
			await handleSubscription(webhookPayload);
			break;

		// Product has been created
		case "product.created":
			await syncFeatureLimits();
			break;

		// Product has been updated
		case "product.updated":
			await syncFeatureLimits();
			break;

		default:
			console.log(`Unhandled event type ${webhookPayload.type}`);
	}

	return NextResponse.json({ received: true });
}
