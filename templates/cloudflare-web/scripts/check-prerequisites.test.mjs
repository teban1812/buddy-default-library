// Tests of the prerequisites check, run by `npm run validate` with Node's own test runner. They use a made-up table and made-up
// tools (small Node scripts that print a version): nothing is installed and no real tool is asked.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readTables, versionIn, meets, installCommand, install } from './check-prerequisites.mjs';

const CHECK = fileURLToPath(new URL('./check-prerequisites.mjs', import.meta.url));
const HEAD = '| Tool | How to check it | Minimum version | Windows (winget id) | Mac (Homebrew) | Needed for |\n| :-- | :-- | :-- | :-- | :-- | :-- |\n';
const table = rows => `---\nlifecycle: birth\nset: p\n---\n# Prerequisites: p\n\nSome words for people.\n\n${HEAD}${rows.join('\n')}\n`;
const row = (tool, check, min, win, mac) => `| ${tool} | \`${check}\` | ${min} | ${win} | ${mac} | something |`;
function project(rows, tools = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'prerequisites-'));
  fs.mkdirSync(path.join(dir, 'docs', 'standards', 'p'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'docs', 'standards', 'p', 'prerequisites.md'), table(rows));
  for (const [name, out] of Object.entries(tools)) fs.writeFileSync(path.join(dir, name), `console.log(${JSON.stringify(out)});\n`);
  return dir;
}
const check = (cwd, args = [], env = {}) => spawnSync(process.execPath, [CHECK, ...args], { cwd, encoding: 'utf8', env: { ...process.env, CI: '', TF_BUILD: '', ...env } });

test('every tool at or above its minimum: it says so and exits 0', () => {
  const dir = project([row('Tool A', 'node a.mjs', '24', '`Acme.ToolA`', 'formula `tool-a`'), row('Tool B', 'node b.mjs', '8.21', '`Acme.ToolB`', 'cask `tool-b`')], { 'a.mjs': 'v26.1.0', 'b.mjs': 'tool-b version 8.30.1' });
  const r = check(dir); assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /Tool A 26\.1\.0 \(at least 24\): ok/); assert.match(r.stdout, /Tool B 8\.30\.1 \(at least 8\.21\): ok/);
  assert.match(r.stdout, /Everything this project needs is on this machine\./);
});

test('a tool missing and a tool too old: each is named with the version found and the install command, then exits 1', () => {
  const dir = project([row('Tool A', 'node a.mjs', '24', '`Acme.ToolA`', 'formula `tool-a`'), row('Tool C', 'no-such-tool-anywhere --version', '1', '`Acme.ToolC`', 'cask `tool-c`')], { 'a.mjs': 'v22.4.0' });
  const r = check(dir); assert.equal(r.status, 1, r.stdout + r.stderr);
  assert.match(r.stdout, /Tool A is too old: 22\.4\.0 found, at least 24 needed\. Install it with: /);
  assert.match(r.stdout, /Tool C is missing: not found, at least 1 needed\. Install it with: /);
  assert.match(r.stdout, /Run npm run prerequisites again\./);
});

test('with no table there is nothing to check, and it says so', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'prerequisites-'));
  const r = check(dir); assert.equal(r.status, 0); assert.match(r.stdout, /No prerequisites table under docs\/standards\/<profile>\/prerequisites\.md: nothing checked\./);
});

test('--install is refused in CI and when nobody is at a terminal, and installs nothing', () => {
  const dir = project([row('Tool C', 'no-such-tool-anywhere --version', '1', '`Acme.ToolC`', 'cask `tool-c`')]);
  const ci = check(dir, ['--install'], { CI: 'true' }); assert.equal(ci.status, 2); assert.match(ci.stderr, /--install asks before each install, so it does not run in CI/);
  const notty = check(dir, ['--install']); assert.equal(notty.status, 2); assert.match(notty.stderr, /--install asks before each install, so it needs a terminal/);
});

test('the table is read by its column names, and its cells give the check, the minimum and the install command for each system', () => {
  const dir = project([row('.NET SDK', 'dotnet --list-sdks', '10', '`Microsoft.DotNet.SDK.10`', 'cask `dotnet-sdk@10`'), row('Semgrep', 'semgrep --version', '1', 'none: install Python (`Python.Python.3.13`), then `pip install semgrep`', 'formula `semgrep`')]);
  const [net, sem] = readTables(dir);
  assert.deepEqual([net.tool, net.check, net.min], ['.NET SDK', ['dotnet', '--list-sdks'], '10']);
  assert.deepEqual(installCommand(net, 'win32'), { command: 'winget install --id Microsoft.DotNet.SDK.10 -e' });
  assert.deepEqual(installCommand(net, 'darwin'), { command: 'brew install --cask dotnet-sdk@10' });
  assert.deepEqual(installCommand(sem, 'darwin'), { command: 'brew install semgrep' });
  assert.deepEqual(installCommand(sem, 'win32'), { byHand: 'install Python (Python.Python.3.13), then pip install semgrep' });
  assert.match(installCommand(sem, 'linux').byHand, /^install Semgrep 1 or later by hand/);
});

test('versions are read from what the check prints and compared part by part', () => {
  assert.equal(versionIn('v24.11.1\n'), '24.11.1');
  assert.equal(versionIn('9.0.300 [/usr/share/dotnet/sdk]\n10.0.404 [/usr/share/dotnet/sdk]\n'), '10.0.404');
  assert.equal(versionIn('nothing here'), null);
  assert.ok(meets('10.0.404', '10')); assert.ok(meets('8.30.1', '8.21')); assert.ok(!meets('8.9.0', '8.21')); assert.ok(!meets('22.4.0', '24'));
});

test('with --install each missing tool is offered one at a time, and only a yes runs its command', async () => {
  const missing = [{ tool: 'Tool A', windows: '`Acme.ToolA`', mac: 'formula `tool-a`' }, { tool: 'Tool B', windows: '`Acme.ToolB`', mac: 'cask `tool-b`' }, { tool: 'Tool H', windows: 'none: from its site', mac: 'none: from its site' }];
  const asked = [], ran = [];
  await install(missing, { platform: 'darwin', ask: async q => { asked.push(q); return q.includes('Tool A') ? 'y' : 'n'; }, run: c => { ran.push(c); return 0; }, say: () => {} });
  assert.deepEqual(asked, ['Install Tool A with brew install tool-a? (y/N) ', 'Install Tool B with brew install --cask tool-b? (y/N) ']);
  assert.deepEqual(ran, ['brew install tool-a']);
});
