# Motion System — Design Spec

- **Date:** 2026-08-03
- **Status:** Draft — awaiting review
- **Author:** Amanda (with Claude)
- **Scope:** Add restrained, precise interaction/animation to the public portfolio to raise polish ("wow factor") without new dependencies, while closing a standing `prefers-reduced-motion` accessibility gap.

## 1. Goals & non-goals

**Goals**
- A small, coherent motion system built from design tokens (no raw values).
- Tasteful, Stripe/Linear-style motion that supports content rather than upstaging it.
- Zero new dependencies; SSR-safe; signals-first; WCAG 2.1 AA preserved.
- Retro-fix: existing hero animations currently ignore `prefers-reduced-motion`.

**Non-goals (YAGNI — explicitly out this pass)**
- Hero gradient/mesh backgrounds, particle/constellation canvases, pointer-parallax.
- Animated stat counters.
- Shared-element (card → detail) morph. Documented as a future follow-up only.

## 2. Constraints (from codebase)

- Angular 22 standalone + SSR on Vercel. Client-only DOM work must use `afterNextRender` / platform guards.
- Full-viewport `scroll-snap` sections composed in `MainLayoutComponent`.
- Charts are hand-built SVG — the house style is lightweight and dependency-free. Motion must match.
- Color tokens already live at `:root` in `src/styles.scss` (`--accent`, `--accent-hover`, `--bg`). Motion tokens join them.
- Core Web Vitals matter: **animate only `transform` and `opacity`** to keep CLS at 0.
- Router configured in `app.config.ts` via `provideRouter(routes, withInMemoryScrolling(...))`.
- Work cards (`work.component.html`) are **text cards** (title / subtitle / description / button) — no images.

## 3. Motion tokens (foundation)

Added to `:root` in `src/styles.scss`:

```scss
--motion-fast: 180ms;
--motion-base: 420ms;
--ease-out: cubic-bezier(.16, 1, .3, 1);   /* decisive, "settling" ease */
--reveal-shift: 16px;                        /* enter offset for scroll-reveal */
```

Global reduced-motion guard (also fixes existing hero animations):

```scss
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: .01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: .01ms !important;
    scroll-behavior: auto !important;
  }
}
```

## 4. Units

Each unit has one purpose, a clear interface, and is independently testable.

### Unit 1 — Motion foundation
- **What:** the tokens + reduced-motion guard above.
- **Files:** `src/styles.scss`.
- **A11y/perf:** guard is the prerequisite for every other unit; no layout properties animated.
- **Test:** visual/manual (token presence verified in served CSS).

### Unit 2 — `appReveal` directive (scroll-reveal)
- **What:** fade + rise (`translateY(var(--reveal-shift))` → 0, opacity 0 → 1) as an element enters the viewport. Applied to `about`, `work`, `contact` sections. Hero is above the fold — excluded (keeps its existing entrance).
- **How:** standalone attribute directive `src/app/shared/reveal.directive.ts`. Uses `IntersectionObserver` created inside `afterNextRender` so it never runs on the server. Adds an `is-revealed` class once; disconnects after first reveal (one-shot). Threshold ~0.15.
- **Interface:** `<section appReveal>…</section>`. Optional input `revealDelay` (ms) for light stagger between sections.
- **A11y:** under reduced-motion the element is shown immediately with no transform (class applied without transition; guard neutralizes duration).
- **SSR:** server renders the final (visible) state; no observer server-side, so content is never hidden if JS fails (progressive enhancement — start visible, enhance to animate). *Implementation note: default styles keep content visible; the directive adds the "start hidden then reveal" only after it attaches on the client, avoiding a flash-of-hidden-content and SSR/no-JS content loss.*
- **Test (Vitest):** mock `IntersectionObserver`; assert class toggles on intersection and observer disconnects after first hit; assert no observer construction under SSR platform.

### Unit 3 — Work-card micro-interactions
- **What:** on hover/focus-within, card gets a subtle lift (`translateY(-4px)`), an accent-colored border bloom (`--accent`), and the title shifts to `--accent`. Text cards, so no image zoom.
- **Files:** `src/app/sections/work/work.component.scss`.
- **A11y:** must trigger on `:focus-within` too (keyboard parity); disabled under reduced-motion; contrast of title-on-card in accent verified ≥ 4.5:1 for the chosen accent.
- **Test:** manual/visual.

### Unit 4 — CTA affordance
- **What:** primary `.button` gains a right-arrow that slides in on hover/focus (e.g. "View work →"). Implemented with a pseudo-element translate, not a layout change.
- **Files:** `src/styles.scss` (`.button`).
- **A11y:** arrow is decorative (`::after` content), not announced; focus-visible ring preserved; disabled under reduced-motion.
- **Test:** manual/visual.

### Unit 5 — Route transition for `/project/:id`
- **What:** enable Angular router View Transitions for a clean cross-route fade/slide when navigating into and out of a project.
- **How:** add `withViewTransitions()` to `provideRouter(...)` in `src/app/app.config.ts` (alongside existing `withInMemoryScrolling`). Add a minimal `::view-transition-old/new(root)` cross-fade in `src/styles.scss`.
- **A11y/perf:** View Transitions are a progressive enhancement — unsupported browsers navigate normally. Under reduced-motion, transition falls back to instant.
- **Follow-up (out of scope):** shared-element morph via matching `view-transition-name` on the card and the detail hero.
- **Test:** manual across a supporting browser + a non-supporting fallback.

## 5. Files touched

| File | Change |
|---|---|
| `src/styles.scss` | motion tokens, reduced-motion guard, `.button` arrow, view-transition cross-fade |
| `src/app/shared/reveal.directive.ts` | **new** — scroll-reveal directive |
| `src/app/shared/reveal.directive.spec.ts` | **new** — Vitest unit tests |
| `src/app/sections/work/work.component.scss` | card hover/focus micro-interactions |
| `src/app/sections/work/work.component.html` | add `appReveal` (+ import in component .ts) |
| `src/app/sections/about/about.component.*` | add `appReveal` |
| `src/app/sections/contact/contact.component.*` | add `appReveal` |
| `src/app/sections/hero/hero.component.scss` | ensure entrance respects reduced-motion (covered by global guard; verify) |
| `src/app/app.config.ts` | `withViewTransitions()` |

No new npm dependencies.

## 6. Accessibility & performance summary

- Every animated effect: `transform`/`opacity` only → **CLS unaffected**.
- Global `prefers-reduced-motion: reduce` guard → all motion collapses to instant; content remains fully usable.
- Keyboard parity: card effects on `:focus-within`; CTA on `:focus-visible`.
- Progressive enhancement: content is visible without JS and on non-supporting browsers; motion is additive.

## 7. Testing strategy

- **Unit (Vitest):** `appReveal` directive — intersection toggles class, one-shot disconnect, no-op under SSR platform.
- **Manual:** reduced-motion on/off (macOS "Reduce motion"); keyboard-only pass over cards + CTA; project navigation transition in a supporting and non-supporting browser; Lighthouse CLS check.

## 8. Rollout

Single branch, atomic commits per unit (foundation → reveal → card → CTA → route transition). Amanda writes commits; Claude stages only.
