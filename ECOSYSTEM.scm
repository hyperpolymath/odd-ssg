;; SPDX-License-Identifier: AGPL-3.0-or-later
;; SPDX-FileCopyrightText: 2025 Jonathan D.A. Jewell
;; ECOSYSTEM.scm — odd-ssg

(ecosystem
  (version "0.1.0")
  (name "odd-ssg")
  (type "satellite")
  (purpose "Satellite SSG implementation providing MCP adapters for 30 static site generators")

  (position-in-ecosystem
    "Satellite implementation in hyperpolymath ecosystem. Integrates with poly-ssg-mcp hub to provide MCP adapters for 30 SSGs. Follows RSR guidelines.")

  (related-projects
    (project
      (name "poly-ssg-mcp")
      (url "https://github.com/hyperpolymath/poly-ssg-mcp")
      (relationship "hub")
      (description "Unified MCP server for 28 SSGs - provides adapter interface")
      (differentiation
        "poly-ssg-mcp = Hub with all SSG adapters via MCP
         This project = Satellite SSG implementation using the hub"))
    (project (name "rhodium-standard-repositories")
             (url "https://github.com/hyperpolymath/rhodium-standard-repositories")
             (relationship "standard")))

  (what-this-is "Satellite SSG adapter provider with 30 MCP-compatible adapters for various static site generators")
  (what-this-is-not "- NOT the hub (that's poly-ssg-mcp)\n- NOT exempt from RSR compliance"))
