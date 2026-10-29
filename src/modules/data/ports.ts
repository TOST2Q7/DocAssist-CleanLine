// Ports: what the data module needs from the outside. Implemented elsewhere, injected by app.

/** Raw stored bytes. ArrayBuffer-backed so WebCrypto accepts them as-is. */
export type Bytes = Uint8Array<ArrayBuffer>;

/**
 * Byte storage (memory, IndexedDB, Google Drive...). Keys are '/'-separated paths
 * built by this module from ids only, never from personal data (Drive shows names).
 */
export interface StorageBackend {
  /** null when the key does not exist. */
  read(key: string): Promise<Bytes | null>;
  write(key: string, bytes: Bytes): Promise<void>;
  /** No-op when the key does not exist. */
  remove(key: string): Promise<void>;
  /** All keys starting with `prefix`, any order. */
  list(prefix: string): Promise<string[]>;
}

/**
 * Authenticated encryption (AEAD), implemented by the crypto module.
 * `aad` = the storage key: ciphertext copied to another key must fail to decrypt.
 */
export interface Cipher {
  encrypt(plain: Bytes, aad: Bytes): Promise<Bytes>;
  /** Must throw on wrong key, wrong aad or tampered data. */
  decrypt(sealed: Bytes, aad: Bytes): Promise<Bytes>;
}

/** Current cipher, or null while the vault is locked / not set up. Read on every operation. */
export type CipherSource = () => Cipher | null;
