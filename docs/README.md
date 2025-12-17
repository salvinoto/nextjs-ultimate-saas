# Documentation

Welcome to the Next.js Ultimate SaaS documentation. This guide covers the core systems and how to use them.

## Guides

| Guide | Description |
|-------|-------------|
| [Metering](./metering.md) | Usage-based billing with Polar meters |

## Quick Links

### Metering (Usage-Based Billing)

Track customer usage and enforce plan limits:

```typescript
import { 
  trackApiRequest, 
  checkCurrentLimit, 
  withUsageLimit 
} from '@/lib/metering';

// Track usage
await trackApiRequest(customerId, '/api/endpoint');

// Check limits
const status = await checkCurrentLimit('api_requests');

// Protect actions
await withUsageLimit('ai_tokens', async () => {
  // Only runs if limit allows
});
```

### Authentication

Using Better Auth with organization support:

```typescript
import { auth } from '@/lib/auth';
import { getCurrentCustomer } from '@/lib/payments';

// Get current customer (user + organization context)
const { user, organization, billingEntityId } = await getCurrentCustomer();
```

### Payments

Polar integration for subscriptions:

```typescript
import { getActiveSubscription } from '@/lib/payments';

const subscription = await getActiveSubscription();
```

## Project Structure

```
lib/
├── auth.ts              # Better Auth configuration
├── auth-client.ts       # Client-side auth hooks
├── payments.ts          # Polar payments integration
├── metering/
│   ├── index.ts         # Unified exports
│   ├── client.ts        # Usage tracking functions
│   ├── limits.ts        # Limit checking functions
│   ├── types.ts         # TypeScript types
│   └── setup-meters.ts  # Meter setup script
├── permissions.ts       # RBAC roles and permissions
└── plans/
    └── db/
        └── customer.ts  # Customer database operations
```

## Environment Variables

Required for metering and payments:

```env
# Polar
POLAR_ACCESS_TOKEN=your_polar_access_token
POLAR_ORGANIZATION_ID=your_polar_org_id
POLAR_WEBHOOK_SECRET=your_webhook_secret
```

## Getting Started

1. Set up your environment variables
2. Run database migrations: `npx prisma migrate dev`
3. Create Polar meters: `npx dotenv -e .env.local -- npx tsx lib/metering/setup-meters.ts`
4. Add metered prices to your products in the Polar dashboard

> **Note:** The setup script uses `dotenv-cli` to load your `.env.local` file since `tsx` doesn't auto-load environment variables.
