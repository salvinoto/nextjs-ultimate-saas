export interface DatabaseConfig {
  DATABASE_URL: string;
  DIRECT_URL?: string;
}

export interface AuthConfig {
  BETTER_AUTH_URL: string;
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_EMAIL: string;
}

export interface EmailConfig {
  RESEND_API_KEY: string;
}

export interface PaymentsConfig {
  POLAR_ACCESS_TOKEN: string;
  POLAR_ORGANIZATION_ID: string;
  POLAR_SERVER: "sandbox" | "production";
  POLAR_WEBHOOK_SECRET?: string;
}

export interface SocialProvider {
  provider: string;
  clientId: string;
  clientSecret: string;
}

export interface SetupFormData {
  database: DatabaseConfig;
  auth: AuthConfig;
  email: EmailConfig;
  payments: PaymentsConfig;
  social?: SocialProvider[];
}

export type SetupStep = 
  | "welcome" 
  | "database" 
  | "auth" 
  | "email" 
  | "payments" 
  | "complete";

export const SETUP_STEPS: SetupStep[] = [
  "welcome",
  "database",
  "auth",
  "email",
  "payments",
  "complete",
];

export function getStepIndex(step: SetupStep): number {
  return SETUP_STEPS.indexOf(step);
}

export function getStepProgress(step: SetupStep): number {
  const index = getStepIndex(step);
  return Math.round((index / (SETUP_STEPS.length - 1)) * 100);
}

