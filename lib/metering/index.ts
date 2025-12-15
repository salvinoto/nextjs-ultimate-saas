/**
 * Metering Module
 * 
 * Unified exports for Polar-based usage tracking and limit checking.
 * 
 * @example
 * ```ts
 * import { 
 *   trackApiRequest, 
 *   checkLimit, 
 *   withUsageLimit,
 *   type CustomerMeter,
 * } from '@/lib/metering';
 * ```
 */

// ============================================
// Polar SDK Types (re-exported)
// ============================================
export type {
  Meter,
  MeterAggregation,
  MeterMetadata,
  CustomerMeter,
  EventCreateExternalCustomer,
  EventsIngest,
  EventsIngestResponse,
  EventMetadataInput,
  Customer,
} from './types';

// ============================================
// Application Types
// ============================================
export type {
  MeterSlug,
  EventName,
  UsageStatus,
  TrackingResult,
  MetadataValue,
  ApiRequestProperties,
  StorageUpdateProperties,
  AiTokenProperties,
  SeatActivityProperties,
  EventProperties,
} from './types';

export { METER_TO_EVENT } from './types';

// ============================================
// Client - Usage Tracking
// ============================================
export {
  trackUsage,
  trackUsageBatch,
  trackApiRequest,
  trackStorageUpdate,
  trackAiTokens,
  trackSeatActivity,
} from './client';

// ============================================
// Limits - Usage Checking
// ============================================
export {
  checkLimit,
  checkCurrentLimit,
  withUsageLimit,
  withUsageLimitSafe,
  getAllUsage,
} from './limits';
