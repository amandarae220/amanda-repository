# Project Assembly Pipeline — Migration Plan

- **Date:** 2026-08-12
- **Status:** Direction locked (2026-08-12) — ready to execute Phase 0
- **Author:** Amanda (with Claude)
- **Scope:** Replace the hand-copied, committed-artifact model for embedded sub-projects (calculator, resume, sudoku, D&D) with an automated CI assembly pipeline: pinned sources, builds in CI, **zero build artifacts in git**, one canonical deploy. The architecture is itself a portfolio piece — it must substantiate the DevOps claim to a technical reviewer.

---

## 1. Goals & non-goals

**Goals**
- Single source of truth per sub-app; `public/<app>` is never hand-edited again.
- **No build artifacts committed to the portfolio repo** (no minified bundles, no hashed assets, no vendored `.github`/`.gitignore`).
- Automated assembly via GitHub Actions (not a hand-run script).
- One canonical live deploy (portfolio); retire the calculator's competing GitHub Pages deploy.
- Every structural decision captured as an ADR.
- Right-sized: ambitious enough to demonstrate competence, not Rube Goldberg.

**Non-goals (explicitly out this pass)**
- Rewriting framework apps (Angular resume, React sudoku) to "no-build" — see [ADR-004].
- Edge-composition proxying as the primary model (kept as a documented alternative only).
- Any artifact registry beyond GitHub-native (Releases / submodule SHAs).
- Touching the portfolio's own Angular SSR app structure.

---

## 2. Current state (what we're replacing)

Every embedded app is a **vendored static snapshot** committed into `public/` and served by Vercel as passthrough. None are linked to their source. The calculator is additionally **double-deployed** (its own gh-pages + the portfolio), which is what caused the 2,600-line hand-merge on 2026-08-05.

| App | Served at | Source repo | Build model | Own live deploy? |
|---|---|---|---|---|
| Calculator v2 | `/calculator-v2/` | `Calculator2.0` @ `feature/angular-makeover` | no-build single-file | ✅ gh-pages `/` |
| Calculator v1 | `/calculator-v1/` | `Calculator2.0` @ `v1` | single HTML | ✅ gh-pages `/v1/` |
| Resume v3 | `/resume/` | `visualized-resume` (web-resume) | Angular build | ❌ |
| Sudoku | `/sudoku/` | `sudoku` @ `v2-redesign` | React/Vite build | ❌ |
| D&D | `/dnd/` | `DungeonsAndDragons` | plain HTML/JS | ❌ |
| Saux | *(linked out — reference pattern)* | `tassyguy/saux-component-library` | — | ✅ its own |

**Problems a reviewer sees today:** committed `public/resume/main.js` (243 KB minified), `public/sudoku/assets/index-*.js` (content-hashed bundle), vendored `.github/workflows` shipped as static assets, and a manually maintained double-deploy.

---

## 3. Target architecture

> **Deploy model (decided 2026-08-12):** keep **Vercel's native git integration** for the portfolio as a whole. Sub-apps are **not** deployed individually and there is **no** Actions-driven `vercel deploy --prebuilt`. Instead, an assemble step runs inside the portfolio's own build.

```
Source of truth:  projects/<app>   (git submodules, pinned SHA — SOURCE only, no dist)
Build:            Vercel native git build on push to main (+ PR preview deploys)
                    npm run build  ->
                      1. assemble: init submodules, build each sub-app (matrix of
                         toolchains) with correct base path + overlay env
                      2. emit each sub-app into public/<app>/  (gitignored, generated)
                      3. ng build (SSR) copies public/ through to the browser output
Optional CI:      .github/workflows/ci.yml — build-check all sub-apps on PRs (no deploy)
Committed to git: source + shell + workflows + ADRs.   NOT committed: any built bundle.
```

**What a reviewer sees after:** submodules pinned to SHAs, a multi-toolchain assemble step wired into the build, an optional CI build-check workflow, ADRs for every choice, and a clean `git ls-files` with no minified output anywhere.

> Vercel must have **git submodule access enabled** for the project. ⚠️ `web-resume` (resume source) is **private**, so Vercel's Git integration and the CI checkout both need read access (deploy key / PAT) — not just the submodule toggle. The assemble step runs `npm ci` + build inside each submodule during Vercel's build — confirm total build time stays within limits (small apps, expected fine).

