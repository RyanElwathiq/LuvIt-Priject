#!/usr/bin/env node
/**
 * ============================================================================
 * أيقونة الموقع · make-favicon.mjs
 * ============================================================================
 *   node _أدوات/make-favicon.mjs
 *
 * ── 🔴 ليش انبنى ─────────────────────────────────────────────────────────
 * الموقع كان **بلا أيقونة** · فالمتصفح بيحط أيقونة ووردبريس الافتراضية
 * بالتبويب وبالمفضّلة، وهاد بيقرا كموقع مش مضبوط.
 *
 * ⚠️ واللوجو **مستطيل** (417×220) وأيقونة الموقع **لازم مربّعة** ·
 *    ووردبريس بده ٥١٢×٥١٢ على الأقل، وبيقصّ لحاله لو مش مربّعة فبياكل
 *    نصّ الاسم. فالمربّع بينعمل **بحشو لا بقصّ**.
 *
 * 🔴 والخلفية **مش شفافة بقصد** · أيقونة التبويب بتنعرض على أبيض بالوضع
 *    الفاتح وعلى غامق بالوضع الغامق، وشعار شفاف ملوّن بينضيع على الغامق.
 *    فالحشو أبيض · نفس اللي بيصير بأيقونات العلامات المعروفة.
 * ============================================================================
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const sharp = require('D:/Ryan-Portfolio/site/node_modules/sharp');

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '..');
const SRC = path.resolve(REPO, '..', 'صور-المنتجات', '_للويب', 'luvit-logo.png');
const OUT = path.join(REPO, '_وارد');

if (!fs.existsSync(SRC)) { console.error('🔴 ما لقيت اللوجو: ' + SRC); process.exit(1); }

const meta = await sharp(SRC).metadata();
console.log('المصدر: ' + meta.width + '×' + meta.height + ' · شفاف: ' + meta.hasAlpha);

/* الحجم النهائي · ٥١٢ هو حدّ ووردبريس الأدنى لأيقونة الموقع */
const S = 512;
/* هامش داخلي · الأيقونة بتنعرض ١٦px بالتبويب، فاللوجو لازم يملا أغلبها
   بس بلا ما يلزق بالحواف (المتصفحات بتدوّر الزوايا). */
const PAD = Math.round(S * 0.12);
const inner = S - PAD * 2;

const logo = await sharp(SRC)
  .resize(inner, inner, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
  .toBuffer();

const icon = await sharp({
  create: { width: S, height: S, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } },
})
  .composite([{ input: logo, gravity: 'center' }])
  .png()
  .toBuffer();

fs.mkdirSync(OUT, { recursive: true });
const P = path.join(OUT, 'luvit-site-icon.png');
fs.writeFileSync(P, icon);

const m2 = await sharp(P).metadata();
if (m2.width !== S || m2.height !== S) { console.error('🔴 مش مربّعة'); process.exit(1); }
console.log('✅ ' + path.relative(REPO, P) + ' · ' + m2.width + '×' + m2.height +
  ' · ' + Math.round(fs.statSync(P).size / 1024) + ' كيلوبايت');
