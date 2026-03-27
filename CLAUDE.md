# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

「Claude Code 始めました」— Claude MAXユーザーの実体験ベース技術ブログ。Hugo + GitHub Pagesで構築。

## Build & Development

```bash
hugo server -D          # ローカルプレビュー（下書き含む）
hugo                    # 本番ビルド（public/に出力）
```

## Architecture

- **SSG**: Hugo
- **ホスティング**: GitHub Pages（git pushで公開）
- **記事**: Markdown（content/post/以下、Page Bundle形式）
- **集客**: X（Twitter）+ Zenn転載

## Content Guidelines

- 記事の口調はカジュアル（「俺」「〜じゃないすかね」）
- 実体験ベース。SEO目的のスカスカ記事は書かない
- 公式ドキュメント翻訳ではなく「使ってるけど実は知らなかった」層向け
- テキスト重視のシンプルデザイン。画像ばかりでかいサイトへのアンチテーゼ
- 日本語向け
- ローカルLLMの話は含めない

## Articles

| # | タイトル | 状態 |
|---|---------|------|
| 1 | 俺がClaude Codeの半分も使えてなかった話 | 下書き完成 |
| 2 | Copilot → Cursor → Claude Code for VSC。俺が辿り着くまでの話 | 下書き完成（翻訳アプリのセクションがTODO） |
| 3 | MAXプランで何が変わるか | 未着手 |
