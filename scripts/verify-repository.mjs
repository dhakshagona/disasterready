import { spawnSync } from 'node:child_process';

const isWindows = process.platform === 'win32';
const command = isWindows ? (process.env.ComSpec ?? 'cmd.exe') : 'npm';
const prefix = isWindows ? ['/d', '/s', '/c', 'npm'] : [];
const checks = [
  ['run', 'lint'],
  ['run', 'typecheck'],
  ['test', '--', '--runInBand'],
  ['run', 'check:style'],
  ['run', 'build:web'],
];

for (const args of checks) {
  const result = spawnSync(command, [...prefix, ...args], { stdio: 'inherit' });
  if (result.error) {
    console.error(result.error.message);
    process.exit(1);
  }
  if (result.status !== 0) process.exit(result.status ?? 1);
}

console.log('Release verification passed.');
