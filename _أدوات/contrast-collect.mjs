#!/usr/bin/env node
/**
 * ============================================================================
 * جمع بيانات التباين · الشطر الأول
 * ============================================================================
 *   node _أدوات/contrast-collect.mjs <outDir> <url> [w] [h] [scrollY,...]
 *
 * بيطلّع لكل موضع سكرول:
 *   at-<y>.png     لقطة الصفحة
 *   at-<y>.json    كل عنصر نصّي: صندوقه · لونه المعلَن · حجم خطه ووزنه
 *
 * والقياس نفسه بـcontrast-check.py · لأن تحليل البكسل بـPIL أوثق.
 *
 * ── 🔴 ليش مش قياس بالمتصفح مباشرةً ─────────────────────────────────
 * getComputedStyle بترجّع `backgroundColor` تبع العنصر، وهاد **بيكذب**
 * لما يكون النص فوق canvas أو فوق تدرّج أو فوق صورة · بيرجّع
 * `rgba(0,0,0,0)` وكأنه ما في خلفية. والخلفية الحقيقية **بكسل مرسوم**،
 * فلازم تنقاس من اللقطة.
 *
 * وبنفس السبب: **ممنوع قياس «أغمق ٤٪ ضد أفتح ٤٪»** بمنطقة. جرّبناه
 * وكذب مرتين — بيقيس حواف التنعيم وظلال الخلفية مش النص ضد أرضيته.
 * الصح: لون النص **المعلَن** ضد **منوال** بكسلات الخلفية.
 * ============================================================================
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9333;

const OUT = process.argv[2];
const URL_ = process.argv[3];
const W = Number(process.argv[4] || 1440);
const H = Number(process.argv[5] || 860);
const AT = (process.argv[6] || '0').split(',').map((s) => Number(s.trim())).filter((n) => !Number.isNaN(n));

if (!OUT || !URL_) {
  console.error('usage: node contrast-collect.mjs <outDir> <url> [w] [h] [scrollY,...]');
  process.exit(1);
}
fs.mkdirSync(OUT, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const profile = path.join(process.env.TEMP, 'luvit-contrast-profile');

const chrome = spawn(CHROME, [
  '--headless=new', '--disable-gpu', '--hide-scrollbars',
  '--force-device-scale-factor=1', '--no-first-run', '--no-default-browser-check',
  '--disable-features=Translate,MediaRouter',
  `--user-data-dir=${profile}`, `--remote-debugging-port=${PORT}`,
  `--window-size=${W},${H}`, 'about:blank',
], { stdio: 'ignore' });

let ws, msgId = 0;
const pending = new Map();

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
    try { const r = await fetch(url); if (r.ok) return await r.json(); } catch {}
    await sleep(250);
  }
  throw new Error('chrome debug endpoint never came up: ' + url);
}

const version = await getJSON(`http://127.0.0.1:${PORT}/json/version`);
console.log('chrome: ' + version.Browser);

/* ⚠️ نسخ كروم الحديثة بترفض /json/new بـGET · نفس الفخ اللي بشوت.
   فبنفتح التبويب الموجود وبننقّله بـPage.navigate. */
let target = await getJSON(`http://127.0.0.1:${PORT}/json/new?${encodeURIComponent(URL_)}`)
  .catch(() => null);
if (!target || !target.webSocketDebuggerUrl) {
  const list = await getJSON(`http://127.0.0.1:${PORT}/json/list`);
  target = list.find((t) => t.type === 'page');
}

/* WebSocket المدمج بنود ١٨+ · بلا حزمة خارجية */
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
await send('Emulation.setDeviceMetricsOverride', {
  width: W, height: H, deviceScaleFactor: 1, mobile: W < 768,
});
await send('Page.navigate', { url: URL_ });
await sleep(2500);

async function evalJS(expr) {
  const r = await send('Runtime.evaluate', {
    expression: expr, returnByValue: true, awaitPromise: true,
  });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.text + ' :: ' +
    (r.exceptionDetails.exception && r.exceptionDetails.exception.description || ''));
  return r.result.value;
}

/* ننتظر التسلسل يحمّل · شريط التحميل بياخد is-done */
await evalJS(`new Promise((res) => {
  const t0 = Date.now();
  (function poll() {
    const l = document.getElementById('seqLoad');
    if (!l || l.classList.contains('is-done') || Date.now() - t0 > 25000) return res(1);
    setTimeout(poll, 250);
  })();
})`);
await sleep(1200);

