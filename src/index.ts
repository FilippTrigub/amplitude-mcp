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

server.registerTool(
  "query_events",
  {
    title: "Query Events",
    description: "Basic event querying with filters",
    inputSchema: {
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
    }
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

server.registerTool(
  "segment_events",
  {
    title: "Segment Events",
    description: "Advanced event segmentation with breakdowns and filters",
    inputSchema: {
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
    }
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

server.registerTool(
  "export_events",
  {
    title: "Export Events",
    description: "Export raw event data from Amplitude with detailed event records including user properties, event properties, device information, and more",
    inputSchema: {
      start: z.string().regex(/^\d{8}T\d{2}$/, "Start time must be in YYYYMMDDTHH format (e.g., 20220201T05)"),
      end: z.string().regex(/^\d{8}T\d{2}$/, "End time must be in YYYYMMDDTHH format (e.g., 20220201T23)"),
      limit: z.number().min(1).max(10000).optional().describe("Maximum number of events to return (default: 1000, max: 10000)")
    }
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

server.registerTool(
  "get_chart",
  {
    title: "Get Chart Data",
    description: "Retrieve JSON results from any saved Amplitude chart using its chart ID",
    inputSchema: {
      chartId: z.string().min(1, "Chart ID is required")
    }
  },
  async ({ chartId }) => {
    try {
      const credentials = getAmplitudeCredentials();
      const result = await amplitudeService.getChart(credentials, chartId);
      
      return {
        content: [
          { 
            type: "text", 
            text: "Chart data retrieved successfully:" 
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
          text: `Error getting chart: ${error instanceof Error ? error.message : 'Unknown error'}` 
        }],
        isError: true
      };
    }
  }
);

server.registerTool(
  "get_active_users",
  {
    title: "Get Active Users",
    description: "Get the number of active or new users for a date range",
    inputSchema: {
      start: z.string().regex(/^\d{8}$/, "Start date must be in YYYYMMDD format"),
      end: z.string().regex(/^\d{8}$/, "End date must be in YYYYMMDD format"),
      m: z.enum(['active', 'new']).optional().describe("User type: 'active' or 'new' (default: active)"),
      i: z.number().optional().describe("Interval: 1 (daily), 7 (weekly), 30 (monthly)"),
      s: z.string().optional().describe("Segment definitions as JSON string"),
      g: z.string().optional().describe("Property to group by")
    }
  },
  async ({ start, end, m, i, s, g }) => {
    try {
      const credentials = getAmplitudeCredentials();
      const result = await amplitudeService.getActiveUsers(credentials, { start, end, m, i, s, g });
      
      return {
        content: [
          { 
            type: "text", 
            text: "Active users data retrieved successfully:" 
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
          text: `Error getting active users: ${error instanceof Error ? error.message : 'Unknown error'}` 
        }],
        isError: true
      };
    }
  }
);

server.registerTool(
  "event_segmentation_dashboard",
  {
    title: "Event Segmentation (Dashboard)",
    description: "Get event metrics with segmentation from the Dashboard API. Supports various metrics like uniques, totals, DAU percentage, etc.",
    inputSchema: {
      e: z.string().describe("Event definition as JSON string (e.g., '{\"event_type\":\"_active\"}')"),
      start: z.string().regex(/^\d{8}$/, "Start date must be in YYYYMMDD format"),
      end: z.string().regex(/^\d{8}$/, "End date must be in YYYYMMDD format"),
      m: z.string().optional().describe("Metric: uniques, totals, pct_dau, average, histogram, sums, value_avg, formula"),
      i: z.number().optional().describe("Interval: -300000 (real-time), -3600000 (hourly), 1 (daily), 7 (weekly), 30 (monthly)"),
      s: z.string().optional().describe("Segment definitions as JSON string"),
      g: z.string().optional().describe("Property to group by"),
      limit: z.number().min(1).max(1000).optional().describe("Number of Group By values (default: 100, max: 1000)")
    }
  },
  async ({ e, start, end, m, i, s, g, limit }) => {
    try {
      const credentials = getAmplitudeCredentials();
      const result = await amplitudeService.getEventSegmentationDashboard(credentials, { e, start, end, m, i, s, g, limit });
      
      return {
        content: [
          { 
            type: "text", 
            text: "Event segmentation data retrieved successfully:" 
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
          text: `Error getting event segmentation: ${error instanceof Error ? error.message : 'Unknown error'}` 
        }],
        isError: true
      };
    }
  }
);

server.registerTool(
  "funnel_analysis",
  {
    title: "Funnel Analysis",
    description: "Get funnel drop-off and conversion rates. Analyze user progression through a series of events.",
    inputSchema: {
      events: z.array(z.string()).min(2, "At least 2 events required for funnel").describe("Array of event definitions as JSON strings"),
      start: z.string().regex(/^\d{8}$/, "Start date must be in YYYYMMDD format"),
      end: z.string().regex(/^\d{8}$/, "End date must be in YYYYMMDD format"),
      mode: z.enum(['ordered', 'unordered', 'sequential']).optional().describe("Funnel mode (default: ordered)"),
      i: z.number().optional().describe("Interval: 1 (daily), 7 (weekly), 30 (monthly)"),
      s: z.string().optional().describe("Segment definitions as JSON string"),
      g: z.string().optional().describe("Property to group by (limit: 1)"),
      cs: z.number().optional().describe("Conversion window in seconds (default: 2592000 = 30 days)"),
      limit: z.number().min(1).max(1000).optional().describe("Number of Group By values")
    }
  },
  async ({ events, start, end, mode, i, s, g, cs, limit }) => {
    try {
      const credentials = getAmplitudeCredentials();
      const result = await amplitudeService.getFunnelAnalysis(credentials, { events, start, end, mode, i, s, g, cs, limit });
      
      return {
        content: [
          { 
            type: "text", 
            text: "Funnel analysis data retrieved successfully:" 
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
          text: `Error getting funnel analysis: ${error instanceof Error ? error.message : 'Unknown error'}` 
        }],
        isError: true
      };
    }
  }
);

server.registerTool(
  "retention_analysis",
  {
    title: "Retention Analysis",
    description: "Get user retention metrics. Analyze how many users return to perform an action after their initial action.",
    inputSchema: {
      se: z.string().describe("Start event as JSON string (e.g., '{\"event_type\":\"_new\"}')"),
      re: z.string().describe("Return event as JSON string (e.g., '{\"event_type\":\"_active\"}')"),
      start: z.string().regex(/^\d{8}$/, "Start date must be in YYYYMMDD format"),
      end: z.string().regex(/^\d{8}$/, "End date must be in YYYYMMDD format"),
      rm: z.enum(['bracket', 'rolling', 'n-day']).optional().describe("Retention type (default: n-day)"),
      rb: z.string().optional().describe("Bracket definition as JSON (required if rm=bracket)"),
      i: z.number().optional().describe("Interval: 1 (daily), 7 (weekly), 30 (monthly)"),
      s: z.string().optional().describe("Segment definitions as JSON string"),
      g: z.string().optional().describe("Property to group by")
    }
  },
  async ({ se, re, start, end, rm, rb, i, s, g }) => {
    try {
      const credentials = getAmplitudeCredentials();
      const result = await amplitudeService.getRetentionAnalysis(credentials, { se, re, start, end, rm, rb, i, s, g });
      
      return {
        content: [
          { 
            type: "text", 
            text: "Retention analysis data retrieved successfully:" 
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
          text: `Error getting retention analysis: ${error instanceof Error ? error.message : 'Unknown error'}` 
        }],
        isError: true
      };
    }
  }
);

server.registerTool(
  "get_user_activity",
  {
    title: "Get User Activity",
    description: "Get detailed activity data for a specific user by their Amplitude ID",
    inputSchema: {
      user: z.string().min(1, "User ID is required").describe("Amplitude ID of the user"),
      offset: z.number().min(0).optional().describe("Zero-indexed offset from most recent event (default: 0)"),
      limit: z.number().min(1).max(1000).optional().describe("Number of events to return (default: 1000, max: 1000)"),
      direction: z.enum(['earliest', 'latest']).optional().describe("Direction: 'earliest' or 'latest' (default: latest)")
    }
  },
  async ({ user, offset, limit, direction }) => {
    try {
      const credentials = getAmplitudeCredentials();
      const result = await amplitudeService.getUserActivity(credentials, { user, offset, limit, direction });
      
      return {
        content: [
          { 
            type: "text", 
            text: "User activity data retrieved successfully:" 
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
          text: `Error getting user activity: ${error instanceof Error ? error.message : 'Unknown error'}` 
        }],
        isError: true
      };
    }
  }
);

server.registerTool(
  "get_events_list",
  {
    title: "Get Events List",
    description: "Get a list of all visible events in your Amplitude project with current week's totals, uniques, and % DAU",
    inputSchema: {}
  },
  async () => {
    try {
      const credentials = getAmplitudeCredentials();
      const result = await amplitudeService.getEventsList(credentials);
      
      return {
        content: [
          { 
            type: "text", 
            text: "Events list retrieved successfully:" 
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
          text: `Error getting events list: ${error instanceof Error ? error.message : 'Unknown error'}` 
        }],
        isError: true
      };
    }
  }
);

server.registerTool(
  "create_annotation",
  {
    title: "Create Chart Annotation",
    description: "Create an annotation to mark important dates (like feature releases and marketing campaigns) on charts in your Amplitude project",
    inputSchema: {
      app_id: z.number().describe("The Project ID of the project (required)"),
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format").describe("Date of the annotation (required)"),
      label: z.string().min(1, "Label is required").describe("The title of your annotation (required)"),
      chart_id: z.string().optional().describe("The ID of the chart to annotate. If omitted, annotation is global and appears on all charts"),
      details: z.string().optional().describe("Additional details for the annotation")
    }
  },
  async ({ app_id, date, label, chart_id, details }) => {
    try {
      const credentials = getAmplitudeCredentials();
      const result = await amplitudeService.createAnnotation(credentials, { app_id, date, label, chart_id, details });
      
      return {
        content: [
          { 
            type: "text", 
            text: "Annotation created successfully:" 
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
          text: `Error creating annotation: ${error instanceof Error ? error.message : 'Unknown error'}` 
        }],
        isError: true
      };
    }
  }
);

server.registerTool(
  "get_all_annotations",
  {
    title: "Get All Chart Annotations",
    description: "Get a list of all chart annotations in your Amplitude project",
    inputSchema: {}
  },
  async () => {
    try {
      const credentials = getAmplitudeCredentials();
      const result = await amplitudeService.getAllAnnotations(credentials);
      
      return {
        content: [
          { 
            type: "text", 
            text: "All annotations retrieved successfully:" 
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
          text: `Error getting annotations: ${error instanceof Error ? error.message : 'Unknown error'}` 
        }],
        isError: true
      };
    }
  }
);

server.registerTool(
  "get_annotation",
  {
    title: "Get Chart Annotation",
    description: "Get a single chart annotation by its ID",
    inputSchema: {
      id: z.number().describe("Annotation ID (required)")
    }
  },
  async ({ id }) => {
    try {
      const credentials = getAmplitudeCredentials();
      const result = await amplitudeService.getAnnotation(credentials, id);
      
      return {
        content: [
          { 
            type: "text", 
            text: "Annotation retrieved successfully:" 
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
          text: `Error getting annotation: ${error instanceof Error ? error.message : 'Unknown error'}` 
        }],
        isError: true
      };
    }
  }
);

server.registerResource(
  "amplitude_events",
  eventsResourceTemplate,
  {
    title: "Amplitude Events",
    description: "Access event data for a specific event type and date range"
  },
  eventsResourceHandler
);

console.error("✓ Registered 13 tools: query_events, segment_events, export_events, get_chart, get_active_users, event_segmentation_dashboard, funnel_analysis, retention_analysis, get_user_activity, get_events_list, create_annotation, get_all_annotations, get_annotation");
console.error("✓ Registered 1 resource: amplitude_events");

const transport = new StdioServerTransport();
await server.connect(transport);

console.error("✓ Server connected and ready on stdio transport");
console.error("Amplitude MCP Server is running. Waiting for requests...");