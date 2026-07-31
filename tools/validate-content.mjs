#!/usr/bin/env node
// ブログ、Zenn、画像、台帳の整合を変更なしで検査する。

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { BLOG_TO_ZENN_SLUG, toZennSlug } from "./article-manifest.mjs";
import { splitFrontmatter, validateZennFrontmatter } from "./zenn-sync/sync.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
const POST_DIR = path.join(REPO_ROOT, "content", "post");
const ARTICLES_DIR = path.join(REPO_ROOT, "articles");
const MOBILE_MAP = path.join(REPO_ROOT, "tools", "cover", "mobile-covers.json");

function unquote(value = "") {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

export function parseHugoFrontmatter(text, label) {
  const match = text.match(/^(---|\+\+\+)\r?\n([\s\S]*?)\r?\n\1\r?\n?/);
  if (!match) throw new Error(`${label}: frontmatterが無い`);
  const raw = match[2];
  const get = (key) =>
    raw.match(new RegExp(`^${key}\\s*[:=]\\s*(.+?)\\s*$`, "m"))?.[1];
  return {
    raw,
    body: text.slice(match[0].length),
    title: unquote(get("title")),
    date: unquote(get("date")),
    draft: get("draft")?.trim(),
    description: unquote(get("description")),
    tags: get("tags")?.trim(),
    coverImage: unquote(raw.match(/^\s*image\s*[:=]\s*(.+?)\s*$/m)?.[1]),
  };
}

export function validateHugoMeta(meta, label, now = new Date()) {
  const errors = [];
  for (const key of ["title", "date", "draft", "description", "tags", "coverImage"]) {
    if (!meta[key]) errors.push(`${key}が無い`);
  }
  if (meta.draft && !["true", "false"].includes(meta.draft)) {
    errors.push("draftはtrueまたはfalseで指定する");
  }
  if (meta.coverImage && meta.coverImage !== "cover.png") {
    errors.push(`cover.imageはcover.pngにする: ${meta.coverImage}`);
  }
  if (meta.tags && !/^\[[\s\S]*\]$/.test(meta.tags)) {
    errors.push("tagsは配列で指定する");
  }
  if (meta.date) {
    const date = new Date(meta.date);
    if (Number.isNaN(date.getTime())) errors.push(`dateを解釈できない: ${meta.date}`);
    else if (meta.draft === "false" && date.getTime() > now.getTime()) {
      errors.push(`公開記事が未来日付: ${meta.date}`);
    }
  }
  if (errors.length) throw new Error(`${label}: ${errors.join(" / ")}`);
}

export function pngDimensions(file) {
  const buffer = fs.readFileSync(file);
  const signature = "89504e470d0a1a0a";
  if (buffer.length < 24 || buffer.subarray(0, 8).toString("hex") !== signature) {
    throw new Error(`PNGではない: ${path.relative(REPO_ROOT, file)}`);
  }
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

export function validatePngFile(file, width, height) {
  if (!fs.existsSync(file)) throw new Error(`画像が無い: ${path.relative(REPO_ROOT, file)}`);
  const actual = pngDimensions(file);
  if (actual.width !== width || actual.height !== height) {
    throw new Error(
      `画像寸法が不正: ${path.relative(REPO_ROOT, file)} ${actual.width}x${actual.height} (期待 ${width}x${height})`,
    );
  }
}

function assertPng(file, width, height, errors) {
  try {
    validatePngFile(file, width, height);
  } catch (error) {
    errors.push(error.message);
  }
}

function outsideFences(text) {
  const lines = text.match(/.*(?:\n|$)/g)?.filter(Boolean) || [];
  let fence = null;
  return lines
    .map((line) => {
      const marker = line.match(/^\s*(`{3,}|~{3,})/)?.[1];
      if (!fence && marker) {
        fence = marker[0];
        return "";
      }
      if (fence) {
        if (marker && marker[0] === fence) fence = null;
        return "";
      }
      return line;
    })
    .join("");
}

function validateBodyReferences(body, bundleDir, blogSlugs, errors) {
  const plain = outsideFences(body);
  for (const match of plain.matchAll(/!\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g)) {
    const url = match[1];
    if (/^https?:\/\//.test(url)) continue;
    const file = url.startsWith("/")
      ? path.join(REPO_ROOT, "static", url.slice(1))
      : path.join(bundleDir, url);
    if (!fs.existsSync(file)) errors.push(`本文画像が無い: ${path.relative(REPO_ROOT, file)}`);
  }
  for (const match of plain.matchAll(/\{\{<\s*linkcard\s+([\s\S]*?)>\}\}/g)) {
    const image = match[1].match(/image=["']([^"']+)["']/)?.[1];
    if (!image || /^https?:\/\//.test(image)) continue;
    const file = image.startsWith("/")
      ? path.join(REPO_ROOT, "static", image.slice(1))
      : path.join(bundleDir, image);
    if (!fs.existsSync(file)) errors.push(`linkcard画像が無い: ${path.relative(REPO_ROOT, file)}`);
  }
  for (const match of plain.matchAll(/\{\{<\s*relref\s+["']([^"'#]+)(?:#[^"']+)?["']\s*>\}\}/g)) {
    const slug = match[1].replace(/^\/?post\//, "").replace(/\/$/, "");
    if (!blogSlugs.has(slug)) errors.push(`relref先の記事が無い: ${slug}`);
  }
}

function readMobileMap() {
  let value;
  try {
    value = JSON.parse(fs.readFileSync(MOBILE_MAP, "utf8"));
  } catch (error) {
    throw new Error(`mobile-covers.jsonが不正: ${error.message}`);
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("mobile-covers.jsonはobjectである必要がある");
  }
  return new Set(Object.keys(value).filter((key) => !key.startsWith("_")));
}

export function renderedOgDimensions(html, label) {
  const width = html.match(/property="og:image:width"\s+content="(\d+)"/)?.[1];
  const height = html.match(/property="og:image:height"\s+content="(\d+)"/)?.[1];
  if (!width || !height) throw new Error(`${label}: OGP画像寸法が無い`);
  return { width: Number(width), height: Number(height) };
}

export function renderedHeadingJumps(html) {
  const levels = [...html.matchAll(/<h([1-6])(?:\s[^>]*)?>/gi)].map((match) =>
    Number(match[1]),
  );
  return levels
    .slice(1)
    .map((level, index) => ({ from: levels[index], to: level }))
    .filter(({ from, to }) => to > from + 1);
}

function validateAnalyticsCoverage(html, label, expectedPageType, errors) {
  for (const [name, pattern] of [
    ["共通page分類", /data-kitepon-page=(?:["']v1["']|v1)(?:\s|>)/],
    [
      "page type",
      new RegExp(`data-page-type=(?:["']${expectedPageType}["']|${expectedPageType})(?:\\s|>)`),
    ],
    ["content group", /data-content-group=(?:["']blog["']|blog)(?:\s|>)/],
    [
      "GoatCounter",
      /data-goatcounter=(?:["']https:\/\/claudecode-blog\.goatcounter\.com\/count["']|https:\/\/claudecode-blog\.goatcounter\.com\/count)(?:\s|>)/,
    ],
    ["共通event adapter", /src=(?:["']\/analytics\/v1\.js["']|\/analytics\/v1\.js)(?:\s|>)/],
  ]) {
    if (!pattern.test(html)) errors.push(`${label}に${name}が無い`);
  }
}

export function validateContent({ rendered = false, now = new Date() } = {}) {
  const errors = [];
  const posts = fs
    .readdirSync(POST_DIR, { withFileTypes: true })
    .filter(
      (entry) =>
        entry.isDirectory() && fs.existsSync(path.join(POST_DIR, entry.name, "index.md")),
    )
    .map((entry) => entry.name)
    .sort();
  const blogSlugs = new Set(posts);
  const mobileSlugs = readMobileMap();

  for (const mapped of Object.keys(BLOG_TO_ZENN_SLUG)) {
    if (!blogSlugs.has(mapped)) errors.push(`manifestに存在しないブログslug: ${mapped}`);
  }
  const expectedZenn = new Set(posts.map((slug) => toZennSlug(slug)));
  const actualZenn = new Set(
    fs.readdirSync(ARTICLES_DIR).filter((name) => name.endsWith(".md")).map((name) => name.slice(0, -3)),
  );

  for (const slug of posts) {
    const bundleDir = path.join(POST_DIR, slug);
    try {
      const text = fs.readFileSync(path.join(bundleDir, "index.md"), "utf8");
      const meta = parseHugoFrontmatter(text, slug);
      validateHugoMeta(meta, `content/post/${slug}/index.md`, now);
      validateBodyReferences(meta.body, bundleDir, blogSlugs, errors);
      if (rendered && meta.draft === "false") {
        const html = path.join(REPO_ROOT, "public", "post", slug, "index.html");
        if (!fs.existsSync(html)) {
          errors.push(`公開HTMLが無い: public/post/${slug}/index.html`);
        } else {
          try {
            const og = renderedOgDimensions(fs.readFileSync(html, "utf8"), `public/post/${slug}/index.html`);
            if (og.width !== 1250 || og.height !== 500) {
              errors.push(`記事OGP寸法が不正: ${slug} ${og.width}x${og.height}`);
            }
            validateAnalyticsCoverage(
              fs.readFileSync(html, "utf8"),
              `public/post/${slug}/index.html`,
              "article",
              errors,
            );
          } catch (error) {
            errors.push(error.message);
          }
        }
      }
    } catch (error) {
      errors.push(error.message);
    }

    assertPng(path.join(bundleDir, "cover.png"), 1250, 500, errors);
    assertPng(path.join(bundleDir, "cover-sm.png"), 1080, 1080, errors);
    if (!mobileSlugs.has(slug)) errors.push(`mobile cover mappingが無い: ${slug}`);

    const zennSlug = toZennSlug(slug);
    const zennFile = path.join(ARTICLES_DIR, `${zennSlug}.md`);
    if (!fs.existsSync(zennFile)) {
      errors.push(`Zenn記事が無い: ${slug} -> ${zennSlug}`);
    } else {
      try {
        const zenn = splitFrontmatter(fs.readFileSync(zennFile, "utf8"), `articles/${zennSlug}.md`);
        validateZennFrontmatter(zenn.raw, zennSlug, `articles/${zennSlug}.md`);
      } catch (error) {
        errors.push(error.message);
      }
    }
  }

  for (const slug of mobileSlugs) {
    if (!blogSlugs.has(slug)) errors.push(`mobile cover mappingの孤児: ${slug}`);
  }
  for (const slug of actualZenn) {
    if (!expectedZenn.has(slug)) errors.push(`Zenn記事の孤児: ${slug}`);
  }
  if (rendered) {
    const home = path.join(REPO_ROOT, "public", "index.html");
    if (!fs.existsSync(home)) {
      errors.push("公開HTMLが無い: public/index.html");
    } else {
      try {
        const homeHtml = fs.readFileSync(home, "utf8");
        const og = renderedOgDimensions(homeHtml, "public/index.html");
        if (og.width !== 1200 || og.height !== 630) {
          errors.push(`既定OGP寸法が不正: ${og.width}x${og.height}`);
        }
        validateAnalyticsCoverage(homeHtml, "public/index.html", "blog_index", errors);
      } catch (error) {
        errors.push(error.message);
      }
      if (renderedHeadingJumps(fs.readFileSync(home, "utf8")).length) {
        errors.push("ブログトップの見出し階層が飛んでいる");
      }
    }

    const postList = path.join(REPO_ROOT, "public", "post", "index.html");
    if (!fs.existsSync(postList)) {
      errors.push("公開HTMLが無い: public/post/index.html");
    } else {
      const html = fs.readFileSync(postList, "utf8");
      if (renderedHeadingJumps(html).length) {
        errors.push("記事一覧の見出し階層が飛んでいる");
      }
      for (const [label, pattern] of [
        ["ブランド名を含むtitle", /<title>記事一覧｜kitepon\.dev Blog<\/title>/],
        ["一覧のh1", /<h1>記事一覧<\/h1>/],
        ["一覧のcanonical", /<link rel=canonical href=https:\/\/kitepon\.dev\/blog\/post\/>/],
        ["一覧のOG種別", /<meta property=["']?og:type["']? content=["']?website["']?>/],
        ["cache-bust済み共有画像", /<meta property=["']?og:image["']? content=["']?https:\/\/kitepon\.dev\/blog\/og-card-brand\.png["']?>/],
        ["共有画像alt", /<meta property=["']?og:image:alt["']? content="kitepon\.dev Blog — AIコーディングと個人開発の実践記録">/],
      ]) {
        if (!pattern.test(html)) errors.push(`記事一覧に${label}が無い`);
      }
    }

    const notFound = path.join(REPO_ROOT, "public", "404.html");
    if (!fs.existsSync(notFound)) {
      errors.push("公開HTMLが無い: public/404.html");
    } else {
      const html = fs.readFileSync(notFound, "utf8");
      for (const [label, pattern] of [
        ["404見出し", /このページは[\s\S]*見つかりませんでした/],
        [
          "404 noindex",
          /<meta(?=[^>]*name=robots)(?=[^>]*content="noindex, follow")[^>]*>/,
        ],
        ["記事一覧への復帰", /href=["']?\/blog\/["']?/],
        ["kitepon.devへの復帰", /href=["']?https:\/\/kitepon\.dev\/["']?/],
        ["共通wordmark", /brand\/kitepon-dev-primary\.png/],
      ]) {
        if (!pattern.test(html)) errors.push(`404に${label}が無い`);
      }
      validateAnalyticsCoverage(html, "public/404.html", "not_found", errors);
      if (!/data-kitepon-event=(?:["']not_found_recovery["']|not_found_recovery)(?:\s|>)/.test(html)) {
        errors.push("404に復帰eventが無い");
      }
    }
  }

  if (errors.length) {
    throw new Error(`公開前検査に失敗 (${errors.length}件):\n- ${errors.join("\n- ")}`);
  }
  return { posts: posts.length, zenn: actualZenn.size, mobile: mobileSlugs.size };
}

export function run(argv = process.argv.slice(2)) {
  const unknown = argv.filter((arg) => arg !== "--rendered");
  if (unknown.length) throw new Error(`未知の引数: ${unknown.join(" ")}`);
  const result = validateContent({ rendered: argv.includes("--rendered") });
  console.log(`✓ content preflight: posts=${result.posts} zenn=${result.zenn} mobile=${result.mobile}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    run();
  } catch (error) {
    console.error(`✗ ${error.message}`);
    process.exit(1);
  }
}
