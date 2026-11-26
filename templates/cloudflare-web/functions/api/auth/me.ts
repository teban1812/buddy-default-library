import type { PagesFunction } from '../../_lib/types.ts';
import { getSessionUser, jsonResponse } from '../../_lib/session.ts';

export const onRequestGet: PagesFunction = async (context) => {
  const user = await getSessionUser(context.env.DB, context.request);
  if (!user) return jsonResponse({ error: 'There is no active session.' }, 401);
  return jsonResponse({ user }, 200);
};
