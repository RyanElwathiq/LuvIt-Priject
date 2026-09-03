#!/usr/bin/env node
/**
 * ============================================================================
 * توليد مشاهد الصفحات · OpenRouter / Nano Banana Pro
 * ============================================================================
 *   node _أدوات/gen-scene.mjs                 ← عرض الخطة والكلفة · بلا توليد
 *   node _أدوات/gen-scene.mjs --yes           ← الكل
 *   node _أدوات/gen-scene.mjs --yes about-ripple   ← مشهد واحد بالاسم
 *
 * ── الفرق عن gen-covers.mjs ──────────────────────────────────────────
 * ذاك بيولّد **أغلفة مقالات** بمقاس 16:9 وبنفس البرومبت الأسلوبي لكلهن.
 * هاد بيولّد **مشاهد صفحات** · كل واحد إله برومبت كامل مكتوب لحاله من
 * مواصفة التصميم، ومقاسه ومخرَجه مختلفين. وبيسلّم **WebP جاهزاً للرفع**
 * لا PNG خام.
 *
 * ── 🔴 المفتاح ────────────────────────────────────────────────────────
 * ولا مرة بينكتب بالمحادثة ولا بملف متتبَّع · ريّان بيحطّه بإيده.
 * بينقرا من: OPENROUTER_API_KEY  ثم  <جذر الريبو>/.openrouter-key
 * وما بينطبع ولا جزء منه · ولا برسائل الخطأ.
 *
 * ── 🔴 الكلفة · وما في إلغاء ──────────────────────────────────────────
 * ≈ $0.155 للصورة (تقدير من وثائق المزوّد لا فاتورة) · والكلفة الحقيقية
 * بترجع بـ`usage.cost` مع كل رد والسكربت بيطبعها.
 * 🔴 ودرس مدفوع مسجَّل: استكشاف نقطة مدفوعة كلّف $2.62 بلا رجعة ·
 *    فبلا `--yes` السكربت **ما بيبعت ولا طلب**.
 *
 * ── 🔴 قواعد المحتوى · نفس قواعد gen-covers.mjs بالحرف ───────────────
 * ولا نصّ · ولا وجوه · ولا عبوات ولا ملصقات. التجريد فقط: ماء · قطرات ·
 * زجاج · ضوء · نسيج.
 *
 * ── 🔴 وبوابة العين إلزامية بعد التوليد ──────────────────────────────
 * السكربت بيقيس الحجم والأبعاد والألفا ومتوسّط الإضاءة، **بس ما بيقدر
 * يشوف عبوة مهلوسة ولا حرفاً مكسوراً**. افتح الملف وشوفه بعينك قبل
 * الرفع · نفس درس فاتورة عدنان.
 * ============================================================================
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '..');
const OUT = path.join(REPO, 'library', 'img');

const MODEL = 'google/gemini-3-pro-image';
const EST_PER_IMAGE = 0.155;

/* 🔴 sharp مش تبعية للمشروع · مستعارة من node_modules تبع البورتفوليو
   زي كل مولّدات ريّان (Playwright والخط Alexandria بينتحمّلوا من هناك).
   ولو انمسحت: `npm install` بـD:\Ryan-Portfolio\site. */
const SHARP_HOME = 'D:/Ryan-Portfolio/site';

const SCENES = [
  {
    key: 'about-ripple',
    ar: 'قطرة على مي ساكنة · صفحة «من نحن» · #why-we-started',
    file: 'luvit-about-ripple.webp',
    size: 1000,
    /* المواصفة كاملة من حكم التصاميم (٣ أيلول) · ريّان: «السيروم اللي جاي
       وكأنه هو أقوى إشي عننا بشكل غبي · ولّد صورة معبّرة أحسن». */
    prompt:
      'Fine-art macro photograph of a shallow pool of perfectly clear, still water, seen from '
      + 'slightly above at roughly a 25 degree angle. A single water droplet has just struck the '
      + 'exact centre of the surface, throwing up a small clean crown and sending two or three '
      + 'tight concentric ripple rings outward, all of them contained well within the frame, '
      + 'across an otherwise glass-still surface. Nothing else is in the frame. Beneath the water '
      + 'lies a plain, seamless, pale surface with soft caustic light patterns cast across it. '
      + 'Narrow turquoise colour range only: pale aqua highlights around #4CC5DA fading into '
      + 'near-white, with a cool deep teal near #063436 confined to the far shadows. High-key, '
      + 'bright and airy, one soft diffused window light from the upper left, no hard specular '
      + 'hotspots, low contrast. 100mm macro lens at f/4, the impact point tack sharp, the far '
      + 'edge dissolving into soft focus. Square 1:1 composition, subject dead centre, generous '
      + 'empty water all around it. Calm editorial skincare still life. Photorealistic, natural '
      + 'water physics, fine surface-tension detail. '
      + 'Absolutely no bottle, jar, dropper, pipette, tube, packaging, label, logo, text, letters, '
      + 'numbers, watermark or signature. No hand, finger, arm, person, face or skin. No flower, '
      + 'leaf, petal, stone or pebble. No foam, suds, glitter or ice. Not dark or moody, no heavy '
      + 'vignette, no high contrast, no lens flare, no bokeh balls, no CGI plastic look, not an '
      + 'illustration, painting or 3d render.',
  },
];

