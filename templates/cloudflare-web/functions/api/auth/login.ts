import type { PagesFunction, UserRole } from '../../_lib/types.ts';
import { verifyPassword } from '../../_lib/crypto.ts';
import { buildSessionCookie, createSession, jsonResponse } from '../../_lib/session.ts';

interface LoginBody {
  email?: unknown;
  password?: unknown;
}

interface UserRow {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  password_hash: string;
  active: number;
}

// The same answer for an unknown email and a wrong password, so the sign-in does not tell which accounts exist.
const WRONG_CREDENTIALS = 'The email or the password is not correct.';

export const onRequestPost: PagesFunction = async (context) => {
  let body: LoginBody;
  try {
    body = (await context.request.json()) as LoginBody;
  } catch {
    return jsonResponse({ error: 'The request body must be valid JSON.' }, 400);
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const typedPassword = typeof body.password === 'string' ? body.password : '';
  if (!email || !typedPassword) {
    return jsonResponse({ error: 'Enter your email and your password.' }, 400);
  }

  const user = await context.env.DB.prepare(
    'SELECT id, email, name, role, password_hash, active FROM users WHERE lower(email) = ?',
  )
    .bind(email)
    .first<UserRow>();
  if (!user || user.active !== 1 || !(await verifyPassword(typedPassword, user.password_hash))) {
    return jsonResponse({ error: WRONG_CREDENTIALS }, 401);
  }

  const { token } = await createSession(context.env.DB, user.id);
  return jsonResponse(
    { user: { id: user.id, email: user.email, name: user.name, role: user.role } },
    200,
    { 'Set-Cookie': buildSessionCookie(token, context.request) },
  );
};
