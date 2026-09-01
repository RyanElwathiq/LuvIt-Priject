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
const byWooId = {};
for (const rec of cat.منتجات) {
  if (!rec.woo) continue;
  byWooId[rec.woo] = (rec.actives || []).map((a) => ({ pct: String(a.pct).replace('%', ''), name: a.name }));
}

/* المفردات فقط · البكجات مجموعة قطع لا منتج بتركيبة */
const singles = woo.منتجات.filter((p) => !/^روتين /.test(p.name));

const strip = (s) => String(s || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

/** كل نسبة مع اسم مادّتها من الوصف المختصر · «10% فيتامين سي» */
function actives(text) {
  const out = [];
  const re = /([\d.]+)\s*%\s*([^·،\n]+?)(?=\s*·|\s*،|\s*$|\s+\d+\s*%)/g;
  let m;
  while ((m = re.exec(text))) {
    const name = m[2].replace(/\s+\d+ml.*$/, '').trim();
    if (name) out.push({ pct: m[1], name });
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
    if (map.has(k) && map.get(k) !== a.pct) {
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

const want = process.argv[2];

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
