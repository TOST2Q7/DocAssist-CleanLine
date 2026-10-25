// Generates the DocAssist logo (chosen: hammer + wrench badge, wordmark B) into <outDir>:
// icon.svg, lockup.svg, lockup-inverse.svg, wordmark.svg, wordmark-inverse.svg, preview.html, favicon.txt.
// Deps are not in the app. In a temp dir: `npm i opentype.js @fontsource/unbounded`, then from that dir
// `NODE_PATH=$PWD/node_modules node <this file> <outDir>`.
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
  yellow: '#F6EB19',
  red: '#EE2E2E',
};
const SLANT = -12; // deg, like "КРУТ" in the РСО logo

const F = opentype.parse(
  fs.readFileSync('node_modules/@fontsource/unbounded/files/unbounded-latin-600-normal.woff')
    .buffer,
);
const CAP = F.tables.os2.sCapHeight / F.unitsPerEm;
const n = (v) => +v.toFixed(2);

// ---------- tools: local coords, vertical, working end up, axis x=50 ----------
// Matched for symmetry: same handle (width 11, ends at y=90), heads 30 wide centered on the axis,
// both heads start at y=12 with the top corners chamfered; tools cross near mid-length.
const HANDLE = [
  [44.5, 20],
  [55.5, 20],
  [55.5, 90],
  [44.5, 90],
];
const HAMMER_HEAD = [
  [35, 17],
  [40, 12],
  [65, 12],
  [65, 27],
  [35, 27],
];
const WRENCH_HEAD = [
  [35, 17],
  [40, 12],
  [45, 12],
  [45, 23],
  [55, 23],
  [55, 12],
  [60, 12],
  [65, 17],
  [65, 31],
  [60, 36],
  [40, 36],
  [35, 31],
];
const CROSS = [50, 57]; // both tools rotate around this point

// Rotate local points by deg around CROSS. All shapes keep one winding, so overlaps merge in one path.
function place(pts, deg) {
  const r = (deg * Math.PI) / 180;
  return pts.map(([x, y]) => {
    const dx = x - CROSS[0];
    const dy = y - CROSS[1];
    return [dx * Math.cos(r) - dy * Math.sin(r), dx * Math.sin(r) + dy * Math.cos(r)];
  });
}
const shapes = [
  place(HANDLE, -45),
  place(HAMMER_HEAD, -45),
  place(HANDLE, 45),
  place(WRENCH_HEAD, 45),
];

// Center the real bounding box of the tools in the circle (+ small optical drop: heads are heavier)
// and scale to `span` of the diameter.
function tools(cx, cy, r, span, fill) {
  const all = shapes.flat();
  const xs = all.map((p) => p[0]);
  const ys = all.map((p) => p[1]);
  const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  const k = (2 * r * span) / Math.max(x1 - x0, y1 - y0);
  const ox = cx - ((x0 + x1) / 2) * k;
  const oy = cy - ((y0 + y1) / 2) * k + 1.5;
  const d = shapes
    .map((s) => 'M' + s.map(([x, y]) => `${n(ox + x * k)} ${n(oy + y * k)}`).join('L') + 'Z')
    .join('');
  return { svg: `<path d="${d}" fill="${fill}"/>`, box: [x0, x1, y0, y1].map((v) => n(v * k)) };
}

const badge = () =>
  `<circle cx="50" cy="50" r="48" fill="${C.yellow}"/>` + tools(50, 50, 48, 0.63, C.red).svg;

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
const svgDoc = (w, h, body, title) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${n(w)} ${n(h)}" role="img" aria-label="${title}">${body}</svg>\n`;
const write = (name, s) => fs.writeFileSync(path.join(OUT, name), s);

const icon = svgDoc(100, 100, badge(), 'DocAssist');
const lock = (text, accent) => {
  const wm = wordmark(124, 30, 40, text, accent);
  return svgDoc(124 + wm.width, 100, badge() + wm.svg, 'DocAssist');
};
const wmLight = wordmark(0, 0, 40, C.black, C.red);
const wmDark = wordmark(0, 0, 40, C.white, C.white);
write('icon.svg', icon);
write('lockup.svg', lock(C.black, C.red));
write('lockup-inverse.svg', lock(C.white, C.white));
write('wordmark.svg', svgDoc(wmLight.width, 40, wmLight.svg, 'DocAssist'));
write('wordmark-inverse.svg', svgDoc(wmDark.width, 40, wmDark.svg, 'DocAssist'));
// Favicon as a URL-encoded data URI (no external file: works in the single-file build).
write(
  'favicon.txt',
  'data:image/svg+xml,' +
    encodeURIComponent(svgDoc(100, 100, badge(), 'DocAssist').trim()).replace(/%20/g, ' '),
);

// Preview: symmetry guides (vertical axis + tools box incl. optical drop), sizes, lockups.
const t = tools(50, 50, 48, 0.63, C.red);
const guides = `<line x1="50" y1="0" x2="50" y2="100" stroke="#0804FF" stroke-width="0.4" stroke-dasharray="2 1.5"/><line x1="0" y1="50" x2="100" y2="50" stroke="#0804FF" stroke-width="0.4" stroke-dasharray="2 1.5"/><rect x="${n(50 + t.box[0])}" y="${n(50 + 1.5 - (t.box[3] - t.box[2]) / 2)}" width="${n(t.box[1] - t.box[0])}" height="${n(t.box[3] - t.box[2])}" fill="none" stroke="#0804FF" stroke-width="0.4"/>`;
const sized = (s, h) => s.replace('<svg ', `<svg style="height:${h}px" `);
write(
  'preview.html',
  `<!doctype html><meta charset=utf-8><style>
body{margin:0;padding:24px;font-family:sans-serif;width:1400px}.row{display:flex;gap:16px;margin-bottom:16px}
.cell{display:flex;align-items:center;justify-content:center;gap:18px;padding:18px;border:1px solid #ddd;background:#fff}
.blue{background:${C.blue};border-color:${C.blue}}.dark{background:#222;border-color:#222}.wide{flex:1}
</style>
<div class=row><div class=cell>${sized(svgDoc(100, 100, badge() + guides, 'guides'), 260)}</div>
<div class=cell>${sized(icon, 260)}</div>
<div class="cell" style="flex-direction:column">${sized(icon, 64)}${sized(icon, 32)}${sized(icon, 16)}</div>
<div class="cell dark">${sized(icon, 96)}</div></div>
<div class=row><div class="cell wide">${sized(lock(C.black, C.red), 80)}</div></div>
<div class=row><div class="cell wide blue">${sized(lock(C.white, C.white), 80)}</div></div>`,
);
console.log('ok', 'tools box', t.box.join(' '));
