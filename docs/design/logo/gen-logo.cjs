// Generates the DocAssist logo (chosen: stacked ovals, wordmark B) into <outDir>:
// icon.svg, icon-inverse.svg, lockup.svg, lockup-inverse.svg, wordmark.svg, wordmark-inverse.svg,
// favicon.txt (data URI, adapts to dark browser UI), preview.html.
// Deps are not in the app. In a temp dir: `npm i opentype.js @fontsource/unbounded`, then from that dir
// `NODE_PATH=$PWD/node_modules node <this file> <outDir>`.
// Wordmark font: Unbounded (OFL), free stand-in for the brand's Actay Wide (commercial).
const fs = require('fs');
const path = require('path');
const opentype = require('opentype.js');

const OUT = process.argv[2];
fs.mkdirSync(OUT, { recursive: true });

const C = { blue: '#0804FF', black: '#000000', white: '#FFFFFF' };
const SLANT = -12; // deg, like "КРУТ" in the РСО logo

const F = opentype.parse(
  fs.readFileSync('node_modules/@fontsource/unbounded/files/unbounded-latin-600-normal.woff')
    .buffer,
);
const CAP = F.tables.os2.sCapHeight / F.unitsPerEm;
const n = (v) => +v.toFixed(2);

// ---------- icon: three brand ovals (axis ratio 1.8) fanned like sheets ----------
// Point-symmetric around (50,50). Gaps are real cut-outs (masks), so any background shows through.
const RX = 32;
const RY = RX / 1.8;
const TILT = -24;
const GAP = 5;
const OVALS = [
  [40, 34],
  [50, 50],
  [60, 66],
]; // back → front
// Scale the group so the composition fills the 100×100 box with a small margin.
const halfW = Math.hypot(
  RX * Math.cos((TILT * Math.PI) / 180),
  RY * Math.sin((TILT * Math.PI) / 180),
);
const halfH = Math.hypot(
  RX * Math.sin((TILT * Math.PI) / 180),
  RY * Math.cos((TILT * Math.PI) / 180),
);
const K =
  94 / Math.max(OVALS[2][0] - OVALS[0][0] + 2 * halfW, OVALS[2][1] - OVALS[0][1] + 2 * halfH);

// The gap is split evenly: each visible oval is shrunk by GAP/2, each cut is the oval grown by GAP/2.
const ellipse = ([cx, cy], attrs, grow = 0) =>
  `<ellipse cx="${cx}" cy="${cy}" rx="${n(RX + grow)}" ry="${n(RY + grow)}" transform="rotate(${TILT} ${cx} ${cy})" ${attrs}/>`;
// colors: [back, middle, front]; id keeps mask ids unique per document
function stack(colors, id, classes = ['', '', '']) {
  const masks = [0, 1]
    .map(
      (i) =>
        `<mask id="${id}${i}"><rect width="100" height="100" fill="#fff"/>` +
        OVALS.slice(i + 1)
          .map((c) => ellipse(c, 'fill="#000"', GAP / 2))
          .join('') +
        '</mask>',
    )
    .join('');
  // Mask goes on a wrapper: on the ellipse itself it would inherit the ellipse's rotation.
  const shapes = OVALS.map((c, i) => {
    const cls = classes[i] ? ` class="${classes[i]}"` : '';
    const shape = ellipse(c, `fill="${colors[i]}"${cls}`, -GAP / 2);
    return i < 2 ? `<g mask="url(#${id}${i})">${shape}</g>` : shape;
  }).join('');
  return `<defs>${masks}</defs><g transform="translate(50 50) scale(${n(K)}) translate(-50 -50)">${shapes}</g>`;
}
const LIGHT = [C.black, C.black, C.blue];
const INVERSE = [C.white, C.white, C.white];

