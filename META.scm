;; SPDX-License-Identifier: AGPL-3.0-or-later
;; SPDX-FileCopyrightText: 2025 Jonathan D.A. Jewell
;;; META.scm — odd-ssg

(define-module (odd-ssg meta)
  #:export (architecture-decisions development-practices design-rationale components))

;; ============================================================================
;; Architecture Decisions
;; ============================================================================

(define architecture-decisions
  '((adr-001
     (title . "RSR Compliance")
     (status . "accepted")
     (date . "2025-12-15")
     (context . "Satellite project in the hyperpolymath ecosystem")
     (decision . "Follow Rhodium Standard Repository guidelines")
     (consequences . ("RSR Gold target" "SHA-pinned actions" "SPDX headers" "Multi-platform CI")))

    (adr-002
     (title . "Mill-Based Synthesis Engine")
     (status . "accepted")
     (date . "2025-12-22")
     (context . "Need a processing paradigm for template rendering")
     (decision . "Implement Analytical Engine paradigm with Operation Cards, Variable Cards, Mill, and Store")
     (consequences . ("Deterministic processing" "Verifiable operations" "Historical homage to Ada Lovelace")))

    (adr-003
     (title . "MCP Protocol for Adapters")
     (status . "accepted")
     (date . "2025-12-22")
     (context . "Need unified interface for 30 SSG adapters")
     (decision . "Use Model Context Protocol (MCP) for adapter communication")
     (consequences . ("LLM integration" "Standardized tool interface" "Resource discovery")))

    (adr-004
     (title . "Deno Runtime")
     (status . "accepted")
     (date . "2025-12-22")
     (context . "Need secure runtime for adapter execution")
     (decision . "Use Deno with explicit permissions")
     (consequences . ("Security by default" "TypeScript native" "Modern ES modules")))

    (adr-005
     (title . "Accessibility First")
     (status . "accepted")
     (date . "2025-12-22")
     (context . "Content must be accessible to all users")
     (decision . "Native support for BSL, ASL, GSL, Makaton, Easy Read")
     (consequences . ("Inclusive design" "Schema validation" "WCAG compliance")))))

;; ============================================================================
;; Development Practices
;; ============================================================================

(define development-practices
  '((code-style
     (languages . ("typescript" "javascript" "deno"))
     (formatter . "deno fmt")
     (linter . "deno lint"))

    (security
     (sast . "CodeQL")
     (credentials . "env vars only")
     (command-execution . "Deno.Command with args arrays")
     (no-eval . #t)
     (no-shell-injection . #t))

    (testing
     (framework . "deno test")
     (coverage-minimum . 70)
     (bernoulli-verification . #t)
     (e2e-tests . #t))

    (versioning
     (scheme . "SemVer 2.0.0"))

    (ci-cd
     (actions-pinned . #t)
     (codeql-enabled . #t)
     (dependabot-enabled . #t))))

;; ============================================================================
;; Design Rationale
;; ============================================================================

(define design-rationale
  '((why-rsr
     "RSR ensures consistency, security, and maintainability across the hyperpolymath ecosystem.")

    (why-mill-synthesis
     "The Analytical Engine paradigm provides a deterministic, verifiable approach to template processing,
      honoring Ada Lovelace's pioneering work while enabling modern static site generation.")

    (why-mcp
     "Model Context Protocol enables seamless integration with LLMs and other AI tools,
      making odd-ssg adapters accessible to intelligent agents.")

    (why-30-adapters
     "Supporting 30 different SSGs across 15+ programming languages ensures users can
      work with their preferred tools while benefiting from unified MCP access.")

    (why-accessibility
     "True accessibility requires more than WCAG compliance - native support for sign
      languages and symbol-based communication ensures content reaches everyone.")))

;; ============================================================================
;; Component Registry
;; ============================================================================

(define components
  '((engine
     (path . "engine/src/")
     (purpose . "Mill-based synthesis core")
     (status . "complete"))

    (ssg
     (path . "ssg/src/")
     (purpose . "Site generation pipeline")
     (status . "complete"))

    (adapters
     (path . "adapters/")
     (purpose . "30 SSG adapter implementations")
     (count . 30)
     (status . "complete"))

    (noteg-lang
     (path . "noteg-lang/src/")
     (purpose . "Language tooling (lexer, parser, LSP)")
     (status . "complete"))

    (noteg-mcp
     (path . "noteg-mcp/")
     (purpose . "MCP server implementation")
     (status . "complete"))

    (a11y
     (path . "a11y/")
     (purpose . "Accessibility schemas and tools")
     (status . "complete"))

    (tests
     (path . "tests/")
     (purpose . "Unit, E2E, and Bernoulli verification tests")
     (status . "complete"))))