/* ── المفتاح ─────────────────────────────────────────────────────────── */
function key() {
  if (process.env.OPENROUTER_API_KEY) return process.env.OPENROUTER_API_KEY.trim();
  const f = path.join(REPO, '.openrouter-key');
  if (fs.existsSync(f)) return fs.readFileSync(f, 'utf8').trim();
  console.error('🔴 ما في مفتاح OpenRouter.');
  console.error('   حطّه بـ OPENROUTER_API_KEY أو بملف .openrouter-key بجذر الريبو.');
  process.exit(1);
}

/* ── التوليد ─────────────────────────────────────────────────────────── */
async function generate(s, KEY, sharp) {
  const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + KEY,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://plasmajo.com',
      'X-Title': 'LUV IT page scenes',
    },
    body: JSON.stringify({
      model: MODEL,
      modalities: ['image', 'text'],
      messages: [{ role: 'user', content: s.prompt }],
    }),
  });

  const txt = await r.text();
  if (!r.ok) {
    /* ⚠️ الرد ممكن يحمل المفتاح بالصدى · بنطبع الحالة والرسالة وبس */
    let msg = '';
    try { msg = (JSON.parse(txt).error || {}).message || ''; } catch { msg = txt.slice(0, 160); }
    throw new Error(r.status + ' · ' + msg);
  }

  const j = JSON.parse(txt);
  const m = j.choices?.[0]?.message;
  const url = m?.images?.[0]?.image_url?.url;
  if (!url) throw new Error('ولا صورة بالرد · ' + JSON.stringify(Object.keys(m || {})));
  const b64 = url.split(',')[1];
  if (!b64) throw new Error('الصورة مش data URI');

  fs.mkdirSync(OUT, { recursive: true });
  const rawFile = path.join(OUT, s.file.replace(/\.webp$/, '') + '.src.png');
  fs.writeFileSync(rawFile, Buffer.from(b64, 'base64'));

  /* ── التسليم · مربّع بالمقاس المطلوب · WebP · بلا ألفا ─────────────
     🔴 التسطيح مقصود: القص بيصير بالـCSS (border-radius) وشفافية زايدة
        بتفتح فخّ «صورة شفافة بتطلع سودا» المسجَّل. */
  const outFile = path.join(OUT, s.file);
  await sharp(rawFile)
    .resize(s.size, s.size, { fit: 'cover', position: 'centre' })
    .flatten({ background: '#FFFFFF' })
    .webp({ quality: 80 })
    .toFile(outFile);

  const meta = await sharp(outFile).metadata();
  const stats = await sharp(outFile).stats();
  /* متوسّط الإضاءة التقريبي · القرص قاعد على شريط أبيض فلازم تضل فاتحة */
  const mean = stats.channels.slice(0, 3).reduce((a, c) => a + c.mean, 0) / 3;

  return {
    raw: rawFile,
    file: outFile,
    kb: (fs.statSync(outFile).size / 1024).toFixed(0),
    w: meta.width, h: meta.height,
    alpha: meta.hasAlpha,
    mean: mean.toFixed(1),
    cost: j.usage?.cost,
  };
}

/* ── التشغيل ─────────────────────────────────────────────────────────── */
const argv = process.argv.slice(2);
const GO = argv.includes('--yes');
const only = argv.filter((a) => !a.startsWith('--'));
const list = only.length ? SCENES.filter((s) => only.includes(s.key)) : SCENES;

if (!list.length) {
  console.error('🔴 ما في مشهد بهالاسم · المتاح: ' + SCENES.map((s) => s.key).join(' · '));
  process.exit(1);
}

console.log('الموديل : ' + MODEL);
console.log('المشاهد : ' + list.length + ' من ' + SCENES.length);
console.log('التقدير : ≈ $' + (list.length * EST_PER_IMAGE).toFixed(2)
  + '   ($' + EST_PER_IMAGE + ' للصورة · تقدير من الوثائق لا فاتورة)');
console.log('المخرَج  : ' + OUT);
console.log('');
list.forEach((s) => console.log('  · ' + s.key.padEnd(18) + s.ar));
console.log('');

if (!GO) {
  console.log('🔴 ما انبعت ولا طلب · شغّله بـ--yes.');
  process.exit(0);
}

const require = createRequire(path.join(SHARP_HOME, 'package.json'));
let sharp;
try { sharp = require('sharp'); }
catch {
  console.error('🔴 sharp مش موجودة بـ' + SHARP_HOME + '/node_modules');
  console.error('   الحل: npm install بـ' + SHARP_HOME);
  process.exit(1);
}

const KEY = key();
let total = 0;
for (const s of list) {
  process.stdout.write('· ' + s.key.padEnd(18));
  try {
    const g = await generate(s, KEY, sharp);
    if (typeof g.cost === 'number') total += g.cost;
    console.log('✅ ' + g.w + '×' + g.h + ' · ' + g.kb + 'KB · ألفا ' + (g.alpha ? '🔴 موجودة' : 'لأ')
      + ' · إضاءة ' + g.mean + (typeof g.cost === 'number' ? ' · $' + g.cost.toFixed(4) : ''));
    console.log('  ' + g.file);
  } catch (e) {
    console.log('🔴 ' + e.message);
  }
}
console.log('');
if (total) console.log('الكلفة الحقيقية من الردود: $' + total.toFixed(4));
console.log('🔴 افتح كل ملف وشوفه بعينك قبل الرفع · بوابة العين ما بينوب عنها فحص.');
