// Exports PNGs of the logo from the SVGs next to this file into ./png (Chromium via Playwright).
// Run: `node docs/design/logo/export-png.cjs` (needs `playwright` with Chromium available).
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const DIR = __dirname;
const OUT = path.join(DIR, 'png');
const SIZES = [16, 32, 48, 64, 128, 180, 192, 256, 512, 1024];
const BG = { white: '#FFFFFF', black: '#000000', transparent: 'transparent' };
// [format name, source svg, backgrounds]. White-on-white / black-on-black are skipped: invisible.
const ICONS = [
  ['color', 'icon.svg', ['white', 'transparent']],
  ['color-dark', 'icon-dark.svg', ['black', 'transparent']],
  ['white', 'icon-inverse.svg', ['black', 'transparent']],
  ['black', 'icon-black.svg', ['white', 'transparent']],
];
const LOCKUPS = [['black', 'lockup-black.svg', 'white', [512, 1024, 2048]]];
const PAD = 0.12; // icon margin on solid backgrounds (app-icon style); transparent = as drawn

const dataUri = (file) =>
  'data:image/svg+xml;base64,' + fs.readFileSync(path.join(DIR, file)).toString('base64');

async function render(page, file, w, h, imgW, imgH, bg, out) {
  await page.setViewportSize({ width: w, height: h });
  await page.setContent(
    `<html><body style="margin:0;background:${BG[bg]}"><div style="width:${w}px;height:${h}px;display:flex;align-items:center;justify-content:center"><img src="${dataUri(file)}" style="width:${imgW}px;height:${imgH}px"></div></body></html>`,
  );
  await page.waitForFunction(() => document.images[0].complete);
  await page.screenshot({
    path: out,
    clip: { x: 0, y: 0, width: w, height: h },
    omitBackground: bg === 'transparent',
  });
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ deviceScaleFactor: 1 });
  let count = 0;
  for (const [format, file, bgs] of ICONS) {
    for (const bg of bgs) {
      for (const s of SIZES) {
        const inner = bg === 'transparent' ? s : Math.round(s * (1 - 2 * PAD));
        await render(
          page,
          file,
          s,
          s,
          inner,
          inner,
          bg,
          path.join(OUT, `icon-${format}-${bg}-${s}.png`),
        );
        count++;
      }
    }
  }
  for (const [format, file, bg, widths] of LOCKUPS) {
    const [, , vw, vh] = fs
      .readFileSync(path.join(DIR, file), 'utf8')
      .match(/viewBox="([^"]+)"/)[1]
      .split(' ')
      .map(Number);
    for (const w of widths) {
      const pad = Math.round(w * 0.06);
      const imgW = w - 2 * pad;
      const imgH = Math.round((imgW * vh) / vw);
      await render(
        page,
        file,
        w,
        imgH + 2 * pad,
        imgW,
        imgH,
        bg,
        path.join(OUT, `lockup-${format}-${bg}-${w}.png`),
      );
      count++;
    }
  }
  await browser.close();
  console.log(`exported ${count} PNGs to ${OUT}`);
})();
