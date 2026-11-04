---
lifecycle: birth
set: dotnet-react
---
# Standards: .NET + React

The standards of the .NET + React profile, on top of the general ones. They are **born with the project**: copied once when the project is created, and from then on they belong to the project, whose Standards Owner may change them. A later version of the library does not touch them.

The zones, checks and the treatment of existing code are those described in the general standards.

Confirmed by the Standards Owner on 2026-11-01.

| Id | Zone | Rule | Checked by | Prevents |
| :-- | :-- | :-- | :-- | :-- |
| STK-1 | must | The backend is .NET 10 (the current long-term support release). | program: the projects' target framework | a mix of runtimes nobody supports |
| STK-2 | must | The frontend is React 19 with TypeScript in strict mode, built with Vite. | program: `package.json` and `tsconfig` | type errors that reach the user |
| STK-3 | prefer | The API is a minimal API organised by feature (one folder per business capability). | reviewer | code organised by technical layer that no business person can map |
| TST-1 | must | The tests use xUnit for the backend and Vitest for the frontend. | program: the projects' references and `package.json` | two ways of testing the same thing |
| TST-2 | prefer | Web tests wait for what the screen does after it is drawn: what an effect, a fetch or a timer changes is found with `findBy*` or `waitFor`, never with a synchronous assertion right after `render`; the test setup sets a generous `asyncUtilTimeout` (5 s in the template); and the web tests run several times (three) before a change is presented. | reviewer | tests that fail at random on a slower machine and are no longer trusted |
| SEC-3 | prefer | Security uses the framework's built-ins (ASP.NET Core authentication and data protection) instead of hand-made code. | reviewer | home-made security that is easy to get wrong |
| UX-1 | must | Pages are accessible: semantic HTML, every input has a label, everything reachable by keyboard. | reviewer (an automated accessibility check can be added later) | users who cannot use the application |
