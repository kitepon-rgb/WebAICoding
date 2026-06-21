/**
 * スマホ記事一覧カード用の cover-sm.png（1:1）を全記事ぶん生成する。
 * mobile-covers.json（slug -> 短い見出し）を読み、generate-cover.js --mobile で各記事へ出力。
 *
 * 使い方（tools/cover で）:
 *   node gen-mobile-covers.js
 *
 * 新記事を足したら mobile-covers.json に「slug: 短見出し」を1行追加して再実行すればよい。
 * 1記事だけなら直接: node generate-cover.js --mobile "短見出し" "" "../../content/post/<slug>/cover-sm.png"
 */
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const map = JSON.parse(fs.readFileSync(path.join(__dirname, 'mobile-covers.json'), 'utf8'));
const repoRoot = path.resolve(__dirname, '..', '..');
let ok = 0, fail = 0;
for (const [slug, title] of Object.entries(map)) {
  if (slug.startsWith('_')) continue; // _comment をスキップ
  const out = path.join(repoRoot, 'content', 'post', slug, 'cover-sm.png');
  if (!fs.existsSync(path.dirname(out))) { console.error(`SKIP ${slug} (記事ディレクトリ無し)`); continue; }
  try {
    execFileSync('node', [path.join(__dirname, 'generate-cover.js'), '--mobile', title, '', out], { stdio: 'ignore' });
    if (fs.existsSync(out) && fs.statSync(out).size > 0) { ok++; console.log(`ok ${slug}  «${title}»`); }
    else { fail++; console.error(`EMPTY ${slug}`); }
  } catch (e) { fail++; console.error(`FAIL ${slug}: ${e.message}`); }
}
console.log(`\ndone: ${ok} ok, ${fail} fail`);
