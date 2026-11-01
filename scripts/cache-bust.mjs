/**
 * Cache-busting pós-build para GitHub Pages.
 *
 * O Pages serve módulos ES com cache de alguns minutos. Como os imports
 * internos não herdam a query string da entrada, uma atualização podia
 * carregar `title.js`/`game.js` antigos mesmo com o HTML novo. Este script
 * versiona todas as importações relativas de `dist/` e a entrada do HTML.
 *
 * Uso: node scripts/cache-bust.mjs (já chamado por `npm run build`).
 */

import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const INDEX = path.join(ROOT, 'index.html');
const CSS = path.join(ROOT, 'styles', 'main.css');

const QUERY = /\?v=[0-9a-f]+/g;

const walk = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });

const stripVersion = (text) => text.replace(QUERY, '');

const read = (file) => fs.readFileSync(file, 'utf8');

const distFiles = walk(DIST).filter((file) => file.endsWith('.js')).sort();
const hash = createHash('sha256');

for (const file of distFiles) {
  hash.update(path.relative(ROOT, file).replaceAll('\\', '/'));
  hash.update('\0');
  hash.update(stripVersion(read(file)));
  hash.update('\0');
}
hash.update(stripVersion(read(INDEX)));
hash.update('\0');
hash.update(read(CSS));

const version = hash.digest('hex').slice(0, 12);

let changed = 0;

const importPattern =
  /(\b(?:from|import)\s*(?:\(\s*)?)(['"])(\.{1,2}\/[^'"]+?\.js)(?:\?v=[0-9a-f]+)?\2/g;

for (const file of distFiles) {
  const source = read(file);
  const next = source.replace(
    importPattern,
    (_match, prefix, quote, specifier) => `${prefix}${quote}${specifier}?v=${version}${quote}`,
  );
  if (next !== source) {
    fs.writeFileSync(file, next);
    changed += 1;
  }
}

const index = read(INDEX);
const nextIndex = index
  .replace(
    /(<script\s+type="module"\s+src="dist\/main\.js)(?:\?v=[0-9a-f]+)?(")/,
    `$1?v=${version}$2`,
  )
  .replace(
    /(<link\s+rel="stylesheet"\s+href="styles\/main\.css)(?:\?v=[0-9a-f]+)?(")/,
    `$1?v=${version}$2`,
  );

if (nextIndex !== index) {
  fs.writeFileSync(INDEX, nextIndex);
  changed += 1;
}

console.log(`cache-bust: v=${version} (${distFiles.length} módulos, ${changed} arquivos atualizados)`);
