// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2025 Jonathan D.A. Jewell

/**
 * Mill-Based Synthesis Build System
 * Processes content through the analytical engine paradigm
 */

import { Engine, OperationCard, VariableCard } from "../../engine/src/core.ts";

export interface BuildConfig {
  contentDir: string;
  templateDir: string;
  outputDir: string;
  baseUrl?: string;
  drafts?: boolean;
  verbose?: boolean;
}

export interface ContentFile {
  path: string;
  frontmatter: Record<string, unknown>;
  content: string;
  outputPath: string;
}

export interface BuildResult {
  success: boolean;
  files: string[];
  errors: string[];
  duration: number;
}

/**
 * Parse YAML frontmatter from content
 */
export function parseFrontmatter(raw: string): { frontmatter: Record<string, unknown>; content: string } {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) {
    return { frontmatter: {}, content: raw };
  }

  const frontmatter: Record<string, unknown> = {};
  const lines = match[1].split("\n");

  for (const line of lines) {
    const colonIdx = line.indexOf(":");
    if (colonIdx > 0) {
      const key = line.slice(0, colonIdx).trim();
      let value: unknown = line.slice(colonIdx + 1).trim();

      // Parse basic types
      if (value === "true") value = true;
      else if (value === "false") value = false;
      else if (!isNaN(Number(value)) && value !== "") value = Number(value);

      frontmatter[key] = value;
    }
  }

  return { frontmatter, content: match[2] };
}

/**
 * Apply template substitution using {{ variable }} syntax
 */
export function applyTemplate(template: string, variables: Record<string, unknown>): string {
  return template.replace(/\{\{\s*(\w+(?:\.\w+)*)\s*\}\}/g, (_, path) => {
    const parts = path.split(".");
    let value: unknown = variables;

    for (const part of parts) {
      if (value && typeof value === "object" && part in value) {
        value = (value as Record<string, unknown>)[part];
      } else {
        return `{{ ${path} }}`; // Keep original if not found
      }
    }

    return String(value ?? "");
  });
}

/**
 * Build a single content file
 */
export async function buildFile(
  file: ContentFile,
  template: string,
  engine: Engine
): Promise<string> {
  // Load content variables into engine
  const variables: VariableCard[] = [
    { name: "content", type: "string", value: file.content },
    { name: "title", type: "string", value: file.frontmatter.title ?? "" },
    { name: "date", type: "string", value: file.frontmatter.date ?? "" },
    { name: "path", type: "string", value: file.path },
  ];

  // Add all frontmatter as variables
  for (const [key, value] of Object.entries(file.frontmatter)) {
    variables.push({
      name: key,
      type: typeof value as VariableCard["type"],
      value
    });
  }

  engine.loadVariables(variables);

  // Build template context
  const context = {
    ...file.frontmatter,
    content: file.content,
    path: file.path
  };

  return applyTemplate(template, context);
}

/**
 * Main build function
 */
export async function build(config: BuildConfig): Promise<BuildResult> {
  const startTime = Date.now();
  const result: BuildResult = {
    success: true,
    files: [],
    errors: [],
    duration: 0
  };

  const engine = new Engine({ strict: true });

  try {
    // Read content directory
    const contentFiles: ContentFile[] = [];

    for await (const entry of Deno.readDir(config.contentDir)) {
      if (entry.isFile && (entry.name.endsWith(".md") || entry.name.endsWith(".markdown"))) {
        const path = `${config.contentDir}/${entry.name}`;
        const raw = await Deno.readTextFile(path);
        const { frontmatter, content } = parseFrontmatter(raw);

        // Skip drafts if not enabled
        if (frontmatter.draft && !config.drafts) continue;

        const outputName = entry.name.replace(/\.md$|\.markdown$/, ".html");
        contentFiles.push({
          path,
          frontmatter,
          content,
          outputPath: `${config.outputDir}/${outputName}`
        });
      }
    }

    // Read default template
    let template = "<html><body>{{ content }}</body></html>";
    try {
      template = await Deno.readTextFile(`${config.templateDir}/default.html`);
    } catch {
      if (config.verbose) {
        console.log("Using default template");
      }
    }

    // Ensure output directory exists
    await Deno.mkdir(config.outputDir, { recursive: true });

    // Process each file
    for (const file of contentFiles) {
      try {
        const html = await buildFile(file, template, engine);
        await Deno.writeTextFile(file.outputPath, html);
        result.files.push(file.outputPath);

        if (config.verbose) {
          console.log(`Built: ${file.outputPath}`);
        }
      } catch (error) {
        result.errors.push(`Error building ${file.path}: ${error}`);
        result.success = false;
      }
    }

  } catch (error) {
    result.errors.push(`Build failed: ${error}`);
    result.success = false;
  }

  result.duration = Date.now() - startTime;
  return result;
}

export default { build, parseFrontmatter, applyTemplate, buildFile };
