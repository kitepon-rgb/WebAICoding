# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

「Claude Code 始めました」— Claude MAXユーザーの実体験ベース技術ブログ。Hugo + GitHub Pagesで構築。

## Canonical Docs

- 全体地図: `docs/00_overview.md`
- 設計判断: `docs/adr/`
- 調査・研究の再利用棚: `rag/INDEX.md`
- 文体の初稿規則（順接・否定の持ち出し禁止・初心者配慮）: `docs/writing-voice.md`

`.claude/settings.json` は端末固有のためコミットしない。必要な場合は `fewer-permission-prompts` で読み取り系 allowlist を生成し、内容を確認してからローカルに置く。

## Build & Development

```bash
hugo server -D   # ローカルプレビュー（下書き含む。Hugo extended 推奨）
hugo --minify    # 本番ビルド（GitHub Pages deploy と同じ。public/に出力）
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

PC記事ページ(`single.html`, `.Type=="post"`)の本文左右の余白に、**縦長バナーを左右1枚ずつ＝計2枚**出す。**左右とも自作プロダクト**（左右で別製品をローテ）。**Amazonアフィリ(第三者枠)は2026-06に廃止**＝規約上 商品画像をコピー/ホットリンクできず、正規路(PA-API/Creators API)も売上要件で使えないため（一次ソース＝`~/Developer/ad-studio/rag/amazon-associates/image-policy.md`）。AdSense等の他社自動配信も使わない。意匠は「ブランドの旗」。
- **配信は動的（2026-06 に静的描画から移行）**: ブログのレールは**枠だけ静的に描き**、中身を **Ad Studio（`https://studio.kitepon.dev`）の `/serve` から fetch して差し込む**（承認済みプールから**毎ロード ランダム**で1枚＝記事固定でない・リロードで入替。左=自作self/右=第三者gear・右はgear0なら空）。**studioで承認した瞬間に反映＝再ビルド/GitHub不要**。studioが落ちている時は**空**（フォールバック禁止＝黙って静的に戻さない）。旧「`data/*_ads.yaml` を hugo が静的に焼き込む」方式は廃止（広告候補が複数ある以上、どれを出すかはサーバが決める）。Ad Studio は別repo `~/Developer/ad-studio`（メイン鯖192.168.1.2常駐・cloudflared）。**構造の正本＝`~/Developer/ad-studio/docs/ARCHITECTURE.md`**（HTTP API・データモデル・状態遷移・画像パイプライン・配信・レガシー判定）。
- **広告ブロッカー対策（必須・触る時も維持）**: クラスは `kp-*`（旧 `ad-*` は uBlock 等のコスメティックフィルタ `[class^="ad-"]` で問答無用に消される＝自作宣伝まで巻き添え）、画像パスは `/store/`（旧 `/ads/`）、配信は同ルートドメイン `studio.kitepon.dev/serve`（中立名・`/ad` を含めない）。これで拡張・DNSフィルタに関係なく全訪問者に出る。**`ad-*`/`/ads/` へ戻さない。**

