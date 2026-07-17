#!/usr/bin/env node
// Hugoの記事本文からZenn本文を生成する。
//
//   node tools/zenn-sync/sync.mjs                 全記事の変更分を書き込む
//   node tools/zenn-sync/sync.mjs --slug <slug>   対象記事だけを書き込む
//   node tools/zenn-sync/sync.mjs --dry            変更対象だけ表示する
//   node tools/zenn-sync/sync.mjs --check          差分があれば非0終了する
//
// 設計の前提はAGENTS.mdとdocs/publishing.mdを参照する。

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { BLOG_TO_ZENN_SLUG, toZennSlug } from "../article-manifest.mjs";

const BLOG_BASE = "https://blog.kitepon.dev";
const BANNER =
  ":::message\n" +
  `この記事は [Claude Code 始めました](${BLOG_BASE}/) からの転載です。\n` +
  ":::";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../..");
const POST_DIR = path.join(REPO_ROOT, "content", "post");
const ARTICLES_DIR = path.join(REPO_ROOT, "articles");

export function splitFrontmatter(text, label) {
  const match = text.match(/^(---|\+\+\+)\r?\n([\s\S]*?)\r?\n\1\r?\n?/);
  if (!match) throw new Error(`frontmatterが見つからない: ${label}`);
  return {
    raw: match[2],
    fmBlock: `---\n${match[2]}\n---`,
    body: text.slice(match[0].length),
  };
}

export function validateZennFrontmatter(raw, slug, label) {
  const errors = [];
  if (!/^[a-z0-9_-]{12,50}$/.test(slug)) {
    errors.push(`slugは英小文字・数字・_・-の12〜50字: ${slug}`);
  }
  for (const key of ["title", "emoji", "type", "topics", "published"]) {
    if (!new RegExp(`^${key}:\\s*\\S`, "m").test(raw)) errors.push(`${key}が無い`);
  }
  const type = raw.match(/^type:\s*["']?([^"'\s]+)["']?\s*$/m)?.[1];
  if (type && !["tech", "idea"].includes(type)) errors.push(`typeが不正: ${type}`);
  if (!/^published:\s*(true|false)\s*$/m.test(raw)) {
    errors.push("publishedはtrueまたはfalseで指定する");
  }
  const topicsText = raw.match(/^topics:\s*(\[[^\n]*\])\s*$/m)?.[1];
  if (!topicsText) {
    errors.push("topicsはJSON互換の配列で指定する");
  } else {
    try {
      const topics = JSON.parse(topicsText);
      if (!Array.isArray(topics) || topics.length === 0) {
        errors.push("topicsは1件以上の配列にする");
      }
    } catch {
      errors.push("topicsを配列として解釈できない");
    }
  }
  if (errors.length) throw new Error(`${label}: ${errors.join(" / ")}`);
}

