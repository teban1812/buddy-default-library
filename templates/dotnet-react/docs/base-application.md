# The base application

What the project was born with, from the default library's profile dotnet-react. The project's own README says what it is for.

A .NET 10 minimal API (`src/BuddyApp.Api`) with xUnit tests (`tests/BuddyApp.Api.Tests`)
and a React + Vite + TypeScript web app (`web/`) tested with Vitest and Testing Library.

## Requirements

- .NET SDK 10
- Node.js 24 and npm

## Setup and validation

```sh
npm run setup      # installs the web dependencies (npm ci in web/) and the check before each commit
npm run validate   # runs the .NET tests, the web tests and the personal-data scan's tests
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
