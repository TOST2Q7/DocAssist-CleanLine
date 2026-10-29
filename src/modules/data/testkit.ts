// Test-only helpers (imported by *.test.ts only). NOT encryption: never use outside tests.
import type { Bytes, Cipher } from './index';

/** Reversible, aad-bound scrambling: proves wiring (aad check, no plaintext at rest), not secrecy. */
export function fakeCipher(): Cipher {
  const mix = (data: Bytes, aad: Bytes) =>
    data.map((b, i) => b ^ ((0x5a + (aad[i % aad.length] ?? 0)) & 0xff));
  return {
    encrypt: async (plain, aad) => {
      const out = new Uint8Array(aad.length + plain.length);
      out.set(aad);
      out.set(mix(plain, aad), aad.length);
      return out;
    },
    decrypt: async (sealed, aad) => {
      const head = sealed.subarray(0, aad.length);
      if (head.length !== aad.length || head.some((b, i) => b !== aad[i]))
        throw new Error('aad mismatch');
      return mix(sealed.slice(aad.length), aad);
    },
  };
}

export async function readAll(backend: {
  list(p: string): Promise<string[]>;
  read(k: string): Promise<Bytes | null>;
}) {
  const keys = await backend.list('');
  const parts = await Promise.all(
    keys.map(async (k) => new TextDecoder().decode((await backend.read(k)) ?? undefined)),
  );
  return keys.join('\n') + parts.join('\n');
}