function relrefToUrl(ref) {
  const [rawCore, anchor] = ref.split("#");
  const core = rawCore.trim().replace(/^\//, "").replace(/^post\//, "").replace(/\/$/, "");
  const url = `${BLOG_BASE}/post/${core}/`;
  return anchor ? `${url}#${anchor}` : url;
}

function toImageUrl(url, blogSlug) {
  const value = url.trim();
  if (/^https?:\/\//.test(value)) return value;
  if (value.startsWith("/")) return `${BLOG_BASE}${value}`;
  return `${BLOG_BASE}/post/${blogSlug}/${value}`;
}

function transformOutsideFences(text, transform) {
  const lines = text.match(/.*(?:\n|$)/g)?.filter(Boolean) || [];
  const out = [];
  let plain = "";
  let fence = null;
  const flush = () => {
    if (plain) out.push(transform(plain));
    plain = "";
  };

  for (const line of lines) {
    const marker = line.match(/^\s*(`{3,}|~{3,})/)?.[1];
    if (!fence && marker) {
      flush();
      fence = marker[0];
      out.push(line);
      continue;
    }
    if (fence) {
      out.push(line);
      if (marker && marker[0] === fence) fence = null;
      continue;
    }
    plain += line;
  }
  flush();
  return out.join("");
}

function convertPlainBlock(block, blogSlug) {
  let out = block;
  out = out.replace(
    /\{\{<\s*relref\s+["']([^"']+)["']\s*>\}\}/g,
    (_match, ref) => relrefToUrl(ref),
  );
  out = out.replace(/\{\{<\s*linkcard\s+([\s\S]*?)>\}\}/g, (match, args) => {
    const url = args.match(/url=["']([^"']+)["']/)?.[1];
    if (!url) throw new Error(`linkcardにurlが無い (${blogSlug}): ${match}`);
    return `@[card](${url})`;
  });
  out = out.replace(
    /!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g,
    (_match, alt, url) => {
      const absolute = toImageUrl(url, blogSlug);
      const caption = alt.trim() ? `\n*${alt.trim()}*` : "";
      return `![${alt}](${absolute})${caption}`;
    },
  );
  const leftover = out.match(/\{\{[<%][\s\S]*?[%>]\}\}/);
  if (leftover) {
    throw new Error(`未対応のショートコードが残存 (${blogSlug}): ${leftover[0]}`);
  }
  return out;
}

export function convertBody(body, blogSlug) {
  return transformOutsideFences(body, (block) => convertPlainBlock(block, blogSlug));
}

function listBlogSlugs() {
  return fs
    .readdirSync(POST_DIR, { withFileTypes: true })
    .filter(
      (entry) =>
        entry.isDirectory() && fs.existsSync(path.join(POST_DIR, entry.name, "index.md")),
    )
    .map((entry) => entry.name)
    .sort();
}

function validateManifest(blogSlugs) {
  const blogSet = new Set(blogSlugs);
  const unknown = Object.keys(BLOG_TO_ZENN_SLUG).filter((slug) => !blogSet.has(slug));
  if (unknown.length) {
    throw new Error(`article manifestに存在しないブログslugがある: ${unknown.join(", ")}`);
  }
}

function validateArticleSet(blogSlugs) {
  const expected = new Set(blogSlugs.map((slug) => `${toZennSlug(slug)}.md`));
  const actual = fs.readdirSync(ARTICLES_DIR).filter((name) => name.endsWith(".md"));
  const missing = [...expected].filter((name) => !actual.includes(name));
  const orphan = actual.filter((name) => !expected.has(name));
  if (missing.length || orphan.length) {
    throw new Error(
      [
        missing.length ? `Zennファイル欠落: ${missing.join(", ")}` : "",
        orphan.length ? `Zenn孤児: ${orphan.join(", ")}` : "",
      ].filter(Boolean).join(" / "),
    );
  }
}

function buildMapping(blogSlugs, selectedSlug) {
  validateManifest(blogSlugs);
  if (selectedSlug && !blogSlugs.includes(selectedSlug)) {
    throw new Error(`Hugo記事が無い: ${selectedSlug}`);
  }
  const targets = selectedSlug ? [selectedSlug] : blogSlugs;
  return targets.map((blogSlug) => ({
    blogSlug,
    zennSlug: toZennSlug(blogSlug),
    zennPath: path.join(ARTICLES_DIR, `${toZennSlug(blogSlug)}.md`),
  }));
}

function prepareOutputs(mapping) {
  return mapping.map(({ blogSlug, zennSlug, zennPath }) => {
    if (!fs.existsSync(zennPath)) {
      throw new Error(`Zennファイルが無い: ${blogSlug} -> articles/${zennSlug}.md`);
    }
    const hugoText = fs.readFileSync(path.join(POST_DIR, blogSlug, "index.md"), "utf8");
    const zennText = fs.readFileSync(zennPath, "utf8");
    const hugo = splitFrontmatter(hugoText, `content/post/${blogSlug}/index.md`);
    const zenn = splitFrontmatter(zennText, `articles/${zennSlug}.md`);
    validateZennFrontmatter(zenn.raw, zennSlug, `articles/${zennSlug}.md`);
    const converted = convertBody(hugo.body, blogSlug).trim();
    const expected = `${zenn.fmBlock}\n\n${BANNER}\n\n${converted}\n`;
    return { blogSlug, zennSlug, zennPath, current: zennText, expected };
  });
}

export function parseArgs(argv) {
  const args = { dry: false, check: false, slug: null };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--dry") args.dry = true;
    else if (arg === "--check") args.check = true;
    else if (arg === "--slug") {
      args.slug = argv[index + 1];
      index += 1;
      if (!args.slug || args.slug.startsWith("--")) {
        throw new Error("--slugにはブログslugが必要");
      }
    } else throw new Error(`未知の引数: ${arg}`);
  }
  if (args.dry && args.check) throw new Error("--dryと--checkは同時に指定できない");
  return args;
}

export function run(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  const blogSlugs = listBlogSlugs();
  if (!args.slug) validateArticleSet(blogSlugs);
  const outputs = prepareOutputs(buildMapping(blogSlugs, args.slug));
  const changed = outputs.filter((item) => item.current !== item.expected);

  for (const item of changed) {
    const prefix = args.check ? "[差分]" : args.dry ? "[dry]" : "[write]";
    console.log(`${prefix} ${item.blogSlug} -> articles/${item.zennSlug}.md`);
  }

  if (args.check) {
    if (changed.length) {
      console.error(`✗ Zenn同期差分 ${changed.length}件`);
      return 1;
    }
    console.log(`✓ Zenn同期済み: ${outputs.length}記事`);
    return 0;
  }
  if (args.dry) {
    console.log(`dry-run: 変更 ${changed.length}件 / 対象 ${outputs.length}件`);
    return 0;
  }

  // 全対象の変換と検証が完了した後で、変更ファイルだけを書き込む。
  for (const item of changed) fs.writeFileSync(item.zennPath, item.expected);
  console.log(`✓ ${changed.length}/${outputs.length}記事を再生成`);
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    process.exitCode = run();
  } catch (error) {
    console.error(`✗ ${error.message}`);
    process.exitCode = 1;
  }
}
