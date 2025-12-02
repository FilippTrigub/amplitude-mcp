import fetch from 'node-fetch';
import * as zlib from 'zlib';
import { promisify } from 'util';
import {
  AmplitudeCredentials,
  EventSegmentationParams,
  EventSegmentationResponse,
  AmplitudeErrorResponse,
  ExportParams,
  ExportedEvent
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