/* ── جمع العناصر النصّية ────────────────────────────────────────────
   بنجمع **الورقة النصّية** بس (عنصر نصّه المباشر مش فاضي)، عشان ما
   نقيس حاوية بتلفّ نصوصاً بألوان مختلفة. */
const COLLECT = `(() => {
  const out = [];
  const seen = new Set();
  document.querySelectorAll('a, button, h1, h2, h3, p, span, b, i, small, li, label').forEach((el) => {
    const direct = [...el.childNodes].filter(n => n.nodeType === 3)
      .map(n => n.textContent.trim()).join(' ').trim();
    if (!direct) return;
    const r = el.getBoundingClientRect();
    if (r.width < 8 || r.height < 6) return;
    /* 🔴 الصندوق لازم يكون **كاملاً** جوّا النافذة، مش متقاطعاً معها.
       السبب: الخلفية بتنقاس من بكسلات اللقطة، واللقطة بتوقف عند حافّة
       النافذة. صندوق نصّه برّا بيرجّع نصّ بكسلات + حشو أسود من خارج
       الصورة، والمنوال بيطلع لوناً ما إله علاقة.
       مقيس ٣١ آب: دائرة رقم بيضا على تركوازي غامق، box.y=863 والنافذة
       900 · القراءة طلعت أبيض 250,252,253 وأسود 0,0,0، والنتيجة
       **1.06:1 لعنصر تباينه الحقيقي فوق 6**.
       ⚠️ وهاد مش تسكيتاً للفاحص · العنصر بينفحص بموضع سكرول تاني بيكون
          فيه كاملاً بالنافذة. وأي فحص بلا موضع 0 بيضيّع عناصر أعلى الصفحة. */
    if (r.bottom < 0 || r.top > innerHeight || r.right < 0 || r.left > innerWidth) return;
    if (r.top < 0 || r.bottom > innerHeight || r.left < 0 || r.right > innerWidth) return;
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none' || +cs.opacity < 0.15) return;

    /* 🔴 تخطّي العناصر المغطّاة بعنصر ثابت (شريط الجوال · الترويسة اللاصقة).
       بلا هالفحص، الأداة بتقرا لون الشريط الغامق خلفيةً للنص وبتطلّع
       نِسَباً زي 1.27:1 لنص سليم تماماً. صار فعلاً ٣١ آب على صفحة الخصوصية:
       أربعة إنذارات كاذبة، كلها لعناصر واقعة تحت .luvit-dock.
       والفاحص اللي بيطلق إنذاراً كاذباً بينتجاهل ثم بينشال · فالتخطّي
       أهم من التغطية هون.
       الطريقة: نسأل المتصفح مين فعلاً بيرسم بمركز العنصر. لو مش هو ولا
       واحد من أبنائه ولا أبوه، فهو مغطّى. */
    const cx = Math.min(innerWidth - 1, Math.max(0, r.left + r.width / 2));
    const cy = Math.min(innerHeight - 1, Math.max(0, r.top + r.height / 2));
    const hit = document.elementFromPoint(cx, cy);
    if (hit && hit !== el && !el.contains(hit) && !hit.contains(el)) return;
    const key = Math.round(r.x) + ':' + Math.round(r.y) + ':' + direct.slice(0, 20);
    if (seen.has(key)) return;
    seen.add(key);
    const btn = el.closest('a, button');
    out.push({
      text: direct.slice(0, 44),
      tag: el.tagName.toLowerCase(),
      cls: (el.className && el.className.baseVal !== undefined ? '' : String(el.className || '')).slice(0, 46),
      isButton: !!(btn && (btn.className || '').includes && String(btn.className).includes('btn')),
      box: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) },
      color: cs.color,
      fontSize: parseFloat(cs.fontSize),
      fontWeight: cs.fontWeight,
      opacity: +cs.opacity,
    });
  });
  return out;
})()`;

for (const y of AT) {
  await evalJS(`window.scrollTo(0, ${y}); if (window.ScrollTrigger) ScrollTrigger.update(); 1`);
  await sleep(900);
  const els = await evalJS(COLLECT);
  const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  fs.writeFileSync(path.join(OUT, `at-${y}.png`), Buffer.from(shot.data, 'base64'));
  fs.writeFileSync(path.join(OUT, `at-${y}.json`), JSON.stringify({ scrollY: y, w: W, h: H, elements: els }, null, 1));
  console.log(`  at-${y}  ·  ${els.length} عنصراً نصّياً`);
}

ws.close();
chrome.kill();
console.log('\nDONE -> ' + OUT);
