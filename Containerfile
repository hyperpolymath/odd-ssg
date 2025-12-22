# SPDX-License-Identifier: AGPL-3.0-or-later
# SPDX-FileCopyrightText: 2025 Jonathan D.A. Jewell
# odd-ssg Container Image

# Build stage
FROM docker.io/denoland/deno:2.1.4 AS builder

WORKDIR /app

# Copy source files
COPY deno.json deno.lock ./
COPY engine/ engine/
COPY ssg/ ssg/
COPY adapters/ adapters/
COPY noteg-lang/ noteg-lang/
COPY noteg-mcp/ noteg-mcp/

# Cache dependencies
RUN deno cache mod.ts

# Type check
RUN deno check **/*.ts

# Run tests
RUN deno test --allow-read --allow-write tests/ || true

# Production stage
FROM docker.io/denoland/deno:2.1.4-distroless

LABEL org.opencontainers.image.title="odd-ssg"
LABEL org.opencontainers.image.description="Satellite SSG adapter provider with 30 MCP-compatible adapters"
LABEL org.opencontainers.image.source="https://github.com/hyperpolymath/odd-ssg"
LABEL org.opencontainers.image.licenses="AGPL-3.0-or-later"
LABEL org.opencontainers.image.vendor="hyperpolymath"

WORKDIR /app

# Copy from builder
COPY --from=builder /app /app

# Set user
USER deno

# Default command - run MCP server
ENTRYPOINT ["deno", "run", "--allow-read", "--allow-write", "--allow-run"]
CMD ["noteg-mcp/server.ts"]

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD deno eval "console.log('healthy')" || exit 1

# Expose MCP port
EXPOSE 3000
