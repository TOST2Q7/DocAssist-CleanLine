---
paths:
  - 'src/**/*.{tsx,css}'
---

# UI rules (brand: РСО brandbook 2026 v2.1; human summary in docs/design/brand.md)

- Colors, fonts, sizes, spacing, radii: only `var(--…)` from `src/shared/design/tokens.css`. Missing token → add it there, never hardcode.
- Color sets: 2 user switches = 4 sets: theme light/dark × palette «Стандарт» (brandbook) / «Не по ГОСТ'у» (old DocAssist colors). Values + open questions: `docs/design/palettes.md` (until moved into tokens.css). Components use only semantic `--color-*` tokens, never raw palette values or per-set branches; new role → add it to all 4 sets.
- Switches change colors only: fonts, shapes, flat look, layout are the same in every set.
- «Стандарт»: brandbook blue/white/gray/black (+ derived UI tints, marked). Direction palettes (`src/shared/design/directions.ts`) only for that direction's content. On blue → white text only (black is 2.5:1). Dark: blue on black is 2.5:1 → blue only as a fill; blue text/links/icons/thin lines → `--color-primary-text`.
- «Не по ГОСТ'у»: own colors; brandbook color limits don't apply.
- Every set: text ≥ 4.5:1, icons and meaningful UI graphics ≥ 3:1 on bg and surface (decorative borders exempt). Errors: `--color-danger` (fills/icons/borders), `--color-danger-text` (small text).
- Built-in colors (logo, favicon, illustrations) → a variant per set.
- Fonts: `--font-display` = main titles only, ≤4 words, uppercase; `--font-ui` = headings (≤5 lines) + UI text, light weight only for numbers; `--font-text` = long text. Max 2 families per screen: display+ui or ui+text.
- Type: sizes only from the ×1.618 scale tokens; leading tokens by size; letter-spacing always 0; left-aligned, never justified; long text max-width `--measure`.
- Never add Stolzl/Actay files (commercial; public repo). Fonts bundled, cyrillic+latin, no italics.
- Look: flat fills, no shadows/gradients. Equal square/rect tiles; roundness only as ovals/pills. Thin blue oval outlines allowed as decoration.
- Icons: Solar set only, via `@/shared/ui/icons` (add missing ones there). Linear = default, Bold = active/selected; size 1em via font-size, color = currentColor; decorative → `aria-hidden`. Direction icons: vectors in the brandbook PDF (extract on demand).
- Logo (final): stacked ovals (2 black + blue front, gaps are real cut-outs) + wordmark B; sources in `docs/design/logo/` (regenerate via gen-logo.cjs, don't hand-edit). App uses `src/shared/design/logo.svg` + inline favicon in index.html. Never use or alter the РСО logo.
- Styles: CSS Modules (`X.module.css` beside `X.tsx`). Global CSS only in `src/shared/design/`.
- Generic UI components live in `src/shared/ui/`; reuse before writing new ones.
