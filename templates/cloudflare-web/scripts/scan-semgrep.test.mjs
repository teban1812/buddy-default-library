import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// The scan passes Semgrep the baseline .semgrep-baseline names, and nothing without one. A stand-in semgrep prints what it was given.
const ME = fileURLToPath(new URL('./scan-semgrep.mjs', import.meta.url));
function run(baseline) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'scan-semgrep-')); const bin = path.join(dir, 'bin'); fs.mkdirSync(bin);
  fs.writeFileSync(path.join(bin, 'semgrep.mjs'), 'console.log("ARGS " + process.argv.slice(2).join(" "));\n');
  fs.writeFileSync(path.join(bin, 'semgrep'), `#!/bin/sh\nexec node "${path.join(bin, 'semgrep.mjs')}" "$@"\n`, { mode: 0o755 });
  fs.writeFileSync(path.join(bin, 'semgrep.cmd'), `@node "${path.join(bin, 'semgrep.mjs')}" %*\r\n`);
  if (baseline) fs.writeFileSync(path.join(dir, '.semgrep-baseline'), baseline);
  return spawnSync('node', [ME, '--config', '.semgrep', '.'], { cwd: dir, encoding: 'utf8', env: { ...process.env, PATH: `${bin}${path.delimiter}${process.env.PATH}` } });
}

test('without .semgrep-baseline every finding is checked', () => {
  const r = run(null); assert.equal(r.status, 0, r.stderr); assert.match(r.stdout, /^ARGS scan --config \.semgrep \.$/m);
});

test('with .semgrep-baseline only the findings not already at its commit fail', () => {
  const r = run('0123456789abcdef0123456789abcdef01234567\n# The commit before the move\n'); assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /^ARGS scan --config \.semgrep \. --baseline-commit 0123456789abcdef0123456789abcdef01234567$/m);
});
