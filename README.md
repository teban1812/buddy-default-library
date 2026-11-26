# Buddy's default library

The standards and base applications a project starts from when it is created with Buddy and the organisation has no library of its own. An enterprise library has the same layout, in its own repository.

## Layout

```text
library.json      the library's name, contract, default profile and profiles
standards/
  general/        the rules every project follows, whatever its stack (evergreen): standards.md and design.md, the Definition of Ready and of Done (definition-of-ready.md, definition-of-done.md), and the quality goals proposed to every project (quality-goals.md)
  <profile>/      the rules of one stack (born with the project), its own rows of the Definition of Done (definition-of-done.md, evergreen), the quality goals proposed for it (quality-goals.md, evergreen) and what a machine needs to build it (prerequisites.md, born with the project)
templates/
  <profile>/      the application a new project starts from
themes/           the colour themes the owner chooses from (contract 2; see Themes below)
questions/        asked before a project is born (contract 2; none here yet)
steps/            checklists drafted once per project (contract 2; none here yet)
normative/        the index of the documents the standards cite (contract 2; none here yet)
prompts/          the organisation's saved prompts (contract 2; none here yet)
```

`buddy init` copies `standards/general/` and the chosen profile's standards into the project's `docs/standards/`, and the profile's template into the project's root, renamed for the project (`BuddyApp` and `buddy-app` are the placeholders). In a folder that already holds a project it copies the standards only. Its build and tests are run once, so the project is known to be born healthy.

Each template carries a pipeline for each host it supports, at its root: `.github/workflows/validate.yml` (GitHub Actions) and `azure-pipelines.yml` (Azure Pipelines). `buddy init` asks where the repository will live and keeps only that one, so the project's checks run on every push, including the commits made by hand.

Each template also carries the project's own scanning rules: `.gitleaks.toml` (secrets: gitleaks' rules plus a password written in a connection string) and, when the profile has code, `.semgrep/` (rules that check the standards a program can check, such as an empty catch or SQL built from text). `npm run scan` runs the Semgrep rules locally, without the network; the pipeline runs them together with Semgrep's public rule sets for the stack and gitleaks over the whole history. Gitleaks is fast and runs before each commit through Buddy's plugin; Semgrep is slow on some machines and runs once per change and in the pipeline.

