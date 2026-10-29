import { DataError } from './errors';

// Key segments: ids only. Never put names, emails or other user values into keys.
const SEGMENT = /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/;

declare const personBrand: unique symbol;
/** Random opaque id of a person (folder of their records). Never derived from personal data. */
export type PersonId = string & { readonly [personBrand]: true };

export function assertSegment(id: string, what: string): string {
  if (!SEGMENT.test(id) || id.includes('..')) {
    throw new DataError('invalid_id', `Invalid ${what} id`);
  }
  return id;
}

export function joinKey(...segments: string[]): string {
  return segments.join('/');
}

/** 128-bit random hex id. getRandomValues: works on file:// too (randomUUID needs a secure context). */
export function newId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

export function newPersonId(): PersonId {
  return newId() as PersonId;
}

export function isPersonId(value: string): value is PersonId {
  return SEGMENT.test(value) && !value.includes('..');
}
