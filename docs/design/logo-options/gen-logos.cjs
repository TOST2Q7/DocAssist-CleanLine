// Generates DocAssist logo options: icons, wordmarks (text outlined), lockups + preview.html.
// Deps are not in the app. In a temp dir: `npm i opentype.js @fontsource/unbounded`, then
// `NODE_PATH=$PWD/node_modules node <this file> <outDir>`; preview.png = screenshot of preview.html.
// Wordmark font: Unbounded (OFL), free stand-in for the brand's Actay Wide (commercial).
const fs = require('fs');
const path = require('path');
const opentype = require('opentype.js');

const OUT = process.argv[2];
fs.mkdirSync(OUT, { recursive: true });

const C = { blue: '#0804FF', black: '#000000', white: '#FFFFFF', gray: '#EEEEEE' };
const ELL_ANGLE = 42; // brand ellipse tilt, measured from the РСО logo
const ELL_RATIO = 1.8;

const F = opentype.parse(
  fs.readFileSync('node_modules/@fontsource/unbounded/files/unbounded-latin-600-normal.woff')
    .buffer,
);
const CAP = F.tables.os2.sCapHeight / F.unitsPerEm;
const SLANT = -12; // deg, like "КРУТ" in the РСО logo

// ---------- primitives (viewBox 0 0 100 100) ----------
const ellipse = (cx, cy, rx, fill, angle = ELL_ANGLE, ratio = ELL_RATIO) =>
  `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${+(rx / ratio).toFixed(2)}" transform="rotate(${angle} ${cx} ${cy})" fill="${fill}"/>`;

// Page with a folded top corner: body with square notch + flap triangle separated by a gap.
function page(x, y, w, h, f, g, fill, { flapFill = fill, left = false } = {}) {
  const X = (v) => (left ? 2 * x + w - v : v); // mirror horizontally for a top-left fold
  const r = x + w;
  const body = [
    [x, y],
    [r - f - g, y],
    [r - f - g, y + f + g],
    [r, y + f + g],
    [r, y + h],
    [x, y + h],
  ];
  const flap = [
    [r - f, y],
    [r - f, y + f],
    [r, y + f],
  ];
  const d = (pts) =>
    'M' + pts.map(([px, py]) => `${+X(px).toFixed(2)} ${+py.toFixed(2)}`).join('L') + 'Z';
  return `<path d="${d(body)}" fill="${fill}"/><path d="${d(flap)}" fill="${flapFill}"/>`;
}

// Brand four-petal shape: 4 ellipses on the diagonals.
function petals(cx, cy, s, fill, knockout, rot = 45) {
  const one = (a, extra = '') =>
    `<ellipse cx="${cx}" cy="${+(cy - 0.62 * s).toFixed(2)}" rx="${+(0.36 * s).toFixed(2)}" ry="${+(0.62 * s).toFixed(2)}" transform="rotate(${a} ${cx} ${cy})" ${extra}/>`;
  const angles = [0, 90, 180, 270].map((a) => a + rot);
  const ko = knockout
    ? angles
        .map((a) =>
          one(a, `fill="${knockout}" stroke="${knockout}" stroke-width="${+(0.4 * s).toFixed(2)}"`),
        )
        .join('')
    : '';
  return ko + angles.map((a) => one(a, `fill="${fill}"`)).join('');
}

// Four-point sparkle (assistant), optional knockout outline in bg color.
function sparkle(cx, cy, r, fill, knockout) {
  const d = `M${cx} ${cy - r}Q${cx} ${cy} ${cx + r} ${cy}Q${cx} ${cy} ${cx} ${cy + r}Q${cx} ${cy} ${cx - r} ${cy}Q${cx} ${cy} ${cx} ${cy - r}Z`;
  const ko = knockout
    ? `<path d="${d}" fill="${knockout}" stroke="${knockout}" stroke-width="${+(0.32 * r).toFixed(2)}" stroke-linejoin="round"/>`
    : '';
  return ko + `<path d="${d}" fill="${fill}"/>`;
}

const rect = (x, y, w, h, fill) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}"/>`;

