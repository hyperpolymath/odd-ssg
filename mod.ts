// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2025 Jonathan D.A. Jewell

/**
 * odd-ssg - Satellite SSG Adapter Provider
 *
 * Provides MCP-compatible adapters for 30 static site generators
 * with Mill-Based Synthesis engine for template processing.
 *
 * @module
 */

// Core Engine
export {
  Engine,
  createMill,
  createStore,
  type Mill,
  type Store,
  type OperationCard,
  type VariableCard,
  type NumberCard,
  type EngineConfig,
  type EnginePlugin,
} from "./engine/src/core.ts";

// Build System
export {
  build,
  parseFrontmatter,
  applyTemplate,
  buildFile,
  type BuildConfig,
  type BuildResult,
  type ContentFile,
} from "./ssg/src/build.ts";

// Type Definitions
export type {
  SiteConfig,
  ContentFrontmatter,
  SSGAdapter,
  AdapterTool,
  ToolResult,
  TemplateContext,
  TemplateEngine,
  PipelineStage,
  PipelineContext,
  AuthorConfig,
  BuildOptions,
  AccessibilityConfig,
  ContentAccessibility,
} from "./ssg/src/types.ts";

// Language Tooling
export { Lexer, TokenType, type Token, type LexerError } from "./noteg-lang/src/lexer.ts";
export { Parser, type ProgramNode, type ParseError } from "./noteg-lang/src/parser.ts";

// Version
export const VERSION = "0.1.0";

// Adapter list
export const ADAPTERS = [
  "babashka", "cobalt", "coleslaw", "cryogen", "documenter",
  "ema", "fornax", "franklin", "frog", "hakyll",
  "laika", "marmot", "mdbook", "nimble-publisher", "nimrod",
  "orchid", "perun", "pollen", "publish", "reggae",
  "scalatex", "serum", "staticwebpages", "tableau", "wub",
  "yocaml", "zola", "zotonic"
] as const;

export type AdapterName = typeof ADAPTERS[number];

/**
 * Dynamically import an adapter by name
 */
export async function loadAdapter(name: AdapterName) {
  return await import(`./adapters/${name}.js`);
}

/**
 * Load all adapters
 */
export async function loadAllAdapters() {
  const adapters = new Map();
  for (const name of ADAPTERS) {
    try {
      adapters.set(name, await loadAdapter(name));
    } catch {
      // Adapter not available
    }
  }
  return adapters;
}
