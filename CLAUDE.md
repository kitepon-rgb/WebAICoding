# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

「Claude Code 始めました」— Claude MAXユーザーの実体験ベース技術ブログ。Hugo + GitHub Pagesで構築。

## Build & Development

```bash
hugo server -D   # ローカルプレビュー（下書き含む。Hugo extended 推奨）
hugo             # 本番ビルド（public/に出力）
```

自前テーマは `layouts/` + `assets/` に同梱。**外部テーマ submodule は不要**（旧 hugo-paper 廃止）。

> 💻 **この Mac には hugo extended を導入済み**（`brew install hugo`）＝ローカルで `hugo`（ビルド）/`hugo server`（プレビュー）/未来日付404の検証が可能。記事を直したら push 前にローカルビルドで確認できる。

## Deployment

mainブランチにpushすると GitHub Actions（`.github/workflows/deploy.yml`）が自動でビルド＆デプロイ。手動デプロイ不要。

## Architecture

- **SSG**: Hugo + **自前テーマ**（外部テーマ不使用）。デザイン=「Warm Terminal Editorial」＝クリーム基調＋珊瑚色（Claudeオレンジ）＋ターミナル/コードのモチーフ。レイアウトは全て `layouts/` 配下（旧 [hugo-paper] / `themes/paper` submodule は廃止。`git submodule update --init` も不要）
- **ホスティング**: GitHub Pages（git pushで公開）
- **記事**: Markdown（`content/post/<slug>/index.md`、Page Bundle形式）
- **CSS**: `assets/css/main.css`（素のCSS・フレームワーク不使用・ライトモードのみ）。`baseof.html` が `resources.Get "css/main.css" | fingerprint` で**ハッシュ付きURL `/css/main.<hash>.css`** で配信＝**変更のたびURLが変わりブラウザ/Cloudflareのキャッシュを自動破棄**（CSSを直したら確実に反映される。同一URL据え置きでスマホが旧CSSを掴む罠を回避）
- **レイアウト（自前テーマ）**: `layouts/_default/baseof.html`（head・上部バー・フッター・GoatCounter を内包）／`list.html`（ホーム＝ヒーロー＋カテゴリpill＋ダーク注目帯＋**記事カバーのターミナル窓カード**グリッド。タグ/section 一覧も兼用）／`single.html`（記事＝明朝見出し＋ドロップキャップ＋ターミナル風コードブロック＋前後ナビ）。フォント: 見出し=Noto Serif JP / 本文=Zen Kaku Gothic New / コード=JetBrains Mono
- **デザインシステム**: claude.ai/design の「claude-code-blog」プロジェクトに同期（`DesignSync` ツール）。デザインを大きく変える時はそこで詰めて `layouts/` + `assets/css/main.css` に反映する
- **カバー画像**: 各記事に `cover.png`（1250x500px = 2.5:1）。生成スクリプトは**プロジェクト内 `tools/cover/generate-cover.js`**（playwright で HTML→PNG。**OS非依存＝Windows/Mac/Linux どれでクローンしても同一出力**。クローン後 `cd tools/cover && npm ci && npx playwright install chromium` で準備。詳細は `tools/cover/README.md`）
  - 使い方: `node generate-cover.js "タイトル1行目" "タイトル2行目" "出力パス" ["コードテキスト"]`
  - デザイン: Claudeオレンジのグラデ（**実色 左上 `#c4603a` → 右下 `#e89f6f`**）、ターミナル風枠（ボーダー `#dfcbc1`）、見出し Noto Serif JP 600、背景コード Courier Prime（旧 `Courier New`＝Windows専用を OS非依存の Web フォントに置換）、背景にコードライン
  - ⚠️ カバーは**ホームのカード・注目帯・記事冒頭**で表示＝実質必須。未設定だと `slug.md` のターミナル風プレースホルダになる
