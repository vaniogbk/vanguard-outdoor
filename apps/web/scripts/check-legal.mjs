// Lists the [BRACKETED] placeholders still present in the legal pages. Exit code 1 while any remain,
// so it can be used as a go-live gate:  npm run check:legal
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const file = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'src', 'lib', 'legal.ts');
const lines = fs.readFileSync(file, 'utf8').split('\n');
const start = lines.findIndex((l) => l.includes('*/')) + 1; // skip the header comment, which mentions the convention
const PLACEHOLDER = /\[[A-ZÀ-ÖØ-Þ0-9+][^\]\n]{1,80}\]/g; // TypeScript syntax and array literals never start like this

const found = [];
lines.slice(start).forEach((line, i) => {
  for (const m of line.matchAll(PLACEHOLDER)) found.push({ line: start + i + 1, text: m[0] });
});

if (!found.length) {
  console.log('✔ Legal pages: no placeholder left.');
  process.exit(0);
}
const distinct = [...new Set(found.map((f) => f.text))];
console.log(`✖ Legal pages: ${found.length} placeholder(s) left (${distinct.length} distinct):\n`);
for (const f of found) console.log(`  src/lib/legal.ts:${f.line}  ${f.text}`);
process.exit(1);
