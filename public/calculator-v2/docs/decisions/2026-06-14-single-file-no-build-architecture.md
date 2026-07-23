# Single-file, no-build architecture

**Date**: 2026-06-14
**Status**: Accepted
**Decider(s)**: AL

## Context

This is a personal portfolio project deployed on GitHub Pages. The app is one screen: inputs on the left, a D3 chart on the right. Total surface area is roughly 1,700 lines of HTML + CSS + JS. The deployment target (GitHub Pages) is a static host with no server-side rendering or build pipeline of its own. A second version (v1) also needs to coexist on the same Pages site for portfolio history.

Constraints:
- Must be hostable on GitHub Pages with no third-party services
- Demo URL must work for recruiters reading a resume — no install steps, no waiting on a build, no broken bundler in 18 months
- I should be able to ship a fix in under 60 seconds (edit + push)
- One developer (me) maintaining it

## Options Considered

### Option 1: Single `index.html` with inline `<style>` and `<script>` (chosen)
- Pros: Zero build step, instant deploys, the entire app is one file you can read top-to-bottom, no dependency rot, no `node_modules`
- Cons: Can't split into modules, can't use TypeScript, harder to add tests, file grows to ~2k lines, no tree-shaking

### Option 2: Vite + multiple modules + GitHub Actions build
- Pros: Module splits, TypeScript, hot reload in dev, ecosystem of plugins
- Cons: Build can break in 12 months when Vite majors bump, adds `node_modules`, adds CI minutes, more moving parts to maintain for a project this small

### Option 3: A framework (Next.js, Astro, etc.)
- Pros: Conventional structure, good DX, code splitting built in
- Cons: Massive overkill for a single screen, ships a runtime, way more dependency surface

## Decision

Single `index.html` with inline `<style>` and `<script>`. The app is small enough that a build step would cost more than it saves, and the static deploy story is the cleanest possible (push a file, refresh the URL).

## Consequences

- **Easier**: Deploys are literally `git push`. Reading the whole app top-to-bottom is one Cmd+F. No dependency upgrade treadmill. Source map is trivial — line numbers in the file match what runs.
- **Harder**: Testing is awkward (no Jest/Vitest runner without a build). Refactoring is by-eye (no TypeScript, no module boundaries). The file is approaching the readable limit (~2k lines).
- **Accepting**: No automated tests, no type checking, no editor intellisense on the calc logic. Mitigated by keeping function names descriptive and pure-ish, and by manually testing edge cases per [PR template](../../.github/pull_request_template.md).

## Revisit If

The file passes 2,500 lines, or I want to share calculation logic between v3 and a future API/CLI, or I find myself wishing for a real test runner more than twice in a month.
