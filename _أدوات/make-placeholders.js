#!/usr/bin/env node
/**
 * ============================================================================
 * توليد صور العيّنة · make-placeholders.js
 * ============================================================================
 * بيدوّر عن `src="data:image/svg+xml;base64,PLACEHOLDER_XXX"` بملفات السكاشن
 * وبيستبدلها بـSVG مشفّر base64 حسب اسم العلامة.
 *
 * 🔴 **base64 مش utf8 · وهاد مش تفضيل.**
 *    `wptexturize` بيقوّس الاقتباسات المفردة جوّا `data:image/svg+xml;utf8,`
 *    بمحتوى المقالات، فالـSVG بينكسر والصورة ما بتطلع. صار ٢١ آب على صفحة
 *    المنتجات · ست صور مكسورة دفعة وحدة. الـbase64 ما فيه اقتباسات أصلاً.
 *
 * ⚠️ **وفخ التشفير أخطر من الفخ الأصلي.** أول محاولة استعملت التقاطاً
 *    بينتهي عند أي اقتباس (`[^"']+`)، والـSVG بيستعمل `'` لسمات XML تبعه،
 *    فالالتقاط وقف عند أول وحدة وشفّر جزءاً وترك الباقي خام. السمة بلعت باقي
 *    الـHTML وطلع سترنغ ٧١٤ حرف بينتهي بـ`<div class=` و`atob` بيفشل.
 *    عشان هيك هون **بنبني الـSVG بنود ومنشفّره كامل** · ما في التقاط أصلاً.
 *
 *   node _أدوات/make-placeholders.js [ملف...]
 *
 * 🔴 وكل صورة بتولّدها هاي الأداة **عيّنة**، وبوابة الصدق (`٩.١`) مقفولة
 *    عليها لحد ما تنستبدل بصور صاحب الموقع الحقيقية.
 * ============================================================================
 */

const fs = require('fs');
const path = require('path');

/* لوحة العلامة · من tokens.css · مصدر الحقيقة */
const C = {
  aqua50:  'rgb(234,250,253)',
  aqua100: 'rgb(208,243,249)',
  aqua200: 'rgb(166,231,241)',
  aqua300: 'rgb(116,214,231)',
  aqua500: 'rgb(41,169,192)',
  aqua600: 'rgb(30,134,156)',
  aqua800: 'rgb(18,77,90)',
  amber:   'rgb(166,101,42)',
  white:   'rgb(255,255,255)',
};

/* كل علامة: تدرّج + عبوات. الأرقام كلها داخل viewBox 640x360 (نسبة 16:9)
   وهي مقفولة بالـCSS، فصورة طولية ما بتطوّل البطاقة · بتنقص من الحواف. */
const ART = {
  OILY:      { from: C.aqua50,  to: C.aqua300, bottles: [[250,120,58,170,C.white,.94],[320,150,52,140,C.white,.88]] },
  DRY:       { from: C.aqua100, to: C.aqua500, bottles: [[245,130,58,160,C.white,.90],[315,115,54,175,C.amber,.85]] },
  COMBI:     { from: C.aqua100, to: C.aqua600, bottles: [[248,128,56,162,C.white,.92],[318,142,54,148,C.white,.80]], diagonal: true },
  SENS:      { from: C.aqua100, to: C.aqua600, bottles: [[292,140,56,150,C.white,.92]], halo: true },
  PKG_OILY:  { from: C.aqua50,  to: C.aqua300, bottles: [[212,128,54,162,C.white,.94],[278,108,60,182,C.white,.90],[350,142,52,148,C.white,.86]] },
  PKG_DRY:   { from: C.aqua100, to: C.aqua500, bottles: [[212,132,54,158,C.white,.92],[278,112,60,178,C.amber,.86],[350,140,52,150,C.white,.88]] },
  PKG_BASIC: { from: C.aqua50,  to: C.aqua200, bottles: [[240,120,58,170,C.white,.94],[318,140,54,150,C.white,.88]] },
};

/* مرادفات · نفس الرسمة باسم تاني.
   🔴 صفحتا المختلطة والحسّاسة بتستعملوا نفس المنتج (203 بكج الروتين
   الأساسي)، وسمّوا علامته `PKG_ESSENTIAL`. الاسمان لازم يعطوا **نفس
   الرسمة بالضبط**، لأن نفس المنتج بصورتين مختلفتين بيخلي الزبونة تحسب
   إنهم بكجين. فالمرادف هون مقصود · مش تساهل بالتسمية. */
