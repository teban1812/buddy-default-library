# The base application

What the project was born with, from the default library's profile cloudflare-web. The project's own README says what it is for.

A web application for Cloudflare Pages: a React 19 + Vite + TypeScript page (`src/`) styled with Tailwind CSS v4 and the project's theme, an API of Pages Functions (`functions/`), a Cloudflare D1 database (SQLite) with its migrations (`migrations/`) and an invented seed (`seeds/`), and Vitest tests (`tests/`).

## What it guarantees

- **Sign-in.** `POST /api/auth/login` checks an email and a password, `GET /api/auth/me` says who is signed in, `POST /api/auth/logout` ends the session. Passwords are kept as PBKDF2-SHA256 hashes (100,000 iterations, a 16-byte salt); a session is a random token in an `HttpOnly`, `SameSite=Lax` cookie (`Secure` on HTTPS) that lasts 12 hours, and D1 keeps only its SHA-256. The browser never stores the session.
- **A limit on failed sign-ins.** After 5 failures for the same email within 15 minutes, the sign-in answers 429 "Too many failed sign-ins for this email. Wait 15 minutes and try again." for 15 minutes, even to the right password; an email with no account is counted and answered the same way, so the wait does not tell which accounts exist. The count is in D1 (`sign_in_attempts`, `migrations/0002_sign_in_attempts.sql`, `functions/_lib/sign-in-limit.ts`), and a successful sign-in clears it.
- **Every endpoint under `/api` is protected.** `functions/api/_middleware.ts` answers 401 to a request without a session and 403 when a read-only account tries to change data (`POST`, `PUT`, `PATCH`, `DELETE`). A new endpoint is protected by being placed under `functions/api/`.
- **Two roles**, `admin` (can change data) and `readonly` (can only read), in the `users` table. Who the project's users are and what each may see is the project's decision.
- **The screens** never stay blank: while the session is checked, when the server cannot be reached (with a way to try again), the sign-in and the signed-in frame (`src/components/AppShell.tsx`), with a light/dark switch that remembers the choice and starts from the system preference.
- **Tests** for the sign-in and its limit, the middleware and the schema run against D1 in memory (Node's `node:sqlite`, `tests/helpers/d1-sqlite.ts`), without Wrangler or the network; the screens are tested with Testing Library, and axe checks them for accessibility in light and dark mode.

## Patterns it offers

- **An endpoint** is a file under `functions/api/` exporting `onRequestGet`, `onRequestPost` and so on; the signed-in user is in `context.data.user`. Its test calls the function directly with a `Request` and `createTestDb()`, as `tests/auth-api.test.ts` does.
- **SQL** always uses `?` placeholders and `.bind(...)`; the project's Semgrep rule refuses a query built from text.
- **A table** arrives in a new numbered migration (`migrations/0003_<what>.sql` and onwards); a migration already applied is never edited. The tests apply every migration in order.
- **The theme** lives in `src/theme.css` (born as `neutral`); `src/index.css` maps its variables to Tailwind. To change the theme, replace the content of `src/theme.css` with one from `docs/design/themes/`.

## Requirements

- Node.js 24 or later (with `node:sqlite`) and npm.
- Wrangler, Cloudflare's command line, comes with the project as a development dependency; no global install and no Cloudflare account are needed to develop and test.

## Setup and validation

```sh
npm run setup      # installs the dependencies from the lock file (npm ci)
npm run validate   # type-checks, builds the page and runs every test
npm run scan       # the project's Semgrep rules, locally
```

## Run in development

Create the local database and load the sample accounts (once, and again after a new migration):

```sh
npm run db:migrate:local
npm run db:seed:local
```

Then build the page and serve it with its Functions and the local D1 on http://localhost:8788:

```sh
npm run dev:pages
```

For live reload while editing the page, leave `dev:pages` running and start Vite in another terminal (`npm run dev`, http://localhost:5173); it sends `/api` to port 8788.

The seed's sample accounts, for the local database only:

| Role | Email | Password |
| :-- | :-- | :-- |
| admin | `admin@example.com` | `local-admin-2026` |
| readonly | `reader@example.com` | `local-reader-2026` |

## Not configured

Deployment. `wrangler.toml` binds a local database only (`database_id = "local-buddy-app-db"`). Publishing needs a Cloudflare account, a real D1 database whose id replaces that one, the seed's sample accounts replaced, and the project's own decision on where and how it is published.
