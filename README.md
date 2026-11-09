# Buddy's default library

The standards and base applications a project starts from when it is created with Buddy and the organisation has no library of its own. An enterprise library has the same layout, in its own repository.

## Layout

```text
library.json      the library's name, contract, default profile and profiles
standards/
  general/        the rules every project follows, whatever its stack (evergreen)
  <profile>/      the rules of one stack (born with the project)
templates/
  <profile>/      the application a new project starts from
questions/        asked before a project is born (contract 2; none here yet)
steps/            checklists drafted once per project (contract 2; none here yet)
normative/        the index of the documents the standards cite (contract 2; none here yet)
prompts/          the organisation's saved prompts (contract 2; none here yet)
```

`buddy init` copies `standards/general/` and the chosen profile's standards into the project's `docs/standards/`, and the profile's template into the project's root, renamed for the project (`BuddyApp` and `buddy-app` are the placeholders). In a folder that already holds a project it copies the standards only. Its build and tests are run once, so the project is known to be born healthy.

Each template carries a pipeline for each host it supports, at its root: `.github/workflows/validate.yml` (GitHub Actions) and `azure-pipelines.yml` (Azure Pipelines). `buddy init` asks where the repository will live and keeps only that one, so the project's checks run on every push, including the commits made by hand.

Each template also carries the project's own scanning rules: `.gitleaks.toml` (secrets: gitleaks' rules plus a password written in a connection string) and, when the profile has code, `.semgrep/` (rules that check the standards a program can check, such as an empty catch or SQL built from text). `npm run scan` runs the Semgrep rules locally, without the network; the pipeline runs them together with Semgrep's public rule sets for the stack and gitleaks over the whole history. Gitleaks is fast and runs before each commit through Buddy's plugin; Semgrep is slow on some machines and runs once per change and in the pipeline.

## Profiles

| Profile | Standards | Template |
| :-- | :-- | :-- |
| `empty` | general only | a truly empty project: `docs/base-application.md`, `.gitignore`, `.editorconfig` and a `validate` that passes and says nothing is checked yet |
| `dotnet-react` | general and .NET + React | a .NET 10 minimal API with a health endpoint and its xUnit test, a React 19 + Vite + TypeScript page with its Vitest test, `npm run setup` and `npm run validate` |

A new profile adds a folder under `standards/` (when it has rules of its own) and under `templates/`, and a line in `library.json`, which is what Buddy shows the owner when they choose a profile.

## Two kinds of standards

Every standards file says its `lifecycle` in its front matter:
- `birth`: copied once when the project is created; from then on it belongs to the project, and its Standards Owner may change it. A later version of this library does not touch it.
- `evergreen`: owned by the library. The project keeps the version it was created from until its Standards Owner decides to move to a newer one, by copying the same folders from that version over its own (`docs/standards/ORIGIN.md` says how). Buddy does not yet tell a project when this library publishes a new version; that is planned. A project that must depart from an evergreen rule records that as its own decision.

Each rule states its zone (`must`, `prefer`, `free`), how it is checked (a program first, then an independent reviewer, `declared` last) and the problem it prevents. A rule that cannot state these does not belong here.

## Versions

Versions are git tags (`v0.1.0`, …). A project records in `docs/standards/ORIGIN.md` the library, profile, version and commit it was created from.

This library and Buddy publish their versions independently: Buddy reads a library at its latest version tag (or the one asked for), and the two agree only on the contract below.

## The contract with Buddy

What Buddy assumes of a library, this one or an enterprise one, is written once, in Buddy's repository: [the library guide](https://github.com/teban1812/buddy/blob/main/core/LIBRARY-GUIDE.md) (`core/LIBRARY-GUIDE.md` in teban1812/buddy, also shipped with Buddy's plugin). It explains each part of a library (`library.json`, the standards and their open values, the templates, the questions, the steps with each template's prefill, the normative documents and the saved prompts), what Buddy does with each and what he refuses, with an example of each.

A library says which contract it follows in its `library.json`. This library follows contract 1: its standards and templates. Contract 2 adds the questions, the steps, the normative documents and the saved prompts; a library that uses any of them declares `"contract": 2`.
