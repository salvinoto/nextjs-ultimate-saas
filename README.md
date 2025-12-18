# Next.js Ultimate SaaS Template

A complete, production-ready SaaS starter with authentication, payments, usage-based billing, and organizations—built with modern best practices and designed for rapid development.

[![Next.js 15](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=flat-square&logo=prisma)](https://www.prisma.io/)
[![Better Auth](https://img.shields.io/badge/Better%20Auth-Secure-green?style=flat-square)](https://better-auth.com/)
[![Polar](https://img.shields.io/badge/Polar-Payments-blue?style=flat-square)](https://polar.sh/)

---

## ✨ Why This Template?

**Ship faster.** Stop wiring up authentication, payments, and metering from scratch. This template gives you a complete SaaS foundation with:

- 🎨 **Beautiful UI** - Modern, responsive design with 50+ shadcn/ui components
- ⚡ **5-Minute Setup** - Interactive setup wizard configures everything automatically
- 🔐 **Enterprise Auth** - Email, OAuth, 2FA, passkeys, and RBAC out of the box
- 💳 **Revenue Ready** - Subscriptions and usage-based billing with Polar
- 🏢 **Team Features** - Organizations, invitations, and role-based permissions
- 📊 **Usage Metering** - Track API calls, storage, AI tokens, and team seats
- 🛡️ **Type-Safe** - End-to-end TypeScript with Prisma ORM
- 📦 **Zero Config** - Lazy initialization means your app works even without .env

---

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone [your-repo-url] my-saas-app
cd my-saas-app
npm install
```

### 2. Run Setup Wizard

```bash
npm run dev
```

Visit `http://localhost:3000` and the setup wizard will automatically launch! No manual `.env` editing needed.

**Or use the CLI wizard:**

```bash
npm run setup
```

Both wizards guide you through:
- ✅ Database configuration (PostgreSQL)
- ✅ Authentication setup (Better Auth)
- ✅ Email service (Resend)
- ✅ Payments (Polar)
- ✅ OAuth providers (Google, GitHub, Discord, Microsoft)

### 3. Start Building

That's it! Your database is migrated, services are connected, and you're ready to ship.

```bash
npm run dev        # Start development server
npm run dev:secure # Start with HTTPS (for passkeys/WebAuthn)
```

---

## 🎯 Core Features

### 🔐 Authentication (Better Auth)

Full authentication system with modern security features:

- **Email/Password** - Traditional authentication with secure password hashing
- **OAuth Providers** - Google, GitHub, Discord, Microsoft
- **Two-Factor Auth** - TOTP-based 2FA
- **Passkeys** - WebAuthn/Passkey support for passwordless authentication
- **Magic Links** - Passwordless email authentication
- **Password Reset** - Secure password recovery flow
- **Session Management** - IP and user agent tracking
- **RBAC** - Role-based access control (Owner, Admin, Member)

```typescript
// Getting the current user is this easy
import { getCurrentCustomer } from '@/lib/payments';

const { user, organization, billingEntityId } = await getCurrentCustomer();
```

### 💳 Payments & Subscriptions (Polar)

Complete payment infrastructure powered by Polar:

- **Subscription Management** - Recurring billing with plan tiers
- **Usage-Based Billing** - Meter and charge for actual usage
- **Customer Portal** - Self-service billing management
- **Webhook Handling** - Automatic subscription status updates
- **Multiple Plans** - Free, Pro, Enterprise tiers
- **Upgrade/Downgrade** - Seamless plan changes

```typescript
// Get active subscription
import { getActiveSubscription } from '@/lib/payments';

const subscription = await getActiveSubscription();
```

### 📊 Usage Metering

Track what your customers use and bill accordingly:

| Meter | Tracks | Aggregation |
|-------|--------|-------------|
| 🔌 **API Requests** | API calls per billing period | Count |
| 💾 **Storage** | Peak storage used (GB) | Maximum |
| 🤖 **AI Tokens** | Total AI tokens consumed | Sum |
| 👥 **Team Seats** | Active team members | Unique count |

**Track usage with one line:**

```typescript
import { trackApiRequest, trackAiTokens, trackStorageUpdate } from '@/lib/metering';

await trackApiRequest(billingEntityId, '/api/generate');
await trackAiTokens(billingEntityId, 1500);
await trackStorageUpdate(billingEntityId, 2.5); // 2.5 GB
```

**Protect features with usage limits:**

```typescript
import { withUsageLimit } from '@/lib/metering';

export async function generateContent(prompt: string) {
  return withUsageLimit('ai_tokens', async () => {
    const result = await callAI(prompt);
    await trackAiTokens(billingEntityId, result.tokens);
    return result;
  });
}
```

[📚 Full Metering Guide](./docs/metering.md) | [⚡ Quick Reference](./docs/metering-cheatsheet.md)

### 🏢 Organizations & Teams

Multi-tenant architecture with team collaboration:

- **Organization Management** - Create and manage organizations
- **Team Invitations** - Email-based invitation system
- **Role-Based Permissions** - Owner, Admin, Member roles
- **Organization Switching** - Quick switcher in the UI
- **Shared Billing** - Organization-level subscriptions
- **Member Management** - Add, remove, and manage team members

**RBAC Permissions:**

| Role | Permissions |
|------|------------|
| **Owner** | Full control: org update/delete, member CRUD, invitations, projects |
| **Admin** | Org update, member management, invitations, project management |
| **Member** | Project creation only |

### 🎨 Beautiful UI Components

Built with shadcn/ui for a modern, accessible interface:

- 🎨 **50+ Pre-built Components** - Buttons, forms, modals, tables, and more
- 🌙 **Dark Mode** - Seamless light/dark theme switching
- 📱 **Fully Responsive** - Mobile-first design
- ♿ **Accessible** - Built on Radix UI primitives (WCAG compliant)
- 🎭 **Customizable** - Tailwind CSS for easy styling
- 🚀 **Form Handling** - React Hook Form with Zod validation

### 💾 Database (Prisma + PostgreSQL)

Type-safe database access with automatic migrations:

- **Prisma ORM** - Type-safe queries with autocomplete
- **PostgreSQL** - Production-ready relational database
- **Auto Migrations** - Database schema changes made easy
- **Connection Pooling** - Optimized for serverless
- **Multi-provider** - Works with Supabase, Neon, Railway, or local Postgres

```typescript
import { prisma } from '@/lib/db';

// Type-safe queries with autocomplete
const users = await prisma.user.findMany({
  where: { email: { contains: '@example.com' } },
  include: { organization: true }
});
```

---

## 🛠 Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | [Next.js 15](https://nextjs.org/) (App Router) |
| **Language** | [TypeScript 5](https://www.typescriptlang.org/) |
| **Database** | [PostgreSQL](https://www.postgresql.org/) + [Prisma ORM](https://www.prisma.io/) |
| **Authentication** | [Better Auth](https://better-auth.com/) |
| **Payments** | [Polar](https://polar.sh/) |
| **Email** | [Resend](https://resend.com/) |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/) |
| **UI Components** | [shadcn/ui](https://ui.shadcn.com/) |
| **Forms** | [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/) |
| **Deployment** | [Vercel](https://vercel.com/) |

---

## 📁 Project Structure

```
nextjs-ultimate-saas/
├── app/                          # Next.js 15 App Router
│   ├── (auth)/                   # Authentication routes
│   │   ├── sign-in/              # Login page
│   │   ├── sign-up/              # Registration page
│   │   ├── forget-password/      # Password recovery
│   │   └── two-factor/           # 2FA verification
│   ├── (home)/                   # Public pages
│   ├── dashboard/                # Protected dashboard
│   │   ├── account/              # User settings
│   │   ├── usage/                # Usage dashboard
│   │   └── demo/                 # Demo features
│   ├── billing/                  # Subscription management
│   ├── api/                      # API routes
│   │   ├── auth/                 # Auth endpoints
│   │   └── webhook/              # Polar webhooks
│   └── setup/                    # Setup wizard
├── components/
│   ├── ui/                       # shadcn/ui components (50+)
│   ├── usage/                    # Usage tracking UI
│   │   ├── usage-card.tsx        # Display meter usage
│   │   ├── usage-limit-gate.tsx  # Limit enforcement UI
│   │   └── upgrade-prompt.tsx    # Upgrade CTAs
│   ├── setup/                    # Setup wizard components
│   ├── app-sidebar.tsx           # Main navigation
│   ├── account-switch.tsx        # User/Org switcher
│   └── theme-toggle.tsx          # Dark mode toggle
├── lib/
│   ├── auth.ts                   # Better Auth configuration
│   ├── auth-client.ts            # Client-side auth hooks
│   ├── payments.ts               # Polar integration
│   ├── permissions.ts            # RBAC definitions
│   ├── db.ts                     # Prisma client
│   ├── metering/                 # Usage tracking system
│   │   ├── index.ts              # Public API
│   │   ├── client.ts             # Usage tracking functions
│   │   ├── limits.ts             # Limit checking
│   │   ├── types.ts              # TypeScript types
│   │   └── setup-meters.ts       # Meter creation script
│   ├── setup/                    # Setup wizard logic
│   │   ├── actions.ts            # Server actions
│   │   ├── config.ts             # Configuration utilities
│   │   └── validation.ts         # Input validation
│   └── email/                    # Email templates
├── prisma/
│   ├── schema.prisma             # Database schema
│   └── migrations/               # Migration history
├── scripts/
│   ├── setup.ts                  # CLI setup wizard
│   └── fix-polar-customer.ts     # Utility scripts
├── docs/                         # Documentation
│   ├── setup.md                  # Setup guide
│   ├── metering.md               # Metering guide
│   └── metering-cheatsheet.md    # Quick reference
└── public/                       # Static assets
```

---

## 🎓 Code Examples

### Protect an API Route with Usage Limits

```typescript
// app/api/generate/route.ts
import { checkCurrentLimit, trackApiRequest } from '@/lib/metering';
import { getCurrentCustomer } from '@/lib/payments';

export async function POST(req: Request) {
  const { billingEntityId } = await getCurrentCustomer();
  
  // Check if user has API credits left
  const status = await checkCurrentLimit('api_requests');
  if (!status.allowed) {
    return Response.json(
      { error: 'Rate limit exceeded', remaining: status.remaining },
      { status: 429 }
    );
  }
  
  // Process the request
  const result = await generateContent(await req.json());
  
  // Track usage after success
  await trackApiRequest(billingEntityId, '/api/generate');
  
  return Response.json(result);
}
```

### Server Action with Usage Limit

```typescript
'use server';

import { withUsageLimit, trackAiTokens } from '@/lib/metering';
import { getCurrentCustomer } from '@/lib/payments';

export async function summarizeText(text: string) {
  const { billingEntityId } = await getCurrentCustomer();
  
  // Automatically checks limit and throws if exceeded
  return withUsageLimit('ai_tokens', async () => {
    const result = await callAI(text);
    
    // Track tokens used
    await trackAiTokens(billingEntityId, result.tokensUsed);
    
    return result.summary;
  });
}
```

### Check User Permissions

```typescript
import { hasPermission } from '@/lib/permissions';
import { getCurrentCustomer } from '@/lib/payments';

export async function deleteProject(projectId: string) {
  const { user, organization } = await getCurrentCustomer();
  
  // Check if user has permission
  if (!hasPermission(user.role, 'project:delete')) {
    throw new Error('Insufficient permissions');
  }
  
  // Proceed with deletion
  await prisma.project.delete({ where: { id: projectId } });
}
```

### Display Usage in UI

```typescript
// components/usage-dashboard.tsx
import { UsageCard, UsageOverview } from '@/components/usage';

export function UsageDashboard() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <UsageCard meterSlug="api_requests" />
      <UsageCard meterSlug="storage_gb" />
      <UsageCard meterSlug="ai_tokens" />
      <UsageCard meterSlug="team_seats" />
    </div>
  );
}
```

---

## 🔧 Configuration

### Environment Variables

The setup wizard configures these automatically, but here's what gets set:

```env
# Database
DATABASE_URL="postgresql://user:password@host:5432/database"
DIRECT_URL="postgresql://user:password@host:5432/database"

# Authentication
BETTER_AUTH_URL="http://localhost:3000"
BETTER_AUTH_SECRET="your-64-char-hex-secret"
BETTER_AUTH_EMAIL="noreply@yourdomain.com"

# Email (Optional)
RESEND_API_KEY="re_..."

# Payments (Optional)
POLAR_SERVER="sandbox"  # or "production"
POLAR_ACCESS_TOKEN="polar_..."
POLAR_ORGANIZATION_ID="your-org-id"
POLAR_WEBHOOK_SECRET="whsec_..."

# OAuth Providers (Optional)
NEXT_PUBLIC_GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
GITHUB_CLIENT_ID="..."
GITHUB_CLIENT_SECRET="..."
# ... more providers
```

### Setup Polar Meters

After running the setup wizard:

```bash
# Create usage meters in Polar
npx dotenv -e .env.local -- npx tsx lib/metering/setup-meters.ts
```

Then add metered prices to your products in the [Polar Dashboard](https://polar.sh/products).

---

## 📚 Documentation

| Guide | Description |
|-------|-------------|
| [📖 Setup Guide](./docs/setup.md) | Complete setup wizard documentation |
| [📊 Metering Guide](./docs/metering.md) | Usage-based billing and tracking |
| [⚡ Metering Cheatsheet](./docs/metering-cheatsheet.md) | Quick reference for metering APIs |

### External Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Better Auth Documentation](https://better-auth.com/docs)
- [Polar Documentation](https://docs.polar.sh)
- [Prisma Documentation](https://www.prisma.io/docs)
- [shadcn/ui Components](https://ui.shadcn.com)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

---

## 🚀 Deployment

### Deploy to Vercel (Recommended)

1. Push your code to GitHub
2. Visit [vercel.com/new](https://vercel.com/new)
3. Import your repository
4. Add environment variables from `.env.local`
5. Deploy!

Vercel automatically detects Next.js and configures everything.

### Environment Setup

**Production checklist:**

- ✅ Set `BETTER_AUTH_URL` to your production domain
- ✅ Change `POLAR_SERVER` to `"production"`
- ✅ Update `BETTER_AUTH_EMAIL` to your domain email
- ✅ Configure production OAuth credentials
- ✅ Set up production database (recommend connection pooling)
- ✅ Configure Polar webhook endpoint: `https://yourdomain.com/api/webhook`

### Database

For production, use a managed PostgreSQL service:

- **[Supabase](https://supabase.com)** - Free tier, global CDN
- **[Neon](https://neon.tech)** - Serverless Postgres with branching
- **[Railway](https://railway.app)** - Simple deployment platform
- **[Vercel Postgres](https://vercel.com/storage/postgres)** - Built-in Vercel integration

---

## 🎨 Customization

### Branding

Update your brand colors in `app/globals.css`:

```css
@layer base {
  :root {
    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;
    /* ... more theme variables */
  }
}
```

### Adding Components

```bash
npx shadcn@latest add [component-name]
```

Browse available components at [ui.shadcn.com](https://ui.shadcn.com).

### Custom Meters

Add your own usage meters in `lib/metering/types.ts`:

```typescript
export type MeterSlug = 
  | 'api_requests'
  | 'storage_gb'
  | 'ai_tokens'
  | 'team_seats'
  | 'your_custom_meter';  // Add your meter

export type EventName =
  | 'api.request'
  | 'storage.update'
  | 'ai.tokens'
  | 'seat.active'
  | 'your.event';  // Add your event
```

Then create the meter in Polar:

```typescript
// lib/metering/setup-meters.ts
const meters = [
  // ... existing meters
  {
    slug: 'your_custom_meter',
    name: 'Your Custom Meter',
    eventName: 'your.event',
    aggregation: 'sum',
    property: 'amount',
  },
];
```

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### Development Setup

```bash
# Install dependencies
npm install

# Run linting
npm run lint

# Type check
npm run typecheck

# Build for production
npm run build
```

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

---

## 💬 Support

- 📧 Email: support@yourdomain.com
- 💬 Discord: [Join our community](#)
- 📖 Docs: [Full documentation](#)
- 🐛 Issues: [GitHub Issues](https://github.com/your-repo/issues)

---

<div align="center">

**[⭐ Star this repo](https://github.com/your-repo)** if you find it helpful!

Made with ❤️ by developers, for developers.

</div>
