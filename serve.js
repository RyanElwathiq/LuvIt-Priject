/* ===========================================================================
   LUVIT — local preview server
   ---------------------------------------------------------------------------
   The demo pages CANNOT be opened by double-clicking. Chrome blocks fetch()
   on file:// URLs, so the hero's manifest.json never loads and the sequence
   sits at 0%. This serves the project over http:// instead, which fixes it.

   RUN IT:   from D:\Ryan-Work\luvit\luvit  ->  node serve.js
   THEN OPEN:
       http://localhost:4322/library/home-preview.html          the HOME page
       http://localhost:4322/hero-sequence/hero-chapters-preview.html
       http://localhost:4322/library/buttons-demo.html          (and the rest)

   Stop it with Ctrl+C. No dependencies, nothing to install.
   =========================================================================== */
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(process.argv[2] || __dirname);
const PORT = parseInt(process.argv[3] || '4322', 10);

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'text/javascript; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.md':   'text/plain; charset=utf-8',
  '.webp': 'image/webp',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg':  'image/svg+xml',
  '.mp4':  'video/mp4'
};

/* ===========================================================================
   الاتجاه الثاني للممر · من المتصفح للقرص
   ---------------------------------------------------------------------------
   الـGET مع CORS خلّى الموقع يقرا ملفاتنا. وهاد العكس: صفحة أدمن ووردبريس
   بتقدر تنزّل بيانات حيّة (منتجات · إعدادات · لقطة قالب) كملف عندنا بدل ما
   تطلع بمخرَج أداة **مقصوص**.

   POST /__save?name=<اسم>   والجسم هو المحتوى.

   🔴 والحماية بالبنية مش بالنية:
     · الكتابة **بمجلد واحد بس** · `_وارد/` جوّا المشروع
     · الاسم بينظّف لحروف وأرقام وشرطات ونقطة وحدة · ولا مسارات ولا `..`
     · السيرفر بيسمع على هالجهاز، وبينشغّل لما نحتاجه وبينطفي بعدها
   =========================================================================== */
const INBOX = path.join(ROOT, '_وارد');

http.createServer((req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      /* 🔴 **Private Network Access** · كروم بيمنع صفحة HTTPS عامة
         (لوحة ووردبريس) من جلب عنوان لوب‌باك إلا لما يرد السيرفر
         بهالترويسة على الـpreflight. بلاها fetch بترمي
         "Failed to fetch" **بلا أي رسالة تشرح السبب**. */
      'Access-Control-Allow-Private-Network': 'true'
    }).end();
    return;
  }

  if (req.method === 'POST' && req.url.split('?')[0] === '/__save') {
    const q = new URL(req.url, 'http://localhost').searchParams;
    const safe = (q.get('name') || '').replace(/[^A-Za-z0-9._-]/g, '').replace(/\.\.+/g, '.');
    if (!safe || safe.startsWith('.')) {
      res.writeHead(400, { 'Access-Control-Allow-Origin': '*' }).end('bad name');
      return;
    }
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      try {
        fs.mkdirSync(INBOX, { recursive: true });
        const target = path.join(INBOX, safe);
        if (!target.startsWith(INBOX)) throw new Error('خارج الوارد');
        const body = Buffer.concat(chunks);
        fs.writeFileSync(target, body);
        console.log('  ← استلمت ' + safe + ' · ' + body.length + ' بايت');
        res.writeHead(200, { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'text/plain' })
           .end('ok ' + body.length);
      } catch (e) {
        res.writeHead(500, { 'Access-Control-Allow-Origin': '*' }).end('err ' + e.message);
      }
    });
    return;
  }

  let rel = decodeURIComponent(req.url.split('?')[0]);
  if (rel === '/') rel = '/library/home-preview.html';

  const full = path.join(ROOT, path.normalize(rel).replace(/^(\.\.[\/\\])+/, ''));
  if (!full.startsWith(ROOT)) { res.writeHead(403).end('forbidden'); return; }

  fs.readFile(full, (err, data) => {
    if (err) { res.writeHead(404, { 'Content-Type': 'text/plain' }).end('404 ' + rel); return; }
    /* 🔴 CORS · انضاف ٣٠ آب لسبب عملي واحد:
       تحديث سنيبتات WPCode كان بينعمل **لصقاً يدوياً**، و`tokens.css` صار
       ٤٧٠ كيلوبايت — يعني ما بينتنقل بمكالمة أداة ولا بينلصق بلا ما يضيع.
       بهالترويسة، صفحة الأدمن على plasmajo.com بتقدر تعمل fetch مباشرة على
       `http://localhost:4322/library/tokens.css` وتاخد الملف كما هو.

       ⚠️ ومتصفح كروم بيسمح بهاد رغم إن الموقع HTTPS، لأن `localhost` عنده
          **أصل موثوق** ومستثنى من حظر المحتوى المختلط.
       ⚠️ والسيرفر بيسمع على هالجهاز بس · `*` هون ما بتفتح شي للخارج. */
    res.writeHead(200, {
      'Content-Type': TYPES[path.extname(full).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-cache',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Private-Network': 'true'
    });
    res.end(data);
  });
}).listen(PORT, () => {
  console.log('');
  console.log('  LUVIT preview server');
  console.log('  serving : ' + ROOT);
  console.log('');
  console.log('  HOME    : http://localhost:' + PORT + '/library/home-preview.html');
  console.log('  HERO    : http://localhost:' + PORT + '/hero-sequence/hero-chapters-preview.html');
  console.log('');
  console.log('  Ctrl+C to stop.');
  console.log('');
});
