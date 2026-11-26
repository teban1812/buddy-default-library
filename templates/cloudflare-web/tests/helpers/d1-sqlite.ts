// D1 is SQLite: this helper gives the Functions a D1Database over Node's own node:sqlite, in memory, with the
// project's migrations applied in order, so every endpoint is tested without Wrangler or the network.
import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { DatabaseSync, type SQLInputValue } from 'node:sqlite';
import type { D1Database, D1PreparedStatement, D1Result } from '../../functions/_lib/types.ts';

class SqlitePreparedStatement implements D1PreparedStatement {
  constructor(
    private readonly db: DatabaseSync,
    private readonly query: string,
    private readonly params: SQLInputValue[] = [],
  ) {}

  bind(...values: unknown[]): D1PreparedStatement {
    return new SqlitePreparedStatement(
      this.db,
      this.query,
      values.map((v) => (v === undefined ? null : (v as SQLInputValue))),
    );
  }

  async first<T = Record<string, unknown>>(colName?: string): Promise<T | null> {
    const row = this.db.prepare(this.query).get(...this.params) as Record<string, unknown> | undefined;
    if (!row) return null;
    return colName ? ((row[colName] as T) ?? null) : ({ ...row } as T);
  }

  async all<T = Record<string, unknown>>(): Promise<D1Result<T>> {
    const rows = this.db.prepare(this.query).all(...this.params) as Record<string, unknown>[];
    return { results: rows.map((r) => ({ ...r }) as T), success: true, meta: {} };
  }

  async run(): Promise<D1Result> {
    const info = this.db.prepare(this.query).run(...this.params);
    return {
      results: [],
      success: true,
      meta: { changes: Number(info.changes), last_row_id: Number(info.lastInsertRowid) },
    };
  }
}

export class SqliteD1Database implements D1Database {
  readonly raw = new DatabaseSync(':memory:');

  constructor() {
    this.raw.exec('PRAGMA foreign_keys = ON;');
  }

  prepare(query: string): D1PreparedStatement {
    return new SqlitePreparedStatement(this.raw, query);
  }

  async exec(query: string): Promise<{ count: number; duration: number }> {
    const start = Date.now();
    this.raw.exec(query);
    return { count: 1, duration: Date.now() - start };
  }

  async batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]> {
    const results: D1Result<T>[] = [];
    for (const stmt of statements) results.push((await stmt.run()) as D1Result<T>);
    return results;
  }

  close(): void {
    this.raw.close();
  }
}

export function migrationFiles(): string[] {
  return readdirSync(resolve(process.cwd(), 'migrations'))
    .filter((name) => name.endsWith('.sql'))
    .sort();
}

export function createTestDb(options: { seed?: boolean } = {}): SqliteD1Database {
  const db = new SqliteD1Database();
  for (const name of migrationFiles()) {
    db.raw.exec(readFileSync(resolve(process.cwd(), 'migrations', name), 'utf8'));
  }
  if (options.seed) db.raw.exec(readFileSync(resolve(process.cwd(), 'seeds/seed.sql'), 'utf8'));
  return db;
}
