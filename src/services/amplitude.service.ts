import fetch from 'node-fetch';
import * as zlib from 'zlib';
import { promisify } from 'util';
import {
  AmplitudeCredentials,
  EventSegmentationParams,
  EventSegmentationResponse,
  AmplitudeErrorResponse,
  ExportParams,
  ExportedEvent,
  DashboardBaseParams,
  UserActivityParams,
  EventSegmentationDashboardParams,
  FunnelAnalysisParams,
  RetentionAnalysisParams,
  CreateAnnotationParams,
  AnnotationResponse
} from '../types/amplitude.js';

const gunzip = promisify(zlib.gunzip);

export class AmplitudeService {
  private readonly baseUrl = 'https://amplitude.com/api/2';
  
  /**
   * Query events using the Event Segmentation API
   * @param credentials Amplitude API credentials
   * @param params Event segmentation parameters
   * @returns Event segmentation data
   */
  async queryEvents(
    credentials: AmplitudeCredentials,
    params: EventSegmentationParams
  ): Promise<EventSegmentationResponse> {
    const url = `${this.baseUrl}/events/segmentation?e={"event_type":"${params.events[0].eventType}"}&start=${params.start}&end=${params.end}`;
    const headers = this.buildHeaders(credentials);
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers,
      });
      
      if (!response.ok) {
        const errorData = await response.json() as AmplitudeErrorResponse;
        throw new Error(`Amplitude API error: ${errorData.error || response.statusText}`);
      }
      
      return await response.json() as EventSegmentationResponse;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to query events: ${error.message}`);
      }
      throw new Error('Unknown error occurred while querying events');
    }
  }

  /**
   * Export raw event data using the Export API
   * @param credentials Amplitude API credentials
   * @param params Export parameters (start and end time)
   * @returns Array of exported events
   */
  async exportEvents(
    credentials: AmplitudeCredentials,
    params: ExportParams
  ): Promise<ExportedEvent[]> {
    const url = `${this.baseUrl}/export?start=${params.start}&end=${params.end}`;
    const headers = this.buildHeaders(credentials);
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers,
      });
      
      if (response.status === 404) {
        return [];
      }
      
      if (!response.ok) {
        if (response.status === 400) {
          throw new Error('The file size of the exported data is too large. Shorten the time range and try again. The limit is 4GB.');
        }
        if (response.status === 504) {
          throw new Error('The amount of data is large causing a timeout. For large amounts of data, use the Amazon S3 destination.');
        }
        
        const errorText = await response.text();
        throw new Error(`Amplitude API error: ${errorText || response.statusText}`);
      }
      
      // Get the response as a buffer (it's a zipped file)
      const buffer = await response.buffer();
      
      // Unzip the data
      const unzipped = await gunzip(buffer);
      const jsonText = unzipped.toString('utf-8');
      
      // Parse newline-delimited JSON
      const events: ExportedEvent[] = [];
      const lines = jsonText.split('\n').filter(line => line.trim());
      
      for (const line of lines) {
        try {
          const event = JSON.parse(line);
          events.push(event);
        } catch (parseError) {
          // Skip malformed lines
          console.error('Failed to parse event line:', parseError);
        }
      }
      
      return events;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to export events: ${error.message}`);
      }
      throw new Error('Unknown error occurred while exporting events');
    }
  }

  /**
   * Get results from an existing chart
   * @param credentials Amplitude API credentials
   * @param chartId Chart ID from the chart's URL
   * @returns Chart data in JSON format
   */
  async getChart(credentials: AmplitudeCredentials, chartId: string): Promise<any> {
    const url = `https://amplitude.com/api/3/chart/${chartId}/csv`;
    const headers = this.buildHeaders(credentials);
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers,
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Amplitude API error: ${errorText || response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to get chart: ${error.message}`);
      }
      throw new Error('Unknown error occurred while getting chart');
    }
  }

  /**
   * Get active or new user counts
   * @param credentials Amplitude API credentials
   * @param params Dashboard parameters
   * @returns User count data
   */
  async getActiveUsers(credentials: AmplitudeCredentials, params: DashboardBaseParams & { m?: string; i?: number; s?: string; g?: string }): Promise<any> {
    const queryParams = new URLSearchParams({
      start: params.start,
      end: params.end,
      ...(params.m && { m: params.m }),
      ...(params.i && { i: params.i.toString() }),
      ...(params.s && { s: params.s }),
      ...(params.g && { g: params.g })
    });
    
    const url = `${this.baseUrl}/users?${queryParams.toString()}`;
    const headers = this.buildHeaders(credentials);
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers,
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Amplitude API error: ${errorText || response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to get active users: ${error.message}`);
      }
      throw new Error('Unknown error occurred while getting active users');
    }
  }

  /**
   * Get event segmentation data from Dashboard API
   * @param credentials Amplitude API credentials
   * @param params Event segmentation parameters
   * @returns Event segmentation data
   */
  async getEventSegmentationDashboard(credentials: AmplitudeCredentials, params: EventSegmentationDashboardParams): Promise<any> {
    const queryParams = new URLSearchParams({
      e: params.e,
      start: params.start,
      end: params.end,
      ...(params.m && { m: params.m }),
      ...(params.i && { i: params.i.toString() }),
      ...(params.s && { s: params.s }),
      ...(params.g && { g: params.g }),
      ...(params.limit && { limit: params.limit.toString() })
    });
    
    const url = `${this.baseUrl}/events/segmentation?${queryParams.toString()}`;
    const headers = this.buildHeaders(credentials);
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers,
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Amplitude API error: ${errorText || response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to get event segmentation: ${error.message}`);
      }
      throw new Error('Unknown error occurred while getting event segmentation');
    }
  }

  /**
   * Get funnel analysis data
   * @param credentials Amplitude API credentials
   * @param params Funnel analysis parameters
   * @returns Funnel analysis data
   */
  async getFunnelAnalysis(credentials: AmplitudeCredentials, params: FunnelAnalysisParams): Promise<any> {
    const queryParams = new URLSearchParams({
      start: params.start,
      end: params.end,
      ...(params.mode && { mode: params.mode }),
      ...(params.i && { i: params.i.toString() }),
      ...(params.s && { s: params.s }),
      ...(params.g && { g: params.g }),
      ...(params.cs && { cs: params.cs.toString() }),
      ...(params.limit && { limit: params.limit.toString() })
    });
    
    // Add multiple event parameters
    params.events.forEach(event => {
      queryParams.append('e', event);
    });
    
    const url = `${this.baseUrl}/funnels?${queryParams.toString()}`;
    const headers = this.buildHeaders(credentials);
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers,
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Amplitude API error: ${errorText || response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to get funnel analysis: ${error.message}`);
      }
      throw new Error('Unknown error occurred while getting funnel analysis');
    }
  }

  /**
   * Get retention analysis data
   * @param credentials Amplitude API credentials
   * @param params Retention analysis parameters
   * @returns Retention analysis data
   */
  async getRetentionAnalysis(credentials: AmplitudeCredentials, params: RetentionAnalysisParams): Promise<any> {
    const queryParams = new URLSearchParams({
      se: params.se,
      re: params.re,
      start: params.start,
      end: params.end,
      ...(params.rm && { rm: params.rm }),
      ...(params.rb && { rb: params.rb }),
      ...(params.i && { i: params.i.toString() }),
      ...(params.s && { s: params.s }),
      ...(params.g && { g: params.g })
    });
    
    const url = `${this.baseUrl}/retention?${queryParams.toString()}`;
    const headers = this.buildHeaders(credentials);
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers,
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Amplitude API error: ${errorText || response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to get retention analysis: ${error.message}`);
      }
      throw new Error('Unknown error occurred while getting retention analysis');
    }
  }

  /**
   * Get user activity data
   * @param credentials Amplitude API credentials
   * @param params User activity parameters
   * @returns User activity data
   */
  async getUserActivity(credentials: AmplitudeCredentials, params: UserActivityParams): Promise<any> {
    const queryParams = new URLSearchParams({
      user: params.user,
      ...(params.offset !== undefined && { offset: params.offset.toString() }),
      ...(params.limit && { limit: params.limit.toString() }),
      ...(params.direction && { direction: params.direction })
    });
    
    const url = `${this.baseUrl}/useractivity?${queryParams.toString()}`;
    const headers = this.buildHeaders(credentials);
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers,
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Amplitude API error: ${errorText || response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to get user activity: ${error.message}`);
      }
      throw new Error('Unknown error occurred while getting user activity');
    }
  }

  /**
   * Get list of all events
   * @param credentials Amplitude API credentials
   * @returns List of events
   */
  async getEventsList(credentials: AmplitudeCredentials): Promise<any> {
    const url = `${this.baseUrl}/events/list`;
    const headers = this.buildHeaders(credentials);
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers,
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Amplitude API error: ${errorText || response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to get events list: ${error.message}`);
      }
      throw new Error('Unknown error occurred while getting events list');
    }
  }

  /**
   * Create a chart annotation
   * @param credentials Amplitude API credentials
   * @param params Annotation parameters
   * @returns Created annotation data
   */
  async createAnnotation(credentials: AmplitudeCredentials, params: CreateAnnotationParams): Promise<any> {
    const queryParams = new URLSearchParams({
      app_id: params.app_id.toString(),
      date: params.date,
      label: params.label,
      ...(params.chart_id && { chart_id: params.chart_id }),
      ...(params.details && { details: params.details })
    });
    
    const url = `${this.baseUrl}/annotations?${queryParams.toString()}`;
    const headers = this.buildHeaders(credentials);
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Amplitude API error: ${errorText || response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to create annotation: ${error.message}`);
      }
      throw new Error('Unknown error occurred while creating annotation');
    }
  }

  /**
   * Get all chart annotations
   * @param credentials Amplitude API credentials
   * @returns List of all annotations
   */
  async getAllAnnotations(credentials: AmplitudeCredentials): Promise<any> {
    const url = `${this.baseUrl}/annotations`;
    const headers = this.buildHeaders(credentials);
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers,
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Amplitude API error: ${errorText || response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to get annotations: ${error.message}`);
      }
      throw new Error('Unknown error occurred while getting annotations');
    }
  }

  /**
   * Get a single chart annotation by ID
   * @param credentials Amplitude API credentials
   * @param annotationId Annotation ID
   * @returns Annotation data
   */
  async getAnnotation(credentials: AmplitudeCredentials, annotationId: number): Promise<any> {
    const queryParams = new URLSearchParams({
      id: annotationId.toString()
    });
    
    const url = `${this.baseUrl}/annotations?${queryParams.toString()}`;
    const headers = this.buildHeaders(credentials);
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers,
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Amplitude API error: ${errorText || response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to get annotation: ${error.message}`);
      }
      throw new Error('Unknown error occurred while getting annotation');
    }
  }

  /**
   * Build headers for Amplitude API requests
   * @param credentials Amplitude API credentials
   * @returns Headers object
   */
  private buildHeaders(credentials: AmplitudeCredentials): Record<string, string> {
    // Create Basic Auth header from API key and secret key
    const authString = Buffer.from(`${credentials.apiKey}:${credentials.secretKey}`).toString('base64');
    
    return {
      'Authorization': `Basic ${authString}`,
      'Content-Type': 'application/json'
    };
  }
}

export const amplitudeService = new AmplitudeService();