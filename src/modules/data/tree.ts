import { cachedDoc, type DocIO, type DocSpec } from './doc-io';
import { DataError } from './errors';
import { assertSegment, joinKey, newId } from './ids';
import { compareText, matchKey, requireText } from './text';

export interface TreeNode {
  readonly id: string;
  /** null = top level. */
  readonly parentId: string | null;
  /** Kind of node, owned by the caller: 'region', 'city', 'street'... */
  readonly level: string;
  readonly name: string;
  /** Small extra attributes (postal code, type abbreviation). */
  readonly meta?: Readonly<Record<string, string>>;
}

export type NewTreeNode = Omit<TreeNode, 'id'>;

export interface TreeFindOptions {
  /** Search only descendants of this node (default: whole tree). */
  readonly under?: string;
  readonly level?: string;
  /** Default 20. */
  readonly limit?: number;
}

/** Hierarchical reference data (addresses). Sibling names are unique by match key + level. */
export interface TreeStore {
  get(id: string): Promise<TreeNode | null>;
  /** Sorted by name. */
  children(parentId: string | null): Promise<TreeNode[]>;
  /** Root → node inclusive; [] when the node does not exist. */
  path(id: string): Promise<TreeNode[]>;
  /** Name contains the query (prefix matches first). */
  find(query: string, options?: TreeFindOptions): Promise<TreeNode[]>;
  /** Idempotent: an existing sibling with the same name and level is returned instead. */
  add(node: NewTreeNode): Promise<TreeNode>;
  rename(id: string, name: string): Promise<TreeNode>;
  /** Removes the whole subtree. */
  remove(id: string): Promise<void>;
}

export interface TreeOptions {
  /** true when nodes may hold personal data. Public reference data (address registry) may be false. */
  readonly encrypted: boolean;
}

interface TreeIndex {
  readonly byId: ReadonlyMap<string, TreeNode>;
  readonly kids: ReadonlyMap<string | null, readonly TreeNode[]>;
}

function indexOf(nodes: Iterable<TreeNode>): TreeIndex {
  const byId = new Map<string, TreeNode>();
  const kids = new Map<string | null, TreeNode[]>();
  for (const n of nodes) {
    byId.set(n.id, n);
    const siblings = kids.get(n.parentId);
    if (siblings) siblings.push(n);
    else kids.set(n.parentId, [n]);
  }
  for (const list of kids.values()) list.sort((a, b) => compareText(a.name, b.name));
  return { byId, kids };
}

function specFor(encrypted: boolean): DocSpec<TreeIndex> {
  return {
    encrypted,
    schema: 1,
    parse(data) {
      const nodes = (data as { nodes?: unknown }).nodes;
      if (!Array.isArray(nodes)) throw new TypeError('nodes');
      const index = indexOf(nodes.map(parseNode));
      for (const n of index.byId.values()) {
        if (n.parentId !== null && !index.byId.has(n.parentId)) throw new TypeError('orphan node');
      }
      return index;
    },
    toData: (index) => ({ nodes: [...index.byId.values()] }),
  };
}

function parseNode(v: unknown): TreeNode {
  const n = v as Partial<TreeNode>;
  const ok =
    typeof n.id === 'string' &&
    (n.parentId === null || typeof n.parentId === 'string') &&
    typeof n.level === 'string' &&
    typeof n.name === 'string' &&
    (n.meta === undefined || (typeof n.meta === 'object' && n.meta !== null));
  if (!ok) throw new TypeError('node');
  return n as TreeNode;
}

export function createTreeStore(docs: DocIO, treeId: string, options: TreeOptions): TreeStore {
  const empty = (): TreeIndex => ({ byId: new Map(), kids: new Map() });
  const doc = cachedDoc(
    docs,
    joinKey('tree', assertSegment(treeId, 'tree')),
    specFor(options.encrypted),
    empty,
  );

  const sameSibling = (
    index: TreeIndex,
    parentId: string | null,
    level: string,
    name: string,
    skip?: string,
  ) =>
    (index.kids.get(parentId) ?? []).find(
      (n) => n.id !== skip && n.level === level && matchKey(n.name) === matchKey(name),
    );

  function descendants(index: TreeIndex, rootId: string | null): TreeNode[] {
    const out: TreeNode[] = [];
    const stack = [...(index.kids.get(rootId) ?? [])];
    for (let n = stack.pop(); n; n = stack.pop()) {
      out.push(n);
      stack.push(...(index.kids.get(n.id) ?? []));
    }
    return out;
  }

  function existing(index: TreeIndex, id: string): TreeNode {
    const node = index.byId.get(id);
    if (!node) throw new DataError('not_found', 'Tree node not found');
    return node;
  }

  return {
    get: async (id) => (await doc.get()).byId.get(id) ?? null,
    children: async (parentId) => [...((await doc.get()).kids.get(parentId) ?? [])],

    async path(id) {
      const { byId } = await doc.get();
      const out: TreeNode[] = [];
      // Bounded by size: a corrupted parent cycle cannot loop forever.
      for (
        let n = byId.get(id);
        n && out.length <= byId.size;
        n = n.parentId === null ? undefined : byId.get(n.parentId)
      ) {
        out.unshift(n);
      }
      return out;
    },

    async find(query, { under, level, limit = 20 } = {}) {
      const q = matchKey(query);
      const index = await doc.get();
      return descendants(index, under ?? null)
        .filter((n) => (level === undefined || n.level === level) && matchKey(n.name).includes(q))
        .map((n) => ({ n, prefix: matchKey(n.name).startsWith(q) ? 0 : 1 }))
        .sort((a, b) => a.prefix - b.prefix || compareText(a.n.name, b.n.name))
        .slice(0, limit)
        .map((x) => x.n);
    },

    async add({ parentId, level, name, meta }) {
      const clean = requireText(name, 'node name');
      let result: TreeNode | undefined;
      await doc.mutate((index) => {
        if (parentId !== null) existing(index, parentId);
        result = sameSibling(index, parentId, level, clean);
        if (result) return index;
        result = {
          id: newId(),
          parentId,
          level,
          name: clean,
          ...(meta ? { meta: { ...meta } } : {}),
        };
        return indexOf([...index.byId.values(), result]);
      });
      return result as TreeNode;
    },

    async rename(id, name) {
      const clean = requireText(name, 'node name');
      let result: TreeNode | undefined;
      await doc.mutate((index) => {
        const node = existing(index, id);
        if (sameSibling(index, node.parentId, node.level, clean, id)) {
          throw new DataError('invalid_value', 'Sibling with this name exists');
        }
        result = { ...node, name: clean };
        return indexOf(
          [...index.byId.values()].map((n) => (n.id === id ? (result as TreeNode) : n)),
        );
      });
      return result as TreeNode;
    },

    async remove(id) {
      await doc.mutate((index) => {
        const gone = new Set([id, ...descendants(index, existing(index, id).id).map((n) => n.id)]);
        return indexOf([...index.byId.values()].filter((n) => !gone.has(n.id)));
      });
    },
  };
}
