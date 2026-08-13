# Assembly pipeline over vendored snapshots

**Date**: 2026-08-12
**Status**: Accepted (implementation pending — see [migration plan](../specs/2026-08-12-project-assembly-pipeline.md))
**Decider(s)**: AL

## Context

The portfolio embeds five sub-projects (calculator v1/v2, resume, sudoku, D&D). Each was folded in as a **vendored static snapshot** — the built output copied into `public/<app>/` and committed to this repo. Angular's `public/` passthrough then serves them as-is on Vercel.

This model has failed repeatedly:
- **Manual, error-prone sync.** No link between a snapshot and its source repo; updates are hand-copied. On 2026-08-05 a single calculator fix turned into a 2,600-line hand-merge because the copies had silently diverged.
- **Build artifacts in git.** `public/resume/main.js` (243 KB minified), `public/sudoku/assets/index-*.js` (content-hashed bundle), and even vendored `.github/workflows` are committed. Reviewing a diff is impossible and it reads as an anti-pattern.
- **The portfolio's stated purpose is to demonstrate DevOps competence.** Committed artifacts + manual copying actively undercut that claim to any reviewer who opens the repo.

Constraints:
- Deployed on Vercel via native git integration (keep — see [ADR: overlay as build input] and migration plan).
- Mixed toolchains: Angular (resume), React/Vite (sudoku), no-build single-file (calculator), plain HTML (D&D).
- One maintainer. Must be right-sized, not enterprise theater.

## Options Considered

### Option 1: Keep vendored snapshots
- Pros: zero build coupling; works today.
- Cons: every problem above. Non-starter given the DevOps-showcase goal.

### Option 2: Manually-run sync script
- Pros: removes copy-by-hand.
- Cons: still "a script I run by hand" — reads as scripting, not CI/CD; still commits artifacts.

### Option 3: CI assembly — submodule sources, built in the pipeline, no committed artifacts (chosen)
- Pros: single source of truth per app; nothing built is committed; reproducible; demonstrates real pipeline discipline.
- Cons: multi-toolchain build; submodule friction; longer builds.

### Option 4: Edge composition (Vercel rewrites proxy each app's own deploy)
- Pros: zero copies, zero divergence.
- Cons: re-introduces per-app deploys; runtime coupling; conflicts with single-canonical-host decision.

### Option 5: Monorepo (pull all sources in, orchestrate builds)
- Pros: one source of truth, no sync ever.
- Cons: large migration; mixes React + Angular builds; discards standalone repos.

## Decision

Option 3. Sub-app sources become **git submodules** under `projects/`; an `assemble` step builds each into `public/<app>/` (gitignored, generated) during the portfolio's own build; **no build artifacts are committed**. Vercel's native git build runs `assemble && ng build`.

## Consequences

- **Easier**: single source of truth per app; clean `git ls-files` (no minified output); the architecture itself substantiates the DevOps claim.
- **Harder**: the build now orchestrates multiple toolchains; submodules add contributor steps (`--recursive`); Vercel must fetch submodules.
- **Accepting**: longer build times; a one-time reconciliation debt (backporting portfolio-only work upstream) before any source can become authoritative.

## Revisit If

Build times exceed Vercel limits, submodule friction outweighs the benefit (fall back to a pinned-SHA `projects.lock` clone), or the app count grows enough to justify a real monorepo tool (Nx/Turborepo).
