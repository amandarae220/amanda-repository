#!/usr/bin/env bash
#
# assemble-projects.sh — build the embedded sub-projects from their pinned
# submodule sources into public/<app>/ (generated, gitignored).
#
# This runs as part of the portfolio build (`npm run build` -> `assemble && ng build`)
# so that NO built artifact is ever committed to this repo. See:
#   docs/decisions/2026-08-12-assembly-pipeline-over-vendored-snapshots.md
#   docs/specs/2026-08-12-project-assembly-pipeline.md
#
# STATUS: skeleton (Phase 0). Sources under projects/ are not wired yet — the
# script is safe to run now; it skips any app whose submodule is absent.
#
# Usage:
#   scripts/assemble-projects.sh [--dry-run] [--only <app>]
#
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROJECTS_DIR="$ROOT/projects"        # git submodule sources (Phase 0)
PUBLIC_DIR="$ROOT/public"            # assemble target (gitignored per app)
OVERLAY_DIR="$ROOT/scripts/overlays" # portfolio-specific transforms (ADR: overlay-as-build-input)
CANONICAL_BASE="${CANONICAL_BASE:-https://www.amandarae.dev}"

DRY_RUN=0
ONLY=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run) DRY_RUN=1 ;;
    --only)    ONLY="${2:-}"; shift ;;
    *) echo "unknown arg: $1" >&2; exit 2 ;;
  esac
  shift
done

log()  { printf '  \033[1m%s\033[0m %s\n' "$1" "${2:-}"; }
run()  { if [[ $DRY_RUN -eq 1 ]]; then echo "    DRY: $*"; else eval "$@"; fi; }

# Manifest — one record per app:  name | submodule | build_cmd | dist_subdir | overlay
#   build_cmd  : shell to run inside the submodule (empty = no build, copy source)
#   dist_subdir: path under the submodule holding servable output ('.' = repo root)
#   overlay    : script under scripts/overlays/ (empty = none)
# NOTE: refs/branches are pinned by the submodule itself (git), not here.
# calculator-v1 is intentionally NOT listed — it is a frozen, single-file legacy
# page (2023) that never rebuilds. It stays committed in public/calculator-v1/ as
# the one deliberate exception to "no committed artifacts" (see migration plan §4).
read -r -d '' MANIFEST <<'EOF' || true
calculator-v2 | Calculator2.0        |                                        | .                        | calculator-v2.sh
resume        | visualized-resume    | npm ci && ng build --base-href=/resume/ | dist/visualized-resume  |
sudoku        | sudoku               | npm ci && npx vite build --base=/sudoku/ | dist                   |
dnd           | DungeonsAndDragons   |                                        | .                        |
EOF

assemble_one() {
  local name="$1" sub="$2" build="$3" dist="$4" overlay="$5"
  local src="$PROJECTS_DIR/$sub"
  local dest="$PUBLIC_DIR/$name"

  if [[ -n "$ONLY" && "$ONLY" != "$name" ]]; then return 0; fi

  log "▶" "$name  (source: projects/$sub)"

  # Phase 0 guard: submodule may not be wired yet.
  if [[ ! -d "$src" ]]; then
    log "  ⏭  skip" "projects/$sub not present yet (submodule not wired — Phase 0)"
    return 0
  fi

  run "git -C '$src' submodule sync --recursive >/dev/null 2>&1 || true"

  if [[ -n "$build" ]]; then
    log "  ⚙  build" "$build"
    run "( cd '$src' && CANONICAL_BASE='$CANONICAL_BASE' $build )"
  else
    log "  📄 no-build" "copy source"
  fi

  local out="$src/$dist"
  log "  📦 sync" "$out/ -> public/$name/"
  run "rm -rf '$dest'"
  run "mkdir -p '$dest'"
  # Exclude source-control + repo/dev files so they never ship as static assets.
  # Matters most for no-build apps (rsynced from the repo root): keeps docs/
  # (incl. DB schema SQL), README, LICENSE, package manifests, CLAUDE.md out of
  # the deployed output. (Build apps rsync from dist/, where these don't exist.)
  run "rsync -a --delete \
        --exclude '.git' --exclude '.github' --exclude '.gitignore' \
        --exclude '.editorconfig' --exclude 'node_modules' \
        --exclude 'docs' --exclude 'README.md' --exclude 'LICENSE' \
        --exclude 'CLAUDE.md' --exclude 'package.json' --exclude 'package-lock.json' \
        '$out'/ '$dest'/"

  if [[ -n "$overlay" ]]; then
    local ov="$OVERLAY_DIR/$overlay"
    if [[ -x "$ov" ]]; then
      log "  🎨 overlay" "$overlay"
      run "CANONICAL_BASE='$CANONICAL_BASE' '$ov' '$dest'"
    else
      log "  ⚠  overlay" "missing/!executable: scripts/overlays/$overlay (Phase 1)"
    fi
  fi
}

main() {
  log "assemble-projects" "canonical=$CANONICAL_BASE dry_run=$DRY_RUN ${ONLY:+only=$ONLY}"
  while IFS='|' read -r name sub build dist overlay; do
    [[ -z "${name// }" ]] && continue
    assemble_one \
      "$(echo "$name" | xargs)" "$(echo "$sub" | xargs)" \
      "$(echo "$build" | xargs)" "$(echo "$dist" | xargs)" \
      "$(echo "$overlay" | xargs)"
  done <<< "$MANIFEST"
  log "done" "sub-apps assembled into public/ (generated — not committed)"
}

main
