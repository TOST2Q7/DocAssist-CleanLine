export type DataErrorCode =
  /** Encrypted collection touched while no cipher is available (vault locked). */
  | 'no_cipher'
  /** Wrong key, data moved to another key, or tampered ciphertext. */
  | 'decrypt_failed'
  /** Stored bytes are not a valid document for this collection. */
  | 'corrupt'
  /** Stored schema is newer than this app version understands. */
  | 'unsupported_schema'
  /** Id is not a safe key segment. */
  | 'invalid_id'
  /** Value empty after cleanup, or otherwise unusable. */
  | 'invalid_value'
  /** Referenced item does not exist. */
  | 'not_found'
  /** Storage backend failed (I/O, network, quota). */
  | 'backend';

/** The only error type the data module throws. Branch on `code`, not on message. */
export class DataError extends Error {
  readonly code: DataErrorCode;

  constructor(code: DataErrorCode, message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'DataError';
    this.code = code;
  }
}

export function isDataError(e: unknown, code?: DataErrorCode): e is DataError {
  return e instanceof DataError && (code === undefined || e.code === code);
}
