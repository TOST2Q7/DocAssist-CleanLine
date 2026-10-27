<!--
Для человека: файл пишется для Claude — коротко и по-английски (меньше токенов).
HTML-комментарии вырезаются до загрузки в контекст: заметки для себя пиши в них, это бесплатно.
Описание проекта для людей — README.md.
-->

# DocAssist-CleanLine

Static SPA, no backend. Hosted on GitHub Pages (push to main → `.github/workflows/ci.yml`).
Also a single-file offline build: one HTML, attached to the GitHub Release on tag `vX.Y.Z`.
Planned: Google sign-in (GIS token model, browser-only) + Google Drive (prefer scope `drive.file`).
OAuth can't work from file:// → Google features off when `IS_FILE_BUILD` (`@/shared/env`).
Stack: Vite 8, React 19, TS strict, CSS Modules + CSS-var tokens, Vitest, oxlint, Prettier, dependency-cruiser. npm, Node 22.

## Commands

- `npm run check` = tsc + oxlint + depcruise + prettier + vitest. Must pass before commit. `npm run format` fixes style.
- `npm run dev` | `build` → dist/ | `build:file` → dist-file/docassist-cleanline-vX.Y.Z.html
- Version: package.json `version` → `APP_VERSION`. Release: bump version, tag `vX.Y.Z` (CI checks they match).

## Layout & boundaries (enforced by `.dependency-cruiser.cjs`)

- `src/app/` shell: entry, layout, routing, wiring modules together. Composition only, no domain logic.
- `src/modules/<m>/` one feature area with its own CLAUDE.md. Public API = `index.ts` only.
- `src/shared/` domain-free code used by ≥2 areas (design tokens, ui kit, utils, env).
- Allowed: app → modules (index), shared. module → shared, other module (index). shared → shared. No cycles.
- Alias `@/` = `src/` for cross-area imports; relative imports only inside an area.

## Session protocol (token economy)

- 1 session = 1 area (a module | shared/x | app). Not named by user → infer from task. Task spans >1 area → first list areas + contract changes, get OK.
- Read only the area's files + the `index.ts` of modules it uses (types = contract). Never open other areas' internals; needing them = contract gap → extend that index.ts as a separate step.
- No repo-wide exploration "for context"; narrow Grep/Glob paths.
- End of task: update area CLAUDE.md + Modules map if purpose/contract/decision/state changed. Remove stale lines. CLAUDE.md = why/invariants/gotchas/state, never a retelling of code.
- New module → skill `new-module`.

## Git & branches

- `claude-development`: default working branch (work + tests with Claude). Commit and push here; never create new branches unless asked. If the session was assigned another branch (e.g. `claude/*`), still work in `claude-development`.
- `testers-prerelease`: pre-release builds for testers. `main`: releases + Pages. Push/merge into `testers-prerelease` or `main` only with the user's explicit OK.
- Commit author: `git config user.name "Tost"` + `git config user.email "113260893+TOST2Q7@users.noreply.github.com"` before the first commit of a session. Only goal: commits count in the user's GitHub contribution graph. Trailers (Co-Authored-By etc.) don't matter.

## Conventions

- Code, comments, CLAUDE.md, commits: English, terse. UI text: Russian. Talk to user: Russian.
- Files ≲250 lines; split by responsibility.
- Tests: `*.test.ts(x)` beside code; test a module through its `index.ts`. DOM-free by default (node env).
- Routing (when added): hash-based (base `./` must work on Pages subpath and file://).
- Single-file build must work offline: bundle fonts/icons/assets, no CDN.

## Modules map

(none yet)
