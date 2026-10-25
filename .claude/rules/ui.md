---
paths:
  - 'src/**/*.{tsx,css}'
---

# UI rules

- Colors, fonts, font sizes, spacing, radii: only `var(--…)` from `src/shared/design/tokens.css`. Missing token → add it there, never hardcode.
- tokens.css holds PLACEHOLDER values until the approved design doc arrives. Raw doc goes to `docs/design/`; read it only when updating tokens.
- Icons: set TBD (design doc). Bundled, used via a `src/shared/ui` wrapper.
- Logo: the app's own, not from the design kit.
- Styles: CSS Modules (`X.module.css` beside `X.tsx`). Global CSS only in `src/shared/design/`.
- Generic UI components live in `src/shared/ui/`; reuse before writing new ones.
