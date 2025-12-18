import "server-only";

export interface SetupStatus {
  isConfigured: boolean;
  database: boolean;
  auth: boolean;
  email: boolean;
  payments: boolean;
}

/**
 * Check if the application is fully configured.
 * This runs on the server side.
 */
export function getSetupStatus(): SetupStatus {
  const database = !!process.env.DATABASE_URL;
  const auth = !!process.env.BETTER_AUTH_SECRET;
  const email = !!process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== "re_123";
  const payments = !!process.env.POLAR_ACCESS_TOKEN;

  // App is considered configured if at minimum database and auth are set up
  const isConfigured = database && auth;

  return {
    isConfigured,
    database,
    auth,
    email,
    payments,
  };
}

/**
 * Check if we're in development mode where setup is allowed
 */
export function isSetupAllowed(): boolean {
  return process.env.NODE_ENV === "development";
}

/**
 * The required environment variables for full configuration
 */
export const REQUIRED_ENV_VARS = {
  database: ["DATABASE_URL"],
  auth: ["BETTER_AUTH_URL", "BETTER_AUTH_SECRET", "BETTER_AUTH_EMAIL"],
  email: ["RESEND_API_KEY"],
  payments: ["POLAR_ACCESS_TOKEN", "POLAR_ORGANIZATION_ID", "POLAR_SERVER"],
} as const;

/**
 * Validate a PostgreSQL connection string format
 */
export function validateDatabaseUrl(url: string): { valid: boolean; error?: string } {
  if (!url) {
    return { valid: false, error: "Database URL is required" };
  }
  
  if (!url.startsWith("postgresql://") && !url.startsWith("postgres://")) {
    return { valid: false, error: "Must be a valid PostgreSQL connection string" };
  }

  try {
    new URL(url);
    return { valid: true };
  } catch {
    return { valid: false, error: "Invalid URL format" };
  }
}

/**
 * Validate a URL format
 */
export function validateUrl(url: string): { valid: boolean; error?: string } {
  if (!url) {
    return { valid: false, error: "URL is required" };
  }
  
  try {
    new URL(url);
    return { valid: true };
  } catch {
    return { valid: false, error: "Invalid URL format" };
  }
}

/**
 * Validate an email format
 */
export function validateEmail(email: string): { valid: boolean; error?: string } {
  if (!email) {
    return { valid: false, error: "Email is required" };
  }
  
  if (!email.includes("@")) {
    return { valid: false, error: "Invalid email format" };
  }

  return { valid: true };
}

