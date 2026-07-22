/* ===========================================================================
   LUVIT — build the LOCAL preview of the hero drop-in
   ---------------------------------------------------------------------------
   scroll-sequence.html is the PRODUCTION file: its frames point at the live
   plasmajo.com URLs, which a page on localhost cannot fetch (no CORS headers
   on the manifest). Opening it by double-clicking fails too, because Chrome
   blocks fetch() on file:// entirely — that is the
   "Couldn't load sequence — check the base URLs" message.

   So this takes the production file as-is and rewrites ONLY the two frame
   base URLs to the local folders, then wraps it in a real HTML document.
   Nothing else is touched, so what you see here is exactly the markup, CSS
   and JS that goes into Elementor.

   RUN:   node make-local-preview.js
   THEN:  http://localhost:4322/hero-sequence/scroll-sequence.local.html
   =========================================================================== */
const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, 'scroll-sequence.html');
const OUT = path.join(__dirname, 'scroll-sequence.local.html');

let fragment = fs.readFileSync(SRC, 'utf8');

/* --- the only edit: live URLs -> local folders --- */
const swaps = [
  ['https://plasmajo.com/wp-content/uploads/hero-seq/extracted/frames/', './frames/'],
  ['https://plasmajo.com/wp-content/uploads/hero-seq/extracted/frames-desktop/', './frames-desktop/']
];
swaps.forEach(([from, to]) => {
  if (!fragment.includes(from)) {
    console.error('  !! base URL not found, preview will be wrong:\n     ' + from);
    process.exit(1);
  }
  fragment = fragment.split(from).join(to);
});

