# 記事レール広告のフッター退避 — リリース監査

- 監査日: 2026-08-01
- 対象ページ: `https://kitepon.dev/blog/post/lattice-parallel-agents/`
- 対象変更: 記事両脇の固定広告を、フッター上端から20px離して停止させる
- 独立監査: Codex native refuter `/root/release_audit`（読み取り専用）

## 受入条件

1. 通常スクロール中は広告レールを従来の下端20pxに固定する。
2. フッターがviewportへ入ったら、フッター上端と広告レール下端の間を20pxに保つ。
3. 左右レールへ同じ退避量を適用する。
4. 1100px未満では広告レールを表示しない既存仕様を維持する。
5. Hugo build、content validation、Zenn同期検査、関連テストを通す。

## 監査で検出・修正した事項

- 当初の退避量をフッター自身の高さで上限設定すると、viewportが高くフッターが深く入り込む場合に広告が重なる。退避量を `viewport下端 - フッター上端` として上限なしで計算するよう修正した。
- 本番ロールバック例がcontainer名とimage tagを混同していた。稼働containerからimage名を取得し、SHA tagを抽出して存在確認後に `--no-build` で戻す手順へ修正した。

## 検証結果

- `git diff --check`: 成功
- `node tools/validate-content.mjs`: 成功（posts=41、zenn=41、mobile=41）
- `node tools/zenn-sync/sync.mjs --check`: 成功（41記事）
- `npm --prefix .github/scripts test`: 成功（23件）
- `hugo --minify`: 成功（174ページ）
- `node tools/validate-content.mjs --rendered`: 成功
- ロールバック手順の `bash -n`: 成功
- ローカル実ページ、viewport 1280×1200、最下部: フッター上端 `1090.421875px`、レール下端 `1070.421875px`、間隔 `20px`
- フッター上端を `800px` に置いた短ページ相当の検査: 退避量 `400px`、レール下端 `780px`、間隔 `20px`

## 非対象として残した既存挙動

ページ読込時が1100px未満で、その後1100px以上へresizeした場合にレール初期化が走らない挙動は、今回の変更前から存在する。フッター重なり修正の受入条件には追加せず、別件として扱う。
