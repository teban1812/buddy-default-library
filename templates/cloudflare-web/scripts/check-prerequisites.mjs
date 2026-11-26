// Checks that this machine has what the project needs to build and test (npm run prerequisites; setup runs it first).
// It reads the prerequisites table the project was born with (docs/standards/<profile>/prerequisites.md), runs each tool's check, compares the
// version it prints with the minimum, and names each tool missing or too old with the command that installs it on this system.
// It never installs by default: with --install it asks, tool by tool, and runs a command only after a yes; not in CI and not without a terminal.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline/promises';
import { pathToFileURL } from 'node:url';

const unquote = s => s.replace(/`/g, '').trim();
const cells = line => line.trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim());

// The rows of every docs/standards/<profile>/prerequisites.md, read by the table's column names: { tool, check (the command and its arguments), min, windows, mac }.
export function readTables(root) {
  const dir = path.join(root, 'docs', 'standards');
  const files = fs.existsSync(dir) ? fs.readdirSync(dir).map(d => path.join(dir, d, 'prerequisites.md')).filter(f => fs.existsSync(f)) : [];
  return files.flatMap(file => {
    const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
    const at = lines.findIndex(l => /^\|\s*Tool\s*\|/.test(l));
    if (at < 0) throw new Error(`${path.relative(root, file)} has no table whose first column is Tool`);
    const head = cells(lines[at]); const col = name => head.findIndex(h => h.startsWith(name));
    const need = ['Tool', 'How to check it', 'Minimum version', 'Windows', 'Mac'].map(n => [n, col(n)]);
    const lost = need.filter(([, i]) => i < 0).map(([n]) => n);
    if (lost.length) throw new Error(`the table of ${path.relative(root, file)} has no column ${lost.join(', ')}`);
    const [tool, check, min, windows, mac] = need.map(([, i]) => i);
    const rows = []; for (const l of lines.slice(at + 2)) { if (!l.trim().startsWith('|')) break; rows.push(cells(l)); }
    return rows.map(c => ({ tool: c[tool], check: unquote(c[check]).split(/\s+/), min: unquote(c[min]), windows: c[windows], mac: c[mac] }));
  });
}

// The highest version printed: the first number of each line (v24.11.1, 10.0.404 [path], tool version 8.30.1).
export function versionIn(out) {
  const found = String(out).split(/\r?\n/).map(l => /\d+(?:\.\d+)*/.exec(l)?.[0]).filter(Boolean);
  return found.length ? found.reduce((a, b) => (meets(a, b) ? a : b)) : null;
}
export function meets(found, min) {
  const a = found.split('.').map(Number), b = min.split('.').map(Number);
  for (let i = 0; i < Math.max(a.length, b.length); i++) { const x = a[i] || 0, y = b[i] || 0; if (x !== y) return x > y; }
  return true;
}

// How to install a tool on this system: { command } from its winget id or Homebrew name, or { byHand } when there is no package for it.
export function installCommand(t, platform = process.platform) {
  const cell = platform === 'win32' ? t.windows : platform === 'darwin' ? t.mac : null;
  if (cell == null) return { byHand: `install ${t.tool} ${t.min} or later by hand, with your system's package manager or from its official site` };
  if (/^none\b/i.test(cell)) return { byHand: unquote(cell.replace(/^none:?\s*/i, '')) || `install ${t.tool} ${t.min} or later by hand` };
  if (platform === 'win32') return { command: `winget install --id ${unquote(cell)} -e` };
  const cask = /^cask\s/i.test(cell);
  return { command: `brew install ${cask ? '--cask ' : ''}${unquote(cell.replace(/^(cask|formula)\s+/i, ''))}` };
}

// Each tool's state on this machine: { ...tool, found (the version, or null), ok }.
export function check(root, tools) {
  return tools.map(t => {
    const r = spawnSync(t.check[0], t.check.slice(1), { cwd: root, encoding: 'utf8', shell: process.platform === 'win32' });
    const found = r.error ? null : versionIn(`${r.stdout || ''}\n${r.stderr || ''}`);
    return { ...t, found, ok: !!found && meets(found, t.min) };
  });
}

// Offers each tool, one at a time; only a yes runs its command. A tool with no package is said, never run.
export async function install(missing, { platform = process.platform, ask, run, say = console.log }) {
  for (const t of missing) {
    const how = installCommand(t, platform);
    if (!how.command) { say(`${t.tool}: no package for this system; ${how.byHand}.`); continue; }
    const yes = /^y(es)?$/i.test((await ask(`Install ${t.tool} with ${how.command}? (y/N) `)).trim());
    if (!yes) { say(`${t.tool}: not installed.`); continue; }
    const status = run(how.command);
    say(status === 0 ? `${t.tool}: installed.` : `${t.tool}: the install failed (exit ${status}); see its output above.`);
  }
}

async function main() {
  const root = process.cwd(); const wantInstall = process.argv.includes('--install');
  if (wantInstall && (process.env.CI || process.env.TF_BUILD)) { console.error('error: --install asks before each install, so it does not run in CI.'); return 2; }
  if (wantInstall && !process.stdin.isTTY) { console.error('error: --install asks before each install, so it needs a terminal where someone can answer.'); return 2; }
  const tools = readTables(root);
  if (!tools.length) { console.log('No prerequisites table under docs/standards/<profile>/prerequisites.md: nothing checked.'); return 0; }
  const state = check(root, tools);
  for (const t of state.filter(x => x.ok)) console.log(`${t.tool} ${t.found} (at least ${t.min}): ok`);
  const missing = state.filter(x => !x.ok);
  if (!missing.length) { console.log('Everything this project needs is on this machine.'); return 0; }
  for (const t of missing) {
    const how = installCommand(t);
    console.log(`${t.tool} is ${t.found ? 'too old' : 'missing'}: ${t.found ? `${t.found} found` : 'not found'}, at least ${t.min} needed. ${how.command ? `Install it with: ${how.command}` : `No package for this system: ${how.byHand}.`}`);
  }
  if (wantInstall) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    try { await install(missing, { ask: q => rl.question(q), run: c => spawnSync(c, { stdio: 'inherit', shell: true }).status ?? 1 }); } finally { rl.close(); }
  } else console.log('To install them one at a time, each only after your yes: npm run prerequisites -- --install');
  console.log('Run npm run prerequisites again.');
  return 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().then(code => process.exit(code), e => { console.error(`error: ${e.message}`); process.exit(1); });
}
