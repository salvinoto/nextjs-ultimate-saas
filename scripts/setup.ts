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
  note,
} from "@clack/prompts";
import { consola } from "consola";
import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";
import * as crypto from "node:crypto";

// ============================================
// Logger
// ============================================

interface LogEntry {
  timestamp: Date;
  level: "info" | "success" | "warning" | "error";
  message: string;
  details?: string;
}

interface LogSummary {
  database: { configured: boolean; host?: string };
  auth: { configured: boolean; url?: string };
  email: { configured: boolean };
  payments: { configured: boolean; server?: string };
  migrations: { success: boolean; error?: string };
  cleanup: { performed: boolean; files?: string[] };
}

class SetupLogger {
  private entries: LogEntry[] = [];
  private startTime: Date = new Date();
  private summary: Partial<LogSummary> = {};
  private logPath: string;

  constructor() {
    this.logPath = path.join(process.cwd(), "setup.log");
  }

  private formatTime(date: Date): string {
    return date.toTimeString().split(" ")[0];
  }

  private formatTimestamp(date: Date): string {
    return date.toISOString();
  }

  log(level: LogEntry["level"], message: string, details?: string) {
    this.entries.push({ timestamp: new Date(), level, message, details });
  }

  info(message: string, details?: string) { this.log("info", message, details); }
  success(message: string, details?: string) { this.log("success", message, details); }
  warning(message: string, details?: string) { this.log("warning", message, details); }
  error(message: string, details?: string) { this.log("error", message, details); }

  setSummary(summary: Partial<LogSummary>) {
    this.summary = { ...this.summary, ...summary };
  }

  async writeLog(): Promise<string> {
    const endTime = new Date();
    const duration = ((endTime.getTime() - this.startTime.getTime()) / 1000).toFixed(1);

    let content = "";
    content += "=".repeat(60) + "\n";
    content += "Next.js Ultimate SaaS - Setup Log\n";
    content += "=".repeat(60) + "\n\n";
    content += `Started:  ${this.formatTimestamp(this.startTime)}\n`;
    content += `Finished: ${this.formatTimestamp(endTime)}\n`;
    content += `Duration: ${duration}s\n\n`;

    content += "-".repeat(60) + "\n";
    content += "Timeline\n";
    content += "-".repeat(60) + "\n\n";

    for (const entry of this.entries) {
      const prefix = {
        info: "[INFO]   ",
        success: "[SUCCESS]",
        warning: "[WARNING]",
        error: "[ERROR]  ",
      }[entry.level];
      content += `${this.formatTime(entry.timestamp)} ${prefix} ${entry.message}\n`;
      if (entry.details) {
        content += `                    ${entry.details}\n`;
      }
    }

    content += "\n" + "-".repeat(60) + "\n";
    content += "Configuration Summary\n";
    content += "-".repeat(60) + "\n\n";

    if (this.summary.database) {
      const status = this.summary.database.configured ? "✓ Configured" : "✗ Not configured";
      content += `Database:  ${status}\n`;
      if (this.summary.database.host) content += `           Host: ${this.summary.database.host}\n`;
    }

    if (this.summary.auth) {
      const status = this.summary.auth.configured ? "✓ Configured" : "✗ Not configured";
      content += `Auth:      ${status}\n`;
      if (this.summary.auth.url) content += `           URL: ${this.summary.auth.url}\n`;
    }

    if (this.summary.email) {
      const status = this.summary.email.configured ? "✓ Configured" : "○ Skipped";
      content += `Email:     ${status}\n`;
    }

    if (this.summary.payments) {
      const status = this.summary.payments.configured ? "✓ Configured" : "○ Skipped";
      content += `Payments:  ${status}\n`;
      if (this.summary.payments.server) content += `           Server: ${this.summary.payments.server}\n`;
    }

    if (this.summary.migrations) {
      const status = this.summary.migrations.success ? "✓ Success" : "✗ Failed";
      content += `\nDatabase Migrations: ${status}\n`;
      if (this.summary.migrations.error) content += `           Error: ${this.summary.migrations.error}\n`;
    }

    if (this.summary.cleanup) {
      const status = this.summary.cleanup.performed ? "✓ Performed" : "○ Skipped";
      content += `\nCleanup:   ${status}\n`;
      if (this.summary.cleanup.files && this.summary.cleanup.files.length > 0) {
        content += `           Removed:\n`;
        for (const file of this.summary.cleanup.files) {
          content += `             - ${file}\n`;
        }
      }
    }

    content += "\n" + "=".repeat(60) + "\n";
    content += "End of Setup Log\n";
    content += "=".repeat(60) + "\n";

    fs.writeFileSync(this.logPath, content, "utf-8");
    return this.logPath;
  }
}

// ============================================
// Cleanup Functions
// ============================================

const SETUP_FILES = [
  "app/setup",
  "components/setup",
  "lib/setup",
  "scripts/setup.ts",
  "scripts/setup-check.ts",
];