ART.PKG_ESSENTIAL = ART.PKG_BASIC;

function svg(key) {
  const a = ART[key];
  if (!a) return null;
  const id = 'g' + key.toLowerCase().replace(/_/g, '');
  const coords = a.diagonal ? `x1='0' y1='0' x2='1' y2='1'` : `x1='0' y1='0' x2='0' y2='1'`;
  const bottles = a.bottles
    .map(([x, y, w, h, fill, op]) =>
      `<rect x='${x}' y='${y}' width='${w}' height='${h}' rx='13' fill='${fill}' opacity='${op}'/>`)
    .join('');
  const halo = a.halo ? `<circle cx='320' cy='190' r='78' fill='${C.white}' opacity='.5'/>` : '';
  /* خط الماء بأسفل الصورة · تنبيه التركيب بيقول اترك آخر 45px هادية */
  const wave = `<path d='M0 320 C 120 300, 240 340, 360 320 S 560 300, 640 316 L640 360 L0 360 Z' fill='${C.white}' opacity='.22'/>`;
  return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 640 360'>` +
    `<defs><linearGradient id='${id}' ${coords}>` +
    `<stop offset='0' stop-color='${a.from}'/><stop offset='1' stop-color='${a.to}'/>` +
    `</linearGradient></defs>` +
    `<rect width='640' height='360' fill='url(%23${id})'/>` +
    halo + bottles + wave +
    `</svg>`;
}

const files = process.argv.slice(2);
if (!files.length) {
  console.error('استعمال: node _أدوات/make-placeholders.js <ملف.html> [...]');
  console.error('العلامات المتاحة: ' + Object.keys(ART).join(' · '));
  process.exit(2);
}

let total = 0, unknown = [];
for (const f of files) {
  if (!fs.existsSync(f)) { console.log('🔴 مش موجود: ' + f); continue; }
  let h = fs.readFileSync(f, 'utf8');
  let n = 0;

  /* 🔴 الالتقاط بينتهي عند `"` **وحده**. الاسم أحرف كبيرة وشرطات سفلية
     وبس، فما في احتمال يبلع اقتباساً ولا وسماً. */
  h = h.replace(/src="data:image\/svg\+xml;base64,PLACEHOLDER_([A-Z_]+)"/g, (m, key) => {
    const s = svg(key);
    if (!s) { unknown.push(key); return m; }
    n++;
    return 'src="data:image/svg+xml;base64,' + Buffer.from(s, 'utf8').toString('base64') + '"';
  });

  if (n) { fs.writeFileSync(f, h, 'utf8'); total += n; }
  console.log((n ? '✅ ' : '·  ') + path.basename(f) + ' · ' + n + ' صورة');
}

if (unknown.length) {
  console.log('🔴 علامات ما بعرفها: ' + [...new Set(unknown)].join(' · '));
  console.log('   المتاح: ' + Object.keys(ART).join(' · '));
  process.exit(1);
}

/* 🔴 التحقق: فُكّ كل صورة انكتبت وتأكد إنها SVG سليم.
   «انشفّرت» مش «اشتغلت» · الأداة المكسورة قالت انشفّرت ست صور وهي مقطوعة. */
let checked = 0, bad = 0;
for (const f of files) {
  if (!fs.existsSync(f)) continue;
  const h = fs.readFileSync(f, 'utf8');
  for (const m of h.matchAll(/src="data:image\/svg\+xml;base64,([^"]+)"/g)) {
    checked++;
    let dec;
    try { dec = Buffer.from(m[1], 'base64').toString('utf8'); } catch (e) { bad++; continue; }
    if (!/^<svg[\s\S]*<\/svg>$/.test(dec.trim())) { bad++; console.log('🔴 مقطوعة بـ' + path.basename(f)); }
  }
}
console.log('---');
console.log('انشفّر: ' + total + ' · انفحص بالفكّ: ' + checked + ' · معطوبة: ' + bad + (bad ? ' 🔴' : ' ✅'));
if (bad) process.exit(1);
