#!/usr/bin/env node
// Zennの英語自動翻訳記事をdev.toへ転載する。
//
// workflowは次の二相で動く。
//   1. --prepare: posting予約を台帳へ保存する。workflowがmainへpushする。
//   2. --send-new: 同じworkflow runの予約だけをPOSTし、台帳をpublishedへ更新する。
//
// 次runにpostingが残っていた場合、遠隔canonical_urlを照合する。1件なら台帳を
// 回復し、0件・複数件なら自動POSTせず停止する。

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import TurndownService from "turndown";
import { gfm } from "turndown-plugin-gfm";
import { toBlogSlug, toZennSlug } from "../../tools/article-manifest.mjs";

const ZENN_USER = "kitepon";
const DEVTO_API = "https://dev.to/api/articles";
const UA = "WebAICoding dev.to crosspost (+https://github.com/kitepon/WebAICoding)";
const WRITE_GAP_MS = 5000;
const ZENN_FETCH_GAP_MS = 1000;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../..");
const POST_DIR = path.join(REPO_ROOT, "content", "post");
const ARTICLES_DIR = path.join(REPO_ROOT, "articles");
const STATE_FILE = path.join(REPO_ROOT, "crossposted-devto.json");

const INTERNAL_LINK_RE =
  /\]\(https:\/\/(?:kitepon-rgb\.github\.io\/WebAICoding|blog\.kitepon\.dev|kitepon\.dev\/blog)\/post\/([a-z0-9-]+)\/(#[^)]+)?\)/g;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const turndown = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
  bulletListMarker: "-",
});
turndown.use(gfm);
turndown.addRule("stripAnchorLinks", {
  filter: (node) =>
    node.nodeName === "A" && (node.getAttribute("href") || "").startsWith("#"),
  replacement: () => "",
});
turndown.addRule("stripReprintNotice", {
  filter: (node) =>
    node.nodeName === "ASIDE" &&
    (node.getAttribute("class") || "").includes("msg") &&
    /kitepon-rgb\.github\.io\/WebAICoding|blog\.kitepon\.dev/.test(node.innerHTML || ""),
  replacement: () => "",
});

export function findArticle(node, requestedSlug) {
  if (Array.isArray(node)) {
    for (const value of node) {
      const found = findArticle(value, requestedSlug);
      if (found) return found;
    }
    return null;
  }
  if (!node || typeof node !== "object") return null;
  if ("isTranslated" in node && "bodyHtml" in node) {
    const slug = node.slug || String(node.path || "").split("/").filter(Boolean).at(-1);
    if (slug === requestedSlug) return node;
  }
  for (const value of Object.values(node)) {
    const found = findArticle(value, requestedSlug);
    if (found) return found;
  }
  return null;
}

export function htmlToMarkdown(html) {
  return turndown.turndown(html || "").trim();
}

export function rewriteInternalLinks(markdown, state) {
  return markdown.replace(INTERNAL_LINK_RE, (whole, blogSlug, anchor = "") => {
    const entry = state[toZennSlug(blogSlug)];
    // hiddenは下書きへ戻した記事。読者から見えないURLへ張らず、pendingへ残して
    // 再公開後に--fix-linksで解決する。
    return entry && entry.url && !entry.hidden ? `](${entry.url}${anchor})` : whole;
  });
}

export function unresolvedTargets(markdown) {
  const targets = new Set();
  for (const match of markdown.matchAll(INTERNAL_LINK_RE)) {
    targets.add(toZennSlug(match[1]));
  }
  return [...targets];
}

export function buildTags(topics) {
  const seen = new Set();
  const tags = [];
  for (const topic of topics || []) {
    const tag = String(topic).toLowerCase();
    if (/^[a-z0-9]+$/.test(tag) && !seen.has(tag)) {
      seen.add(tag);
      tags.push(tag);
      if (tags.length === 4) break;
    }
  }
  return tags;
}

