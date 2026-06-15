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

- **SSG**: Hugo（テーマ: [hugo-paper](https://github.com/nanxiaobei/hugo-paper)、`themes/paper` にgit submoduleとして配置。初回クローン後の `git submodule update --init` が必要なのはこのため）
- **ホスティング**: GitHub Pages（git pushで公開）
- **記事**: Markdown（`content/post/<slug>/index.md`、Page Bundle形式）
- **カスタムCSS**: `assets/custom.css`（Claudeオレンジのカラースキーム、ライトモードのみ）
- **レイアウト上書き**: `layouts/_default/list.html`（トップページヘッダー画像）、`layouts/_default/single.html`（カバー画像表示）、`layouts/partials/footer.html`（GoatCounterスクリプト埋め込み）
- **カバー画像**: 各記事に `cover.png`（1250x500px）。生成スクリプト: `C:\Users\kite_\Documents\Program\_playwright\generate-cover.js`
  - 使い方: `node generate-cover.js "タイトル1行目" "タイトル2行目" "出力パス" ["コードテキスト"]`
  - デザイン: Claudeオレンジのグラデーション（左上暗→右下明）、ターミナル風枠（ボーダー `#dfcbc1`）、Noto Serif JP 600、背景にコードライン
- **baseURL**: `https://kitepon-rgb.github.io/WebAICoding/` — サブパス `/WebAICoding/` があるため、内部リンクは必ず `relref` を使うこと（直書きは404になる）
- **統計**: GoatCounter（claudecode-blog.goatcounter.com）
- **集客**: X（Twitter、Premium+）+ Zenn転載 — **Premium+特典で通常ポストも最大約25,000字の長尺OK**（X Articlesと別枠）。280字制約を前提にしない
- **X API**: Pay Per Use、キーは `.env.x-api`（gitignore済み）、アイデア帳は `x-api-ideas.md`（gitignore済み）、APIリファレンスは `x-api-reference.md`

## 記事の公開フロー（全プラットフォーム）

記事を公開する時は以下を**すべて**実行する。「コミット プッシュ」と言われたら全ステップ。

### 1. ブログ記事作成
- `content/post/<slug>/index.md` を作成（Page Bundle形式）
- frontmatter: `title`, `date`, `draft`, `description`, `tags`, `cover.image: "cover.png"`
- **dateに未来日付を使わない**（GitHub Actionsに `--buildFuture` がないため、未来記事はビルドから除外され404になる）
  - シリーズ慣例の `T12:00:00+09:00`（正午）を**そのまま流用しない**。午前に公開すると正午は未来扱い→404。**必ず現在時刻より前**にする（その時の時刻 or `T09:00:00+09:00` 等の過去時刻）
  - 症状: **デプロイActionsは success なのにページが404** → まず未来日付を疑う（`curl -sI <記事URL>` で確認）
- 内部リンクは必ず `relref` を使う（`[テキスト]({{< relref "slug" >}})`）

### 2. カバー画像生成
- スクリプト: `C:\Users\kite_\Documents\Program\_playwright\generate-cover.js`（playwright は **Windows 側**にあるので Windows node で回す。WSL node では不可）
- WSL からの実働手順:
  1. `powershell.exe -NoProfile -Command "cd 'C:\Users\kite_\Documents\Program\_playwright'; node generate-cover.js '1行目' '2行目' '<出力名>.png'"`（日本語引数はそのまま通る。コードテキスト引数は多行クオートが壊れやすいので既定でよい）
  2. 記事へコピー: `cp /mnt/c/Users/kite_/Documents/Program/_playwright/<出力名>.png content/post/<slug>/cover.png`
  3. `file …/cover.png` で 1250x500 を確認、`Read` で日本語の化けが無いか目視
- ⚠️ スクリプトの**既定出力パスは旧 `../Web/` リポジトリ**を指す → 出力先は必ず明示する（上記のように `_playwright` 直下へ出して cp）
- 1行が長すぎると折り返すので、タイトルを短く2行に分割する

### 3. 公開前監査（必須）
- `draft: false` で公開する前に監査エージェントを通す（詳細は下の「記事の公開前チェック」節）
- 指摘されたら即修正してから次へ

### 4. Zenn転載
- Zennリポジトリ: `C:\Users\kite_\Documents\Program\Zenn`（GitHub: kitepon-rgb/zenn-content）
- `articles/<slug>.md` にZenn形式で作成
- frontmatter: `title`, `emoji`, `type: "tech"`, `topics`, `published: true`
- 冒頭に `:::message この記事は [Claude Code 始めました](https://kitepon-rgb.github.io/WebAICoding/) からの転載です。:::`
- Hugo `relref` → ブログ絶対URL（`https://kitepon-rgb.github.io/WebAICoding/post/...`）に変換
- フッターの定型文は削除

### 5. CLAUDE.md Articles テーブル更新
- `## Articles` テーブルに `| # | タイトル | slug | 公開済み |` の行を追加

### 6. コミット & プッシュ
- Web（ブログ）とZenn、**両方**コミット & プッシュ
- 選択add（`git add CLAUDE.md content/post/<slug>/`）— `git add .` は使わない（gitignore外の作業ファイルが混入する）
- ⚠️ Zennリポジトリは push が弾かれることがある（dev.to自動転載のActionsが先行コミットするため）→ `git pull --rebase origin main` してから push し直す

### 7. X Article作成
- **前提: ブログのデプロイ完了を待つ**。X Article の表紙はブログのカバーURLをサーバが取得するので、**カバーURLが 200 になってから**作る（`curl -s -o /dev/null -w '%{http_code}' <記事URL>cover.png` でポーリング。404のままなら未来日付を疑う＝§1）
- **`xarticle` MCP 経由で直接下書きを作る**（チャットへのコピペ出力は不要になった）
  - `x_article_post`（`publish: false`）で「タイトル＋本文＋表紙画像」入りの下書きを一発で用意
  - **表紙画像は必ず「URL指定」で渡す**：ブログの公開カバーURL（例 `https://kitepon-rgb.github.io/WebAICoding/post/<slug>/cover.png`）を `coverImageUrl`（`x_article_post`）/ `imageUrl`（`x_article_set_cover`）に渡す → サーバが取得して添付。base64手打ちは巨大すぎて破損するので使わない
  - セッション情報はサーバ側に登録済み（`x_article_set_credentials` は再実行不要）
  - 下書きができたらユーザーに知らせる → ユーザーがプレビュー → **GO が出たら `x_article_publish` で公開**（公開＝同時に通常ポストも一本立つ。後戻りしにくいので勝手に公開しない）
  - マークダウンは自動変換される（見出し/太字/斜体/インラインコード/リンク/箇条書き・ネスト/順序付き/引用/コードブロック）
  - 非公開化は `x_article_unpublish`、削除は `x_article_delete`（削除は不可逆）
- フォーマットルールは `memory/feedback_x_article_format.md` 参照
- 要点: 全行間に `&nbsp;` 空行、見出しに絵文字、リンクはmarkdown形式、記事間リンクはX上のURLを使う
- 末尾に `📚 [記事一覧はこちら](トップページURL)` を入れる

### 8. X トップページ（目次）更新
- **X トップページ自体が X Article**（プロフィール固定の目次記事）。その記事の entityID は `x-top-page.md` 冒頭の HTML コメントに記録してある
- 元原稿（ソース）: `x-top-page.md`（このリポジトリ内、gitignore済み）。形式: カテゴリ見出し + 絵文字付きタイトルリンクの一覧。**1行説明はつけない**
- 新記事を適切なカテゴリに追加（なければカテゴリも新設）。リンクは新記事の X URL（§9で確定）
- **反映は MCP で直接やる（手動コピペ不要）**: `x_article_unpublish`（entityID）→ `x_article_update_content`（本文markdown）→ `x_article_publish`
  - 本文markdown = `x-top-page.md` の中身を変換: 冒頭の HTML コメントは除く / `←H1にする`（=記事タイトル）は本文に含めず**触らない** / `←H2/H3にする` は `##`/`###` に / `←リンク: URL` は `[タイトル](URL)` に
  - **本文更新は Draft 状態でしか効かない**（Published のままだと `expected Draft` で弾かれる）→ だから `unpublish` が先
  - ⚠️ **再公開で新しいリンクツイートが立つ** → プロフィールの固定ツイートを新ツイートに付け直す（ユーザー作業）

### 9. URL記録
- X Article公開後、ユーザーにURLを聞いて `memory/reference_x_articles.md` に追記
- 同時に `x-top-page.md` の「公開後に追記」を実URLに置き換え

### 10. 英語PR (Quote-RT)
- JA記事のX URLを引用RTする形で、英語ポストを投稿
- 3案（短尺/中尺/長尺）を**日本語ドラフト**で提示してユーザーに選んでもらう
- 選択後に英語に翻訳して出力（Premium+の長尺活用OK、280字制約は前提にしない）
- ⚠️ **投稿はClaudeにはできない**（xarticle MCP は記事専用で引用RT不可、`.env.x-api` は xarticle トークンのみで X API の OAuth キーが無い）→ **ユーザーが手動投稿**。もし `.env.x-api` に OAuth キー4点（API Key/Secret + Access Token/Secret・`tweet.write`付き）を足せば、`twitter-api-v2`（`_playwright/node_modules`）で `v2.tweet(text, { quote_tweet_id })` を叩いてClaudeが投稿可能になる
- 用途: 英語圏Claude Code層への到達拡張

### dev.to への英語転載（自動・公開フローに手動ステップなし）
- Zennが記事を自動英訳すると（日本語公開から数日後）、`kitepon-rgb/zenn-content` リポジトリのGitHub Actions（毎日09:00 JST cron）が英語版を dev.to へ転載する
- 時系列順に1日1本ずつ投稿。本文の内部リンクは dev.to のリンクへ貼りかえ（前方参照は後追いで自動修正）
- 新記事はZennフィード経由で自動的に転載キューへ加わる。手動作業は不要
- 仕組みの詳細は `zenn-content` リポジトリの README を参照

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
- 時代感の誇張に注意（2月中旬から数か月にわたる継続的な活動。「時代」のような大げさな括りは避ける）

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
| 13 | AI秘書のトークン節約を必死に調べた記録 | ai-secretary-token-diet | 公開済み |
| 14 | 長期記憶を構造化記憶にしてみた話 | ai-secretary-memory-system | 公開済み |
| 15 | コンテキストの87%が使い捨てだったので自分で対策した話 | throughline-context-diet | 公開済み |
| 16 | Claude Codeの"続きから"を実装するのに、自動検知を諦めた話 | throughline-declare-over-detect | 公開済み |
| 17 | Throughline を npm に公開した — Claude CodeのツールI/OをSQLiteに退避するhook | throughline-release | 公開済み |
| 18 | Caveat を npm に公開した — 同じ罠を二度踏まないための長期記憶レイヤ | caveat-release | 公開済み |
| 19 | Claudeのツール呼び忘れを別Claudeに監査させたら、デーモンが74個立った話 | spotter-release | 公開済み |
| 20 | Claudeに「気をつけて」を書くのを諦めて、外側から3つ補強した話 | claude-augment-trilogy | 公開済み |
| 21 | Claudeに計画書を監査させたら、シーソーが止まらなかった話 | claude-audit-seesaw | 公開済み |
| 22 | 俺がWSL2を知らずにClaude Codeを2ヶ月使ってた話 | wsl2-late-discovery | 公開済み |
| 23 | 自宅鯖のハード選びと引っ越しをClaudeに丸投げしたら1日で終わった話 | bc250-to-ms-a2 | 公開済み |
| 24 | 省エネのためにPi 5で鯖監視機を作ったら、ついでに動画も流し始めた話 | pi5-server-monitor | 公開済み |
| 25 | 「そのツール、ありません」とAIが言う本当の理由は、DDNSだった | dns-blindspot | 公開済み |
| 26 | 作るのも広めるのも速くなった。届ける方は、まだまだ | build-fast-reach-slow | 公開済み |
| 27 | aiterm-mcp を npm に公開した — AIに「1本の永続ターミナル」を握らせてトークンを削るMCPサーバ | aiterm-release | 公開済み |
| 28 | Claudeに対話型コマンドを握らせたら、Codex CLIごと子分にできた話 | claude-drives-codex | 公開済み |
| 29 | 英語は読めるのに聞き取れない。AIなら教材は無限だと気づいて、リスニングアプリを出した話 | kikoeru-listening | 公開済み |

<!-- autoskills:start -->

Summary generated by `autoskills`. Check the full files inside `.claude/skills`.

## Accessibility (a11y)

Audit and improve web accessibility following WCAG 2.2 guidelines. Use when asked to "improve accessibility", "a11y audit", "WCAG compliance", "screen reader support", "keyboard navigation", or "make accessible".

- `.claude/skills/accessibility/SKILL.md`
- `.claude/skills/accessibility/references/A11Y-PATTERNS.md`: Practical, copy-paste-ready patterns for common accessibility requirements. Each pattern is self-contained and linked from the main [SKILL.md](../SKILL.md).
- `.claude/skills/accessibility/references/WCAG.md`

## Design Thinking

Create distinctive, production-grade frontend interfaces with high design quality. Use this skill when the user asks to build web components, pages, artifacts, posters, or applications (examples include websites, landing pages, dashboards, React components, HTML/CSS layouts, or when styling/beaut...

- `.claude/skills/frontend-design/SKILL.md`

## SEO optimization

Optimize for search engine visibility and ranking. Use when asked to "improve SEO", "optimize for search", "fix meta tags", "add structured data", "sitemap optimization", or "search engine optimization".

- `.claude/skills/seo/SKILL.md`

<!-- autoskills:end -->