**表示条件・配置（CSS: `assets/css/main.css` 末尾の `@media(min-width:1100px)` ブロック）**
- viewport **≥1100px でのみ表示**（iPad横でも出る／縦持ち・スマホ・狭PCは `display:none`）。既定 `.kp-rail{display:none}`、`@media print` も非表示。ローダJSも `innerWidth<1100` では fetch しない（モバイルで無駄打ちしない）。既存メディアは全て `max-width` なので衝突なし。
- **配置＝各ガター中央寄せ＋viewport下端固定（2026-06-22 確定。再設計禁止・スクロールで1pxも動かさない）**: `.kp-rail` を **`position:fixed`** にして、本文`.post`(704px=44rem)の**左右の余白(ガター)をそれぞれ箱**にする＝`width:calc((100% - var(--post-w)) / 2)`・`.kp-rail--left{left:0}`/`.kp-rail--right{right:0}`。箱の中で旗を **`justify-content:center`（ガターの左右中央）＋`align-items:flex-end`＋`bottom:var(--rail-bottom)`（ウィンドウ下端から浮かす）**。内側 `.kp-rail__inner`（＝`/serve` の旗HTMLが JS で入る箱・`position:static;width:var(--rail-w)`）。
  - **スクロールバー非対称の罠（重要）**: 幅計算に **`vw` を使わない**。`100vw` はスクロールバーを含むので右ガターが数pxズレる。`position:fixed` の `%`／`left:0`／`right:0` は **ICB＝`clientWidth`（スクロールバー除外）** に解決され、`.post` の `margin:auto` と同基準＝左右ガターが**完全対称**（実測：両旗のマージン100.3px一致・下端gap20px・スクロール1800pxでドリフト0）。
  - 旧 `position:absolute; sticky; top:7rem; left/right:calc(100%+gap)` は廃止（端寄せ＋スクロール端でブレた）。`.post__body{position:relative}` は残置可だが、`.post__body` か祖先に `transform/filter/will-change/contain` を**足さない**（足すと fixed の包含ブロックが祖先に移りガター基準が壊れる）。
- 調整は `:root` の変数：`--rail-w:160px`（旗幅）/ `--post-w:44rem`（=`.post`幅・ガター計算の基準。変えたら`.post`も連動）/ `--rail-bottom:1.25rem`（下端からの隙間）/ `--rail-img:280px`（画像高）/ `--flag-skew:16px`・`--flag-inset:4px`（斜めカット）。
- ローダは `layouts/partials/ad-rail.html`（partialの**ファイル名は ad-rail.html のまま**＝サーバ側で外に出ない／中身が描くクラスは `kp-*`）。**script は DOM 構築後に実行**（左レール直後に置くと右の `<aside>` をまだ拾えない罠＝`DOMContentLoaded` で両 `[data-kp-serve]` を fetch）。

**旗の構造（`.kp-flag`。ブログ `assets/css/main.css` と Ad Studio `web/flag.mjs`＋`web/static/studio.css` の両方に同一意匠＝studio側はミラー。変えたら両方）**：上から
1. **マストヘッド** `.kp-flag__mast`（espresso地）＝サイト象徴フレーズ `$ ~/claude-code-hajimemashita` ＋点滅カーソル（ヒーローのkickerと同一。mono・コーラルの`$`）。
2. **画像** `.kp-flag__pic`（`--rail-img`高）。下地は**縦グラデ＝上espresso(マストと同色で白線が出ない)／下`flag-skew+inset`分クリーム(足元に馴染む)**。画像は `clip-path` で**上下を斜めカット**＝`polygon(0 calc(skew+inset), 100% inset, 100% calc(100%-inset), 0 calc(100%-skew-inset))`（**傾きは左が深い／右端は y=inset で角に張り付かせない＝右端も斜めに見せる**）。`margin-top:-1px`でマストと重ね白線封じ。
3. **PR/自作チップ** `.kp-flag__chip`＝**白文字＋コーラル地で統一**（半透明だと暗い画像で溶ける）。右=「PR」(`.kp-flag__chip--pr`)/左=「自作」。
4. **本文** `.kp-flag__body`（クリーム地）：**名前**＝先頭1文字だけ大きく（`::first-letter{font-size:1.5em}`・**フロートせずベースライン＝下端を後続と揃える**。ドロップキャップ/コーラル縦線は不可＝ダサい）／**一言**＝**「特徴(差別化点)」だけ**を `<b>` で囲み記事本文と同じコーラルのマーカー（`.kp-flag__blurb b` = `.prose strong` と同意匠。**要点(topic)でなく特徴**）／**出自**＝コーラルの□付きmono（下）。CTA・長い法令文は置かない。
5. **コーラル旗竿**（左）＝`.kp-flag::before`のオーバーレイ（`border-left:4px` 直書きは角丸で**窪み**が出るので使わない＝カードと同じ轍）。四隅は `border-radius:13px`（左右とも丸い）。

