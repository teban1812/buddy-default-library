// The few Cloudflare types the Functions use, written here so the project needs no extra types package.
// They follow Cloudflare's D1 and Pages Functions APIs; tests/helpers/d1-sqlite.ts implements D1Database over
// node:sqlite so every Function is tested without Wrangler.
export interface D1Result<T = Record<string, unknown>> {
  results: T[];
  success: boolean;
  meta: {
    changes?: number;
    last_row_id?: number;
  };
}

export interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = Record<string, unknown>>(colName?: string): Promise<T | null>;
  all<T = Record<string, unknown>>(): Promise<D1Result<T>>;
  run(): Promise<D1Result>;
}

export interface D1Database {
  prepare(query: string): D1PreparedStatement;
  exec(query: string): Promise<{ count: number; duration: number }>;
  batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>;
}

export type UserRole = 'admin' | 'readonly';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export interface Env {
  DB: D1Database;
}

export interface PagesContext<Data = Record<string, unknown>> {
  request: Request;
  env: Env;
  params: Record<string, string | string[]>;
  data: Data;
  next: (input?: Request | string, init?: RequestInit) => Promise<Response>;
}

export type PagesFunction<Data = Record<string, unknown>> = (
  context: PagesContext<Data>,
) => Response | Promise<Response>;
