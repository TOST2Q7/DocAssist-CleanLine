---
paths:
  - 'src/**/*.{tsx,css}'
---

# UI rules (brand: РСО brandbook 2025; human summary in docs/design/brand.md)

- Colors, fonts, sizes, spacing, radii: only `var(--…)` from `src/shared/design/tokens.css`. Missing token → add it there, never hardcode.
- Palette = blue/white/gray/black only. Direction colors only for that direction (values TBD). `--color-danger` is the sole functional extra.
- Contrast: on blue → white text only (black is 2.5:1).
- Fonts: `--font-display` main titles only (uppercase); `--font-ui` headings + UI text, numbers in light weight; `--font-text` long text. Headings uppercase, `--leading-tight`.
- Never add Stolzl/Actay files (commercial; public repo). Fonts bundled, cyrillic+latin, no italics.
- Look: flat fills, no shadows/gradients. Square/rect tiles; roundness only as ovals/pills. Thin blue oval outlines allowed as decoration.
- Icons: set not approved yet (proposal: Phosphor Bold/Fill). Bundled, used via a `src/shared/ui` wrapper.
- Logo: app's own; options in `docs/design/logo-options/`, not chosen yet. Never use or alter the РСО logo.
- Styles: CSS Modules (`X.module.css` beside `X.tsx`). Global CSS only in `src/shared/design/`.
- Generic UI components live in `src/shared/ui/`; reuse before writing new ones.
