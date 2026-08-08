import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { extname } from 'node:path';

import { describe, expect, it } from '@jest/globals';

const textExtensions = new Set([
  '.cjs', '.css', '.html', '.js', '.jsx', '.json', '.md', '.mjs', '.scss',
  '.sql', '.toml', '.ts', '.tsx', '.txt', '.xml', '.yaml', '.yml',
]);
const excludedPaths = ['package-lock.json'];
const includedNames = ['.env.example'];
const excludedPrefixes = ['.expo/', 'android/', 'coverage/', 'dist/', 'ios/', 'node_modules/', 'reference/', 'web-build/'];

function projectAuthoredTextFiles(): string[] {
  return execFileSync('git', ['ls-files', '-co', '--exclude-standard', '-z'], { encoding: 'utf8' })
    .split('\0')
    .filter(Boolean)
    .filter((file) => existsSync(file))
    .filter((file) => !excludedPaths.includes(file))
    .filter((file) => !excludedPrefixes.some((prefix) => file.startsWith(prefix)))
    .filter((file) => includedNames.includes(file) || textExtensions.has(extname(file)));
}

describe('repository style', () => {
  it('contains no Unicode em dashes in project-authored text', () => {
    const forbiddenCharacter = String.fromCodePoint(0x2014);
    const violations = projectAuthoredTextFiles().flatMap((file) => {
      const lines = readFileSync(file, 'utf8').split(/\r?\n/);
      return lines.flatMap((line, index) => line.includes(forbiddenCharacter) ? [`${file}:${index + 1}`] : []);
    });

    expect(violations).toEqual([]);
  });
});
