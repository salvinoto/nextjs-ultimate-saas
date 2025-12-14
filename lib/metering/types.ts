/**
 * Metering Types
 * 
 * Type definitions for the Polar metering system.
 * Re-exports Polar SDK types and provides application-level abstractions.
 */

// ============================================
// Re-export Polar SDK Types
// ============================================

// Meter types from Polar SDK
export type { Meter, MeterAggregation, MeterMetadata } from "@polar-sh/sdk/models/components/meter.js";
export type { CustomerMeter } from "@polar-sh/sdk/models/components/customermeter.js";

// Event types from Polar SDK
export type { EventCreateExternalCustomer } from "@polar-sh/sdk/models/components/eventcreateexternalcustomer.js";
export type { EventsIngest } from "@polar-sh/sdk/models/components/eventsingest.js";
export type { EventsIngestResponse } from "@polar-sh/sdk/models/components/eventsingestresponse.js";
export type { EventMetadataInput } from "@polar-sh/sdk/models/components/eventmetadatainput.js";

// Customer types from Polar SDK
export type { Customer } from "@polar-sh/sdk/models/components/customer.js";

// ============================================
// Application-Level Types
// ============================================

/**
 * Available meter slugs that correspond to meters defined in Polar.
 * These are used to identify which meter to track usage against.
 * 
 * Add new meter slugs here when you create new meters in Polar.
 */
export type MeterSlug = 
  | 'api_requests' 
  | 'storage_gb' 
  | 'ai_tokens' 
  | 'team_seats';

/**
 * Event names that correspond to Polar event filters.
 * These must match the filter clauses defined in your meters.
 */
export type EventName = 
  | 'api.request'
  | 'storage.update'
  | 'ai.tokens'
  | 'seat.active';

/**
 * Mapping from meter slugs to their event names.
 */
export const METER_TO_EVENT: Record<MeterSlug, EventName> = {
  api_requests: 'api.request',
  storage_gb: 'storage.update',
  ai_tokens: 'ai.tokens',
  team_seats: 'seat.active',
} as const;

/**
 * Usage status returned when checking limits.
 * This is an application-level abstraction over CustomerMeter.
 */
export interface UsageStatus {
  /** Whether the user is allowed to continue using the feature */
  allowed: boolean;
  /** Current usage amount (maps to CustomerMeter.consumedUnits) */
  current: number;
  /** Maximum limit (maps to CustomerMeter.creditedUnits, null if unlimited) */
  limit: number | null;
  /** Remaining usage (maps to CustomerMeter.balance, null if unlimited) */
  remaining: number | null;
  /** Human-readable reason if not allowed */
  reason?: string;
}

/**
 * Result of tracking usage.
 * Simplified wrapper around EventsIngestResponse.
 */
export interface TrackingResult {
  success: boolean;
  /** Number of events inserted (from EventsIngestResponse.inserted) */
  inserted?: number;
  error?: string;
}

// ============================================
// Event Property Types
// ============================================

/**
 * Metadata value types supported by Polar.
 * Maps to EventMetadataInput from Polar SDK.
 */
export type MetadataValue = string | number | boolean;

/**
 * Properties for API request events.
 */
export interface ApiRequestProperties {
  endpoint: string;
  method?: string;
  statusCode?: number;
  duration?: number;
}

/**
 * Properties for storage update events.
 */
export interface StorageUpdateProperties {
  size_gb: number;
  operation?: 'upload' | 'delete' | 'update';
}

/**
 * Properties for AI token events.
 */
export interface AiTokenProperties {
  tokens: number;
  model?: string;
  type?: 'input' | 'output' | 'total';
}

/**
 * Properties for seat activity events.
 */
export interface SeatActivityProperties {
  user_id: string;
  action?: 'login' | 'active' | 'action';
}

/**
 * Union type of all event properties.
 */
export type EventProperties = 
  | ApiRequestProperties
  | StorageUpdateProperties
  | AiTokenProperties
  | SeatActivityProperties
  | Record<string, MetadataValue>;
