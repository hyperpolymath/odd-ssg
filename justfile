# SPDX-License-Identifier: AGPL-3.0-or-later
# SPDX-FileCopyrightText: 2025 Jonathan D.A. Jewell
# odd-ssg Justfile - Task Runner Configuration

# Default recipe - show help
default:
    @just --list

# ============================================================================
# BUILD COMMANDS
# ============================================================================

# Build the project
build:
    deno task build

# Build with verbose output
build-verbose:
    deno task build --verbose

# Build including draft content
build-drafts:
    deno task build --drafts

# Clean build artifacts
clean:
    rm -rf dist/ .cache/ coverage/
    @echo "Cleaned build artifacts"

# Watch for changes and rebuild
watch:
    deno task watch

# ============================================================================
# TEST COMMANDS
# ============================================================================

# Run all tests
test:
    deno test --allow-read --allow-write tests/

# Run unit tests only
test-unit:
    deno test --allow-read --allow-write tests/unit/

# Run end-to-end tests
test-e2e:
    deno test --allow-read --allow-write --allow-run tests/e2e/

# Run all tests with coverage
test-coverage:
    deno test --allow-read --allow-write --coverage=coverage/ tests/
    deno coverage coverage/

# Run tests in watch mode
test-watch:
    deno test --allow-read --allow-write --watch tests/

# Run Bernoulli verification tests
test-bernoulli:
    deno test --allow-read tests/unit/bernoulli.test.ts

# Run all tests (alias)
test-all: test-unit test-e2e test-bernoulli

# ============================================================================
# LANGUAGE SERVER & TOOLING
# ============================================================================

# Start the language server
lsp:
    deno run --allow-read --allow-write noteg-lang/src/lsp/server.ts

# Compile a .noteg file
compile file:
    deno run --allow-read --allow-write noteg-lang/src/compiler.ts {{file}}

# Lint the codebase
lint:
    deno lint

# Format the codebase
fmt:
    deno fmt

# Check types
check:
    deno check **/*.ts

# ============================================================================
# DEVELOPMENT
# ============================================================================

# Start development server
dev:
    deno task dev

# Run the MCP server
mcp:
    deno run --allow-read --allow-write --allow-run noteg-mcp/server.ts

# Generate types from schema
codegen:
    deno run --allow-read --allow-write scripts/codegen.ts

# ============================================================================
# ADAPTERS
# ============================================================================

# Test all SSG adapters
test-adapters:
    deno test --allow-read --allow-run adapters/

# List available adapters
list-adapters:
    @ls -1 adapters/*.js | xargs -I{} basename {} .js | sort

# Check adapter syntax
check-adapters:
    @for f in adapters/*.js; do deno check "$$f" 2>&1 || echo "FAIL: $$f"; done

# ============================================================================
# ACCESSIBILITY
# ============================================================================

# Validate accessibility schema
a11y-validate:
    deno run --allow-read scripts/validate-a11y.ts

# Generate accessibility report
a11y-report:
    deno run --allow-read --allow-write scripts/a11y-report.ts

# ============================================================================
# CONTAINER & DEPLOYMENT
# ============================================================================

# Build container image
container-build:
    podman build -t odd-ssg:latest .

# Run in container
container-run:
    podman run -it --rm -v $(pwd):/app:Z odd-ssg:latest

# Push to registry
container-push registry="ghcr.io/hyperpolymath":
    podman push odd-ssg:latest {{registry}}/odd-ssg:latest

# ============================================================================
# DOCUMENTATION
# ============================================================================

# Generate documentation
docs:
    deno run --allow-read --allow-write scripts/gen-docs.ts

# Serve documentation locally
docs-serve:
    deno run --allow-read --allow-net scripts/serve-docs.ts

# ============================================================================
# RELEASE & CI
# ============================================================================

# Prepare release
release version:
    @echo "Preparing release {{version}}..."
    @just test-all
    @just lint
    @just check
    @just docs
    @echo "Release {{version}} ready"

# CI pipeline simulation
ci:
    @echo "Running CI pipeline..."
    just check
    just lint
    just test-all
    @echo "CI passed!"

# Pre-commit checks
pre-commit:
    just fmt
    just lint
    just check
    just test-unit

# ============================================================================
# UTILITIES
# ============================================================================

# Show project info
info:
    @echo "odd-ssg - Satellite SSG Adapter Provider"
    @echo "Version: 0.1.0"
    @echo "Adapters: $(ls -1 adapters/*.js | wc -l)"
    @echo "Deno: $(deno --version | head -1)"

# Update dependencies
update:
    deno cache --reload mod.ts

# Generate lockfile
lock:
    deno cache --lock=deno.lock --lock-write mod.ts

# Run arbitrary deno command
deno +args:
    deno {{args}}
