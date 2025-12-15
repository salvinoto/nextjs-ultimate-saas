'use server';

/**
 * Metering Client
 * 
 * Unified client for tracking usage with Polar's events API.
 * Simple, clean API for recording usage events.
 */

import { polar } from '@/polar';
import type {
  EventName,
  TrackingResult,
  ApiRequestProperties,
  StorageUpdateProperties,
  AiTokenProperties,
  SeatActivityProperties,
  MetadataValue,
} from './types';

/**
 * Core function to track usage by sending events to Polar.
 * 
 * @param externalCustomerId - Your customer ID (user ID or organization ID)
 * @param eventName - The name of the event (must match meter filter)
 * @param properties - Additional properties for the event
 * @returns TrackingResult indicating success or failure
 * 
 * @example
 * ```ts
 * await trackUsage('user_123', 'api.request', { endpoint: '/api/generate' });
 * ```
 */
export async function trackUsage(
  externalCustomerId: string,
  eventName: EventName,
  properties?: Record<string, MetadataValue>
): Promise<TrackingResult> {
  try {
    const result = await polar.events.ingest({
      events: [{
        name: eventName,
        externalCustomerId,
        metadata: properties,
        timestamp: new Date(),
      }],
    });

    return { 
      success: true, 
      inserted: result.inserted,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Failed to track usage for ${externalCustomerId}:`, errorMessage);
    
    return { 
      success: false, 
      error: errorMessage,
    };
  }
}

/**
 * Track multiple events in a single batch.
 * More efficient when you need to track multiple events at once.
 * 
 * @param events - Array of events to track
 * @returns TrackingResult indicating success or failure
 */
export async function trackUsageBatch(
  events: Array<{
    externalCustomerId: string;
    eventName: EventName;
    properties?: Record<string, MetadataValue>;
    timestamp?: Date;
  }>
): Promise<TrackingResult> {
  try {
    const result = await polar.events.ingest({
      events: events.map(e => ({
        name: e.eventName,
        externalCustomerId: e.externalCustomerId,
        metadata: e.properties,
        timestamp: e.timestamp ?? new Date(),
      })),
    });

    return { 
      success: true,
      inserted: result.inserted,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Failed to track batch usage:', errorMessage);
    
    return { 
      success: false, 
      error: errorMessage,
    };
  }
}

// ============================================
// Convenience Wrappers for Common Usage Types
// ============================================

/**
 * Track an API request.
 * 
 * @param externalCustomerId - Your customer ID
 * @param endpoint - The API endpoint called
 * @param options - Additional options (method, statusCode, duration)
 * 
 * @example
 * ```ts
 * await trackApiRequest('user_123', '/api/generate', { method: 'POST' });
 * ```
 */
export async function trackApiRequest(
  externalCustomerId: string,
  endpoint: string,
  options?: Omit<ApiRequestProperties, 'endpoint'>
): Promise<TrackingResult> {
  const metadata: Record<string, MetadataValue> = { endpoint };
  if (options?.method) metadata.method = options.method;
  if (options?.statusCode) metadata.statusCode = options.statusCode;
  if (options?.duration) metadata.duration = options.duration;
  
  return trackUsage(externalCustomerId, 'api.request', metadata);
}

/**
 * Track storage usage update.
 * 
 * @param externalCustomerId - Your customer ID
 * @param sizeGb - Current total storage in GB
 * @param operation - Optional operation type
 * 
 * @example
 * ```ts
 * await trackStorageUpdate('org_456', 2.5, 'upload');
 * ```
 */
export async function trackStorageUpdate(
  externalCustomerId: string,
  sizeGb: number,
  operation?: StorageUpdateProperties['operation']
): Promise<TrackingResult> {
  const metadata: Record<string, MetadataValue> = { size_gb: sizeGb };
  if (operation) metadata.operation = operation;
  
  return trackUsage(externalCustomerId, 'storage.update', metadata);
}

/**
 * Track AI token usage.
 * 
 * @param externalCustomerId - Your customer ID
 * @param tokens - Number of tokens used
 * @param options - Optional model and token type
 * 
 * @example
 * ```ts
 * await trackAiTokens('user_123', 1500, { model: 'gpt-4', type: 'total' });
 * ```
 */
export async function trackAiTokens(
  externalCustomerId: string,
  tokens: number,
  options?: Omit<AiTokenProperties, 'tokens'>
): Promise<TrackingResult> {
  const metadata: Record<string, MetadataValue> = { tokens };
  if (options?.model) metadata.model = options.model;
  if (options?.type) metadata.type = options.type;
  
  return trackUsage(externalCustomerId, 'ai.tokens', metadata);
}

/**
 * Track team seat activity.
 * Used for unique user counting in team seats meter.
 * 
 * @param externalCustomerId - Your customer ID (typically organization ID)
 * @param userId - The user ID that was active
 * @param action - Optional action type
 * 
 * @example
 * ```ts
 * await trackSeatActivity('org_456', 'user_789', 'login');
 * ```
 */
export async function trackSeatActivity(
  externalCustomerId: string,
  userId: string,
  action?: SeatActivityProperties['action']
): Promise<TrackingResult> {
  const metadata: Record<string, MetadataValue> = { user_id: userId };
  if (action) metadata.action = action;
  
  return trackUsage(externalCustomerId, 'seat.active', metadata);
}
