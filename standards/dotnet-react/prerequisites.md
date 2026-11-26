---
lifecycle: birth
set: dotnet-react
---
# Prerequisites: .NET + React

What a machine needs to build, run and test a project of the .NET + React profile, on top of what Buddy himself needs (Claude Code or Antigravity, Node.js and git). Buddy reads this table when the owner chooses the profile, before the project is born: he runs each check, says in plain words what is missing, and installs each tool only with the owner's yes. It is **born with the project**, like the profile's standards: when the project moves to another version of a tool, its Standards Owner updates the row here.

Each row can be read by a program: "How to check it" is one command that prints the version, and "Minimum version" is a plain number, the lowest version that prints there and builds the project. The Windows column is a winget id (`winget install --id <id> -e`) and the Mac column a Homebrew formula or cask (`brew install <name>`, `brew install --cask <name>`); "none" says the tool has no package there and how to install it by hand.

| Tool | How to check it | Minimum version | Windows (winget id) | Mac (Homebrew) | Needed for |
| :-- | :-- | :-- | :-- | :-- | :-- |
| .NET SDK | `dotnet --list-sdks` | 10 | `Microsoft.DotNet.SDK.10` | cask `dotnet-sdk@10` | building and testing the API (`npm run validate`); the template targets `net10.0`, so the SDK 10 itself must be listed: a newer SDK alone builds it but cannot run its tests |
| Node.js (with npm) | `node --version` | 24 | `OpenJS.NodeJS.LTS` | formula `node` | installing the web dependencies (`npm run setup`), building and testing the web page |
| Semgrep | `semgrep --version` | 1 | none: install Python (`Python.Python.3.13`), then `pip install semgrep` (Semgrep's Windows support is in beta) | formula `semgrep` | the project's Semgrep rules, run by `npm run scan` once per change (SEC-2, CRF-1) |
| gitleaks | `gitleaks version` | 8.21 | `Gitleaks.Gitleaks` | formula `gitleaks` | the secrets scan before each commit (SEC-1); without it the commit goes on and says the scan did not run |