// ---------- icons ----------
const icons = {
  'v1-ellipse': {
    title: 'Эллипс + документ',
    svg: () =>
      ellipse(50, 50, 52, C.blue) +
      page(37, 32, 26, 36, 9, 3, C.white) +
      rect(42, 52, 16, 4.5, C.blue) +
      rect(42, 59.5, 11, 4.5, C.blue),
  },
  'v2-spark': {
    title: 'Документ + искра помощника',
    svg: () =>
      rect(0, 0, 100, 100, C.blue) +
      page(17, 13, 46, 62, 14, 4, C.white) +
      rect(25, 44, 26, 6, C.blue) +
      rect(25, 55, 17, 6, C.blue) +
      sparkle(68, 68, 23, C.white, C.blue) +
      sparkle(86, 34, 8, C.white),
  },
  'v3-wave': {
    title: 'Документ + волна',
    svg: () =>
      rect(0, 0, 100, 100, C.black) +
      page(22, 14, 56, 72, 16, 4.5, C.white) +
      `<path d="M31 56 q6.5 -12 13 0 t13 0 t13 0" fill="none" stroke="${C.blue}" stroke-width="7" stroke-linecap="round"/>` +
      rect(31, 68, 22, 6, C.blue),
  },
  'v4-monogram': {
    title: 'Монограмма D',
    svg: () => {
      // D: folded top-left corner, straight stem, half-ellipse bowl; counter = tilted brand ellipse.
      const f = 15,
        g = 4.5;
      return (
        `<path d="M${18 + f + g} 10 H52 A40 40 0 0 1 52 90 H18 V${10 + f + g} H${18 + f + g} Z" fill="${C.blue}"/>` +
        `<path d="M18 ${10 + f} H${18 + f} V10 Z" fill="${C.blue}"/>` +
        ellipse(55, 50, 21, C.white)
      );
    },
  },
  'v5-tiles': {
    title: 'Плитки фирменного паттерна',
    svg: () =>
      rect(0, 0, 50, 50, C.black) +
      `<path d="M12 25 H38 M28 14.5 L38.5 25 L28 35.5" fill="none" stroke="${C.white}" stroke-width="7"/>` +
      rect(50, 0, 50, 50, C.blue) +
      page(62, 9, 26, 32, 8, 2.5, C.white) +
      rect(0, 50, 50, 50, C.white) +
      ellipse(25, 75, 24, C.blue) +
      rect(50, 50, 50, 50, C.black) +
      petals(75, 75, 9, C.white),
  },
  'v6-district': {
    title: 'В системе логотипов округов РСО',
    svg: () => {
      // Crescent = brand ellipse minus the same ellipse shifted up-right (like the district swoosh).
      const t = textPath(F, 'DA', 0, 0, 10, 0);
      const k = 36 / t.end; // fit text width
      const txt = textPath(F, 'DA', 55 - 18, 46 + (CAP * 10 * k) / 2, 10 * k, 0);
      return (
        `<mask id="v6m"><rect width="100" height="100" fill="#fff"/>` +
        `${ellipse(55, 45, 50, '#000')}</mask>` +
        `<g mask="url(#v6m)">${ellipse(50, 50, 50, C.blue)}</g>` +
        `<path d="${txt.d}" fill="${C.blue}"/>`
      );
    },
  },
};

// ---------- wordmarks ----------
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
function textPath(font, text, x, baseline, size, tracking) {
  let d = '';
  let cx = x;
  const glyphs = font.stringToGlyphs(text);
  glyphs.forEach((gl, i) => {
    d += pathData(gl.getPath(cx, baseline, size));
    cx += (gl.advanceWidth / font.unitsPerEm) * size + tracking * size;
    if (i < glyphs.length - 1)
      cx += ((font.getKerningValue(gl, glyphs[i + 1]) || 0) / font.unitsPerEm) * size;
  });
  return { d, end: cx - tracking * size };
}

// Returns {svg, width} for a wordmark with cap height `cap`, top at y.
function wordmark(style, x, y, cap, colors) {
  const size = cap / CAP;
  const base = y + cap;
  if (style === 'a') {
    const t = textPath(F, 'DOCASSIST', x, base, size, 0.01);
    return { svg: `<path d="${t.d}" fill="${colors.text}"/>`, width: t.end - x };
  }
  // style b: "DOC" upright + "ASSIST" slanted in accent (echo of ТРУД/КРУТ)
  const a = textPath(F, 'DOC', x, base, size, 0.01);
  const b = textPath(F, 'ASSIST', a.end + 0.06 * size, base, size, 0.01);
  const shift = Math.tan((-SLANT * Math.PI) / 180) * cap; // slant leans right by this at cap top
  return {
    svg:
      `<path d="${a.d}" fill="${colors.text}"/>` +
      `<path d="${b.d}" fill="${colors.accent}" transform="translate(0 ${base}) skewX(${SLANT}) translate(0 ${-base})"/>`,
    width: b.end - x + shift,
  };
}

const svgDoc = (w, h, body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${+w.toFixed(1)} ${+h.toFixed(1)}">${body}</svg>\n`;

function lockup(id, style, colors) {
  const wm = wordmark(style, 124, 30, 40, colors);
  return svgDoc(124 + wm.width, 100, icons[id].svg() + wm.svg);
}

const write = (name, svg) => fs.writeFileSync(path.join(OUT, name), svg);
const light = { text: C.black, accent: C.blue };
const dark = { text: C.white, accent: C.white };
let rows = '';
Object.entries(icons).forEach(([id, ic], i) => {
  const icon = svgDoc(100, 100, ic.svg());
  write(`${id}.svg`, icon);
  write(`${id}-lockup.svg`, lockup(id, 'b', light));
  const img = (svg, h) => svg.replace('<svg ', `<svg style="height:${h}px" `);
  rows += `<h2>${i + 1}. ${ic.title}</h2><div class=row>
<div class="cell gray">${img(icon, 150)}</div>
<div class="cell sizes">${img(icon, 64)}${img(icon, 32)}${img(icon, 16)}</div>
<div class="cell gray wide">${img(lockup(id, 'a', light), 70)}</div>
<div class="cell black wide">${img(lockup(id, 'b', dark), 70)}</div></div>`;
});
for (const s of ['a', 'b']) {
  const wm = wordmark(s, 0, 0, 40, light);
  write(`wordmark-${s}.svg`, svgDoc(wm.width, 40, wm.svg));
  rows += s === 'a' ? '<h2>Надпись: A / B</h2><div class=row>' : '';
  rows += `<div class="cell gray wide"><b>${s.toUpperCase()}</b>&nbsp;&nbsp;${svgDoc(wm.width, 40, wm.svg).replace('<svg ', '<svg style="height:40px" ')}</div>`;
}
write(
  'preview.html',
  `<!doctype html><meta charset=utf-8><style>
body{margin:0;padding:24px;font-family:sans-serif;width:1500px}h2{font-size:20px;margin:18px 0 8px}
.row{display:flex;gap:12px}.cell{display:flex;align-items:center;justify-content:center;padding:16px;border:1px solid #ddd}
.gray{background:#EEEEEE}.black{background:#000}.sizes{gap:18px;width:200px}.wide{flex:1}
</style>${rows}</div>`,
);
console.log('ok', Object.keys(icons).join(' '));
