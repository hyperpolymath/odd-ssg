;; SPDX-License-Identifier: AGPL-3.0-or-later
;; SPDX-FileCopyrightText: 2025 Jonathan D.A. Jewell
;; ECOSYSTEM.scm — odd-ssg

(ecosystem
  (version "0.1.0")
  (name "odd-ssg")
  (type "satellite")
  (purpose "Satellite SSG implementation providing MCP adapters for 30 static site generators")

  (position-in-ecosystem
    "Satellite implementation in hyperpolymath ecosystem. Integrates with poly-ssg-mcp hub
     to provide MCP adapters for 30 SSGs across 15+ programming languages. Implements
     Mill-Based Synthesis engine for template processing. Follows RSR guidelines.")

  (related-projects
    (project
      (name "poly-ssg-mcp")
      (url "https://github.com/hyperpolymath/poly-ssg-mcp")
      (relationship "hub")
      (description "Unified MCP server for 28 SSGs - provides adapter interface")
      (differentiation
        "poly-ssg-mcp = Hub orchestrating multiple SSG adapters via MCP
         odd-ssg = Satellite providing 30 additional adapters + Mill-Based Synthesis engine"))

    (project
      (name "rhodium-standard-repositories")
      (url "https://github.com/hyperpolymath/rhodium-standard-repositories")
      (relationship "standard")
      (description "RSR compliance guidelines followed by this project"))

    (project
      (name "noteg-lang")
      (url "internal")
      (relationship "component")
      (description "NoteG language tooling embedded in this project")))

  (supported-ssg-adapters
    (rust ("zola" "cobalt" "mdbook"))
    (haskell ("hakyll" "ema"))
    (elixir ("serum" "nimble-publisher" "tableau"))
    (clojure ("cryogen" "perun" "babashka"))
    (racket ("frog" "pollen"))
    (julia ("franklin" "documenter" "staticwebpages"))
    (scala ("laika" "scalatex"))
    (ocaml ("yocaml"))
    (swift ("publish"))
    (kotlin ("orchid"))
    (crystal ("marmot"))
    (nim ("nimrod"))
    (d-lang ("reggae"))
    (fsharp ("fornax"))
    (erlang ("zotonic"))
    (tcl ("wub"))
    (common-lisp ("coleslaw")))

  (capabilities
    (mcp-protocol "2024-11-05")
    (accessibility ("bsl" "asl" "gsl" "makaton" "easy-read"))
    (template-engine "mill-based-synthesis")
    (language-server "noteg-lsp"))

  (what-this-is
    "Satellite SSG adapter provider with:
     - 30 MCP-compatible adapters for various static site generators
     - Mill-Based Synthesis engine for template processing
     - NoteG language tooling with LSP support
     - Comprehensive accessibility support (BSL, ASL, GSL, Makaton)
     - Bernoulli verification testing")

  (what-this-is-not
    "- NOT the main hub (that's poly-ssg-mcp)
     - NOT a replacement for individual SSGs
     - NOT exempt from RSR compliance
     - NOT a general-purpose website builder"))
