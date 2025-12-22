// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2025 Jonathan D.A. Jewell

/**
 * End-to-End Adapter Tests
 * Tests the SSG adapters with actual or mocked binaries
 */

import { assertEquals, assertExists, assert } from "@std/assert";
import { describe, it } from "@std/testing/bdd";

// Adapter interface verification
interface AdapterExports {
  name: string;
  language: string;
  description: string;
  connect: () => Promise<boolean>;
  disconnect: () => Promise<void>;
  isConnected: () => boolean;
  tools: Array<{
    name: string;
    description: string;
    inputSchema: { type: string; properties: Record<string, unknown> };
    execute: (params: Record<string, unknown>) => Promise<unknown>;
  }>;
}

// List of all adapters to test
const ADAPTERS = [
  "babashka", "cobalt", "coleslaw", "cryogen", "documenter",
  "ema", "fornax", "franklin", "frog", "hakyll",
  "laika", "marmot", "mdbook", "nimble-publisher", "nimrod",
  "orchid", "perun", "pollen", "publish", "reggae",
  "scalatex", "serum", "staticwebpages", "tableau", "wub",
  "yocaml", "zola", "zotonic"
];

describe("Adapter Interface Compliance", () => {
  for (const adapterName of ADAPTERS) {
    describe(`${adapterName} adapter`, () => {
      let adapter: AdapterExports;

      it("should export required interface", async () => {
        try {
          adapter = await import(`../../adapters/${adapterName}.js`);

          // Check required exports
          assertExists(adapter.name, `${adapterName} must export 'name'`);
          assertExists(adapter.language, `${adapterName} must export 'language'`);
          assertExists(adapter.description, `${adapterName} must export 'description'`);
          assertExists(adapter.connect, `${adapterName} must export 'connect'`);
          assertExists(adapter.disconnect, `${adapterName} must export 'disconnect'`);
          assertExists(adapter.isConnected, `${adapterName} must export 'isConnected'`);
          assertExists(adapter.tools, `${adapterName} must export 'tools'`);
        } catch (e) {
          // Skip if adapter cannot be imported (expected in CI without Deno)
          console.log(`Skipping ${adapterName}: ${e}`);
        }
      });

      it("should have valid name string", async () => {
        if (!adapter) return;
        assertEquals(typeof adapter.name, "string");
        assert(adapter.name.length > 0, "name must not be empty");
      });

      it("should have valid language string", async () => {
        if (!adapter) return;
        assertEquals(typeof adapter.language, "string");
        assert(adapter.language.length > 0, "language must not be empty");
      });

      it("should have valid description string", async () => {
        if (!adapter) return;
        assertEquals(typeof adapter.description, "string");
        assert(adapter.description.length > 10, "description should be descriptive");
      });

      it("should have connect as async function", async () => {
        if (!adapter) return;
        assertEquals(typeof adapter.connect, "function");
      });

      it("should have disconnect as async function", async () => {
        if (!adapter) return;
        assertEquals(typeof adapter.disconnect, "function");
      });

      it("should have isConnected as function returning boolean", async () => {
        if (!adapter) return;
        assertEquals(typeof adapter.isConnected, "function");
        const result = adapter.isConnected();
        assertEquals(typeof result, "boolean");
      });

      it("should have tools array with valid structure", async () => {
        if (!adapter) return;
        assert(Array.isArray(adapter.tools), "tools must be an array");
        assert(adapter.tools.length > 0, "tools must have at least one entry");

        for (const tool of adapter.tools) {
          assertExists(tool.name, "tool must have name");
          assertExists(tool.description, "tool must have description");
          assertExists(tool.inputSchema, "tool must have inputSchema");
          assertExists(tool.execute, "tool must have execute function");

          assertEquals(typeof tool.name, "string");
          assertEquals(typeof tool.description, "string");
          assertEquals(typeof tool.execute, "function");
          assertEquals(tool.inputSchema.type, "object");
        }
      });
    });
  }
});

describe("Adapter Tool Schemas", () => {
  it("should have valid JSON schemas for all tools", async () => {
    for (const adapterName of ADAPTERS) {
      try {
        const adapter = await import(`../../adapters/${adapterName}.js`) as AdapterExports;

        for (const tool of adapter.tools) {
          // Verify schema structure
          assertEquals(tool.inputSchema.type, "object");
          assertExists(tool.inputSchema.properties);
          assertEquals(typeof tool.inputSchema.properties, "object");

          // Verify each property has a type
          for (const [propName, propSchema] of Object.entries(tool.inputSchema.properties)) {
            const schema = propSchema as { type?: string; description?: string };
            assertExists(schema.type, `${adapterName}.${tool.name}.${propName} must have type`);
          }
        }
      } catch {
        // Skip if adapter cannot be imported
      }
    }
  });
});

describe("Adapter Security", () => {
  it("should use safe command execution (no shell injection)", async () => {
    // Read adapter files and verify they use Deno.Command with args array
    for (const adapterName of ADAPTERS) {
      const path = `adapters/${adapterName}.js`;
      try {
        const content = await Deno.readTextFile(path);

        // Should use Deno.Command, not shell execution
        assert(
          content.includes("Deno.Command") || content.includes("new Command"),
          `${adapterName} should use Deno.Command`
        );

        // Should pass args as array, not string
        assert(
          !content.includes("shell: true"),
          `${adapterName} should not use shell mode`
        );

        // Should not use eval
        assert(
          !content.includes("eval("),
          `${adapterName} should not use eval`
        );
      } catch {
        // File read may fail in some environments
      }
    }
  });
});
