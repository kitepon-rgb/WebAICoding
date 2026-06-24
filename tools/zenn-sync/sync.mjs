#!/usr/bin/env node
// Hugo のブログ本文（content/post/<slug>/index.md）から Zenn 本文（articles/<slug>.md）を
// 再生成する。本文画像・linkcard・relref などブログ独自のリッチ化要素を Zenn 記法へ変換し、
// Zenn 固有の frontmatter（emoji/topics 等）は既存ファイルからそのまま温存する。
//
// 使い方:  node tools/zenn-sync/sync.mjs            （articles/ を書き換える）
//          node tools/zenn-sync/sync.mjs --dry      （書き換えず差分対象だけ報告）
//
// 設計の前提（CLAUDE.md / plan 参照）:
//  - Zenn はリポジトリ「ルート直下」の articles/ しか読まない（mono-repo 同居）
//  - 画像は唯一のソース＝ブログ絶対URL（https://blog.kitepon.dev/post/<slug>/<file>）に統一
//  - キャプションは alt ではなく画像直下の *テキスト* 行（Hugo の figcaption を再現）
//  - linkカードは @[card](URL)
//  - 未対応の Hugo ショートコードが残ったら「黙って素通し」せずエラーで停止する

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const BLOG_BASE = "https://blog.kitepon.dev";

// ブログ slug（content/post のディレクトリ名）→ Zenn ファイル名。
// 初期記事は slug が異なる。.github/scripts/crosspost-devto.mjs の同名表と一致させること。
const BLOG_TO_ZENN_SLUG = {
  "claude-code-features": "claude-code-half-features",
  "claude-code-deploy": "claude-code-ssh-deploy",
  "max-plan-review": "claude-max-plan-review",
  "claude-research-implementation": "claude-research-from-papers",
  "livetr-app": "livetr-realtime-translator",
  "bughub": "bughub-aggregation",
};

const BANNER =
  ":::message\n" +
  `この記事は [Claude Code 始めました](${BLOG_BASE}/) からの転載です。\n` +
  ":::";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../..");
const POST_DIR = path.join(REPO_ROOT, "content", "post");
const ARTICLES_DIR = path.join(REPO_ROOT, "articles");

// --- frontmatter を分離（Hugo は YAML(---) と TOML(+++) が混在。Zenn は常に ---） ---
function splitFrontmatter(text, label) {
  const m = text.match(/^(---|\+\+\+)\r?\n([\s\S]*?)\r?\n\1\r?\n?/);
  if (!m) throw new Error(`frontmatter が見つからない: ${label}`);
  // fmBlock は Zenn 側でのみ使う（Zenn は YAML 固定なので --- で再構成）
  return { fmBlock: `---\n${m[2]}\n---`, body: text.slice(m[0].length) };
}

