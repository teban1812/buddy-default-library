// @vitest-environment node
import { afterEach, describe, expect, it } from 'vitest';
import { createTestDb, migrationFiles, type SqliteD1Database } from './helpers/d1-sqlite.ts';

describe('the D1 schema and the seed', () => {
  let db: SqliteD1Database | null = null;
  afterEach(() => {
    db?.close();
    db = null;
  });

  it('numbers the migrations so they apply in order', () => {
    const files = migrationFiles();
    expect(files[0]).toBe('0001_init.sql');
    for (const name of files) expect(name).toMatch(/^\d{4}_[a-z0-9_]+\.sql$/);
  });

  it('creates the tables the sign-in and its limit need', async () => {
    db = createTestDb();
    const { results } = await db
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name")
      .all<{ name: string }>();
    expect(results.map((r) => r.name)).toEqual(expect.arrayContaining(['sessions', 'sign_in_attempts', 'users']));
    const columns = await db.prepare('PRAGMA table_info(sign_in_attempts)').all<{ name: string; pk: number }>();
    const key = columns.results.filter((c) => c.pk > 0).map((c) => c.name);
    expect(key).toEqual(['address', 'email']);
  });

  it('seeds one account per role, with hashed passwords and no broken reference', async () => {
    db = createTestDb({ seed: true });
    const roles = await db
      .prepare('SELECT role, COUNT(*) AS total FROM users GROUP BY role ORDER BY role')
      .all<{ role: string; total: number }>();
    expect(roles.results).toEqual([
      { role: 'admin', total: 1 },
      { role: 'readonly', total: 1 },
    ]);
    const plain = await db
      .prepare("SELECT COUNT(*) AS total FROM users WHERE password_hash NOT LIKE 'pbkdf2_sha256$%'")
      .first<{ total: number }>();
    expect(plain?.total).toBe(0);
    expect((await db.prepare('PRAGMA foreign_key_check').all()).results).toEqual([]);
  });
});
