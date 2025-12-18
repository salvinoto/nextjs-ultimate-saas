/**
 * Client-safe validation functions for the setup wizard.
 * These don't depend on any Node.js modules.
 */

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

