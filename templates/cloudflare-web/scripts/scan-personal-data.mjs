#!/usr/bin/env node
// The personal-data scan (standard SEC-8, no real person's data in the repository). Born with the project from Buddy's default library.
// It looks for emails outside the reserved domains, phone numbers, national identity numbers (Costa Rica's cédula) and card numbers
// that pass the Luhn check, in the files git holds (.gitignore is respected; binaries, lock files, node_modules and dist are skipped).
//
//   node scripts/scan-personal-data.mjs [<file> ...]            the repository's files, or the ones named (npm run scan, CI)
//   node scripts/scan-personal-data.mjs --staged                what is staged, as it will be committed (the pre-commit hook)
//   node scripts/scan-personal-data.mjs --allow <file> --reason "<why>"   approves an exception for the file as it is now
//   node scripts/scan-personal-data.mjs --install-hook          makes git run the scan before each commit (npm run setup)
//
// An approved exception is an entry of .personal-data-allow.json: the file's path, the SHA-256 of its content and the reason. It covers
// that content only: once the file changes it is scanned again, until the exception is approved again. Exit 0 clean, 1 found, 2 cannot scan.
import { spawnSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const ALLOW_FILE = '.personal-data-allow.json';
const ME = 'node scripts/scan-personal-data.mjs';
const SKIP = /(^|\/)(node_modules|dist)\/|(^|\/)(package-lock\.json|npm-shrinkwrap\.json|yarn\.lock|pnpm-lock\.yaml|packages\.lock\.json|bun\.lockb?)$|\.lock$/;

const git = (args, input) => spawnSync('git', args, { encoding: 'buffer', maxBuffer: 1 << 30, ...(input !== undefined ? { input } : {}) });
const fail = message => { process.stderr.write(`${message}\n`); process.exit(2); };
const hash = buf => crypto.createHash('sha256').update(buf.toString('utf8').replace(/\r\n/g, '\n')).digest('hex');
const isBinary = buf => buf.subarray(0, 8000).includes(0);

// --- what counts as personal data ---------------------------------------------------------------------------------------------

const RESERVED = d => /(^|\.)example\.(com|org|net)$/.test(d) || /(^|\.)(test|invalid|localhost|example)$/.test(d);
const FILE_ENDINGS = new Set(['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'ico', 'js', 'mjs', 'cjs', 'ts', 'tsx', 'jsx', 'css', 'json', 'html', 'md', 'cs']);
const digits = s => s.replace(/\D/g, '');
function luhn(n) {
  let sum = 0;
  for (let i = 0; i < n.length; i++) { let d = Number(n[n.length - 1 - i]); if (i % 2) { d *= 2; if (d > 9) d -= 9; } sum += d; }
  return sum % 10 === 0;
}
// Each kind, in the order they are looked for; what one finds is blanked before the next looks, so a card is not also a phone.
const KINDS = [
  { kind: 'an email address', re: /(?<![\w.%+-])[A-Za-z0-9][\w.%+-]*@((?:[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?\.)+([A-Za-z]{2,}))(?![\w-])/g,
    keep: m => !RESERVED(m[1].toLowerCase()) && !FILE_ENDINGS.has(m[2].toLowerCase()) },
  { kind: 'a card number', re: /(?<![\w-])[2-6](?:[ -]?\d){12,18}(?![\w-])/g, keep: m => luhn(digits(m[0])) },
  { kind: 'a national identity number', re: /(?<![\w-])0?[1-9]-\d{4}-\d{4}(?![\w-])/g, keep: () => true },
  // nine digits as a cédula is written without dashes; an asiento is never 0000, so a round number is not one
  { kind: 'a national identity number', re: /(?<![\w.,+-])[1-9]\d{8}(?![\w.,-])/g, keep: m => !/0000$/.test(m[0]) },
  { kind: 'a phone number', re: /(?<![\w+])\+\d{1,3}(?:[ .-]?\(\d{1,4}\))?(?:[ .-]?\d{2,4}){2,5}(?![\w-])/g, keep: m => digits(m[0]).length >= 8 && digits(m[0]).length <= 15 },
  // a local number of eight digits written in two groups, as in Costa Rica (8xxx-xxxx); a range of years (2025-2026) is not one
  { kind: 'a phone number', re: /(?<![\w+]|\d[ .-])[2-8]\d{3}[ -]\d{4}(?![ .-]?\d|[\w-])/g, keep: m => !/^(19|20)\d\d[ -](19|20)\d\d$/.test(m[0]) },
];
const mask = s => s.includes('@') ? `${s[0]}***@${s.split('@')[1]}` : s.replace(/\d(?=(?:\D*\d){2})/g, '*');

function findIn(text) {
  const found = [];
  text.split('\n').forEach((original, i) => {
    let line = original;
    for (const { kind, re, keep } of KINDS) {
      for (const m of line.matchAll(re)) {
        if (!keep(m)) continue;
        found.push({ line: i + 1, kind, shown: mask(m[0]) });
        line = line.slice(0, m.index) + 'x'.repeat(m[0].length) + line.slice(m.index + m[0].length);
      }
    }
  });
  return found;
}

// --- the approved exceptions ---------------------------------------------------------------------------------------------------

function readAllow(text) {
  if (text === null) return [];
  let data;
  try { data = JSON.parse(text); } catch (e) { fail(`${ALLOW_FILE} is not valid JSON (${e.message}); fix it, or approve again with ${ME} --allow <file> --reason "<why>".`); }
  const list = Array.isArray(data?.allow) ? data.allow : fail(`${ALLOW_FILE} needs an "allow" list of { "path", "sha256", "reason" }.`);
  list.forEach((e, i) => {
    for (const k of ['path', 'sha256', 'reason']) if (typeof e?.[k] !== 'string' || !e[k].trim()) fail(`${ALLOW_FILE}: entry ${i + 1} has no ${k}; every exception names the file, the hash of its content and the reason it is allowed.`);
  });
  return list;
}
const fromDisk = f => (fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : null);
function fromIndex(f) { const r = git(['show', `:./${f}`]); return r.status === 0 ? r.stdout.toString('utf8') : null; }

// --- the commands ----------------------------------------------------------------------------------------------------------------

function list(args) {
  const r = git(args);
  if (r.status !== 0) fail(`The personal-data scan reads the files git holds, and git could not list them here (${r.stderr.toString().trim() || 'not a git repository'}).`);
  return r.stdout.toString('utf8').split('\0').filter(Boolean);
}

function scan({ staged, named }) {
  const files = staged ? list(['diff', '--cached', '--name-only', '--diff-filter=ACMR', '--relative', '-z'])
    : named.length ? named.map(f => f.split(path.sep).join('/')) : [...new Set(list(['ls-files', '-z', '--cached', '--others', '--exclude-standard']))];
  const allowText = staged ? fromIndex(ALLOW_FILE) : fromDisk(ALLOW_FILE);
  const allow = new Map(readAllow(allowText).map(e => [e.path, e]));
  const findings = [], changed = [];
  for (const f of files) {
    if (SKIP.test(f)) continue;
    let buf;
    if (staged) { const r = git(['show', `:./${f}`]); if (r.status !== 0) continue; buf = r.stdout; }
    else if (fs.existsSync(f) && fs.statSync(f).isFile()) buf = fs.readFileSync(f);
    else if (named.length) fail(`${f}: no such file to scan.`);
    else continue;                                   // a tracked file deleted from the working tree holds nothing to scan
    if (isBinary(buf)) continue;
    const entry = allow.get(f);
    if (entry && entry.sha256 === hash(buf)) continue;
    const here = findIn(buf.toString('utf8'));
    if (here.length && entry) changed.push(f);
    for (const x of here) findings.push({ file: f, ...x });
  }
  if (!findings.length) { process.stdout.write(`No personal data found in ${files.length} file${files.length === 1 ? '' : 's'} (standard SEC-8).\n`); return 0; }
  const width = Math.max(...findings.map(x => `${x.file}:${x.line}`.length));
  const out = ['Personal data found (standard SEC-8: no real person\'s data in the repository):',
    ...findings.map(x => `  ${`${x.file}:${x.line}`.padEnd(width)}  ${x.kind} (${x.shown})`),
    ...changed.map(f => `  ${f} changed since its exception was approved, so it is scanned again.`),
    '',
    'If it is real, take it out (and rotate it, a card say, if it reached a shared repository). Invented data uses a reserved',
    'domain (example.com) and numbers no one holds. If the file must keep it as it is, approve the exception with its reason:',
    `  ${ME} --allow <file> --reason "<why it is allowed>"`,
    `and commit ${ALLOW_FILE} with the file. An exception covers the file's content as approved: a change needs it approved again.`];
  if (staged && fromDisk(ALLOW_FILE) !== allowText) out.push('', `${ALLOW_FILE} has changes that are not staged, and only what is staged counts: git add ${ALLOW_FILE}`);
  process.stderr.write(`${out.join('\n')}\n`);
  return 1;
}

function approve(file, reason) {
  if (!file || !reason?.trim()) fail(`To approve an exception name the file and the reason: ${ME} --allow <file> --reason "<why it is allowed>"`);
  const rel = path.relative(process.cwd(), path.resolve(file)).split(path.sep).join('/');
  if (!fs.existsSync(rel) || !fs.statSync(rel).isFile()) fail(`${file}: no such file to approve.`);
  const list = readAllow(fromDisk(ALLOW_FILE)).filter(e => e.path !== rel);
  list.push({ path: rel, sha256: hash(fs.readFileSync(rel)), reason: reason.trim() });
  list.sort((a, b) => a.path.localeCompare(b.path));
  const about = 'Approved exceptions to the personal-data scan (standard SEC-8). Each covers one file as it is now: a change to it needs the exception approved again. Add one with: node scripts/scan-personal-data.mjs --allow <file> --reason "<why it is allowed>"';
  fs.writeFileSync(ALLOW_FILE, `${JSON.stringify({ about, allow: list }, null, 2)}\n`);
  process.stdout.write(`Approved ${rel} as it is now (${reason.trim()}). Commit ${ALLOW_FILE} with it.\n`);
  return 0;
}

function installHook() {
  const top = git(['rev-parse', '--show-toplevel']);
  if (top.status !== 0) { process.stdout.write('The personal-data check before each commit is not installed: this folder is not a git repository yet. Run npm run setup again once it is.\n'); return 0; }
  if (path.resolve(top.stdout.toString().trim()) !== path.resolve(process.cwd())) {
    process.stdout.write(`The personal-data check before each commit is not installed: the project is not at the top of its git repository. Call ${ME} --staged from the repository's own pre-commit hook.\n`);
    return 0;
  }
  const now = git(['config', '--get', 'core.hooksPath']).stdout.toString().trim();
  if (now && now !== '.githooks') { process.stdout.write(`The personal-data check before each commit is not installed: git already runs the hooks in ${now}. Call ${ME} --staged from its pre-commit hook.\n`); return 0; }
  if (git(['config', 'core.hooksPath', '.githooks']).status !== 0) fail('git refused to set core.hooksPath to .githooks, so the personal-data check before each commit is not installed.');
  fs.chmodSync('.githooks/pre-commit', 0o755);
  process.stdout.write('Before each commit git now runs the personal-data scan (.githooks/pre-commit, standard SEC-8).\n');
  return 0;
}

const args = process.argv.slice(2);
const value = name => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : undefined; };
if (args.includes('--install-hook')) process.exit(installHook());
else if (args.includes('--allow')) process.exit(approve(value('--allow'), value('--reason')));
else process.exit(scan({ staged: args.includes('--staged'), named: args.filter(a => !a.startsWith('--')) }));
