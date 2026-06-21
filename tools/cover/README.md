# カバー画像ジェネレータ

記事のカバー画像（`cover.png` / 1250×500px）を生成するツール。
以前は Windows 上の `_playwright` フォルダに置いていたが、プロジェクト内に移植して
**どのマシンでクローンしても同じ画像を作れる**ようにした。

## セットアップ（クローン直後に1回だけ）

前提: Node 18 以上（playwright 1.61 の要件）。

```bash
cd tools/cover
npm ci                          # playwright を固定バージョンで導入
npx playwright install chromium # 描画用の Chromium を取得
```

Linux でヘッドレス Chromium に必要な共有ライブラリが足りない場合は
`npx playwright install-deps chromium`（sudo）も実行する。

## 使い方

```bash
node generate-cover.js "タイトル1行目" "タイトル2行目" "出力パス" ["コードテキスト"]
```

例（リポジトリルートの記事へ出力）:

```bash
cd tools/cover
node generate-cover.js "同じキャラが描けないAIに、" "「設定資料」を作らせた" \
  "../../content/post/sprite-forge-release/cover.png"
```

- 第4引数（コードテキスト）は省略可。省略時は既定のターミナルログが背景に入る。
- 1行が長すぎると折り返すので、タイトルは短く2行に分割する。
- 生成後は `file ../../content/post/<slug>/cover.png` で `1250 x 500` を確認する。

## スマホ用カバー `cover-sm.png`（1:1 / 1080×1080）— 記事一覧カード用【確定仕様・再設計禁止】

PCの記事一覧カードは 2.5:1 の `cover.png` をそのまま使うが、スマホ（行レイアウト）では左右が
トリミングされる。そこで **スマホ専用の正方形カバー `cover-sm.png`** を別に持ち、
`layouts/_default/list.html` の `<picture>` で `media="(max-width:600px)"` のときだけ配信する。
この設計は多数の反復で確定済み。**次回以降も同じに作ること（違うカードにすると過去の調整が無駄になる）。**

```bash
# 1記事だけ（見出しは正式タイトルではなく「短いフック」。本文h4に正式タイトルが出る）
node generate-cover.js --mobile "短い見出し" "" "../../content/post/<slug>/cover-sm.png"

# 全記事まとめて（slug→短見出しは mobile-covers.json）
node gen-mobile-covers.js
```

新記事を足したら **`mobile-covers.json` に `"slug": "短見出し"` を1行追加** → `node gen-mobile-covers.js`。

**デザイン（`--mobile`）**: PC版と同じグラデ・枠・コード背景。タイトルは**左寄せ・最大3行・自動縮小**で大きく。
その下に**センタリングの区切り線（264×4px・`#d6bcae`）**＋**センタリングの「Claude Code 始めました」（54px）**。

**カードCSS**（`assets/css/main.css` の `@media(max-width:600px)`、この値で確定）:
`.card` は `border:1px solid var(--line)`（**コーラルの左装飾は付けない**）・`border-radius:14px`・`align-items:stretch`・`height:116px`。
`.card .thumb` は `flex:0 0 116px;width:116px;align-self:stretch`（**`height` を固定しない**＝border分のズレで上下中央から外れる）。

## デザイン仕様（再現の要）

- 背景: Claudeオレンジのグラデーション（左上 `#c4603a` → 右下 `#e89f6f`）
- ターミナル窓: 1150×440、`rgba(40,20,10,0.35)`、ボーダー `2px #dfcbc1`、角丸14px
- 見出しフォント: Noto Serif JP 600（Google Fonts）
- 背景コードフォント: Courier Prime（Google Fonts）— 以前の `Courier New`（Windows専用）を
  OS非依存のWebフォントに置き換え。これでシステムフォントに依存せず、どのOSでも同一描画になる。
- サブタイトル: 「Claude Code 始めました」固定

## 仕組み

Playwright（Chromium）でHTMLを描画してスクリーンショットを撮る。フォントは Google Fonts から
読み込み、`document.fonts.ready` で読み込み完了を待ってから撮影するので、毎回同じ結果になる。
ネットワーク接続が必要（フォント取得のため）。
