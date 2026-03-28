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
- **統計**: GoatCounter（claudecode-blog.goatcounter.com）

## Zenn転載（重要）

記事を追加・変更した場合、**Zennリポジトリにも同じ変更を反映すること。**

- Zennリポジトリ: `C:\Users\kite_\Documents\Program\Zenn`（GitHub: kitepon-rgb/zenn-content）
- Zenn記事: `articles/` 以下にZenn形式のmarkdown
- Hugo側を変更 → Zenn側も変更 → 両方push

## Content Guidelines

- 記事の口調はカジュアル（冒頭や要所は「俺」、説明パートは「自分」も可）
- 実体験ベース。SEO目的のスカスカ記事は書かない
- 公式ドキュメント翻訳ではなく「使ってるけど実は知らなかった」層向け
- テキスト重視のシンプルデザイン。画像ばかりでかいサイトへのアンチテーゼ
- 日本語向け
- ローカルLLMの話は含めない
- 時代感の誇張に注意（全体で1.5ヶ月の出来事。「時代」「しばらく」等は不適切）

## Articles

| # | タイトル | 状態 |
|---|---------|------|
| 1 | 俺がClaude Codeの半分も使えてなかった話 | 公開済み |
| 2 | Copilot → Cursor → Claude Code for VSC。俺が辿り着くまでの話 | 公開済み |
| 3 | ClaudeのMAXプランで何が変わるか | 公開済み |