- **📱 スマホ記事一覧カード ＝ 確定仕様（再設計禁止。下記の通りに作る／触らない。違うカードを作ると過去の調整が全部無駄になる）**: PCは横長カバーで問題ないが、スマホの行レイアウトでは 2.5:1 を `object-fit:cover` で左右トリミングしてしまう。これを **iPhone 用の正方形カバー `cover-sm.png`（1:1, 1080×1080）** で解決した（多数の反復で確定済み）。
  - **cover-sm 生成**: `cd tools/cover && node generate-cover.js --mobile "短い見出し" "" "../../content/post/<slug>/cover-sm.png"`（1:1）。見出しは**正式タイトルではなく短いフック**（本文 h4 に正式タイトルが出るので重複を避け、大きく読ませる）。スラッグ→短見出しは `tools/cover/mobile-covers.json`、全記事一括は `node tools/cover/gen-mobile-covers.js`。**新記事を足したら mobile-covers.json に1行追加して再生成**するだけ
  - **cover-sm デザイン（generate-cover.js の `--mobile`）**: PC版と同じ意匠（同グラデ `#c4603a→#e89f6f`・枠 `#dfcbc1`・背景 Courier Prime のコードライン）。タイトル＝**左寄せ・最大3行・自動縮小**で大きく。その下に**センタリングの区切り線（幅264px・高さ4px・色 `#d6bcae`）**＋**センタリングの「Claude Code 始めました」（Noto Serif JP 54px）**
  - **配信**: `list.html` のカード `.thumb` を `<picture>` 化＝`<source media="(max-width:600px)" srcset=cover-sm.png>` ＋ 既定 `<img src=cover.png>`（PCは 2.5:1 のまま据え置き）
  - **カードCSS（`main.css` の `@media(max-width:600px)`、この値で確定・触らない）**: `.card{flex-direction:row;border:1px solid var(--line);border-radius:14px;align-items:stretch;height:116px}`（**コーラルの左装飾ボーダーは付けない**＝カバー外縁との色不一致と左下の窪みの原因）／`.card .chrome{display:none}`／`.card .thumb{flex:0 0 116px;width:116px;align-self:stretch}`（**固定高さ `height:116px` にしない**＝border 分で内側114pxとなり上下中央からズレるため `align-self:stretch` で内側に合わせる）／`.c-body{flex:1;justify-content:center}`
- **本文画像（2026-06 に全32記事へ導入）**: 各記事の本文に図・スクショ・イラスト・表を配置（**記事=主／画像=従**。実物ソース厳選、**Claudeモデルの手描き厳禁**、**フル画質で出す＝圧縮/縮小/WebP化はしない**）。詳細方針は `memory/feedback_blog_image_policy.md`、インフラは `memory/project_blog_image_infra.md`
  - **自動キャプション**: `layouts/_default/_markup/render-image.html`（render hook）が本文の `![alt](file.png)` を `<figure>`＋`<figcaption>`（alt=キャプション）でラップ。スタイル `.prose figure.fig-img`
  - **OGPリンクカード**: `layouts/shortcodes/linkcard.html` = `{{< linkcard url= title= desc= site= image= >}}`（App Store / GitHub / BOOTH / X 等のプレビューカード）。スタイル `.prose a.linkcard`
  - **画像の作り方（手段）**: ①ブランド図版=`~/Developer/blog-figmaker/`（Mac, playwright で HTML→PNG。`render.mjs` 単体 / `render-batch.mjs` 一括、`brand.css` は main.css の `:root` と一致）②イラスト=`mcp__claude_ai_X-HERMES-MCP__generate_image`（grok-imagine。文字/UI/図表は描けない＝雰囲気カット専用、no-text 厳守）③スクショ=chrome-devtools MCP（`filePath` はワークスペース root 内のみ）④自作アプリ=元 repo の `.github/*.png` 等を流用。実機由来の画面（OLED等）は捏造せず実機コードを実走（例: `ServerManager/pi5/oled/render.py`、macOSはフォントパス差し替え）
  - ⚠️ **本文画像は CSS と違い fingerprint されない**＝既存画像を同一URLで差し替えても Cloudflare が 4h（`max-age=14400`）キャッシュして反映されない。**差し替え時はファイル名を変える**（例 `fig1.png`→`oled.png` ＋ md 参照変更）。新規追加画像は新URLなので問題なし