export function buildDescription(markdown) {
  for (const line of markdown.split("\n")) {
    const value = line.trim();
    if (!value || /^[>#`!|-]/.test(value) || value.startsWith("![")) continue;
    return value
      .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
      .replace(/[#*`_>\[\]!]/g, "")
      .replace(/\s+/g, " ")
      .slice(0, 120)
      .trim();
  }
  return "";
}

export function zennTranslationUrlFor(zennSlug) {
  return `https://zenn.dev/${ZENN_USER}/articles/${zennSlug}?locale=en`;
}

export function canonicalUrlFor(zennSlug) {
  return `https://kitepon.dev/blog/post/${toBlogSlug(zennSlug)}/`;
}

export function buildPayload(article, topics, state, canonicalUrl) {
  const body = rewriteInternalLinks(htmlToMarkdown(article.bodyHtml), state);
  const tags = buildTags(topics);
  if (tags.length === 0) throw new Error("dev.toで使える英数字tagが無い");
  const payload = {
    title: article.title,
    body_markdown: `${body}\n`,
    published: true,
    tags,
    description: buildDescription(body),
  };
  if (canonicalUrl) payload.canonical_url = canonicalUrl;
  return { article: payload };
}

function readJsonStrict(file, label) {
  let text;
  try {
    text = fs.readFileSync(file, "utf8");
  } catch (error) {
    throw new Error(`${label}を読めない: ${error.message}`);
  }
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(`${label}が不正JSON: ${error.message}`);
  }
}

export function validateState(state, candidates) {
  if (!state || typeof state !== "object" || Array.isArray(state)) {
    throw new Error("crosspost stateはobjectである必要がある");
  }
  const candidateSet = new Set(candidates.map((item) => item.zennSlug));
  for (const [slug, entry] of Object.entries(state)) {
    if (!candidateSet.has(slug)) throw new Error(`台帳に管理外slugがある: ${slug}`);
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      throw new Error(`台帳entryが不正: ${slug}`);
    }
    if (entry.status === "posting") {
      if (
        entry.sourceKey !== slug ||
        typeof entry.canonicalUrl !== "string" ||
        typeof entry.reservationToken !== "string"
      ) {
        throw new Error(`posting予約が不正: ${slug}`);
      }
      continue;
    }
    if (!Number.isInteger(entry.id) || typeof entry.url !== "string") {
      throw new Error(`published台帳entryが不正: ${slug}`);
    }
    if (entry.pending !== undefined && !Array.isArray(entry.pending)) {
      throw new Error(`pendingが配列ではない: ${slug}`);
    }
    if (entry.hidden !== undefined && typeof entry.hidden !== "boolean") {
      throw new Error(`hiddenがbooleanではない: ${slug}`);
    }
  }
  const posting = Object.entries(state).filter(([, entry]) => entry.status === "posting");
  if (posting.length > 1) throw new Error("posting予約が複数ある");
  return posting[0] || null;
}

function loadState(candidates) {
  const state = readJsonStrict(STATE_FILE, "crossposted-devto.json");
  validateState(state, candidates);
  return state;
}

function saveState(state) {
  const sorted = Object.fromEntries(
    Object.keys(state)
      .sort()
      .map((key) => [key, state[key]]),
  );
  fs.writeFileSync(STATE_FILE, `${JSON.stringify(sorted, null, 2)}\n`);
}

function splitFrontmatter(text, label) {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) throw new Error(`${label}: YAML frontmatterが無い`);
  return { raw: match[1], body: text.slice(match[0].length) };
}

function readTopicsAndPublished(zennSlug) {
  const file = path.join(ARTICLES_DIR, `${zennSlug}.md`);
  let text;
  try {
    text = fs.readFileSync(file, "utf8");
  } catch (error) {
    throw new Error(`Zenn記事を読めない: ${zennSlug}: ${error.message}`);
  }
  const { raw } = splitFrontmatter(text, `articles/${zennSlug}.md`);
  if (!/^published:\s*true\s*$/m.test(raw)) {
    throw new Error(`Zenn記事がpublished:trueではない: ${zennSlug}`);
  }
  const topicsText = raw.match(/^topics:\s*(\[[^\n]*\])\s*$/m)?.[1];
  if (!topicsText) throw new Error(`Zenn topicsが無い: ${zennSlug}`);
  let topics;
  try {
    topics = JSON.parse(topicsText);
  } catch {
    throw new Error(`Zenn topicsが不正: ${zennSlug}`);
  }
  if (!Array.isArray(topics) || topics.length === 0) {
    throw new Error(`Zenn topicsが空または配列ではない: ${zennSlug}`);
  }
  return topics;
}

function readHugoMeta(blogSlug) {
  const file = path.join(POST_DIR, blogSlug, "index.md");
  const text = fs.readFileSync(file, "utf8");
  const yaml = text.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1];
  const toml = text.match(/^\+\+\+\r?\n([\s\S]*?)\r?\n\+\+\+/)?.[1];
  const raw = yaml || toml;
  if (!raw) throw new Error(`Hugo frontmatterが無い: ${blogSlug}`);
  const date = raw.match(/^date\s*[:=]\s*["']?([^"'\n]+)["']?\s*$/m)?.[1]?.trim();
  const draft = raw.match(/^draft\s*[:=]\s*(true|false)\s*$/m)?.[1];
  if (!date || !draft) throw new Error(`Hugo date/draftが不正: ${blogSlug}`);
  return { date, draft: draft === "true" };
}

