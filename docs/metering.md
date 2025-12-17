# Usage-Based Billing with Polar Meters

This guide covers the metering system for tracking and billing customer usage. The system integrates with [Polar](https://polar.sh) for usage-based billing, providing automatic aggregation, billing period management, and real-time dashboards.

## Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
- [Setting Up Meters](#setting-up-meters)
- [Tracking Usage](#tracking-usage)
- [Checking Limits](#checking-limits)
- [Protecting Actions](#protecting-actions)
- [API Reference](#api-reference)
- [Best Practices](#best-practices)

---

## Overview

The metering system consists of three main components:

1. **Polar Meters** - Define what usage to track and how to aggregate it
2. **Event Tracking** - Send usage events to Polar when customers use features
3. **Limit Checking** - Verify customers haven't exceeded their plan limits

### Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Your App      │────▶│  Polar Events   │────▶│  Polar Meters   │
│                 │     │  API            │     │  (Aggregation)  │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                        │
                                                        ▼
                                                ┌─────────────────┐
                                                │  Polar Billing  │
                                                │  (Invoices)     │
                                                └─────────────────┘
```

### Available Meter Types

| Meter | Event Name | Aggregation | Use Case |
|-------|------------|-------------|----------|
| `api_requests` | `api.request` | count | API calls per billing period |
| `storage_gb` | `storage.update` | max(size_gb) | Peak storage used |
| `ai_tokens` | `ai.tokens` | sum(tokens) | Total AI tokens consumed |
| `team_seats` | `seat.active` | unique(user_id) | Active team members |

---

## Quick Start

### 1. Install and Configure

The metering module is already set up at `lib/metering`. Import what you need:

```typescript
import { 
  trackApiRequest,
  trackAiTokens,
  checkCurrentLimit,
  withUsageLimit 
} from '@/lib/metering';
```

### 2. Track Usage

```typescript
// In an API route
export async function POST(req: Request) {
  const { billingEntityId } = await getCurrentCustomer();
  
  // Track the API call
  await trackApiRequest(billingEntityId, '/api/generate');
  
  // Your logic here...
  return Response.json({ success: true });
}
```

### 3. Check Limits

```typescript
const status = await checkCurrentLimit('api_requests');

if (!status.allowed) {
  return Response.json({ error: status.reason }, { status: 429 });
}
```

---

## Setting Up Meters

### Option 1: Using the Setup Script

Run the setup script to create meters in your Polar account:

```bash
# Load env vars and run the setup script
npx dotenv -e .env.local -- npx tsx lib/metering/setup-meters.ts
```

> **Note:** The script uses your `POLAR_ACCESS_TOKEN` which should be an **organization-scoped token**. When using such a token, the organization is automatically determined—you don't need to pass `organizationId` explicitly.

### Option 2: Manual Setup in Polar Dashboard

1. Go to your [Polar Dashboard](https://polar.sh)
2. Navigate to **Meters**
3. Create each meter with the following configuration:

#### API Requests Meter
- **Name**: API Requests
- **Filter**: `name = "api.request"`
- **Aggregation**: Count

#### Storage Meter
- **Name**: Storage (GB)
- **Filter**: `name = "storage.update"`
- **Aggregation**: Max of `size_gb` property

#### AI Tokens Meter
- **Name**: AI Tokens
- **Filter**: `name = "ai.tokens"`
- **Aggregation**: Sum of `tokens` property

#### Team Seats Meter
- **Name**: Team Seats
- **Filter**: `name = "seat.active"`
- **Aggregation**: Unique count of `user_id` property

### Adding Metered Prices

After creating meters, add metered prices to your products:

1. Go to **Products** in your Polar dashboard
2. Edit a product
3. Add a **Metered Price**
4. Select the meter and set the price per unit

---

## Tracking Usage

### Core Function

```typescript
import { trackUsage } from '@/lib/metering';

// Generic tracking with any event name and properties
await trackUsage(
  'user_123',           // External customer ID (user or org ID)
  'api.request',        // Event name (must match meter filter)
  { endpoint: '/api/v1/generate', method: 'POST' }  // Properties
);
```

### Convenience Functions

#### Track API Requests

```typescript
import { trackApiRequest } from '@/lib/metering';

// Simple
await trackApiRequest('user_123', '/api/generate');

// With options
await trackApiRequest('user_123', '/api/generate', {
  method: 'POST',
  statusCode: 200,
  duration: 150  // milliseconds
});
```

#### Track Storage Updates

```typescript
import { trackStorageUpdate } from '@/lib/metering';

// Track current storage size (peak billing)
await trackStorageUpdate('org_456', 2.5);  // 2.5 GB

// With operation type
await trackStorageUpdate('org_456', 3.0, 'upload');
```

#### Track AI Token Usage

```typescript
import { trackAiTokens } from '@/lib/metering';

// Simple
await trackAiTokens('user_123', 1500);

// With details
await trackAiTokens('user_123', 1500, {
  model: 'gpt-4',
  type: 'total'  // 'input' | 'output' | 'total'
});
```

#### Track Team Seat Activity

```typescript
import { trackSeatActivity } from '@/lib/metering';

// Track unique user activity for seat counting
await trackSeatActivity('org_456', 'user_789');

// With action type
await trackSeatActivity('org_456', 'user_789', 'login');
```

### Batch Tracking

For efficiency when tracking multiple events:

```typescript
import { trackUsageBatch } from '@/lib/metering';

await trackUsageBatch([
  { externalCustomerId: 'user_123', eventName: 'api.request', properties: { endpoint: '/api/a' } },
  { externalCustomerId: 'user_123', eventName: 'api.request', properties: { endpoint: '/api/b' } },
  { externalCustomerId: 'user_123', eventName: 'ai.tokens', properties: { tokens: 500 } },
]);
```

---

## Checking Limits

### Check Current Customer's Limit

```typescript
import { checkCurrentLimit } from '@/lib/metering';

const status = await checkCurrentLimit('api_requests');

console.log(status);
// {
//   allowed: true,
//   current: 150,
//   limit: 1000,
//   remaining: 850
// }
```

### Check Specific Customer's Limit

```typescript
import { checkLimit } from '@/lib/metering';

const status = await checkLimit('user_123', 'storage_gb');

if (!status.allowed) {
  console.log(status.reason);
  // "Usage limit reached: 10/10 units used"
}
```

### Get All Usage

```typescript
import { getAllUsage } from '@/lib/metering';

const usage = await getAllUsage();
// {
//   api_requests: { allowed: true, current: 150, limit: 1000, remaining: 850 },
//   storage_gb: { allowed: true, current: 2.5, limit: 10, remaining: 7.5 },
//   ai_tokens: { allowed: false, current: 10000, limit: 10000, remaining: 0 },
//   team_seats: { allowed: true, current: 3, limit: 5, remaining: 2 }
// }
```

---

## Protecting Actions

### Using withUsageLimit

Wrap actions that should be gated by usage limits:

```typescript
import { withUsageLimit } from '@/lib/metering';

export async function generateContent(prompt: string) {
  return withUsageLimit('ai_tokens', async () => {
    // This only runs if the limit check passes
    const result = await callAI(prompt);
    
    // Track the usage after success
    await trackAiTokens(customerId, result.tokensUsed);
    
    return result;
  });
}
```

### Using withUsageLimitSafe

For graceful handling without exceptions:

```typescript
import { withUsageLimitSafe } from '@/lib/metering';

const result = await withUsageLimitSafe('storage_gb', async () => {
  return await uploadFile(file);
});

if (!result.success) {
  // Show upgrade modal or error message
  showUpgradeModal(result.error);
} else {
  // Use result.data
  console.log('Uploaded:', result.data);
}
```

### In API Routes

```typescript
import { checkCurrentLimit, trackApiRequest } from '@/lib/metering';
import { getCurrentCustomer } from '@/lib/payments';

export async function POST(req: Request) {
  const { billingEntityId } = await getCurrentCustomer();
  
  // Check limit before processing
  const status = await checkCurrentLimit('api_requests');
  if (!status.allowed) {
    return Response.json(
      { error: 'Rate limit exceeded', ...status },
      { status: 429 }
    );
  }
  
  // Track the usage
  await trackApiRequest(billingEntityId, '/api/process');
  
  // Process the request...
  return Response.json({ success: true });
}
```

### In Server Actions

```typescript
'use server';

import { withUsageLimit, trackAiTokens } from '@/lib/metering';
import { getCurrentCustomer } from '@/lib/payments';

export async function summarizeText(text: string) {
  const { billingEntityId } = await getCurrentCustomer();
  
  return withUsageLimit('ai_tokens', async () => {
    const result = await aiSummarize(text);
    await trackAiTokens(billingEntityId, result.tokensUsed);
    return result.summary;
  });
}
```

---

## API Reference

### Types

The metering module re-exports Polar SDK types and provides application-level abstractions:

```typescript
// ============================================
// Polar SDK Types (re-exported for convenience)
// ============================================
import type {
  Meter,              // Meter definition from Polar
  CustomerMeter,      // Customer's meter with usage data
  Customer,           // Polar customer
  EventsIngestResponse,
} from '@/lib/metering';

// ============================================
// Application Types
// ============================================

// Available meter identifiers (add yours here)
type MeterSlug = 'api_requests' | 'storage_gb' | 'ai_tokens' | 'team_seats';

// Event names that match meter filters
type EventName = 'api.request' | 'storage.update' | 'ai.tokens' | 'seat.active';

// Result from limit checks (wraps CustomerMeter)
interface UsageStatus {
  allowed: boolean;
  current: number;    // CustomerMeter.consumedUnits
  limit: number | null;    // CustomerMeter.creditedUnits
  remaining: number | null; // CustomerMeter.balance
  reason?: string;
}

// Result from tracking (wraps EventsIngestResponse)
interface TrackingResult {
  success: boolean;
  inserted?: number;  // EventsIngestResponse.inserted
  error?: string;
}

// Metadata value types (matches Polar's EventMetadataInput)
type MetadataValue = string | number | boolean;
```

### Tracking Functions

| Function | Description |
|----------|-------------|
| `trackUsage(customerId, eventName, properties?)` | Core tracking function |
| `trackUsageBatch(events[])` | Track multiple events at once |
| `trackApiRequest(customerId, endpoint, options?)` | Track API request |
| `trackStorageUpdate(customerId, sizeGb, operation?)` | Track storage usage |
| `trackAiTokens(customerId, tokens, options?)` | Track AI token usage |
| `trackSeatActivity(customerId, userId, action?)` | Track seat activity |

### Limit Functions

| Function | Description |
|----------|-------------|
| `checkLimit(customerId, meterSlug)` | Check limit for specific customer |
| `checkCurrentLimit(meterSlug)` | Check limit for current session customer |
| `withUsageLimit(meterSlug, action)` | Execute action if limit allows (throws on limit) |
| `withUsageLimitSafe(meterSlug, action)` | Execute action if limit allows (returns result object) |
| `getAllUsage()` | Get usage status for all meters |

---

## Best Practices

### 1. Track After Success

Track usage after the operation succeeds, not before:

```typescript
// Good
const result = await performOperation();
await trackUsage(customerId, 'operation', { ...result });

// Bad - tracks even if operation fails
await trackUsage(customerId, 'operation', {});
const result = await performOperation();  // might fail
```

### 2. Use Batch Tracking for Multiple Events

```typescript
// Good - single API call
await trackUsageBatch([
  { externalCustomerId: id, eventName: 'api.request', properties: { endpoint: '/a' } },
  { externalCustomerId: id, eventName: 'api.request', properties: { endpoint: '/b' } },
]);

// Less efficient - multiple API calls
await trackApiRequest(id, '/a');
await trackApiRequest(id, '/b');
```

### 3. Handle Errors Gracefully

```typescript
const result = await trackUsage(customerId, 'api.request', {});
if (!result.success) {
  // Log but don't block the user
  console.error('Failed to track usage:', result.error);
}
```

### 4. Use Organization ID for Team Features

```typescript
const { organization, user, billingEntityId } = await getCurrentCustomer();

// For organization-level features (storage, seats)
await trackStorageUpdate(organization?.id ?? user.id, sizeGb);

// billingEntityId automatically picks the right one
await trackApiRequest(billingEntityId, endpoint);
```

### 5. Check Limits Early

Check limits at the start of expensive operations:

```typescript
export async function expensiveAIOperation(input: string) {
  // Check first
  const status = await checkCurrentLimit('ai_tokens');
  if (!status.allowed) {
    throw new Error(status.reason);
  }
  
  // Then proceed with expensive operation
  const result = await runExpensiveAI(input);
  await trackAiTokens(customerId, result.tokens);
  return result;
}
```

---

## Troubleshooting

### Setup Script Fails with "Environment variable is required"

The `tsx` command doesn't automatically load `.env` files. Use `dotenv-cli` to load your environment:

```bash
npx dotenv -e .env.local -- npx tsx lib/metering/setup-meters.ts
```

### Setup Script Fails with "organization_id is disallowed"

If you see an error like `"Setting organization_id is disallowed when using an organization token"`, your `POLAR_ACCESS_TOKEN` is an **organization-scoped token**. This is correct—the setup script automatically handles this by not passing `organizationId` when creating meters.

Make sure you're using the latest version of `lib/metering/setup-meters.ts`.

### Events Not Showing in Polar

1. Verify your `POLAR_ACCESS_TOKEN` is correct
2. Check that the event name matches the meter filter exactly
3. Look at the Polar dashboard's event logs

### Limits Not Working

1. Ensure meters are created in Polar
2. Add metered prices to your products
3. Verify the customer has an active subscription

### Customer ID Issues

Use the `billingEntityId` from `getCurrentCustomer()` which automatically uses the organization ID when in an organization context:

```typescript
const { billingEntityId } = await getCurrentCustomer();
await trackApiRequest(billingEntityId, endpoint);
```

---

## Related Documentation

- [Polar Meters Documentation](https://docs.polar.sh/features/usage-based-billing/meters)
- [Polar Events API](https://docs.polar.sh/api-reference/events)
- [Authentication Guide](./authentication.md)
- [Payments Guide](./payments.md)
