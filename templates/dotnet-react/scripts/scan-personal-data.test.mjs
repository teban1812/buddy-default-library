// Tests of the personal-data scan (standard SEC-8), run by `npm run validate` with Node's own test runner.
// The personal data below is built while the test runs, never written as it is, so this file passes the scan itself.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SCAN = fileURLToPath(new URL('./scan-personal-data.mjs', import.meta.url));
const PROJECT = path.dirname(path.dirname(SCAN));

const email = ['ana.rojas.mora', 'gmail.com'].join('@');
const phone = ['+506', '8812', '3456'].join(' ');
const card = ['4111', '1111', '1111', '1111'].join(' ');        // a test number of the card networks: it passes Luhn
const cedula = ['1', '0234', '0567'].join('-');

const git = (cwd, ...args) => spawnSync('git', ['-c', 'user.name=Sample', '-c', 'user.email=sample@example.com', ...args], { cwd, encoding: 'utf8' });
const scan = (cwd, ...args) => spawnSync(process.execPath, [SCAN, ...args], { cwd, encoding: 'utf8' });
function repo() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'personal-data-'));
  git(dir, 'init', '-q');
  fs.mkdirSync(path.join(dir, 'tests', 'fixtures'), { recursive: true });
  return dir;
}
const fixture = ['{', `  "email": "${email}",`, `  "phone": "${phone}",`, `  "card": "${card}",`, `  "id": "${cedula}"`, '}', ''].join('\n');

test('a fixture with an email on gmail.com, a phone, a card number and a cédula is refused, naming the file and each line', () => {
  const dir = repo();
  fs.writeFileSync(path.join(dir, 'tests', 'fixtures', 'customer.json'), fixture);
  const r = scan(dir);
  assert.equal(r.status, 1, r.stdout + r.stderr);
  for (const [line, kind] of [[2, 'email address'], [3, 'phone number'], [4, 'card number'], [5, 'national identity number']])
    assert.match(r.stderr, new RegExp(`tests/fixtures/customer\\.json:${line} +an? ${kind}`));
  assert.ok(!r.stderr.includes(email) && !r.stderr.includes(card), 'the finding is not printed whole');
  assert.match(r.stderr, /--allow <file> --reason/);
});

test('with an allowlist entry for its content the file passes, and once it changes it is refused again', () => {
  const dir = repo();
  const file = path.join(dir, 'tests', 'fixtures', 'customer.json');
  fs.writeFileSync(file, fixture);
  const allowed = scan(dir, '--allow', 'tests/fixtures/customer.json', '--reason', 'Invented customer for the import test');
  assert.equal(allowed.status, 0, allowed.stdout + allowed.stderr);
  const list = JSON.parse(fs.readFileSync(path.join(dir, '.personal-data-allow.json'), 'utf8'));
  assert.deepEqual(list.allow.map(e => [e.path, e.reason, e.sha256.length]), [['tests/fixtures/customer.json', 'Invented customer for the import test', 64]]);
  assert.equal(scan(dir).status, 0);

  fs.appendFileSync(file, '\n');
  const again = scan(dir);
  assert.equal(again.status, 1);
  assert.match(again.stderr, /tests\/fixtures\/customer\.json:2 +an email address/);
  assert.match(again.stderr, /changed since its exception was approved/);
});

test('before a commit: what is staged is refused, the allowlist entry lets it through, a change is refused again', () => {
  const dir = repo();
  const file = path.join(dir, 'tests', 'fixtures', 'customer.json');
  fs.writeFileSync(file, fixture);
  fs.mkdirSync(path.join(dir, '.githooks'));
  fs.copyFileSync(path.join(PROJECT, '.githooks', 'pre-commit'), path.join(dir, '.githooks', 'pre-commit'));
  fs.chmodSync(path.join(dir, '.githooks', 'pre-commit'), 0o755);
  fs.mkdirSync(path.join(dir, 'scripts'));
  fs.copyFileSync(SCAN, path.join(dir, 'scripts', 'scan-personal-data.mjs'));
  git(dir, 'config', 'core.hooksPath', '.githooks');
  git(dir, 'add', 'tests/fixtures/customer.json', 'scripts/scan-personal-data.mjs', '.githooks/pre-commit');
  const refused = git(dir, 'commit', '-q', '-m', 'test: add a fixture');
  assert.notEqual(refused.status, 0);
  assert.match(refused.stderr, /tests\/fixtures\/customer\.json:4 +a card number/);

  assert.equal(scan(dir, '--allow', 'tests/fixtures/customer.json', '--reason', 'Invented customer').status, 0);
  const unstaged = git(dir, 'commit', '-q', '-m', 'test: add a fixture');
  assert.notEqual(unstaged.status, 0, 'the allowlist counts once it is part of the commit');
  assert.match(unstaged.stderr, /git add \.personal-data-allow\.json/);
  git(dir, 'add', '.personal-data-allow.json');
  const passed = git(dir, 'commit', '-q', '-m', 'test: add a fixture');
  assert.equal(passed.status, 0, passed.stderr);

  fs.appendFileSync(file, `"${email}"\n`);
  git(dir, 'add', 'tests/fixtures/customer.json');
  const changed = git(dir, 'commit', '-q', '-m', 'test: change the fixture');
  assert.notEqual(changed.status, 0);
  assert.match(changed.stderr, /tests\/fixtures\/customer\.json:7 +an email address/);
});

test('reserved domains, documentation numbers and everyday numbers pass', () => {
  const dir = repo();
  const lines = [
    'admin@example.com, reader@example.org, x@example.net, a@shop.example.com, b@host.test, c@no.invalid, d@dev.localhost',
    'logo@2x.png, react@19.3.1, version 4.168.0, the date 2026-11-26, the years 2025-2026',
    'a hash 8a0da4d4e75c5539cde9d56e7074422d, 100000 iterations, a limit of 500000000, a timestamp 1764192000000',
    'a seed 20261126, port 5173, a price 1234.56',
  ];
  fs.writeFileSync(path.join(dir, 'tests', 'fixtures', 'clean.txt'), lines.join('\n') + '\n');
  const r = scan(dir);
  assert.equal(r.status, 0, r.stderr);
});

test('the seeds and test data the project was born with pass', () => {
  const born = ['seeds/seed.sql', 'tests/helpers/test-data.ts', 'tests/BuddyApp.Api.Tests/SampleData.cs', 'docs/base-application.md']
    .filter(f => fs.existsSync(path.join(PROJECT, f)));
  assert.ok(born.length >= 2, `found ${born.join(', ')}`);
  const r = scan(PROJECT, ...born);
  assert.equal(r.status, 0, r.stderr);
});

test('a malformed allowlist stops the scan and says why', () => {
  const dir = repo();
  fs.writeFileSync(path.join(dir, '.personal-data-allow.json'), JSON.stringify({ allow: [{ path: 'a.txt', sha256: 'x' }] }));
  const r = scan(dir);
  assert.equal(r.status, 2);
  assert.match(r.stderr, /\.personal-data-allow\.json.*reason/);
});
