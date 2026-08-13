# zenn-sync — ブログ本文 → Zenn 記事の同期

Hugo のブログ本文（`content/post/<slug>/index.md`）から、**同一リポジトリ内**の Zenn 記事
（`articles/<zennSlug>.md`）を再生成するスクリプト。

> Zenn はリポジトリ「ルート直下」の `articles/` しか読まない（サブディレクトリ不可）。
> このプロジェクトは Hugo（`content/`）と Zenn（`articles/`）を 1 リポジトリに同居させている。
> dev.to への自動転載も `.github/`（`crosspost-devto.yml` / `crosspost-devto.mjs`）に同居。

## 使い方

```bash
node tools/zenn-sync/sync.mjs --slug <blogSlug> # 対象記事だけ同期
node tools/zenn-sync/sync.mjs --check           # 全記事の同期差分を検査
node tools/zenn-sync/sync.mjs --dry             # 書き換えず変更対象だけ表示
node tools/zenn-sync/sync.mjs                   # 全記事の変更分を同期
```

実行後は必ず `git diff articles/` で差分を目視（期待差分＝画像追加・`@[card]`・ドメインのみ）。

## 何をするか

記事ごとに、Hugo 本文を Zenn 記法へ変換して書き戻す。**Zenn 固有の frontmatter
（`title`/`emoji`/`type`/`topics`/`published`）は既存 `articles/` ファイルから温存**し、
本文だけ差し替える（＝何度流しても結果が同じ＝冪等）。

| 変換 | Hugo | → Zenn |
|---|---|---|
| 本文画像 | `![alt](file.png)`（相対） | `![alt](https://kitepon.dev/blog/post/<slug>/file.png)` ＋直下に `*alt*`（figcaption 再現） |
| リンクカード | `{{< linkcard url="X" … >}}` | `@[card](X)` |
| 内部リンク | `{{< relref "…" >}}` | `https://kitepon.dev/blog/post/<slug>/` |
| 冒頭 | （なし） | 転載バナー `:::message … :::` |

未対応の Hugo ショートコードが残ったら**エラーで停止**する（黙って素通ししない）。
Hugo 記事に対応する Zenn ファイルが無い／Zenn 側に孤児がある場合も停止する。

## スラッグ7本の差異

初期記事はブログ slug と Zenn ファイル名が異なる。`tools/article-manifest.mjs`に定義し、Zenn同期とdev.to転載が共有する。

```
claude-code-features          → claude-code-half-features
claude-code-deploy            → claude-code-ssh-deploy
max-plan-review               → claude-max-plan-review
claude-research-implementation → claude-research-from-papers
livetr-app                    → livetr-realtime-translator
bughub                        → bughub-aggregation
what-is-ci                    → what-is-continuous-integration
```

## 新記事を足すとき

`sync.mjs` は既存 `articles/<zennSlug>.md` の frontmatter を読むため、新規 slug はまず
**frontmatter だけの `articles/<zennSlug>.md` を手で作る**（`emoji`/`topics` は Zenn 用に選ぶ。
本文は空でよい）→ その後 `node tools/zenn-sync/sync.mjs --slug <blogSlug>` で本文を流し込む。
