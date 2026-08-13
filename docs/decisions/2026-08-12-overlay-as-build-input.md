# Portfolio overlay as a build input, not a hand-edit

**Date**: 2026-08-12
**Status**: Accepted (implementation pending — see [migration plan](../specs/2026-08-12-project-assembly-pipeline.md))
**Decider(s)**: AL

## Context

An embedded app, when hosted under the portfolio, needs a few portfolio-specific differences from its standalone self:
- canonical / Open Graph / Twitter / JSON-LD URLs point at `amandarae.dev/<app>/` instead of the app's own domain;
- a `← Back to portfolio` link into `/project/<id>`.

In the vendored model these were **hand-edited directly into the committed snapshot**. That is exactly what made the 2026-08-05 sync a 2,600-line three-way merge: the portfolio copy carried an invisible overlay on top of drifting source, so "just copy the latest" was never clean.

## Options Considered

### Option 1: Keep hand-editing the built output
- Cons: the overlay is invisible, unversioned as a concept, and re-applied by memory every sync. Rejected — it is the root cause.

### Option 2: Overlay as a build input (chosen)
- **Build-tooling apps (Angular/Vite):** pass `CANONICAL_BASE=https://www.amandarae.dev` (and a back-link flag) as build env; templates read it.
- **No-build app (calculator):** push the parameterization upstream into `Calculator2.0`, or apply a small, version-controlled transform (`projects-overlay/<app>.sh`) in the `assemble` step.
- Pros: the overlay is explicit, re-runnable, and diffable; sync becomes a clean overwrite.
- Cons: requires a small amount of upstream awareness in each source (an env var or flag).

## Decision

The portfolio overlay is a **build input**, never a hand-edit of generated output. Prefer upstream parameterization (build env / flag); fall back to an explicit, committed transform script in `assemble` for the no-build calculator.

## Consequences

- **Easier**: syncing an app is a clean rebuild + overlay; no manual merge, no invisible drift.
- **Harder**: each source repo must accept a build-time input (env var or flag) — a small upstream change per app.
- **Accepting**: one indirection (env/flag) between source and portfolio output, documented here so it is not surprising.

## Revisit If

The overlay grows beyond a handful of URL/attribute substitutions (then the app may warrant a genuine "portfolio build target" in its own config rather than an external transform).
