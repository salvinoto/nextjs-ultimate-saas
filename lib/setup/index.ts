// Server-only exports - only import from server components or server actions
export { getSetupStatus, isSetupAllowed, validateDatabaseUrl, validateUrl, validateEmail, REQUIRED_ENV_VARS } from "./config";
export type { SetupStatus } from "./config";

// Client-safe exports
export { SETUP_STEPS, getStepIndex, getStepProgress } from "./types";
export type { SetupStep, SetupFormData, DatabaseConfig, AuthConfig, EmailConfig, PaymentsConfig, SocialProvider } from "./types";

