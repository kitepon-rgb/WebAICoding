# ブログ外部計測・font配信とPrivacyの整合

- 作成日: 2026-07-30
- 対象: `kitepon.dev/blog/`
- 確度: 高（公開HTMLの実測と各サービス公式資料）

## 観測事実

- ブログは`https://gc.zgo.at/count.js`を読み込み、
  `https://claudecode-blog.goatcounter.com/count`へGoatCounter計測を送る。
- ブログは`fonts.googleapis.com`と`fonts.gstatic.com`からGoogle Fontsを読む。
- kitepon.devの公開Privacyはブランドサイトとブログへ適用すると明記する一方、
  解析サービスとしてCloudflare Web Analyticsだけを個別説明していた。

## 外部仕様

- [[raw/goatcounter-privacy-2026-07-30]]: GoatCounterはCookieや永続IDを置かず
  集計値を保存するが、重複判定でIPアドレスとUser-Agentを最大8時間メモリ処理する。
- [[raw/google-fonts-privacy-2026-07-30]]: Google Fonts requestではIPアドレス、
  要求URL、User-Agent、OS情報、referrerがGoogleへ送信される。Cookieは設定しない。

## 判断

Cloudflareだけを説明する現行文は、実装との透明性が不足する。GoatCounterを
閲覧傾向の集計に使うこと、Cookieや永続IDを置かないこと、IPとUser-Agentを
短時間メモリ処理することを明記する。Google Fontsについても、font配信のため
request情報をGoogleが処理することと、Cookieを設定しないことを明記する。

現時点では計測やfontを削除しない。公開面の実装とPrivacyの説明を一致させ、
将来自前配信へ変えた時は記述も同時に見直す。