- **baseURL**: `https://blog.kitepon.dev/`（カスタムドメイン。Cloudflare DNS only の CNAME `blog`→`kitepon-rgb.github.io`／GitHub Pages が Let's Encrypt 発行）。旧 `https://kitepon-rgb.github.io/WebAICoding/` は GitHub が 301 で新ドメインへ自動リダイレクトするので過去リンクは生きている。内部リンクは引き続き `relref` を使う（ドメイン変更に強い・直書き回避）
- **統計**: GoatCounter（claudecode-blog.goatcounter.com、`layouts/_default/baseof.html` に埋め込み）
- **OGP/SNS画像（X にリンクを貼った時のカード画像）**: `baseof.html` が設定。**記事は各自の `cover.png`**、**cover を持たないページ（トップ／タグ／section／About）は既定 `static/og-card.png`** を使う（昔はトップに og:image が無く X で画像が出なかった→修正済み）。常に `twitter:card=summary_large_image`＋`twitter:image`。
  - `og-card.png` ＝**リニューアル後の実トップのヒーローを再現**した意匠（カバー風ではない。クリーム地＋紙グレイン／コーラルの kicker `$ ~/claude-code-hajimemashita`＋カーソル／明朝大見出し「設計は自分、実装は**Claude**。」＋「Claude」コーラル＋下線）。再生成は `node tools/cover/gen-og-hero.js`（1200×630＝X推奨1.91:1）
  - ⚠️ **OG画像を差し替える時はファイル名を変える**（同名据え置きだと CDN/X がキャッシュして反映されない＝本文画像と同じ罠。例 `og-card.png`→`og-hero2.png` ＋ baseof.html 更新）。Xはカード自体もキャッシュするので、確認は `https://blog.kitepon.dev/?x` のようにクエリを足して取り直させる
- **集客**: X（Twitter、Premium+）でブログ記事へ**誘導するフック投稿** ＋ Zenn / dev.to 転載。**per-article の X Article（長文全文）は廃止**（全文はブログ＋Zenn＋dev.toに既出で4本目は冗長・拡散も弱い）。Premium+の長尺（最大約25,000字）は使えるが前提にしない。280字制約も前提にしない
- **X API**: Pay Per Use、キーは `.env.x-api`（gitignore済み）、アイデア帳は `x-api-ideas.md`（gitignore済み）、APIリファレンスは `x-api-reference.md`

## 記事レール広告「旗(flag)」 — 確定仕様（このロジックで作る。再設計禁止・触る時はこの通り）

PC記事ページ(`single.html`, `.Type=="post"`)の本文左右の余白に、**縦長バナーを左右1枚ずつ＝計2枚**出す。**左=自作プロダクト / 右=厳選アフィリ(Amazonアソシエイト単独・楽天不使用)**。AdSense等の自動配信は使わない＝**外部JSゼロの静的バナー**、データ駆動。意匠は「ブランドの旗」。

**表示条件・配置（CSS: `assets/css/main.css` 末尾の `@media(min-width:1100px)` ブロック）**
- viewport **≥1100px でのみ表示**（iPad横でも出る／縦持ち・スマホ・狭PCは `display:none`）。既定 `.ad-rail{display:none}`、`@media print` も非表示。既存メディアは全て `max-width` なので衝突なし。
- レールは本文`.post`(704px中央寄せ)を**一切動かさず**、`.post__body`（= `single.html` で cover〜pnav〜レールを包む div）を `position:relative` のアンカーにして `.ad-rail` を `position:absolute; top:var(--rail-top); bottom:0` で外側余白へ。内側 `.ad-rail__inner` が `position:sticky; top:7rem` で追従。左右位置は `left/right:calc(100% + var(--rail-gap))`。**バナー上端は記事タイトルより下**（`--rail-top:0` で `.post__body`＝カバー位置から開始）。
- 調整は `:root` の変数：`--rail-w:160px`（幅）/ `--rail-gap:28px`（本文との間隔）/ `--rail-img:280px`（画像高）/ `--rail-top`（開始位置）/ `--flag-skew:16px`・`--flag-inset:4px`（斜めカット）。

