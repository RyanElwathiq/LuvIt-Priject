#!/usr/bin/env node
/**
 * ============================================================================
 * خريطة المكوّنات عبر كل المنتجات الحيّة · ingredient-map.mjs
 * ============================================================================
 *   node _أدوات/ingredient-map.mjs [اسم المكوّن]
 *
 * ── 🔴 ليش انبنى ─────────────────────────────────────────────────────────
 * مقالا النياسيناميد والبانثينول انكتبوا من `_خطة/بيانات-المنتجات-الرسمية.json`
 * وحده · وهو **٩ منتجات**، والمتجر فيه **١٢ منتجاً مفرداً**.
 * التلاتة الزيادة (ألفا أربوتين L119 · سنتيلا L103 · واقي الشمس L112) أحدث
 * من بروفايل الصيدليات اللي انقرا منه الكتالوج، **ونِسَبها موجودة بووكومرس**
 * بحقل الوصف المختصر.
 *
 * ⤷ فالمقال قال «النياسيناميد بخمس منتجات» و**الحقيقة سبعة** · ألفا أربوتين
 *   وسنتيلا الاثنان فيهم ٥٪ نياسيناميد وما انعدّوا.
 *
 * 🔴 والدرس: **مصدر جزئي بيعطي رقماً واثقاً وغلط.** الكتالوج مصدر ممتاز
 *    للنِسَب الرسمية، بس هو **لقطة لتسعة منتجات بوقت معيّن** لا جرد المتجر.
 *    أي عبارة فيها عدّ («بـX منتجات» · «X من Y») لازم تنحسب من **الحيّ**.
 * ============================================================================
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '..');
const woo = JSON.parse(fs.readFileSync(path.join(REPO, '_وارد', 'woo-products.json'), 'utf8'));
const cat = JSON.parse(fs.readFileSync(path.join(REPO, '_خطة', 'بيانات-المنتجات-الرسمية.json'), 'utf8'));

/* 🔴 **المصدران بيختلفوا · والصح اتّحادهم.**
   الوصف المختصر بووكومرس **مقصوص** لبعض المنتجات:
     غسول البشرة الجافة (L111) · الكتالوج بيقول فيه ٠٫٨٪ نياسيناميد
       وووكومرس ما بيذكره أصلاً
     سيروم تضييق المسامات (L104) · الكتالوج بيقول ١٪ بانثينول و٥٪ جلسرين
       وووكومرس بيوقف عند الهيالورونيك
   والكتالوج بالمقابل **٩ منتجات بس** · تلاتة أحدث منه (L103 · L112 · L119)
   موجودة بووكومرس وحده.

   ⤷ فولا مصدر لحاله بيعطي الجرد · الاتّحاد هو اللي بيعطيه.
   ⚠️ ولو اختلفت **النسبة نفسها** لنفس المادة بنفس المنتج، الأداة بتوقف ·
      هاد تناقض بيانات بينعرض على ريّان لا بينحلّ بالتخمين. */
/** 🔴 توحيد صيغة النسبة قبل أي مقارنة.
 *  المصدران بيكتبوها مختلف: ووكومرس `10% + 2%` والكتالوج `10% + 2%` بس
 *  `String(pct).replace('%','')` بتشيل **أول `%` بس** فبتطلع `10 + 2%`.
 *  فالمقارنة كانت بتصرخ «تعارض» على قيمتين متطابقتين.
 *  ⚠️ إنذار كاذب من الأداة، مش تعارض بيانات · وكان بيظهر بكل تشغيلة.
 */
const نسبة = (v) => String(v).replace(/%/g, '').replace(/\s+/g, '').trim();

const byWooId = {};
for (const rec of cat.منتجات) {
  if (!rec.woo) continue;
  byWooId[rec.woo] = (rec.actives || []).map((a) => ({ pct: String(a.pct).replace(/%$/, ''), name: a.name }));
}

/* المفردات فقط · البكجات مجموعة قطع لا منتج بتركيبة */
const singles = woo.منتجات.filter((p) => !/^روتين /.test(p.name));