### 3.1 Repo structure changes
- **Add** `projects/` with a submodule per app (source only).
- **Add** an `assemble` npm script (builds sub-apps → `public/<app>/`) and wire it into `build` (`npm run assemble && ng build`).
- **Remove from git** `public/calculator-v2`, `public/resume`, `public/sudoku`, `public/dnd`; add them to `.gitignore` (they become generated output the assemble step writes). **Keep `public/calculator-v1/` committed** — frozen single-file legacy that never rebuilds; the one deliberate exception (see §4).
- **Keep committed:** `public/favicon.ico`, `public/robots.txt`, `public/sitemap.xml`, `public/404.html`, `public/assets/*` (these are source, not build output).
- **Add** optional `.github/workflows/ci.yml` (PR build-check only — Vercel still deploys).
- **Add** `docs/decisions/` ADRs (see §7).

---

## 4. Per-app build spec

| App | Source submodule | Ref | Build command | Sub-path handling | Assembled to | Overlay |
|---|---|---|---|---|---|---|
| calc-v2 | `Calculator2.0` | **`main`** (post-backport) | none (single-file copy) | n/a | `public/calculator-v2/` | canonical→`amandarae.dev`, inject back-link |
| calc-v1 | — *(frozen exception)* | — | **not assembled** | n/a | `public/calculator-v1/` *(stays committed)* | — |
| resume | `visualized-resume` | `main` | `npm ci && ng build --base-href=/resume/` | Angular `--base-href` ✅ *(already works — live copy uses it)* | `public/resume/` | `CANONICAL_BASE` env; strip `/_vercel/insights` |
| sudoku | `sudoku` | **`main`** (after `v2-redesign` merge) | `npm ci && vite build --base=/sudoku/` | Vite `base` | `public/sudoku/` | none |
| dnd | `DungeonsAndDragons` | `main` | none | n/a | `public/dnd/` | none |

> **Base-path is the real engineering.** Sub-path hosting (`/resume/`, `/sudoku/`) is where naive setups 404 on assets. Handle it via each framework's native flag — never by hand-editing built HTML.
>
> **Assemble target is `public/<app>/`**, not the browser output dir directly — the existing Angular `public/` passthrough then copies it into the deploy. Confirm each app's build output shape (e.g. resume's `outputPath` is `dist/visualized-resume` — verify flat vs `browser/` subdir before wiring).

### 4.1 Overlay handling (portfolio-specific bits)
The canonical URL and `← Back to portfolio` link stop being hand-edits in a committed file. They become **build inputs**:
- Angular/Vite apps: pass `CANONICAL_BASE=https://www.amandarae.dev` at build; templates read it.
- calc-v2 (no-build): push the parameterization **upstream** into `Calculator2.0` (preferred), or apply a version-controlled `projects-overlay/calculator-v2.sh` transform in the pipeline (explicit, re-runnable). Decision → [ADR-003].

---

## 5. ⚠️ Prerequisites (gate — must complete before first automated build)

- [ ] **Backport portfolio-only calc work into `Calculator2.0` `main`.** The hero redesign, carousel arrows, `heroBreakdown`, and the 2026-08-05 a11y merge live **only** in the portfolio copy. `main` is the chosen canonical branch, but the gh-pages workflow currently builds v2 from `feature/angular-makeover` — so **align the branches**: land the backport on `main` and make `feature/angular-makeover` fast-forward to it (or retire it). Once the submodule is source-of-truth, the first build overwrites `public/calculator-v2/`. Backport first or the work is lost.
- [ ] **Merge `sudoku` `v2-redesign` → `main`** so `main` is canonical, then pin the submodule to `main`.
- [ ] **Audit resume / sudoku / dnd copies** for portfolio-only overlays beyond canonical URL (same trap as calc). Backport anything found.
- [x] ~~Fix the broken `visualized-resume` remote~~ — **done**: origin now `github.com/amandarae220/web-resume`. ⚠️ **`web-resume` is private** — CI checkout and Vercel both need read access (deploy key / PAT) to fetch it as a submodule.
- [ ] **Confirm each source builds cleanly from a fresh clone** (`npm ci` + build) — no uncommitted local state assumed.
- [x] ~~Confirm base-path config for resume~~ — **resolved:** live `/resume/` copy already uses `<base href="/resume/">` with relative assets, so `ng build --base-href=/resume/` works. Still confirm sudoku's Vite `base`.
- [ ] **Vercel project settings:** enable **git submodule** fetching; confirm the build (assemble + `ng build`) stays within build-time limits. No Vercel API token needed — native git integration is retained.

---

## 6. Phased execution