**旗の構造（`layouts/partials/ad-rail.html` が描く `.ad-flag`）**：上から
1. **マストヘッド** `.ad-flag__mast`（espresso地）＝サイト象徴フレーズ `$ ~/claude-code-hajimemashita` ＋点滅カーソル（ヒーローのkickerと同一。mono・コーラルの`$`）。
2. **画像** `.ad-flag__pic`（`--rail-img`高）。下地は**縦グラデ＝上espresso(マストと同色で白線が出ない)／下`flag-skew+inset`分クリーム(足元に馴染む)**。画像は `clip-path` で**上下を斜めカット**＝`polygon(0 calc(skew+inset), 100% inset, 100% calc(100%-inset), 0 calc(100%-skew-inset))`（**傾きは左が深い／右端は y=inset で角に張り付かせない＝右端も斜めに見せる**）。`margin-top:-1px`でマストと重ね白線封じ。
3. **PR/自作チップ** `.ad-flag__chip`＝**白文字＋コーラル地で統一**（半透明だと暗い画像で溶ける）。右=「PR」/左=「自作」。
4. **本文** `.ad-flag__body`（クリーム地）：**名前**＝先頭1文字だけ大きく（`::first-letter{font-size:1.5em}`・**フロートせずベースライン＝下端を後続と揃える**。ドロップキャップ/コーラル縦線は不可＝ダサい）／**一言**＝**「特徴(差別化点)」だけ**を `<b>` で囲み記事本文と同じコーラルのマーカー（`.ad-flag__blurb b` = `.prose strong` と同意匠。**要点(topic)でなく特徴**）／**出自**＝コーラルの□付きmono（下）。CTA・長い法令文は置かない。
5. **コーラル旗竿**（左）＝`.ad-flag::before`のオーバーレイ（`border-left:4px` 直書きは角丸で**窪み**が出るので使わない＝カードと同じ轍）。四隅は `border-radius:13px`（左右とも丸い）。

**データ駆動（新しい広告はこのロジックで＝データ編集のみ）**
- `data/self_ads.yaml`（自作）/ `data/gear_ads.yaml`（Amazon）。各 item: `name/category/image/url/blurb/badge/accent(0-4)/rail(left|right)/enabled/weight` ＋任意 `pos`（横長OG画像は `"left top"`等で要所を見せる）/ gearは `program:amazon`・`rel:"sponsored nofollow noopener"`。
- `blurb` は **HTML可（partialで `safeHTML`）**。**特徴のキーワードだけ `<b>`** で囲む。
- 表示は記事ごとに pool内を**ローテーション**（`mod($page.Date.Unix, len)`＝静的・JSなし）。空(`items:[]`)なら描かない（準備中は出さない＝フォールバック禁止）。
- 画像は `static/ads/`（self）/`static/ads/gear/`（Amazon）に置き **`-v1`等バージョン命名**（fingerprint されず Cloudflare 4hキャッシュの罠）。縦長(9:16前後)が枠に最適。Amazon機材画像は当面 grok生成のデモ仮（`mcp__claude_ai_X-HERMES-MCP__generate_image`、9:16・no-text・ダーク+コーラル）→本番はメーカー公式product画像へ差替。

**法令(PR)・ロールアウト**
- 右レール(アフィリ)は **PRチップ＋ページフッターのAmazon定型文**（`baseof.html`／`hugo.Data.gear_ads.items` に enabled があれば `.ad-legal` を1回表示）で景表法ステマ規制＋Amazon規約を満たす。**各広告に密な法令文は置かない**（広告臭を消す）。**価格はバナーに焼かない**（PA-API無しでのAmazon価格表示は規約違反）。
- **フェーズ1=自作(左右ともローテーション可)で即公開可**。**フェーズ2=ユーザーがAmazonアソシエイト登録→アソシエイトタグを渡したら** `gear_ads.yaml` の `url` の `tag=PLACEHOLDER-22` を本物に・画像を公式に差替＝右が本番点灯（コード変更不要）。Amazon PA-APIは2026/5廃止＋新規停止＝自動取得は不可、手キュレーション。

