#!/usr/bin/env node
/**
 * ============================================================================
 * تحضير صور المنتجات للويب · build-web-photos.mjs
 * ============================================================================
 *   node _أدوات/build-web-photos.mjs
 *
 * الأصل ٥٠٠٠×٥٠٠٠ PNG شفاف · ٢-٦ ميغا للصورة. ٤٣ صورة منهم = ١٧٨ ميغا،
 * وهاد **ما بينرفع على ووردبريس زي ما هو** — لا المكتبة بتستحمله ولا الصفحة.
 *
 * المخرَج: **٢٠٠٠×٢٠٠٠ WebP بقناة ألفا**.
 *
 * 🔴 ليش ٢٠٠٠ بالضبط · مش رقماً عشوائياً:
 *    ووكومرس بيعرض صورة المنتج بـ`single_image_width` (٦٠٠ افتراضياً)،
 *    **وبيلغي الزوم إذا الأصل مش أكبر من مقاس العرض**. ٢٠٠٠ بتعطي
 *    تكبير ×٣.٣ وهاد إحساس أمازون، وبتضل الملف ≈٢٠٠ كيلو مش ٤ ميغا.
 *
 * ⚠️ **الأسماء لاتينية إلزاماً.** ووردبريس بيمسخ الأسماء العربية بالروابط
 *    (نسبة مئوية مشفّرة)، والصورة بتصير رابطها طلسم وSEO صفر.
 *
 * ⚠️ **والشفافية بتنحفظ.** WebP بيدعم ألفا، والمنتج بيقدر يقعد على أي
 *    خلفية بلون العلامة بدل الأبيض السادة.
 * ============================================================================
 */

import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
/* sharp مش مثبّت بهذا المشروع · بينستعار من البورتفوليو (قراءة بس) */
const SHARP_PATH = 'D:/Ryan-Portfolio/site/node_modules/sharp';
let sharp;
try { sharp = require(SHARP_PATH); }
catch (e) {
  console.error('🔴 ما قدرت أحمّل sharp من ' + SHARP_PATH);
  console.error('   لو node_modules تبع البورتفوليو انمسح: cd D:/Ryan-Portfolio/site && npm install');
  process.exit(2);
}

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SRC  = path.resolve(HERE, '..', '..', 'صور-المنتجات', 'مرتّبة');
const OUT  = path.resolve(HERE, '..', '..', 'صور-المنتجات', '_للويب');

const SIZE    = 2000;
const QUALITY = 82;

/* سلَق لاتيني لكل منتج · بينبني عليه اسم الملف والـalt */
const SLUG = {
  L101: 'vitamin-c-serum',
  L102: 'intensive-hydrating-serum',
  L103: 'centella-blemish-cream',
  L104: 'pore-tightening-brightening-serum',
  L105: 'clarifying-pore-tightening-toner',
  L106: 'aha-bha-peeling-serum',
  L110: 'sebum-balancing-gel-cleanser',
  L111: 'hydrating-gel-cleanser',
  L114: '8d-hyaluronic-acid-toner',
  L116: 'moisturizing-repairing-cream',
  L119: 'alpha-arbutin-complex-serum',
};

const VIEW = { '1': 'bottle', '2': 'box-front', '3': 'box-back', '4': 'box-side' };

if (!fs.existsSync(SRC)) { console.error('🔴 ما لقيت: ' + SRC); process.exit(2); }
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

const manifest = [];
let done = 0, srcBytes = 0, outBytes = 0;

for (const folder of fs.readdirSync(SRC).sort()) {
  const dir = path.join(SRC, folder);
  if (!fs.statSync(dir).isDirectory()) continue;

  const code = folder.split(' ')[0];
  const slug = SLUG[code];
  if (!slug) { console.error('🔴 ما في سلَق للكود ' + code + ' · حدّث SLUG'); process.exit(1); }

  const wooMatch = folder.match(/woo-(\d+)/);
  const woo = wooMatch ? Number(wooMatch[1]) : null;

  const images = [];
  for (const f of fs.readdirSync(dir).filter((x) => /\.(png|jpe?g)$/i.test(x)).sort()) {
    const n = f[0];
    const view = VIEW[n];
    if (!view) { console.error('🔴 اسم غير متوقّع: ' + folder + '/' + f); process.exit(1); }

    const outName = `luvit-${slug}-${n}-${view}.webp`;
    const outPath = path.join(OUT, outName);

    await sharp(path.join(dir, f))
      .resize(SIZE, SIZE, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .webp({ quality: QUALITY, alphaQuality: 100, effort: 5 })
      .toFile(outPath);

    const sb = fs.statSync(path.join(dir, f)).size;
    const ob = fs.statSync(outPath).size;
    srcBytes += sb; outBytes += ob; done++;

    images.push({ slot: Number(n), view, file: outName, path: outPath, bytes: ob });
    process.stdout.write(`  ${outName.padEnd(52)} ${String(Math.round(ob / 1024)).padStart(5)} كيلو  (كان ${Math.round(sb / 1024)})\n`);
  }

  manifest.push({ code, slug, woo, folder, images });
}

fs.writeFileSync(path.join(OUT, '_manifest.json'), JSON.stringify(manifest, null, 1), 'utf8');

console.log('');
console.log('─'.repeat(70));
console.log(`✅ ${done} صورة · ${Math.round(srcBytes / 1048576)} ميغا ← ${Math.round(outBytes / 1048576)} ميغا` +
            `  (${Math.round(100 - 100 * outBytes / srcBytes)}٪ أقل)`);
console.log(`   المخرَج: ${OUT}`);
