# Portfolio as the single canonical host

**Date**: 2026-08-12
**Status**: Accepted (implementation pending — see [migration plan](../specs/2026-08-12-project-assembly-pipeline.md))
**Decider(s)**: AL

## Context

The calculator was **double-deployed**: `Calculator2.0`'s own GitHub Pages site (`amandarae220.github.io/Calculator2.0/`) *and* the portfolio's vendored copy at `amandarae.dev/calculator-v2/`. Two live sites, two hand-maintained copies, no shared source of truth — the direct cause of the 2026-08-05 divergence and hand-merge.

The other embedded apps (resume, sudoku, D&D) have source repos but no competing live deploy, so the portfolio is already their only host. The calculator is the outlier.

## Options Considered

### Option 1: Portfolio canonical; retire the calculator's gh-pages deploy (chosen)
- Pros: one live site, one source of truth; the portfolio owns the deploy story end to end.
- Cons: the standalone `Calculator2.0` gh-pages URL goes away (or becomes a preview).

### Option 2: gh-pages canonical; portfolio proxies/links out
- Pros: keeps the standalone project prominent.
- Cons: re-introduces per-app deploys; portfolio no longer owns its own surface; splits URLs/SEO.

### Option 3: Keep both, automate the sync
- Pros: both stay live.
- Cons: two deploys to reason about; still fighting drift, just with a script.

## Decision

The **portfolio is the single canonical host**. `amandarae.dev/calculator-v2/` is the real site; the portfolio builds the calculator from the `Calculator2.0` source (see [assembly pipeline ADR](2026-08-12-assembly-pipeline-over-vendored-snapshots.md)). `Calculator2.0`'s gh-pages workflow is demoted to manual-only (preview) or removed.

## Consequences

- **Easier**: no more double-deploy divergence; the calculator has exactly one authoritative live URL.
- **Harder**: a one-time reconciliation — portfolio-only calculator work (hero redesign, carousel, a11y) must be backported into `Calculator2.0` before it can be the source (done 2026-08-12 on `backport/portfolio-hero-redesign`).
- **Accepting**: losing the standalone gh-pages URL as a canonical link; `Calculator2.0`'s `main`↔`feature/angular-makeover` branch model needs aligning so the source branch is unambiguous.

## Revisit If

The calculator needs to be embeddable/linkable independently of the portfolio, or a future project genuinely benefits from owning its own deploy (then edge composition, per the assembly-pipeline ADR's Option 4).
