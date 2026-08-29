#!/usr/bin/env node
/**
 * ============================================================================
 * عرض صفحات PDF كصور · pdf-to-png.mjs
 * ============================================================================
 *   node _أدوات/pdf-to-png.mjs "<ملف.pdf>" "<مجلد المخرَج>" [من] [إلى]
 *
 * 🔴 **ليش هالأداة موجودة:** ملفات LUVIT الكبيرة (بروفايل الصيدليات ·
 *    تفاصيل المنتجات) **صور بلا طبقة نص**، و`pdftotext` بيطلّع طلاسم لأن
 *    الخط بترميز مخصّص. الطريقة الوحيدة لقراءتها هي **الشوف بالعين**.
 *
 * ⚠️ و`pdftoppm` مش مركّب. البديل: pdf.js داخل كروميوم عبر playwright،
 *    والاثنان مستعارين من `D:/Ryan-Portfolio/site/node_modules` (قراءة بس ·
 *    نفس اللي بيعمله `build-web-photos.mjs` مع sharp).
 *
 * 🔴 **وحدات ESM ما بتنحمّل من `file://`** — كروميوم بيرفضها بـCORS، والوركر
 *    بيفشل بصمت والانتظار بيوقف عند timeout. الحل هون: **أصل وهمي
 *    `http://pdf.local/`** وكل طلباته بتنخدم من القرص باعتراض playwright،
 *    فيصير الاستيراد same-origin ويشتغل الوركر.
 *
 * ⚠️ ولو طلعت `Executable doesn't exist at ...ms-playwright`:
 *    cd "D:/Ryan-Portfolio/site" && npx playwright install chromium
 *    (فخ موثّق · بيرجع كل ما ينحدّث playwright)
 * ============================================================================
 */

import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const PORT = 'D:/Ryan-Portfolio/site/node_modules';

let chromium;
try { ({ chromium } = require(PORT + '/playwright')); }
catch (e) { console.error('🔴 ما قدرت أحمّل playwright من ' + PORT + ' · ' + e.message); process.exit(2); }

const [src, outDir, fromArg, toArg] = process.argv.slice(2);
if (!src || !outDir) {
  console.error('استعمال: node _أدوات/pdf-to-png.mjs "<ملف.pdf>" "<مجلد>" [من] [إلى]');
  process.exit(2);
}
if (!fs.existsSync(src)) { console.error('🔴 مش موجود: ' + src); process.exit(1); }
fs.mkdirSync(outDir, { recursive: true });

/* ٩٠٠-١١٠٠ بتكفي لقراءة نص عربي صغير بلقطة · أكبر = ملفات أثقل بلا فايدة */
const WIDTH = 1100;
const ORIGIN = 'http://pdf.local/';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });

const FILES = {
  'pdf.mjs':        PORT + '/pdfjs-dist/build/pdf.mjs',
  'pdf.worker.mjs': PORT + '/pdfjs-dist/build/pdf.worker.mjs',
  'doc.pdf':        path.resolve(src),
};

await page.route(ORIGIN + '**', (route) => {
  const name = new URL(route.request().url()).pathname.slice(1) || 'index.html';
  if (name === 'index.html') {
    return route.fulfill({ contentType: 'text/html', body: '<!doctype html><meta charset="utf-8"><body></body>' });
  }
  const f = FILES[name];
  if (!f || !fs.existsSync(f)) return route.fulfill({ status: 404, body: 'no' });
  route.fulfill({
    contentType: name.endsWith('.mjs') ? 'text/javascript' : 'application/pdf',
    body: fs.readFileSync(f),
  });
});

await page.goto(ORIGIN);
await page.addScriptTag({ type: 'module', content:
  "import * as pdfjs from '" + ORIGIN + "pdf.mjs';\n" +
  "pdfjs.GlobalWorkerOptions.workerSrc = '" + ORIGIN + "pdf.worker.mjs';\n" +
  "window.__pdfjs = pdfjs;\nwindow.__ready = true;\n"
});
await page.waitForFunction('window.__ready === true', { timeout: 60000 });

const total = await page.evaluate(async (u) => {
  const doc = await window.__pdfjs.getDocument({ url: u }).promise;
  window.__doc = doc;
  return doc.numPages;
}, ORIGIN + 'doc.pdf');

const from = Math.max(1, Number(fromArg) || 1);
const to   = Math.min(total, Number(toArg) || total);
console.log('📄 ' + path.basename(src) + ' · ' + total + ' صفحة · بعرض ' + from + '..' + to);

let done = 0;
for (let n = from; n <= to; n++) {
  const b64 = await page.evaluate(async ({ n, W }) => {
    const pg = await window.__doc.getPage(n);
    const v1 = pg.getViewport({ scale: 1 });
    const vp = pg.getViewport({ scale: W / v1.width });
    const c = document.createElement('canvas');
    c.width = Math.round(vp.width); c.height = Math.round(vp.height);
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height);
    await pg.render({ canvasContext: ctx, viewport: vp }).promise;
    return c.toDataURL('image/jpeg', 0.86).split(',')[1];
  }, { n, W: WIDTH });

  fs.writeFileSync(path.join(outDir, 'p' + String(n).padStart(3, '0') + '.jpg'),
                   Buffer.from(b64, 'base64'));
  done++;
  if (done % 10 === 0 || n === to) console.log('  ' + done + '/' + (to - from + 1));
}

await browser.close();
console.log('✅ ' + done + ' صفحة → ' + outDir);
