# WebAICoding Overview

## Purpose

WebAICoding is the source repository for the Japanese Hugo blog "Claude Code 始めました".
The live site is published at <https://blog.kitepon.dev/>.

## Canonical Entry Points

- Human entry point: [README.md](../README.md)
- Agent entry point: [CLAUDE.md](../CLAUDE.md)
- Site config: [hugo.toml](../hugo.toml)
- Architecture decision records: [docs/adr/](adr/)
- Reusable research shelf: [rag/INDEX.md](../rag/INDEX.md)

## Repository Map

- `content/`: Hugo content, including article page bundles under `content/post/`.
- `articles/`: Zenn crosspost Markdown generated from blog posts.
- `layouts/`: Custom Hugo theme templates and shortcodes.
- `assets/css/`: Fingerprinted site CSS.
- `static/`: Static assets such as favicons and OG images.
- `tools/cover/`: Playwright-based cover image generator.
- `tools/zenn-sync/`: Blog-to-Zenn synchronization tool.
- `.github/workflows/`: GitHub Actions for Pages deploy and dev.to crossposting.

## Verification

Use the same production build command as the deploy workflow:

```bash
hugo --minify
```

For draft/future-date checks while editing posts:

```bash
hugo -D
```

## Operational Notes

- The custom theme is part of this repository; no external Hugo theme submodule is required.
- `public/`, `resources/_gen/`, and `.hugo_build.lock` are generated locally and ignored.
- `.claude/settings.json` is local-only. Generate it with `fewer-permission-prompts` when needed; do not commit it.
