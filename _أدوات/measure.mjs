/**
 * قياس الثمانية نقاط عند عرض محدد · بيطبع JSON عشان نقارن «قبل» و«بعد».
 * بيستعمل نفس آلية CDP تبع shoot.mjs (الصفحة ما بتصير idle فما ينفع --dump-dom).
 */
import { spawn } from 'node:child_process';
import path from 'node:path';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = Number(process.argv[4] || 9344);
const URL_ = process.argv[2] || 'http://localhost:4322/library/home-preview.html';
const W = Number(process.argv[3] || 1280);
const H = 900;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const profile = path.join(process.env.TEMP, 'luvit-measure-profile-' + PORT);

const chrome = spawn(CHROME, [
  '--headless=new', '--disable-gpu', '--hide-scrollbars',
  '--force-device-scale-factor=1', '--no-first-run', '--no-default-browser-check',
  `--user-data-dir=${profile}`, `--remote-debugging-port=${PORT}`,
  `--window-size=${W},${H}`, 'about:blank',
], { stdio: 'ignore' });

let ws, msgId = 0;
const pending = new Map();
function send(method, params = {}) {
  const id = ++msgId;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
    setTimeout(() => { if (pending.has(id)) { pending.delete(id); reject(new Error('timeout ' + method)); } }, 60000);
  });
}
async function getJSON(url, tries = 40) {
  for (let i = 0; i < tries; i++) {
    try { const r = await fetch(url); if (r.ok) return await r.json(); } catch {}
    await sleep(250);
  }
  throw new Error('no debug endpoint');
}

await getJSON(`http://127.0.0.1:${PORT}/json/version`);
let target = await getJSON(`http://127.0.0.1:${PORT}/json/new?${encodeURIComponent(URL_)}`).catch(() => null);
if (!target?.webSocketDebuggerUrl) {
  const list = await getJSON(`http://127.0.0.1:${PORT}/json/list`);
  target = list.find((t) => t.type === 'page');
}
ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
ws.onmessage = (ev) => {
  const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) {
    const { resolve, reject } = pending.get(m.id);
    pending.delete(m.id);
    m.error ? reject(new Error(m.error.message)) : resolve(m.result);
  }
};
await send('Page.enable');
await send('Runtime.enable');
await send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 1, mobile: W < 768 });
await send('Page.navigate', { url: URL_ });
await sleep(2500);

async function evalJS(expr) {
  const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.text);
  return r.result.value;
}
for (let i = 0; i < 180; i++) {
  const done = await evalJS(`(() => { const l = document.querySelector('.hero-seq__loader');
    if (!l) return true; const c = getComputedStyle(l);
    return c.opacity === '0' || c.display === 'none'; })()`);
  if (done) break;
  await sleep(500);
}

// لازم نسكرول لكل سكشن عشان الـreveal يشتغل وتصير القياسات حقيقية
await evalJS(`document.querySelectorAll('section, footer').forEach(s => s.scrollIntoView()); window.scrollTo(0,0); void 0`);
await sleep(1200);

const out = await evalJS(`(() => {
  const vw = innerWidth;
  const R = {};

  // 1 · اسم العلامة
  const brand = document.querySelector('.luvit-nav__brand');
  const fBrand = document.querySelector('.luvit-footer__brand');
  R.brand = brand ? { text: brand.textContent.trim(), dir: getComputedStyle(brand).direction,
                      bidi: getComputedStyle(brand).unicodeBidi } : null;
  R.footerBrand = fBrand ? { text: fBrand.textContent.trim(), dir: getComputedStyle(fBrand).direction,
                             bidi: getComputedStyle(fBrand).unicodeBidi } : null;

  // 4 · الفقاعات ورا بطاقات المكوّنات
  const ing = document.querySelector('#ingredients');
  const layer = ing && ing.children[0];
  const rows = ing ? [...ing.querySelectorAll('.luvit-ing__row')] : [];
  let hits = 0;
  if (layer) for (const b of layer.children) {
    const br = b.getBoundingClientRect();
    if (!br.width) continue;
    for (const r of rows) { const rr = r.getBoundingClientRect();
      if (br.left < rr.right && br.right > rr.left && br.top < rr.bottom && br.bottom > rr.top) hits++; }
  }
  R.ingredients = { bubbleOverlaps: hits, rowCount: rows.length,
    rowBg: rows[0] ? getComputedStyle(rows[0]).backgroundColor : null,
    bubbleCount: layer ? layer.children.length : 0 };

  // 5 · بادج الفوشيا
  const badges = [...document.querySelectorAll('.luvit-card__badge')].map(b => ({
    text: b.textContent.trim(), bg: getComputedStyle(b).backgroundColor,
    cls: b.className }));
  R.badges = badges;

  // 6 · كومة الآراء
  const stack = document.querySelector('.luvit-testimonials__stack');
  const cards = stack ? [...stack.querySelectorAll('.luvit-testimonial')].map(c => {
    const r = c.getBoundingClientRect();
    return { left: Math.round(r.left), right: Math.round(r.right) };
  }) : [];
  R.testimonials = { viewport: vw, cards,
    offLeft: cards.filter(c => c.left < 0).length,
    offRight: cards.filter(c => c.right > vw).length,
    minLeft: cards.length ? Math.min(...cards.map(c => c.left)) : null };

  // 7 · الفوتر
  const fi = document.querySelector('.luvit-footer__inner');
  if (fi) { const r = fi.getBoundingClientRect(); const cs = getComputedStyle(fi);
    R.footer = { left: Math.round(r.left), right: Math.round(r.right), w: Math.round(r.width),
      gapL: Math.round(r.left), gapR: Math.round(vw - r.right),
      cols: cs.gridTemplateColumns, maxW: cs.maxWidth }; }

  // 8 · data-nav-bg
  R.navbg = [...document.querySelectorAll('section, footer.luvit-footer')]
    .map((s,i) => ({ n:i+1, id: s.id||'-', v: s.getAttribute('data-nav-bg') || 'MISSING' }))
    .filter(x => x.v === 'MISSING');

  // 3 · الأرقام والعملة
  R.prices = [...document.querySelectorAll('.luvit-card__price')].map(e => e.textContent.trim());
  R.pcts   = [...document.querySelectorAll('.luvit-ing__pct')].map(e => e.textContent.trim());

  // سكرول أفقي؟
  R.horizontalScroll = document.documentElement.scrollWidth > vw + 1
    ? { scrollW: document.documentElement.scrollWidth, vw } : false;

  return R;
})()`);

console.log(JSON.stringify(out, null, 2));
await send('Browser.close').catch(() => {});
ws.close(); chrome.kill();
process.exit(0);
