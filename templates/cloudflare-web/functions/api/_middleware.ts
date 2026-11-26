// Runs before every Function under /api: a request without a valid session gets 401, and a read-only
// account that tries to change data gets 403. A new endpoint is protected by being placed under /api.
import type { AuthUser, PagesFunction } from '../_lib/types.ts';
import { getSessionUser, jsonResponse } from '../_lib/session.ts';

const PUBLIC_PATHS = new Set(['/api/auth/login', '/api/auth/logout', '/api/auth/me']);
const MUTATION_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

export const onRequest: PagesFunction<{ user?: AuthUser }> = async (context) => {
  const { request, env } = context;
  if (PUBLIC_PATHS.has(new URL(request.url).pathname)) return context.next();

  const user = await getSessionUser(env.DB, request);
  if (!user) {
    return jsonResponse({ error: 'Sign in to see this information.' }, 401);
  }
  if (MUTATION_METHODS.has(request.method.toUpperCase()) && user.role !== 'admin') {
    return jsonResponse({ error: 'Your account can only read; it cannot change data.' }, 403);
  }

  context.data.user = user;
  return context.next();
};
