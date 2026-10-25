// Generates DocAssist logo options: icons (light + inverse), wordmark B, lockups, preview.html.
// Round 3: the user's hammer-and-wrench badge reworked. Deps are not in the app. In a temp dir:
// `npm i opentype.js @fontsource/unbounded`, then from that dir
// `NODE_PATH=$PWD/node_modules node <this file> <outDir>`; preview.png = screenshot of preview.html.
// Wordmark font: Unbounded (OFL), free stand-in for the brand's Actay Wide (commercial).
const fs = require('fs');
const path = require('path');
const opentype = require('opentype.js');

const OUT = process.argv[2];
fs.mkdirSync(OUT, { recursive: true });

const C = {
  blue: '#0804FF',
  black: '#000000',
  white: '#FFFFFF',
  yellow: '#F6EB19', // source badge
  red: '#EE2E2E', // app error red (brandbook icon library); source badge red is close
};
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

// ---------- tools (local coords: vertical, working end up, axis x=50; crossing at y=52) ----------
const HAMMER = 'M45.5 33H54.5V86H45.5Z M30 17H62L68 23V33H30Z';
const WRENCH = 'M45.5 36H54.5V86H45.5Z M32 18L38 9H44V24H56V9H62L68 18V30L60 39H40L32 30Z';
const PEN = 'M44 22H56V72H44Z M44 72H56L50 87Z M44 12H56V19H44Z'; // pencil: body, tip, eraser cap

// Crossed pair: `a` leans left (head top-left), `b` leans right (head top-right) and lies on top,
// separated by a cut stroke in the background color.
function crossed(a, b, fill, cutColor, s = 1) {
  const g = (rot, d, extra = '') =>
    `<g transform="translate(50 52) rotate(${rot}) scale(${s}) translate(-50 -52)"><path d="${d}" fill="${fill}" ${extra}/></g>`;
  return (
    g(-45, a) + g(45, b, `stroke="${cutColor}" stroke-width="${n(4 / s)}" paint-order="stroke"`)
  );
}

const ell = (cx, cy, rx, ry, angle, fill) =>
  `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${n(ry)}" transform="rotate(${angle} ${cx} ${cy})" fill="${fill}"/>`;

// Each variant: light + inverse (on brand blue) palettes; `accent` colors ASSIST in the lockup.
const icons = {
  badge: {
    title: 'Значок в родных цветах (перерисован)',
    light: { bg: C.yellow, fg: C.red, accent: C.red },
    inverse: { bg: C.yellow, fg: C.red },
    svg: (p) =>
      `<circle cx="50" cy="50" r="48" fill="${p.bg}"/>` + crossed(HAMMER, WRENCH, p.fg, p.bg, 0.74),
  },
  blue: {
    title: 'Значок в фирменном синем',
    light: { bg: C.blue, fg: C.white, accent: C.blue },
    inverse: { bg: C.white, fg: C.blue },
    svg: (p) =>
      `<circle cx="50" cy="50" r="48" fill="${p.bg}"/>` + crossed(HAMMER, WRENCH, p.fg, p.bg, 0.74),
  },
  oval: {
    title: 'В фирменном овале',
    light: { bg: C.blue, fg: C.white, accent: C.blue },
    inverse: { bg: C.white, fg: C.blue },
    svg: (p) =>
      ell(50, 50, 56, 56 / ELL_RATIO, ELL_ANGLE, p.bg) + crossed(HAMMER, WRENCH, p.fg, p.bg, 0.6),
  },
  tile: {
    title: 'Плитка паттерна',
    light: { bg: C.blue, fg: C.white, accent: C.blue },
    inverse: { bg: C.white, fg: C.blue },
    svg: (p) =>
      `<rect width="100" height="100" fill="${p.bg}"/>` + crossed(HAMMER, WRENCH, p.fg, p.bg, 0.8),
  },
  bare: {
    title: 'Только инструменты',
    light: { bg: C.white, fg: C.blue, accent: C.blue },
    inverse: { bg: C.blue, fg: C.white },
    svg: (p) => crossed(HAMMER, WRENCH, p.fg, p.bg, 1.05),
  },
  penBadge: {
    title: 'Карандаш + ключ, родные цвета («инструменты для документов»)',
    light: { bg: C.yellow, fg: C.red, accent: C.red },
    inverse: { bg: C.yellow, fg: C.red },
    svg: (p) =>
      `<circle cx="50" cy="50" r="48" fill="${p.bg}"/>` + crossed(PEN, WRENCH, p.fg, p.bg, 0.74),
  },
  penBlue: {
    title: 'Карандаш + ключ, фирменный синий',
    light: { bg: C.blue, fg: C.white, accent: C.blue },
    inverse: { bg: C.white, fg: C.blue },
    svg: (p) =>
      `<circle cx="50" cy="50" r="48" fill="${p.bg}"/>` + crossed(PEN, WRENCH, p.fg, p.bg, 0.74),
  },
};

// ---------- wordmark B, lockups, preview ----------
function wordmark(x, y, cap, text, accent) {
  const size = cap / CAP;
  const base = y + cap;
  const a = textPath('DOC', x, base, size);
  const b = textPath('ASSIST', a.end + 0.06 * size, base, size);
  const shift = Math.tan((-SLANT * Math.PI) / 180) * cap;
  return {
    svg: `<path d="${a.d}" fill="${text}"/><path d="${b.d}" fill="${accent}" ${skew(base)}/>`,
    width: b.end - x + shift,
  };
}
const svgDoc = (w, h, body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${n(w)} ${n(h)}">${body}</svg>\n`;
const lockup = (ic, inverse) => {
  const wm = inverse
    ? wordmark(124, 30, 40, C.white, C.white)
    : wordmark(124, 30, 40, C.black, ic.light.accent);
  return svgDoc(124 + wm.width, 100, ic.svg(inverse ? ic.inverse : ic.light) + wm.svg);
};
const write = (name, svg) => fs.writeFileSync(path.join(OUT, name), svg);
const sized = (svg, h) => svg.replace('<svg ', `<svg style="height:${h}px" `);

let rows = '';
Object.entries(icons).forEach(([id, ic], i) => {
  const light = svgDoc(100, 100, ic.svg(ic.light));
  const inverse = svgDoc(100, 100, ic.svg(ic.inverse));
  write(`${i + 1}-${id}.svg`, light);
  write(`${i + 1}-${id}-inverse.svg`, inverse);
  write(`${i + 1}-${id}-lockup.svg`, lockup(ic, false));
  rows += `<h2>${i + 1}. ${ic.title}</h2><div class=row>
<div class=cell>${sized(light, 140)}</div>
<div class="cell sizes">${sized(light, 64)}${sized(light, 32)}${sized(light, 16)}</div>
<div class="cell blue">${sized(inverse, 64)}${sized(inverse, 32)}</div>
<div class="cell wide">${sized(lockup(ic, false), 60)}</div>
<div class="cell wide blue">${sized(lockup(ic, true), 60)}</div></div>`;
});
const wm = wordmark(0, 0, 40, C.black, C.blue);
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
