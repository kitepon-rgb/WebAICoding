/**
 * トップ等（cover を持たないページ）の既定 OG 画像 static/og-card.png を生成する。
 * デザイン＝リニューアル後の「実トップのヒーロー」を忠実に再現（カバー風ではない）:
 *   クリーム地＋紙グレイン / コーラルの kicker「$ ~/claude-code-hajimemashita」＋カーソル /
 *   明朝大見出し「設計は自分、実装はClaude。」＋「Claude」コーラル＋下線。
 *
 * 使い方（tools/cover で）:  node gen-og-hero.js
 * 1200×630・PNG を ../../static/og-card.png に出力する。
 *
 * ⚠️ 出力ファイル名を変えたら baseof.html の既定OG参照（"og-card.png"）も合わせること。
 *    既存ファイルを同名で差し替えても CDN/X がキャッシュするので、意匠を変える時は
 *    別名（og-hero2.png 等）にして baseof.html を更新＝新URLで確実に反映させる。
 *
 * 値は assets/css/main.css の body / .hero と同値（--paper #f6ede3 / --coral #d97757 /
 * --coral-deep #b04e2c / --ink #2a201a、見出し Noto Serif JP 700・kicker JetBrains Mono）。
 */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const out = path.resolve(__dirname, '..', '..', 'static', 'og-card-brand.png');
const wordmark = fs
  .readFileSync(path.resolve(__dirname, '..', '..', 'static', 'brand', 'kitepon-dev-primary.png'))
  .toString('base64');

const html = `<!doctype html><html lang="ja"><head><meta charset="utf-8">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Serif+JP:wght@600;700&family=JetBrains+Mono:wght@400;500&display=swap">
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  #og{width:1200px;height:630px;position:relative;overflow:hidden;
    background:radial-gradient(120% 78% at 90% -10%,rgba(217,119,87,.18),transparent 52%),
               radial-gradient(80% 60% at -5% 4%,rgba(233,216,198,.5),transparent 50%),#f6ede3;
    display:flex;flex-direction:column;justify-content:center;padding:0 86px}
  #og::before{content:"";position:absolute;inset:0;pointer-events:none;opacity:.5;mix-blend-mode:multiply;
    background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.05'/%3E%3C/svg%3E")}
  .brand{position:absolute;top:48px;left:86px;z-index:1;display:flex;align-items:center;gap:19px}
  .brand img{display:block;width:190px;height:57px;object-fit:contain}
  .brand span{font-family:'JetBrains Mono',monospace;font-weight:500;font-size:24px;color:#68564b;
    letter-spacing:.08em;padding-left:20px;border-left:1px solid rgba(104,86,75,.34)}
  .inner{position:relative;z-index:1}
  .kicker{font-family:'JetBrains Mono',monospace;font-weight:500;font-size:31px;color:#b04e2c;
    letter-spacing:.04em;margin-bottom:30px;display:flex;align-items:center;gap:13px}
  .cursor{display:inline-block;width:17px;height:1.02em;background:#d97757;transform:translateY(3px)}
  h1{font-family:'Noto Serif JP',serif;font-weight:700;font-size:106px;line-height:1.14;
    letter-spacing:-.01em;color:#2a201a}
  h1 em{font-style:normal;color:#b04e2c;position:relative}
  h1 em::after{content:"";position:absolute;left:0;right:0;bottom:.04em;height:.12em;
    background:linear-gradient(90deg,#d97757,rgba(217,119,87,0))}
</style></head>
<body>
<div class="brand"><img src="data:image/png;base64,${wordmark}" alt=""><span>Blog</span></div>
<div id="og"><div class="inner">
  <div class="kicker">$ ~/claude-code-hajimemashita <span class="cursor"></span></div>
  <h1>設計は自分、<br>実装は<em>Claude</em>。</h1>
</div></div>
</body></html>`;

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1200, height: 630 });
  await page.setContent(html);
  await page.evaluate(async () => { await document.fonts.ready; });
  await page.waitForTimeout(300);
  await page.screenshot({ path: out });
  await browser.close();
  console.log(`${path.basename(out)} generated: ${out} (1200x630)`);
})();
