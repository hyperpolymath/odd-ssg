// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2025 Jonathan D.A. Jewell

/**
 * NoteG MCP Server
 * Model Context Protocol server for odd-ssg adapters
 */

import type { SSGAdapter, ToolResult } from "../ssg/src/types.ts";

// MCP Protocol types
interface MCPRequest {
  jsonrpc: "2.0";
  id: number | string;
  method: string;
  params?: Record<string, unknown>;
}

interface MCPResponse {
  jsonrpc: "2.0";
  id: number | string;
  result?: unknown;
  error?: { code: number; message: string; data?: unknown };
}

interface MCPNotification {
  jsonrpc: "2.0";
  method: string;
  params?: Record<string, unknown>;
}

interface Tool {
  name: string;
  description: string;
  inputSchema: {
    type: "object";
    properties: Record<string, unknown>;
    required?: string[];
  };
}

interface Resource {
  uri: string;
  name: string;
  mimeType?: string;
  description?: string;
}

// Load all adapters
async function loadAdapters(): Promise<Map<string, SSGAdapter>> {
  const adapters = new Map<string, SSGAdapter>();
  const adapterFiles = [
    "babashka", "cobalt", "coleslaw", "cryogen", "documenter",
    "ema", "fornax", "franklin", "frog", "hakyll",
    "laika", "marmot", "mdbook", "nimble-publisher", "nimrod",
    "orchid", "perun", "pollen", "publish", "reggae",
    "scalatex", "serum", "staticwebpages", "tableau", "wub",
    "yocaml", "zola", "zotonic"
  ];

  for (const name of adapterFiles) {
    try {
      const adapter = await import(`../adapters/${name}.js`) as SSGAdapter;
      adapters.set(name, adapter);
    } catch (e) {
      console.error(`Failed to load adapter ${name}:`, e);
    }
  }

  return adapters;
}

class MCPServer {
  private adapters: Map<string, SSGAdapter> = new Map();
  private connectedAdapters: Set<string> = new Set();

  async initialize(): Promise<void> {
    this.adapters = await loadAdapters();
    console.error(`Loaded ${this.adapters.size} adapters`);
  }

  async handleRequest(request: MCPRequest): Promise<MCPResponse> {
    try {
      switch (request.method) {
        case "initialize":
          return this.handleInitialize(request);
        case "tools/list":
          return this.handleToolsList(request);
        case "tools/call":
          return await this.handleToolsCall(request);
        case "resources/list":
          return this.handleResourcesList(request);
        case "resources/read":
          return await this.handleResourcesRead(request);
        default:
          return {
            jsonrpc: "2.0",
            id: request.id,
            error: { code: -32601, message: `Method not found: ${request.method}` }
          };
      }
    } catch (e) {
      return {
        jsonrpc: "2.0",
        id: request.id,
        error: { code: -32603, message: String(e) }
      };
    }
  }

  private handleInitialize(request: MCPRequest): MCPResponse {
    return {
      jsonrpc: "2.0",
      id: request.id,
      result: {
        protocolVersion: "2024-11-05",
        capabilities: {
          tools: {},
          resources: { subscribe: false, listChanged: false }
        },
        serverInfo: {
          name: "odd-ssg",
          version: "0.1.0"
        }
      }
    };
  }

  private handleToolsList(request: MCPRequest): MCPResponse {
    const tools: Tool[] = [];

    // Add meta tools
    tools.push({
      name: "odd_ssg_list_adapters",
      description: "List all available SSG adapters",
      inputSchema: { type: "object", properties: {} }
    });

    tools.push({
      name: "odd_ssg_connect",
      description: "Connect to an SSG adapter (check if binary is available)",
      inputSchema: {
        type: "object",
        properties: {
          adapter: { type: "string", description: "Adapter name (e.g., 'zola', 'hakyll')" }
        },
        required: ["adapter"]
      }
    });

    // Add tools from all adapters
    for (const [adapterName, adapter] of this.adapters) {
      for (const tool of adapter.tools) {
        tools.push({
          name: `${adapterName}_${tool.name.replace(`${adapterName}_`, "")}`,
          description: `[${adapter.name}] ${tool.description}`,
          inputSchema: tool.inputSchema
        });
      }
    }

    return {
      jsonrpc: "2.0",
      id: request.id,
      result: { tools }
    };
  }

