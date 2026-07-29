# Google Fonts privacy — 取得記録

- 出典: https://developers.google.com/fonts/faq/privacy?hl=en
- 取得日: 2026-07-30
- 確度: 高（Google Fonts公式）
- 取得方法: HTMLはMarkItDown結果が0byteになるJavaScript描画ページだったため、
  ビルドインブラウザでrender後の`Privacy`節を取得。公開repoへ一次資料全文を
  複製しないため、出典と確認事項だけを保存する。

## 確認事項

- Google Fonts Web APIは認証なしで利用され、Cookieを設定・記録しない。
- browserからのHTTP requestにはIPアドレス、Google側の要求URL、User-Agent、
  OS情報、referrerが含まれる。
- IPアドレスはfont requestへの応答とsecurityのため処理される。
- Google Fontsで得た情報を、end user profile作成やtargeted advertisingへ
  利用しないと公式FAQが説明している。
- self-hostすれば、site訪問に関する情報はGoogleへ送信されない。

短い原文確認:

> “does not set or log cookies”

