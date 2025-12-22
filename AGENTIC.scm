;; SPDX-License-Identifier: AGPL-3.0-or-later
;; SPDX-FileCopyrightText: 2025 Jonathan D.A. Jewell
;;; AGENTIC.scm — odd-ssg
;;
;; Configuration for AI agent interactions and MCP protocol

(define-module (odd-ssg agentic)
  #:export (agent-capabilities mcp-config tool-registry constraints))

;; ============================================================================
;; Agent Capabilities
;; ============================================================================

(define agent-capabilities
  '((name . "odd-ssg-agent")
    (version . "0.1.0")
    (description . "AI agent interface for 30 static site generators")

    (can-do
      (("Initialize SSG projects" . "Create new sites with any supported SSG")
       ("Build static sites" . "Compile content to HTML/CSS/JS")
       ("Serve development sites" . "Start local dev servers")
       ("Check site integrity" . "Validate links, content, structure")
       ("List available SSGs" . "Query adapter capabilities")
       ("Configure builds" . "Set build options and parameters")))

    (cannot-do
      (("Modify host filesystem arbitrarily" . "Limited to project directories")
       ("Access network without permission" . "Explicit permission required")
       ("Execute arbitrary code" . "Only predefined SSG commands")
       ("Persist state between sessions" . "Stateless design")))

    (best-for
      (("Multi-SSG workflows" . "Compare or switch between generators")
       ("Automated site builds" . "CI/CD integration")
       ("Content migration" . "Move between SSG platforms")
       ("Accessibility compliance" . "BSL, ASL, GSL, Makaton support")))))

;; ============================================================================
;; MCP Configuration
;; ============================================================================

(define mcp-config
  '((protocol-version . "2024-11-05")

    (server
     (name . "odd-ssg")
     (command . "deno")
     (args . ("run" "--allow-read" "--allow-write" "--allow-run" "noteg-mcp/server.ts")))

    (capabilities
     (tools . #t)
     (resources . #t)
     (prompts . #f)
     (logging . #t))

    (resources
     (adapters
      (uri-template . "odd-ssg://adapters/{name}")
      (description . "SSG adapter information and capabilities")))

    (transport
     (type . "stdio")
     (encoding . "utf-8"))))

;; ============================================================================
;; Tool Registry
;; ============================================================================

(define tool-registry
  '((meta-tools
     ((name . "odd_ssg_list_adapters")
      (description . "List all available SSG adapters with their status")
      (parameters . ()))

     ((name . "odd_ssg_connect")
      (description . "Connect to an SSG adapter (verify binary availability)")
      (parameters
       ((adapter (type . "string") (required . #t) (description . "Adapter name"))))))

    (adapter-tools
     ;; Each adapter exposes: init, build, serve, check, version
     ;; Tool names follow pattern: {adapter}_{action}
     ;; Example: zola_build, hakyll_init, serum_serve

     (common-actions
      ((init . "Initialize a new site project")
       (build . "Build/compile the site")
       (serve . "Start development server")
       (check . "Validate site structure")
       (clean . "Remove build artifacts")
       (version . "Get SSG version"))))

    (tool-count . 180))) ;; 30 adapters × 6 tools average

;; ============================================================================
;; Constraints
;; ============================================================================

(define constraints
  '((security
     (sandbox . "Deno permission model")
     (allowed-read . ("." "./content" "./templates" "./dist"))
     (allowed-write . ("./dist" "./public" "./.cache"))
     (allowed-run . ("zola" "hakyll" "serum" "cryogen" "...")))

    (rate-limits
     (requests-per-minute . 60)
     (concurrent-builds . 3)
     (max-output-size . "10MB"))

    (timeouts
     (connect . 5000)    ;; ms
     (build . 300000)    ;; 5 minutes
     (serve . -1)        ;; no timeout for serve
     (check . 60000))    ;; 1 minute

    (content-policy
     (allow . ("static-site-generation" "content-processing" "template-rendering"))
     (deny . ("arbitrary-code-execution" "network-requests" "system-modification")))))
