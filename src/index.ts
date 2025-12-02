import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { amplitudeService } from "./services/amplitude.service.js";
import { eventsResourceTemplate, eventsResourceHandler } from "./resources/events.js";
import { EventSegmentationEvent, EventSegmentationFilter, EventSegmentationBreakdown } from "./types/amplitude.js";
import { getAmplitudeCredentials } from "./utils/config.js";

console.error("Amplitude MCP Server initializing...");

// Validate credentials early
try {
  const credentials = getAmplitudeCredentials();
  console.error("✓ Credentials loaded successfully");
} catch (error) {
  console.error("✗ Failed to load credentials:", error instanceof Error ? error.message : 'Unknown error');
  process.exit(1);
}

// Create MCP server
export const server = new McpServer({
  name: "amplitude-mcp",
  version: "0.0.1"
});

console.error("✓ MCP Server created");

server.tool("query_events",
  {
    events: z.array(z.object({
      eventType: z.string().min(1, "Event type is required"),
      propertyFilters: z.array(z.object({
        propertyName: z.string(),
        value: z.union([
          z.string(),
          z.number(),
          z.boolean(),
          z.array(z.union([z.string(), z.number(), z.boolean()]))
        ]),
        op: z.enum([
          'is', 'is not', 'contains', 'does not contain', '>', '<', '>=', '<='
        ])
      })).optional()
    })).min(1, "At least one event is required"),
    start: z.string().regex(/^\d{8}/, "Start date must be in YYYYMMDD format"),
    end: z.string().regex(/^\d{8}/, "End date must be in YYYYMMDD format"),
    interval: z.enum(['day', 'week', 'month']).optional(),
    groupBy: z.string().optional()
  },
  async ({ events, start, end, interval, groupBy }) => {
    try {
      const credentials = getAmplitudeCredentials();

      const queryParams = {
        events: events as EventSegmentationEvent[],
        start,
        end,
        interval,
        groupBy
      };

      const result = await amplitudeService.queryEvents(credentials, queryParams);

      return {
        content: [
          { 
            type: "text", 
            text: "Event data retrieved successfully:" 
          },
          {
            type: "text",
            text: JSON.stringify(result, null, 2)
          }
        ]
      };
    } catch (error) {
      return {
        content: [{ 
          type: "text", 
          text: `Error querying events: ${error instanceof Error ? error.message : 'Unknown error'}` 
        }],
        isError: true
      };
    }
  }
);

server.tool("segment_events",
  {
    events: z.array(z.object({
      eventType: z.string().min(1, "Event type is required"),
      propertyFilters: z.array(z.object({
        propertyName: z.string(),
        value: z.union([
          z.string(),
          z.number(),
          z.boolean(),
          z.array(z.union([z.string(), z.number(), z.boolean()]))
        ]),
        op: z.enum([
          'is', 'is not', 'contains', 'does not contain', '>', '<', '>=', '<='
        ])
      })).optional()
    })).min(1, "At least one event is required"),
    start: z.string().regex(/^\d{8}/, "Start date must be in YYYYMMDD format"),
    end: z.string().regex(/^\d{8}/, "End date must be in YYYYMMDD format"),
    interval: z.enum(['day', 'week', 'month']).optional(),
    groupBy: z.string().optional(),
    filters: z.array(z.object({
      type: z.enum(['property', 'event', 'user']),
      propertyName: z.string().optional(),
      value: z.union([
        z.string(),
        z.number(),
        z.boolean(),
        z.array(z.union([z.string(), z.number(), z.boolean()]))
      ]).optional(),
      op: z.enum([
        'is', 'is not', 'contains', 'does not contain', '>', '<', '>=', '<='
      ]).optional()
    })).optional(),
    breakdowns: z.array(z.object({
      type: z.enum(['event', 'user']),
      propertyName: z.string()
    })).optional()
  },
  async ({ events, start, end, interval, groupBy, filters, breakdowns }) => {
    try {
      const credentials = getAmplitudeCredentials();

      const queryParams = {
        events: events as EventSegmentationEvent[],
        start,
        end,
        interval,
        groupBy,
        filters: filters as EventSegmentationFilter[] | undefined,
        breakdowns: breakdowns as EventSegmentationBreakdown[] | undefined
      };

      const result = await amplitudeService.queryEvents(credentials, queryParams);
      
      return {
        content: [
          { 
            type: "text", 
            text: "Segmented event data retrieved successfully:" 
          },
          {
            type: "text",
            text: JSON.stringify(result, null, 2)
          }
        ]
      };
    } catch (error) {
      return {
        content: [{ 
          type: "text", 
          text: `Error segmenting events: ${error instanceof Error ? error.message : 'Unknown error'}` 
        }],
        isError: true
      };
    }
  }
);

server.tool("export_events",
  {
    start: z.string().regex(/^\d{8}T\d{2}$/, "Start time must be in YYYYMMDDTHH format (e.g., 20220201T05)"),
    end: z.string().regex(/^\d{8}T\d{2}$/, "End time must be in YYYYMMDDTHH format (e.g., 20220201T23)"),
    limit: z.number().min(1).max(10000).optional().describe("Maximum number of events to return (default: 1000, max: 10000)")
  },
  async ({ start, end, limit }) => {
    try {
      const credentials = getAmplitudeCredentials();

      const exportParams = {
        start,
        end
      };

      const events = await amplitudeService.exportEvents(credentials, exportParams);
      
      // Apply limit if specified
      const limitedEvents = limit ? events.slice(0, limit) : events.slice(0, 1000);
      const totalEvents = events.length;
      
      return {
        content: [
          { 
            type: "text", 
            text: `Raw event data exported successfully. Total events: ${totalEvents}, Returned: ${limitedEvents.length}` 
          },
          {
            type: "text",
            text: JSON.stringify(limitedEvents, null, 2)
          }
        ]
      };
    } catch (error) {
      return {
        content: [{ 
          type: "text", 
          text: `Error exporting events: ${error instanceof Error ? error.message : 'Unknown error'}` 
        }],
        isError: true
      };
    }
  }
);

server.resource(
  "amplitude_events",
  eventsResourceTemplate,
  eventsResourceHandler
);

console.error("✓ Registered 3 tools: query_events, segment_events, export_events");
console.error("✓ Registered 1 resource: amplitude_events");

const transport = new StdioServerTransport();
await server.connect(transport);

console.error("✓ Server connected and ready on stdio transport");
console.error("Amplitude MCP Server is running. Waiting for requests...");