export function listLocalCandidates() {
  const candidates = fs
    .readdirSync(POST_DIR, { withFileTypes: true })
    .filter(
      (entry) =>
        entry.isDirectory() && fs.existsSync(path.join(POST_DIR, entry.name, "index.md")),
    )
    .map((entry) => {
      const meta = readHugoMeta(entry.name);
      return {
        blogSlug: entry.name,
        zennSlug: toZennSlug(entry.name),
        date: meta.date,
        draft: meta.draft,
      };
    })
    .filter((item) => !item.draft)
    .sort((a, b) => a.date.localeCompare(b.date) || a.blogSlug.localeCompare(b.blogSlug));

  const zennSlugs = new Set(
    fs.readdirSync(ARTICLES_DIR).filter((name) => name.endsWith(".md")).map((name) => name.slice(0, -3)),
  );
  for (const item of candidates) {
    if (!zennSlugs.has(item.zennSlug)) {
      throw new Error(`公開Hugo記事に対応するZenn記事が無い: ${item.blogSlug}`);
    }
    readTopicsAndPublished(item.zennSlug);
  }
  const candidateSet = new Set(candidates.map((item) => item.zennSlug));
  const orphan = [...zennSlugs].filter((slug) => !candidateSet.has(slug));
  if (orphan.length) throw new Error(`管理外Zenn記事がある: ${orphan.join(", ")}`);
  return candidates;
}

async function fetchTranslatedArticle(zennSlug) {
  const url = zennTranslationUrlFor(zennSlug);
  const response = await fetch(url, { headers: { "User-Agent": UA } });
  if (!response.ok) {
    const error = new Error(`Zenn HTTP ${response.status}`);
    error.zennStatus = response.status;
    throw error;
  }
  const html = await response.text();
  const match = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (!match) throw new Error("Zenn __NEXT_DATA__が無い");
  const article = findArticle(JSON.parse(match[1]), zennSlug);
  if (!article) throw new Error(`要求slugと一致するZenn記事が無い: ${zennSlug}`);
  return article;
}

// 未転載候補を日付の古い順に走査し、Zennの英訳が済んだ最初の1件を返す。
// Zennの自動翻訳は来ない記事があるため、英訳未完とZenn未公開(404)は飛ばして
// 後続をブロックしない。それ以外の異常はthrowして握りつぶさない。
export async function selectTarget(
  candidates,
  state,
  fetchArticle,
  { gapMs = ZENN_FETCH_GAP_MS } = {},
) {
  const skipped = [];
  for (const item of candidates) {
    if (state[item.zennSlug]) continue;
    if (skipped.length > 0 && gapMs > 0) await sleep(gapMs);
    let article;
    try {
      article = await fetchArticle(item.zennSlug);
    } catch (error) {
      if (error.zennStatus !== 404) throw error;
      skipped.push({ zennSlug: item.zennSlug, reason: "Zenn未公開(404)" });
      continue;
    }
    if (article.isTranslated !== true) {
      skipped.push({ zennSlug: item.zennSlug, reason: "英訳未完" });
      continue;
    }
    return { target: item, article, skipped };
  }
  return { target: null, article: null, skipped };
}

async function devtoRequest(method, url, payload, apiKey) {
  const options = {
    method,
    headers: {
      "api-key": apiKey,
      Accept: "application/vnd.forem.api-v1+json",
      "User-Agent": UA,
    },
  };
  if (payload !== undefined) {
    options.headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(payload);
  }
  const response = await fetch(url, options);
  const text = await response.text();
  if (!response.ok) throw new Error(`dev.to ${response.status}: ${text.slice(0, 300)}`);
  return text ? JSON.parse(text) : null;
}

export async function fetchMyArticles(apiKey) {
  const all = [];
  const perPage = 100;
  for (let page = 1; ; page += 1) {
    const batch = await devtoRequest(
      "GET",
      `${DEVTO_API}/me/all?page=${page}&per_page=${perPage}`,
      undefined,
      apiKey,
    );
    if (!Array.isArray(batch)) throw new Error("dev.to記事一覧が配列ではない");
    all.push(...batch);
    if (batch.length < perPage) return all;
  }
}

