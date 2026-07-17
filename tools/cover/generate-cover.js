/**
 * カバー画像生成スクリプト（プロジェクト内・OS非依存）
 * 使い方:
 *   PC用(2.5:1, 1250x500):  node generate-cover.js "タイトル1行目" "タイトル2行目" "出力パス" ["コードテキスト"]
 *   スマホ用(1:1, 1080x1080): node generate-cover.js --mobile "記事タイトル全部" "" "出力パス" ["コードテキスト"]
 *     例: node generate-cover.js --mobile "手足を勝手に増やすAIアシスタントを作った話" "" "../../content/post/discord-ai-assistant/cover-sm.png"
 *     ※ --mobile では行を分けず全タイトルを第1引数に渡せばよい（正方形内で自動折返し＋自動縮小して収める）
 *
 * 事前準備（クローン直後に1回だけ）:
 *   cd tools/cover && npm ci && npx playwright install chromium
 *
 * フォントは Google Fonts から読み込む（見出し=Noto Serif JP / 背景コード=Courier Prime）。
 * システムフォントに依存しないので、どのOS（Windows/Mac/Linux）でも同一の出力になる。
 */
const { chromium } = require('playwright');

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// --mobile フラグ（スマホ記事一覧カード用の正方形カバー cover-sm.png）を抜き出す
const rawArgs = process.argv.slice(2);
const mobile = rawArgs.includes('--mobile');
const args = rawArgs.filter((a) => a !== '--mobile');

const line1 = args[0] || 'タイトル1行目';
const line2 = mobile ? (args[1] || '') : (args[1] || 'タイトル2行目');
const outputPath = args[2] || (mobile ? 'cover-sm.png' : 'cover.png');
const codeText = args[3] || `$ claude --session-id example
> Session started
> MCP tools: 0 registered
> Writing tools/example.js
> Tool registered: example
> Building...
> Done.
> Ready.
> Watching for changes...
> All systems operational`;

const W = mobile ? 1080 : 1250;
const H = mobile ? 1080 : 500;
// PC は手動2行（line1<br>line2）、スマホは全タイトルを正方形内で折返し
const titleHtml = mobile
  ? `${escapeHtml(line1)}${escapeHtml(line2)}`
  : `${escapeHtml(line1)}<br>${escapeHtml(line2)}`;
const escapedCodeText = escapeHtml(codeText);

const desktopHtml = `
    <html>
    <head>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+JP:wght@400;600&family=Courier+Prime:ital@0;1&display=swap');
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body {
        width: 1250px; height: 500px;
        background: linear-gradient(to bottom right, #c4603a, #e89f6f);
        display: flex; align-items: center; justify-content: center;
      }
      .terminal {
        width: 1150px; height: 440px;
        background: rgba(40, 20, 10, 0.35);
        border: 2px solid #dfcbc1;
        border-radius: 14px;
        position: relative;
      }
      .code {
        position: absolute;
        top: 28px; left: 30px;
        font-family: 'Courier Prime', monospace;
        font-size: 14px;
        color: rgba(220, 195, 170, 0.6);
        line-height: 1.7;
        white-space: pre;
        font-style: italic;
      }
      .title {
        position: absolute;
        top: 90px;
        left: 0; right: 0;
        color: #fff;
        font-size: 62px;
        font-weight: 600;
        font-family: 'Noto Serif JP', serif;
        text-align: center;
        line-height: 1.4;
      }
      .divider {
        position: absolute;
        top: 280px;
        left: 50%;
        transform: translateX(-50%);
        width: 80px;
        height: 3px;
        background: #d6bcae;
      }
      .subtitle {
        position: absolute;
        top: 300px;
        left: 0; right: 0;
        color: #e2e4df;
        font-size: 29px;
        font-family: 'Noto Serif JP', serif;
        font-weight: 400;
        text-align: center;
        letter-spacing: 0.15em;
      }
    </style>
    </head>
    <body>
      <div class="terminal">
        <div class="code">${escapedCodeText}</div>
        <div class="title">${titleHtml}</div>
        <div class="divider"></div>
        <div class="subtitle">Claude Code 始めました</div>
      </div>
    </body>
    </html>
  `;