**配信ロジック（広告の追加・承認は Ad Studio で。`~/Developer/ad-studio`。詳細は `memory/project_ad_studio_deploy.md`）**
- プール＝studioのSQLite上の **status=`published` の自作(self)だけ**。`/serve` が **毎ロード ランダム**で自作1枚を返す（記事固定ではない＝リロードで入れ替わる）。**左右とも自作**＝右レールは左で出た製品を `?exclude=<id>` で除外して別の自作を取る（左右で同じ製品を出さない。旗は `data-kp-id` を持ち、`ad-rail.html` のローダが左→右の順で取得）。`enabled=0`(配信停止)・採用画像欠落 は配信除外（フォールバック禁止）。studioで承認した自作が左右にローテ。
- 旗の画像は studio が `/serve-img/<imageId>` で公開配信（data/images のPNG）。既存 `/store/*.png` は blog CDN へ302。`blurb` はHTML可・特徴キーワードだけ `<b>`。
- 旧 `data/self_ads.yaml`・`data/gear_ads.yaml`＋`static/store/*.png`（旧 `static/ads/`）は**配信には使わない**（studioへ移行済）。残置は既存画像の初期ソース＋手編集の保険。**広告を増やす＝studioで承認**（YAML手編集ではない）。
- 承認＝published化＋採用画像確定だけ（`server.mjs` の approve）。hugoビルド・git push は無し。

**法令(PR)・ロールアウト**
- **法令/開示**: 左右とも**自作プロダクト**（アフィリではない＝チップは「自作」）なので、景表法のアフィリ開示文は不要。`baseof.html` の `.kp-legal`（Amazon定型文）は Amazon廃止に伴い**撤去済み**（CSS `.kp-legal` は残置の死にルール）。
- **Amazonアフィリ(gear)は廃止（2026-06・ユーザー決定）**: 商品画像のコピー/ホットリンクが規約上不可、正規の画像取得(PA-API→Creators API)も「直近30日に発送済み売上10件」等＋OAuth2登録の要件で使えないため（一次ソース＝`~/Developer/ad-studio/rag/amazon-associates/image-policy.md`）。studio の gear(第三者)機構＝提案タブのピッカー/`dpImages`/`propose-gear`/Amazon検証は**コードは休眠**（消さず・配信もしない）。将来 別アフィリや Creators API を入れる時の土台として残置。`data/gear_ads.yaml`・`static/store/` も残置（未使用）。

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
- **cover-sm（スマホ用1:1）も生成**：`node generate-cover.js --mobile "短いフック" "" "../../content/post/<slug>/cover-sm.png"` ＋ `tools/cover/mobile-covers.json` に1行追加（確定仕様＝上の「📱 スマホ記事一覧カード」節）
- **本文画像も作る（カバーだけで終わらせない／2026-06の方針）**：figmakerのブランド図版・linkcard・実スクショ・比較の表化を**標準2〜4枚（紹介系4〜5枚）**。リード視覚フックを必ず1つ。**Claude手描き厳禁・実物/作図ベース・フル画質PNG（圧縮/WebP化しない）**。詳細は「本文画像」節＋ `memory/feedback_blog_image_policy.md` / `memory/project_blog_image_infra.md`。図版は `~/Developer/blog-figmaker/`（`render.mjs --html <f> --selector "#fig" --scale 2 --out <png>`、`.imgwork/diagrams/` に作業HTML）。出した画像は本文 `![alt](f)` 参照とファイル実在を必ず突合し、`hugo -D` ビルド＋実ページのスクショで配置を目視確認

### 3. 公開前監査（必須）
- `draft: false` で公開する前に監査エージェントを通す（詳細は下の「記事の公開前チェック」節）
- 指摘されたら即修正してから次へ

