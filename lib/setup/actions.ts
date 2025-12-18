"use server";

import { writeFile, readFile, appendFile } from "fs/promises";
import { existsSync, rmSync, statSync, writeFileSync } from "fs";
import path from "path";
import { Pool } from "pg";
import * as crypto from "node:crypto";
import { isSetupAllowed } from "./config";
import type { SetupFormData } from "./types";

interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

// ============================================
// Logger for Web UI
// ============================================

interface LogEntry {
  timestamp: string;
  level: "info" | "success" | "warning" | "error";
  message: string;
  details?: string;
}

let logEntries: LogEntry[] = [];
let logStartTime: Date | null = null;

function logMessage(level: LogEntry["level"], message: string, details?: string) {
  if (!logStartTime) {
    logStartTime = new Date();
  }
  logEntries.push({
    timestamp: new Date().toISOString(),
    level,
    message,
    details,
  });
}

export async function startSetupLog(): Promise<ActionResult> {
  logEntries = [];
  logStartTime = new Date();
  logMessage("info", "Setup wizard started (Web UI)");
  return { success: true };
}

interface LogSummary {
  database: { configured: boolean; host?: string };
  auth: { configured: boolean; url?: string };
  email: { configured: boolean };
  payments: { configured: boolean; server?: string };
  migrations: { success: boolean; error?: string; skipped?: boolean };
  cleanup: { performed: boolean; files?: string[] };
}

export async function writeSetupLog(summary: LogSummary): Promise<ActionResult<{ path: string }>> {
  if (!isSetupAllowed()) {
    return { success: false, error: "Setup is not allowed in production" };
  }

  try {
    const logPath = path.join(process.cwd(), "setup.log");
    const endTime = new Date();
    const duration = logStartTime 
      ? ((endTime.getTime() - logStartTime.getTime()) / 1000).toFixed(1) 
      : "0";

    let content = "";
    content += "=".repeat(60) + "\n";
    content += "Next.js Ultimate SaaS - Setup Log\n";
    content += "=".repeat(60) + "\n\n";
    content += `Started:  ${logStartTime?.toISOString() || "Unknown"}\n`;
    content += `Finished: ${endTime.toISOString()}\n`;
    content += `Duration: ${duration}s\n`;
    content += `Mode:     Web UI\n\n`;

    content += "-".repeat(60) + "\n";
    content += "Timeline\n";
    content += "-".repeat(60) + "\n\n";

    for (const entry of logEntries) {
      const prefix = {
        info: "[INFO]   ",
        success: "[SUCCESS]",
        warning: "[WARNING]",
        error: "[ERROR]  ",
      }[entry.level];
      const time = new Date(entry.timestamp).toTimeString().split(" ")[0];
      content += `${time} ${prefix} ${entry.message}\n`;
      if (entry.details) {
        content += `                    ${entry.details}\n`;
      }
    }

    content += "\n" + "-".repeat(60) + "\n";
    content += "Configuration Summary\n";
    content += "-".repeat(60) + "\n\n";

    const dbStatus = summary.database.configured ? "✓ Configured" : "✗ Not configured";
    content += `Database:  ${dbStatus}\n`;
    if (summary.database.host) content += `           Host: ${summary.database.host}\n`;

    const authStatus = summary.auth.configured ? "✓ Configured" : "✗ Not configured";
    content += `Auth:      ${authStatus}\n`;
    if (summary.auth.url) content += `           URL: ${summary.auth.url}\n`;

    const emailStatus = summary.email.configured ? "✓ Configured" : "○ Skipped";
    content += `Email:     ${emailStatus}\n`;

    const paymentsStatus = summary.payments.configured ? "✓ Configured" : "○ Skipped";
    content += `Payments:  ${paymentsStatus}\n`;
    if (summary.payments.server) content += `           Server: ${summary.payments.server}\n`;

    const migrationsStatus = summary.migrations.skipped 
      ? "○ Skipped (manual)" 
      : summary.migrations.success 
        ? "✓ Success" 
        : "✗ Failed";
    content += `\nDatabase Migrations: ${migrationsStatus}\n`;
    if (summary.migrations.error) content += `           Error: ${summary.migrations.error}\n`;
    if (summary.migrations.skipped) content += `           Command: npx prisma generate && npx prisma db push\n`;

    const cleanupStatus = summary.cleanup.performed ? "✓ Performed" : "○ Skipped";
    content += `\nCleanup:   ${cleanupStatus}\n`;
    if (summary.cleanup.files && summary.cleanup.files.length > 0) {
      content += `           Removed:\n`;
      for (const file of summary.cleanup.files) {
        content += `             - ${file}\n`;
      }
    }

    content += "\n" + "=".repeat(60) + "\n";
    content += "End of Setup Log\n";
    content += "=".repeat(60) + "\n";

    await writeFile(logPath, content, "utf-8");

    return { success: true, data: { path: logPath } };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: message };
  }
}

// ============================================
// Setup Actions
// ============================================

/**
 * Test database connection
 */
