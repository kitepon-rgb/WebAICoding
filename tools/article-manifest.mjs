// ブログとZennでslugが異なる記事だけを定義する。
// 記事のtitle、date、draftはcontent/post/*/index.mdのfrontmatterが正本。
export const BLOG_TO_ZENN_SLUG = Object.freeze({
  "claude-code-features": "claude-code-half-features",
  "claude-code-deploy": "claude-code-ssh-deploy",
  "max-plan-review": "claude-max-plan-review",
  "claude-research-implementation": "claude-research-from-papers",
  "livetr-app": "livetr-realtime-translator",
  bughub: "bughub-aggregation",
});

export const ZENN_TO_BLOG_SLUG = Object.freeze(
  Object.fromEntries(
    Object.entries(BLOG_TO_ZENN_SLUG).map(([blogSlug, zennSlug]) => [
      zennSlug,
      blogSlug,
    ]),
  ),
);

if (Object.keys(ZENN_TO_BLOG_SLUG).length !== Object.keys(BLOG_TO_ZENN_SLUG).length) {
  throw new Error("article manifestに重複するZenn slugがある");
}

export function toZennSlug(blogSlug) {
  return BLOG_TO_ZENN_SLUG[blogSlug] || blogSlug;
}

export function toBlogSlug(zennSlug) {
  return ZENN_TO_BLOG_SLUG[zennSlug] || zennSlug;
}