### 4. Zenn転載（**本リポジトリに統合済み＝別repo不要**）
- Zenn記事は**本リポジトリのルート直下 `articles/<zennSlug>.md`**（旧 `kitepon-rgb/zenn-content` / Windows パス `C:\...\Zenn` は統合済みで廃止。Zenn の連携先リポジトリも本リポジトリ＝WebAICoding）
- **同期はスクリプトで再生成**: `node tools/zenn-sync/sync.mjs` が `content/post/<slug>/index.md` から `articles/<zennSlug>.md` を作る。Zenn固有 frontmatter（`title`/`emoji`/`type`/`topics`/`published`）は既存Zennファイルから**温存**し本文だけ差し替え（詳細 `tools/zenn-sync/README.md`）
  - 変換: 本文画像→ブログ絶対URL `https://blog.kitepon.dev/post/<slug>/...` ＋直下に `*alt*` キャプション（Hugo の figcaption 再現）/ `{{< linkcard >}}`→`@[card](url)` / `{{< relref >}}`→ブログ絶対URL / 冒頭に転載バナー（`:::message この記事は [Claude Code 始めました](https://blog.kitepon.dev/) からの転載です。:::`）
  - **スラッグ6本ズレ対応表**（ブログ slug→Zennファイル名。`sync.mjs` と `.github/scripts/crosspost-devto.mjs` の両方に同一定義を持つ）: `claude-code-features`→`claude-code-half-features` / `claude-code-deploy`→`claude-code-ssh-deploy` / `max-plan-review`→`claude-max-plan-review` / `claude-research-implementation`→`claude-research-from-papers` / `livetr-app`→`livetr-realtime-translator` / `bughub`→`bughub-aggregation`
  - ⚠️ **Zennのslugは12〜50字必須**。ブログslugが12字未満（例 `bughub`=6字）だと Zenn がそのファイル名を受け付けない＝**上の対応表に ≥12字の Zenn slug を新規追加**する（`sync.mjs` と `crosspost-devto.mjs` の両方へ同一で）。12字以上のブログslugなら識別変換されるので対応表は不要。`sync.mjs` 実行時に出る「スラッグ差異 N 件」のログで反映を確認できる。
- **新記事を足したら**: ①先に `articles/<zennSlug>.md` を frontmatter だけ作る（emoji/topics は Zenn 用に手で選ぶ。本文は空でよい）→ ② `node tools/zenn-sync/sync.mjs` で本文を流し込む（既存frontmatterが無い新規slugは①が無いとエラーで停止する＝取りこぼし防止）
- 同期後は `git diff articles/` で期待差分（画像追加 / `@[card]` / ドメイン）だけかを目視してからコミット

### 5. CLAUDE.md Articles テーブル更新
- `## Articles` テーブルに `| # | タイトル | slug | 状態 |` の行を追加

### 6. コミット & プッシュ
- ブログ本文・`articles/`（Zenn）は**同一リポジトリ**なので**1回のコミットで両方入る**（別repoへの二重 push は不要になった）
- 選択add（`git add CLAUDE.md content/post/<slug>/ articles/<zennSlug>.md` ＋ slug追加時は `tools/zenn-sync/sync.mjs` `.github/scripts/crosspost-devto.mjs` `tools/cover/mobile-covers.json`）— `git add .` は使わない（gitignore外の作業ファイルが混入する）
  - ⚠️ **`sync.mjs` は articles/ を全件再生成する**＝他記事の WIP（例: 画像差し替え中の別記事）があるとその `articles/<other>.md` も一緒に書き換わる。**必ず選択 add で自分の記事だけ**コミットし、他記事の変更は未ステージで残す（巻き込みコミット防止）。
- ⚠️ push が弾かれることがある（dev.to自動転載のActionsが `crossposted-devto.json` を先行コミットするため）→ `git pull --rebase origin main` してから push し直す
  - ⚠️ **作業ツリーに未ステージ変更（他記事WIP等）があると `git pull --rebase` は失敗する**。その時は `git rev-list --left-right --count HEAD...origin/main` でリモート先行を確認し、**先行0なら rebase 不要でそのまま push**（先行があれば該当WIPを `git stash` → rebase → push → `stash pop`）。

