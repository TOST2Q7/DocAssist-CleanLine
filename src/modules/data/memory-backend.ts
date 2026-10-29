import type { Bytes, StorageBackend } from './ports';

/** In-memory backend: tests, and a session-only store until a persistent backend exists. */
export function createMemoryBackend(): StorageBackend {
  const files = new Map<string, Bytes>();
  return {
    read: async (key) => {
      const bytes = files.get(key);
      return bytes ? bytes.slice() : null;
    },
    write: async (key, bytes) => {
      files.set(key, bytes.slice());
    },
    remove: async (key) => {
      files.delete(key);
    },
    list: async (prefix) => [...files.keys()].filter((k) => k.startsWith(prefix)),
  };
}
