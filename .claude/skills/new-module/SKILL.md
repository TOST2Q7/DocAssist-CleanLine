---
name: new-module
description: Scaffold a feature module in src/modules (public index.ts, CLAUDE.md, test) and register it in the root CLAUDE.md Modules map. Use when starting a new feature area.
---

Arg: module name, kebab-case domain noun (`auth`, `drive`, `crypto`), not a tech layer (`utils`, `hooks`).

1. Check the root CLAUDE.md Modules map: the area must not already be covered by a module.
2. Create in `src/modules/<m>/`:
   - `index.ts`: public API. Explicit named exports only (no `export *`); types first, with short TSDoc where semantics aren't obvious.
   - `<m>.test.ts`: tests importing only `./index`.
   - `CLAUDE.md` from the template below, ≤30 lines. Omit empty sections.
3. Add `- <m>: <purpose>` to the root CLAUDE.md Modules map (replace "(none yet)").
4. Run `npm run check`.

```markdown
# module: <m>

Purpose: <one line>
Uses: <modules / shared parts it depends on>
Contract notes: <only non-obvious API semantics; the types in index.ts are the contract>
Invariants: <must always hold: security, data formats, ordering>
Decisions: <choice — reason (YYYY-MM-DD)>
State: <done / next / known gaps>
```
