/**
 * Types for Amplitude API
 */

/**
 * Amplitude API credentials
 */
export interface AmplitudeCredentials {
  apiKey: string;
  secretKey: string;
}

/**
 * Base parameters for all Amplitude API requests
 */
export interface BaseAmplitudeParams {
  start: string;  // ISO date string
  end: string;    // ISO date string
}

/**
 * Event Segmentation API request parameters
 */
export interface EventSegmentationParams extends BaseAmplitudeParams {
  events: EventSegmentationEvent[];
  interval?: string;  // Optional: day, week, month
  groupBy?: string;   // Optional: grouping dimension
  filters?: EventSegmentationFilter[];
  breakdowns?: EventSegmentationBreakdown[];
}

/**
 * Event definition for segmentation
 */
export interface EventSegmentationEvent {
  eventType: string;
  propertyFilters?: PropertyFilter[];
}

/**
 * Filter for event segmentation
 */
export interface EventSegmentationFilter {
  type: 'property' | 'event' | 'user';
  propertyName?: string;
  value?: string | number | boolean | Array<string | number | boolean>;
  op?: 'is' | 'is not' | 'contains' | 'does not contain' | '>' | '<' | '>=' | '<=';
}

/**
 * Breakdown for event segmentation
 */
export interface EventSegmentationBreakdown {
  type: 'event' | 'user';
  propertyName: string;
}

/**
 * Property filter
 */
export interface PropertyFilter {
  propertyName: string;
  value: string | number | boolean | Array<string | number | boolean>;
  op: 'is' | 'is not' | 'contains' | 'does not contain' | '>' | '<' | '>=' | '<=';
}

/**
 * Event Segmentation API response
 */
export interface EventSegmentationResponse {
  data: {
    series: Array<{
      eventType: string;
      data: Array<number>;
    }>;
    seriesLabels: Array<string>;
    xValues: Array<string>;
  };
  metadata: {
    start: string;
    end: string;
    interval: string;
  };
}

/**
 * Error response from Amplitude API
 */
export interface AmplitudeErrorResponse {
  error: string;
  code?: number;
  message?: string;
}

/**
 * Export API request parameters
 */
export interface ExportParams {
  start: string;  // Format: YYYYMMDDTHH (e.g., 20220201T05)
  end: string;    // Format: YYYYMMDDTHH (e.g., 20220201T05)
}

/**
 * Export API event data structure
 */
export interface ExportedEvent {
  server_received_time?: string;
  app?: number;
  device_carrier?: string;
  city?: string;
  user_id?: string;
  uuid?: string;
  event_time?: string;
  platform?: string;
  os_version?: string;
  amplitude_id?: number;
  processed_time?: string;
  version_name?: string;
  ip_address?: string;
  paying?: boolean;
  dma?: string;
  group_properties?: Record<string, any>;
  user_properties?: Record<string, any>;
  client_upload_time?: string;
  $insert_id?: string;
  event_type?: string;
  library?: string;
  amplitude_attribution_ids?: string;
  device_type?: string;
  start_version?: string;
  location_lng?: number;
  location_lat?: number;
  server_upload_time?: string;
  event_id?: number;
  os_name?: string;
  groups?: Record<string, any>;
  event_properties?: Record<string, any>;
  data?: Record<string, any>;
  device_id?: string;
  language?: string;
  country?: string;
  region?: string;
  session_id?: number;
  device_family?: string;
  sample_rate?: any;
  client_event_time?: string;
}

/**
 * Dashboard API - Common Parameters
 */
export interface DashboardBaseParams {
  start: string;  // Format: YYYYMMDD
  end: string;    // Format: YYYYMMDD
}

/**
 * Dashboard API - User Activity Parameters
 */
export interface UserActivityParams {
  user: string;
  offset?: number;
  limit?: number;
  direction?: 'earliest' | 'latest';
}

/**
 * Dashboard API - Event Segmentation Parameters
 */
export interface EventSegmentationDashboardParams extends DashboardBaseParams {
  e: string;  // JSON encoded event
  m?: string;  // Metric type
  i?: number;  // Interval
  s?: string;  // Segment definitions (JSON)
  g?: string;  // Group by property
  limit?: number;
}

/**
 * Dashboard API - Funnel Analysis Parameters
 */
export interface FunnelAnalysisParams extends DashboardBaseParams {
  events: string[];  // Array of JSON encoded events
  mode?: 'ordered' | 'unordered' | 'sequential';
  i?: number;
  s?: string;
  g?: string;
  cs?: number;  // Conversion window in seconds
  limit?: number;
}

/**
 * Dashboard API - Retention Analysis Parameters
 */
export interface RetentionAnalysisParams extends DashboardBaseParams {
  se: string;  // Start event (JSON)
  re: string;  // Return event (JSON)
  rm?: 'bracket' | 'rolling' | 'n-day';
  rb?: string;  // Bracket definition (JSON)
  i?: number;
  s?: string;
  g?: string;
}
