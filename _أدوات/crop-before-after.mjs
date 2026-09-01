#!/usr/bin/env node
/**
 * ============================================================================
 * قصّ صور «قبل وبعد» من لقطة ستوري · crop-before-after.mjs
 * ============================================================================
 *   node _أدوات/crop-before-after.mjs
 *
 * المصدر: `_وارد-ريان/m22352-02.png` · لقطة ستوري انستجرام من حساب
 * د.رَماس عبدالنبي (dr_ramass) · شريكة معتمدة للعلامة (كود خصم Ramas10).
 * بعتها ريّان ٣١ آب: «ولقيت صور before و after بس بدهم شغل».
 *
 * ── 🔴 حدود هالصور · مقيسة مش مقدَّرة ────────────────────────────────────
 * اللقطة كلها **٤٥٢×٧٥٧** وأوسع لوحة جوّاها **١٧٤ بكسل**. يعني:
 *   · **ممنوع** عرض كامل ولا سلايدر كبير · نفخ ١٧٤ لـ٨٠٠ بيهرسها.
 *   · العرض المصمَّم **٢٤٠px CSS كحد أعلى**، والملف بيتطلع ×٢ عشان يضل
 *     حاداً على الشاشات عالية الكثافة.
 *   · الصِغَر **مقصود** · صورة هاتف صغيرة بتقرا «حقيقية»، والمنفوخة بتقرا
 *     «مزوّرة». قرار تصميم مبني على قياس، مش تنازلاً.
 *
 * ── 🔴 والفخّ اللي انمسك بالقياس ─────────────────────────────────────────
 * اللوحات الأربع **مش بنفس النسبة** بالمصدر:
 *      a-before 152×203 (0.749)   ·   a-after 139×217 (0.641)
 * ولو انعرضوا جنب بعض بصندوقين متساويين، المتصفّح بيمطّ وحدة منهم،
 * و**التأطير المختلف بيغيّر شكل الوجه** · يعني المقارنة بتكذب حتى لو
 * الصورتان صادقتان. فالسكربت **بيوحّد النسبة بقصّ من المركز** لا بالمطّ.
 *
 * ⚠️ والصندوق الضيّق بينحسب **آلياً** بمطابقة لون خلفية الستوري
 *    (241,234,226) · مش أرقاماً مكتوبة بالإيد، عشان يضل شغّالاً لو
 *    انبدّل المصدر.
 * ============================================================================
 */
import path from 'node:path';
import fs from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const sharp = require('D:/Ryan-Portfolio/site/node_modules/sharp');

const REPO = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const SRC = path.join(REPO, '..', '_وارد-ريان', 'm22352-02.png');
const OUT = path.join(REPO, 'library', 'img');
const SCALE = 2;
const BG = [241, 234, 226];
const TOL = 11;

/* مناطق البحث · واسعة عمداً · الصندوق الضيّق بينحسب جوّاها
   🔴 اللقطة فيها **زوجان**: مشهد قريب (فوق) ومشهد أوسع (تحت).
      والتحتاني **مستثنى بقرار بصري لا تقني**: قصّيته وشفته وطلع
      شريطاً بنّياً ضبابياً ١٧٤×١٠١ ما بيوري ولا إشي · إضافته بتملأ
      مساحة وبتضعّف الحُجّة. فحذفته بدل ما يضل ملفاً ميتاً بالريبو.
      إحداثياته محفوظة تحت لو إجت صورة أوضح من صاحب العلامة:
         b-before [40, 263, 235, 375]   ·   b-after [236, 263, 451, 375] */
const ZONES = {
  'a-before': [40, 45, 235, 262],
  'a-after': [236, 45, 451, 262],
};

if (!fs.existsSync(SRC)) { console.error('🔴 ما لقيت ' + SRC); process.exit(1); }
fs.mkdirSync(OUT, { recursive: true });

