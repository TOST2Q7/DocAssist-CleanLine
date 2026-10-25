// Generates DocAssist logo options: icons (light + inverse), wordmark B, lockups, preview.html.
// Deps are not in the app. In a temp dir: `npm i opentype.js @fontsource/unbounded`, then from that dir
// `NODE_PATH=$PWD/node_modules node <this file> <outDir>`; preview.png = screenshot of preview.html.
// Wordmark font: Unbounded (OFL), free stand-in for the brand's Actay Wide (commercial).
const fs = require('fs');
const path = require('path');
const opentype = require('opentype.js');

const OUT = process.argv[2];
fs.mkdirSync(OUT, { recursive: true });

const C = { blue: '#0804FF', black: '#000000', white: '#FFFFFF' };
// Themes: m = main shape, k = secondary shape, c = cut-outs (= background color).
const LIGHT = { id: 'l', m: C.blue, k: C.black, c: C.white, text: C.black, accent: C.blue };
const INVERSE = { id: 'i', m: C.white, k: C.white, c: C.blue, text: C.white, accent: C.white };
const ELL_ANGLE = 42; // brand oval tilt, measured from the РСО logo
const ELL_RATIO = 1.8;
const SLANT = -12; // deg, like "КРУТ" in the РСО logo

const F = opentype.parse(
  fs.readFileSync('node_modules/@fontsource/unbounded/files/unbounded-latin-600-normal.woff')
    .buffer,
);
const CAP = F.tables.os2.sCapHeight / F.unitsPerEm;

// ---------- text → outlined paths ----------
// opentype.js toPathData() packs numbers ambiguously ("L4 0" -> "L40"); serialize ourselves.
const n = (v) => +v.toFixed(2);
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
const skew = (base) =>
  `transform="translate(0 ${n(base)}) skewX(${SLANT}) translate(0 ${n(-base)})"`;

// "D" upright + "A" slanted (monogram of wordmark B), centered at (cx, cy) with given cap height.
function monogram(cx, cy, cap, fill) {
  const size = cap / CAP;
  const gap = 0.05 * size;
  const probe = textPath('D', 0, 0, size).end + gap + textPath('A', 0, 0, size).end;
  const x = cx - probe / 2;
  const base = cy + cap / 2;
  const d = textPath('D', x, base, size);
  const a = textPath('A', d.end + gap, base, size);
  return `<path d="${d.d}" fill="${fill}"/><path d="${a.d}" fill="${fill}" ${skew(base)}/>`;
}

// ---------- shapes (viewBox 0 0 100 100) ----------
const ell = (cx, cy, rx, ry, angle, fill, extra = '') =>
  `<ellipse cx="${n(cx)}" cy="${n(cy)}" rx="${rx}" ry="${n(ry)}" transform="rotate(${angle} ${n(cx)} ${n(cy)})" fill="${fill}" ${extra}/>`;
const oval = (cx, cy, rx, fill, extra = '') =>
  ell(cx, cy, rx, rx / ELL_RATIO, ELL_ANGLE, fill, extra);
const cut = (t, w) => `stroke="${t.c}" stroke-width="${w}"`;
const RAD = (ELL_ANGLE * Math.PI) / 180;

