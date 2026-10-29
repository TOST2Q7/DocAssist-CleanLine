import { describe, expect, it } from 'vitest';
import {
  createDataService,
  createMemoryBackend,
  isDataError,
  isPersonId,
  newPersonId,
  type PersonId,
  type RecordDoc,
} from './index';
import { fakeCipher, readAll } from './testkit';

interface Profile {
  fullName: string;
  email: string;
}

const profileV2: RecordDoc<Profile> = {
  name: 'person.profile',
  schema: 2,
  parse(data, schema) {
    const d = data as Record<string, unknown>;
    // v1 stored `name`; v2 renamed it to `fullName`.
    const fullName = schema === 1 ? d['name'] : d['fullName'];
    if (typeof fullName !== 'string' || typeof d['email'] !== 'string')
      throw new TypeError('profile');
    return { fullName, email: d['email'] };
  },
};
const profileV1: RecordDoc<unknown> = { name: 'person.profile', schema: 1, parse: (d) => d };

const sample: Profile = { fullName: 'Тестов Тест Тестович', email: 'user@example.com' };

const setup = () => {
  const backend = createMemoryBackend();
  return { backend, records: createDataService({ backend, cipher: fakeCipher }).records };
};

describe('records', () => {
  it('reads, writes, updates and lists persons', async () => {
    const { records } = setup();
    const p = newPersonId();
    expect(isPersonId(p)).toBe(true);
    expect(await records.read(p, profileV2)).toBeNull();
    await records.write(p, profileV2, sample);
    const next = await records.update(p, profileV2, (cur) => ({
      ...(cur ?? sample),
      email: 'other@example.com',
    }));
    expect(await records.read(p, profileV2)).toEqual(next);
    expect(await records.persons()).toEqual([p]);
    await records.removePerson(p);
    expect(await records.persons()).toEqual([]);
  });

  it('never stores plaintext and binds ciphertext to its location', async () => {
    const { backend, records } = setup();
    const [a, b] = [newPersonId(), newPersonId()];
    await records.write(a, profileV2, sample);
    expect(await readAll(backend)).not.toContain('example.com');

    const keyA = (await backend.list('records/'))[0] as string;
    await backend.write(keyA.replace(a, b), (await backend.read(keyA))!);
    await expect(records.read(b, profileV2)).rejects.toSatisfy((e) =>
      isDataError(e, 'decrypt_failed'),
    );
  });

  it('migrates old schemas and refuses newer ones', async () => {
    const { records } = setup();
    const p = newPersonId();
    await records.write(p, profileV1, { name: 'Тестов Т. Т.', email: 'user@example.com' });
    expect((await records.read(p, profileV2))?.fullName).toBe('Тестов Т. Т.');
    await records.write(p, profileV2, sample);
    await expect(records.read(p, profileV1)).rejects.toSatisfy((e) =>
      isDataError(e, 'unsupported_schema'),
    );
  });

  it('rejects ids that are not safe key segments', async () => {
    const { records } = setup();
    await expect(records.read('../x' as PersonId, profileV2)).rejects.toSatisfy((e) =>
      isDataError(e, 'invalid_id'),
    );
  });
});
