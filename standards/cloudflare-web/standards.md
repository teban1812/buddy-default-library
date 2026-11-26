---
lifecycle: birth
set: cloudflare-web
---
# Standards: web on Cloudflare

The standards of the Cloudflare web profile (Pages, Pages Functions and D1), on top of the general ones. They are **born with the project**: copied once when the project is created, and from then on they belong to the project, whose Standards Owner may change them. A later version of the library does not touch them.

The zones, checks and the treatment of existing code are those described in the general standards.

Harvested from what a trial project built on Cloudflare followed; not yet confirmed by a Standards Owner.

## Prerequisites

To develop and test: Node.js 24 or later (its `node:sqlite` runs the tests against D1 in memory) and npm. Wrangler, Cloudflare's command line, comes with the project as a development dependency, pinned by its lock file. No Cloudflare account is needed until the project decides to publish.

| Id | Zone | Rule | Checked by | Prevents |
| :-- | :-- | :-- | :-- | :-- |
| STK-1 | must | The page is React 19 with TypeScript in strict mode, built with Vite and styled with Tailwind CSS v4 from the project's theme (`src/theme.css`). | program: `package.json` and `tsconfig.json` | type errors that reach the user, and a look that no longer follows the theme |
| STK-2 | must | The application runs on Cloudflare Pages: the API is Pages Functions under `functions/api/`, the data is in D1 bound as `DB`, and nothing needs a server of its own. | program: `wrangler.toml`; reviewer | a second platform to pay for, run and secure |
| STK-3 | must | Development and the pipeline use Node.js 24 or later, and Wrangler is the project's development dependency, never a global install. | program: the pipeline's Node version and `package.json` | builds that differ between machines |
| DB-1 | must | The schema changes only through a new numbered migration (`migrations/0002_<what>.sql`, …); a migration already applied is never edited. | program: the schema test checks the names and applies them in order; reviewer | a database that differs between machines and cannot be rebuilt |
| DB-2 | must | SQL uses `?` placeholders and `.bind(...)`, never a query built from text. | program: the project's Semgrep rule `no-sql-from-strings-d1`, once per change and in CI | user input changing a query (SQL injection) |
| DB-3 | must | The seed holds invented sample data only and is loaded only into the local database. | reviewer | a real person's data in the repository, or sample accounts in production |
| TST-1 | must | The tests use Vitest; every endpoint is tested by calling its Function with a `Request` and D1 in memory (`tests/helpers/d1-sqlite.ts`). | program: `package.json`; reviewer | an endpoint that breaks without anyone noticing |
| TST-2 | prefer | Page tests wait for what the screen does after it is drawn: what an effect, a fetch or a timer changes is found with `findBy*` or `waitFor`, never with a synchronous assertion right after `render`; the test setup sets a generous `asyncUtilTimeout` (5 s in the template). | reviewer | tests that fail at random on a slower machine and are no longer trusted |
| SEC-3 | must | Every endpoint lives under `functions/api/`, behind its middleware: without a session it answers 401, and a read-only account that tries to change data gets 403. Only the sign-in endpoints are public. | program: the middleware's tests; reviewer | data reachable by anyone who knows the address |
| SEC-4 | must | The browser never stores a session or a token in `localStorage` or `sessionStorage`; the session travels in an `HttpOnly`, `SameSite` cookie, `Secure` on HTTPS, and D1 keeps only its hash. | program: the sign-in's tests; reviewer | a script injected into the page stealing the user's session |
| SEC-5 | must | Passwords are kept as PBKDF2-SHA256 hashes with a random salt and at least 100,000 iterations, through the Web Crypto API the runtime provides; a wrong password and an unknown account get the same answer. | program: the sign-in's tests; reviewer | stolen passwords from a copy of the database, and accounts guessed from the answers |
| SEC-6 | must | Secrets never go in `wrangler.toml`: locally they live in `.dev.vars` (ignored by git), and in Cloudflare in its secrets. | program: gitleaks; reviewer | credentials leaked through git |
| OPS-1 | must | Deployment is the project's own decision: the template binds a local database only, and publishing (account, real database, replacing the sample accounts) is planned as a change of its own. | reviewer | an application published by accident, with sample accounts |
| UX-1 | must | Pages are accessible: the general design rules DSN-1 to DSN-5 (`design.md`) apply, and axe checks each screen in light and dark mode in the tests. | program: the axe tests; see DSN-1 to DSN-5 | users who cannot use the application |
