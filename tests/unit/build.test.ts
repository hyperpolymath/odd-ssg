// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2025 Jonathan D.A. Jewell

import { assertEquals, assertExists } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { parseFrontmatter, applyTemplate } from "../../ssg/src/build.ts";

describe("parseFrontmatter", () => {
  it("should parse YAML frontmatter", () => {
    const raw = `---
title: Test Post
date: 2025-01-15
draft: false
---
# Content here`;

    const { frontmatter, content } = parseFrontmatter(raw);

    assertEquals(frontmatter.title, "Test Post");
    assertEquals(frontmatter.date, "2025-01-15");
    assertEquals(frontmatter.draft, false);
    assertEquals(content.trim(), "# Content here");
  });

  it("should handle content without frontmatter", () => {
    const raw = "# Just content\nNo frontmatter here";
    const { frontmatter, content } = parseFrontmatter(raw);

    assertEquals(Object.keys(frontmatter).length, 0);
    assertEquals(content, raw);
  });

  it("should parse boolean values", () => {
    const raw = `---
published: true
draft: false
---
content`;

    const { frontmatter } = parseFrontmatter(raw);

    assertEquals(frontmatter.published, true);
    assertEquals(frontmatter.draft, false);
  });

  it("should parse numeric values", () => {
    const raw = `---
order: 42
rating: 4.5
---
content`;

    const { frontmatter } = parseFrontmatter(raw);

    assertEquals(frontmatter.order, 42);
    assertEquals(frontmatter.rating, 4.5);
  });

  it("should preserve string values", () => {
    const raw = `---
title: My Title
slug: my-title
---
content`;

    const { frontmatter } = parseFrontmatter(raw);

    assertEquals(frontmatter.title, "My Title");
    assertEquals(frontmatter.slug, "my-title");
  });
});

describe("applyTemplate", () => {
  it("should substitute simple variables", () => {
    const template = "<h1>{{ title }}</h1>";
    const variables = { title: "Hello World" };

    const result = applyTemplate(template, variables);

    assertEquals(result, "<h1>Hello World</h1>");
  });

  it("should handle nested variables", () => {
    const template = "By {{ author.name }} ({{ author.email }})";
    const variables = {
      author: { name: "John", email: "john@example.com" }
    };

    const result = applyTemplate(template, variables);

    assertEquals(result, "By John (john@example.com)");
  });

  it("should preserve unmatched variables", () => {
    const template = "{{ found }} and {{ missing }}";
    const variables = { found: "here" };

    const result = applyTemplate(template, variables);

    assertEquals(result, "here and {{ missing }}");
  });

  it("should handle multiple occurrences", () => {
    const template = "{{ x }} + {{ x }} = {{ result }}";
    const variables = { x: "2", result: "4" };

    const result = applyTemplate(template, variables);

    assertEquals(result, "2 + 2 = 4");
  });

  it("should handle whitespace in variable syntax", () => {
    const template = "{{title}} - {{  spaced  }}";
    const variables = { title: "A", spaced: "B" };

    const result = applyTemplate(template, variables);

    assertEquals(result, "A - B");
  });

  it("should convert values to strings", () => {
    const template = "Count: {{ count }}, Active: {{ active }}";
    const variables = { count: 42, active: true };

    const result = applyTemplate(template, variables);

    assertEquals(result, "Count: 42, Active: true");
  });

  it("should handle null and undefined gracefully", () => {
    const template = "Value: {{ value }}";
    const variables = { value: null };

    const result = applyTemplate(template, variables);

    assertEquals(result, "Value: ");
  });
});