### 7. X投稿（ブログへ誘導するフック投稿）
- **前提: ブログのデプロイ完了を待つ**。完了判定は**記事ページURL**でポーリングする＝`curl -s -o /dev/null -w '%{http_code}' <記事URL>/`。**cover.png を直接ポーリングしてはいけない**——デプロイ伝播前の 404 を Cloudflare がキャッシュして焼き付き、ファイルは実在するのに `cf-cache-status: HIT` で 404 が居座る（実被弾 2026-07-05: ポーリング対象の cover.png だけトップのカードで消え、叩いてない cover-sm/converse は無事だった）。カバーの到達確認は**キャッシュバスター付きで1回だけ**＝`curl -s -o /dev/null -w '%{http_code}' "<記事URL>/cover.png?cb=$(date +%s)"`。ページが 200 なのに記事が出ない時は未来日付を疑う＝§1。焼き付いた 404 は TTL 失効で自然に解ける（数分）／急ぐなら Cloudflare でそのURLをパージ
- **per-article の X Article（長文記事）は廃止**（全文はブログ＋Zenn＋dev.toに既出で4本目は冗長／長文Articleはネイティブ拡散が弱く運用も重い）。X は「フックで本家ブログへ誘導する」チャネルとして使う
- ブログ記事URLへ誘導する**通常ポスト（必要なら短いスレッド）**を作る。フック＋記事URL＋カバー画像。Premium+の長尺は使えるが、要点はあくまで誘導
- **ハッシュタグ必須（毎回・ドラフト提示の時点で本文に含める）**：日本語ポストは3〜5個（基本 `#ClaudeCode` `#個人開発` ＋記事固有のタグ）。付け忘れが常態化しオーナー指摘（2026-07-11「毎回だけどハッシュタグつけてよ　ルールにしてよ」）
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
- **ハッシュタグ必須（毎回）**：英語は `#ClaudeCode` `#MCP` `#AIagents` `#buildinpublic` を基本に記事固有を足す（過去実績: #36 EN ポストと同系）
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
- **大前提：このブログは著者のアピールのための媒体**。著者はAIのアピールがしたいわけではない（2026-07-11 明言「俺のアピールのための記事だから勘違いするなよ」）。AIの活躍を扱う記事でも、読者に残る印象は「著者がどういう作り手か」（勘・設計・積み上げた決まりごと）に置き、AIは著者の環境の中の働き手として書く
- **つまずき演出を排す**：「ここで詰まる」「手が止まった」「本当に〜できるのか／確かめる必要が出てきた」等の障害→克服ドラマを各段に挿さない。著者はスッと判断して進む。世界側の事実（例：既存教材は有限）は淡々と書き、著者が詰まった体にしない
- **思い込み・無知に見せない**：「本気で信じてた」「勝ったと思った」式の素朴な信者像、既知の当たり前を「盲点／発見」として書く、を排す。著者は全可能性を疑いながら作る。方針転換は打ちのめされた結果でなく淡々とした判断
- **捏造した教訓に着地しない**：「分かったこと」「一番効いたのは〜」式の、本人が真理と思ってもいない一般論で締めない。事実で終え、結論は読者に委ねる
- **自分・自社製品を下げない**：偽の謙遜、製品の弱点露出（未達／近似／割り切り）を書かない
- **否定の持ち出しをせず順接で書く（初稿から効かせる・監査で消すのでは遅い）**：「XではなくY」「その用途ではない」「〜わけではない」「指示ではなく会話」式の、何かを立ててから否定して見せる書き方をしない＝否定される側の語は情報を運ばないので丸ごと消し、やっていることを**そのまま肯定文**で書く。**逆接（でも/しかし/ただ/ではなく）は冒頭の導入で最大1回**（記事の向きを一度だけ変える用）、以降は順接（だから／そのために／具体的には）で進める。「Xを出した。ただ宣伝じゃない」式のメタな前置きも同じく置かず本題から入る。**チャットの返答でも守る**（実被弾 2026-07-05: 導入で否定の持ち出しを3連続でやり「ウザい」と叱責。正本 [docs/writing-voice.md](docs/writing-voice.md)＝全端末に付いてくる）
- **軸は著者の実体験の動機（なぜ作ったか）**：設計の落差・撤去ドラマ等のエンジニアリングの脇筋を勝手に主役にしない。一次情報（本人の語り）を最優先
- **AIのアピールで終わらせず、著者のアピールにする**：「AIに任せたら全部やってくれた」だけの筋はAIの宣伝で、著者の話にならない。任せて品質が出た理由（著者の勘・書き溜めた決まりごと・先に用意した仕組み）を主役に置き、著者を受け身・無知に描かない（実被弾 2026-07-11 #37:「AIのアピールになっても俺のアピールになってない」「俺を馬鹿で無知な人間に表現したがる」）
- **比喩・ポエム・飾り表現を使わない（強い指示）**：字義どおりに書く。「鏡／蘇る／入口と出口／重心が寄る／燃える／居座る／効いてくる／食い込む」式の言い換えや、機能の当たり前を「すごいこと」に飾るのを排す。動詞も figurative を避け「増える／関わる／補う／問題が出る」等の素の語に。**これは記事本文だけでなくチャットの返答でも守る**（飾りを足すと著者は「ウザい／馬鹿にされた」と受け取る）
- **流行・競合・他人を殴らない（淡々と確かめる側）**：流行に乗る記事でも、流行は「なぜ今か」の入口として静かに借りるだけ。煽り記事・インフルエンサー・競合を殴らず、勝ち誇り・論破・gotcha・上から目線を出さない。世間の見方は一度そのまま肯定してから自分の話を足す。強い断定語（逆行／怪しい／誰も苦労しない）は確かめた温度（〜らしい／本当かな）へ引く。**チャットでも守る**（実被弾 2026-07-05: Fable窓の記事で煽りを殴る温度を指摘。詳細と実例は [docs/writing-voice.md](docs/writing-voice.md) §3）
- **AI特有の「保険の前置き」を置かない**：「正直に書いておく」「正直に言うと」「実は」「白状すると」式の断り書きを本題の前に挟まない（ハルシネーション時代の名残の言い回し・人間はこう前置きしない）。限界や不都合な事実も前置き無しで事実としてそのまま書く。詳細と実例は [docs/writing-voice.md](docs/writing-voice.md) §4

