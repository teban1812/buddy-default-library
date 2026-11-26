// @vitest-environment node
// QLT-4: test data is invented, and what is generated comes from a fixed seed, so every run gives the same data.
import { afterEach, describe, expect, it } from 'vitest';
import { createTestDb, type SqliteD1Database } from './helpers/d1-sqlite.ts';
import { SAMPLE_ACCOUNTS, SEED, samplePeople } from './helpers/test-data.ts';

describe('the test data', () => {
  let db: SqliteD1Database | null = null;
  afterEach(() => {
    db?.close();
    db = null;
  });

  it('gives the same people for the same seed on every run', () => {
    expect(samplePeople(5)).toEqual(samplePeople(5));
  });

  it('gives the people written here for the seed, on any machine', () => {
    // Written from the first run: a later run must give the same first people.
    expect(samplePeople(2)).toEqual(PINNED);
  });

  it('gives different people for a different seed', () => {
    expect(samplePeople(5, SEED + 1)).not.toEqual(samplePeople(5));
  });

  it('invents every person, with a distinct email on a reserved domain', () => {
    const people = samplePeople(50);
    for (const person of people) expect(person.email).toMatch(/@example\.com$/);
    expect(new Set(people.map((p) => p.email)).size).toBe(people.length);
  });

  it('seeds exactly the sample accounts the tests use, all invented', async () => {
    db = createTestDb({ seed: true });
    const { results } = await db
      .prepare('SELECT id, email, name, role FROM users ORDER BY id')
      .all<{ id: string; email: string; name: string; role: string }>();
    const expected = Object.values(SAMPLE_ACCOUNTS)
      .map(({ id, email, name, role }) => ({ id, email, name, role }))
      .sort((a, b) => a.id.localeCompare(b.id));
    expect(results).toEqual(expected);
    for (const user of results) expect(user.email).toMatch(/@example\.com$/);
  });
});

const PINNED = [
  { name: 'Sample Person 1', email: 'person1-e59dfd@example.com' },
  { name: 'Sample Person 2', email: 'person2-af8d12@example.com' },
];
