import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  BLOG_TO_ZENN_SLUG,
  toBlogSlug,
  toZennSlug,
} from "../article-manifest.mjs";
import {
  convertBody,
  parseArgs,
  validateZennFrontmatter,
} from "../zenn-sync/sync.mjs";
import {
  parseHugoFrontmatter,
  pngDimensions,
  renderedOgDimensions,
  validateContent,
  validateHugoMeta,
  validatePngFile,
} from "../validate-content.mjs";
import {
  buildPayload,
  canonicalMatches,
  canonicalUrlFor,
  findArticle,
  listLocalCandidates,
  requireSingleCanonicalMatch,
  rewriteInternalLinks,
  unresolvedTargets,
  validateState,
} from "../../.github/scripts/crosspost-devto.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../..");

test("共有manifestは6件の差異を双方向に解決する", () => {
  assert.equal(Object.keys(BLOG_TO_ZENN_SLUG).length, 6);
  assert.equal(toZennSlug("bughub"), "bughub-aggregation");
  assert.equal(toBlogSlug("bughub-aggregation"), "bughub");
  assert.equal(toZennSlug("aiterm-converse"), "aiterm-converse");
});

test("Zenn変換は本文だけを変換しコードフェンスを保存する", () => {
  const input = [
    "```md",
    '{{< unknown value="kept" >}}',
    "```",
    "",
    '[内部]({{< relref "bughub#details" >}})',
    '{{< linkcard url="https://example.com" title="Example" >}}',
    "![説明](figure.png)",
  ].join("\n");
  const output = convertBody(input, "source-post");
  assert.match(output, /\{\{< unknown value="kept" >\}\}/);
  assert.match(output, /https:\/\/blog\.kitepon\.dev\/post\/bughub\/#details/);
  assert.match(output, /@\[card\]\(https:\/\/example\.com\)/);
  assert.match(output, /source-post\/figure\.png\)\n\*説明\*/);
});

test("長い未対応shortcodeは停止する", () => {
  const value = "x".repeat(200);
  assert.throws(
    () => convertBody(`{{< unknown value="${value}" >}}`, "sample"),
    /未対応のショートコード/,
  );
});

test("Zenn frontmatterとCLI引数を厳格に検査する", () => {
  const valid = [
    'title: "Title"',
    'emoji: "🧪"',
    'type: "tech"',
    'topics: ["ai"]',
    "published: true",
  ].join("\n");
  assert.doesNotThrow(() => validateZennFrontmatter(valid, "valid-slug-12", "fixture"));
  assert.throws(() => validateZennFrontmatter(valid, "short", "fixture"), /12〜50字/);
  assert.deepEqual(parseArgs(["--slug", "bughub", "--dry"]), {
    dry: true,
    check: false,
    slug: "bughub",
  });
  assert.throws(() => parseArgs(["--slug"]), /ブログslugが必要/);
});

