#!/usr/bin/env node
/**
 * ============================================================================
 * صور البكجات · build-bundle-images.mjs
 * ============================================================================
 *   node _أدوات/build-bundle-images.mjs
 *
 * كل بكج = ٤ منتجات. وما في صورة جماعية بأصول العلامة إلا جرافيكات
 * الروتينات، **وهي بترسم جيل تغليف أقدم** (المنظف مكتوب عليه
 * «Ceramides + Natural Extracts» والعلبة الواصلة «Squalane · Beta-glucan»).
 *
 * 🔴 لو انحطّت جرافيكات الروتينات كصور بكجات، بتناقض صفحات المنتجات **بنفس
 *    الموقع**. فالصورة بتنبنى من صور العبوات الحقيقية اللي رفعناها.
 *
 * الأصل شفاف، فالتركيب بيقعد على خلفية بلون العلامة بدل الأبيض السادة.
 * ============================================================================
 */

import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const sharp = require('D:/Ryan-Portfolio/site/node_modules/sharp');

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SRC  = path.resolve(HERE, '..', '..', 'صور-المنتجات', '_للويب');
const OUT  = SRC;

const SIZE = 2000;
const BG   = { r: 244, g: 250, b: 251, alpha: 1 };   /* ماء فاتح جداً · قريب من --aqua-50 */

const SLUG = {
  L101: 'vitamin-c-serum',            L102: 'intensive-hydrating-serum',
  L105: 'clarifying-pore-tightening-toner', L110: 'sebum-balancing-gel-cleanser',
  L111: 'hydrating-gel-cleanser',     L114: '8d-hyaluronic-acid-toner',
  L116: 'moisturizing-repairing-cream',
  /* انضافوا 4 Sept مع نسختي روتين توحيد اللون */
  L112: 'high-protection-sunscreen',  L119: 'alpha-arbutin-complex-serum',
};

/* Which shot to use. Default is the bare bottle.
   Alpha arbutin has no bottle shot in the asset set, only box views, so it
   uses the box front. That is not a compromise: the box is the only surface
   carrying the actual formula (2% alpha arbutin, 3% tranexamic acid,
   2% glutathione, 5% niacinamide) and the printed live image already
   composes it that way, so the two variants stay visually consistent. */
const VIEW_OF = { L119: '2-box-front' };

/* الروتينات المنشورة على إنستغرام · Highlight «Our Routines» ٢٤ حزيران */
const BUNDLES = [
  { file: 'luvit-bundle-hydration.webp',  items: ['L111','L114','L102','L116'] },
  { file: 'luvit-bundle-glow.webp',       items: ['L111','L114','L101','L116'] },
  { file: 'luvit-bundle-clarify.webp',    items: ['L110','L105','L101','L116'] },

  /* Even tone, both variants. Ryan split this routine by skin type on 4 Sept:
     the last three steps are identical and only the cleanser and the toner
     change, which is exactly what the two images have to show. Both are
     generated here rather than one being made by hand, so they cannot drift
     apart in framing or in background. */
  { file: 'luvit-bundle-eventone.webp',     items: ['L110','L105','L119','L116','L112'] },
  { file: 'luvit-bundle-eventone-dry.webp', items: ['L111','L114','L119','L116','L112'] },
];

for (const b of BUNDLES) {
  const n = b.items.length;
  const pad = Math.round(SIZE * 0.04);
  const cellW = Math.floor((SIZE - pad * (n + 1)) / n);

  const layers = [];
  for (let i = 0; i < n; i++) {
    const view = VIEW_OF[b.items[i]] || '1-bottle';
    const src = path.join(SRC, `luvit-${SLUG[b.items[i]]}-${view}.webp`);
    if (!fs.existsSync(src)) { console.error('🔴 ناقص: ' + src); process.exit(1); }
    /* قصّ الفراغ الشفاف حوالين كل عبوة عشان تملا خانتها بدل ما تطلع صغيرة */
    const trimmed = await sharp(src).trim({ threshold: 1 }).toBuffer();
    const tile = await sharp(trimmed)
      .resize(cellW, Math.round(SIZE * 0.74), { fit: 'inside', background: { r:0,g:0,b:0,alpha:0 } })
      .toBuffer({ resolveWithObject: true });
    layers.push({
      input: tile.data,
      left: pad + i * (cellW + pad) + Math.round((cellW - tile.info.width) / 2),
      top: Math.round((SIZE - tile.info.height) / 2),
    });
  }

  const out = path.join(OUT, b.file);
  await sharp({ create: { width: SIZE, height: SIZE, channels: 4, background: BG } })
    .composite(layers)
    .webp({ quality: 84, effort: 5 })
    .toFile(out);

  const kb = Math.round(fs.statSync(out).size / 1024);
  console.log(`✅ ${b.file.padEnd(34)} ${n} عبوات · ${kb} كيلو`);
}
