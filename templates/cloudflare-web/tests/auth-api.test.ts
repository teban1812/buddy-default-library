// @vitest-environment node
// The pattern every endpoint follows: the Function is called directly with a request and a D1 over node:sqlite.
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { onRequest as apiMiddleware } from '../functions/api/_middleware.ts';
import { onRequestPost as loginPost } from '../functions/api/auth/login.ts';
import { onRequestPost as logoutPost } from '../functions/api/auth/logout.ts';
import { onRequestGet as meGet } from '../functions/api/auth/me.ts';
import type { AuthUser, PagesContext } from '../functions/_lib/types.ts';
import { createTestDb, type SqliteD1Database } from './helpers/d1-sqlite.ts';

// The seed's sample accounts (seeds/seed.sql, docs/base-application.md).
const ADMIN = { email: 'admin@example.com', password: 'local-admin-2026' };
const READER = { email: 'reader@example.com', password: 'local-reader-2026' };

function context(db: SqliteD1Database, request: Request): PagesContext<{ user?: AuthUser }> {
  return {
    request,
    env: { DB: db },
    params: {},
    data: {},
    next: async () => new Response(JSON.stringify({ ok: true }), { status: 200 }),
  };
}

function loginRequest(body: unknown, origin = 'http://localhost'): Request {
  return new Request(`${origin}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function cookiePair(setCookie: string | null): string {
  return (setCookie ?? '').split(';')[0] ?? '';
}

describe('sign-in and the session', () => {
  let db: SqliteD1Database;
  beforeEach(() => {
    db = createTestDb({ seed: true });
  });
  afterEach(() => db.close());

  it('refuses an empty sign-in with 400', async () => {
    const res = await loginPost(context(db, loginRequest({ email: '', password: '' })));
    expect(res.status).toBe(400);
  });

  it('refuses a body that is not JSON with 400', async () => {
    const req = new Request('http://localhost/api/auth/login', { method: 'POST', body: 'not json' });
    expect((await loginPost(context(db, req))).status).toBe(400);
  });

  it('refuses a wrong password and an unknown email with the same 401', async () => {
    const wrong = await loginPost(context(db, loginRequest({ email: ADMIN.email, password: 'not-the-password' })));
    const unknown = await loginPost(context(db, loginRequest({ email: 'nobody@example.com', password: 'x' })));
    expect(wrong.status).toBe(401);
    expect(unknown.status).toBe(401);
    expect(await wrong.json()).toEqual(await unknown.json());
  });

  it('signs in with an HttpOnly cookie, knows the user, and forgets the session on sign-out', async () => {
    const login = await loginPost(context(db, loginRequest(ADMIN, 'https://app.example.com')));
    expect(login.status).toBe(200);
    const setCookie = login.headers.get('Set-Cookie');
    expect(setCookie).toContain('buddy-app-session=');
    expect(setCookie).toContain('HttpOnly');
    expect(setCookie).toContain('SameSite=Lax');
    expect(setCookie).toContain('Secure');
    expect(((await login.json()) as { user: AuthUser }).user.role).toBe('admin');

    const cookie = cookiePair(setCookie);
    const meRequest = new Request('https://app.example.com/api/auth/me', { headers: { Cookie: cookie } });
    const me = await meGet(context(db, meRequest));
    expect(me.status).toBe(200);
    expect(((await me.json()) as { user: AuthUser }).user.email).toBe(ADMIN.email);

    const logout = await logoutPost(
      context(db, new Request('https://app.example.com/api/auth/logout', { method: 'POST', headers: { Cookie: cookie } })),
    );
    expect(logout.headers.get('Set-Cookie')).toContain('Max-Age=0');
    expect((await meGet(context(db, meRequest))).status).toBe(401);
  });

  it('keeps only the hash of the session token in D1', async () => {
    const login = await loginPost(context(db, loginRequest(ADMIN)));
    const token = cookiePair(login.headers.get('Set-Cookie')).split('=')[1];
    const row = await db.prepare('SELECT token_hash FROM sessions').first<{ token_hash: string }>();
    expect(row?.token_hash).toMatch(/^[0-9a-f]{64}$/);
    expect(row?.token_hash).not.toBe(token);
  });

  it('does not accept an expired session', async () => {
    const login = await loginPost(context(db, loginRequest(ADMIN)));
    await db.prepare("UPDATE sessions SET expires_at = '2000-01-01T00:00:00.000Z'").run();
    const meRequest = new Request('http://localhost/api/auth/me', {
      headers: { Cookie: cookiePair(login.headers.get('Set-Cookie')) },
    });
    expect((await meGet(context(db, meRequest))).status).toBe(401);
  });
});

describe('the /api middleware', () => {
  let db: SqliteD1Database;
  beforeEach(() => {
    db = createTestDb({ seed: true });
  });
  afterEach(() => db.close());

  it('answers 401 to a request without a session', async () => {
    const res = await apiMiddleware(context(db, new Request('http://localhost/api/anything')));
    expect(res.status).toBe(401);
  });

  it('lets an administrator change data', async () => {
    const cookie = cookiePair((await loginPost(context(db, loginRequest(ADMIN)))).headers.get('Set-Cookie'));
    const req = new Request('http://localhost/api/anything', { method: 'POST', headers: { Cookie: cookie } });
    expect((await apiMiddleware(context(db, req))).status).toBe(200);
  });

  it('lets a read-only account read and answers 403 to each change it tries', async () => {
    const cookie = cookiePair((await loginPost(context(db, loginRequest(READER)))).headers.get('Set-Cookie'));
    const read = new Request('http://localhost/api/anything', { headers: { Cookie: cookie } });
    expect((await apiMiddleware(context(db, read))).status).toBe(200);
    for (const method of ['POST', 'PUT', 'PATCH', 'DELETE']) {
      const req = new Request('http://localhost/api/anything', { method, headers: { Cookie: cookie } });
      expect((await apiMiddleware(context(db, req))).status).toBe(403);
    }
  });
});