// スマホ用 1:1。PC と同じ意匠（同じグラデ・枠・コード背景・フォント）を正方形に組み直す。
// タイトルは中央寄せ＋自動縮小で必ず枠内に収める。
const mobileHtml = `
    <html>
    <head>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+JP:wght@400;600&family=Courier+Prime:ital@0;1&display=swap');
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body {
        width: 1080px; height: 1080px;
        background: linear-gradient(to bottom right, #c4603a, #e89f6f);
        display: flex; align-items: center; justify-content: center;
      }
      .terminal {
        width: 980px; height: 980px;
        background: rgba(40, 20, 10, 0.35);
        border: 2px solid #dfcbc1;
        border-radius: 22px;
        position: relative; overflow: hidden;
      }
      .code {
        position: absolute;
        top: 34px; left: 38px; right: 38px;
        font-family: 'Courier Prime', monospace;
        font-size: 18px;
        color: rgba(220, 195, 170, 0.5);
        line-height: 1.95;
        white-space: pre;
        font-style: italic;
      }
      .center {
        position: absolute; inset: 0;
        display: flex; flex-direction: column;
        align-items: flex-start; justify-content: center;
        text-align: left; padding: 76px 70px;
      }
      .title {
        width: 100%;
        color: #fff;
        font-size: 132px;
        font-weight: 700;
        font-family: 'Noto Serif JP', serif;
        line-height: 1.32;
        text-align: left;
        overflow-wrap: break-word; word-break: auto-phrase;
        text-shadow: 0 2px 18px rgba(60,20,5,0.4);
      }
      .divider {
        align-self: center;          /* 区切り線はセンタリング */
        width: 264px; height: 4px;   /* 長さ3倍・少し太く明確に（色は据え置き） */
        background: #d6bcae;
        margin: 44px 0 26px;
      }
      .subtitle {
        width: 100%;
        text-align: center;          /* サブはセンタリング */
        color: #e2e4df;
        font-size: 54px;             /* 1.5倍 */
        font-family: 'Noto Serif JP', serif;
        font-weight: 400;
        letter-spacing: 0.12em;
      }
    </style>
    </head>
    <body>
      <div class="terminal">
        <div class="code">${escapedCodeText}</div>
        <div class="center">
          <div class="title" id="title">${titleHtml}</div>
          <div class="divider"></div>
          <div class="subtitle">Claude Code 始めました</div>
        </div>
      </div>
    </body>
    </html>
  `;

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: W, height: H });
  await page.setContent(mobile ? mobileHtml : desktopHtml);
  // Web フォントの読み込み完了を待つ（固定待機より確実で、毎回同じ描画になる）
  const fontsLoaded = await page.evaluate(async () => {
    await document.fonts.ready;
    const faces = [...document.fonts];
    const loaded = (family, weight) => faces.some((face) =>
      face.family.replace(/["']/g, '') === family &&
      face.weight === weight &&
      face.status === 'loaded');
    return loaded('Noto Serif JP', '600') && loaded('Courier Prime', '400');
  });
  if (!fontsLoaded) throw new Error('必要なWebフォントを読み込めなかった');
  // スマホ: タイトルが枠（.center）からはみ出さないよう font-size を自動縮小
  if (mobile) {
    await page.evaluate(() => {
      const t = document.getElementById('title');
      const box = document.querySelector('.center');
      let size = 132;
      t.style.fontSize = size + 'px';
      const lineCount = () => Math.round(t.scrollHeight / (size * 1.32));
      // タイトルは最大3行。3行以内に収まるまで font-size を縮める
      while (lineCount() > 3 && size > 36) { size -= 2; t.style.fontSize = size + 'px'; }
      // 念のため枠（縦）にも収める
      while (box.scrollHeight > box.clientHeight && size > 36) { size -= 2; t.style.fontSize = size + 'px'; }
    });
  }
  await page.waitForTimeout(300);
  await page.screenshot({ path: outputPath });
  await browser.close();
  console.log(`${mobile ? 'cover-sm' : 'cover'}.png generated: ${outputPath} (${W}x${H})`);
})();
