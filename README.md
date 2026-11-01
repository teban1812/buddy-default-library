# Buddy's default library

The standards and base applications a project starts from when it is created with Buddy and the organisation has no library of its own. An enterprise library has the same layout, in its own repository.

## Layout

```text
standards/
  general/        the rules every project follows, whatever its stack (evergreen)
  <profile>/      the rules of one stack (born with the project)
templates/
  <profile>/      the application a new project starts from
```

`buddy init` copies `standards/general/` and the chosen profile's standards into the project's `docs/standards/`, and the profile's template into the project's root, renamed for the project (`BuddyApp` and `buddy-app` are the placeholders). In a folder that already holds a project it copies the standards only. Its build and tests are run once, so the project is known to be born healthy.

Each template carries a pipeline for each host it supports, at its root: `.github/workflows/validate.yml` (GitHub Actions) and `azure-pipelines.yml` (Azure Pipelines). `buddy init` asks where the repository will live and keeps only that one, so the project's checks run on every push, including the commits made by hand.

Each template also carries the project's own scanning rules: `.gitleaks.toml` (secrets: gitleaks' rules plus a password written in a connection string) and, when the profile has code, `.semgrep/` (rules that check the standards a program can check, such as an empty catch or SQL built from text). `npm run scan` runs the Semgrep rules locally, without the network; the pipeline runs them together with Semgrep's public rule sets for the stack and gitleaks over the whole history. Gitleaks is fast and runs before each commit through Buddy's plugin; Semgrep is slow on some machines and runs once per change and in the pipeline.

## Profiles

| Profile | Standards | Template |
| :-- | :-- | :-- |
| `empty` | general only | a truly empty project: README, `.gitignore`, `.editorconfig` and a `validate` that passes and says nothing is checked yet |
| `dotnet-react` | general and .NET + React | a .NET 10 minimal API with a health endpoint and its xUnit test, a React 19 + Vite + TypeScript page with its Vitest test, `npm run setup` and `npm run validate` |

A new profile adds a folder under `standards/` (when it has rules of its own) and under `templates/`, and a line in `library.json`, which is what Buddy shows the owner when they choose a profile.

## Two kinds of standards

Every standards file says its `lifecycle` in its front matter:
- `birth`: copied once when the project is created; from then on it belongs to the project, and its Standards Owner may change it. A later version of this library does not touch it.
- `evergreen`: owned by the library. The project keeps the version it was created from; when the library publishes a new version, the project is told what changed and its Standards Owner decides whether to move to it. A project that must depart from an evergreen rule records that as its own decision.

Each rule states its zone (`must`, `prefer`, `free`), how it is checked (a program first, then an independent reviewer, `declared` last) and the problem it prevents. A rule that cannot state these does not belong here.

## Versions

Versions are git tags (`v0.1.0`, …). A project records in `docs/standards/ORIGIN.md` the library, profile, version and commit it was created from.
