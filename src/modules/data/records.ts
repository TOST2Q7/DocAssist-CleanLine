import type { DocIO, DocSpec } from './doc-io';
import { assertSegment, joinKey, type PersonId } from './ids';

/**
 * One JSON document kind stored in every person's folder ('profile', 'passport'...).
 * Defined by the module that owns the data; it validates and migrates its own format.
 */
export interface RecordDoc<T> {
  /** Key-safe name, unique across modules: prefix with the module ('person.profile'). */
  readonly name: string;
  /** Current schema version. Bump on any format change and handle old ones in `parse`. */
  readonly schema: number;
  /** Validate stored JSON (from `schema` ≤ current) into T. Throw on anything unexpected. */
  parse(data: unknown, schema: number): T;
}

/** Per-person encrypted JSON documents: records/<personId>/<doc.name>. Always encrypted. */
export interface RecordStore {
  persons(): Promise<PersonId[]>;
  read<T>(person: PersonId, doc: RecordDoc<T>): Promise<T | null>;
  /** T must be JSON-serializable (no Date, Map, undefined-only fields). */
  write<T>(person: PersonId, doc: RecordDoc<T>, value: T): Promise<void>;
  /** Atomic read-modify-write; `current` is null when the document does not exist yet. */
  update<T>(person: PersonId, doc: RecordDoc<T>, fn: (current: T | null) => T): Promise<T>;
  remove(person: PersonId, doc: RecordDoc<unknown>): Promise<void>;
  /** Deletes the person's whole folder. */
  removePerson(person: PersonId): Promise<void>;
}

const ROOT = 'records';

export function createRecordStore(docs: DocIO): RecordStore {
  const keyOf = (person: PersonId, doc: RecordDoc<unknown>) =>
    joinKey(ROOT, assertSegment(person, 'person'), assertSegment(doc.name, 'record'));
  const specOf = <T>(doc: RecordDoc<T>): DocSpec<T> => ({
    encrypted: true,
    schema: doc.schema,
    parse: (data, schema) => doc.parse(data, schema),
    toData: (value) => value,
  });
  const folderOf = (person: PersonId) => joinKey(ROOT, assertSegment(person, 'person'), '');

  return {
    async persons() {
      const keys = await docs.list(`${ROOT}/`);
      const ids = new Set(keys.map((k) => k.split('/')[1]).filter((id): id is string => !!id));
      return [...ids] as PersonId[];
    },
    // async: invalid ids surface as rejections, like every other failure.
    read: async (person, doc) => docs.read(keyOf(person, doc), specOf(doc)),
    write: async (person, doc, value) => docs.write(keyOf(person, doc), specOf(doc), value),
    update: async (person, doc, fn) => docs.update(keyOf(person, doc), specOf(doc), fn),
    remove: async (person, doc) => docs.remove(keyOf(person, doc)),
    async removePerson(person) {
      const keys = await docs.list(folderOf(person));
      await Promise.all(keys.map((k) => docs.remove(k)));
    },
  };
}
