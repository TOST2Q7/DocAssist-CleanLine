import { describe, expect, it } from 'vitest';
import { createDataService, createMemoryBackend, isDataError } from './index';
import { fakeCipher, readAll } from './testkit';

const service = (backend = createMemoryBackend()) =>
  createDataService({ backend, cipher: fakeCipher });

describe('tree', () => {
  it('builds a hierarchy and walks it', async () => {
    const backend = createMemoryBackend();
    const tree = service(backend).tree('addresses', { encrypted: false });
    const region = await tree.add({ parentId: null, level: 'region', name: 'Тестовая область' });
    const city = await tree.add({
      parentId: region.id,
      level: 'city',
      name: 'Тестоград',
      meta: { postal: '000000' },
    });
    const b = await tree.add({ parentId: city.id, level: 'street', name: 'Бета' });
    await tree.add({ parentId: city.id, level: 'street', name: 'Альфа' });

    expect((await tree.children(city.id)).map((n) => n.name)).toEqual(['Альфа', 'Бета']);
    expect((await tree.path(b.id)).map((n) => n.level)).toEqual(['region', 'city', 'street']);
    expect((await tree.find('т', { under: region.id })).map((n) => n.name)).toEqual([
      'Тестоград',
      'Бета',
    ]);
    expect(await tree.find('альфа', { level: 'city' })).toEqual([]);

    // Persisted: a fresh service over the same backend sees the same tree.
    const again = service(backend).tree('addresses', { encrypted: false });
    expect(await again.get(city.id)).toEqual(city);
  });

  it('add is idempotent per parent + level + normalized name', async () => {
    const tree = service().tree('t', { encrypted: false });
    const a = await tree.add({ parentId: null, level: 'city', name: 'Ёлкино' });
    expect(await tree.add({ parentId: null, level: 'city', name: ' елкино ' })).toEqual(a);
    await expect(tree.add({ parentId: 'missing', level: 'city', name: 'X' })).rejects.toSatisfy(
      (e) => isDataError(e, 'not_found'),
    );
  });

  it('renames with sibling check and removes subtrees', async () => {
    const tree = service().tree('t', { encrypted: false });
    const root = await tree.add({ parentId: null, level: 'region', name: 'Р' });
    const x = await tree.add({ parentId: root.id, level: 'city', name: 'X' });
    const y = await tree.add({ parentId: root.id, level: 'city', name: 'Y' });
    await expect(tree.rename(y.id, 'x')).rejects.toSatisfy((e) => isDataError(e, 'invalid_value'));
    expect((await tree.rename(y.id, 'Z')).name).toBe('Z');
    await tree.add({ parentId: x.id, level: 'street', name: 'S' });
    await tree.remove(root.id);
    expect(await tree.find('')).toEqual([]);
  });

  it('encrypts private trees', async () => {
    const backend = createMemoryBackend();
    await service(backend)
      .tree('t', { encrypted: true })
      .add({ parentId: null, level: 'l', name: 'Секрет' });
    expect(await readAll(backend)).not.toContain('Секрет');
  });

  it('rejects bad tree ids and conflicting reopen options', () => {
    const data = service();
    data.tree('t', { encrypted: true });
    expect(() => data.tree('t', { encrypted: false })).toThrow(/other options/);
    expect(() => data.tree('../t', { encrypted: true })).toThrow(/Invalid tree id/);
  });
});