  private async handleToolsCall(request: MCPRequest): Promise<MCPResponse> {
    const params = request.params as { name: string; arguments?: Record<string, unknown> };
    const toolName = params.name;
    const args = params.arguments ?? {};

    // Handle meta tools
    if (toolName === "odd_ssg_list_adapters") {
      const adapterList = Array.from(this.adapters.entries()).map(([name, adapter]) => ({
        name,
        displayName: adapter.name,
        language: adapter.language,
        description: adapter.description,
        connected: this.connectedAdapters.has(name)
      }));

      return {
        jsonrpc: "2.0",
        id: request.id,
        result: {
          content: [{
            type: "text",
            text: JSON.stringify(adapterList, null, 2)
          }]
        }
      };
    }

    if (toolName === "odd_ssg_connect") {
      const adapterName = args.adapter as string;
      const adapter = this.adapters.get(adapterName);

      if (!adapter) {
        return {
          jsonrpc: "2.0",
          id: request.id,
          error: { code: -32602, message: `Unknown adapter: ${adapterName}` }
        };
      }

      const connected = await adapter.connect();
      if (connected) {
        this.connectedAdapters.add(adapterName);
      }

      return {
        jsonrpc: "2.0",
        id: request.id,
        result: {
          content: [{
            type: "text",
            text: connected
              ? `Successfully connected to ${adapter.name}`
              : `Failed to connect to ${adapter.name} - binary not found`
          }]
        }
      };
    }

    // Find adapter and tool
    const [adapterName, ...toolParts] = toolName.split("_");
    const adapter = this.adapters.get(adapterName);

    if (!adapter) {
      return {
        jsonrpc: "2.0",
        id: request.id,
        error: { code: -32602, message: `Unknown adapter: ${adapterName}` }
      };
    }

    const tool = adapter.tools.find(t =>
      t.name === toolName || t.name === `${adapterName}_${toolParts.join("_")}`
    );

    if (!tool) {
      return {
        jsonrpc: "2.0",
        id: request.id,
        error: { code: -32602, message: `Unknown tool: ${toolName}` }
      };
    }

    // Execute tool
    const result = await tool.execute(args) as ToolResult;

    return {
      jsonrpc: "2.0",
      id: request.id,
      result: {
        content: [{
          type: "text",
          text: result.success
            ? result.stdout || "Command executed successfully"
            : `Error (code ${result.code}): ${result.stderr || "Unknown error"}`
        }],
        isError: !result.success
      }
    };
  }

  private handleResourcesList(request: MCPRequest): MCPResponse {
    const resources: Resource[] = [];

    // List adapters as resources
    for (const [name, adapter] of this.adapters) {
      resources.push({
        uri: `odd-ssg://adapters/${name}`,
        name: adapter.name,
        mimeType: "application/json",
        description: adapter.description
      });
    }

    return {
      jsonrpc: "2.0",
      id: request.id,
      result: { resources }
    };
  }

  private async handleResourcesRead(request: MCPRequest): Promise<MCPResponse> {
    const params = request.params as { uri: string };
    const uri = params.uri;

    // Parse URI
    const match = uri.match(/^odd-ssg:\/\/adapters\/(.+)$/);
    if (!match) {
      return {
        jsonrpc: "2.0",
        id: request.id,
        error: { code: -32602, message: `Invalid URI: ${uri}` }
      };
    }

    const adapterName = match[1];
    const adapter = this.adapters.get(adapterName);

    if (!adapter) {
      return {
        jsonrpc: "2.0",
        id: request.id,
        error: { code: -32602, message: `Unknown adapter: ${adapterName}` }
      };
    }

    const content = {
      name: adapter.name,
      language: adapter.language,
      description: adapter.description,
      connected: this.connectedAdapters.has(adapterName),
      tools: adapter.tools.map(t => ({
        name: t.name,
        description: t.description,
        inputSchema: t.inputSchema
      }))
    };

    return {
      jsonrpc: "2.0",
      id: request.id,
      result: {
        contents: [{
          uri,
          mimeType: "application/json",
          text: JSON.stringify(content, null, 2)
        }]
      }
    };
  }
}

// Main server loop
async function main() {
  const server = new MCPServer();
  await server.initialize();

  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  const buffer = new Uint8Array(65536);
  let messageBuffer = "";
  let contentLength = 0;
  let headerComplete = false;

  console.error("odd-ssg MCP Server started");

  while (true) {
    const n = await Deno.stdin.read(buffer);
    if (n === null) break;

    messageBuffer += decoder.decode(buffer.subarray(0, n));

    while (true) {
      if (!headerComplete) {
        const headerEnd = messageBuffer.indexOf("\r\n\r\n");
        if (headerEnd === -1) break;

        const headers = messageBuffer.substring(0, headerEnd);
        const match = headers.match(/Content-Length:\s*(\d+)/i);
        if (match) {
          contentLength = parseInt(match[1]);
        }
        messageBuffer = messageBuffer.substring(headerEnd + 4);
        headerComplete = true;
      }

      if (headerComplete && messageBuffer.length >= contentLength) {
        const content = messageBuffer.substring(0, contentLength);
        messageBuffer = messageBuffer.substring(contentLength);
        headerComplete = false;

        try {
          const request = JSON.parse(content) as MCPRequest;
          const response = await server.handleRequest(request);

          const responseStr = JSON.stringify(response);
          const responseBytes = encoder.encode(responseStr);
          const header = `Content-Length: ${responseBytes.length}\r\n\r\n`;
          await Deno.stdout.write(encoder.encode(header));
          await Deno.stdout.write(responseBytes);
        } catch (e) {
          console.error("Error:", e);
        }
      } else {
        break;
      }
    }
  }
}

if (import.meta.main) {
  main();
}

export { MCPServer };
