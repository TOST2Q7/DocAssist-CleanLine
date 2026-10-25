---
paths:
  - 'src/**/*.{tsx,css}'
---

# UI rules (brand: РСО 2025; human summary in docs/design/brand.md)

- Colors, fonts, sizes, spacing, radii: only `var(--…)` from `src/shared/design/tokens.css`. Missing token → add it there, never hardcode.
- Contrast: on blue → white text only (black is 2.5:1). Yellow only on black/graphite. Red text only on white.
- Look: flat fills; no shadows, gradients, outlines. Sharp corners; roundness only as ellipses/pills.
- Headings: `--weight-display`, uppercase, `--tracking-display`, `--leading-tight`. Body: regular/medium.
- Font: Montserrat, bundled (cyrillic+latin, normal style only: no italic files).
- Icons: set not approved yet (proposal: Phosphor Bold/Fill). Bundled, used via a `src/shared/ui` wrapper.
- Logo: app's own; options in `docs/design/logo-options/`, not chosen yet. Never use or alter the РСО logo.
- Styles: CSS Modules (`X.module.css` beside `X.tsx`). Global CSS only in `src/shared/design/`.
- Generic UI components live in `src/shared/ui/`; reuse before writing new ones.
