#!/usr/bin/env node
// Semgrep with the project's rules (the standards that say "checked by a program"), in npm run scan and in CI: node scripts/scan-semgrep.mjs <semgrep's options>.
// When .semgrep-baseline names a commit (buddy library update writes it when new must rules arrive), only the findings not already there at that
// commit fail: what was there is known debt (R320). With a baseline Semgrep reads what is committed or staged, so `git add` before scanning.
// Once the older code is in line, delete .semgrep-baseline and every finding fails again.
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';

// no baseline file: everything is checked
const base = fs.existsSync('.semgrep-baseline') ? fs.readFileSync('.semgrep-baseline', 'utf8').split('\n').map(l => l.trim()).find(l => /^[0-9a-f]{7,40}$/.test(l)) ?? null : null;
if (base) console.log(`Semgrep from the baseline ${base} (.semgrep-baseline): findings already there are known debt; only new ones fail.`);
const r = spawnSync('semgrep', ['scan', ...process.argv.slice(2), ...(base ? ['--baseline-commit', base] : [])], { stdio: 'inherit', shell: process.platform === 'win32' });
if (r.error) { console.error(`Semgrep could not run (${r.error.message}): install it (npm run prerequisites says how).`); process.exit(2); }
process.exit(r.status ?? 2);
