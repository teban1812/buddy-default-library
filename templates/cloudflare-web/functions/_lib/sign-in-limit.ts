// The limit on failed sign-ins (R307): 5 failures for the same email within 15 minutes make that email's
// sign-in wait 15 minutes, whatever password comes next. The count lives in D1's sign_in_attempts table and is
// kept for any typed email, known or not, so the wait never tells which accounts exist.
import type { D1Database } from './types.ts';

export const MAX_FAILURES = 5;
export const WINDOW_MS = 15 * 60 * 1000;
export const WAIT_MS = 15 * 60 * 1000;

interface AttemptRow {
  failures: number;
  first_failed_at: string;
  locked_until: string | null;
}

async function read(db: D1Database, email: string): Promise<AttemptRow | null> {
  return db
    .prepare('SELECT failures, first_failed_at, locked_until FROM sign_in_attempts WHERE email = ?')
    .bind(email)
    .first<AttemptRow>();
}

export async function isWaiting(db: D1Database, email: string): Promise<boolean> {
  const row = await read(db, email);
  return Boolean(row?.locked_until && new Date(row.locked_until).getTime() > Date.now());
}

export async function recordFailure(db: D1Database, email: string): Promise<void> {
  const now = Date.now();
  const row = await read(db, email);
  const inWindow = row !== null && new Date(row.first_failed_at).getTime() > now - WINDOW_MS;
  const failures = inWindow ? row.failures + 1 : 1;
  const firstFailedAt = inWindow ? row.first_failed_at : new Date(now).toISOString();
  const lockedUntil = failures >= MAX_FAILURES ? new Date(now + WAIT_MS).toISOString() : null;
  await db
    .prepare(
      `INSERT INTO sign_in_attempts (email, failures, first_failed_at, locked_until) VALUES (?, ?, ?, ?)
       ON CONFLICT(email) DO UPDATE SET failures = excluded.failures,
         first_failed_at = excluded.first_failed_at, locked_until = excluded.locked_until`,
    )
    .bind(email, failures, firstFailedAt, lockedUntil)
    .run();
  // Forget the counts that no longer matter, so emails typed once do not pile up.
  const stale = new Date(now - Math.max(WINDOW_MS, WAIT_MS)).toISOString();
  await db
    .prepare('DELETE FROM sign_in_attempts WHERE first_failed_at < ? AND (locked_until IS NULL OR locked_until < ?)')
    .bind(stale, new Date(now).toISOString())
    .run();
}

export async function clearFailures(db: D1Database, email: string): Promise<void> {
  await db.prepare('DELETE FROM sign_in_attempts WHERE email = ?').bind(email).run();
}
