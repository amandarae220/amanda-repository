# Amanda Lloyd — Portfolio

Personal portfolio and playground — an Angular app that's also a project in its own right, with a custom analytics dashboard and a resume that doubles as the portfolio centerpiece.

Live: https://www.amandarae.dev

---

## Overview

This portfolio showcases frontend engineering and data visualization work through a set of evolving projects. It's built with Angular 21 with SSR, deployed on Vercel, and backed by a Supabase analytics pipeline that streams visitor events into a custom `/admin` dashboard. Accessibility tested to WCAG 2.1 AA.

---

## Tech Stack

| Technology | Why I chose it |
|------------|----------------|
| Angular 21 + SSR | Standalone components, signals + computed for memoized state, control-flow templates |
| Supabase | Anonymous event ingestion + RLS-gated read; Supabase Auth for the admin route |
| Vercel | Auto-deploys on push to main; CDN, preview deploys, Speed Insights |
| SCSS | Scoped component styles with CSS custom properties; no utility-class framework |

---

## Analytics Dashboard

The `/admin` route is a custom visualization-engineering exercise — every chart is built from scratch in pure SVG + Angular signals. No D3, no chart library. Each primitive lives in [`src/app/pages/admin/charts/`](src/app/pages/admin/charts/):

| Component | What it does |
|---|---|
| `SparklineComponent` | Tiny inline trend lines on every KPI tile. Normalized polyline, ~30 lines of code. |
| `AreaSeriesComponent` | Daily time-series with optional 7-day rolling average overlay, prior-period comparison line, and dated annotations (e.g. "Resume v3 live"). Smooth quadratic-Bézier curve generation, no library. |
| `HeatmapComponent` | 7×24 visit-intensity grid (day-of-week × hour-of-day). CSS-grid based — no SVG needed at this density. |
| `LeaderboardComponent` | Multi-metric ranked rows per project — views, avg time, click-through rate as proportional mini bars side by side. |
| `HistogramComponent` | Vertical-bar distribution chart with bucket highlight support (used for the visit-depth histogram). |
| `EmptyStateComponent` | Intentional placeholders for charts with no data yet — every chart has a context-specific empty message. |

State management uses Angular 21 signals + `computed()` throughout. Aggregations in [`analytics-aggregator.ts`](src/app/pages/admin/analytics-aggregator.ts) (pure functions: visit detection, period-over-period deltas, daily series bucketing, depth distribution, project performance) only recompute when their input signals change — meaningful performance win for a dashboard with ~15 derived metrics.

The dashboard is organized as four color-coded columns telling a story:
- 🔵 **Who's coming?** — total visits, unique visitors, traffic sources
- 🟢 **What are they viewing?** — page views, avg pages/visit, project performance leaderboard, daily views trend
- 🟡 **What are they doing?** — link clicks, bounce rate, visit-depth distribution
- 🩷 **How are they experiencing it?** — avg time on site, device, browser

---

## Getting Started

**Prerequisites:** Node 20+, Angular CLI 21

```bash
git clone https://github.com/amandarae220/amanda-repository.git
cd amanda-repository
npm install
ng serve
```

App runs at `http://localhost:4200`. Events tracked from localhost are skipped at the ingest layer so they don't pollute analytics.

For analytics to work locally, copy `src/environments/environment.example.ts` to `src/environments/environment.ts` and fill in your Supabase URL + anon key. Admin auth is handled by Supabase Auth — no passwords in source.

---

## Deployment

Deployed on Vercel. Pushes to `main` trigger automatic production builds.

---

## Latest Updates

- **Jun 2026** — Analytics dashboard rebuilt as a visualization-engineering showcase: hero strip, sparklines + Δ on every KPI, time-series with rolling average + comparison overlay + annotations, hour×day heatmap, project leaderboard, visit-depth histogram. Pure SVG + Angular signals.
- **Jun 2026** — Angular 19 → 21 upgrade; npm audit 40 vulns → 10 (all dev-only transitive)
- **Jun 2026** — Admin auth migrated from client-side hash to real Supabase Auth + RLS
- **Jun 2026** — Interactive Resume v3 live — replaced D3.js with pure Angular/CSS, custom mobile layout, WCAG 2.1 AA
- **Jun 2026** — Retirement Calculator v2 — Key Insights panel, Coast FI and Die with Zero modeling, annotated inflection points
- **Jun 2026** — Migrated from GitHub Pages to Vercel for CDN, preview deployments, and analytics
