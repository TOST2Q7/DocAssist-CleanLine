import { DataError } from './errors';
import type { Bytes, CipherSource, StorageBackend } from './ports';

// Every stored document: JSON `{ schema, data }`, encrypted as a whole when the collection is private.

/** How one kind of document is (de)serialized. */
export interface DocSpec<T> {
  /** Private collections are always encrypted; no cipher → 'no_cipher', never a plaintext fallback. */
  readonly encrypted: boolean;
  /** Current schema version written by this app. Bump on any format change. */
  readonly schema: number;
  /** Validate stored data, migrating from an older `schema`. Throw on anything unexpected. */
  parse(data: unknown, schema: number): T;
  /** In-memory value → JSON-serializable data. */
  toData(value: T): unknown;
}

export interface DocIO {
  read<T>(key: string, spec: DocSpec<T>): Promise<T | null>;
  write<T>(key: string, spec: DocSpec<T>, value: T): Promise<void>;
  /** Read-modify-write under a per-key lock: concurrent updates of one key never lose writes. */
  update<T>(key: string, spec: DocSpec<T>, fn: (current: T | null) => T): Promise<T>;
  remove(key: string): Promise<void>;
  list(prefix: string): Promise<string[]>;
}

const utf8 = new TextEncoder();
const fromUtf8 = new TextDecoder('utf-8', { fatal: true });

export function createDocIO(backend: StorageBackend, cipherSource: CipherSource): DocIO {
  const locks = new Map<string, Promise<unknown>>();

  function withLock<R>(key: string, task: () => Promise<R>): Promise<R> {
    const run = (locks.get(key) ?? Promise.resolve()).then(task, task);
    const tail = run.catch(() => undefined);
    locks.set(key, tail);
    void tail.then(() => {
      if (locks.get(key) === tail) locks.delete(key);
    });
    return run;
  }

  function cipherFor(key: string) {
    const cipher = cipherSource();
    if (!cipher) throw new DataError('no_cipher', `Encrypted data unavailable: ${key}`);
    return cipher;
  }

  async function read<T>(key: string, spec: DocSpec<T>): Promise<T | null> {
    const stored = await io(() => backend.read(key));
    if (stored === null) return null;
    let bytes = stored;
    if (spec.encrypted) {
      try {
        bytes = await cipherFor(key).decrypt(stored, utf8.encode(key));
      } catch (e) {
        if (e instanceof DataError) throw e;
        throw new DataError('decrypt_failed', `Cannot decrypt: ${key}`, { cause: e });
      }
    }
    let envelope: unknown;
    try {
      envelope = JSON.parse(fromUtf8.decode(bytes));
    } catch (e) {
      throw new DataError('corrupt', `Not a JSON document: ${key}`, { cause: e });
    }
    if (!isEnvelope(envelope)) throw new DataError('corrupt', `Bad envelope: ${key}`);
    if (envelope.schema > spec.schema) {
      throw new DataError('unsupported_schema', `Schema ${envelope.schema} is newer: ${key}`);
    }
    try {
      return spec.parse(envelope.data, envelope.schema);
    } catch (e) {
      throw new DataError('corrupt', `Invalid data: ${key}`, { cause: e });
    }
  }

  async function write<T>(key: string, spec: DocSpec<T>, value: T): Promise<void> {
    let bytes: Bytes = utf8.encode(
      JSON.stringify({ schema: spec.schema, data: spec.toData(value) }),
    );
    if (spec.encrypted) bytes = await cipherFor(key).encrypt(bytes, utf8.encode(key));
    await io(() => backend.write(key, bytes));
  }

  return {
    read,
    write: (key, spec, value) => withLock(key, () => write(key, spec, value)),
    update: (key, spec, fn) =>
      withLock(key, async () => {
        const next = fn(await read(key, spec));
        await write(key, spec, next);
        return next;
      }),
    remove: (key) => withLock(key, () => io(() => backend.remove(key))),
    list: (prefix) => io(() => backend.list(prefix)),
  };
}

/** Lazily loaded, in-memory cached document. Cache changes only after a successful write. */
export interface CachedDoc<T> {
  get(): Promise<T>;
  mutate(fn: (current: T) => T): Promise<T>;
}

export function cachedDoc<T>(
  docs: DocIO,
  key: string,
  spec: DocSpec<T>,
  empty: () => T,
): CachedDoc<T> {
  let cache: Promise<T> | null = null;
  const load = () => {
    // A failed load (e.g. vault locked) is not cached: retried on next call.
    cache ??= docs.read(key, spec).then(
      (v) => v ?? empty(),
      (e: unknown) => {
        cache = null;
        throw e;
      },
    );
    return cache;
  };
  return {
    get: load,
    async mutate(fn) {
      const next = await docs.update(key, spec, (current) => fn(current ?? empty()));
      cache = Promise.resolve(next);
      return next;
    },
  };
}

async function io<R>(op: () => Promise<R>): Promise<R> {
  try {
    return await op();
  } catch (e) {
    throw new DataError('backend', 'Storage backend failed', { cause: e });
  }
}

function isEnvelope(v: unknown): v is { schema: number; data: unknown } {
  return (
    typeof v === 'object' &&
    v !== null &&
    'schema' in v &&
    Number.isInteger(v.schema) &&
    (v.schema as number) >= 1 &&
    'data' in v
  );
}
