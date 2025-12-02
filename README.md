# Amplitude MCP Server

A Model Context Protocol (MCP) server for Amplitude Analytics API, providing tools and resources for querying and segmenting event data.

## Overview

This MCP server enables AI assistants and other MCP clients to interact with the Amplitude Analytics API, allowing them to:

- Query event data with filters
- Perform advanced segmentation with breakdowns
- Export raw event data for detailed analysis
- Access event data through structured resources

## Installation

```json
{
  "mcpServers": {
    "amplitude": {
      "command": "npx",
      "args": [
        "-y",
        "amplitude-mcp",
        "--amplitude-api-key=YOUR_API_KEY",
        "--amplitude-secret-key=YOUR_SECRET_KEY"
      ]
    }
  }
}
```

### Required Credentials

Amplitude API credentials must be provided using command line arguments:

- `--amplitude-api-key`: Your Amplitude API key (required)
- `--amplitude-secret-key`: Your Amplitude secret key (required)

## Available Tools

### 1. query_events

Basic event querying with filters.

**Parameters:**

- `events` (array): Array of events to query
  - `eventType` (string): Type of event
  - `propertyFilters` (array, optional): Filters for event properties
- `start` (string): Start date in YYYYMMDD format
- `end` (string): End date in YYYYMMDD format
- `interval` (string, optional): Grouping interval (day, week, month)
- `groupBy` (string, optional): Grouping dimension

**Example:**

```json
{
  "events": [
    {
      "eventType": "user_login",
      "propertyFilters": [
        {
          "propertyName": "device_type",
          "value": "mobile",
          "op": "is"
        }
      ]
    }
  ],
  "start": "2023-01-01",
  "end": "2023-01-31",
  "interval": "day"
}
```

### 2. segment_events

Advanced event segmentation with breakdowns.

**Parameters:**

- All parameters from `query_events`
- `filters` (array, optional): Additional filters for segmentation
  - `type` (string): Filter type (property, event, user)
  - `propertyName` (string, optional): Name of the property
  - `value` (mixed, optional): Value to filter by
  - `op` (string, optional): Operator for comparison
- `breakdowns` (array, optional): Breakdown dimensions
  - `type` (string): Breakdown type (event, user)
  - `propertyName` (string): Name of the property to break down by

**Example:**

```json
{
  "events": [
    {
      "eventType": "purchase"
    }
  ],
  "start": "2023-01-01",
  "end": "2023-01-31",
  "interval": "week",
  "filters": [
    {
      "type": "user",
      "propertyName": "country",
      "value": "US",
      "op": "is"
    }
  ],
  "breakdowns": [
    {
      "type": "user",
      "propertyName": "device_type"
    }
  ]
}
```

### 3. export_events

Export raw event data from Amplitude. Returns detailed event records including user properties, event properties, device information, and more.

**Parameters:**

- `start` (string): Start time in YYYYMMDDTHH format (e.g., "20220201T05")
- `end` (string): End time in YYYYMMDDTHH format (e.g., "20220201T23")
- `limit` (number, optional): Maximum number of events to return (default: 1000, max: 10000)

**Important Notes:**

- Time format uses hours (00-23), not days
- Maximum time range: 365 days
- Data is available with a minimum 2-hour delay after server receipt
- Returns 404 if no data exists for the time range
- Maximum response size: 4GB (use smaller time ranges if exceeded)
- All timestamps are in UTC

**Example:**

```json
{
  "start": "20220201T00",
  "end": "20220201T23",
  "limit": 5000
}
```

**Response includes:**

Each event contains detailed information such as:
- Event metadata: `event_type`, `event_time`, `event_id`
- User information: `user_id`, `amplitude_id`, `device_id`
- Device details: `device_type`, `device_family`, `os_name`, `os_version`
- Location data: `country`, `region`, `city`, `location_lat`, `location_lng`
- Custom properties: `event_properties`, `user_properties`, `group_properties`
- Session data: `session_id`, `client_event_time`, `server_upload_time`

## Available Resources

### amplitude_events

Access event data for a specific event type and date range.

**URI Format:**
```
amplitude://events/{eventType}/{start}/{end}
```

**Example:**
```
amplitude://events/user_login/2023-01-01/2023-01-31
```

## Development

### Project Structure

```
amplitude-mcp/
├── src/
│   ├── index.ts                  # Main entry point with MCP server setup
│   ├── services/
│   │   └── amplitude.service.ts  # Amplitude API service implementation
│   ├── resources/
│   │   └── events.ts             # Event data resources
│   ├── types/
│   │   └── amplitude.ts          # Amplitude API types
│   └── utils/
│       └── config.ts             # Configuration and credential handling
├── bin/
│   └── cli.js                    # CLI entry point
├── dist/                         # Compiled JavaScript files
├── package.json
└── tsconfig.json
```

## License

MIT