export async function testDatabaseConnection(
  connectionString: string
): Promise<ActionResult<{ version: string }>> {
  if (!isSetupAllowed()) {
    return { success: false, error: "Setup is not allowed in production" };
  }

  logMessage("info", "Testing database connection");

  try {
    const pool = new Pool({ connectionString });
    const result = await pool.query("SELECT version()");
    await pool.end();
    
    logMessage("success", "Database connection successful", result.rows[0].version);
    
    return {
      success: true,
      data: { version: result.rows[0].version },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Connection failed";
    logMessage("error", "Database connection failed", message);
    return { success: false, error: message };
  }
}

/**
 * Generate a secure auth secret
 */
export async function generateAuthSecret(): Promise<ActionResult<{ secret: string }>> {
  if (!isSetupAllowed()) {
    return { success: false, error: "Setup is not allowed in production" };
  }

  const secret = crypto.randomBytes(32).toString("hex");
  logMessage("info", "Generated new BETTER_AUTH_SECRET");
  return { success: true, data: { secret } };
}

/**
 * Save configuration to .env.local
 */
export async function saveConfiguration(
  config: SetupFormData
): Promise<ActionResult> {
  if (!isSetupAllowed()) {
    return { success: false, error: "Setup is not allowed in production" };
  }

  logMessage("info", "Saving configuration to .env.local");

  try {
    const envPath = path.join(process.cwd(), ".env.local");
    
    // Read existing env if it exists
    let existingContent = "";
    if (existsSync(envPath)) {
      existingContent = await readFile(envPath, "utf-8");
    }

    // Parse existing env vars
    const existingVars: Record<string, string> = {};
    existingContent.split("\n").forEach((line) => {
      const match = line.match(/^([^#=]+)=(.*)$/);
      if (match) {
        existingVars[match[1].trim()] = match[2].trim().replace(/^"(.*)"$/, "$1");
      }
    });

    // Merge with new config
    const newVars: Record<string, string> = {
      ...existingVars,
      DATABASE_URL: config.database.DATABASE_URL,
      DIRECT_URL: config.database.DIRECT_URL || config.database.DATABASE_URL,
      BETTER_AUTH_URL: config.auth.BETTER_AUTH_URL,
      BETTER_AUTH_SECRET: config.auth.BETTER_AUTH_SECRET,
      BETTER_AUTH_EMAIL: config.auth.BETTER_AUTH_EMAIL,
      RESEND_API_KEY: config.email.RESEND_API_KEY,
      POLAR_ACCESS_TOKEN: config.payments.POLAR_ACCESS_TOKEN,
      POLAR_ORGANIZATION_ID: config.payments.POLAR_ORGANIZATION_ID,
      POLAR_SERVER: config.payments.POLAR_SERVER,
    };

    if (config.payments.POLAR_WEBHOOK_SECRET) {
      newVars.POLAR_WEBHOOK_SECRET = config.payments.POLAR_WEBHOOK_SECRET;
    }

    // Add social providers
    if (config.social) {
      for (const provider of config.social) {
        const upper = provider.provider.toUpperCase();
        if (provider.provider === "google") {
          newVars.NEXT_PUBLIC_GOOGLE_CLIENT_ID = provider.clientId;
          newVars.GOOGLE_CLIENT_SECRET = provider.clientSecret;
        } else {
          newVars[`${upper}_CLIENT_ID`] = provider.clientId;
          newVars[`${upper}_CLIENT_SECRET`] = provider.clientSecret;
        }
      }
    }

    // Build env content
    let envContent = `# Generated by setup wizard on ${new Date().toISOString()}\n\n`;
    
    envContent += `# Database\n`;
    envContent += `DATABASE_URL="${newVars.DATABASE_URL}"\n`;
    envContent += `DIRECT_URL="${newVars.DIRECT_URL}"\n\n`;

    envContent += `# Auth\n`;
    envContent += `BETTER_AUTH_URL="${newVars.BETTER_AUTH_URL}"\n`;
    envContent += `BETTER_AUTH_SECRET="${newVars.BETTER_AUTH_SECRET}"\n`;
    envContent += `BETTER_AUTH_EMAIL="${newVars.BETTER_AUTH_EMAIL}"\n\n`;

    envContent += `# Email\n`;
    envContent += `RESEND_API_KEY="${newVars.RESEND_API_KEY}"\n\n`;

    envContent += `# Payments\n`;
    envContent += `POLAR_ACCESS_TOKEN="${newVars.POLAR_ACCESS_TOKEN}"\n`;
    envContent += `POLAR_ORGANIZATION_ID="${newVars.POLAR_ORGANIZATION_ID}"\n`;
    envContent += `POLAR_SERVER="${newVars.POLAR_SERVER}"\n`;
    if (newVars.POLAR_WEBHOOK_SECRET) {
      envContent += `POLAR_WEBHOOK_SECRET="${newVars.POLAR_WEBHOOK_SECRET}"\n`;
    }
    envContent += `\n`;

    // Add social providers if any
    const socialKeys = Object.keys(newVars).filter(
      (k) => k.includes("CLIENT_ID") || k.includes("CLIENT_SECRET")
    );
    if (socialKeys.length > 0) {
      envContent += `# Social Providers\n`;
      for (const key of socialKeys) {
        envContent += `${key}="${newVars[key]}"\n`;
      }
    }

    await writeFile(envPath, envContent, "utf-8");
    
    logMessage("success", "Configuration saved to .env.local");
    logMessage("info", "Database configured", config.database.DATABASE_URL ? "URL provided" : "Not set");
    logMessage("info", "Auth configured", `URL: ${config.auth.BETTER_AUTH_URL}`);
    if (config.email.RESEND_API_KEY) logMessage("info", "Email configured");
    if (config.payments.POLAR_ACCESS_TOKEN) logMessage("info", "Payments configured", `Server: ${config.payments.POLAR_SERVER}`);

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save configuration";
    logMessage("error", "Failed to save configuration", message);
    return { success: false, error: message };
  }
}

/**
 * Run database migrations
 */
export async function runDatabaseMigrations(): Promise<ActionResult> {
  if (!isSetupAllowed()) {
    return { success: false, error: "Setup is not allowed in production" };
  }

  logMessage("info", "Running database migrations");

  try {
    const { execSync } = await import("child_process");
    
    logMessage("info", "Running prisma generate");
    execSync("npx prisma generate", { 
      cwd: process.cwd(),
      stdio: "pipe",
    });
    
    logMessage("info", "Running prisma db push");
    execSync("npx prisma db push", { 
      cwd: process.cwd(),
      stdio: "pipe",
    });

    logMessage("success", "Database migrations completed");
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Migration failed";
    logMessage("error", "Database migrations failed", message);
    return { success: false, error: message };
  }
}

// ============================================
// Cleanup Actions
// ============================================

// Files to cleanup immediately (safe to delete while app is running)
const SETUP_FILES_SAFE = [
  "components/setup",
  "lib/setup",
  "scripts/setup.ts",
  "scripts/setup-check.ts",
];

// Files that require manual deletion after restart
// (can't delete app/setup while user is on that page)
const SETUP_FILES_MANUAL = [
  "app/setup",
];

export async function getCleanupFiles(): Promise<ActionResult<{ files: string[]; manualFiles: string[] }>> {
  const cwd = process.cwd();
  const existingFiles = SETUP_FILES_SAFE.filter((file) => existsSync(path.join(cwd, file)));
  const manualFiles = SETUP_FILES_MANUAL.filter((file) => existsSync(path.join(cwd, file)));
  return { success: true, data: { files: existingFiles, manualFiles } };
}

export async function cleanupSetupFiles(): Promise<ActionResult<{ removedFiles: string[]; manualFiles: string[] }>> {
  if (!isSetupAllowed()) {
    return { success: false, error: "Cleanup is not allowed in production" };
  }

  logMessage("info", "Starting cleanup of setup files");

  const cwd = process.cwd();
  const removedFiles: string[] = [];
  const manualFiles: string[] = [];

  // Only delete files that are safe to delete while the app is running
  // (we can't delete app/setup while the user is still on that page)
  for (const file of SETUP_FILES_SAFE) {
    const fullPath = path.join(cwd, file);
    
    if (!existsSync(fullPath)) continue;

    try {
      const stats = statSync(fullPath);
      
      if (stats.isDirectory()) {
        rmSync(fullPath, { recursive: true, force: true });
      } else {
        rmSync(fullPath, { force: true });
      }
      
      removedFiles.push(file);
      logMessage("success", `Removed ${file}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      logMessage("error", `Failed to remove ${file}`, message);
    }
  }

  // Track files that need manual deletion
  for (const file of SETUP_FILES_MANUAL) {
    const fullPath = path.join(cwd, file);
    if (existsSync(fullPath)) {
      manualFiles.push(file);
      logMessage("info", `${file} requires manual deletion after restart`);
    }
  }

  // Update package.json
  try {
    const packageJsonPath = path.join(cwd, "package.json");
    const packageJsonContent = await readFile(packageJsonPath, "utf-8");
    const pkg = JSON.parse(packageJsonContent);

    if (pkg.scripts) {
      let modified = false;
      for (const script of ["setup", "setup:cli"]) {
        if (pkg.scripts[script]) {
          delete pkg.scripts[script];
          modified = true;
        }
      }
      if (modified) {
        await writeFile(packageJsonPath, JSON.stringify(pkg, null, 2) + "\n", "utf-8");
        removedFiles.push("package.json scripts");
        logMessage("success", "Removed setup scripts from package.json");
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logMessage("error", "Failed to update package.json", message);
  }

  // Update proxy.ts
  try {
    const proxyPath = path.join(cwd, "proxy.ts");
    if (existsSync(proxyPath)) {
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
      await writeFile(proxyPath, simplifiedProxy, "utf-8");
      removedFiles.push("proxy.ts (setup logic)");
      logMessage("success", "Removed setup redirect from proxy.ts");
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logMessage("error", "Failed to update proxy.ts", message);
  }

  logMessage("info", `Cleanup completed: ${removedFiles.length} items removed`);
  if (manualFiles.length > 0) {
    logMessage("info", `${manualFiles.length} items require manual deletion after restart`);
  }

  return { success: true, data: { removedFiles, manualFiles } };
}

