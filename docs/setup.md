# Setup Wizard

This guide covers the first-time setup wizard for the Next.js Ultimate SaaS template. The setup wizard helps you configure environment variables, initialize the database, and get your development environment ready quickly.

## Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
- [Setup Methods](#setup-methods)
- [Configuration Steps](#configuration-steps)
- [Setup Logging](#setup-logging)
- [Cleanup](#cleanup)
- [File Structure](#file-structure)
- [Technical Details](#technical-details)
- [Troubleshooting](#troubleshooting)

---

## Overview

The setup wizard provides two interfaces for configuring your SaaS application:

1. **Web UI** - A beautiful, interactive browser-based wizard at `/setup`
2. **CLI** - A terminal-based wizard via `npm run setup`

Both methods configure the same environment variables and produce identical results.

### What Gets Configured

| Service | Variables | Required |
|---------|-----------|----------|
| Database | `DATABASE_URL`, `DIRECT_URL` | Yes |
| Authentication | `BETTER_AUTH_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_EMAIL` | Yes |
| Email | `RESEND_API_KEY` | No |
| Payments | `POLAR_ACCESS_TOKEN`, `POLAR_ORGANIZATION_ID`, `POLAR_SERVER` | No |
| Social OAuth | Provider-specific client IDs and secrets | No |

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Setup Wizard                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   ┌─────────────┐         ┌─────────────┐                  │
│   │   Web UI    │         │    CLI      │                  │
│   │  /setup     │         │  npm setup  │                  │
│   └──────┬──────┘         └──────┬──────┘                  │
│          │                       │                          │
│          └───────────┬───────────┘                          │
│                      ▼                                      │
│          ┌───────────────────────┐                          │
│          │   Configuration       │                          │
│          │   - Validate inputs   │                          │
│          │   - Generate secrets  │                          │
│          │   - Test connections  │                          │
│          └───────────┬───────────┘                          │
│                      ▼                                      │
│          ┌───────────────────────┐                          │
│          │   Write .env.local    │                          │
│          └───────────┬───────────┘                          │
│                      ▼                                      │
│          ┌───────────────────────┐                          │
│          │ Database Migrations   │  ◄── Optional            │
│          │   - prisma generate   │      (enabled by default)│
│          │   - prisma db push    │                          │
│          └───────────┬───────────┘                          │
│                      ▼                                      │
│          ┌───────────────────────┐                          │
│          │   Write setup.log     │                          │
│          └───────────┬───────────┘                          │
│                      ▼                                      │
│          ┌───────────────────────┐                          │
│          │   Cleanup (Optional)  │  ◄── Optional            │
│          │   Remove setup files  │      (disabled by default)
│          └───────────────────────┘                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Quick Start

### Option 1: Web UI (Recommended)

Simply run the development server:

```bash
npm run dev
```

If `.env.local` is missing or incomplete, you'll be automatically redirected to the setup wizard at `http://localhost:3000/setup`.

### Option 2: CLI

Run the setup command directly:

```bash
npm run setup
```

This launches an interactive terminal wizard that guides you through configuration.

---

## Setup Methods

### Web UI Setup (`/setup`)

The web-based setup provides a multi-step wizard with:

- **Progress tracking** - Visual progress bar and step indicators
- **Animated transitions** - Smooth step-to-step navigation
- **Real-time validation** - Form validation with helpful error messages
- **Connection testing** - Test your database connection before saving
- **Secure secret generation** - Generate cryptographically secure auth secrets

#### Accessing the Web UI

The setup page is automatically shown when:

1. You're in development mode (`NODE_ENV=development`)
2. The app is not fully configured (`DATABASE_URL` or `BETTER_AUTH_SECRET` missing)

You can also navigate directly to `http://localhost:3000/setup` if you want to re-run setup.

### CLI Setup (`npm run setup`)

The CLI wizard uses [@clack/prompts](https://github.com/bombshell-dev/clack) for a beautiful terminal experience:

```bash
npm run setup
# or
npm run setup:cli
```

Features:
- **Colored output** with semantic styling
- **Animated spinners** for async operations
- **Password masking** for sensitive values
- **Input validation** with helpful error messages

---

## Configuration Steps

Both setup methods guide you through the same configuration steps:

### Step 1: Welcome

Overview of what will be configured and prerequisites checklist.

### Step 2: Database Configuration

| Field | Description | Required |
|-------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `DIRECT_URL` | Direct connection for migrations (defaults to DATABASE_URL) | No |

**Format:** `postgresql://user:password@host:port/database`

**Supported providers:**
- Local PostgreSQL
- Supabase
- Neon
- Railway
- Any PostgreSQL-compatible database

**Web UI bonus:** Test your connection before proceeding.

### Step 3: Authentication Configuration

| Field | Description | Required |
|-------|-------------|----------|
| `BETTER_AUTH_URL` | Your application's base URL | Yes |
| `BETTER_AUTH_SECRET` | 64-character hex secret for signing tokens | Yes |
| `BETTER_AUTH_EMAIL` | "From" email address for auth emails | Yes |

**Defaults:**
- URL: `http://localhost:3000`
- Email: `delivered@resend.dev`
- Secret: Auto-generated if not provided

### Step 4: Email Configuration (Optional)

| Field | Description | Required |
|-------|-------------|----------|
| `RESEND_API_KEY` | Your Resend API key | No |

Get your API key from [resend.com/api-keys](https://resend.com/api-keys).

> **Note:** Email is optional for development. Auth emails will be logged to the console if not configured.

### Step 5: Payments Configuration (Optional)

| Field | Description | Required |
|-------|-------------|----------|
| `POLAR_SERVER` | Environment: `sandbox` or `production` | No |
| `POLAR_ACCESS_TOKEN` | Your Polar API token | No |
| `POLAR_ORGANIZATION_ID` | Your Polar organization ID | No |
| `POLAR_WEBHOOK_SECRET` | Secret for verifying webhooks | No |

Get your credentials from [polar.sh/settings](https://polar.sh/settings).

### Step 6: Social OAuth Providers (Optional)

Configure any of the following providers:

| Provider | Client ID Key | Secret Key |
|----------|---------------|------------|
| Google | `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | `GOOGLE_CLIENT_SECRET` |
| GitHub | `GITHUB_CLIENT_ID` | `GITHUB_CLIENT_SECRET` |
| Discord | `DISCORD_CLIENT_ID` | `DISCORD_CLIENT_SECRET` |
| Microsoft | `MICROSOFT_CLIENT_ID` | `MICROSOFT_CLIENT_SECRET` |

### Step 7: Complete

The final step presents several options and actions:

| Option | Description | Default |
|--------|-------------|---------|
| Run database migrations | Executes `prisma generate` and `prisma db push` | ✅ Enabled |
| Cleanup setup files | Removes setup wizard files after completion | ❌ Disabled |
| Setup Polar meters | Creates usage meters in Polar (CLI only) | ❌ Disabled |

**Actions performed:**
1. **Save configuration** to `.env.local`
2. **Run database migrations** (if enabled)
3. **Cleanup setup files** (if enabled)
4. **Generate setup log** with full details

> **Note:** If you skip migrations, you'll need to run them manually:
> ```bash
> npx prisma generate && npx prisma db push
> ```

---

## Setup Logging

Both setup methods generate a detailed `setup.log` file at the project root.

### Log Contents

The log file format varies depending on your choices. Here are examples:

#### Example: Full Setup with Migrations

```
============================================================
Next.js Ultimate SaaS - Setup Log
============================================================

Started:  2024-12-18T10:30:00.000Z
Finished: 2024-12-18T10:30:15.000Z
Duration: 15.0s
Mode:     Web UI

------------------------------------------------------------
Timeline
------------------------------------------------------------

10:30:00 [INFO]    Setup wizard started (Web UI)
10:30:01 [INFO]    Testing database connection
10:30:02 [SUCCESS] Database connection successful
                   PostgreSQL 16.1 on x86_64-pc-linux-gnu
10:30:03 [INFO]    Generated new BETTER_AUTH_SECRET
10:30:04 [SUCCESS] Configuration saved to .env.local
10:30:04 [INFO]    Database configured
                   URL provided
10:30:05 [INFO]    Auth configured
                   URL: http://localhost:3000
10:30:06 [INFO]    Running database migrations
10:30:08 [INFO]    Running prisma generate
10:30:12 [INFO]    Running prisma db push
10:30:14 [SUCCESS] Database migrations completed

------------------------------------------------------------
Configuration Summary
------------------------------------------------------------

Database:  ✓ Configured
           Host: localhost:5432
Auth:      ✓ Configured
           URL: http://localhost:3000
Email:     ○ Skipped
Payments:  ✓ Configured
           Server: sandbox

Database Migrations: ✓ Success

Cleanup:   ○ Skipped

============================================================
End of Setup Log
============================================================
```

#### Example: Skipped Migrations with Cleanup

```
------------------------------------------------------------
Configuration Summary
------------------------------------------------------------

Database:  ✓ Configured
           Host: db.supabase.co
Auth:      ✓ Configured
           URL: http://localhost:3000
Email:     ✓ Configured
Payments:  ○ Skipped

Database Migrations: ○ Skipped (manual)
           Command: npx prisma generate && npx prisma db push

Cleanup:   ✓ Performed
           Removed:
             - components/setup
             - lib/setup
             - scripts/setup.ts
             - package.json scripts
             - proxy.ts (setup logic)
           Manual deletion required:
             - app/setup

============================================================
End of Setup Log
============================================================
```

### Log Sections

| Section | Description |
|---------|-------------|
| Header | Start/end times, duration, and mode (CLI/Web UI) |
| Timeline | Chronological log of all actions with timestamps |
| Configuration Summary | What was configured or skipped |
| Migrations | Database migration status: `✓ Success`, `○ Skipped (manual)`, or `✗ Failed` |
| Cleanup | Files removed automatically and files requiring manual deletion |

### Migration Status Values

| Status | Meaning |
|--------|---------|
| `✓ Success` | Migrations ran successfully |
| `○ Skipped (manual)` | User chose to skip migrations - manual command provided |
| `✗ Failed` | Migrations attempted but failed - error details included |

---

## Cleanup

After setup is complete, you can remove the setup wizard files. This is optional but recommended for production deployments or if you want to reduce project size.

### Automatic Cleanup

The following files are removed **automatically** when cleanup is enabled:

| Path | Description |
|------|-------------|
| `components/setup/` | Setup UI components |
| `lib/setup/` | Setup utilities and server actions |
| `scripts/setup.ts` | CLI setup script |
| `scripts/setup-check.ts` | Pre-dev check script |
| `package.json` | `setup` and `setup:cli` scripts |
| `proxy.ts` | Setup redirect logic |

### Manual Cleanup Required

The following requires **manual deletion** after restarting the dev server:

| Path | Description | Why Manual? |
|------|-------------|-------------|
| `app/setup/` | Setup wizard pages | Cannot be deleted while you're on that page |

After setup completes, run:

```bash
rm -rf app/setup
```

### Files Preserved

The following are **never** removed:

- `.env.local` - Your configuration
- `setup.log` - Setup log file
- `.env.example` - Template for reference

### Cleanup Methods

**Web UI:**

1. On the final step, check "Remove setup files after completion"
2. Complete setup - automatic files will be removed immediately
3. After redirecting home, manually delete `app/setup/`:
   ```bash
   rm -rf app/setup
   ```

**CLI:**

1. At the end of setup, you'll be asked: "Would you like to remove setup files and directories?"
2. Select "Yes" to proceed with cleanup
3. The CLI can fully clean up all files including `app/setup/` since you're not on the page

---

## File Structure

### Setup Files

```
nextjs-ultimate-saas/
├── app/
│   └── setup/
│       ├── layout.tsx          # Setup layout with access control
│       └── page.tsx            # Setup page entry point
├── components/
│   └── setup/
│       ├── index.ts            # Component exports
│       ├── setup-wizard.tsx    # Main wizard component
│       └── steps/
│           ├── welcome-step.tsx
│           ├── database-step.tsx
│           ├── auth-step.tsx
│           ├── email-step.tsx
│           ├── payments-step.tsx
│           └── complete-step.tsx
├── lib/
│   └── setup/
│       ├── index.ts            # Module exports
│       ├── config.ts           # Configuration utilities (server-only)
│       ├── types.ts            # TypeScript types
│       ├── validation.ts       # Client-safe validation
│       └── actions.ts          # Server actions
├── scripts/
│   ├── setup.ts                # CLI setup script
│   └── setup-check.ts          # Pre-dev check script
└── proxy.ts                    # Contains setup redirect logic
```

### Generated Files

```
nextjs-ultimate-saas/
├── .env.local                  # Environment configuration
└── setup.log                   # Detailed setup log
```

---

## Technical Details

### Lazy Initialization

The template uses lazy initialization for service clients to prevent crashes when environment variables are missing:

```typescript
// lib/db.ts - Prisma client with lazy init
export const prisma = new Proxy({} as PrismaClient, {
  get(_, prop) {
    const client = getPrismaClient(); // Only creates client when accessed
    return client[prop];
  },
});

// polar.ts - Polar client with lazy init
export const polar = new Proxy({} as Polar, {
  get(_, prop) {
    const client = getPolarClient(); // Only creates client when accessed
    return client[prop];
  },
});
```

This allows the app to start and show the setup wizard even without configuration.

### Auto-Redirect Logic

The `proxy.ts` file contains logic to redirect unconfigured apps to `/setup`:

```typescript
// proxy.ts
export async function proxy(request: NextRequest) {
  const isConfigured = !!process.env.DATABASE_URL && !!process.env.BETTER_AUTH_SECRET;
  const isDevelopment = process.env.NODE_ENV === "development";

  if (isDevelopment && !isConfigured) {
    return NextResponse.redirect(new URL("/setup", request.url));
  }
  // ...
}
```

### Server Actions

The setup wizard uses Next.js Server Actions for:

- Testing database connections
- Generating auth secrets
- Saving configuration
- Running migrations
- Cleanup operations
- Writing log files

All actions are protected with `isSetupAllowed()` which only returns `true` in development mode.

### Security Considerations

- Setup is **only allowed in development mode**
- Secrets are never logged in plain text
- Connection strings are masked in logs
- Setup redirect only works when `NODE_ENV=development`
- After cleanup, setup endpoints become inaccessible

---

## Troubleshooting

### Setup Page Not Loading

**Error:** 500 error or blank page

**Solution:** Check the terminal for errors. Common causes:

1. Missing dependencies - Run `npm install`
2. TypeScript errors - Run `npm run typecheck`
3. Module not found - Ensure all setup files exist

### Database Connection Failed

**Error:** "Connection failed" or timeout

**Solutions:**

1. Verify the connection string format: `postgresql://user:password@host:port/database`
2. Ensure the database server is running
3. Check firewall rules allow connections
4. For Supabase/Neon, ensure you're using the correct pooler URL

### Migrations Failed

**Error:** Prisma migration errors

**Solutions:**

1. Ensure `DATABASE_URL` is correct
2. For connection poolers (Supabase Transaction mode), set `DIRECT_URL` to the direct connection
3. Check database permissions
4. Run manually: `npx prisma db push`

### Setup Redirect Loop

**Error:** Keeps redirecting to `/setup` even after configuration

**Solutions:**

1. Restart the dev server after saving `.env.local`
2. Verify `.env.local` contains `DATABASE_URL` and `BETTER_AUTH_SECRET`
3. Clear browser cache

### Cleanup Fails

**Error:** "Failed to remove" errors during cleanup

**Solutions:**

1. Ensure no processes are using the files
2. Check file permissions
3. Manually delete the files if needed

### app/setup Still Exists After Cleanup

**Why:** The `app/setup` directory cannot be deleted while you're viewing the `/setup` page in the browser. This is because Next.js would crash if the page files are deleted while being rendered.

**Solution:** After setup completes and you've navigated away, manually delete the directory:

```bash
rm -rf app/setup
```

Or wait until you restart your dev server - the setup page will simply 404 if accessed directly.

### tsx Command Not Found

**Error:** `sh: tsx: command not found`

**Solution:** Install tsx as a dev dependency:

```bash
npm install -D tsx
```

---

## Related Documentation

- [Metering Guide](./metering.md) - Usage-based billing with Polar meters
- [Polar Documentation](https://docs.polar.sh) - Payments and subscriptions
- [Better Auth Documentation](https://better-auth.com) - Authentication
- [Prisma Documentation](https://www.prisma.io/docs) - Database ORM
- [Resend Documentation](https://resend.com/docs) - Email service