export function canonicalRefreshTargets(state, remoteArticles) {
  if (!Array.isArray(remoteArticles)) throw new Error("dev.to記事一覧が配列ではない");
  const remoteById = new Map();
  for (const article of remoteArticles) {
    if (!Number.isInteger(article?.id)) throw new Error("dev.to記事一覧にidが無い");
    if (remoteById.has(article.id)) throw new Error(`dev.to記事一覧のidが重複: ${article.id}`);
    remoteById.set(article.id, article);
  }

  return Object.keys(state)
    .sort()
    .map((zennSlug) => {
      const entry = state[zennSlug];
      if (entry?.status === "posting") {
        throw new Error(`posting予約があるためcanonical更新を行わない: ${zennSlug}`);
      }
      if (!Number.isInteger(entry?.id) || typeof entry?.url !== "string") {
        throw new Error(`published台帳entryが不正: ${zennSlug}`);
      }
      const remote = remoteById.get(entry.id);
      if (!remote) throw new Error(`dev.to遠隔記事が見つからない: ${zennSlug} id=${entry.id}`);
      if (typeof remote.url === "string" && remote.url !== entry.url) {
        throw new Error(`dev.to遠隔URLが台帳と不一致: ${zennSlug}`);
      }
      const expectedCanonicalUrl = canonicalUrlFor(zennSlug);
      return {
        zennSlug,
        id: entry.id,
        url: entry.url,
        currentCanonicalUrl: remote.canonical_url || null,
        expectedCanonicalUrl,
        needsUpdate: remote.canonical_url !== expectedCanonicalUrl,
      };
    });
}

async function prepareCanonicalRefresh(apiKey) {
  const candidates = listLocalCandidates();
  const state = loadState(candidates);
  if (validateState(state, candidates)) {
    throw new Error("posting予約があるためcanonical更新を行わない");
  }
  const targets = canonicalRefreshTargets(state, await fetchMyArticles(apiKey));
  const changes = targets.filter((target) => target.needsUpdate);
  console.log(
    `Canonical refresh plan: targets=${targets.length} changes=${changes.length} ` +
      `already=${targets.length - changes.length}`,
  );
  return { state, targets, changes };
}

async function checkCanonicalRefresh(apiKey) {
  await prepareCanonicalRefresh(apiKey);
}

async function refreshCanonicalUrls(apiKey) {
  const { state, targets, changes } = await prepareCanonicalRefresh(apiKey);
  let stateChanged = false;
  for (const target of targets.filter((item) => !item.needsUpdate)) {
    if (state[target.zennSlug].canonicalUrl !== target.expectedCanonicalUrl) {
      state[target.zennSlug].canonicalUrl = target.expectedCanonicalUrl;
      stateChanged = true;
    }
  }
  if (stateChanged) saveState(state);

  for (let index = 0; index < changes.length; index += 1) {
    const target = changes[index];
    if (index > 0) await sleep(WRITE_GAP_MS);
    const updated = await devtoRequest(
      "PUT",
      `${DEVTO_API}/${target.id}`,
      { article: { canonical_url: target.expectedCanonicalUrl } },
      apiKey,
    );
    if (updated?.id !== target.id || updated?.canonical_url !== target.expectedCanonicalUrl) {
      throw new Error(`dev.to canonical更新応答が不正: ${target.zennSlug}`);
    }
    state[target.zennSlug].canonicalUrl = target.expectedCanonicalUrl;
    saveState(state);
    console.log(`Updated canonical: ${target.zennSlug} -> ${target.expectedCanonicalUrl}`);
  }
}

export function canonicalMatches(articles, canonicalUrl) {
  return articles.filter((article) => article.canonical_url === canonicalUrl);
}

export function requireSingleCanonicalMatch(matches, zennSlug) {
  if (matches.length !== 1) {
    throw new Error(
      `posting予約 ${zennSlug} の遠隔一致が${matches.length}件。自動POSTせず停止する`,
    );
  }
  return matches[0];
}

function publishedEntry(remote, pending, canonicalUrl) {
  if (!Number.isInteger(remote.id) || typeof remote.url !== "string") {
    throw new Error("dev.to応答にid/urlが無い");
  }
  return {
    status: "published",
    url: remote.url,
    id: remote.id,
    canonicalUrl,
    pending,
  };
}

function setOutput(name, value) {
  if (process.env.GITHUB_OUTPUT) {
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `${name}=${value}\n`);
  }
}