const { data, info } = await sharp(SRC).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const { width: W, channels: C } = info;
const px = (x, y) => { const i = (y * W + x) * C; return [data[i], data[i + 1], data[i + 2]]; };
const isBg = (c) => Math.abs(c[0] - BG[0]) < TOL && Math.abs(c[1] - BG[1]) < TOL && Math.abs(c[2] - BG[2]) < TOL;

function bbox(x0, y0, x1, y1) {
  let L = x1, R = x0, T = y1, B = y0;
  for (let y = y0; y <= y1; y++) {
    let n = 0; for (let x = x0; x <= x1; x++) if (!isBg(px(x, y))) n++;
    if (n / (x1 - x0 + 1) > 0.2) { if (y < T) T = y; if (y > B) B = y; }
  }
  for (let x = x0; x <= x1; x++) {
    let n = 0; for (let y = y0; y <= y1; y++) if (!isBg(px(x, y))) n++;
    if (n / (y1 - y0 + 1) > 0.2) { if (x < L) L = x; if (x > R) R = x; }
  }
  if (R <= L || B <= T) throw new Error('صندوق فاضي · تغيّر المصدر؟');
  return { left: L, top: T, width: R - L + 1, height: B - T + 1 };
}

const box = {};
for (const [k, z] of Object.entries(ZONES)) box[k] = bbox(...z);

/* توحيد النسبة داخل كل زوج · بقصّ من المركز، ولا مرة بمطّ */
function pair(a, b) {
  const ra = box[a].width / box[a].height;
  const rb = box[b].width / box[b].height;
  const r = Math.min(ra, rb);                 /* الأضيق بيحكم · القصّ بس */
  for (const k of [a, b]) {
    const o = box[k];
    const w = Math.min(o.width, Math.round(o.height * r));
    const h = Math.min(o.height, Math.round(w / r));
    box[k] = {
      left: o.left + Math.round((o.width - w) / 2),
      top: o.top + Math.round((o.height - h) / 2),
      width: w, height: h,
    };
  }
  return r;
}
const rA = pair('a-before', 'a-after');
const rB = pair('b-before', 'b-after');

const done = [];
for (const [k, o] of Object.entries(box)) {
  const dst = path.join(OUT, 'luvit-case-' + k + '.webp');
  await sharp(SRC)
    .extract(o)
    .resize({ width: o.width * SCALE, height: o.height * SCALE, kernel: 'lanczos3' })
    .sharpen({ sigma: 0.7, m1: 0.5, m2: 0.9 })
    .webp({ quality: 90 })
    .toFile(dst);
  done.push({ k, src: `${o.width}x${o.height}`, out: `${o.width * SCALE}x${o.height * SCALE}`,
              r: (o.width / o.height).toFixed(3), kb: (fs.statSync(dst).size / 1024).toFixed(0) });
}

/* 🔴 بوابة · الزوج لازم يطلع بنفس النسبة، وإلا المقارنة بتكذب */
const bad = [];
const rr = (k) => Number(done.find((d) => d.k === k).r);
if (Math.abs(rr('a-before') - rr('a-after')) > 0.01) bad.push('زوج a نسبته مختلفة');
if (Math.abs(rr('b-before') - rr('b-after')) > 0.01) bad.push('زوج b نسبته مختلفة');
if (bad.length) { bad.forEach((b) => console.error('🔴 ' + b)); process.exit(1); }

console.log('✅ أربع لوحات · النسبة موحَّدة بالقصّ لا بالمطّ');
console.log('   زوج أ (مشهد قريب)  نسبة ' + rA.toFixed(3));
console.log('   زوج ب (مشهد أوسع)  نسبة ' + rB.toFixed(3));
console.log('');
done.forEach((d) => console.log('   luvit-case-' + d.k.padEnd(12) + d.src.padStart(8) + ' → ' +
  d.out.padStart(9) + '  نسبة ' + d.r + '  ' + d.kb + 'KB'));
console.log('');
console.log('🔴 قبل النشر: هاي وجه إنسانة حقيقية · بدها إذن مكتوب منها ومن');
console.log('   د.رَماس ومن صاحب العلامة. بند بخطة الإطلاق.');
