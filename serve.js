/* ===========================================================================
   LUVIT — local preview server
   ---------------------------------------------------------------------------
   The demo pages CANNOT be opened by double-clicking. Chrome blocks fetch()
   on file:// URLs, so the hero's manifest.json never loads and the sequence
   sits at 0%. This serves the project over http:// instead, which fixes it.

   RUN IT:   from D:\luvit  ->  node serve.js
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

http.createServer((req, res) => {
  let rel = decodeURIComponent(req.url.split('?')[0]);
  if (rel === '/') rel = '/library/home-preview.html';

  const full = path.join(ROOT, path.normalize(rel).replace(/^(\.\.[\/\\])+/, ''));
  if (!full.startsWith(ROOT)) { res.writeHead(403).end('forbidden'); return; }

  fs.readFile(full, (err, data) => {
    if (err) { res.writeHead(404, { 'Content-Type': 'text/plain' }).end('404 ' + rel); return; }
    res.writeHead(200, {
      'Content-Type': TYPES[path.extname(full).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-cache'
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
