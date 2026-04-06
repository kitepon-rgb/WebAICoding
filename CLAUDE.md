# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

「Claude Code 始めました」— Claude MAXユーザーの実体験ベース技術ブログ。Hugo + GitHub Pagesで構築。

## Build & Development

```bash
git submodule update --init  # 初回クローン後、テーマ取得に必要
hugo server -D               # ローカルプレビュー（下書き含む）
hugo                         # 本番ビルド（public/に出力）
```

## Deployment

mainブランチにpushすると GitHub Actions（`.github/workflows/deploy.yml`）が自動でビルド＆デプロイ。手動デプロイ不要。

## Architecture

- **SSG**: Hugo（テーマ: [hugo-paper](https://github.com/nanxiaobei/hugo-paper)、submodule）
- **ホスティング**: GitHub Pages（git pushで公開）
- **記事**: Markdown（`content/post/<slug>/index.md`、Page Bundle形式）
- **カスタムCSS**: `assets/custom.css`（Claudeオレンジのカラースキーム、ライトモードのみ）
- **レイアウト上書き**: `layouts/_default/list.html`（トップページヘッダー画像）、`layouts/_default/single.html`（カバー画像表示）、`layouts/partials/footer.html`（GoatCounterスクリプト埋め込み）
- **カバー画像**: 各記事に `cover.png`（1250x500px）。生成スクリプト: `C:\Users\kite_\Documents\Program\_playwright\generate-cover.js`
  - 使い方: `node generate-cover.js "タイトル1行目" "タイトル2行目" "出力パス" ["コードテキスト"]`
  - デザイン: Claudeオレンジのグラデーション（左上暗→右下明）、ターミナル風枠（ボーダー `#dfcbc1`）、Noto Serif JP 600、背景にコードライン
- **baseURL**: `https://kitepon-rgb.github.io/WebAICoding/` — サブパス `/WebAICoding/` があるため、内部リンクは必ず `relref` を使うこと（直書きは404になる）
- **統計**: GoatCounter（claudecode-blog.goatcounter.com）
- **集客**: X（Twitter、Premium+）+ Zenn転載
- **X API**: Pay Per Use、キーは `.env.x-api`（gitignore済み）、アイデア帳は `x-api-ideas.md`（gitignore済み）、APIリファレンスは `x-api-reference.md`

## 記事の追加方法

1. `content/post/<slug>/index.md` を作成（Page Bundle形式）
2. frontmatter: `title`, `date`, `draft`, `description`, `tags`, `cover.image: "cover.png"`
3. `hugo server -D` でプレビュー確認
4. mainにpush → 自動デプロイ
5. **Zennリポジトリにも同じ記事を反映**（後述）

## Zenn転載（重要）

記事を追加・変更した場合、**Zennリポジトリにも同じ変更を反映すること。**

- Zennリポジトリ: `C:\Users\kite_\Documents\Program\Zenn`（GitHub: kitepon-rgb/zenn-content）
- Zenn記事: `articles/` 以下にZenn形式のmarkdown
- Hugo側を変更 → Zenn側も変更 → 両方push
- Hugo側の内部リンクは `relref` ショートコード、Zenn側はブログの絶対URL（`https://kitepon-rgb.github.io/WebAICoding/post/...`）を使うこと

## 記事の公開前チェック（必須）

記事を書いたら、**公開（`draft: false`）前に必ず監査エージェントを通すこと。**

チェック項目：
- 不要な逆接（「でも」「ただ」「しかし」）が本当に逆接になっているか
- 同じ主張・説明の重複がないか
- 一文が長すぎないか、時系列が前後していないか
- タイトルの日本語（助詞の衝突等）が自然か
- 内部リンクが `relref` ショートコードを使っているか（baseURLにサブパスがあるため `/post/...` の直書きは404になる）

## Content Guidelines

- 記事の口調はカジュアル（冒頭や要所は「俺」、説明パートは「自分」も可）
- 実体験ベース。SEO目的のスカスカ記事は書かない
- 公式ドキュメント翻訳ではなく「使ってるけど実は知らなかった」層向け
- テキスト重視のシンプルデザイン。画像ばかりでかいサイトへのアンチテーゼ
- 日本語向け
- ローカルLLMの話は含めない
- 時代感の誇張に注意（全体で1.5ヶ月の出来事。「時代」「しばらく」等は不適切）

## Articles

| # | タイトル | slug | 状態 |
|---|---------|------|------|
| 1 | 俺がClaude Codeの半分も使えてなかった話 | claude-code-features | 公開済み |
| 2 | Copilot → Cursor → Claude Code for VSC。俺が辿り着くまでの話 | ai-coding-tool-journey | 公開済み |
| 3 | ClaudeのMAXプランで何が変わるか | max-plan-review | 公開済み |
| 4 | OLTranslator — 画面をそのまま日本語にする翻訳アプリ | oltranslator-app | 公開済み |
| 5 | LiveTR — 音声をリアルタイムで翻訳するアプリ | livetr-app | 公開済み |
| 6 | Claude + 論文 = 実装。研究をコードに変える話 | claude-research-implementation | 公開済み |
| 7 | サーバーに実装する時にClaudeにSSH使わせたら驚くほど楽だった話 | claude-code-deploy | 公開済み |
| 8 | 5年育てた自分専用Botを、SaaSにして売り出した話 | discord-bot-to-saas | 公開済み |
| 9 | サーバー管理をAIに丸ごと任せてみた話 | ai-server-management | 公開済み |
| 10 | AIにサーバーを任せて3日間で起きたこと | ai-server-management-log | 公開済み |
| 11 | 手足を勝手に増やすAIアシスタントを作った話 | discord-ai-assistant | 公開済み |
| 12 | AIアシスタントに手足を増やそうと思ったら人格も増やしていた件 | ai-assistant-personality | 公開済み |