Each template with code also scans for personal data (SEC-8 in the general standards), with no extra dependency: `scripts/scan-personal-data.mjs` looks in the files git holds (skipping binaries, lock files, `node_modules` and `dist`) for emails outside the reserved domains (`example.com`, `.org`, `.net`, `.test`, `.invalid`, `.localhost`), phone numbers (international, and local ones of eight digits in two groups, as in Costa Rica), national identity numbers (Costa Rica's cédula, `N-NNNN-NNNN` or nine digits) and card numbers that pass the Luhn check, and names each finding with its file and line, never whole. It runs first in `npm run scan`, in both pipelines, and before each commit: `npm run setup` makes git run `.githooks/pre-commit`, which scans what is staged. A file that must keep data that looks personal is an approved exception in `.personal-data-allow.json`, with its path, the SHA-256 of its content and the reason (`node scripts/scan-personal-data.mjs --allow <file> --reason "<why>"` writes it); it covers that content only, so once the file changes it is refused again until the exception is approved again. The scan's own tests (`scripts/scan-personal-data.test.mjs`) run in `npm run validate`.

## Profiles

| Profile | Standards | Template |
| :-- | :-- | :-- |
| `empty` | general only | a truly empty project: `docs/base-application.md`, `.gitignore`, `.editorconfig` and a `validate` that passes and says nothing is checked yet |
| `dotnet-react` | general and .NET + React | a .NET 10 minimal API with a health endpoint and its xUnit tests, where every other endpoint asks for a signed-in user and every response carries the security headers, a stub sign-in for development with a made-up user that exists only in the `Development` environment and is tested to be absent in any other (SEC-6), until a real provider replaces it, the architecture rules as tests (TST-3: the application started to check every endpoint against an approved list, the 401 and the headers; ArchUnitNET, pinned and in the test project only, for the API not depending on test code and migrations that load no data), a test-data builder on Bogus with a fixed seed, a React 19 + Vite + TypeScript page with Tailwind CSS v4, shadcn/ui and the project's theme, its Vitest tests (an axe accessibility test among them), `npm run setup` and `npm run validate` |
| `cloudflare-web` | general and Cloudflare | a web application for Cloudflare Pages: a React 19 + Vite + TypeScript page with Tailwind CSS v4 and the project's theme, Pages Functions with a sign-in (PBKDF2 passwords, an `HttpOnly` session cookie kept as a hash in D1, a 15-minute wait after 5 failed sign-ins for the same email from the same address, and after 20 from one address) and a middleware that protects every `/api` endpoint for two roles, a D1 database with its migrations and an invented seed, Vitest tests run against D1 in memory (`node:sqlite`) with axe accessibility tests and a small seeded generator of test data, `npm run setup` and `npm run validate`; deployment is not configured (`wrangler.toml` binds a local database only) |

Test data is invented and the same on every run (QLT-4 in the general standards): each template with code has a test-data builder with a fixed seed and a test that fails if the seed stops giving the same data.

Each profile declares its **prerequisites**, what a machine needs to build and test it, in `standards/<profile>/prerequisites.md` (born with the project): a table with each tool, the command that checks it, its minimum version, its winget id for Windows and its Homebrew formula or cask for Mac, and what it is needed for. `dotnet-react` needs the .NET 10 SDK, Node.js 24, Semgrep and gitleaks; `cloudflare-web` needs Node.js 24 or later, Semgrep and gitleaks, and brings Wrangler as a development dependency, so no Cloudflare account is needed until the project decides to publish. Buddy reads the chosen profile's table before the project is born, checks the machine and installs what is missing only with the owner's yes. Each of those templates also brings `scripts/check-prerequisites.mjs` (Node only): it reads the project's copy of the table, runs each check, compares the version with the minimum and names each tool missing or too old with the exact install command for the machine's system; it runs as `npm run prerequisites` and first in `npm run setup` (which stops when something is missing; skipped in CI, where the pipeline installs its own tools), and with `--install` it asks before each install and runs it only on a yes, never in CI or without a terminal. Its tests (`scripts/check-prerequisites.test.mjs`) run in `npm run validate`.

A new profile adds a folder under `standards/` (when it has rules of its own) and under `templates/`, and a line in `library.json`, which is what Buddy shows the owner when they choose a profile.

The library proposes default **quality goals** in the same format as its rules, a table with an id, the goal, its target (a number or a list) and how it is measured: `standards/general/quality-goals.md` for every project (QG-1 data kept 5 years, QG-2 WCAG 2.2 AA), and `standards/<profile>/quality-goals.md` for `dotnet-react` (QG-DR-1 to QG-DR-3) and `cloudflare-web` (QG-CF-1 to QG-CF-3): up to 50 people at the same time, 95 % of pages in under 2 seconds, at most 4 hours down a month (outside office hours for `dotnet-react`). The goals of the chosen profile add to the general ones. They arrive with the standards but are proposals, not rules: Buddy proposes those the project's risk justifies, adjusted to it, and the owner confirms them into the project's business context, each citing its id, where UAT reads what it measures.

The library declares a **Definition of Ready** and a **Definition of Done** in the same table as its rules (an id, the zone, the rule, how it is checked, what it prevents): `standards/general/definition-of-ready.md` (DOR-1 to DOR-5: criteria in business words and what the change leaves out, how each criterion is tried, an example with numbers for money, dates or calculations, no blocking question open and the assumptions announced, where each criterion's data comes from) and `standards/general/definition-of-done.md` (DOD-1 to DOD-5: each criterion met and each key example tested, every test passing and none weakened, the security check clean, the stale documentation updated, screens accessible and following the prototype). `cloudflare-web` and `dotnet-react` add a row of their own to the Definition of Done (DOD-CF-1, DOD-DR-1: an axe test for each screen the change adds or changes). Buddy weighs a change against the Definition of Ready before he makes it ready, and names each rule it does not meet; the independent reviewer checks the Definition of Done at the checkpoint and reports each rule not met as a finding. Neither is confirmed by a Standards Owner yet.

## Themes

`themes/` holds the colour themes the owner can choose from when the project's look is decided (contract 2, optional). Each is one `<name>.css` of shadcn's CSS variables (`:root` for light, `.dark` for dark: `--background`, `--primary`, `--radius`, `--chart-*`, `--sidebar-*`, fonts when given), with its name and a one-line description in a comment at the top. `buddy init` copies them to the project's `docs/design/themes/`.

| Theme | Look |
| :-- | :-- |
| `neutral` | shadcn's default: black and white with grey accents |
| `modern-minimal` | clean white screens with a corporate blue accent |
| `caffeine` | warm browns and cream |
| `nature` | soft greens on warm paper tones |
| `mono-contrast` | pure black and white, the highest contrast |
| `amethyst-haze` | soft lavender and rose on pale grey |
| `ocean-breeze` | fresh greens on a pale sky blue |
| `clean-slate` | cool slate greys with an indigo accent |
| `northern-lights` | forest green and northern-sky blue |

`neutral` is shadcn/ui's (MIT); the others are copies of presets of [tweakcn](https://github.com/jnsahaj/tweakcn) (Apache-2.0), converted to CSS. In every theme the colours below WCAG AA contrast were adjusted, keeping their hue: text reaches 4.5:1 on its background and the primary colour 3:1, in light and dark. `themes/NOTICE` carries both licence notices. Nothing is fetched from tweakcn at any time: the files are copies.

The `dotnet-react` web app also ships a light/dark mode switch (a button that toggles the `.dark` class, remembers the choice in `localStorage` and starts from the system preference), TanStack Query as the pattern for server data (the health check is a `useQuery`) and Lucide as the icon library. The `cloudflare-web` page ships the same switch, without shadcn/ui, TanStack Query or Lucide: plain Tailwind classes on the theme's tokens.

A project born from the `dotnet-react` profile applies its theme in `web/src/theme.css` (born as `neutral`); one born from `cloudflare-web` in `src/theme.css` (born as `neutral` too, imported by `src/index.css` in the same way). `web/src/index.css` imports it and maps its variables to Tailwind, so every screen and every shadcn component uses it. When the owner chooses a theme, Buddy replaces the content of `web/src/theme.css` (`src/theme.css` in `cloudflare-web`) with the chosen one from `docs/design/themes/`; nothing else changes. To adjust a theme, the owner can use the [tweakcn editor](https://tweakcn.com) as an optional aid and paste the CSS it produces over `theme.css`; the project does not depend on it.

## Design rules

`standards/general/design.md` holds the library's design rules in the same table as any standard (contrast, keyboard, forms, target size, reflow, colour never the only signal and dialogs are `must`; theme tokens, states, actions, navigation, tables, fonts and consistency are `prefer`), each from a WCAG 2.2 criterion or a usability heuristic, and the rules for prototypes (believable sample data, at least two roles, the prototype's scaffolding set apart). A profile may add a `design.md` of its own. Dev, the reviewer, the usability audit and discovery read them as any standard. In the `dotnet-react` template, `src/App.a11y.test.tsx` runs axe-core over the rendered page in light and dark mode (in `cloudflare-web`, `tests/app.a11y.test.tsx` over the sign-in and the signed-in frame); jsdom cannot compute colours, so contrast stays the reviewer's in unit tests.

## Two kinds of standards

Every standards file says its `lifecycle` in its front matter:
- `birth`: copied once when the project is created; from then on it belongs to the project, and its Standards Owner may change it. A later version of this library does not touch it.
- `evergreen`: owned by the library. The project keeps the version it was created from until its Standards Owner decides to move to a newer one, by copying the same folders from that version over its own (`docs/standards/ORIGIN.md` says how). Buddy does not yet tell a project when this library publishes a new version; that is planned. The Product Owner may depart from any rule, even a `must` one, with an ADR that says why and names the rule; the board and the digest list each departure from a `must` rule for the Standards Owner to review afterwards.

Each rule states its zone (`must`, `prefer`, `free`), how it is checked (a program first, then an independent reviewer, `declared` last) and the problem it prevents. A rule that cannot state these does not belong here.

## Versions

Versions are git tags (`v0.1.0`, …). A project records in `docs/standards/ORIGIN.md` the library, profile, version and commit it was created from.

This library and Buddy publish their versions independently: Buddy reads a library at its latest version tag (or the one asked for), and the two agree only on the contract below.

## The contract with Buddy

What Buddy assumes of a library, this one or an enterprise one, is written once, in Buddy's repository: [the library guide](https://github.com/teban1812/buddy/blob/main/core/LIBRARY-GUIDE.md) (`core/LIBRARY-GUIDE.md` in teban1812/buddy, also shipped with Buddy's plugin). It explains each part of a library (`library.json`, the standards and their open values, the templates, the questions, the steps with each template's prefill, the normative documents and the saved prompts), what Buddy does with each and what he refuses, with an example of each.

A library says which contract it follows in its `library.json`. This library follows contract 2: its standards (with its default quality goals) and templates, and the themes. Contract 2 adds the themes, the questions, the steps, the normative documents and the saved prompts; a library that uses any of them declares `"contract": 2`.