## 記事の公開フロー（全プラットフォーム）

記事を公開する時は以下を**すべて**実行する。「コミット プッシュ」と言われたら全ステップ。

### 1. ブログ記事作成
- `content/post/<slug>/index.md` を作成（Page Bundle形式）
- frontmatter: `title`, `date`, `draft`, `description`, `tags`, `cover.image: "cover.png"`
- **自前テーマでの効き方（書く時に意識）**:
  - `tags` の**先頭タグがホームのカードのカテゴリ表示**になる → 主カテゴリを先頭に置く
  - `description` は**最新記事だとトップの「注目」カードに本文として表示**される → 短く魅力的に
  - `cover.png` は**ホームのカード等でも表示**＝実質必須（未設定はプレースホルダ）
- **dateに未来日付を使わない**（GitHub Actionsに `--buildFuture` がないため、未来記事はビルドから除外され404になる）
  - シリーズ慣例の `T12:00:00+09:00`（正午）を**そのまま流用しない**。午前に公開すると正午は未来扱い→404。**必ず現在時刻より前**にする（その時の時刻 or `T09:00:00+09:00` 等の過去時刻）
  - 症状: **デプロイActionsは success なのにページが404** → まず未来日付を疑う（`curl -sI <記事URL>` で確認）
- 内部リンクは必ず `relref` を使う（`[テキスト]({{< relref "slug" >}})`）

### 2. カバー画像生成
- スクリプト: **プロジェクト内 `tools/cover/generate-cover.js`**（playwright・OS非依存。詳細は `tools/cover/README.md`）
- 初回のみセットアップ: `cd tools/cover && npm ci && npx playwright install chromium`（Linux で共有ライブラリ不足なら `npx playwright install-deps chromium`）
- 実働手順:
  1. `cd tools/cover && node generate-cover.js "1行目" "2行目" "../../content/post/<slug>/cover.png"`（記事へ直接出力。コードテキスト第4引数は省略でよい＝既定のターミナルログが入る）
  2. `file ../../content/post/<slug>/cover.png` で 1250x500 を確認（手順1で `cd tools/cover` 済みのため相対）、`Read` で日本語の化けが無いか目視
- 1行が長すぎると折り返すので、タイトルを短く2行に分割する

### 3. 公開前監査（必須）
- `draft: false` で公開する前に監査エージェントを通す（詳細は下の「記事の公開前チェック」節）
- 指摘されたら即修正してから次へ

### 4. Zenn転載（**本リポジトリに統合済み＝別repo不要**）
- Zenn記事は**本リポジトリのルート直下 `articles/<zennSlug>.md`**（旧 `kitepon-rgb/zenn-content` / Windows パス `C:\...\Zenn` は統合済みで廃止。Zenn の連携先リポジトリも本リポジトリ＝WebAICoding）
- **同期はスクリプトで再生成**: `node tools/zenn-sync/sync.mjs` が `content/post/<slug>/index.md` から `articles/<zennSlug>.md` を作る。Zenn固有 frontmatter（`title`/`emoji`/`type`/`topics`/`published`）は既存Zennファイルから**温存**し本文だけ差し替え（詳細 `tools/zenn-sync/README.md`）
  - 変換: 本文画像→ブログ絶対URL `https://blog.kitepon.dev/post/<slug>/...` ＋直下に `*alt*` キャプション（Hugo の figcaption 再現）/ `{{< linkcard >}}`→`@[card](url)` / `{{< relref >}}`→ブログ絶対URL / 冒頭に転載バナー（`:::message この記事は [Claude Code 始めました](https://blog.kitepon.dev/) からの転載です。:::`）
  - **スラッグ5本ズレ対応表**（ブログ slug→Zennファイル名。`sync.mjs` と `.github/scripts/crosspost-devto.mjs` の両方に同一定義を持つ）: `claude-code-features`→`claude-code-half-features` / `claude-code-deploy`→`claude-code-ssh-deploy` / `max-plan-review`→`claude-max-plan-review` / `claude-research-implementation`→`claude-research-from-papers` / `livetr-app`→`livetr-realtime-translator`
