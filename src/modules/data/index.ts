// Public API of the data module. Everything else in this folder is internal.

export type { Bytes, Cipher, CipherSource, StorageBackend } from './ports';
export type { DataErrorCode } from './errors';
export type { PersonId } from './ids';
export type { RankingParams } from './ranking';
export type { PhraseConfirmation, PhraseStore, PhraseSuggestion } from './phrases';
export type { NewTreeNode, TreeFindOptions, TreeNode, TreeOptions, TreeStore } from './tree';
export type { RecordDoc, RecordStore } from './records';
export type { DataService, DataServiceOptions } from './service';

export { DataError, isDataError } from './errors';
export { isPersonId, newPersonId } from './ids';
export { DEFAULT_RANKING } from './ranking';
export { createMemoryBackend } from './memory-backend';
export { createDataService } from './service';
