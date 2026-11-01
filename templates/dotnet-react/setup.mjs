// Installs the web dependencies. It runs `npm ci` in web/ directly instead of a nested `npm --prefix web ci`,
// because npm passes its user configuration down to a nested npm as environment variables and some of them
// (allow-scripts) are refused in a project-scoped install.
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const env = Object.fromEntries(Object.entries(process.env).filter(([k]) => k.toLowerCase() !== 'npm_config_allow_scripts'));
const r = spawnSync('npm', ['ci'], { cwd: fileURLToPath(new URL('./web/', import.meta.url)), stdio: 'inherit', shell: process.platform === 'win32', env });
process.exit(r.status ?? 1);
