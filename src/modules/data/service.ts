import { createDocIO } from './doc-io';
import { DataError } from './errors';
import { createPhraseStore, type PhraseStore } from './phrases';
import type { CipherSource, StorageBackend } from './ports';
import { DEFAULT_RANKING, validateRanking, type RankingParams } from './ranking';
import { createRecordStore, type RecordStore } from './records';
import { createTreeStore, type TreeOptions, type TreeStore } from './tree';

export interface DataServiceOptions {
  readonly backend: StorageBackend;
  /** Called on every encrypted read/write; return null while locked. */
  readonly cipher: CipherSource;
  readonly ranking?: Partial<RankingParams>;
}

/** Single gateway to all persisted app data. Create one per app (app shell), pass it down. */
export interface DataService {
  /** Same id → same store; reopening with different options throws. */
  tree(treeId: string, options: TreeOptions): TreeStore;
  readonly phrases: PhraseStore;
  readonly records: RecordStore;
}

export function createDataService({ backend, cipher, ranking }: DataServiceOptions): DataService {
  const docs = createDocIO(backend, cipher);
  const trees = new Map<string, { options: TreeOptions; store: TreeStore }>();
  return {
    tree(treeId, options) {
      const open = trees.get(treeId);
      if (open) {
        if (open.options.encrypted !== options.encrypted) {
          throw new DataError('invalid_value', `Tree ${treeId} reopened with other options`);
        }
        return open.store;
      }
      const store = createTreeStore(docs, treeId, options);
      trees.set(treeId, { options: { ...options }, store });
      return store;
    },
    phrases: createPhraseStore(docs, validateRanking({ ...DEFAULT_RANKING, ...ranking })),
    records: createRecordStore(docs),
  };
}
