// Installs the project's dependencies from its lock file, once, when the project is born (npm run setup).
// It starts `npm ci` itself, without npm's user configuration for allow-scripts, because npm passes that
// configuration down to a nested npm as environment variables and a project-scoped install refuses it.
// First it makes git run the personal-data scan before each commit (standard SEC-8, .githooks/pre-commit).
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('./', import.meta.url));
const hook = spawnSync(process.execPath, ['scripts/scan-personal-data.mjs', '--install-hook'], { cwd: root, stdio: 'inherit' });
if (hook.status !== 0) process.exit(hook.status ?? 1);
const env = Object.fromEntries(Object.entries(process.env).filter(([k]) => k.toLowerCase() !== 'npm_config_allow_scripts'));
const r = spawnSync('npm', ['ci'], { cwd: root, stdio: 'inherit', shell: process.platform === 'win32', env });
process.exit(r.status ?? 1);
