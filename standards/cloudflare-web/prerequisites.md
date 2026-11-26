---
lifecycle: birth
set: cloudflare-web
---
# Prerequisites: web on Cloudflare

What a machine needs to build, run and test a project of the Cloudflare web profile, on top of what Buddy himself needs (Claude Code or Antigravity, Node.js and git). Buddy reads this table when the owner chooses the profile, before the project is born: he runs each check, says in plain words what is missing, and installs each tool only with the owner's yes. It is **born with the project**, like the profile's standards: when the project moves to another version of a tool, its Standards Owner updates the row here.

Wrangler, Cloudflare's command line, is not here: it comes with the project as a development dependency, pinned by its lock file (STK-3), and no Cloudflare account is needed until the project decides to publish (OPS-1).

Each row is read by a program, the template's `scripts/check-prerequisites.mjs` (`npm run prerequisites`, and first in `npm run setup`): "How to check it" is one command that prints the version, and "Minimum version" is a plain number, the lowest version that prints there and builds the project; the columns are found by their names. The Windows column is a winget id (`winget install --id <id> -e`) and the Mac column a Homebrew formula or cask (`brew install <name>`, `brew install --cask <name>`); "none" says the tool has no package there and how to install it by hand.

| Tool | How to check it | Minimum version | Windows (winget id) | Mac (Homebrew) | Needed for |
| :-- | :-- | :-- | :-- | :-- | :-- |
| Node.js (with npm) | `node --version` | 24 | `OpenJS.NodeJS.LTS` | formula `node` | installing the dependencies (`npm run setup`), building the page and running the tests, whose D1 in memory needs Node's `node:sqlite` (STK-3, TST-1) |
| Semgrep | `semgrep --version` | 1 | none: install Python (`Python.Python.3.13`), then `pip install semgrep` (Semgrep's Windows support is in beta) | formula `semgrep` | the project's Semgrep rules, run by `npm run scan` once per change (DB-2, CRF-1) |
| gitleaks | `gitleaks version` | 8.21 | `Gitleaks.Gitleaks` | formula `gitleaks` | the secrets scan before each commit (SEC-1, SEC-6); without it the commit goes on and says the scan did not run |
