import type { PagesFunction, UserRole } from '../../_lib/types.ts';
import { spendPasswordWork, verifyPassword } from '../../_lib/crypto.ts';
import { buildSessionCookie, createSession, jsonResponse } from '../../_lib/session.ts';
import { clearFailures, isWaiting, networkAddress, recordFailure } from '../../_lib/sign-in-limit.ts';

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
// After 5 failures for one email from one address, or 20 from one address whatever the email (R310); the same
// for every email typed, known or not.
const MUST_WAIT = 'Too many failed sign-ins. Wait 15 minutes and try again.';

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

  const address = networkAddress(context.request);
  if (await isWaiting(context.env.DB, address, email)) {
    return jsonResponse({ error: MUST_WAIT }, 429);
  }

  const user = await context.env.DB.prepare(
    'SELECT id, email, name, role, password_hash, active FROM users WHERE lower(email) = ?',
  )
    .bind(email)
    .first<UserRow>();
  // An email with no account, or a disabled one, still computes a password hash, so it answers in the same time.
  let passwordIsRight = false;
  if (user && user.active === 1) {
    passwordIsRight = await verifyPassword(typedPassword, user.password_hash);
  } else {
    await spendPasswordWork(typedPassword);
  }
  if (!user || !passwordIsRight) {
    await recordFailure(context.env.DB, address, email);
    return jsonResponse({ error: WRONG_CREDENTIALS }, 401);
  }

  await clearFailures(context.env.DB, address, email);

  const { token } = await createSession(context.env.DB, user.id);
  return jsonResponse(
    { user: { id: user.id, email: user.email, name: user.name, role: user.role } },
    200,
    { 'Set-Cookie': buildSessionCookie(token, context.request) },
  );
};