const strip = (s) => String(s || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

/** كل نسبة مع اسم مادّتها من الوصف المختصر · «10% فيتامين سي»
 *
 *  🔴 و**الصيغة المركّبة** بتنقرا أول · «10% + 2% AHA + BHA» **مادة وحدة**
 *     بنسبتين، مش مادتين. بلا هالحالة الريجيكس بياخد `10%` ويسمّيها `+`،
 *     وبعدين ياخد `2%` ويسمّيها «AHA + BHA» · فالأداة بتقول
 *     «تعارض: ووكومرس 2% مقابل الكتالوج 10 + 2%» **وهما متطابقان**.
 *     ⚠️ إنذار كاذب من الأداة نفسها · والإنذار الكاذب بيلغي الأداة كلها.
 */
function actives(text) {
  const out = [];
  const مأخوذ = [];
  let m;

  /* ١ · المركّبة · N% + M% <اسم> */
  const مركّب = /(\d+(?:\.\d+)?\s*%\s*\+\s*\d+(?:\.\d+)?\s*%)\s*([^·،\n]+?)(?=\s*·|\s*،|\s*$)/g;
  while ((m = مركّب.exec(text))) {
    const name = m[2].replace(/\s+\d+\s*ml.*$/, '').trim();
    if (name) {
      out.push({ pct: m[1].replace(/\s+/g, ' ').trim(), name });
      مأخوذ.push(m[0]);
    }
  }

  /* ٢ · المفردة · من اللي ما انأخذ */
  let بقية = text;
  for (const t of مأخوذ) بقية = بقية.split(t).join(' · ');
  const مفرد = /(\d+(?:\.\d+)?)\s*%\s*([^·،\n]+?)(?=\s*·|\s*،|\s*$|\s+\d+\s*%)/g;
  while ((m = مفرد.exec(بقية))) {
    const name = m[2].replace(/\s+\d+\s*ml.*$/, '').trim();
    if (name && name !== '+') out.push({ pct: m[1], name });
  }
  return out;
}

/** دمج المصدرين · بالاسم · مع كشف تعارض النِسَب */
const conflicts = [];
function merge(wooList, catList, productName) {
  const map = new Map();
  for (const a of wooList) map.set(a.name.trim(), a.pct);
  for (const a of catList) {
    const k = a.name.trim();
    if (map.has(k) && نسبة(map.get(k)) !== نسبة(a.pct)) {
      conflicts.push(productName + ' · ' + k + ' · ووكومرس ' + map.get(k) + '% مقابل الكتالوج ' + a.pct + '%');
    }
    if (!map.has(k)) map.set(k, a.pct);
  }
  return [...map].map(([name, pct]) => ({ name, pct }));
}

const rows = singles.map((p) => ({
  id: p.id, slug: p.slug, name: p.name, price: p.price,
  actives: merge(actives(strip(p.short)), byWooId[p.id] || [], p.name),
}));

if (conflicts.length) {
  console.error('🔴 تعارض نِسَب بين المصدرين · بينعرض على ريّان لا بينحلّ بالتخمين:');
  conflicts.forEach((c) => console.error('     ' + c));
  console.error('');
}


/* ══════════════════════════════════════════════════════════════════════
   التصدير · عشان البوابات تقرا من **نفس** المنطق لا من نسخة تانية
   ══════════════════════════════════════════════════════════════════════
   🔴 بوابة المقالات كانت بتقرا الكتالوج **وحده** (٩ منتجات)، وهاد بالضبط
      اللي خلّى مقالين ينكتبوا بأرقام ناقصة. بوابة بمصدر أضعف من مصدر
      الكاتب **بتمرّر الغلط وبتعطي إحساس أمان**.
   ⤷ من هون وطالع، أي حدا بده «كل النِسَب» أو «كم منتجاً فيه X» بياخدها
     من هون · والدمج بينعمل مرة وحدة. */

/** كل المنتجات المفردة الحيّة مع موادّها الفعّالة مدموجة من المصدرين */
export const منتجات = rows;

/** تعارضات النِسَب بين المصدرين · فاضية = المصدران متطابقان */
export const تعارضات = conflicts;

/** كل قيم النِسَب المعروفة كنصّ · «0.5» · «10» · «3» */
export const نِسَب_معروفة = new Set(
  rows.flatMap((r) => r.actives.flatMap((a) =>
    [...String(a.pct).matchAll(/(\d+(?:\.\d+)?)\s*%?/g)].map((m) => m[1]).filter(Boolean))),
);

/** المنتجات اللي فيها مادة معيّنة · مرتّبة بالنسبة تصاعدياً */
export function فيها(مادة) {
  const hits = [];
  for (const r of rows) {
    for (const a of r.actives) {
      if (a.name.includes(مادة)) hits.push({ منتج: r.name, نسبة: a.pct, slug: r.slug });
    }
  }
  return hits.sort((x, y) => parseFloat(x.نسبة) - parseFloat(y.نسبة));
}

/** عدد المنتجات المفردة الحيّة · المقام بأي عبارة «X من Y» */
export const عدد_المفردات = rows.length;

/* 🔴 الحارس · الملف صار **مكتبة كمان**. بلاه أي استيراد بيطبع الجرد
   كاملاً على المخرَج، وبوابة بتطبع ١٦ سطراً كل تشغيلة بتنتجاهل. */
const CLI = process.argv[1] && process.argv[1].endsWith('ingredient-map.mjs');
const want = process.argv[2];

/* 🔴 كل الطباعة جوّا دالة · وبتنادى **بس** لما ينشغّل من سطر الأوامر.
   بلاها الاستيراد بيطبع الجرد كاملاً، والأخطر: `process.exit(0)` اللي
   جوّا فرع «بلا وسيط» كان **بيقتل المستورِد** بصمت. */
function cli() {
  
  if (!want) {
    console.log('المنتجات المفردة الحيّة: ' + rows.length);
    console.log('');
    for (const r of rows) {
      console.log('  ' + r.name.slice(0, 30).padEnd(32) +
        r.actives.map((a) => a.pct + '% ' + a.name).join(' · ').slice(0, 92));
    }
    /* أكثر المكوّنات تكراراً · وهاد اللي بيصلح لمقال */
    const tally = {};
    for (const r of rows) for (const a of r.actives) (tally[a.name] = tally[a.name] || []).push({ n: r.name, p: a.pct });
    console.log('');
    console.log('المكوّنات المتكرّرة (منتجان فأكثر):');
    for (const [k, v] of Object.entries(tally).sort((a, b) => b[1].length - a[1].length)) {
      if (v.length < 2) continue;
      console.log('  ' + k.padEnd(22) + String(v.length + '/' + rows.length).padStart(6) +
        '   ' + [...new Set(v.map((x) => x.p))].sort((a, b) => a - b).join(' · ') + ' %');
    }
    process.exit(0);
  }
  
  const hits = [];
  for (const r of rows) for (const a of r.actives) if (a.name.includes(want)) hits.push({ name: r.name, pct: a.pct, slug: r.slug });
  hits.sort((a, b) => Number(a.pct) - Number(b.pct));
  console.log(want + ' · ' + hits.length + ' من ' + rows.length + ' منتجاً مفرداً');
  console.log('نِسَب مختلفة: ' + [...new Set(hits.map((h) => h.pct))].length);
  console.log('');
  for (const h of hits) console.log('  ' + (h.pct + '%').padStart(6) + '  ' + h.name);
  
}

if (CLI) cli();