const icons = {
  clip: {
    title: 'Скрепка',
    svg: (t) =>
      `<g transform="rotate(-48 50 50)"><path d="M60 36V66A10 10 0 0 1 40 66V22A15 15 0 0 1 70 22V74A20 20 0 0 1 30 74V34" fill="none" stroke="${t.m}" stroke-width="6.5" stroke-linecap="round" stroke-linejoin="round"/></g>`,
  },
  stack: {
    title: 'Стопка листов из овалов',
    svg: (t) =>
      ell(40, 34, 32, 17.8, -24, t.k, cut(t, 5)) +
      ell(50, 50, 32, 17.8, -24, t.k, cut(t, 5)) +
      ell(60, 66, 32, 17.8, -24, t.m, cut(t, 5)),
  },
  check: {
    title: 'Галочка из лепестков',
    svg: (t) => ell(31, 59, 17, 10, 45, t.k) + ell(61, 45, 35, 11, -52, t.m, cut(t, 4)),
  },
  reply: {
    title: 'Реплика помощника',
    svg: (t) =>
      oval(52, 44, 48, t.m) +
      `<path d="M27 64 L8 93 L44 75 Z" fill="${t.m}"/>` +
      [-15, 0, 15]
        .map((o) => oval(52 + o * Math.cos(RAD), 44 + o * Math.sin(RAD), 6.5, t.c))
        .join(''),
  },
  curl: {
    title: 'Лист с загнутым углом-четвертью',
    svg: (t) =>
      `<mask id="curl-${t.id}"><rect width="100" height="100" fill="#fff"/><circle cx="88" cy="12" r="30" fill="#000"/></mask>` +
      `<rect x="12" y="12" width="76" height="76" fill="${t.m}" mask="url(#curl-${t.id})"/>` +
      `<path d="M58 12A30 30 0 0 1 88 42H58Z" fill="${t.k}" ${cut(t, 5)} stroke-linejoin="round"/>`,
  },
  folder: {
    title: 'Папка с овальным ярлыком',
    svg: (t) =>
      `<rect x="10" y="26" width="80" height="60" fill="${t.k}"/>` +
      ell(33, 26, 23, 11, 0, t.k) +
      `<rect x="10" y="41" width="80" height="45" fill="${t.m}" ${cut(t, 5)}/>` +
      `<rect x="7" y="86" width="86" height="6" fill="${t.c}"/>`,
  },
  tile: {
    title: 'Монограмма DA в плитке',
    svg: (t) => `<rect width="100" height="100" fill="${t.m}"/>` + monogram(50, 50, 34, t.c),
  },
  oval: {
    title: 'Монограмма DA в овале',
    svg: (t) => oval(50, 50, 54, t.m) + monogram(50, 50, 20, t.c),
  },
};

// ---------- wordmark B, lockups, preview ----------
function wordmark(x, y, cap, t) {
  const size = cap / CAP;
  const base = y + cap;
  const a = textPath('DOC', x, base, size);
  const b = textPath('ASSIST', a.end + 0.06 * size, base, size);
  const shift = Math.tan((-SLANT * Math.PI) / 180) * cap;
  return {
    svg: `<path d="${a.d}" fill="${t.text}"/><path d="${b.d}" fill="${t.accent}" ${skew(base)}/>`,
    width: b.end - x + shift,
  };
}
const svgDoc = (w, h, body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${n(w)} ${n(h)}">${body}</svg>\n`;
const lockup = (id, t) => {
  const wm = wordmark(124, 30, 40, t);
  return svgDoc(124 + wm.width, 100, icons[id].svg(t) + wm.svg);
};
const write = (name, svg) => fs.writeFileSync(path.join(OUT, name), svg);
const sized = (svg, h) => svg.replace('<svg ', `<svg style="height:${h}px" `);

let rows = '';
Object.entries(icons).forEach(([id, ic], i) => {
  const light = svgDoc(100, 100, ic.svg(LIGHT));
  const inverse = svgDoc(100, 100, ic.svg(INVERSE));
  write(`${i + 1}-${id}.svg`, light);
  write(`${i + 1}-${id}-inverse.svg`, inverse);
  write(`${i + 1}-${id}-lockup.svg`, lockup(id, LIGHT));
  rows += `<h2>${i + 1}. ${ic.title}</h2><div class=row>
<div class=cell>${sized(light, 140)}</div>
<div class="cell sizes">${sized(light, 64)}${sized(light, 32)}${sized(light, 16)}</div>
<div class="cell blue">${sized(inverse, 64)}${sized(inverse, 32)}</div>
<div class="cell wide">${sized(lockup(id, LIGHT), 60)}</div>
<div class="cell wide blue">${sized(lockup(id, INVERSE), 60)}</div></div>`;
});
const wm = wordmark(0, 0, 40, LIGHT);
write('wordmark-b.svg', svgDoc(wm.width, 40, wm.svg));
write(
  'preview.html',
  `<!doctype html><meta charset=utf-8><style>
body{margin:0;padding:24px;font-family:sans-serif;width:1700px}h2{font-size:20px;margin:16px 0 8px}
.row{display:flex;gap:12px}.cell{display:flex;align-items:center;justify-content:center;gap:16px;padding:14px;border:1px solid #ddd;background:#fff}
.blue{background:${C.blue};border-color:${C.blue}}.sizes{width:190px}.wide{flex:1}
</style>${rows}`,
);
console.log('ok', Object.keys(icons).join(' '));
