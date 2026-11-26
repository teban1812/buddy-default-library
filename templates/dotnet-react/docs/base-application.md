# The base application

What the project was born with, from the default library's profile dotnet-react. The project's own README says what it is for.

A .NET 10 minimal API (`src/BuddyApp.Api`) with xUnit tests (`tests/BuddyApp.Api.Tests`), which also test its architecture rules,
and a React + Vite + TypeScript web app (`web/`) tested with Vitest and Testing Library.

## Requirements

- .NET SDK 10
- Node.js 24 and npm

## Setup and validation

```sh
npm run setup      # installs the web dependencies (npm ci in web/) and the check before each commit
npm run validate   # runs the .NET tests (the architecture rules among them), the web tests and the personal-data scan's tests
npm run scan       # the personal-data scan, then the project's Semgrep rules, locally
```

## Personal data

No real person's data goes into the repository (SEC-8 in `docs/standards/`). `scripts/scan-personal-data.mjs` looks for emails
outside the reserved domains (`example.com` and the like), phone numbers, national identity numbers (Costa Rica's cédula) and
card numbers, and names each finding with its file and line. It runs in `npm run scan`, in the pipeline and before each commit
(`npm run setup` makes git run `.githooks/pre-commit`, which scans what is staged). When a file must keep data that looks
personal, approve the exception with its reason; it is recorded in `.personal-data-allow.json` with the file's hash, so a later
change to the file is refused again until it is approved again:

```sh
node scripts/scan-personal-data.mjs --allow tests/BuddyApp.Api.Tests/<file> --reason "<why it is allowed>"
git add .personal-data-allow.json tests/BuddyApp.Api.Tests/<file>
```

## Architecture rules

The architecture rules are tests (TST-3 in `docs/standards/`), run with the other .NET tests in `npm run validate`:

- `tests/BuddyApp.Api.Tests/EndpointSecurityTests.cs` starts the application and reads every endpoint it serves. An endpoint
  that answers without permission must be on the approved list at the top of that file (only `GET /api/health` today);
  any other fails the test, named with its method and route. It also checks that an unauthenticated call outside the list
  gets 401 and that every response carries the security headers.
- `tests/BuddyApp.Api.Tests/ArchitectureTests.cs` reads the compiled code with [ArchUnitNET](https://github.com/TNG/ArchUnitNET)
  (Apache 2.0, a test dependency only, pinned to 0.13.5): the API must not depend on the tests or on test libraries
  (xUnit, Bogus, the test host), and no migration may load data (`InsertData`, `UpdateData`, `DeleteData`, `Sql`). The
  template has no Entity Framework yet, so the migration rule has nothing to check until the project has migrations.

What the tests guard is in `src/BuddyApp.Api/Program.cs`: every endpoint asks for a signed-in user unless it says
`AllowAnonymous()` (a fallback authorization policy), the session is a cookie (`HttpOnly`, `Secure`, `SameSite`) and an
unauthenticated call gets 401 rather than a redirect, and a small middleware sets the security headers. There is no sign-in
yet: it arrives with the first feature that needs one (SEC-5). A new endpoint is protected by default; to open one, add
`AllowAnonymous()` and its line to the approved list in the same change.

## Test data

Test data is invented and the same on every run (QLT-4 in `docs/standards/`). In the .NET tests it comes from
`tests/BuddyApp.Api.Tests/SampleData.cs`, a builder on [Bogus](https://github.com/bchavez/Bogus) (MIT, a test
dependency only) with a fixed seed; emails are on `example.com`. A test that needs data asks the builder for it, and
a new kind of data gets its own method there with the same seed. `SampleDataTests.cs` fails if the seed stops giving
the same data.

`validate` builds the .NET projects into `.artifacts/validate/`, apart from their `bin/` and `obj/`, so it runs
while the API is up with `dotnet run`.

## Run in development

In one terminal, start the API on http://localhost:5080:

```sh
dotnet run --project src/BuddyApp.Api
```

In another, start the web app (Vite proxies `/api` to the API):

```sh
npm --prefix web run dev
```

Then open the URL Vite prints (http://localhost:5173 by default). The page shows the API status
from `GET /api/health`.
