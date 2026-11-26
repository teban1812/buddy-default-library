import type { PagesFunction } from '../../_lib/types.ts';
import { buildClearSessionCookie, deleteSession, jsonResponse } from '../../_lib/session.ts';

export const onRequestPost: PagesFunction = async (context) => {
  await deleteSession(context.env.DB, context.request);
  return jsonResponse({ ok: true }, 200, { 'Set-Cookie': buildClearSessionCookie(context.request) });
};
