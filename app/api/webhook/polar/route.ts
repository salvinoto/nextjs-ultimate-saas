import { handleSubscription, syncPolar } from "@/lib/payments";
import {
	validateEvent,
	WebhookVerificationError,
} from "@polar-sh/sdk/webhooks";
import { type NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
	try {
		// Get the raw request body as text
		const requestBody = await request.text();

		// Parse the request body if it's not empty
		let jsonBody;
		try {
			jsonBody = requestBody ? JSON.parse(requestBody) : null;
			console.log('Webhook received:', jsonBody?.type);
		} catch (e) {
			console.error('Failed to parse webhook body:', String(e));
			return new NextResponse("Invalid JSON payload", { status: 400 });
		}

		// Get webhook headers
		const webhookHeaders = {
			"webhook-id": request.headers.get("webhook-id") ?? "",
			"webhook-timestamp": request.headers.get("webhook-timestamp") ?? "",
			"webhook-signature": request.headers.get("webhook-signature") ?? "",
		};

		// Validate webhook secret
		const webhookSecret = process.env.POLAR_WEBHOOK_SECRET;
		if (!webhookSecret) {
			console.error('Missing POLAR_WEBHOOK_SECRET environment variable');
			return new NextResponse("Configuration error", { status: 500 });
		}

		// Validate the webhook event
		let webhookPayload;
		try {
			webhookPayload = validateEvent(
				requestBody,
				webhookHeaders,
				webhookSecret
			);

			if (!webhookPayload || typeof webhookPayload !== 'object') {
				console.error('Invalid webhook payload after validation:', webhookPayload);
				return new NextResponse("Invalid webhook payload", { status: 400 });
			}
		} catch (error) {
			console.error('Webhook validation error:', String(error));
			if (error instanceof WebhookVerificationError) {
				return new NextResponse("Webhook verification failed", { status: 403 });
			}
			return new NextResponse("Webhook validation failed", { status: 400 });
		}

		// Handle the event
		// Note: Metering is now handled by Polar's built-in meters.
		// We only sync subscription and product data for local reference.
		switch (webhookPayload.type) {
			// Checkout events
			case "checkout.created":
			case "checkout.updated":
				// No action needed - checkout is handled by redirect
				break;

			// Subscription lifecycle events
			case "subscription.created":
			case "subscription.active":
			case "subscription.updated":
			case "subscription.revoked":
			case "subscription.canceled":
				await handleSubscription(webhookPayload);
				break;

			// Product sync events
			case "product.created":
			case "product.updated":
				console.log(`Product ${webhookPayload.type.split('.')[1]}:`, webhookPayload.data.name);
				await syncPolar([webhookPayload.data]);
				break;

			default:
				// Log unhandled events (including meter events like meter.reset, meter.credited)
				console.log(`Unhandled event type: ${webhookPayload.type}`);
		}

		return NextResponse.json({ received: true });
	} catch (error) {
		console.error('Webhook processing error:', String(error));
		return new NextResponse("Internal server error", { status: 500 });
	}
}
