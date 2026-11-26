// Installs the project's dependencies from its lock file, once, when the project is born (npm run setup).
// It starts `npm ci` itself, without npm's user configuration for allow-scripts, because npm passes that
// configuration down to a nested npm as environment variables and a project-scoped install refuses it.
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const env = Object.fromEntries(Object.entries(process.env).filter(([k]) => k.toLowerCase() !== 'npm_config_allow_scripts'));
const r = spawnSync('npm', ['ci'], { cwd: fileURLToPath(new URL('./', import.meta.url)), stdio: 'inherit', shell: process.platform === 'win32', env });
process.exit(r.status ?? 1);
