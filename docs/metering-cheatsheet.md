# Metering Cheatsheet

Quick reference for the usage-based billing system.

## Imports

```typescript
// All-in-one import
import { 
  // Tracking
  trackUsage,
  trackUsageBatch,
  trackApiRequest,
  trackStorageUpdate,
  trackAiTokens,
  trackSeatActivity,
  // Limits
  checkLimit,
  checkCurrentLimit,
  withUsageLimit,
  withUsageLimitSafe,
  getAllUsage,
  // Application Types
  type MeterSlug,
  type UsageStatus,
  type TrackingResult,
  // Polar SDK Types (re-exported)
  type Meter,
  type CustomerMeter,
  type Customer,
} from '@/lib/metering';

// Customer info
import { getCurrentCustomer } from '@/lib/payments';
```

## Track Usage

```typescript
const { billingEntityId } = await getCurrentCustomer();

// API requests
await trackApiRequest(billingEntityId, '/api/endpoint');
await trackApiRequest(billingEntityId, '/api/endpoint', { method: 'POST', duration: 150 });

// Storage (GB)
await trackStorageUpdate(billingEntityId, 2.5);
await trackStorageUpdate(billingEntityId, 3.0, 'upload');

// AI tokens
await trackAiTokens(billingEntityId, 1500);
await trackAiTokens(billingEntityId, 1500, { model: 'gpt-4', type: 'output' });

// Team seats
await trackSeatActivity(orgId, userId);
await trackSeatActivity(orgId, userId, 'login');

// Generic
await trackUsage(billingEntityId, 'api.request', { endpoint: '/api/test' });

// Batch
await trackUsageBatch([
  { externalCustomerId: id, eventName: 'api.request', properties: { endpoint: '/a' } },
  { externalCustomerId: id, eventName: 'api.request', properties: { endpoint: '/b' } },
]);
```

## Check Limits

```typescript
// Current customer
const status = await checkCurrentLimit('api_requests');
// status: { allowed: boolean, current: number, limit: number | null, remaining: number | null }

// Specific customer
const status = await checkLimit('user_123', 'storage_gb');

// All meters
const allUsage = await getAllUsage();
// { api_requests: UsageStatus, storage_gb: UsageStatus, ai_tokens: UsageStatus, team_seats: UsageStatus }
```

## Protect Actions

```typescript
// Throws if limit exceeded
await withUsageLimit('ai_tokens', async () => {
  const result = await doExpensiveOperation();
  await trackAiTokens(customerId, result.tokens);
  return result;
});

// Returns result object (no throw)
const result = await withUsageLimitSafe('storage_gb', async () => {
  return await uploadFile(file);
});

if (result.success) {
  console.log(result.data);
} else {
  console.error(result.error);  // "Usage limit exceeded..."
}
```

## In API Routes

```typescript
export async function POST(req: Request) {
  const { billingEntityId } = await getCurrentCustomer();
  
  // Check limit
  const status = await checkCurrentLimit('api_requests');
  if (!status.allowed) {
    return Response.json({ error: status.reason }, { status: 429 });
  }
  
  // Process request...
  
  // Track usage (after success)
  await trackApiRequest(billingEntityId, '/api/process');
  
  return Response.json({ success: true });
}
```

## In Server Actions

```typescript
'use server';

export async function generateSummary(text: string) {
  const { billingEntityId } = await getCurrentCustomer();
  
  return withUsageLimit('ai_tokens', async () => {
    const result = await callAI(text);
    await trackAiTokens(billingEntityId, result.tokens);
    return result.summary;
  });
}
```

## Meter Types

| Slug | Event Name | What it Tracks |
|------|------------|----------------|
| `api_requests` | `api.request` | Count of API calls |
| `storage_gb` | `storage.update` | Peak storage (GB) |
| `ai_tokens` | `ai.tokens` | Sum of tokens |
| `team_seats` | `seat.active` | Unique users |

## Setup

```bash
# Create meters in Polar (use dotenv to load env vars)
npx dotenv -e .env.local -- npx tsx lib/metering/setup-meters.ts

# Then add metered prices to products in Polar dashboard
```

> **Note:** Uses your org-scoped `POLAR_ACCESS_TOKEN` to auto-detect the organization.
