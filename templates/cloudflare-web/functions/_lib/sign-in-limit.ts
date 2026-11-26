// The limit on failed sign-ins (R307, R309, R310), counted in D1's sign_in_attempts table:
// - per email and network address: 5 failures within 15 minutes make that email wait 15 minutes from that
//   address, whatever password comes next, so a real user signing in from elsewhere is not locked out;
// - per address, whatever the email: 20 failures within 15 minutes make that whole address wait 15 minutes, so
//   one source cannot try many emails.
// Any typed email is counted, known or not, so the wait never tells which accounts exist.
import type { D1Database } from './types.ts';

export const MAX_FAILURES = 5;
export const MAX_FAILURES_PER_ADDRESS = 20;
export const WINDOW_MS = 15 * 60 * 1000;
export const WAIT_MS = 15 * 60 * 1000;

// The row that counts the address as a whole has no email.
const ANY_EMAIL = '';
// Cloudflare sets CF-Connecting-IP on every request it serves; a local test has none, and counts under this one.
const UNKNOWN_ADDRESS = 'unknown';

interface AttemptRow {
  failures: number;
  first_failed_at: string;
  locked_until: string | null;
}

export function networkAddress(request: Request): string {
  return request.headers.get('CF-Connecting-IP')?.trim() || UNKNOWN_ADDRESS;
}

async function read(db: D1Database, address: string, email: string): Promise<AttemptRow | null> {
  return db
    .prepare('SELECT failures, first_failed_at, locked_until FROM sign_in_attempts WHERE address = ? AND email = ?')
    .bind(address, email)
    .first<AttemptRow>();
}

function locked(row: AttemptRow | null, now: number): boolean {
  return Boolean(row?.locked_until && new Date(row.locked_until).getTime() > now);
}

export async function isWaiting(db: D1Database, address: string, email: string): Promise<boolean> {
  const now = Date.now();
  return locked(await read(db, address, email), now) || locked(await read(db, address, ANY_EMAIL), now);
}

async function count(db: D1Database, address: string, email: string, limit: number, now: number): Promise<void> {
  const row = await read(db, address, email);
  const inWindow = row !== null && new Date(row.first_failed_at).getTime() > now - WINDOW_MS;
  const failures = inWindow ? row.failures + 1 : 1;
  const firstFailedAt = inWindow ? row.first_failed_at : new Date(now).toISOString();
  const lockedUntil = failures >= limit ? new Date(now + WAIT_MS).toISOString() : null;
  await db
    .prepare(
      `INSERT INTO sign_in_attempts (address, email, failures, first_failed_at, locked_until) VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(address, email) DO UPDATE SET failures = excluded.failures,
         first_failed_at = excluded.first_failed_at, locked_until = excluded.locked_until`,
    )
    .bind(address, email, failures, firstFailedAt, lockedUntil)
    .run();
}

export async function recordFailure(db: D1Database, address: string, email: string): Promise<void> {
  const now = Date.now();
  await count(db, address, email, MAX_FAILURES, now);
  await count(db, address, ANY_EMAIL, MAX_FAILURES_PER_ADDRESS, now);
  // Forget the counts that no longer matter, so emails and addresses seen once do not pile up.
  const stale = new Date(now - Math.max(WINDOW_MS, WAIT_MS)).toISOString();
  await db
    .prepare('DELETE FROM sign_in_attempts WHERE first_failed_at < ? AND (locked_until IS NULL OR locked_until < ?)')
    .bind(stale, new Date(now).toISOString())
    .run();
}

// A successful sign-in clears its email's count at that address; the address's own count stays, so signing in
// with one known account does not reset a guess at many others.
export async function clearFailures(db: D1Database, address: string, email: string): Promise<void> {
  await db.prepare('DELETE FROM sign_in_attempts WHERE address = ? AND email = ?').bind(address, email).run();
}
