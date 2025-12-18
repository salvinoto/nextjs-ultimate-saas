# Documentation

Welcome to the Next.js Ultimate SaaS documentation. This guide covers the core systems and how to use them.

## Guides

| Guide | Description |
|-------|-------------|
| [Setup Wizard](./setup.md) | First-time setup and configuration |
| [Metering](./metering.md) | Usage-based billing with Polar meters |

## Quick Links

### Setup Wizard

Configure your development environment with the interactive setup wizard:

```bash
# Option 1: Web UI (auto-redirects if unconfigured)
npm run dev

# Option 2: CLI
npm run setup
```

The setup wizard configures:
- Database (PostgreSQL)
- Authentication (Better Auth)
- Email (Resend)
- Payments (Polar)
- Social OAuth providers

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
├── setup/               # Setup wizard utilities
│   ├── index.ts         # Module exports
│   ├── config.ts        # Configuration checking (server-only)
│   ├── types.ts         # TypeScript types
│   ├── validation.ts    # Client-safe validation
│   └── actions.ts       # Server actions
├── permissions.ts       # RBAC roles and permissions
└── plans/
    └── db/
        └── customer.ts  # Customer database operations

app/
└── setup/               # Setup wizard pages
    ├── layout.tsx
    └── page.tsx

components/
└── setup/               # Setup wizard components
    ├── setup-wizard.tsx
    └── steps/
        ├── welcome-step.tsx
        ├── database-step.tsx
        ├── auth-step.tsx
        ├── email-step.tsx
        ├── payments-step.tsx
        └── complete-step.tsx

scripts/
├── setup.ts             # CLI setup wizard
└── setup-check.ts       # Pre-dev check
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

### First-Time Setup

Run the setup wizard to configure your environment:

```bash
npm run dev
```

If `.env.local` is missing, you'll be redirected to the setup wizard at `http://localhost:3000/setup`.

Alternatively, use the CLI:

```bash
npm run setup
```

See the [Setup Wizard Guide](./setup.md) for detailed instructions.

### After Setup

1. Restart the dev server to apply configuration
2. Run database migrations if not done during setup: `npx prisma db push`
3. Create Polar meters: `npx dotenv -e .env.local -- npx tsx lib/metering/setup-meters.ts`
4. Add metered prices to your products in the Polar dashboard

> **Note:** The setup script uses `dotenv-cli` to load your `.env.local` file since `tsx` doesn't auto-load environment variables.
