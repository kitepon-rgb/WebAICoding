# Claude Code 始めました

> Claude MAX ユーザーが、AI コーディングを実際に使いながら学んだことを記録する技術ブログ。Hugo + GitHub Pages で公開。
>
> *A hands-on Japanese tech blog about everyday AI coding with Claude Code, built with Hugo and hosted on GitHub Pages.*

**ライブサイト → https://kitepon-rgb.github.io/WebAICoding/**

---

## これは何

プログラマーではない人間が、趣味の AI コーディングで実際にハマったこと・うまくいったこと・失敗したことを、そのまま書き残しているブログのソースです。

- 設計と方針は自分で決めて、実装は AI に任せてレビューする「アーキテクト型」の開発スタイル
- Copilot → Cursor → Claude Code と渡り歩いて、今は **VS Code + Claude Code + MAX プラン** に落ち着くまでの実体験
- メモリシステム、トークン節約、サーバー管理、自作アプリのリリースなど、実運用ベースの記事

記事は `content/post/` 以下に Markdown で置いてあり、`main` ブランチへの push で GitHub Actions が自動ビルド・デプロイします。

## 技術構成

| 項目 | 内容 |
| --- | --- |
| 静的サイトジェネレーター | [Hugo](https://gohugo.io/)（extended） |
| テーマ | [hugo-paper](https://github.com/nanxiaobei/hugo-paper)（git submodule） |
| ホスティング | GitHub Pages |
| デプロイ | GitHub Actions（`.github/workflows/deploy.yml`） |
| 言語 | 日本語 |

## ローカルで動かす

Hugo extended が必要です（[インストール手順](https://gohugo.io/installation/)）。

```bash
# テーマを submodule ごとクローン
git clone --recurse-submodules https://github.com/kitepon-rgb/WebAICoding.git
cd WebAICoding

# 開発サーバーを起動（http://localhost:1313/WebAICoding/）
hugo server

# 本番ビルド（出力は public/）
hugo --minify
```

クローン済みでテーマだけ取得したい場合:

```bash
git submodule update --init --recursive
```

## 記事を書く

```bash
# 新しい記事の雛形を作成
hugo new content/post/your-slug/index.md
```

frontmatter の例（既存記事に合わせる）:

```yaml
---
title: "記事タイトル"
date: 2026-06-03
draft: false
description: "一覧やSNSカードに出る要約"
tags: ["Claude Code", "AI Coding"]
cover:
  image: "cover.png"
---
```

`draft: false` の記事だけが本番に公開されます。`main` に push すると自動でデプロイされます。

## ディレクトリ構成

```
content/        記事（Markdown）と About ページ
layouts/        テーマ上書き用のレイアウト
assets/         カスタム CSS
static/         ファビコン・OG 画像などの静的ファイル
themes/paper/   テーマ本体（submodule）
hugo.toml       サイト設定
```

## ライセンス

[MIT License](LICENSE) — © 2026 kitepon-rgb