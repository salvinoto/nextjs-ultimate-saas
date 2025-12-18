import {
  intro,
  outro,
  text,
  select,
  confirm,
  multiselect,
  spinner,
  isCancel,
  cancel,
  group,
} from "@clack/prompts";
import { consola } from "consola";
import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";
import * as crypto from "node:crypto";

async function main() {
  console.clear();

  intro("🚀 Next.js Ultimate SaaS Setup");

  const envPath = path.join(process.cwd(), ".env.local");
  let existingEnv: Record<string, string> = {};

  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, "utf-8");
    content.split("\n").forEach((line) => {
      const [key, ...valueParts] = line.split("=");
      if (key && valueParts.length > 0) {
        existingEnv[key.trim()] = valueParts.join("=").trim().replace(/^"(.*)"$/, "$1");
      }
    });

    const shouldContinue = await confirm({
      message: ".env.local already exists. Do you want to update it?",
    });

    if (isCancel(shouldContinue) || !shouldContinue) {
      outro("Setup cancelled.");
      process.exit(0);
    }
  }

  const result = await group(
    {
      // --- Database ---
      database: () =>
        group({
          DATABASE_URL: () =>
            text({
              message: "Enter your PostgreSQL DATABASE_URL",
              placeholder: "postgresql://user:password@localhost:5432/dbname",
              initialValue: existingEnv.DATABASE_URL,
              validate: (value) => {
                if (!value) return "DATABASE_URL is required";
                if (!value.startsWith("postgresql://") && !value.startsWith("postgres://")) {
                  return "Must be a valid postgres connection string";
                }
              },
            }),
          DIRECT_URL: ({ results }) =>
            text({
              message: "Enter your DIRECT_URL (optional, defaults to DATABASE_URL)",
              placeholder: results.DATABASE_URL,
              initialValue: existingEnv.DIRECT_URL || results.DATABASE_URL,
            }),
        }),

      // --- Auth ---
      auth: () =>
        group({
          BETTER_AUTH_URL: () =>
            text({
              message: "Enter your BETTER_AUTH_URL",
              initialValue: existingEnv.BETTER_AUTH_URL || "http://localhost:3000",
              validate: (value) => {
                if (!value) return "BETTER_AUTH_URL is required";
                try {
                  new URL(value);
                } catch {
                  return "Must be a valid URL";
                }
              },
            }),
          BETTER_AUTH_EMAIL: () =>
            text({
              message: "Enter the 'from' email address for auth emails",
              initialValue: existingEnv.BETTER_AUTH_EMAIL || "delivered@resend.dev",
              validate: (value) => {
                if (!value) return "Email is required";
                if (!value.includes("@")) return "Must be a valid email";
              },
            }),
          generateSecret: () =>
            confirm({
              message: existingEnv.BETTER_AUTH_SECRET
                ? "Keep existing BETTER_AUTH_SECRET?"
                : "Generate a new BETTER_AUTH_SECRET?",
              initialValue: true,
            }),
        }),

      // --- Email ---
      email: () =>
        group({
          RESEND_API_KEY: () =>
            text({
              message: "Enter your Resend API Key",
              placeholder: "re_...",
              initialValue: existingEnv.RESEND_API_KEY,
            }),
        }),

      // --- Payments ---
      payments: () =>
        group({
          POLAR_SERVER: () =>
            select({
              message: "Select Polar environment",
              options: [
                { value: "sandbox", label: "Sandbox (testing)" },
                { value: "production", label: "Production" },
              ],
              initialValue: existingEnv.POLAR_SERVER || "sandbox",
            }),
          POLAR_ACCESS_TOKEN: () =>
            text({
              message: "Enter your Polar Access Token",
              initialValue: existingEnv.POLAR_ACCESS_TOKEN,
            }),
          POLAR_ORGANIZATION_ID: () =>
            text({
              message: "Enter your Polar Organization ID",
              initialValue: existingEnv.POLAR_ORGANIZATION_ID,
            }),
          POLAR_WEBHOOK_SECRET: () =>
            text({
              message: "Enter your Polar Webhook Secret",
              initialValue: existingEnv.POLAR_WEBHOOK_SECRET,
            }),
        }),

      // --- Social Providers ---
      social: () =>
        multiselect({
          message: "Select OAuth providers to configure",
          options: [
            { value: "google", label: "Google" },
            { value: "github", label: "GitHub" },
            { value: "discord", label: "Discord" },
            { value: "microsoft", label: "Microsoft" },
          ],
          required: false,
        }),
    },
    {
      onCancel: () => {
        cancel("Setup cancelled.");
        process.exit(0);
      },
    }
  );

  // Handle Social Providers
  const socialConfigs: Record<string, { id: string; secret: string }> = {};
  for (const provider of result.social as string[]) {
    const providerUpper = provider.toUpperCase();
    const idKey = provider === 'google' ? 'NEXT_PUBLIC_GOOGLE_CLIENT_ID' : `${providerUpper}_CLIENT_ID`;
    const secretKey = `${providerUpper}_CLIENT_SECRET`;
    
    const config = await group({
      id: () => text({ 
        message: `Enter ${provider} Client ID`,
        initialValue: existingEnv[idKey]
      }),
      secret: () => text({ 
        message: `Enter ${provider} Client Secret`,
        initialValue: existingEnv[secretKey]
      })
    }, {
      onCancel: () => {
        cancel("Setup cancelled.");
        process.exit(0);
      }
    });
    socialConfigs[provider] = config;
  }

  const s = spinner();
  s.start("Generating configuration...");

  // Generate Secret if needed
  let betterAuthSecret = existingEnv.BETTER_AUTH_SECRET || "";
  if (existingEnv.BETTER_AUTH_SECRET) {
    if (!result.auth.generateSecret) {
      betterAuthSecret = crypto.randomBytes(32).toString('hex');
    }
  } else if (result.auth.generateSecret) {
    betterAuthSecret = crypto.randomBytes(32).toString('hex');
  }

  // Build the .env.local content
  let envContent = `# Generated by setup wizard on ${new Date().toISOString()}\n\n`;
  
  envContent += `# Auth\n`;
  envContent += `BETTER_AUTH_URL="${result.auth.BETTER_AUTH_URL}"\n`;
  envContent += `BETTER_AUTH_SECRET="${betterAuthSecret}"\n`;
  envContent += `BETTER_AUTH_EMAIL="${result.auth.BETTER_AUTH_EMAIL}"\n\n`;

  envContent += `# Database\n`;
  envContent += `DATABASE_URL="${result.database.DATABASE_URL}"\n`;
  envContent += `DIRECT_URL="${result.database.DIRECT_URL || result.database.DATABASE_URL}"\n\n`;

  envContent += `# Email\n`;
  envContent += `RESEND_API_KEY="${result.email.RESEND_API_KEY || ""}"\n\n`;

  envContent += `# Payments\n`;
  envContent += `POLAR_SERVER="${result.payments.POLAR_SERVER}"\n`;
  envContent += `POLAR_ACCESS_TOKEN="${result.payments.POLAR_ACCESS_TOKEN || ""}"\n`;
  envContent += `POLAR_ORGANIZATION_ID="${result.payments.POLAR_ORGANIZATION_ID || ""}"\n`;
  envContent += `POLAR_WEBHOOK_SECRET="${result.payments.POLAR_WEBHOOK_SECRET || ""}"\n\n`;

  if (Object.keys(socialConfigs).length > 0) {
    envContent += `# Social Providers\n`;
    for (const [provider, config] of Object.entries(socialConfigs)) {
      const providerUpper = provider.toUpperCase();
      const idKey = provider === 'google' ? 'NEXT_PUBLIC_GOOGLE_CLIENT_ID' : `${providerUpper}_CLIENT_ID`;
      const secretKey = `${providerUpper}_CLIENT_SECRET`;
      envContent += `${idKey}="${config.id}"\n`;
      envContent += `${secretKey}="${config.secret}"\n`;
    }
  }

  fs.writeFileSync(envPath, envContent);
  s.stop("Configuration saved to .env.local");

  const runDatabase = await confirm({
    message: "Do you want to run database migrations now?",
    initialValue: true,
  });

  if (!isCancel(runDatabase) && runDatabase) {
    s.start("Running prisma generate & db push...");
    try {
      execSync("npx prisma generate", { stdio: "inherit" });
      execSync("npx prisma db push", { stdio: "inherit" });
      s.stop("Database initialized successfully!");
    } catch (error) {
      s.stop("Database initialization failed.");
      consola.error(error);
    }
  }

  const runMeters = await confirm({
    message: "Do you want to set up Polar meters now?",
    initialValue: false,
  });

  if (!isCancel(runMeters) && runMeters) {
    s.start("Setting up Polar meters...");
    try {
      execSync("npx tsx lib/metering/setup-meters.ts", { 
        stdio: "inherit",
        env: { ...process.env, ...existingEnv, POLAR_ACCESS_TOKEN: result.payments.POLAR_ACCESS_TOKEN } 
      });
      s.stop("Polar meters set up successfully!");
    } catch (error) {
      s.stop("Polar meters setup failed.");
      consola.error(error);
    }
  }

  outro("Setup complete! You're ready to start building. 🚀");
  consola.info("Run 'npm run dev' to start the development server.");
}

main().catch((err) => {
  consola.error("An unexpected error occurred during setup:");
  console.error(err);
  process.exit(1);
});

