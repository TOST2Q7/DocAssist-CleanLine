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
- All persistence (read/save/sync, any storage) only via `@/modules/data`. Other modules never touch localStorage/IndexedDB/Drive files directly (oxlint `no-restricted-globals` guards the first two). Need a new kind of data → extend data's index.ts.

## Session protocol (token economy)

- 1 session = 1 area (a module | shared/x | app). Not named by user → infer from task. Task spans >1 area → first list areas + contract changes, get OK.
- Read only the area's files + the `index.ts` of modules it uses (types = contract). Never open other areas' internals; needing them = contract gap → extend that index.ts as a separate step.
- No repo-wide exploration "for context"; narrow Grep/Glob paths.
- End of task: update area CLAUDE.md + Modules map if purpose/contract/decision/state changed. Remove stale lines. CLAUDE.md = why/invariants/gotchas/state, never a retelling of code.
- New module → skill `new-module`.
- A rule here blocks the task (limit, boundary, convention) → don't work around it silently. Tell user: which rule, why it blocks, options (relax / drop / keep and adapt). Edit CLAUDE.md only after OK.

## Git & branches

- `claude-development`: default working branch (work + tests with Claude). Commit and push here; never create new branches unless asked. If the session was assigned another branch (e.g. `claude/*`), still work in `claude-development`.
- `testers-prerelease`: pre-release builds for testers. `main`: releases + Pages. Push/merge into `testers-prerelease` or `main` only with the user's explicit OK.
- Compatibility is owed only to what shipped in `main` (released versions). Work in `claude-development` / `testers-prerelease` may break formats, APIs and stored data freely: no migrations or shims between unreleased states.
- Workaround kept only for `main` compatibility → log it in `docs/workarounds.md` (template inside) + `// workaround: W-NNN` in code; delete the entry with the code. Grep it by area before touching code; don't read it whole. The file lives only in `claude-development`: drop it when merging into `testers-prerelease`/`main`, keep it when merging those back.
- Commit author: `git config user.name "Tost"` + `git config user.email "113260893+TOST2Q7@users.noreply.github.com"` before the first commit of a session. Only goal: commits count in the user's GitHub contribution graph. Trailers (Co-Authored-By etc.) don't matter.

## Sensitive data (app handles confidential docs)

- Anything the user pastes/attaches/points to (docs, screenshots, sample text) = real personal data by default, even if called "example". Use it only to understand structure/format in this turn.
- Never let its values leave the chat: no names, phones, emails, addresses, passport/SNILS/INN/account numbers, dates of birth, signatures, company details in code, tests, fixtures, comments, logs, commits, PR/issue text, CLAUDE.md, artifacts, file names.
- Need example data → invent it, obviously fake: `Тестов Тест Тестович`, `+7 000 000-00-00`, `user@example.com`, IDs of zeros or failing checksums. Copy the shape, never a value (no "slightly changed" real data).
- Real samples for local dev live in `private/` (gitignored). Read on request only; never copy from it into tracked files.
- Before commit: re-read the diff for anything from user-provided data. Unsure → ask, don't commit.
- Leak found in tracked files/history → stop, tell user at once. A new commit doesn't remove it from history/remote; cleanup (history rewrite, force-push) only with user's OK.

## Conventions

- Code, comments, CLAUDE.md, commits: English, terse. UI text: Russian. Talk to user: Russian.
- Files ≲250 lines: soft limit, signal to split by responsibility. Exceed only when splitting hurts cohesion (one state machine, one data table); then warn user with the reason and put `// size: <reason>` at file top. Never grow past it silently.
- Tests: `*.test.ts(x)` beside code; test a module through its `index.ts`. DOM-free by default (node env).
- Routing (when added): hash-based (base `./` must work on Pages subpath and file://).
- Single-file build must work offline: bundle fonts/icons/assets, no CDN.

## Modules map

- data: single gateway to persisted data (address tree, ranked phrases, encrypted per-person records); crypto/storage via ports.
