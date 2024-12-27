import { handleSubscription, syncPolar } from "@/lib/payments";
import { updateSubscriptionLimits, initializeFeatures, updateSubscriptionLimitById } from "@/lib/plans/db/features";
import { featureDefinitions } from "@/lib/plans/rule-set";
import {
  validateEvent,
  WebhookVerificationError,
} from "@polar-sh/sdk/webhooks";
import { type NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    // Get the raw request body as text
    const requestBody = await request.text();
    console.log('Debug - Raw Request Body:', requestBody);

    // Parse the request body if it's not empty
    let jsonBody;
    try {
      jsonBody = requestBody ? JSON.parse(requestBody) : null;
      console.log('Debug - Parsed JSON Body:', jsonBody);
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
    console.log('Debug - Webhook Headers:', webhookHeaders);

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

      console.log("Debug - Validated Webhook Payload:", JSON.stringify(webhookPayload, null, 2));
    } catch (error) {
      console.error('Debug - Webhook validation error:', String(error));
      if (error instanceof WebhookVerificationError) {
        return new NextResponse("Webhook verification failed", { status: 403 });
      }
      return new NextResponse("Webhook validation failed", { status: 400 });
    }

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
        await updateSubscriptionLimitById(webhookPayload.data.priceId as string);
        break;

      // Subscription has been activated
      case "subscription.active":
        await handleSubscription(webhookPayload);
        await initializeFeatures({
          subscriptionId: webhookPayload.data.id as string,
          organizationId: webhookPayload.data.metadata?.organizationId as string,
          userId: webhookPayload.data.metadata?.userId as string,
          features: Object.keys(featureDefinitions) as (keyof typeof featureDefinitions)[],
        });
        break;

      // Subscription has been revoked/peroid has ended with no renewal
      case "subscription.revoked":
        await handleSubscription(webhookPayload);
        await updateSubscriptionLimitById(webhookPayload.data.priceId as string);
        break;

      // Subscription has been explicitly canceled by the user
      case "subscription.canceled":
        await handleSubscription(webhookPayload);
        break;

      // Product has been created
      case "product.created":
        console.log("Product created", webhookPayload.data);
        await syncPolar([webhookPayload.data]);
        await updateSubscriptionLimits();
        break;

      // Product has been updated
      case "product.updated":
        console.log("Product updated", webhookPayload.data);
        await syncPolar([webhookPayload.data]);
        await updateSubscriptionLimits();
        break;

      default:
        console.log(`Unhandled event type ${webhookPayload.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    // Safely log the error by converting it to a string
    console.error('Webhook processing error:', {
      error: String(error)
    });
    return new NextResponse("Internal server error", { status: 500 });
  }
}