function reservationToken() {
  const token = process.env.CROSSPOST_RESERVATION_TOKEN ||
    (process.env.GITHUB_RUN_ID && `${process.env.GITHUB_RUN_ID}:${process.env.GITHUB_RUN_ATTEMPT || "1"}`);
  if (!token) throw new Error("予約tokenが無い");
  return token;
}

async function recoverPosting(state, posting, apiKey) {
  const [zennSlug, reservation] = posting;
  const matches = canonicalMatches(await fetchMyArticles(apiKey), reservation.canonicalUrl);
  const remote = requireSingleCanonicalMatch(matches, zennSlug);
  const article = await fetchTranslatedArticle(zennSlug);
  const payload = buildPayload(article, readTopicsAndPublished(zennSlug), state, reservation.canonicalUrl);
  state[zennSlug] = publishedEntry(
    remote,
    unresolvedTargets(payload.article.body_markdown),
    reservation.canonicalUrl,
  );
  saveState(state);
  console.log(`Recovered ${zennSlug} -> ${remote.url}`);
}

async function prepare(apiKey) {
  const candidates = listLocalCandidates();
  const state = loadState(candidates);
  const posting = validateState(state, candidates);
  if (posting) {
    await recoverPosting(state, posting, apiKey);
    setOutput("created", "false");
    setOutput("recovered", "true");
    return;
  }

  const { target, article, skipped } = await selectTarget(
    candidates,
    state,
    fetchTranslatedArticle,
  );
  for (const item of skipped) {
    console.log(`Skipped ${item.zennSlug}: ${item.reason}`);
  }
  if (!target) {
    const remaining = candidates.filter((item) => !state[item.zennSlug]).length;
    console.log(
      remaining === 0
        ? `All ${candidates.length} local articles already crossposted.`
        : `No article ready to crosspost. Skipped ${skipped.length} of ${remaining} remaining.`,
    );
    setOutput("created", "false");
    return;
  }
  if (!article.title || !article.bodyHtml) {
    throw new Error(`Zenn英訳のtitle/bodyが空: ${target.zennSlug}`);
  }
  state[target.zennSlug] = {
    status: "posting",
    sourceKey: target.zennSlug,
    canonicalUrl: canonicalUrlFor(target.zennSlug),
    reservationToken: reservationToken(),
    reservedAt: new Date().toISOString(),
  };
  saveState(state);
  setOutput("created", "true");
  setOutput("slug", target.zennSlug);
  console.log(`Reserved ${target.zennSlug}; commit and push this state before POST.`);
}

async function sendNew(apiKey) {
  const candidates = listLocalCandidates();
  const state = loadState(candidates);
  const posting = validateState(state, candidates);
  if (!posting) throw new Error("送信対象のposting予約が無い");
  const [zennSlug, reservation] = posting;
  if (reservation.reservationToken !== reservationToken()) {
    throw new Error("posting予約は別runのもの。自動POSTせず--prepareで回復する");
  }

  const matches = canonicalMatches(await fetchMyArticles(apiKey), reservation.canonicalUrl);
  if (matches.length > 1) {
    throw new Error(`canonical_urlがdev.toに複数ある: ${zennSlug}`);
  }
  const article = await fetchTranslatedArticle(zennSlug);
  if (article.isTranslated !== true || !article.title || !article.bodyHtml) {
    throw new Error(`Zenn英訳が送信可能な状態ではない: ${zennSlug}`);
  }
  const payload = buildPayload(
    article,
    readTopicsAndPublished(zennSlug),
    state,
    reservation.canonicalUrl,
  );
  const pending = unresolvedTargets(payload.article.body_markdown);
  if (matches.length === 1) {
    state[zennSlug] = publishedEntry(matches[0], pending, reservation.canonicalUrl);
    saveState(state);
    console.log(`Recovered before POST ${zennSlug} -> ${matches[0].url}`);
    return;
  }

  const created = await devtoRequest("POST", DEVTO_API, payload, apiKey);
  state[zennSlug] = publishedEntry(created, pending, reservation.canonicalUrl);
  saveState(state);
  console.log(`Posted ${zennSlug} -> ${created.url}`);
}

// 下書きへ戻した記事のうち、公開日が最も古い1件を返す。再公開は1 runで1件だけ。
export function findHiddenTarget(candidates, state) {
  return candidates.find((item) => state[item.zennSlug]?.hidden === true) || null;
}

