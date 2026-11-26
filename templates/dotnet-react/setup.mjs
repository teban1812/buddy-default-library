// Installs the web dependencies. It runs `npm ci` in web/ directly instead of a nested `npm --prefix web ci`,
// because npm passes its user configuration down to a nested npm as environment variables and some of them
// (allow-scripts) are refused in a project-scoped install. First it makes git run the personal-data scan before each
// commit (standard SEC-8, .githooks/pre-commit).
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('./', import.meta.url));
const hook = spawnSync(process.execPath, ['scripts/scan-personal-data.mjs', '--install-hook'], { cwd: root, stdio: 'inherit' });
if (hook.status !== 0) process.exit(hook.status ?? 1);
const env = Object.fromEntries(Object.entries(process.env).filter(([k]) => k.toLowerCase() !== 'npm_config_allow_scripts'));
const r = spawnSync('npm', ['ci'], { cwd: fileURLToPath(new URL('./web/', import.meta.url)), stdio: 'inherit', shell: process.platform === 'win32', env });
process.exit(r.status ?? 1);
