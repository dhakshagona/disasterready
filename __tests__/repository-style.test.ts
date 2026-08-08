import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { extname } from 'node:path';

import { describe, expect, it } from '@jest/globals';

const textExtensions = new Set([
  '.cjs', '.css', '.html', '.js', '.jsx', '.json', '.md', '.mjs', '.scss',
  '.ts', '.tsx', '.txt', '.xml', '.yaml', '.yml',
]);
const excludedPaths = ['package-lock.json'];
const excludedPrefixes = ['.expo/', 'coverage/', 'dist/', 'node_modules/'];

function projectAuthoredTextFiles(): string[] {
  return execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' })
    .split('\0')
    .filter(Boolean)
    .filter((file) => !excludedPaths.includes(file))
    .filter((file) => !excludedPrefixes.some((prefix) => file.startsWith(prefix)))
    .filter((file) => textExtensions.has(extname(file)));
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
