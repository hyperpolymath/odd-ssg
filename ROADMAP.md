# odd-ssg Roadmap

> Satellite SSG implementation providing MCP adapters for 30 static site generators

## Current Status

**Version:** 0.1.0
**Phase:** Initial Setup Complete
**Overall Completion:** 65%
**Last Updated:** 2025-12-17

## Completed

### v0.1 - Foundation (100%)

- [x] RSR Compliance (SPDX headers, SHA-pinned actions, .gitignore/.gitattributes)
- [x] 30 SSG adapters implemented:
  - Rust: Zola, Cobalt, mdBook
  - Haskell: Hakyll, Ema
  - Elixir: Serum, NimblePublisher, Tableau
  - Clojure: Cryogen, Perun, Babashka
  - Racket: Frog, Pollen
  - Julia: Franklin.jl, Documenter.jl, StaticWebPages.jl
  - Scala: Laika, ScalaTex
  - OCaml: YOCaml
  - Swift: Publish
  - Kotlin: Orchid
  - Crystal: Marmot
  - Nim: Nimrod
  - D: Reggae
  - F#: Fornax
  - Erlang: Zotonic
  - Tcl: Wub
  - Common Lisp: Coleslaw
- [x] Security policy (SECURITY.md)
- [x] Contributing guidelines (CONTRIBUTING.md)
- [x] CodeQL security scanning workflow
- [x] Dependabot configuration
- [x] SCM state files (META.scm, ECOSYSTEM.scm, STATE.scm)

## In Progress

### v0.2 - Documentation & Configuration

- [ ] README.adoc content
- [ ] deno.json project configuration
- [ ] Adapter usage documentation
- [ ] Integration guide with poly-ssg-mcp hub

## Planned

### v0.3 - Testing

- [ ] Unit tests for all adapters (70% coverage target)
- [ ] Integration tests with actual SSG binaries
- [ ] CI test workflow
- [ ] Mock binary testing for CI environments

### v0.4 - Enhanced Functionality

- [ ] Adapter auto-discovery mechanism
- [ ] Version compatibility checking
- [ ] Health check endpoints
- [ ] Error standardization across adapters

### v0.5 - MCP Protocol Compliance

- [ ] Full MCP protocol validation
- [ ] Protocol version negotiation
- [ ] Resource management
- [ ] Streaming support for long-running builds

### v1.0 - Production Ready

- [ ] API stability guarantee
- [ ] Performance benchmarks
- [ ] Comprehensive documentation
- [ ] Release automation
- [ ] npm/deno.land publication

## Future Considerations

### Potential Additional Adapters

- Pelican (Python)
- Sphinx (Python)
- Hugo (Go) - if not covered by poly-ssg-mcp hub
- Jekyll (Ruby) - if not covered by poly-ssg-mcp hub

### Enhancements

- Build caching integration
- Incremental build support
- Multi-site orchestration
- Theme management tools

## Security Priorities

- Regular dependency updates via Dependabot
- CodeQL analysis on all PRs
- No hardcoded credentials (env vars only)
- Safe command execution (Deno.Command with args arrays)

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for how to help.

Priority areas for contributions:
1. Testing - unit and integration tests
2. Documentation - README and adapter docs
3. New adapters for additional SSGs

---

*This roadmap is subject to change based on community feedback and project needs.*