- **新記事を足したら**: ①先に `articles/<zennSlug>.md` を frontmatter だけ作る（emoji/topics は Zenn 用に手で選ぶ。本文は空でよい）→ ② `node tools/zenn-sync/sync.mjs` で本文を流し込む（既存frontmatterが無い新規slugは①が無いとエラーで停止する＝取りこぼし防止）
- 同期後は `git diff articles/` で期待差分（画像追加 / `@[card]` / ドメイン）だけかを目視してからコミット

### 5. CLAUDE.md Articles テーブル更新
- `## Articles` テーブルに `| # | タイトル | slug | 状態 |` の行を追加

### 6. コミット & プッシュ
- ブログ本文・`articles/`（Zenn）は**同一リポジトリ**なので**1回のコミットで両方入る**（別repoへの二重 push は不要になった）
- 選択add（`git add CLAUDE.md content/post/<slug>/ articles/<zennSlug>.md`）— `git add .` は使わない（gitignore外の作業ファイルが混入する）
- ⚠️ push が弾かれることがある（dev.to自動転載のActionsが `crossposted-devto.json` を先行コミットするため）→ `git pull --rebase origin main` してから push し直す

### 7. X投稿（ブログへ誘導するフック投稿）
- **前提: ブログのデプロイ完了を待つ**（カバーURLが 200 になってから。`curl -s -o /dev/null -w '%{http_code}' <記事URL>cover.png` でポーリング。404のままなら未来日付を疑う＝§1）
- **per-article の X Article（長文記事）は廃止**（全文はブログ＋Zenn＋dev.toに既出で4本目は冗長／長文Articleはネイティブ拡散が弱く運用も重い）。X は「フックで本家ブログへ誘導する」チャネルとして使う
- ブログ記事URLへ誘導する**通常ポスト（必要なら短いスレッド）**を作る。フック＋記事URL＋カバー画像。Premium+の長尺は使えるが、要点はあくまで誘導
- ⚠️ **投稿はClaudeにはできない**（`.env.x-api` は xarticle トークンのみで X API の OAuth キーが無い）→ Claudeが**ドラフトを用意し、ユーザーが手動投稿**。OAuth キー4点（`tweet.write`付き）を `.env.x-api` に足せば `twitter-api-v2` でClaude投稿も可能になる
- 既存の per-article X Article 32本は**削除しない**（放置。`x_article_delete` は不可逆）

### 8. X トップページ（目次）— 現状維持・更新は任意
- プロフィール固定の目次 X Article（既存）は**そのまま残す**。per-article 廃止に伴い、記事公開のたびに目次を更新する運用はやめる
- 更新したい場合のみ手動で（手順は従来通り `x_article_unpublish`（entityID）→ `x_article_update_content`（本文markdown）→ `x_article_publish`、元原稿 `x-top-page.md`）。本文更新は Draft 状態でしか効かない／再公開で新リンクツイートが立ち固定の貼り直しが要る点も従来通り

### 9.（廃止）X Article URL記録
- per-article Article を作らなくなったため、`memory/reference_x_articles.md` への Article URL 追記工程は廃止

### 10. 英語PR (Quote-RT)
- JAのフック投稿（§7）の X URL を引用RTする形で、英語ポストを投稿
- 3案（短尺/中尺/長尺）を**日本語ドラフト**で提示してユーザーに選んでもらう
- 選択後に英語に翻訳して出力（Premium+の長尺活用OK、280字制約は前提にしない）
- ⚠️ **投稿はClaudeにはできない**（xarticle MCP は記事専用で引用RT不可、`.env.x-api` は xarticle トークンのみで X API の OAuth キーが無い）→ **ユーザーが手動投稿**。もし `.env.x-api` に OAuth キー4点（API Key/Secret + Access Token/Secret・`tweet.write`付き）を足せば、`twitter-api-v2`（`_playwright/node_modules`）で `v2.tweet(text, { quote_tweet_id })` を叩いてClaudeが投稿可能になる
- 用途: 英語圏Claude Code層への到達拡張