### Phase 0 — Reconcile & scaffold (non-destructive)
Nothing deleted; committed `public/` copies still serve as the live fallback.
- [ ] Complete all §5 prerequisites (backports + remote fix).
- [ ] Add submodules under `projects/` pinned to the reconciled SHAs.
- [ ] Draft ADRs (§7).
- [ ] Verify `git submodule update --init --recursive` produces buildable sources.

### Phase 1 — Assemble step (prove on Vercel preview)
- [ ] Write `scripts/assemble-projects.sh` (+ `npm run assemble`): for each app, `git submodule update`, `npm ci` + build with base-path/overlay env, emit to `public/<app>/`.
- [ ] Wire into `build`: `npm run assemble && ng build`.
- [ ] Enable git submodules in Vercel project settings.
- [ ] Push a branch; on the **Vercel preview deploy**, confirm output matches the current committed `public/` copies (diff the served pages) and there are **no asset 404s** under each sub-path.
- [ ] (Optional showcase) add `.github/workflows/ci.yml` that runs `npm run assemble` as a PR build-check — visible pipeline without owning the deploy.

### Phase 2 — Cut over (destructive — only after Phase 1 preview is green)
- [ ] `git rm -r` the four assembled `public/<app>` dirs (calc-v2, resume, sudoku, dnd) and `.gitignore` them; **keep `public/calculator-v1/`** (frozen exception).
- [ ] Merge to `main`; Vercel's **native** production build now runs `assemble && ng build`. Verify live-site parity.
- [ ] **Retire `Calculator2.0`'s gh-pages workflow** (manual-only or delete) — portfolio is now the single canonical host.

### Phase 3 — Polish & document
- [ ] ADR index + link from README.
- [ ] README / CONTRIBUTING note: "Sub-apps are submodules built in CI. **Never commit built output. Never hand-edit `public/<app>`.**"
- [ ] Remove any lingering vendored `.github` / `.gitignore` / `.editorconfig` cruft.
- [ ] Update `CLAUDE.md` deployment section to describe the assembly pipeline.

---

## 7. ADRs to write (in `docs/decisions/`)

- **ADR-001 — Assembly pipeline over vendored snapshots.** Why committed build artifacts were removed; what a reviewer should infer.
- **ADR-002 — Portfolio as single canonical host.** Retiring the calculator's gh-pages double-deploy.
- **ADR-003 — Overlay as build input, not hand-edit.** Canonical URL + back-link parameterization.
- **ADR-004 — Keep framework builds; do not de-build to enable submodules.** Rationale from 2026-08-12 discussion (rewrite cost, case-study integrity, build isn't the pain point).

---

## 8. Right-sizing dials (so this doesn't tip into over-engineering)

Judgment is part of the competence being showcased. Available simplifications if the full version feels heavy:
- **Lean source pinning:** replace submodules with a `projects.lock` of pinned SHAs the pipeline clones. Fewer contributor footguns.
- **Lean pipeline:** keep Vercel's native build; add a `prebuild` step that builds sub-apps instead of Actions `--prebuilt`. Less visible, far simpler.
- **Edge-composition alternative (calc only):** proxy `/calculator-v2/*` via a `vercel.json` rewrite to calc's own deploy — zero copy, but re-introduces a per-app deploy and muddies the "one canonical deploy" story. Held in reserve, not the lead.

**Recommendation:** full version (submodules + Actions + prebuilt), because a reviewer rewards the real thing — with ADRs proving it was chosen deliberately and right-sized.

---

## 9. Decisions & remaining confirmations

_Resolved 2026-08-12:_

- **Calculator canonical branch:** `main`. Backport lands on `main`; align/retire `feature/angular-makeover` and repoint the gh-pages workflow (or drop it in Phase 2).
- **Resume `--base-href`:** ✅ already supported — the live `/resume/` copy is built with `<base href="/resume/">` and relative assets. No routing fix needed; just strip the portfolio-only `/_vercel/insights` script.
- **Sudoku branch:** merge `v2-redesign` → `main` first; pin the submodule to `main`.
- **Vercel deploy model:** keep **native git integration for the portfolio as a whole**; sub-apps are assembled inside `npm run build`, not deployed individually and not via Actions `--prebuilt`. GitHub Actions is optional CI (build-check) only.

### Still to confirm during execution
- [ ] Sudoku's Vite `base` config (only base-path left unverified).
- [ ] Each sub-app's build output shape (flat `dist/<name>` vs `dist/<name>/browser`) before wiring the assemble copy.
- [ ] Total Vercel build time with all sub-app builds chained.
