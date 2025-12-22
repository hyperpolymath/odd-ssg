;; SPDX-License-Identifier: AGPL-3.0-or-later
;; SPDX-FileCopyrightText: 2025 Jonathan D.A. Jewell
;;; NEUROSYM.scm — odd-ssg
;;
;; Neuro-symbolic integration for odd-ssg
;; Bridges symbolic SSG operations with neural language models

(define-module (odd-ssg neurosym)
  #:export (symbolic-operations neural-integration reasoning-rules))

;; ============================================================================
;; Symbolic Operations
;; ============================================================================

(define symbolic-operations
  '((mill-operations
     "Operations following Ada Lovelace's Analytical Engine paradigm"
     ((load
       (signature . "(load register-name)")
       (semantics . "Load value from register into accumulator")
       (pre-conditions . ("register exists" "register has value"))
       (post-conditions . ("accumulator contains value")))

      (store
       (signature . "(store register-name)")
       (semantics . "Store accumulator value into register")
       (pre-conditions . ("accumulator has value"))
       (post-conditions . ("register contains value" "accumulator unchanged")))

      (transform
       (signature . "(transform function)")
       (semantics . "Apply function to accumulator")
       (pre-conditions . ("function is valid" "accumulator has value"))
       (post-conditions . ("accumulator contains transformed value")))

      (emit
       (signature . "(emit)")
       (semantics . "Output current accumulator value")
       (pre-conditions . ("accumulator has value"))
       (post-conditions . ("output generated" "accumulator unchanged")))))

    (template-operations
     "Operations for template processing"
     ((substitute
       (pattern . "{{ variable }}")
       (semantics . "Replace variable reference with value")
       (constraints . ("variable must exist" "value must be stringifiable")))

      (iterate
       (pattern . "{% for item in collection %}")
       (semantics . "Repeat block for each item")
       (constraints . ("collection must be iterable")))

      (conditional
       (pattern . "{% if condition %}")
       (semantics . "Include block if condition is truthy")
       (constraints . ("condition must be evaluable")))))))

;; ============================================================================
;; Neural Integration
;; ============================================================================

(define neural-integration
  '((mcp-bridge
     "How LLMs interact with odd-ssg through MCP"
     ((tool-invocation
       (description . "LLM calls tools via MCP protocol")
       (flow . ("LLM generates tool call" "MCP server validates" "Adapter executes" "Result returned")))

      (context-awareness
       (description . "LLM understands project context")
       (signals . ("file structure" "frontmatter content" "build errors" "adapter capabilities")))

      (error-recovery
       (description . "LLM handles and recovers from errors")
       (strategies . ("retry with modified parameters" "suggest alternatives" "explain failure")))))

    (prompt-patterns
     "Effective prompting patterns for odd-ssg"
     ((project-init
       (pattern . "Initialize a new {ssg} site in {directory} with {theme}")
       (tools-needed . ("{ssg}_init"))
       (follow-up . ("Check structure" "Run initial build")))

      (build-debug
       (pattern . "Build failed with error: {error}. Fix and rebuild.")
       (tools-needed . ("{ssg}_check" "{ssg}_build"))
       (reasoning . ("Parse error message" "Identify cause" "Apply fix" "Verify")))

      (migration
       (pattern . "Migrate content from {source_ssg} to {target_ssg}")
       (tools-needed . ("list_adapters" "{source}_build" "{target}_init" "{target}_build"))
       (considerations . ("Content format compatibility" "Template conversion" "Asset handling")))))

    (grounding
     "Techniques for grounding neural outputs in symbolic constraints"
     ((schema-validation
       (method . "Validate LLM outputs against JSON schemas")
       (benefit . "Ensures well-formed tool parameters"))

      (type-checking
       (method . "Type-check operation sequences")
       (benefit . "Catches semantic errors before execution"))

      (constraint-propagation
       (method . "Propagate constraints through operation graph")
       (benefit . "Ensures consistent state throughout workflow"))))))

;; ============================================================================
;; Reasoning Rules
;; ============================================================================

(define reasoning-rules
  '((inference-rules
     "Rules for deriving new facts from known facts"
     ((adapter-availability
       (premise . "adapter.connect() returns true")
       (conclusion . "SSG binary is installed and accessible"))

      (build-success
       (premise . "build.success = true AND build.errors = []")
       (conclusion . "Site is ready for deployment"))

      (content-validity
       (premise . "frontmatter.title exists AND frontmatter.date is valid")
       (conclusion . "Content meets minimum metadata requirements"))))

    (planning-heuristics
     "Heuristics for planning SSG operations"
     ((prefer-check-before-build
       (rationale . "Checking is faster and catches errors early")
       (rule . "Always run {ssg}_check before {ssg}_build"))

      (minimize-full-builds
       (rationale . "Full builds are expensive")
       (rule . "Use incremental builds when available"))

      (fail-fast
       (rationale . "Early failure saves time")
       (rule . "Stop pipeline on first error unless --continue flag"))))

    (verification-conditions
     "Conditions that must hold for correct operation"
     ((pre . "Conditions required before operation")
      (post . "Conditions guaranteed after operation")
      (invariant . "Conditions maintained throughout"))

     (build-verification
      ((pre . ("content-dir exists" "templates-dir exists" "output-dir is writable"))
       (post . ("output-dir contains generated files" "no unhandled errors"))
       (invariant . ("source files unchanged" "permissions preserved")))))))