### dev.to への英語転載（**本リポジトリに統合**・公開フローに手動ステップなし）
- 仕組みは**本リポジトリに同居**: `.github/workflows/crosspost-devto.yml`（毎日09:00 JST cron ＋ 手動 `workflow_dispatch`）＋ `.github/scripts/crosspost-devto.mjs`（Zenn英語版ページ `?locale=en` のHTML→md化→dev.to API）＋ 台帳 `crossposted-devto.json`・順序 `post-order.json`。要 `DEVTO_API_KEY`（**本repoのSecrets**に登録）
- Zennが記事を自動英訳すると（日本語公開から数日後）、cronが時系列順に1日1本ずつ dev.to へ投稿。新記事はZennフィード経由で自動でキュー末尾へ加わる。手動作業は不要
- 本文の内部リンクは dev.to のリンクへ貼りかえ（前方参照は後追いで自動修正）。本文画像はブログ絶対URLが英語ページ経由でそのまま入る
- ⚠️ **転載済み記事は自動で再送されない**（dev.to 既出分は内容を直しても更新されない設計）。既出分に後からリッチ化（画像等）を反映するには、`crosspost-devto.mjs` に再同期（台帳idへ PUT）モードを足して回す必要がある

## 記事の公開前チェック（必須）

記事を書いたら、**公開（`draft: false`）前に必ず監査エージェントを通すこと。**

チェック項目：
- 不要な逆接（「でも」「ただ」「しかし」）が本当に逆接になっているか
- 同じ主張・説明の重複がないか
- 一文が長すぎないか、時系列が前後していないか
- タイトルの日本語（助詞の衝突等）が自然か
- 内部リンクが `relref` ショートコードを使っているか（baseURLにサブパスがあるため `/post/...` の直書きは404になる）

**著者像・作為のチェック（#29 で確立。著者は賢く率直。作為を足すと「馬鹿にされた」と映る）：**
- **つまずき演出を排す**：「ここで詰まる」「手が止まった」「本当に〜できるのか／確かめる必要が出てきた」等の障害→克服ドラマを各段に挿さない。著者はスッと判断して進む。世界側の事実（例：既存教材は有限）は淡々と書き、著者が詰まった体にしない
- **思い込み・無知に見せない**：「本気で信じてた」「勝ったと思った」式の素朴な信者像、既知の当たり前を「盲点／発見」として書く、を排す。著者は全可能性を疑いながら作る。方針転換は打ちのめされた結果でなく淡々とした判断
- **捏造した教訓に着地しない**：「分かったこと」「一番効いたのは〜」式の、本人が真理と思ってもいない一般論で締めない。事実で終え、結論は読者に委ねる
- **自分・自社製品を下げない**：偽の謙遜、製品の弱点露出（未達／近似／割り切り）を書かない
- **語ってからの否定で入らない**：「Xを出した。ただ宣伝じゃない」式のメタな前置きを置かず、本題から入る
- **軸は著者の実体験の動機（なぜ作ったか）**：設計の落差・撤去ドラマ等のエンジニアリングの脇筋を勝手に主役にしない。一次情報（本人の語り）を最優先

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
| 30 | AIが働くのを眺めるのが好きすぎて、ターミナルをRPGにした話 | rpgdev-overlay | 公開済み |
| 31 | 完全な文だけを訳に回す——その設計を、カウンタ一本が裏切っていた | livetr-complete-sentence | 公開済み |
| 32 | 同じキャラが描けないAIに、アニメの「設定資料」を作らせた話 | sprite-forge-release | 公開済み |

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