## Content Guidelines

- 記事の口調はカジュアル（冒頭や要所は「俺」、説明パートは「自分」も可）
- 実体験ベース。SEO目的のスカスカ記事は書かない
- 公式ドキュメント翻訳ではなく「使ってるけど実は知らなかった」層向け
- **技術ブログだが初心者にも読ませる。英単語を地の文に刺し込まない**：「ブラックボックス／ヘッドレス／primitive／ワンショット／nonce」等の横文字を散らさず、日本語で言い換えるか一度だけ括弧で補う（例：コンテナ＝アプリを一つの箱に閉じ込めたもの）。ツール名の羅列も避け、動きを日本語で説明する（実被弾 2026-07-05:「やたら英単語が食い込んでくるやつは好きじゃない」）
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
| 33 | アプリが4本になったので、バグ報告を1箇所に集めてAIに並列で潰させた話 | bughub | 公開済み |
| 34 | AI同士が会話して進める — aiterm-mcpが握る対話型ターミナル | aiterm-converse | 公開済み |
| 35 | AIが賢くなるほど、俺の工夫は古くなる——そう思って、確かめた | knowhow-outlasts-model | 公開済み |
| 36 | Codexの最上位モードに任せたら、5時間の枠を1時間で溶かした話 | codex-max-mode-quota-drain | 公開済み |
| 37 | 作ったアプリに粗がある気がするからFable 5に相談した話 | ai-audit-blind-layer | 公開済み |

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
