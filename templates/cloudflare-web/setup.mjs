// Installs the project's dependencies from its lock file, once, when the project is born (npm run setup).
// It starts `npm ci` itself, without npm's user configuration for allow-scripts, because npm passes that
// configuration down to a nested npm as environment variables and a project-scoped install refuses it.
// First it checks the machine has what the project needs (scripts/check-prerequisites.mjs), then it makes git run the personal-data scan before each commit (standard SEC-8, .githooks/pre-commit).
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('./', import.meta.url));
// First, what the machine needs (npm run prerequisites): a missing or old tool stops setup, naming it and how to install it. In CI the pipeline
// brings its own tools after setup, so the check is left to the machines where people build.
if (process.env.CI || process.env.TF_BUILD) console.log('CI: the prerequisites check is skipped; the pipeline installs its own tools.');
else {
  const pre = spawnSync(process.execPath, ['scripts/check-prerequisites.mjs'], { cwd: root, stdio: 'inherit' });
  if (pre.status !== 0) process.exit(pre.status ?? 1);
}
const hook = spawnSync(process.execPath, ['scripts/scan-personal-data.mjs', '--install-hook'], { cwd: root, stdio: 'inherit' });
if (hook.status !== 0) process.exit(hook.status ?? 1);
const env = Object.fromEntries(Object.entries(process.env).filter(([k]) => k.toLowerCase() !== 'npm_config_allow_scripts'));
const r = spawnSync('npm', ['ci'], { cwd: root, stdio: 'inherit', shell: process.platform === 'win32', env });
process.exit(r.status ?? 1);
