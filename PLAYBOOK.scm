;; SPDX-License-Identifier: AGPL-3.0-or-later
;; SPDX-FileCopyrightText: 2025 Jonathan D.A. Jewell
;;; PLAYBOOK.scm — odd-ssg
;;
;; Operational playbook for development, deployment, and maintenance

(define-module (odd-ssg playbook)
  #:export (workflows runbooks troubleshooting))

;; ============================================================================
;; Development Workflows
;; ============================================================================

(define workflows
  '((setup
     (description . "Initial development environment setup")
     (steps
       ((1 . "Clone repository: git clone https://github.com/hyperpolymath/odd-ssg")
        (2 . "Install asdf: asdf install")
        (3 . "Install dependencies: deno cache mod.ts")
        (4 . "Run checks: just check")
        (5 . "Run tests: just test"))))

    (daily-development
     (description . "Daily development workflow")
     (steps
       ((1 . "Pull latest: git pull origin main")
        (2 . "Create branch: git checkout -b feat/my-feature")
        (3 . "Make changes")
        (4 . "Format: just fmt")
        (5 . "Lint: just lint")
        (6 . "Test: just test")
        (7 . "Commit: git commit -m 'feat: description'"))))

    (adding-adapter
     (description . "Adding a new SSG adapter")
     (steps
       ((1 . "Create adapters/new-ssg.js following existing patterns")
        (2 . "Export: name, language, description, connect, disconnect, isConnected, tools")
        (3 . "Implement tools array with proper inputSchema")
        (4 . "Use Deno.Command for safe command execution")
        (5 . "Add to noteg-mcp/server.ts adapter list")
        (6 . "Add tests in tests/e2e/adapters.test.ts")
        (7 . "Update documentation"))))

    (release
     (description . "Release workflow")
     (steps
       ((1 . "Update version in deno.json")
        (2 . "Update CHANGELOG.md")
        (3 . "Run: just release <version>")
        (4 . "Create PR and merge")
        (5 . "Tag release: git tag v<version>")
        (6 . "Push tags: git push --tags"))))))

;; ============================================================================
;; Runbooks
;; ============================================================================

(define runbooks
  '((deploy-mcp-server
     (description . "Deploy MCP server to production")
     (prerequisites . ("Deno installed" "Access to deployment environment"))
     (steps
       ((1 . "Build container: just container-build")
        (2 . "Test container: just container-run")
        (3 . "Push to registry: just container-push")
        (4 . "Deploy to infrastructure")
        (5 . "Verify health checks"))))

    (security-incident
     (description . "Security incident response")
     (severity . "critical")
     (steps
       ((1 . "Assess scope and impact")
        (2 . "Notify maintainers via security@hyperpolymath.dev")
        (3 . "Create private security advisory")
        (4 . "Develop and test fix")
        (5 . "Coordinate disclosure")
        (6 . "Release patch")
        (7 . "Post-incident review"))))

    (update-dependencies
     (description . "Update project dependencies")
     (schedule . "weekly")
     (steps
       ((1 . "Review Dependabot PRs")
        (2 . "Run: just update")
        (3 . "Run full test suite: just test-all")
        (4 . "Check for security advisories")
        (5 . "Merge approved updates"))))))

;; ============================================================================
;; Troubleshooting
;; ============================================================================

(define troubleshooting
  '((adapter-not-connecting
     (symptoms . ("connect() returns false" "Binary not found error"))
     (causes . ("SSG binary not installed" "Binary not in PATH" "Permission denied"))
     (solutions
       ((1 . "Verify SSG is installed: which <ssg-binary>")
        (2 . "Check PATH includes binary location")
        (3 . "Check file permissions")
        (4 . "Run adapter test: deno test adapters/<name>.test.ts"))))

    (mcp-protocol-error
     (symptoms . ("Method not found" "Invalid JSON-RPC" "Connection timeout"))
     (causes . ("Protocol version mismatch" "Malformed request" "Server not started"))
     (solutions
       ((1 . "Verify MCP client version compatibility")
        (2 . "Check request format matches specification")
        (3 . "Ensure server is running: just mcp")
        (4 . "Check logs for detailed error messages"))))

    (build-failure
     (symptoms . ("Type errors" "Module not found" "Permission denied"))
     (causes . ("Missing dependencies" "TypeScript errors" "Deno permission flags"))
     (solutions
       ((1 . "Run: deno cache --reload mod.ts")
        (2 . "Check: just check for type errors")
        (3 . "Verify permission flags in deno.json tasks")
        (4 . "Check import paths are correct"))))

    (test-failure
     (symptoms . ("Test assertion failed" "Timeout" "Unexpected error"))
     (causes . ("Code regression" "Environment issues" "Flaky tests"))
     (solutions
       ((1 . "Run single test with verbose output")
        (2 . "Check test fixtures and mocks")
        (3 . "Verify test environment matches CI")
        (4 . "Review recent changes to related code"))))))
