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
