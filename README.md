# Amanda Lloyd — Portfolio

Personal portfolio and playground — an Angular app that's also a project in its own right, with a custom analytics dashboard and a resume that doubles as the portfolio centerpiece.

Live: https://www.amandarae.dev

---

## Overview

This portfolio showcases frontend engineering and data visualization work through a set of evolving projects. It's built with Angular 19 with SSR, deployed on Vercel, and backed by a Supabase analytics pipeline that tracks page views, project clicks, and conversion events through a password-protected `/admin` dashboard. Accessibility tested to WCAG 2.1 AA.

---

## Tech Stack

| Technology | Why I chose it |
|------------|----------------|
| Angular 19 + SSR | Component architecture I know well; SSR gives crawlers rendered HTML for SEO |
| Supabase | Anonymous event ingestion with RLS — no backend required for analytics |
| Vercel | Auto-deploys on push to main; CDN and Speed Insights out of the box |
| SCSS | Scoped component styles with variables; no utility-class framework needed |

---

## Getting Started

**Prerequisites:** Node 18+, Angular CLI 19

```bash
git clone https://github.com/amandarae220/amanda-repository.git
cd amanda-repository
npm install
ng serve
```

App runs at `http://localhost:4200`.

For analytics to work locally, copy `src/environments/environment.example.ts` to `src/environments/environment.prod.ts` and fill in your Supabase credentials. The file is gitignored.

---

## Deployment

Deployed on Vercel. Pushes to `main` trigger automatic production builds.

---

## Latest Updates

- **Jun 2026** — Custom analytics dashboard at `/admin` tracking page views, project clicks, and link conversions via Supabase
- **Jun 2026** — Interactive Resume v3 live — replaced D3.js with pure Angular/CSS, custom mobile layout, WCAG 2.1 AA
- **Jun 2026** — Retirement Calculator v2 — Key Insights panel, Coast FI and Die with Zero modeling, annotated inflection points
- **Jun 2026** — Migrated from GitHub Pages to Vercel for CDN, preview deployments, and analytics
