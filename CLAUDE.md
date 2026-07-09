# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm start` — dev server at http://localhost:4200 (`ng serve`)
- `npm run build` — production build (SSR bundle output to `dist/amanda-portfolio/`)
- `npm run watch` — dev build in watch mode
- `npm test` — Karma/Jasmine unit tests (`ng test`)
- `npm run serve:ssr:amanda-portfolio` — run the built SSR server locally
- Single test: `ng test --include='**/analytics-aggregator.spec.ts'` (or any glob for the spec you want)

There is no lint script — code style is enforced by TypeScript strict mode and the Angular compiler.

Requires Node ≥22.22.3 (Angular 22 requirement). Use `nvm use 22` locally if your default is older.

## Local environment setup

`src/environments/environment.ts` is gitignored. Copy `environment.example.ts` to `environment.ts` and fill in Supabase URL + anon key. Admin auth uses Supabase Auth (`signInWithPassword`) — an admin user must exist in the Supabase project's Auth → Users. There is no password in source or in env vars.

Events emitted from `localhost` are dropped at the ingest layer inside [`AnalyticsService`](src/app/services/analytics.service.ts) so local dev never pollutes production analytics.

## Architecture

### Rendering model

Angular 21 standalone-component app with SSR on Vercel. Two entry points:
- `src/main.ts` — client bootstrap
- `src/main.server.ts` + `src/server.ts` — SSR bootstrap

Routing is defined in [`src/app/app.routes.ts`](src/app/app.routes.ts). The root layout is [`MainLayoutComponent`](src/app/layout/main-layout/), which composes the section components (`sections/hero`, `about`, `work`, `contact`) into the single-page portfolio. `/project/:id`, `/admin`, and `/privacy` are lazy-loaded route components under `src/app/pages/`.

### State: signals + computed, no store

State management is signals-first. Aggregations in [`src/app/pages/admin/analytics-aggregator.ts`](src/app/pages/admin/analytics-aggregator.ts) are pure functions (visit detection, daily bucketing, period deltas, depth histograms, project performance). The admin dashboard chains them through `computed()` so the ~15 derived metrics only recompute when their input signals change. When adding new metrics, prefer extending `analytics-aggregator.ts` with a pure function and wiring it via `computed()` in `admin.component.ts` rather than adding stateful logic to the component.

### Analytics pipeline

- Event capture: [`AnalyticsService`](src/app/services/analytics.service.ts) writes to Supabase `portfolio_events` table with the anon key. Row-Level Security on the table controls read/write access.
- Visitor identity: [`VisitorService`](src/app/services/visitor.service.ts) generates the persistent visitor ID and detects device/browser client-side.
- Admin read path: `AnalyticsService.fetchEvents()` pulls raw events (RLS-gated) → `analytics-aggregator.ts` derives metrics → chart components render.

### Charts

Every chart in [`src/app/pages/admin/charts/`](src/app/pages/admin/charts/) is hand-built in pure SVG (or CSS grid for the heatmap) with Angular signals. **No D3, no chart library.** When adding a new visualization, follow the existing pattern: a standalone component that takes signal inputs and renders SVG directly. Do not introduce a charting dependency.

### Styling

SCSS with component-scoped styles. Design tokens are CSS custom properties defined at `:root` in [`src/styles.scss`](src/styles.scss) (colors, spacing, nav height, etc.). Reference tokens via `var(--token-name)` — do not hardcode colors or spacing values in component styles.

### Accessibility

The site is maintained to WCAG 2.1 AA. Admin login has `aria-invalid` / `aria-describedby` wiring for the error state; document outline is single-h1; interactive elements have real handlers. When editing UI, preserve these — the audit history in `dotfiles/reports/` documents past a11y regressions caught in review.

## Deployment

Pushes to `main` auto-deploy to Vercel. Preview deploys run on every branch. Vercel Speed Insights is enabled.
