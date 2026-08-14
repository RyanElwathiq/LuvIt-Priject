/**
 * أداة لقطات حقيقية عبر Chrome DevTools Protocol.
 * ليش مش chrome --screenshot: الهيرو canvas بيرسم كل فريم، فالصفحة ما بتصير idle
 * أبداً، و--virtual-time-budget بيوقف. وكمان --screenshot ما بيسكرول للأنكور.
 * هون منستنى انتظار حقيقي، ومنسكرول لكل سكشن، ومناخد لقطة بviewport طبيعي
 * عشان ScrollTrigger يشتغل زي ما بيشتغل عند الزائرة.
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9333;
const OUT = process.argv[2];
const URL_ = process.argv[3];
const W = Number(process.argv[4] || 1280);
const H = Number(process.argv[5] || 900);

if (!OUT || !URL_) {
  console.error('usage: node shoot.mjs <outDir> <url> [width] [height]');
  process.exit(1);
}
fs.mkdirSync(OUT, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const profile = path.join(process.env.TEMP, 'luvit-cdp-profile');
const chrome = spawn(CHROME, [
  '--headless=new',
  '--disable-gpu',
  '--hide-scrollbars',
  '--force-device-scale-factor=1',
  '--no-first-run',
  '--no-default-browser-check',
  '--disable-features=Translate,MediaRouter',
  `--user-data-dir=${profile}`,
  `--remote-debugging-port=${PORT}`,
  `--window-size=${W},${H}`,
  'about:blank',
], { stdio: 'ignore' });

let ws, msgId = 0;
const pending = new Map();
const events = [];

function send(method, params = {}, sessionId) {
  const id = ++msgId;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify(sessionId ? { id, method, params, sessionId } : { id, method, params }));
    setTimeout(() => {
      if (pending.has(id)) { pending.delete(id); reject(new Error('CDP timeout: ' + method)); }
    }, 60000);
  });
}

async function getJSON(url, tries = 40) {
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(url);
      if (r.ok) return await r.json();
    } catch {}
    await sleep(250);
  }
  throw new Error('chrome debug endpoint never came up: ' + url);
}

// 1) استنى كروم يفتح منفذ التصحيح
const version = await getJSON(`http://127.0.0.1:${PORT}/json/version`);
console.log('chrome: ' + version.Browser);

// 2) افتح تبويب على الرابط
const tab = await getJSON(`http://127.0.0.1:${PORT}/json/new?${encodeURIComponent(URL_)}`)
  .catch(async () => {
    // بعض النسخ بترفض /json/new بـGET، فمنفتح عبر الـbrowser target
    const list = await getJSON(`http://127.0.0.1:${PORT}/json/list`);
    return list.find((t) => t.type === 'page');
  });

let target = tab;
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
  } else if (m.method) {
    events.push(m);
  }
};

await send('Page.enable');
await send('Runtime.enable');
await send('Emulation.setDeviceMetricsOverride', {
  width: W, height: H, deviceScaleFactor: 1, mobile: W < 768,
});
await send('Page.navigate', { url: URL_ });

// 3) استنى التحميل الفعلي
await sleep(2500);

async function evalJS(expr) {
  const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.text + ' :: ' + (r.exceptionDetails.exception?.description || ''));
  return r.result.value;
}

// 4) استنى loader الهيرو يخلص · بحد أقصى 90 ثانية
let loaderState = 'no-loader';
for (let i = 0; i < 180; i++) {
  const s = await evalJS(`(() => {
    const l = document.querySelector('.hero-seq__loader');
    if (!l) return { done: true, pct: 'none' };
    const cs = getComputedStyle(l);
    const gone = cs.opacity === '0' || cs.display === 'none' || cs.visibility === 'hidden';
    const t = (l.textContent || '').trim();
    return { done: gone, pct: t };
  })()`);
  loaderState = s.pct;
  if (s.done) { loaderState = 'done @ ' + s.pct; break; }
  await sleep(500);
}
console.log('loader: ' + loaderState);

// 5) خريطة السكاشن بالـviewport الحالي
const map = await evalJS(`(() => {
  const secs = [...document.querySelectorAll('section, footer.luvit-footer')];
  return {
    docH: document.documentElement.scrollHeight,
    rows: secs.map((s,i) => ({
      n: i+1, tag: s.tagName.toLowerCase(), id: s.id || '',
      navbg: s.getAttribute('data-nav-bg') || 'MISSING',
      cls: s.className,
      top: Math.round(s.getBoundingClientRect().top + scrollY),
      h: Math.round(s.getBoundingClientRect().height)
    }))
  };
})()`);
fs.writeFileSync(path.join(OUT, 'section-map.json'), JSON.stringify(map, null, 2), 'utf8');
console.log('sections: ' + map.rows.length + ' · docH=' + map.docH);

// 6) لقطة لكل سكشن
async function shot(name, scrollTo) {
  await evalJS(`window.scrollTo(0, ${scrollTo}); void 0`);
  await sleep(1400); // الحركات reveal/stagger بدها تخلص
  const { data } = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  const file = path.join(OUT, name + '.png');
  fs.writeFileSync(file, Buffer.from(data, 'base64'));
  const kb = (fs.statSync(file).size / 1024).toFixed(1);
  console.log(`  ${name}.png  ${kb} KB  @scrollY=${scrollTo}`);
}

const label = (r) => String(r.n).padStart(2, '0') + '-' + (r.id || r.cls.split(' ').find(c => c.startsWith('luvit-')) || r.tag).replace(/[^a-z0-9-]/gi, '');

for (const r of map.rows) {
  // نوقف السكشن بحيث يبين من فوق مع هامش صغير تحت النافيجيشن
  const y = Math.max(0, r.top - 20);
  await shot(label(r), y);
}

await send('Browser.close').catch(() => {});
ws.close();
chrome.kill();
console.log('\nDONE -> ' + OUT);
process.exit(0);