const page = `<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>LUVIT — hero panel preview (local frames)</title>
<link rel="stylesheet" href="../library/tokens.css">
<style>
  /* The preview shell only. None of this ships to Elementor. */
  body { margin: 0; background: #298D94; }

  /* Stands in for the section that follows the hero on the real page. Its
     colour must match the last frame or you get a visible seam — this is the
     same value the drop-in's header comment tells you to set in Elementor. */
  .after-hero {
    background-color: #298D94;
    min-height: 80vh;
    display: grid; place-items: center;
    color: #fff; text-align: center;
    font-family: 'IBM Plex Sans Arabic', 'Segoe UI', Tahoma, sans-serif;
    padding: 40px 20px;
  }
  @media (min-width: 1024px) { .after-hero { background-color: #0B9198; } }
  .after-hero p { max-width: 44ch; line-height: 1.9; opacity: .9; }

  /* ---- PREVIEW-ONLY TINT LAB ----
     Lets you judge the panel colour on the real footage instead of on a hex
     code. None of this exists in the Elementor drop-in. */
  .lab {
    position: fixed; inset-inline-end: 14px; bottom: 14px; z-index: 999;
    width: 268px;
    background: rgba(6, 38, 48, .90);
    color: #CFF3F8; border: 1px solid rgba(255,255,255,.20);
    border-radius: 14px; padding: 13px 14px;
    font: 500 12px/1.55 ui-monospace, Menlo, Consolas, monospace;
    letter-spacing: .02em; direction: ltr;
    box-shadow: 0 18px 44px -18px rgba(0,0,0,.6);
  }
  .lab h4 { margin: 0 0 9px; font-size: 11px; letter-spacing: .10em;
            text-transform: uppercase; opacity: .65; font-weight: 600; }
  .lab__swatches { display: grid; grid-template-columns: repeat(4, 1fr);
                   gap: 7px; margin-bottom: 11px; }
  .lab__sw {
    aspect-ratio: 1; border-radius: 9px; cursor: pointer;
    border: 2px solid transparent; padding: 0;
    box-shadow: inset 0 0 0 1px rgba(255,255,255,.22);
    transition: transform .12s ease;
  }
  .lab__sw:hover { transform: scale(1.09); }
  .lab__sw[aria-pressed="true"] { border-color: #7FE3F2; }
  .lab__name { text-align: center; margin: -4px 0 10px; min-height: 1.5em;
               font-size: 11px; opacity: .8; }
  .lab__row { display: flex; align-items: center; gap: 8px; margin-bottom: 7px; }
  .lab__row input[type=range] { flex: 1; min-width: 0; accent-color: #4CC5DA; }
  .lab__read { border-top: 1px solid rgba(255,255,255,.16);
               margin-top: 9px; padding-top: 9px; font-size: 11px; }
  .lab__read b { color: #fff; font-weight: 700; }
  .lab__pass { color: #86E8A6; } .lab__fail { color: #FF9BA4; }
  .lab__hex { display: inline-block; margin-top: 6px; padding: 3px 7px;
              border-radius: 6px; background: rgba(255,255,255,.10);
              user-select: all; cursor: text; }
</style>
</head>
<body>

${fragment}

<section class="after-hero" id="routine">
  <p>هاي السكشن اللي بتيجي بعد الهيرو. لونها لازم يطابق آخر فريم بالفيديو،
     غير هيك بيبين خط فاصل. زر «اكتشفي روتينك» بينزّل لهون.</p>
</section>

<div class="lab">
  <h4>panel tint</h4>
  <div class="lab__swatches" id="sw"></div>
  <div class="lab__name" id="swname">&nbsp;</div>

  <div class="lab__row">
    <span style="opacity:.7">thickness</span>
    <input type="range" id="alpha" min="30" max="70" value="0">
    <span id="alphaval" style="width:3.2em;text-align:right">auto</span>
  </div>

  <div class="lab__read" id="read">measuring…</div>
</div>

<script>
/* ===========================================================================
   TINT LAB — preview only, never ships.

   The contrast figure here is MEASURED, not assumed. Because the preview is
   served over http://localhost with same-origin frames, the canvas is not
   tainted, so we can read the actual pixels of the footage sitting behind the
   first line of text, composite the panel over them exactly the way CSS does,
   and report the real ratio against white — live, as you scroll.
   =========================================================================== */
(function () {
  var TINTS = [
    ['Abyss',    '7, 46, 60',  'deep blue-teal — the current one'],
    ['Lagoon',   '6, 52, 54',  'greener, closest to the footage'],
    ['Midnight', '9, 35, 64',  'ocean blue, more separation'],
    ['Indigo',   '26, 30, 66', 'deep-sea indigo, richest'],
    ['Orchid',   '38, 22, 56', 'plum — bridges to the fuchsia accent'],
    ['Ink',      '4, 28, 34',  'near-black teal, most dramatic'],
    ['aqua-900', '12, 51, 60', 'the original — for comparison'],
    ['Slate',    '18, 40, 52', 'neutral, quietest']
  ];

  var swWrap = document.getElementById('sw');
  var nameEl = document.getElementById('swname');
  var readEl = document.getElementById('read');
  var alphaEl = document.getElementById('alpha');
  var alphaVal = document.getElementById('alphaval');

  /* Overrides go in a stylesheet with !important so they survive
     applyStoryLayout(), which re-writes the inline custom properties on every
     resize and on every breakpoint switch. */
  var sheet = document.createElement('style');
  document.head.appendChild(sheet);
  var current = TINTS[0][1];
  var frozenA = 0;              /* 0 = let the scroll drive it */

  function apply() {
    sheet.textContent = '#hero-seq { --panel-rgb: ' + current + ' !important;' +
      (frozenA ? ' --panel-a: ' + frozenA.toFixed(3) + ' !important;' : '') + ' }';
  }

  TINTS.forEach(function (t, i) {
    var b = document.createElement('button');
    b.className = 'lab__sw';
    b.style.background = 'rgb(' + t[1] + ')';
    b.title = t[0] + ' — ' + t[2];
    b.setAttribute('aria-pressed', i === 0 ? 'true' : 'false');
    b.onclick = function () {
      current = t[1];
      nameEl.textContent = t[0] + ' — ' + t[2];
      Array.prototype.forEach.call(swWrap.children, function (c) {
        c.setAttribute('aria-pressed', c === b ? 'true' : 'false');
      });
      apply();
    };
    swWrap.appendChild(b);
  });
  nameEl.textContent = TINTS[0][0] + ' — ' + TINTS[0][2];
  apply();

  alphaEl.oninput = function () {
    frozenA = alphaEl.value / 100;
    if (frozenA < 0.31) { frozenA = 0; alphaVal.textContent = 'auto'; }
    else alphaVal.textContent = frozenA.toFixed(2);
    apply();
  };

  /* ---- the measurement ---- */
  function lin(c) { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }
  function relL(r, g, b) { return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b); }

  var root = document.getElementById('hero-seq');
  var canvas = root.querySelector('.hero-seq__canvas');
  var cctx = canvas.getContext('2d', { willReadFrequently: true });
  var pin = root.querySelector('.hero-seq__pin');

  function measure() {
    var H = window.__LUVIT_HERO__;
    if (!H) return;
    var idx = H.activeChapter();
    if (idx < 0) { readEl.textContent = 'no chapter visible'; return; }

    var ch = H.chapters[idx];
    var line = ch.querySelector('.hero-story__line');
    if (!line) return;

    var lr = line.getBoundingClientRect();
    var cr = ch.getBoundingClientRect();
    var pr = pin.getBoundingClientRect();
    if (!lr.width || !cr.height) return;

    /* Sample the footage right behind the first line of text. */
    var dpr = canvas.width / pr.width;
    var sx = Math.round((lr.left + lr.width / 2 - pr.left) * dpr) - 20;
    var sy = Math.round((lr.top + lr.height / 2 - pr.top) * dpr) - 6;
    sx = Math.max(0, Math.min(canvas.width - 40, sx));
    sy = Math.max(0, Math.min(canvas.height - 12, sy));

    var d;
    try { d = cctx.getImageData(sx, sy, 40, 12).data; }
    catch (e) { readEl.textContent = 'canvas is tainted — serve over http'; return; }

    var r = 0, g = 0, b = 0, n = d.length / 4;
    for (var i = 0; i < d.length; i += 4) { r += d[i]; g += d[i + 1]; b += d[i + 2]; }
    r /= n; g /= n; b /= n;

    /* Composite the panel exactly as the CSS does. The depth gradient runs
       a -> a*1.16 (46%) -> a*1.42 (100%), so interpolate at the line's own
       depth down the panel rather than assuming the top. */
    var baseA = parseFloat(getComputedStyle(root).getPropertyValue('--panel-a')) || 0.42;
    var f = (lr.top + lr.height / 2 - cr.top) / cr.height;
    var mult = f <= 0.46 ? 1 + (0.16 * f / 0.46) : 1.16 + (0.26 * (f - 0.46) / 0.54);
    var a = Math.min(1, baseA * mult);

    var t = current.split(',').map(Number);
    var cr_ = a * t[0] + (1 - a) * r;
    var cg_ = a * t[1] + (1 - a) * g;
    var cb_ = a * t[2] + (1 - a) * b;

    var ratio = 1.05 / (relL(cr_, cg_, cb_) + 0.05);
    var ok = ratio >= 4.5;

    readEl.innerHTML =
      'progress <b>' + H.state.p.toFixed(2) + '</b> · ch <b>' + (idx + 1) + '</b> · ' +
      (H.isDesktopStory() ? 'desktop' : 'mobile') + '<br>' +
      'water behind <b>rgb(' + Math.round(r) + ',' + Math.round(g) + ',' + Math.round(b) + ')</b><br>' +
      'panel alpha here <b>' + a.toFixed(2) + '</b><br>' +
      'contrast vs white <span class="' + (ok ? 'lab__pass' : 'lab__fail') + '"><b>' +
      ratio.toFixed(2) + ':1</b> ' + (ok ? 'AA pass' : 'BELOW 4.5') + '</span><br>' +
      '<span class="lab__hex">rgb: ' + current + '</span>';
  }

  setInterval(measure, 180);
})();
</script>

</body>
</html>
`;

fs.writeFileSync(OUT, page, 'utf8');
console.log('');
console.log('  built : ' + path.basename(OUT));
console.log('  frames: local (./frames/ and ./frames-desktop/)');
console.log('  open  : http://localhost:4322/hero-sequence/scroll-sequence.local.html');
console.log('');
