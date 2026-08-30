#!/usr/bin/env node
/**
 * ============================================================================
 * تنعيم حافة القصّ · soften-cutout.mjs
 * ============================================================================
 *   node _أدوات/soften-cutout.mjs <اسم-الصورة-بلا-امتداد> [نصف-قطر]
 *
 * ── ليش ──────────────────────────────────────────────────────────────
 * صور المنتجات مقصوصة صح (الصندوق المحيط = العبوة بالضبط، والزوايا شفافة
 * فعلاً)، **بس حافّة الألفا حادّة**. وجسم العبوة `rgb(224,224,224)` قريب
 * من خلفية الصفحة الفاتحة، فالحافة الحادّة بتقرا **ملصق مقصوص** مش غرضاً
 * واقفاً بمكان. ريّان مسكها باللقطة ٣٠ آب: «الحواف مش سايحة مع الخلفية».
 *
 * ── شو بيعمل ─────────────────────────────────────────────────────────
 * بيفصل قناة الألفا، بيمسحها بضباب خفيف، وبيرجّعها. الـRGB ما بينلمس —
 * التنعيم على **الشفافية** وحدها، فالعبوة ما بتصير ضبابية.
 *
 * 🔴 ونصف القطر صغير بقصد (١٫٢ بكسل على ٢٠٠٠px). أكبر من هيك بتصير
 *    هالة باينة حوالي العبوة، وهاي أوحش من الحافة الحادّة.
 *
 * ⚠️ و`sharp` مستعارة للقراءة من `D:/Ryan-Portfolio/site/node_modules`.
 * ============================================================================
 */
import path from 'node:path';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire('D:/Ryan-Portfolio/site/package.json');
let sharp;
try { sharp = require('sharp'); }
catch { console.error('🔴 ما لقيت sharp · شوف فخ Playwright بـCLAUDE.md'); process.exit(1); }

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '..');
const IMG = path.join(REPO, 'library', 'img');

const name = process.argv[2];
const radius = Number(process.argv[3] || 1.2);
if (!name) { console.error('usage: node _أدوات/soften-cutout.mjs <اسم-بلا-امتداد> [نصف-قطر]'); process.exit(2); }

const src = path.join(IMG, name + '.webp');
if (!fs.existsSync(src)) { console.error('🔴 ما لقيت ' + src); process.exit(1); }
const out = path.join(IMG, name.replace(/-trim$/, '') + '-soft.webp');

const meta = await sharp(src).metadata();

/* قياس حدّة الحافة قبل · كم بكسل نصف-شفاف (بين ١٦ و٢٤٠) */
async function edgePixels(file) {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let soft = 0, opaque = 0;
  for (let i = 3; i < data.length; i += info.channels) {
    const a = data[i];
    if (a > 16 && a < 240) soft++;
    if (a >= 240) opaque++;
  }
  return { soft, opaque, ratio: soft / Math.max(1, opaque) };
}
const before = await edgePixels(src);

/* الألفا لوحدها · ضباب · ورجوع */
const rgb = await sharp(src).removeAlpha().toBuffer();
const alpha = await sharp(src).extractChannel('alpha').blur(radius).toBuffer();

await sharp(rgb)
  .joinChannel(alpha)
  .webp({ quality: 90, alphaQuality: 100, effort: 5 })
  .toFile(out);

const after = await edgePixels(out);

console.log('  ' + meta.width + '×' + meta.height + ' · نصف القطر ' + radius + 'px');
console.log('  بكسلات الحافة النصف-شفافة: ' + before.soft + ' → ' + after.soft +
            '  (نسبتها للمعتم ' + (before.ratio * 100).toFixed(1) + '٪ → ' + (after.ratio * 100).toFixed(1) + '٪)');
if (after.soft <= before.soft) {
  console.error('  🔴 الحافة ما نعمت · الضباب ما اشتغل على الألفا');
  process.exit(1);
}
console.log('\n✅ ' + path.relative(REPO, out));
