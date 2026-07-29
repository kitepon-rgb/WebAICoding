# GoatCounter privacy — 取得記録

- 出典: https://www.goatcounter.com/help/privacy
- 取得日: 2026-07-30
- 確度: 高（GoatCounter公式）
- 取得方法: HTMLをMarkItDownでMarkdown化して該当節を確認。公開repoへ一次資料全文を
  複製しないため、出典と確認事項だけを保存する。

## 確認事項

- ページ、referrer、ブラウザ、OS、地域、言語、画面幅等を集計値として保存する。
- 重複訪問の判定では、site名・IPアドレス・User-Agentを最大8時間メモリ上で処理する。
- IPアドレス、完全なUser-Agent、tracker IDはデータベースやdiskへ保存しない。
- 閲覧者のbrowserへCookie、localStorage等の識別情報を保存しない。
- GoatCounter.comのデータ保存先はFinlandとGermanyのHetzner。

短い原文確認:

> “doesn’t store IP addresses, the full User-Agent header, or any tracker ID”

