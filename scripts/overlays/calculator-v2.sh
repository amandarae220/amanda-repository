#!/usr/bin/env bash
#
# Overlay: turn the standalone Calculator2.0 build into the portfolio variant.
#   - rewrite canonical / OG / Twitter / JSON-LD URLs to the portfolio domain
#   - inject the "← Back to portfolio" link (+ styles)
#
# Idempotent — safe to re-run. Invoked by scripts/assemble-projects.sh with the
# assembled app dir as $1; CANONICAL_BASE comes from the environment.
# See docs/decisions/2026-08-12-overlay-as-build-input.md
#
set -euo pipefail
DEST="${1:?usage: calculator-v2.sh <assembled-app-dir>}"
CANONICAL_BASE="${CANONICAL_BASE:-https://www.amandarae.dev}"

python3 - "$DEST/index.html" "$CANONICAL_BASE" <<'PY'
import sys, re

path, base = sys.argv[1], sys.argv[2]
html = open(path, encoding="utf-8").read()

# 1) URLs: standalone (github.io) -> portfolio. Image first (more specific).
html = html.replace("https://amandarae220.github.io/Calculator2.0/preview.png",
                    f"{base}/assets/calculator-v2.png")
html = html.replace("https://amandarae220.github.io/Calculator2.0/",
                    f"{base}/calculator-v2/")

# 2) Back-link + styles (idempotent — skip if already present).
if "backToPortfolio" not in html:
    link = ('        <a class="backToPortfolio" href="/project/calculator" '
            'aria-label="Back to portfolio project page">← Back to portfolio</a>\n')
    html = re.sub(r'(?m)^(\s*<h1 class="appTitle">)', link + r'\1', html, count=1)

    css = (
        "\n        .backToPortfolio {\n"
        "            font-family: 'Oswald', sans-serif;\n"
        "            font-size: 12px;\n"
        "            font-weight: 400;\n"
        "            letter-spacing: 0.12em;\n"
        "            text-transform: uppercase;\n"
        "            color: #fff;\n"
        "            text-decoration: none;\n"
        "            display: inline-flex;\n"
        "            align-items: center;\n"
        "            gap: 6px;\n"
        "            align-self: flex-start;\n"
        "            transition: color 0.15s ease;\n"
        "        }\n"
        "        .backToPortfolio:hover,\n"
        "        .backToPortfolio:focus-visible {\n"
        "            color: #fff;\n"
        "        }\n\n"
    )
    # insert immediately after the .appTitle { ... } rule, collapsing the blank
    # gap the removed standalone rule left behind so spacing stays single-blank.
    html = re.sub(r'(?m)^(\s*\.appTitle \{[^}]*\}\n)\n*', r'\1' + css, html, count=1)

open(path, "w", encoding="utf-8").write(html)
print("  overlay applied:", path)
PY
