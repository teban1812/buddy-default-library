# Standards: .NET + React (default profile)

The basic standards of a .NET + React application built with Buddy when there is no enterprise library. Few on purpose: each rule says how much freedom it leaves (`must` is fixed and a deviation needs the Standards Owner's decision; `prefer` is the default and a deviation is recorded as a decision; `free` is the builder's choice), how it is checked (a program first, then the independent reviewer, `declared` last) and the problem it prevents. A rule that cannot say these does not belong here.

Confirmed by the Standards Owner on 2026-11-01.

| Id | Zone | Rule | Checked by | Prevents |
| :-- | :-- | :-- | :-- | :-- |
| STK-1 | must | The backend is .NET 10 (the current long-term support release). | program: the projects' target framework | a mix of runtimes nobody supports |
| STK-2 | must | The frontend is React 19 with TypeScript in strict mode, built with Vite. | program: `package.json` and `tsconfig` | type errors that reach the user |
| STK-3 | prefer | The API is a minimal API organised by feature (one folder per business capability). | reviewer | code organised by technical layer that no business person can map |
| QLT-1 | must | Every change of behaviour comes with tests: xUnit for the backend, Vitest for the frontend. | program: the checkpoint's scan; reviewer | behaviour nobody can prove still works |
| QLT-2 | must | `npm run validate` passes before a slice is delivered. | program: the checkpoint | handing over work that does not build or pass its tests |
| QLT-3 | must | A test is never removed, skipped or weakened to make the build pass. | program: the checkpoint's scan; reviewer | a green build that hides a failure |
| DEP-1 | must | A new dependency (NuGet or npm) is asked of the Product Owner first, with what it costs and what it brings. | program: the scan flags package files | supply-chain and licence risk, and weight nobody chose |
| SEC-1 | must | No secret in the repository: configuration comes from the environment or the user secrets store. | program: a secret scanner when installed; reviewer | credentials leaked through git |
| SEC-2 | must | Input from users is validated at the API boundary. | reviewer | invalid or malicious data reaching the business logic |
| SEC-3 | prefer | Security uses the framework's built-ins (ASP.NET Core authentication and data protection) instead of hand-made code. | reviewer | home-made security that is easy to get wrong |
| UX-1 | must | Pages are accessible: semantic HTML, every input has a label, everything reachable by keyboard. | reviewer (an automated accessibility check can be added later) | users who cannot use the application |
| GIT-1 | must | Commits follow Conventional Commits. | program: the commit check | a history nobody can read or release from |
| FREE-1 | free | Internal structure inside a feature, private names, and the order of the work within a slice. | — | asking about what does not matter |
