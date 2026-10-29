# module: data

Purpose: single gateway to all persisted data: address tree, ranked confirmed phrases, per-person encrypted JSON records.
Uses: nothing (shared only). Crypto and storage come in as ports (`Cipher`, `StorageBackend`), wired by app.

Contract notes:

- `createDataService({ backend, cipher })` once in app; feature modules receive `DataService` (or one store), never a backend.
- Every stored doc = JSON `{ schema, data }`. Bump `schema` + add a migration in `parse` only when the old format shipped in `main`; unreleased formats are just replaced.
- `phrases.confirm` only after the user confirmed values. Field ids namespaced by owner module (`person.lastName`).
- `RecordDoc.name` prefixed by owner module (`person.profile`); T must be JSON-serializable.
- All failures are `DataError` with `code`; branch on code (`no_cipher` → ask to unlock, etc.).

Invariants:

- Phrases + records always encrypted; tree per `TreeOptions.encrypted`. No cipher → `no_cipher`, never plaintext fallback.
- AAD = storage key: ciphertext moved to another key fails (`decrypt_failed`).
- Keys built only from ids (`PersonId` = random hex). Never names/values in keys: Drive shows file names.
- Writes per key serialized (lock); cached docs change only after a successful write.
- Phrase weights: w ← max(floor, (1−α)w + α·used); share = w/Σw. Bounded, no counters (see ranking.ts).

Decisions:

- Ports not imports: crypto/drive modules implement `Cipher`/`StorageBackend` (depend on data's index), app wires them; data never imports them — no cycles, testable with memory backend (2026-10-29).
- Cipher is a getter, read per operation: vault lock/unlock needs no service rebuild (2026-10-29).
- Tree = one doc per tree, full in-memory index rebuilt per mutation (O(n)). Fine for user-sized trees; a full address registry needs sharding by parent behind the same `TreeStore` API (2026-10-29).
- Tests use `testkit.ts` fake cipher (not encryption; test-only).

State: core + memory backend done, tested. Next: IndexedDB backend (here), crypto module (`Cipher`, WebCrypto AES-GCM), drive module (`StorageBackend`), app wiring + lock UI, conflict handling for multi-device Drive (no `conflict` code yet), change subscriptions for UI.
