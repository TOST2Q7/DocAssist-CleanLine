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

## Product

- Users: «мастера» of student brigades (РСО): the layer between «бойцы» (people in a squad, sometimes other squads) and the regional HQ, which gets clean data + squad reports of several kinds.
- Job: automate their routine: fast checks of table data, documents from templates, structured document work (app shows what goes where, e.g. on Google Drive, and sometimes files/edits it itself).
- Self-tuning: most functional parts get a manual-config window with Lua (table-check filters, extra actions on buttons, …).
- Personal data everywhere (passports, scans, …): reliability and privacy are product features, not extras.
- UI for an ordinary PC user: plain words, no jargon, pleasant and obvious. Advanced tools (Lua) are tucked aside, invisible in normal use, but ergonomic for real editing.

## Commands

- `npm run check` = tsc + oxlint + depcruise + prettier + vitest. Must pass before commit. `npm run format` fixes style.
- `npm run dev` | `build` → dist/ | `build:file` → dist-file/docassist-cleanline-vX.Y.Z.html
- Version: package.json `version` → `APP_VERSION`. Release: bump version, tag `vX.Y.Z` (CI checks they match).

## Layout & boundaries (enforced by `.dependency-cruiser.cjs`)

- `src/app/` shell: entry, layout, routing, wiring modules together. Composition only, no domain logic.
- `src/modules/<m>/` one feature area with its own CLAUDE.md. Public API = `index.ts` only.
- `src/shared/` domain-free code used by ≥2 areas (design tokens, ui kit, utils, env).
- `src/clips/<id>/` one «Прищепка» (planned; add depcruise rules with the first clip). See Clips.
- Allowed: app → clips, modules (index), shared. clip → modules (index), shared; never another clip. module → shared, other module (index); never a clip. shared → shared. No cycles.
- Alias `@/` = `src/` for cross-area imports; relative imports only inside an area.
- All persistence (read/save/sync, any storage) only via `@/modules/data`. Other modules never touch localStorage/IndexedDB/Drive files directly (oxlint `no-restricted-globals` guards the first two). Need a new kind of data → extend data's index.ts.

## Session protocol (token economy)

- 1 session = 1 area (a clip | a module | shared/x | app); unclear which → ask. Not named by user → infer from task. Task spans >1 area → first list areas + contract changes, get OK.
- Read only the area's files + the `index.ts` of modules it uses (types = contract). Never open other areas' internals; needing them = contract gap → extend that index.ts as a separate step.
- No repo-wide exploration "for context"; narrow Grep/Glob paths.
- End of task: update area CLAUDE.md + Modules map if purpose/contract/decision/state changed. Remove stale lines. CLAUDE.md = why/invariants/gotchas/state, never a retelling of code.
- New module → skill `new-module`.
- Changing a module's `index.ts` contract → grep its users in `src/clips` + `src/modules`, fix them, tell user which clips were affected.
- Don't touch other clips "on the way": needed change there = separate explicit step, told to user first.
- A rule here blocks the task (limit, boundary, convention) → don't work around it silently. Tell user: which rule, why it blocks, options (relax / drop / keep and adapt). Edit CLAUDE.md only after OK.

## Git & branches

- `claude-development`: default working branch (work + tests with Claude). Commit and push here; never create new branches unless asked. If the session was assigned another branch (e.g. `claude/*`), still work in `claude-development`.
- `testers-prerelease`: pre-release builds for testers. `main`: releases + Pages. Push/merge into `testers-prerelease` or `main` only with the user's explicit OK.
- Compatibility is owed only to what shipped in `main` (released versions). Work in `claude-development` / `testers-prerelease` may break formats, APIs and stored data freely: no migrations or shims between unreleased states.
- Workaround kept only for `main` compatibility → log it in `docs/workarounds.md` (template inside) + `// workaround: W-NNN` in code; delete the entry with the code. Grep it by area before touching code; don't read it whole. The file lives only in `claude-development`: drop it when merging into `testers-prerelease`/`main`, keep it when merging those back.
- Commit author: `git config user.name "Tost"` + `git config user.email "113260893+TOST2Q7@users.noreply.github.com"` before the first commit of a session. Only goal: commits count in the user's GitHub contribution graph. Trailers (Co-Authored-By etc.) don't matter.

## Clips («Прищепки»)

- The app = a shell hosting clips: independent mini-apps, each a separate line of work. Planned: table check, documents from templates, personal files (scans + per-person data). Code name `clip`, UI name «Прищепка».
- Each clip: own folder, screens, texts, settings and version in `manifest.ts` (id, title, version, what it syncs). App discovers manifests itself; new clip = new folder. Site version = package.json.
- Clips never import or read each other. They talk only through a typed, versioned message protocol owned by core («agreed language», not ad-hoc calls into each other). Needed by 2+ clips → move it into core.
- Shared data only via core (`@/modules/data`): people records, trees, ranked phrases, field catalog. A clip keeps its per-person data in its own namespaced section of the person record (`<clip>.…`), never a side file. Shared formats are read by every clip: change them carefully.

## Core cells (each sensitive function isolated in one module)

- data: all persistence (exists). People data lives only in per-person records.
- google (planned): sign-in + every request to Google APIs. Nobody else fetches Google. Drive storage = a data `StorageBackend`.
- crypto (planned): encryption. The scheme never leaks: not in file formats, UI texts or other modules.
- security (planned): CSP + security checks.
- conflicts (planned): multi-device edits: device labels, conflict detection in data, conflict dialog in UI.
- settings sync (planned): personal settings on the user's own Drive; each clip declares in its manifest what syncs.
- scripting (planned): Lua runtime for user tuning. Sandboxed: in a Worker with timeout, only an explicit API (no network/DOM/storage), offline-bundled (candidates: wasmoon, fengari).

## Planned foundations

- Floating windows: draggable, stay in viewport, raise on focus, several at once; opened by any clip via app's window host. First user: scan viewer with zoom/pan, opened on a chosen file or auto-picked by the field being filled (name/passport fields → passport scan). Field → document kind mapping belongs to the field catalog; clips ask for a document via the protocol, not by reading the personal-files clip.

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

Clips: (none yet)
