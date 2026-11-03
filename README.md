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

This library and Buddy publish their versions independently: Buddy reads a library at its latest version tag (or the one asked for), and the two agree only on the contract below.

## Contract 1

What Buddy assumes of a library, and so what any library, this one or an enterprise one, keeps. A library says which contract it follows in its `library.json` (`"contract": 1`; a library that says nothing follows contract 1), and a Buddy that does not understand that number refuses the library and says a newer Buddy is needed. Changes to a contract are additive: something a library may add and an older Buddy ignores. Anything that would break an older Buddy or an older library is a new contract, with a new number.

- **`library.json`** at the root: `name` (one line), `contract` (a whole number), `default_profile` (the profile used when none is asked for; without it Buddy uses `dotnet-react`) and `profiles` (an object: each profile's name and the one line shown to the owner when they choose). `general` is never a profile.
- **`standards/general/`**: the standards every profile receives, copied to the project's `docs/standards/general/`. The name `general` is fixed.
- **`standards/<profile>/`**: a profile's own standards, copied to `docs/standards/<profile>/`. Optional when the profile has a template.
- **`templates/<profile>/`**: the application a new project starts from, copied to the project's root without the library's history. Optional when the profile has standards.
- **Placeholders**: `BuddyApp` (PascalCase, a valid C# identifier) and `buddy-app` (kebab-case), in the template's file names and text contents, are replaced by the project's name.
- **Pipelines**: at most one per host, in the template: `.github/workflows/` (GitHub Actions) and `azure-pipelines.yml` at its root (Azure Pipelines). The project keeps only the chosen host's.
- **Scripts** in the template's `package.json`: `setup` (optional; run once when the project is born), `validate` (the project's checks; run when the project is born and before each change is presented) and `scan` (optional; the project's own scanning rules, run once per change).
- **`CLAUDE.md`** in the template (optional): kept, with Buddy's own block put first.
