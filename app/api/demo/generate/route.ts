/**
 * Demo API Route with Metering
 *
 * This API route demonstrates the complete metering flow:
 * 1. Authenticate the request using Better Auth
 * 2. Get the billing entity ID (user or organization)
 * 3. Check usage limits before processing
 * 4. Process the request
 * 5. Track usage after success
 *
 * Usage:
 * POST /api/demo/generate
 * Body: { "prompt": "Your text here", "maxTokens": 100 }
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentCustomer } from "@/lib/payments";
import {
  checkCurrentLimit,
  trackApiRequest,
  trackAiTokens,
} from "@/lib/metering";

interface GenerateRequest {
  prompt: string;
  maxTokens?: number;
}

interface GenerateResponse {
  success: boolean;
  content?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  error?: string;
  remaining?: {
    apiRequests: number | null;
    aiTokens: number | null;
  };
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<GenerateResponse>> {
  const startTime = Date.now();

  // Step 1: Authenticate and get customer context
  let customer;
  try {
    customer = await getCurrentCustomer();
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: "Unauthorized. Please sign in.",
      },
      { status: 401 }
    );
  }

  const { billingEntityId } = customer;

  // Step 2: Check API request limit
  const apiStatus = await checkCurrentLimit("api_requests");
  if (!apiStatus.allowed) {
    return NextResponse.json(
      {
        success: false,
        error: apiStatus.reason || "API request limit exceeded",
        remaining: {
          apiRequests: apiStatus.remaining,
          aiTokens: null,
        },
      },
      { status: 429 }
    );
  }

  // Step 3: Check AI token limit
  const tokenStatus = await checkCurrentLimit("ai_tokens");
  if (!tokenStatus.allowed) {
    return NextResponse.json(
      {
        success: false,
        error: tokenStatus.reason || "AI token limit exceeded",
        remaining: {
          apiRequests: apiStatus.remaining,
          aiTokens: tokenStatus.remaining,
        },
      },
      { status: 429 }
    );
  }

  // Step 4: Parse and validate request body
  let body: GenerateRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: "Invalid JSON body",
      },
      { status: 400 }
    );
  }

  if (!body.prompt || typeof body.prompt !== "string") {
    return NextResponse.json(
      {
        success: false,
        error: "Missing or invalid 'prompt' field",
      },
      { status: 400 }
    );
  }

  const maxTokens = body.maxTokens ?? 100;

  // Step 5: Simulate AI generation
  // In a real app, you would call OpenAI, Anthropic, etc. here
  await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate latency

  // Calculate simulated token usage
  const promptTokens = Math.ceil(body.prompt.length / 4);
  const completionTokens = Math.min(
    Math.floor(Math.random() * maxTokens) + 20,
    maxTokens
  );
  const totalTokens = promptTokens + completionTokens;

  // Generate mock response
  const mockResponses = [
    "Based on your query, I've analyzed the available data and generated this response.",
    "Here's a thoughtful answer to your question, taking into account various perspectives.",
    "After processing your input, I've prepared this comprehensive response for you.",
    "This is a demo response showcasing how the metering system tracks AI token usage.",
  ];
  const content = mockResponses[Math.floor(Math.random() * mockResponses.length)];

  // Step 6: Track usage AFTER successful processing
  const duration = Date.now() - startTime;

  // Track API request
  await trackApiRequest(billingEntityId, "/api/demo/generate", {
    method: "POST",
    statusCode: 200,
    duration,
  });

  // Track AI token usage
  await trackAiTokens(billingEntityId, totalTokens, {
    model: "demo-gpt-4",
    type: "total",
  });

  // Step 7: Return successful response with usage info
  return NextResponse.json({
    success: true,
    content,
    usage: {
      promptTokens,
      completionTokens,
      totalTokens,
    },
    remaining: {
      apiRequests: apiStatus.remaining !== null ? apiStatus.remaining - 1 : null,
      aiTokens:
        tokenStatus.remaining !== null
          ? tokenStatus.remaining - totalTokens
          : null,
    },
  });
}

/**
 * GET handler to check current usage without consuming quota.
 * Useful for displaying usage in UI before making requests.
 */
export async function GET(): Promise<NextResponse> {
  try {
    const customer = await getCurrentCustomer();

    const [apiStatus, tokenStatus] = await Promise.all([
      checkCurrentLimit("api_requests"),
      checkCurrentLimit("ai_tokens"),
    ]);

    return NextResponse.json({
      success: true,
      billingEntity: {
        id: customer.billingEntityId,
        name: customer.billingEntityName,
        type: customer.organization ? "organization" : "user",
      },
      usage: {
        apiRequests: {
          current: apiStatus.current,
          limit: apiStatus.limit,
          remaining: apiStatus.remaining,
          allowed: apiStatus.allowed,
        },
        aiTokens: {
          current: tokenStatus.current,
          limit: tokenStatus.limit,
          remaining: tokenStatus.remaining,
          allowed: tokenStatus.allowed,
        },
      },
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: "Unauthorized",
      },
      { status: 401 }
    );
  }
}
