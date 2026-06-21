/**
 * カバー画像生成スクリプト（プロジェクト内・OS非依存）
 * 使い方: node generate-cover.js "タイトル1行目" "タイトル2行目" "出力パス" ["コードテキスト"]
 * 例: node generate-cover.js "手足を勝手に増やす" "AIアシスタントを作った話" "../../content/post/discord-ai-assistant/cover.png"
 *
 * 事前準備（クローン直後に1回だけ）:
 *   cd tools/cover && npm ci && npx playwright install chromium
 *
 * フォントは Google Fonts から読み込む（見出し=Noto Serif JP / 背景コード=Courier Prime）。
 * システムフォントに依存しないので、どのOS（Windows/Mac/Linux）でも同一の出力になる。
 */
const { chromium } = require('playwright');

const line1 = process.argv[2] || 'タイトル1行目';
const line2 = process.argv[3] || 'タイトル2行目';
const outputPath = process.argv[4] || 'cover.png';
const codeText = process.argv[5] || `$ claude --session-id example
> Session started
> MCP tools: 0 registered
> Writing tools/example.js
> Tool registered: example
> Building...
> Done.
> Ready.
> Watching for changes...
> All systems operational`;

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1250, height: 500 });
  await page.setContent(`
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
        <div class="code">${codeText}</div>
        <div class="title">${line1}<br>${line2}</div>
        <div class="divider"></div>
        <div class="subtitle">Claude Code 始めました</div>
      </div>
    </body>
    </html>
  `);
  // Web フォントの読み込み完了を待つ（固定待機より確実で、毎回同じ描画になる）
  await page.evaluate(async () => { await document.fonts.ready; });
  await page.waitForTimeout(300);
  await page.screenshot({ path: outputPath });
  await browser.close();
  console.log(`cover.png generated: ${outputPath}`);
})();
