import { DataError } from './errors';

/** Display form: NFC, trimmed, inner whitespace collapsed. Case kept. */
export function cleanText(value: string): string {
  return value.normalize('NFC').replace(/\s+/g, ' ').trim();
}

/** Match key: clean + lowercase + ё→е. Two values with equal keys are the same value. */
export function matchKey(value: string): string {
  return cleanText(value).toLocaleLowerCase('ru').replaceAll('ё', 'е');
}

export function requireText(value: string, what: string): string {
  const clean = cleanText(value);
  if (!clean) throw new DataError('invalid_value', `Empty ${what}`);
  return clean;
}

const collator = new Intl.Collator('ru', { sensitivity: 'base', numeric: true });
export const compareText = (a: string, b: string): number => collator.compare(a, b);
