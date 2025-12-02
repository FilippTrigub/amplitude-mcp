# Amplitude MCP Server

## Project Overview

This is a **Model Context Protocol (MCP) server** that provides AI assistants and MCP clients with access to the Amplitude Analytics API. The server enables querying and segmenting event data from Amplitude through a standardized MCP interface.

### Key Technologies

- **Runtime**: Node.js (ES Modules)
- **Language**: TypeScript 5.8.3
- **Framework**: MCP SDK (`@modelcontextprotocol/sdk`)
- **HTTP Client**: node-fetch 2.7.0
- **CLI Parsing**: yargs 17.7.2
- **Validation**: Zod 3.24.2
- **Transport**: stdio (Standard Input/Output)

### Architecture

The project follows a clean, modular architecture:

```
src/
├── index.ts                    # MCP server setup, tool & resource registration
├── services/
│   └── amplitude.service.ts    # Amplitude API client (HTTP requests, auth)
├── resources/
│   └── events.ts               # MCP resource handlers for event data
├── types/
│   └── amplitude.ts            # TypeScript interfaces for Amplitude API
└── utils/
    └── config.ts               # CLI argument parsing for credentials
```

**Design Pattern**: The server uses a service-oriented architecture where:
- `index.ts` acts as the MCP server orchestrator
- `AmplitudeService` handles all Amplitude API interactions
- Resources and tools are cleanly separated
- Configuration is centralized in `utils/config.ts`

## Building and Running

### Prerequisites

Amplitude API credentials are required:
- **API Key**: Your Amplitude API key
- **Secret Key**: Your Amplitude secret key

### Development Commands

```bash
# Install dependencies
npm install

# Build the project (compile TypeScript to JavaScript)
npm run build

# Watch mode for development (auto-recompile on changes)
npm run dev

# Start the server (requires credentials)
npm start

# Or with custom credentials:
node dist/index.js --amplitude-api-key=YOUR_API_KEY --amplitude-secret-key=YOUR_SECRET_KEY

# Inspect the MCP server with the MCP Inspector
npm run inspect
```

### Installation as MCP Server

Add to your MCP client configuration (e.g., Claude Desktop):

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

### Publishing

```bash
# Prepare for publishing (runs build automatically)
npm run prepublishOnly

# Publish to npm
npm publish
```

## Development Conventions

### Code Style

- **Module System**: ES Modules (`"type": "module"` in package.json)
- **File Extensions**: All imports use `.js` extensions (even for `.ts` files) due to ES module requirements
- **TypeScript**: Strict mode is disabled (`"strict": false`), implicit any is allowed
- **Formatting**: Uses Windows line endings (CRLF - `\r\n`)
- **Error Handling**: Try-catch blocks with descriptive error messages, errors are returned as MCP error responses

### TypeScript Configuration

- **Target**: ES2020
- **Module Resolution**: NodeNext (for ES modules)
- **Output**: `dist/` directory
- **Source Maps**: Enabled for debugging
- **Path Aliases**: `~/*` maps to `./src/*`

### Authentication Pattern

The server uses **HTTP Basic Authentication** for Amplitude API:
- Credentials are passed via CLI arguments (`--amplitude-api-key`, `--amplitude-secret-key`)
- Base64-encoded auth header: `Authorization: Basic base64(apiKey:secretKey)`
- Credentials are retrieved using `getAmplitudeCredentials()` utility

### MCP Tools

The server exposes two tools:

1. **`query_events`**: Basic event querying with filters
   - Parameters: events, start, end, interval, groupBy
   - Date format: YYYYMMDD (e.g., "20230101")
   - Returns: Event data with series, labels, and x-values

2. **`segment_events`**: Advanced segmentation with breakdowns
   - All parameters from `query_events` plus:
   - `filters`: Additional segmentation filters (property, event, user)
   - `breakdowns`: Breakdown dimensions by event or user properties

### MCP Resources

**`amplitude_events`**: URI-based resource access
- Format: `amplitude://events/{eventType}/{start}/{end}`
- Example: `amplitude://events/user_login/20230101/20230131`
- Returns: JSON event data for the specified event type and date range

### API Integration

- **Base URL**: `https://amplitude.com/api/2`
- **Endpoint**: `/events/segmentation`
- **Method**: GET
- **Response Format**: JSON with data, metadata structure
- **Error Handling**: Checks response.ok, parses error messages from API

### Testing Approach

- No automated tests are currently implemented
- Manual testing via MCP Inspector: `npm run inspect`
- Test with actual Amplitude credentials and event data

## Project Context

### Purpose

This MCP server bridges AI assistants (like Claude) with Amplitude Analytics, enabling:
- Natural language queries about event data
- Automated analytics workflows
- Integration of analytics data into AI-powered applications

### Package Distribution

- **Package Name**: `amplitude-mcp`
- **Version**: 0.0.2
- **License**: MIT
- **Published Files**: `dist/`, `bin/`
- **Binary**: `amplitude-mcp` CLI command

### Key Dependencies

- `@modelcontextprotocol/sdk`: Core MCP functionality
- `node-fetch`: HTTP requests to Amplitude API
- `yargs`: CLI argument parsing
- `zod`: Runtime schema validation for tool parameters

### Entry Points

1. **CLI**: `bin/cli.js` - Executable entry point for npx/npm
2. **Module**: `dist/index.js` - Main module export after compilation

## Notes for AI Assistants

- Always use absolute paths when working with files
- Credentials are mandatory - the server will fail without them
- Date parameters must be in YYYYMMDD format (8 digits)
- The server uses stdio transport, so it communicates via stdin/stdout
- All API responses are wrapped in MCP content format with type "text"
- Error responses include `isError: true` flag