function getExistingSetupFiles(): string[] {
  const cwd = process.cwd();
  return SETUP_FILES.filter((file) => fs.existsSync(path.join(cwd, file)));
}

function cleanupSetupFiles(logger: SetupLogger): string[] {
  const cwd = process.cwd();
  const removedFiles: string[] = [];

  for (const file of SETUP_FILES) {
    const fullPath = path.join(cwd, file);
    if (!fs.existsSync(fullPath)) continue;

    try {
      const stats = fs.statSync(fullPath);
      if (stats.isDirectory()) {
        fs.rmSync(fullPath, { recursive: true, force: true });
      } else {
        fs.rmSync(fullPath, { force: true });
      }
      removedFiles.push(file);
      logger.success(`Removed ${file}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      logger.error(`Failed to remove ${file}`, message);
    }
  }

  // Update package.json
  try {
    const packageJsonPath = path.join(cwd, "package.json");
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));

    if (packageJson.scripts) {
      let modified = false;
      for (const script of ["setup", "setup:cli"]) {
        if (packageJson.scripts[script]) {
          delete packageJson.scripts[script];
          modified = true;
        }
      }
      if (modified) {
        fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + "\n", "utf-8");
        removedFiles.push("package.json scripts");
        logger.success("Removed setup scripts from package.json");
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.error("Failed to update package.json", message);
  }

  // Update proxy.ts
  try {
    const proxyPath = path.join(cwd, "proxy.ts");
    if (fs.existsSync(proxyPath)) {
      const simplifiedProxy = `import { betterFetch } from "@better-fetch/fetch";
import { NextRequest, NextResponse } from "next/server";
import type { Session } from "./lib/auth-types";

export async function proxy(request: NextRequest) {
	const { pathname } = request.nextUrl;

	// Dashboard requires authentication
	if (pathname.startsWith("/dashboard")) {
		const { data: session } = await betterFetch<Session>(
			"/api/auth/get-session",
			{
				baseURL: request.nextUrl.origin,
				headers: {
					cookie: request.headers.get("cookie") || "",
				},
			},
		);

		if (!session) {
			return NextResponse.redirect(new URL("/", request.url));
		}
	}

	return NextResponse.next();
}

export const config = {
	matcher: ["/dashboard/:path*"],
};
`;
      fs.writeFileSync(proxyPath, simplifiedProxy, "utf-8");
      removedFiles.push("proxy.ts (setup logic)");
      logger.success("Removed setup redirect from proxy.ts");
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.error("Failed to update proxy.ts", message);
  }

  return removedFiles;
}

// ============================================
// Main Setup
// ============================================

async function main() {
  console.clear();

  const logger = new SetupLogger();
  logger.info("Setup wizard started");

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

    logger.info("Existing .env.local found");

    const shouldContinue = await confirm({
      message: ".env.local already exists. Do you want to update it?",
    });

    if (isCancel(shouldContinue) || !shouldContinue) {
      logger.info("Setup cancelled by user");
      outro("Setup cancelled.");
      process.exit(0);
    }
  }

  const result = await group(
    {
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

      auth: () =>
        group({
          BETTER_AUTH_URL: () =>
            text({
              message: "Enter your BETTER_AUTH_URL",
              initialValue: existingEnv.BETTER_AUTH_URL || "http://localhost:3000",
              validate: (value) => {
                if (!value) return "BETTER_AUTH_URL is required";
                try { new URL(value); } catch { return "Must be a valid URL"; }
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

      email: () =>
        group({
          RESEND_API_KEY: () =>
            text({
              message: "Enter your Resend API Key (optional, press Enter to skip)",
              placeholder: "re_...",
              initialValue: existingEnv.RESEND_API_KEY,
            }),
        }),

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
              message: "Enter your Polar Access Token (optional, press Enter to skip)",
              initialValue: existingEnv.POLAR_ACCESS_TOKEN,
            }),
          POLAR_ORGANIZATION_ID: () =>
            text({
              message: "Enter your Polar Organization ID (optional)",
              initialValue: existingEnv.POLAR_ORGANIZATION_ID,
            }),
          POLAR_WEBHOOK_SECRET: () =>
            text({
              message: "Enter your Polar Webhook Secret (optional)",
              initialValue: existingEnv.POLAR_WEBHOOK_SECRET,
            }),
        }),

      social: () =>
        multiselect({
          message: "Select OAuth providers to configure (optional)",
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
        logger.info("Setup cancelled by user");
        cancel("Setup cancelled.");
        process.exit(0);
      },
    }
  );

  // Log configuration
  logger.info("Database configured", result.database.DATABASE_URL ? "URL provided" : "Not set");
  logger.info("Auth URL configured", result.auth.BETTER_AUTH_URL);

  // Handle Social Providers
  const socialConfigs: Record<string, { id: string; secret: string }> = {};
  for (const provider of result.social as string[]) {
    const providerUpper = provider.toUpperCase();
    const idKey = provider === 'google' ? 'NEXT_PUBLIC_GOOGLE_CLIENT_ID' : `${providerUpper}_CLIENT_ID`;
    const secretKey = `${providerUpper}_CLIENT_SECRET`;
    
    const config = await group({
      id: () => text({ message: `Enter ${provider} Client ID`, initialValue: existingEnv[idKey] }),
      secret: () => text({ message: `Enter ${provider} Client Secret`, initialValue: existingEnv[secretKey] })
    }, {
      onCancel: () => {
        logger.info("Setup cancelled by user");
        cancel("Setup cancelled.");
        process.exit(0);
      }
    });
    socialConfigs[provider] = config;
    logger.info(`${provider} OAuth configured`);
  }

  const s = spinner();
  s.start("Generating configuration...");

  // Generate Secret if needed
  let betterAuthSecret = existingEnv.BETTER_AUTH_SECRET || "";
  if (existingEnv.BETTER_AUTH_SECRET) {
    if (!result.auth.generateSecret) {
      betterAuthSecret = crypto.randomBytes(32).toString('hex');
      logger.info("Generated new BETTER_AUTH_SECRET");
    } else {
      logger.info("Keeping existing BETTER_AUTH_SECRET");
    }
  } else if (result.auth.generateSecret) {
    betterAuthSecret = crypto.randomBytes(32).toString('hex');
    logger.info("Generated new BETTER_AUTH_SECRET");
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
  logger.success("Configuration saved to .env.local");

  // Update summary
  logger.setSummary({
    database: { 
      configured: !!result.database.DATABASE_URL,
      host: result.database.DATABASE_URL ? new URL(result.database.DATABASE_URL).host : undefined
    },
    auth: { 
      configured: !!betterAuthSecret,
      url: result.auth.BETTER_AUTH_URL
    },
    email: { configured: !!result.email.RESEND_API_KEY },
    payments: { 
      configured: !!result.payments.POLAR_ACCESS_TOKEN,
      server: result.payments.POLAR_SERVER as string
    },
  });

  // Database migrations
  const runDatabase = await confirm({
    message: "Do you want to run database migrations now?",
    initialValue: true,
  });

  if (!isCancel(runDatabase) && runDatabase) {
    s.start("Running prisma generate & db push...");
    logger.info("Running database migrations");
    try {
      execSync("npx prisma generate", { stdio: "pipe" });
      execSync("npx prisma db push", { stdio: "pipe" });
      s.stop("Database initialized successfully!");
      logger.success("Database migrations completed");
      logger.setSummary({ migrations: { success: true } });
    } catch (error) {
      s.stop("Database initialization failed.");
      const message = error instanceof Error ? error.message : "Unknown error";
      logger.error("Database migrations failed", message);
      logger.setSummary({ migrations: { success: false, error: message } });
      consola.error(error);
    }
  } else {
    logger.info("Database migrations skipped");
    logger.setSummary({ migrations: { success: false, error: "Skipped by user" } });
  }

  // Polar meters
  const runMeters = await confirm({
    message: "Do you want to set up Polar meters now?",
    initialValue: false,
  });

  if (!isCancel(runMeters) && runMeters) {
    s.start("Setting up Polar meters...");
    logger.info("Setting up Polar meters");
    try {
      execSync("npx tsx lib/metering/setup-meters.ts", { 
        stdio: "pipe",
        env: { ...process.env, ...existingEnv, POLAR_ACCESS_TOKEN: result.payments.POLAR_ACCESS_TOKEN } 
      });
      s.stop("Polar meters set up successfully!");
      logger.success("Polar meters setup completed");
    } catch (error) {
      s.stop("Polar meters setup failed.");
      const message = error instanceof Error ? error.message : "Unknown error";
      logger.error("Polar meters setup failed", message);
      consola.error(error);
    }
  }

  // Cleanup option
  const existingSetupFiles = getExistingSetupFiles();
  if (existingSetupFiles.length > 0) {
    note(
      "Setup files can be removed once configuration is complete:\n" +
      existingSetupFiles.map(f => `  • ${f}`).join("\n"),
      "Cleanup"
    );

    const shouldCleanup = await confirm({
      message: "Would you like to remove setup files and directories?",
      initialValue: false,
    });

    if (!isCancel(shouldCleanup) && shouldCleanup) {
      s.start("Cleaning up setup files...");
      logger.info("Starting cleanup");
      const removedFiles = cleanupSetupFiles(logger);
      s.stop(`Removed ${removedFiles.length} setup files/directories`);
      logger.setSummary({ cleanup: { performed: true, files: removedFiles } });
    } else {
      logger.info("Cleanup skipped");
      logger.setSummary({ cleanup: { performed: false } });
    }
  }

  // Write log file
  const logPath = await logger.writeLog();
  
  outro("Setup complete! You're ready to start building. 🚀");
  consola.info(`Setup log saved to: ${logPath}`);
  consola.info("Run 'npm run dev' to start the development server.");
}

main().catch((err) => {
  consola.error("An unexpected error occurred during setup:");
  console.error(err);
  process.exit(1);
});