// --- relref → ブログ絶対URL ---
function relrefToUrl(ref) {
  const [rawCore, anchor] = ref.split("#");
  const core = rawCore
    .trim()
    .replace(/^\//, "")
    .replace(/^post\//, "")
    .replace(/\/$/, "");
  const url = `${BLOG_BASE}/post/${core}/`;
  return anchor ? `${url}#${anchor}` : url;
}

// --- 画像URL: 相対→ブログ絶対URL、絶対パスは host 補完、http(s) はそのまま ---
function toImageUrl(url, hugoSlug) {
  const u = url.trim();
  if (/^https?:\/\//.test(u)) return u;
  if (u.startsWith("/")) return `${BLOG_BASE}${u}`;
  return `${BLOG_BASE}/post/${hugoSlug}/${u}`;
}

function convertBody(body, hugoSlug) {
  let out = body;

  // relref ショートコード（"..." / '...'）→ 絶対URL
  out = out.replace(
    /\{\{<\s*relref\s+["']([^"']+)["']\s*>\}\}/g,
    (_m, ref) => relrefToUrl(ref),
  );

  // linkcard ショートコード → @[card](url)
  out = out.replace(/\{\{<\s*linkcard\s+([\s\S]*?)>\}\}/g, (m, args) => {
    const um = args.match(/url=["']([^"']+)["']/);
    if (!um) throw new Error(`linkcard に url が無い (${hugoSlug}): ${m}`);
    return `@[card](${um[1]})`;
  });

  // 本文画像 ![alt](url ["title"]) → 絶対URL化 ＋ 直下に *alt*（figcaption 再現）
  out = out.replace(
    /!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g,
    (_m, alt, url) => {
      const newUrl = toImageUrl(url, hugoSlug);
      const cap = alt.trim() ? `\n*${alt.trim()}*` : "";
      return `![${alt}](${newUrl})${cap}`;
    },
  );

  // フォールバック禁止: 変換し残した Hugo ショートコードがあれば停止
  const leftover = out.match(/\{\{[<%][\s\S]{0,60}?[%>]\}\}/);
  if (leftover) {
    throw new Error(`未対応のショートコードが残存 (${hugoSlug}): ${leftover[0]}`);
  }
  return out;
}

function main() {
  const dryRun = process.argv.includes("--dry");

  // content/post の記事ディレクトリ（index.md を持つもの）
  const hugoSlugs = fs
    .readdirSync(POST_DIR, { withFileTypes: true })
    .filter(
      (d) =>
        d.isDirectory() &&
        fs.existsSync(path.join(POST_DIR, d.name, "index.md")),
    )
    .map((d) => d.name)
    .sort();

  // 検証: 全 Hugo 記事に対応する Zenn ファイルがあるか / Zenn 側に孤児が無いか
  const errors = [];
  const mapping = [];
  const coveredZenn = new Set();
  for (const hugoSlug of hugoSlugs) {
    const zennSlug = BLOG_TO_ZENN_SLUG[hugoSlug] || hugoSlug;
    const zennPath = path.join(ARTICLES_DIR, `${zennSlug}.md`);
    if (!fs.existsSync(zennPath)) {
      errors.push(`Zenn ファイルが無い: ${hugoSlug} -> articles/${zennSlug}.md`);
    } else {
      coveredZenn.add(`${zennSlug}.md`);
    }
    mapping.push({ hugoSlug, zennSlug, zennPath });
  }
  const orphanZenn = fs
    .readdirSync(ARTICLES_DIR)
    .filter((f) => f.endsWith(".md") && !coveredZenn.has(f));
  for (const o of orphanZenn) {
    errors.push(`対応する Hugo 記事が無い Zenn ファイル（孤児）: articles/${o}`);
  }
  if (errors.length) {
    console.error("✗ 同期前チェックに失敗（何も書き換えていない）:");
    for (const e of errors) console.error("  - " + e);
    process.exit(1);
  }

  // 変換 → 書き戻し
  let written = 0;
  for (const { hugoSlug, zennSlug, zennPath } of mapping) {
    const hugoText = fs.readFileSync(
      path.join(POST_DIR, hugoSlug, "index.md"),
      "utf8",
    );
    const { body: hugoBody } = splitFrontmatter(hugoText, `content/post/${hugoSlug}`);
    const { fmBlock: zennFm } = splitFrontmatter(
      fs.readFileSync(zennPath, "utf8"),
      `articles/${zennSlug}.md`,
    );

    const converted = convertBody(hugoBody, hugoSlug).trim();
    const finalText = `${zennFm}\n\n${BANNER}\n\n${converted}\n`;

    if (dryRun) {
      console.log(`[dry] ${hugoSlug} -> articles/${zennSlug}.md`);
    } else {
      fs.writeFileSync(zennPath, finalText);
      written++;
    }
  }

  console.log(
    dryRun
      ? `dry-run: ${mapping.length} 記事を対象（書き換えなし）。孤児0・未対応0。`
      : `✓ ${written}/${mapping.length} 記事を再生成。孤児0・未対応0。`,
  );
  const renamed = mapping.filter((m) => m.hugoSlug !== m.zennSlug);
  console.log(
    `  スラッグ差異 ${renamed.length} 件: ` +
      renamed.map((m) => `${m.hugoSlug}→${m.zennSlug}`).join(", "),
  );
}

main();
