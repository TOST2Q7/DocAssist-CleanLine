import { cachedDoc, type CachedDoc, type DocIO, type DocSpec } from './doc-io';
import { DataError } from './errors';
import { assertSegment, joinKey } from './ids';
import { applyUse, withShares, type RankingParams, type WeightedValue } from './ranking';
import { compareText, matchKey, requireText } from './text';

export interface PhraseSuggestion {
  readonly value: string;
  /** Share of this value among all values of the field, 0..1 (smoothed, see RankingParams). */
  readonly share: number;
}

export interface PhraseConfirmation {
  /** Field id, namespaced by the owning module: 'person.lastName', 'contact.email'. */
  readonly field: string;
  readonly value: string;
}

/** Remembered, user-confirmed values per input field, ranked by smoothed usage. Always encrypted. */
export interface PhraseStore {
  /** Values whose match key starts with the input's (empty input = top values), best first. */
  suggest(field: string, input: string, limit?: number): Promise<PhraseSuggestion[]>;
  /** Call only after the user confirmed the values are correct. Adds new ones, re-ranks the fields. */
  confirm(items: readonly PhraseConfirmation[]): Promise<void>;
  /** Remove a value (user rejected a wrong suggestion). */
  forget(field: string, value: string): Promise<void>;
}

const spec: DocSpec<WeightedValue[]> = {
  encrypted: true,
  schema: 1,
  parse(data) {
    const entries = (data as { entries?: unknown }).entries;
    if (!Array.isArray(entries)) throw new TypeError('entries');
    return entries.map((e: unknown) => {
      const { value, weight } = e as Partial<WeightedValue>;
      if (typeof value !== 'string' || typeof weight !== 'number' || !(weight > 0))
        throw new TypeError('entry');
      return { value, weight };
    });
  },
  toData: (entries) => ({ entries }),
};

export function createPhraseStore(docs: DocIO, ranking: RankingParams): PhraseStore {
  const fields = new Map<string, CachedDoc<WeightedValue[]>>();
  const field = (id: string) => {
    let doc = fields.get(id);
    if (!doc) {
      doc = cachedDoc(docs, joinKey('phrases', assertSegment(id, 'field')), spec, () => []);
      fields.set(id, doc);
    }
    return doc;
  };

  return {
    async suggest(fieldId, input, limit = 10) {
      const prefix = matchKey(input);
      const entries = await field(fieldId).get();
      return withShares(entries)
        .filter((e) => matchKey(e.value).startsWith(prefix))
        .sort((a, b) => b.share - a.share || compareText(a.value, b.value))
        .slice(0, limit);
    },

    async confirm(items) {
      const byField = new Map<string, string[]>();
      // Validate everything first: no partial writes on bad input.
      for (const { field: id, value } of items) {
        assertSegment(id, 'field');
        const clean = requireText(value, 'phrase');
        byField.set(id, [...(byField.get(id) ?? []), clean]);
      }
      await Promise.all(
        [...byField].map(([id, values]) =>
          field(id).mutate((entries) =>
            values.reduce((acc, v) => applyUse(acc, v, ranking), entries),
          ),
        ),
      );
    },

    async forget(fieldId, value) {
      const key = matchKey(value);
      await field(fieldId).mutate((entries) => {
        const rest = entries.filter((e) => matchKey(e.value) !== key);
        if (rest.length === entries.length) throw new DataError('not_found', 'Phrase not found');
        return rest;
      });
    },
  };
}
