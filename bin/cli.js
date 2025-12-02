#!/usr/bin/env node

// This is the CLI entry point for the amplitude-insights package
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import the server from the main index.js file
const serverPath = resolve(__dirname, '../dist/index.js');

// Dynamic import to load the server module
async function runServer() {
  try {
    // Dynamically import the server module
    const serverModule = await import(serverPath);
    
    // The server should already be created and exported from index.js
    // The connection to StdioServerTransport is already handled in index.js
    // Note: All logging is done via console.error() in index.js to avoid polluting stdout
    // stdout is reserved exclusively for JSON-RPC messages in MCP stdio transport
  } catch (error) {
    console.error('Failed to start Amplitude MCP server:', error);
    process.exit(1);
  }
}

// Run the server
runServer();