// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2025 Jonathan D.A. Jewell

/**
 * Type definitions for odd-ssg
 * Content schema, site configuration, and adapter interfaces
 */

// ============================================================================
// Site Configuration
// ============================================================================

export interface SiteConfig {
  /** Site title */
  title: string;
  /** Site description */
  description?: string;
  /** Base URL for the site */
  baseUrl: string;
  /** Default language code */
  language?: string;
  /** Author information */
  author?: AuthorConfig;
  /** Build configuration */
  build?: BuildOptions;
  /** Accessibility configuration */
  accessibility?: AccessibilityConfig;
  /** Custom metadata */
  metadata?: Record<string, unknown>;
}

export interface AuthorConfig {
  name: string;
  email?: string;
  url?: string;
}

export interface BuildOptions {
  /** Content source directory */
  contentDir: string;
  /** Template directory */
  templateDir: string;
  /** Output directory */
  outputDir: string;
  /** Include draft content */
  drafts?: boolean;
  /** Minify output */
  minify?: boolean;
  /** Generate sitemap */
  sitemap?: boolean;
  /** Generate RSS feed */
  rss?: boolean;
}

// ============================================================================
// Content Schema
// ============================================================================

export interface ContentFrontmatter {
  /** Content title */
  title: string;
  /** Publication date (ISO 8601) */
  date?: string;
  /** Last modified date */
  updated?: string;
  /** Content description/excerpt */
  description?: string;
  /** Author override */
  author?: string | AuthorConfig;
  /** Tags/categories */
  tags?: string[];
  /** Draft status */
  draft?: boolean;
  /** URL slug override */
  slug?: string;
  /** Template override */
  template?: string;
  /** Accessibility metadata */
  a11y?: ContentAccessibility;
  /** Custom frontmatter fields */
  [key: string]: unknown;
}

export interface ContentAccessibility {
  /** Sign language video URLs */
  signLanguage?: {
    bsl?: string;  // British Sign Language
    asl?: string;  // American Sign Language
    gsl?: string;  // German Sign Language
  };
  /** Makaton symbols reference */
  makaton?: string;
  /** Easy read version URL */
  easyRead?: string;
  /** Audio description URL */
  audioDescription?: string;
  /** Reading level (Flesch-Kincaid) */
  readingLevel?: number;
}

// ============================================================================
// Accessibility Configuration
// ============================================================================

export interface AccessibilityConfig {
  /** Enable BSL (British Sign Language) support */
  bsl?: boolean;
  /** Enable ASL (American Sign Language) support */
  asl?: boolean;
  /** Enable GSL (German Sign Language) support */
  gsl?: boolean;
  /** Enable Makaton support */
  makaton?: boolean;
  /** Auto-generate easy read versions */
  easyRead?: boolean;
  /** WCAG compliance level target */
  wcagLevel?: "A" | "AA" | "AAA";
  /** Accessibility statement URL */
  statementUrl?: string;
}

// ============================================================================
// Adapter Interface
// ============================================================================

export interface SSGAdapter {
  /** Adapter name */
  name: string;
  /** Implementation language */
  language: string;
  /** Human-readable description */
  description: string;
  /** Check if SSG binary is available */
  connect(): Promise<boolean>;
  /** Cleanup */
  disconnect(): Promise<void>;
  /** Connection status */
  isConnected(): boolean;
  /** Available tools/commands */
  tools: AdapterTool[];
}

export interface AdapterTool {
  /** Tool name */
  name: string;
  /** Tool description */
  description: string;
  /** JSON Schema for input parameters */
  inputSchema: {
    type: "object";
    properties: Record<string, unknown>;
    required?: string[];
  };
  /** Execute the tool */
  execute(params: Record<string, unknown>): Promise<ToolResult>;
}

export interface ToolResult {
  success: boolean;
  stdout: string;
  stderr: string;
  code: number;
}

// ============================================================================
// Template Types
// ============================================================================

export interface TemplateContext {
  site: SiteConfig;
  page: ContentFrontmatter & { content: string };
  collections?: Record<string, ContentFrontmatter[]>;
  helpers?: Record<string, (...args: unknown[]) => unknown>;
}

export interface TemplateEngine {
  name: string;
  extensions: string[];
  render(template: string, context: TemplateContext): Promise<string>;
  compile?(template: string): (context: TemplateContext) => Promise<string>;
}

// ============================================================================
// Build Pipeline
// ============================================================================

export interface PipelineStage {
  name: string;
  order: number;
  enabled?: boolean;
  execute(context: PipelineContext): Promise<PipelineContext>;
}

export interface PipelineContext {
  config: SiteConfig;
  content: Map<string, ContentFrontmatter & { raw: string; content: string }>;
  templates: Map<string, string>;
  output: Map<string, string>;
  errors: string[];
  warnings: string[];
  metadata: Record<string, unknown>;
}

// ============================================================================
// Export all types
// ============================================================================

export type {
  SiteConfig as Config,
  ContentFrontmatter as Frontmatter,
  SSGAdapter as Adapter,
  TemplateContext as Context
};