// リンク更新の対象は、参照先が全て公開済み（下書きへ戻していない）記事だけ。
export function findFixupTarget(state) {
  return (
    Object.keys(state).find(
      (slug) =>
        !state[slug].hidden &&
        (state[slug].pending || []).length > 0 &&
        state[slug].pending.every((target) => state[target]?.url && !state[target].hidden),
    ) || null
  );
}

// dev.toへ出しすぎた記事を下書きへ戻す。台帳へhiddenを立て、--republishが
// 1日1件ずつ再公開する。対象slugはHIDE_SLUGSで明示的に渡す。
async function hideArticles(apiKey) {
  const slugs = (process.env.HIDE_SLUGS || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  if (slugs.length === 0) throw new Error("HIDE_SLUGSが空");
  const candidates = listLocalCandidates();
  const state = loadState(candidates);
  if (validateState(state, candidates)) {
    throw new Error("posting予約があるため非公開化を行わない");
  }
  for (const slug of slugs) {
    const entry = state[slug];
    if (!entry) throw new Error(`台帳に無いslug: ${slug}`);
    if (!Number.isInteger(entry.id)) throw new Error(`台帳entryにidが無い: ${slug}`);
    if (entry.hidden) {
      console.log(`Already hidden ${slug}`);
      continue;
    }
    await sleep(WRITE_GAP_MS);
    await devtoRequest(
      "PUT",
      `${DEVTO_API}/${entry.id}`,
      { article: { published: false } },
      apiKey,
    );
    entry.hidden = true;
    saveState(state);
    console.log(`Hidden ${slug} -> ${entry.url}`);
  }
}

// 下書きへ戻した記事を1件だけ再公開する。1日1本の上限を守るため、
// 再公開した日は新規転載を行わない（workflowがoutputで分岐する）。
async function republishOne(apiKey) {
  const candidates = listLocalCandidates();
  const state = loadState(candidates);
  if (validateState(state, candidates)) {
    throw new Error("posting予約があるため再公開を行わない");
  }
  const target = findHiddenTarget(candidates, state);
  if (!target) {
    console.log("No hidden article to republish.");
    setOutput("republished", "false");
    return;
  }
  const entry = state[target.zennSlug];
  await sleep(WRITE_GAP_MS);
  await devtoRequest("PUT", `${DEVTO_API}/${entry.id}`, { article: { published: true } }, apiKey);
  delete entry.hidden;
  saveState(state);
  setOutput("republished", "true");
  console.log(`Republished ${target.zennSlug} -> ${entry.url}`);
}

async function fixupOne(apiKey) {
  const candidates = listLocalCandidates();
  const state = loadState(candidates);
  const posting = validateState(state, candidates);
  if (posting) throw new Error("posting予約があるためリンク更新を行わない");
  const zennSlug = findFixupTarget(state);
  if (!zennSlug) {
    console.log("No link fixups ready.");
    return;
  }
  await sleep(WRITE_GAP_MS);
  const article = await fetchTranslatedArticle(zennSlug);
  const canonicalUrl = state[zennSlug].canonicalUrl;
  const payload = buildPayload(article, readTopicsAndPublished(zennSlug), state, canonicalUrl);
  await devtoRequest("PUT", `${DEVTO_API}/${state[zennSlug].id}`, payload, apiKey);
  state[zennSlug].pending = unresolvedTargets(payload.article.body_markdown);
  saveState(state);
  console.log(`Updated internal links: ${zennSlug}`);
}

export async function main(argv = process.argv.slice(2)) {
  const mode = argv[0];
  const modes = [
    "--prepare",
    "--send-new",
    "--fix-links",
    "--hide",
    "--republish",
    "--check-canonical",
    "--refresh-canonical",
  ];
  if (!modes.includes(mode) || argv.length !== 1) {
    throw new Error(`使い方: ${modes.join(" | ")}`);
  }
  const apiKey = process.env.DEVTO_API_KEY;
  if (!apiKey) throw new Error("DEVTO_API_KEY is not set");
  if (mode === "--prepare") await prepare(apiKey);
  if (mode === "--send-new") await sendNew(apiKey);
  if (mode === "--fix-links") await fixupOne(apiKey);
  if (mode === "--hide") await hideArticles(apiKey);
  if (mode === "--republish") await republishOne(apiKey);
  if (mode === "--check-canonical") await checkCanonicalRefresh(apiKey);
  if (mode === "--refresh-canonical") await refreshCanonicalUrls(apiKey);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(`✗ ${error.message}`);
    process.exit(1);
  });
}
