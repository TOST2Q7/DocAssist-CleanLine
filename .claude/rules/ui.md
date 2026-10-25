---
paths:
  - 'src/**/*.{tsx,css}'
---

# UI rules (brand: РСО brandbook 2026 v2.1; human summary in docs/design/brand.md)

- Colors, fonts, sizes, spacing, radii: only `var(--…)` from `src/shared/design/tokens.css`. Missing token → add it there, never hardcode.
- Palette = blue/white/gray/black. Direction palettes (`src/shared/design/directions.ts`) only for that direction's content. Errors: `--color-danger` (fills/icons/borders), `--color-danger-text` (small text).
- Contrast: on blue → white text only (black is 2.5:1).
- Fonts: `--font-display` = main titles only, ≤4 words, uppercase; `--font-ui` = headings (≤5 lines) + UI text, light weight only for numbers; `--font-text` = long text. Max 2 families per screen: display+ui or ui+text.
- Type: sizes only from the ×1.618 scale tokens; leading tokens by size; letter-spacing always 0; left-aligned, never justified; long text max-width `--measure`.
- Never add Stolzl/Actay files (commercial; public repo). Fonts bundled, cyrillic+latin, no italics.
- Look: flat fills, no shadows/gradients. Equal square/rect tiles; roundness only as ovals/pills. Thin blue oval outlines allowed as decoration.
- Icons: Solar set only, via `@/shared/ui/icons` (add missing ones there). Linear = default, Bold = active/selected; size 1em via font-size, color = currentColor; decorative → `aria-hidden`. Direction icons: vectors in the brandbook PDF (extract on demand).
- Logo: app's own. Wordmark B chosen (`docs/design/logo-options/wordmark-b.svg`: DOC upright + ASSIST slanted, Unbounded); icon not chosen (round 2 options there). Never use or alter the РСО logo.
- Styles: CSS Modules (`X.module.css` beside `X.tsx`). Global CSS only in `src/shared/design/`.
- Generic UI components live in `src/shared/ui/`; reuse before writing new ones.
