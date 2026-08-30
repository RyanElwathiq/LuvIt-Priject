#!/usr/bin/env node
/**
 * ============================================================================
 * قصّ الهوامش الشفافة من صورة عبوة · trim-bottle.mjs
 * ============================================================================
 *   node _أدوات/trim-bottle.mjs <اسم-الصورة-بلا-امتداد>
 *
 * ── ليش ──────────────────────────────────────────────────────────────
 * صور المنتجات مربّعة ٢٠٠٠×٢٠٠٠ **والعبوة بتاخد ثلثها بس** · الباقي
 * شفاف. وهاد ما بيضرّ ببطاقة المنتج (الصورة بتنقص بـobject-fit: cover
 * فالعبوة بتملا الإطار)، **بس بيضرّ بعنصر عائم**: صندوق ٢٦٠px بيعطي
 * عبوة ٧٠px بس. مقيس بالمعاينة.
 *
 * فبنقصّ الهوامش مرة وحدة، وبتصير الصورة كلها عبوة.
 *
 * ⚠️ و`sharp` **مستعارة للقراءة** من `D:/Ryan-Portfolio/site/node_modules`
 *    مثل باقي أدوات الصور بالمشروع · مش مثبّتة هون.
 * ============================================================================
 */
import path from 'node:path';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire('D:/Ryan-Portfolio/site/package.json');
let sharp;
try { sharp = require('sharp'); }
catch (e) {
  console.error('🔴 ما لقيت sharp بـD:/Ryan-Portfolio/site/node_modules');
  console.error('   شغّل `npm install` هناك · وشوف فخ Playwright بـCLAUDE.md');
  process.exit(1);
}

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '..');
const SRC_DIR = path.resolve(REPO, '..', 'صور-المنتجات', '_للويب');
const OUT_DIR = path.join(REPO, 'library', 'img');

const name = process.argv[2];
if (!name) { console.error('usage: node _أدوات/trim-bottle.mjs <اسم-الصورة-بلا-امتداد>'); process.exit(2); }

const src = path.join(SRC_DIR, name + '.webp');
if (!fs.existsSync(src)) { console.error('🔴 ما لقيت ' + src); process.exit(1); }

fs.mkdirSync(OUT_DIR, { recursive: true });
const out = path.join(OUT_DIR, name + '-trim.webp');

const before = await sharp(src).metadata();

/* `trim` بتشيل الحواف المتشابهة · والعتبة عالية شوي عشان الظل الخفيف
   حوالي العبوة ما يمنع القصّ.
   ⚠️ ومن غير `.png()` أو `.webp()` بألفا الشفافية بتنكسر لأسود. */
await sharp(src)
  .ensureAlpha()
  .trim({ threshold: 12 })
  .resize({ width: 900, withoutEnlargement: true })
  .webp({ quality: 88, alphaQuality: 100, effort: 5 })
  .toFile(out);

const after = await sharp(out).metadata();
const bw = fs.statSync(src).size, aw = fs.statSync(out).size;

console.log('  قبل : ' + before.width + '×' + before.height + '  ·  ' + Math.round(bw / 1024) + ' كيلو');
console.log('  بعد : ' + after.width + '×' + after.height + '  ·  ' + Math.round(aw / 1024) + ' كيلو');
console.log('  النسبة: ' + (after.width / after.height).toFixed(2) + ' (كانت 1.00)');
console.log('\n✅ ' + path.relative(REPO, out));
