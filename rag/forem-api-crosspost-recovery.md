# Forem API — dev.to転載の回復設計

- 出典: https://developers.forem.com/api/v1
- 取得日: 2026-07-17
- 種別: 公式API仕様の要約
- 確度: 高

## 確認した仕様

- `POST https://dev.to/api/articles`で記事を作成できる。
- 作成payloadの`article.canonical_url`へ元記事URLを設定できる。
- `GET https://dev.to/api/articles/me/all`で、API keyに紐づく公開・非公開記事をページング取得できる。
- 認証は`api-key`ヘッダー、Acceptは`application/vnd.forem.api-v1+json`を使う。
- 公式仕様にはPOSTのidempotency keyと、作成直後の一覧反映に関する整合性保証が記載されていない。

## このプロジェクトでの判断

- 新規転載はZenn英訳URLを`canonical_url`へ入れる。
- POST前に`status: posting`の予約をGitへ保存し、push成功後だけ送信する。
- 次回実行に予約が残った場合は`/articles/me/all`を全ページ取得し、`canonical_url`を照合する。
- 一致1件は台帳回復、一致0件・複数件は自動POSTせず停止する。
- 既存記事へのcanonical URL一括反映は外部本番変更になるため、2026-07-17の改善では行わない。
