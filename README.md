# Amplitude MCP Server

A Model Context Protocol (MCP) server for Amplitude Analytics API, providing tools and resources for querying and segmenting event data.

## Overview

This MCP server enables AI assistants and other MCP clients to interact with the Amplitude Analytics API, allowing them to:

- Query event data with filters
- Perform advanced segmentation with breakdowns
- Export raw event data for detailed analysis
- Analyze funnels and user retention
- Get active user counts and event lists
- Access user activity data
- Retrieve data from saved charts
- Access event data through structured resources

## Installation

### Option 1: Using Command Line Arguments

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

### Option 2: Using Environment Variables (Recommended)

```json
{
  "mcpServers": {
    "amplitude": {
      "command": "npx",
      "args": ["-y", "amplitude-mcp"],
      "env": {
        "AMPLITUDE_API_KEY": "YOUR_API_KEY",
        "AMPLITUDE_SECRET_KEY": "YOUR_SECRET_KEY"
      }
    }
  }
}
```

### Required Credentials

Amplitude API credentials can be provided in two ways:

**Option 1: Command Line Arguments**
- `--amplitude-api-key`: Your Amplitude API key
- `--amplitude-secret-key`: Your Amplitude secret key

**Option 2: Environment Variables (Recommended)**
- `AMPLITUDE_API_KEY`: Your Amplitude API key
- `AMPLITUDE_SECRET_KEY`: Your Amplitude secret key

**Priority:** Command line arguments take precedence over environment variables if both are provided.

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

### 4. get_chart

Retrieve JSON results from any saved Amplitude chart using its chart ID.

**Parameters:**

- `chartId` (string): Chart ID from the chart's URL (required)

**Example:**

```json
{
  "chartId": "abc123"
}
```

### 5. get_active_users

Get the number of active or new users for a date range.

**Parameters:**

- `start` (string): First date in YYYYMMDD format (required)
- `end` (string): Last date in YYYYMMDD format (required)
- `m` (string, optional): User type - 'active' or 'new' (default: 'active')
- `i` (number, optional): Interval - 1 (daily), 7 (weekly), 30 (monthly)
- `s` (string, optional): Segment definitions as JSON string
- `g` (string, optional): Property to group by

**Example:**

```json
{
  "start": "20220101",
  "end": "20220131",
  "m": "active",
  "i": 7
}
```

### 6. event_segmentation_dashboard

Get event metrics with segmentation from the Dashboard API. Supports various metrics like uniques, totals, DAU percentage, etc.

**Parameters:**

- `e` (string): Event definition as JSON string (e.g., '{"event_type":"_active"}') (required)
- `start` (string): Start date in YYYYMMDD format (required)
- `end` (string): End date in YYYYMMDD format (required)
- `m` (string, optional): Metric - uniques, totals, pct_dau, average, histogram, sums, value_avg, formula
- `i` (number, optional): Interval - -300000 (real-time), -3600000 (hourly), 1 (daily), 7 (weekly), 30 (monthly)
- `s` (string, optional): Segment definitions as JSON string
- `g` (string, optional): Property to group by
- `limit` (number, optional): Number of Group By values (default: 100, max: 1000)

**Example:**

```json
{
  "e": "{\"event_type\":\"_active\"}",
  "start": "20220101",
  "end": "20220131",
  "m": "uniques",
  "i": 1
}
```

### 7. funnel_analysis

Get funnel drop-off and conversion rates. Analyze user progression through a series of events.

**Parameters:**

- `events` (array): Array of event definitions as JSON strings (minimum 2 required)
- `start` (string): Start date in YYYYMMDD format (required)
- `end` (string): End date in YYYYMMDD format (required)
- `mode` (string, optional): Funnel mode - 'ordered', 'unordered', 'sequential' (default: 'ordered')
- `i` (number, optional): Interval - 1 (daily), 7 (weekly), 30 (monthly)
- `s` (string, optional): Segment definitions as JSON string
- `g` (string, optional): Property to group by (limit: 1)
- `cs` (number, optional): Conversion window in seconds (default: 2592000 = 30 days)
- `limit` (number, optional): Number of Group By values

**Example:**

```json
{
  "events": [
    "{\"event_type\":\"view_product\"}",
    "{\"event_type\":\"add_to_cart\"}",
    "{\"event_type\":\"purchase\"}"
  ],
  "start": "20220101",
  "end": "20220131",
  "mode": "ordered"
}
```

### 8. retention_analysis

Get user retention metrics. Analyze how many users return to perform an action after their initial action.

**Parameters:**

- `se` (string): Start event as JSON string (e.g., '{"event_type":"_new"}') (required)
- `re` (string): Return event as JSON string (e.g., '{"event_type":"_active"}') (required)
- `start` (string): Start date in YYYYMMDD format (required)
- `end` (string): End date in YYYYMMDD format (required)
- `rm` (string, optional): Retention type - 'bracket', 'rolling', 'n-day' (default: 'n-day')
- `rb` (string, optional): Bracket definition as JSON (required if rm='bracket')
- `i` (number, optional): Interval - 1 (daily), 7 (weekly), 30 (monthly)
- `s` (string, optional): Segment definitions as JSON string
- `g` (string, optional): Property to group by

**Example:**

```json
{
  "se": "{\"event_type\":\"_new\"}",
  "re": "{\"event_type\":\"_active\"}",
  "start": "20220101",
  "end": "20220131",
  "rm": "n-day",
  "i": 7
}
```

### 9. get_user_activity

Get detailed activity data for a specific user by their Amplitude ID.

**Parameters:**

- `user` (string): Amplitude ID of the user (required)
- `offset` (number, optional): Zero-indexed offset from most recent event (default: 0)
- `limit` (number, optional): Number of events to return (default: 1000, max: 1000)
- `direction` (string, optional): Direction - 'earliest' or 'latest' (default: 'latest')

**Example:**

```json
{
  "user": "123456789",
  "limit": 100,
  "direction": "latest"
}
```

### 10. get_events_list

Get a list of all visible events in your Amplitude project with current week's totals, uniques, and % DAU.

**Parameters:** None

**Example:**

```json
{}
```

### 11. create_annotation

Create an annotation to mark important dates (like feature releases and marketing campaigns) on charts in your Amplitude project.

**Parameters:**

- `app_id` (number): The Project ID of the project (required)
- `date` (string): Date of the annotation in YYYY-MM-DD format (required)
- `label` (string): The title of your annotation (required)
- `chart_id` (string, optional): The ID of the chart to annotate. If omitted, annotation is global and appears on all charts
- `details` (string, optional): Additional details for the annotation

**Example:**

```json
{
  "app_id": 12345,
  "date": "2023-09-16",
  "label": "Version 2.4 Release",
  "details": "Added new user properties and improved performance"
}
```

### 12. get_all_annotations

Get a list of all chart annotations in your Amplitude project.

**Parameters:** None

**Example:**

```json
{}
```

### 13. get_annotation

Get a single chart annotation by its ID.

**Parameters:**

- `id` (number): Annotation ID (required)

**Example:**

```json
{
  "id": 160427
}
```

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