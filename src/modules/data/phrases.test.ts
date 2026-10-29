import { describe, expect, it } from 'vitest';
import { createDataService, createMemoryBackend, isDataError } from './index';
import { fakeCipher, readAll } from './testkit';

const setup = (locked = false) => {
  const backend = createMemoryBackend();
  const cipher = fakeCipher();
  const data = createDataService({
    backend,
    cipher: () => (locked ? null : cipher),
    ranking: { alpha: 0.5, floor: 0.01 },
  });
  return { backend, cipher, phrases: data.phrases };
};

describe('phrases', () => {
  it('ranks by smoothed usage, recent uses weigh more', async () => {
    const { phrases } = setup();
    const use = (value: string) => phrases.confirm([{ field: 'person.lastName', value }]);
    await use('Тестов');
    await use('Тестов');
    await use('Пробный');
    const top = await phrases.suggest('person.lastName', '');
    // Тестов: 0.5 → 0.75 → 0.375; Пробный: 0.5
    expect(top.map((s) => s.value)).toEqual(['Пробный', 'Тестов']);
    expect(top[0]?.share).toBeCloseTo(0.5 / 0.875);
    expect(top.reduce((s, x) => s + x.share, 0)).toBeCloseTo(1);
  });

  it('never drops weights below the floor', async () => {
    const { phrases } = setup();
    await phrases.confirm([{ field: 'f', value: 'Старое' }]);
    for (let i = 0; i < 30; i++) await phrases.confirm([{ field: 'f', value: 'Новое' }]);
    const old = (await phrases.suggest('f', 'стар'))[0];
    expect(old?.value).toBe('Старое');
    expect(old?.share).toBeCloseTo(0.01 / 1.01);
  });

  it('matches by normalized prefix, merges spellings, keeps fields apart', async () => {
    const { phrases } = setup();
    await phrases.confirm([
      { field: 'a', value: '  Тестович   Ёлкин ' },
      { field: 'a', value: 'тестович елкин' },
      { field: 'b', value: 'user@example.com' },
    ]);
    const a = await phrases.suggest('a', 'ТЕСТ');
    expect(a).toEqual([{ value: 'тестович елкин', share: 1 }]);
    expect(await phrases.suggest('b', 'тест')).toEqual([]);
  });

  it('counts concurrent confirmations without losing updates', async () => {
    const { phrases } = setup();
    await Promise.all(['x', 'y', 'z'].map((value) => phrases.confirm([{ field: 'f', value }])));
    expect(await phrases.suggest('f', '')).toHaveLength(3);
  });

  it('forgets values', async () => {
    const { phrases } = setup();
    await phrases.confirm([{ field: 'f', value: 'Ошибка' }]);
    await phrases.forget('f', 'ошибка');
    expect(await phrases.suggest('f', '')).toEqual([]);
    await expect(phrases.forget('f', 'нет')).rejects.toSatisfy((e) => isDataError(e, 'not_found'));
  });

  it('stores nothing in plaintext and refuses to work while locked', async () => {
    const { backend, phrases } = setup();
    await phrases.confirm([{ field: 'person.lastName', value: 'Тестов' }]);
    expect(await readAll(backend)).not.toContain('Тестов');

    const locked = setup(true);
    await expect(locked.phrases.confirm([{ field: 'f', value: 'v' }])).rejects.toSatisfy((e) =>
      isDataError(e, 'no_cipher'),
    );
  });

  it('rejects unsafe field ids and empty values before writing anything', async () => {
    const { backend, phrases } = setup();
    const bad = phrases.confirm([
      { field: 'ok', value: 'v' },
      { field: '../x', value: 'v' },
    ]);
    await expect(bad).rejects.toSatisfy((e) => isDataError(e, 'invalid_id'));
    await expect(phrases.confirm([{ field: 'ok', value: '   ' }])).rejects.toSatisfy((e) =>
      isDataError(e, 'invalid_value'),
    );
    expect(await backend.list('')).toEqual([]);
  });
});
