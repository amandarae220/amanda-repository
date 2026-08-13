# Keep framework builds; do not de-build to enable submodules

**Date**: 2026-08-12
**Status**: Accepted
**Decider(s)**: AL

## Context

While designing the assembly pipeline we considered rewriting the framework apps (Angular resume, React/Vite sudoku) into "no-build" single-file apps — like the calculator (see its "single-file, no-build architecture" ADR in the `Calculator2.0` repo) — so a git submodule could serve them directly without a build step.

## Options Considered

### Option 1: Rewrite resume/sudoku to no-build to enable direct submodule serving
- Pros: submodule source == deployable; no build step in the pipeline.
- Cons: a full rewrite of working framework apps; discards weeks of work; **contradicts the case studies themselves** (the resume's story is "pure Angular/CSS architecture"; sudoku's is "React & TypeScript"); loses type safety, the component model, tree-shaking.

### Option 2: Keep the builds; the pipeline runs them (chosen)
- Pros: no rewrite; case-study integrity preserved; the build is one line in the `assemble` step.
- Cons: the pipeline must run each app's toolchain.

## Decision

Keep the framework builds. The `assemble` step runs `ng build` / `vite build` per app. We do **not** de-build working apps to avoid a build.

Rationale, plainly: **the build was never the pain point** — manual copying and divergence were. A submodule does not even remove the build (it holds *source*; you still build it). The only way "submodule without build" works is to submodule a built-artifact branch (gh-pages), which re-introduces the per-app deploy the [single-canonical-host ADR](2026-08-12-portfolio-single-canonical-host.md) exists to kill.

Corollary: the no-build single-file pattern remains the right default for **new, small, single-purpose** widgets — not a retrofit onto component-heavy apps where a framework earns its keep.

## Consequences

- **Easier**: no rewrites; each app stays idiomatic to the story it tells.
- **Harder**: the pipeline installs + builds multiple toolchains.
- **Accepting**: longer builds in exchange for keeping the apps as-is.

## Revisit If

An app shrinks to the point a framework is pure overhead, or a new small widget appears where no-build single-file is clearly the better call (then apply the pattern there, deliberately).