// ---------- wordmark B ----------
// opentype.js toPathData() packs numbers ambiguously ("L4 0" -> "L40"); serialize ourselves.
function pathData(p) {
  return p.commands
    .map((c) => {
      if (c.type === 'M' || c.type === 'L') return `${c.type}${n(c.x)} ${n(c.y)}`;
      if (c.type === 'Q') return `Q${n(c.x1)} ${n(c.y1)} ${n(c.x)} ${n(c.y)}`;
      if (c.type === 'C') return `C${n(c.x1)} ${n(c.y1)} ${n(c.x2)} ${n(c.y2)} ${n(c.x)} ${n(c.y)}`;
      return 'Z';
    })
    .join('');
}
function textPath(text, x, baseline, size, tracking = 0.01) {
  let d = '';
  let cx = x;
  const glyphs = F.stringToGlyphs(text);
  glyphs.forEach((gl, i) => {
    d += pathData(gl.getPath(cx, baseline, size));
    cx += (gl.advanceWidth / F.unitsPerEm) * size + tracking * size;
    if (i < glyphs.length - 1)
      cx += ((F.getKerningValue(gl, glyphs[i + 1]) || 0) / F.unitsPerEm) * size;
  });
  return { d, end: cx - tracking * size };
}
function wordmark(x, y, cap, text, accent) {
  const size = cap / CAP;
  const base = y + cap;
  const a = textPath('DOC', x, base, size);
  const b = textPath('ASSIST', a.end + 0.06 * size, base, size);
  const skew = `transform="translate(0 ${n(base)}) skewX(${SLANT}) translate(0 ${n(-base)})"`;
  return {
    svg: `<path d="${a.d}" fill="${text}"/><path d="${b.d}" fill="${accent}" ${skew}/>`,
    width: b.end - x + Math.tan((-SLANT * Math.PI) / 180) * cap,
  };
}

// ---------- outputs ----------
const svgDoc = (w, h, body, title = 'DocAssist') =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${n(w)} ${n(h)}" role="img" aria-label="${title}">${body}</svg>\n`;
const write = (name, s) => fs.writeFileSync(path.join(OUT, name), s);
const lock = (colors, text, accent, id) => {
  const wm = wordmark(124, 30, 40, text, accent);
  return svgDoc(124 + wm.width, 100, stack(colors, id) + wm.svg);
};

const icon = svgDoc(100, 100, stack(LIGHT, 'a'));
const iconInverse = svgDoc(100, 100, stack(INVERSE, 'a'));
const lockup = lock(LIGHT, C.black, C.blue, 'a');
const lockupInverse = lock(INVERSE, C.white, C.white, 'a');
const wmLight = wordmark(0, 0, 40, C.black, C.blue);
const wmDark = wordmark(0, 0, 40, C.white, C.white);
write('icon.svg', icon);
write('icon-inverse.svg', iconInverse);
write('lockup.svg', lockup);
write('lockup-inverse.svg', lockupInverse);
write('wordmark.svg', svgDoc(wmLight.width, 40, wmLight.svg));
write('wordmark-inverse.svg', svgDoc(wmDark.width, 40, wmDark.svg));
// Favicon: black ovals turn white when the browser UI is dark. Inline data URI (single-file build).
const fav = svgDoc(
  100,
  100,
  '<style>@media (prefers-color-scheme: dark){.k{fill:#fff}}</style>' +
    stack(LIGHT, 'a', ['k', 'k', '']),
).trim();
write('favicon.txt', 'data:image/svg+xml,' + encodeURIComponent(fav).replace(/%20/g, ' '));

const sized = (s, h) => s.replace('<svg ', `<svg style="height:${h}px" `);
const uniq = (s, id) => s.replaceAll('id="a', `id="${id}`).replaceAll('url(#a', `url(#${id}`);
let k = 0;
const u = (s) => uniq(s, `p${k++}`);
write(
  'preview.html',
  `<!doctype html><meta charset=utf-8><style>
body{margin:0;padding:24px;font-family:sans-serif;width:1400px}.row{display:flex;gap:16px;margin-bottom:16px}
.cell{display:flex;align-items:center;justify-content:center;gap:18px;padding:18px;border:1px solid #ddd;background:#fff}
.gray{background:#EEEEEE}.blue{background:${C.blue};border-color:${C.blue}}.dark{background:#222;border-color:#222}.wide{flex:1}
</style>
<div class=row><div class=cell>${sized(u(icon), 240)}</div>
<div class="cell" style="flex-direction:column">${sized(u(icon), 64)}${sized(u(icon), 32)}${sized(u(icon), 16)}</div>
<div class="cell gray">${sized(u(icon), 96)}</div><div class="cell blue">${sized(u(iconInverse), 96)}</div>
<div class="cell dark" style="flex-direction:column;color:#aaa;font-size:12px"><img src="${'data:image/svg+xml,' + encodeURIComponent(fav)}" style="height:64px">иконка вкладки<br>в тёмной теме</div></div>
<div class=row><div class="cell wide gray">${sized(u(lockup), 80)}</div></div>
<div class=row><div class="cell wide blue">${sized(u(lockupInverse), 80)}</div></div>`,
);
console.log('ok scale', n(K));
