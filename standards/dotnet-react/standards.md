---
lifecycle: birth
set: dotnet-react
---
# Standards: .NET + React

The standards of the .NET + React profile, on top of the general ones. They are **born with the project**: copied once when the project is created, and from then on they belong to the project, whose Standards Owner may change them. A later version of the library does not touch them.

The zones, checks, how the Product Owner departs from a rule and the treatment of existing code are those described in the general standards.

Confirmed by the Standards Owner on 2026-11-01.

| Id | Zone | Rule | Checked by | Prevents |
| :-- | :-- | :-- | :-- | :-- |
| STK-1 | must | The backend is .NET 10 (the current long-term support release). | program: the projects' target framework | a mix of runtimes nobody supports |
| STK-2 | must | The frontend is React 19 with TypeScript in strict mode, built with Vite. | program: `package.json` and `tsconfig` | type errors that reach the user |
| STK-3 | prefer | The API is a minimal API organised by feature (one folder per business capability). | reviewer | code organised by technical layer that no business person can map |
| TST-1 | must | The tests use xUnit for the backend and Vitest for the frontend. | program: the projects' references and `package.json` | two ways of testing the same thing |
| TST-2 | prefer | Web tests wait for what the screen does after it is drawn: what an effect, a fetch or a timer changes is found with `findBy*` or `waitFor`, never with a synchronous assertion right after `render`; the test setup sets a generous `asyncUtilTimeout` (5 s in the template); and the web tests run several times (three) before a change is presented. | reviewer | tests that fail at random on a slower machine and are no longer trusted |
| TST-3 | must | The architecture rules are tests in the test project, run with every `validate`: `EndpointSecurityTests` starts the application and fails when an endpoint answers without permission and is not on the approved list kept in that file (the health endpoint and, in Development, the stub sign-in of SEC-6 today), when an unauthenticated call outside that list does not get 401, or when a response lacks the security headers (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Content-Security-Policy`); `ArchitectureTests` (ArchUnitNET) fails when the API depends on the tests or on test libraries, or when a migration calls `InsertData`, `UpdateData`, `DeleteData` or `Sql` (it has nothing to check until the project has migrations). A new layer adds its rule there; a new anonymous endpoint is added to the approved list in the same change. | program: `npm run validate` | an endpoint left open, a security header lost, test code in the application, or data loaded by a migration, none of which a reader notices in review |
| SEC-3 | prefer | Security uses the framework's built-ins (ASP.NET Core authentication and data protection) instead of hand-made code. | reviewer | home-made security that is easy to get wrong |
| SEC-4 | must | The browser never stores tokens (JWT or any other) in `localStorage` or `sessionStorage`; the session travels in `HttpOnly`, `Secure`, `SameSite` cookies. | reviewer | a script injected into the page stealing the user's session |
| SEC-5 | prefer | When authentication arrives it follows the BFF pattern: the web talks only to its own API at the same origin (as `/api` already does) and the API holds the tokens. | reviewer | tokens that reach the browser and the cross-origin configuration they bring |
| SEC-6 | must | Until the project has a real identity provider, a stub sign-in for development signs a made-up user (invented data, QLT-4) into the same session cookie the real provider will use, and it is registered only when the environment is `Development`: a test environment keeps production's posture and never has it. `StubSignInTests` starts the application in `Production` and `Staging` and fails if the stub is there or a protected call without a real session gets anything but 401. A real provider replaces the stub (its file, the lines that map it and its line on the approved list) without changing the cookie, the fallback policy or the endpoints. | program: `npm run validate` | a made-up user who can sign in to a test environment or to production, and work stopped waiting for an identity provider |
| UX-1 | must | Pages are accessible: this rule is now the general design rules DSN-1 to DSN-5 (`design.md`), which every project follows; the id is kept so that decisions and records that cite it still resolve. | see DSN-1 to DSN-5 | users who cannot use the application |
