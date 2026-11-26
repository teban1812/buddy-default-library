// The session: a random token in an HttpOnly cookie, its SHA-256 in D1's sessions table.
import type { AuthUser, D1Database, UserRole } from './types.ts';
import { generateSessionToken, sha256Hex } from './crypto.ts';

export const SESSION_COOKIE_NAME = 'buddy-app-session';
export const SESSION_TTL_SECONDS = 60 * 60 * 12; // 12 hours

export function jsonResponse(body: unknown, status = 200, extraHeaders?: Record<string, string>): Response {
  const headers = new Headers({
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  for (const [key, value] of Object.entries(extraHeaders ?? {})) headers.set(key, value);
  return new Response(JSON.stringify(body), { status, headers });
}

export function parseCookie(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) return null;
  for (const raw of cookieHeader.split(';')) {
    const idx = raw.indexOf('=');
    if (idx === -1) continue;
    if (raw.slice(0, idx).trim() === name) return raw.slice(idx + 1).trim();
  }
  return null;
}

// Secure is added on HTTPS only, so the cookie also works on http://localhost during development.
function isHttps(request: Request): boolean {
  return new URL(request.url).protocol === 'https:';
}

function cookie(value: string, request: Request, maxAge: number): string {
  const attrs = [`${SESSION_COOKIE_NAME}=${value}`, 'HttpOnly', 'Path=/', 'SameSite=Lax', `Max-Age=${maxAge}`];
  if (isHttps(request)) attrs.push('Secure');
  return attrs.join('; ');
}

export function buildSessionCookie(token: string, request: Request): string {
  return cookie(token, request, SESSION_TTL_SECONDS);
}

export function buildClearSessionCookie(request: Request): string {
  return cookie('', request, 0);
}

export async function createSession(db: D1Database, userId: string): Promise<{ token: string; expiresAt: string }> {
  const token = generateSessionToken();
  const tokenHash = await sha256Hex(token);
  const expiresAt = new Date(Date.now() + SESSION_TTL_SECONDS * 1000).toISOString();
  await db
    .prepare('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)')
    .bind(tokenHash, userId, expiresAt)
    .run();
  return { token, expiresAt };
}

interface SessionUserRow {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  expires_at: string;
}

export async function getSessionUser(db: D1Database, request: Request): Promise<AuthUser | null> {
  const token = parseCookie(request.headers.get('Cookie'), SESSION_COOKIE_NAME);
  if (!token) return null;

  const tokenHash = await sha256Hex(token);
  const row = await db
    .prepare(
      `SELECT u.id, u.email, u.name, u.role, s.expires_at
       FROM sessions s
       INNER JOIN users u ON u.id = s.user_id
       WHERE s.token_hash = ? AND u.active = 1`,
    )
    .bind(tokenHash)
    .first<SessionUserRow>();
  if (!row) return null;

  if (new Date(row.expires_at).getTime() <= Date.now()) {
    await db.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(tokenHash).run();
    return null;
  }
  return { id: row.id, email: row.email, name: row.name, role: row.role };
}

export async function deleteSession(db: D1Database, request: Request): Promise<void> {
  const token = parseCookie(request.headers.get('Cookie'), SESSION_COOKIE_NAME);
  if (!token) return;
  await db.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(await sha256Hex(token)).run();
}