test("dev.to payloadはcanonical_urlと未解決リンクを保持する", () => {
  const canonicalUrl = canonicalUrlFor("source-article");
  const article = {
    title: "English title",
    bodyHtml:
      '<p>Body</p><p><a href="https://blog.kitepon.dev/post/bughub/#details">BugHub</a></p>',
  };
  const payload = buildPayload(article, ["ai"], {}, canonicalUrl);
  assert.equal(payload.article.canonical_url, canonicalUrl);
  assert.deepEqual(unresolvedTargets(payload.article.body_markdown), ["bughub-aggregation"]);

  const rewritten = rewriteInternalLinks(payload.article.body_markdown, {
    "bughub-aggregation": { id: 1, url: "https://dev.to/example/bughub" },
  });
  assert.match(rewritten, /https:\/\/dev\.to\/example\/bughub#details/);
  assert.equal(buildPayload(article, ["ai"], {}, undefined).article.canonical_url, undefined);
  assert.throws(() => buildPayload(article, ["日本語"], {}, canonicalUrl), /英数字tagが無い/);
});

test("遠隔照合はcanonical_urlの完全一致だけを採用する", () => {
  const canonicalUrl = canonicalUrlFor("source-article");
  const matches = canonicalMatches(
    [
      { id: 1, canonical_url: canonicalUrl },
      { id: 2, canonical_url: canonicalUrlFor("other-article") },
    ],
    canonicalUrl,
  );
  assert.deepEqual(matches.map((item) => item.id), [1]);
  assert.equal(requireSingleCanonicalMatch(matches, "source-article").id, 1);
  assert.throws(() => requireSingleCanonicalMatch([], "source-article"), /自動POSTせず停止/);
  assert.throws(
    () => requireSingleCanonicalMatch([matches[0], matches[0]], "source-article"),
    /遠隔一致が2件/,
  );
});

test("Zenn記事探索は要求slugと一致するobjectだけを返す", () => {
  const tree = {
    props: [
      { slug: "wrong", isTranslated: true, bodyHtml: "wrong" },
      { slug: "right", isTranslated: true, bodyHtml: "right" },
    ],
  };
  assert.equal(findArticle(tree, "right").bodyHtml, "right");
  assert.equal(findArticle(tree, "missing"), null);
});

test("現行台帳はローカル公開候補の部分集合として妥当", () => {
  const candidates = listLocalCandidates();
  const state = JSON.parse(
    fs.readFileSync(path.join(repoRoot, "crossposted-devto.json"), "utf8"),
  );
  assert.doesNotThrow(() => validateState(state, candidates));
  assert.ok(candidates.length >= Object.keys(state).length);
});

test("posting予約の欠損と複数予約を拒否する", () => {
  const candidates = [{ zennSlug: "article-one" }, { zennSlug: "article-two" }];
  assert.throws(
    () =>
      validateState(
        {
          "article-one": {
            status: "posting",
            sourceKey: "article-one",
            canonicalUrl: "https://example.com/one",
          },
        },
        candidates,
      ),
    /posting予約が不正/,
  );
  assert.throws(
    () =>
      validateState(
        {
          "article-one": {
            status: "posting",
            sourceKey: "article-one",
            canonicalUrl: "https://example.com/one",
            reservationToken: "run:1",
          },
          "article-two": {
            status: "posting",
            sourceKey: "article-two",
            canonicalUrl: "https://example.com/two",
            reservationToken: "run:1",
          },
        },
        candidates,
      ),
    /posting予約が複数/,
  );
});

test("Hugo frontmatterは未来の公開日を拒否する", () => {
  const text = [
    "---",
    'title: "Title"',
    "date: 2099-01-01T00:00:00+09:00",
    "draft: false",
    'description: "Description"',
    'tags: ["AI"]',
    "cover:",
    '  image: "cover.png"',
    "---",
    "Body",
  ].join("\n");
  const meta = parseHugoFrontmatter(text, "fixture");
  assert.throws(
    () => validateHugoMeta(meta, "fixture", new Date("2026-07-17T00:00:00Z")),
    /未来日付/,
  );
});

test("現行コンテンツとカバー寸法がpreflightを通る", () => {
  const result = validateContent({ now: new Date("2026-07-19T23:59:59+09:00") });
  assert.deepEqual(result, { posts: 39, zenn: 39, mobile: 39 });
  assert.deepEqual(
    pngDimensions(path.join(repoRoot, "content/post/bughub/cover.png")),
    { width: 1250, height: 500 },
  );
  assert.throws(
    () => validatePngFile(path.join(repoRoot, "content/post/bughub/cover.png"), 1080, 1080),
    /画像寸法が不正/,
  );
  assert.throws(
    () => validatePngFile(path.join(repoRoot, "content/post/bughub/missing.png"), 1, 1),
    /画像が無い/,
  );
});

test("workflowは予約push後にPOSTし、deploy前に検査する", () => {
  const crosspost = fs.readFileSync(
    path.join(repoRoot, ".github/workflows/crosspost-devto.yml"),
    "utf8",
  );
  assert.match(crosspost, /group: crosspost-devto/);
  assert.ok(
    crosspost.indexOf("Persist reservation before external POST") <
      crosspost.indexOf("Send newly reserved article"),
  );
  const deploy = fs.readFileSync(path.join(repoRoot, ".github/workflows/deploy.yml"), "utf8");
  assert.ok(deploy.indexOf("Validate content") < deploy.indexOf("name: Build"));
  assert.ok(deploy.indexOf("Check Zenn synchronization") < deploy.indexOf("name: Build"));
});

test("生成HTMLからOGP寸法を検査する", () => {
  const html = '<meta property="og:image:width" content="1250"><meta property="og:image:height" content="500">';
  assert.deepEqual(renderedOgDimensions(html, "fixture"), { width: 1250, height: 500 });
  assert.throws(() => renderedOgDimensions("<html></html>", "fixture"), /OGP画像寸法が無い/);
});
