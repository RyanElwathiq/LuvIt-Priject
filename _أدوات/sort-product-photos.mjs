/**
 * فرز صور المنتجات · مبني على فحص بصري لكل صورة + قياس تغطية الحبر
 *
 * 🔴 الخريطة تحت **مش مستنتجة من أسماء الملفات** — الترقيم الأصلي مش ثابت
 *    (العبوة رقم _1 بمنتجات و_4 بمنتجات تانية). كل سطر انتشاف بالعين
 *    وانثبت بمتوسط الإضاءة (العبوة أغمق لأن خلفيتها شفافة أوسع).
 */
import fs from 'node:fs';
import path from 'node:path';

const SRC  = 'D:/Ryan-Work/LUVIT/صور-المنتجات/كل الصور عشوائي بدهم ترتيب';
const DEST = 'D:/Ryan-Work/LUVIT/صور-المنتجات/مرتّبة';

/* المنتجات · woo = رقم المنتج بووكومرس لو موجود */
const MAP = [
  { code: 'L101', en: 'Vitamin C Serum',                   ar: 'سيروم فيتامين سي',      woo: 191,
    dir: 'L101 Vitamin C Serum', pre: 'Vitamin C Serum',
    slots: { 1: '_1', 2: '_2', 3: '_3', 4: '_4' } },

  { code: 'L102', en: 'Intensive Hydrating Serum',         ar: null,                    woo: null,
    dir: 'L102 Intensive Hydrating Serum', pre: 'Intensive Hydrating Serum',
    slots: { 1: '_4', 2: '_1', 3: '_2', 4: '_3' } },      // 🔴 العبوة رقم ٤

  { code: 'L103', en: 'Centella Blemish Cream',            ar: null,                    woo: null,
    dir: 'L103 Centella Blemish Cream', pre: 'Centella Blemish Cream',
    slots: { 1: '_1', 2: '_2', 3: '_3', 4: '_4' } },

  { code: 'L104', en: 'Pore Tightening & Brightening Serum', ar: null,                  woo: null,
    dir: 'L104 Pore Tightening & Brightening Serum', pre: 'Pore Tightening&Brightening Serum',
    slots: { 1: '_4', 2: '_1', 3: '_2', 4: '_3' } },      // 🔴 العبوة رقم ٤

  { code: 'L105', en: 'Clarifying & Pore Tightening Toner', ar: null,                   woo: null,
    dir: 'L105 Clarifying & Pore Tightening Toner', pre: 'Clarifying & Pore Tightening Toner',
    slots: { 1: '_1', 2: '_2', 3: '_3', 4: '_4' } },

  { code: 'L106', en: 'AHA+BHA Peeling Serum',             ar: null,                    woo: null,
    dir: 'L106 AHA+BHA Peeling Serum', pre: 'AHA+BHA Peeling Serum',
    slots: { 1: '_1', 2: '_2', 3: '_3', 4: '_4' } },

  { code: 'L110', en: 'Sebum Balancing Gel Cleanser',      ar: null,                    woo: null,
    dir: 'L110 Sebum Balancing Gel Cleanser', pre: 'Sebum Balancing Gel Cleanser',
    slots: { 1: '_1', 2: '_2', 3: '_3', 4: '_4' } },

  { code: 'L111', en: 'Hydrating Gel Cleanser',            ar: 'منظف هيدرا اللطيف',     woo: 201,
    dir: 'L111 Hydrating Gel Cleanser', pre: 'Hydrating Gel Cleanser',
    slots: { 1: '_1', 2: '_2', 3: '_3',
             4: 'Luv it_Hydra Cleanse_Gel Cleansing_200 ML_1_0003' } },  // اسم شاذ

  { code: 'L114', en: '8D Hyaluronic Acid Toner',          ar: 'تونر الترطيب العميق',   woo: 202,
    dir: 'L114 8D Hyaluronic Acid Toner', pre: '8D Hyaluronic Acid Toner',
    slots: { 1: '_1', 2: '_2', 3: '_3', 4: '_4' } },

  { code: 'L116', en: 'Moisturizing & Repairing Cream',    ar: null,                    woo: null,
    dir: 'L116 Moisturizing & Repairing Cream', pre: 'Moisturizing & Repairing Cream',
    slots: { 1: '_1', 2: '_2', 3: '_3', 4: '_4' },
    skip: ['Document.jpg'] },   // نسخة أقدم · خلفية بيضا وملصق بلا نِسَب

  { code: 'L119', en: 'Alpha Arbutin Complex Serum',       ar: null,                    woo: null,
    dir: 'L119 Alpha Arbutin Complex Serum', pre: 'Alpha Arbutin Complex Serum',
    slots: { 1: null, 2: '_1', 3: '_2', 4: '_3' },        // 🔴 ما في صورة عبوة
    missing: 'صورة العبوة مفقودة · الملف _4 فاضي تماماً (شفاف ١٠٠٪)' },
];

const NAMES = { 1: '1-bottle', 2: '2-box-front', 3: '3-box-back', 4: '4-box-side' };
const AR    = { 1: 'العبوة نفسها', 2: 'العلبة من الأمام', 3: 'العلبة من الخلف · المكوّنات والباركود',
                4: 'العلبة من الجنب' };

fs.rmSync(DEST, { recursive: true, force: true });
fs.mkdirSync(DEST, { recursive: true });

const report = [];
let copied = 0, gaps = 0;

for (const p of MAP) {
  const srcDir = path.join(SRC, p.dir);
  if (!fs.existsSync(srcDir)) { console.log('🔴 مجلد مصدر مفقود: ' + p.dir); continue; }

  const label = p.woo ? `${p.code} · woo-${p.woo} · ${p.ar}` : `${p.code} · ${p.en}`;
  const outDir = path.join(DEST, label);
  fs.mkdirSync(outDir, { recursive: true });

  const rows = [];
  for (const n of [1, 2, 3, 4]) {
    const suffix = p.slots[n];
    if (!suffix) { rows.push([n, null, 'مفقودة']); gaps++; continue; }

    /* السفكس اللي بيبلّش بـ_ بينلزق بالبادئة · واللي مش هيك اسم كامل لحاله */
    const want = suffix.startsWith('_') ? p.pre + suffix : suffix;
    const hit = fs.readdirSync(srcDir).find((f) => path.basename(f, path.extname(f)) === want);
    if (!hit) { rows.push([n, null, 'ما لقيت: ' + want]); gaps++; continue; }

    const ext = path.extname(hit);
    const out = path.join(outDir, NAMES[n] + ext);
    fs.copyFileSync(path.join(srcDir, hit), out);
    rows.push([n, hit, null]);
    copied++;
  }

  /* ملاحظة بكل مجلد */
  let note = `${label}\n${'='.repeat(50)}\n\n`;
  for (const [n, src, err] of rows) {
    note += err
      ? `  ${n}  [ ]  ${AR[n]}\n         🔴 ${err}\n`
      : `  ${n}  [x]  ${AR[n]}\n         الأصل: ${src}\n`;
  }
  if (p.skip) note += `\n  ملفات انستثنت: ${p.skip.join(' · ')}\n`;
  if (p.missing) note += `\n  🔴 ${p.missing}\n`;
  note += `\n${'-'.repeat(50)}\nالأصل ما انلمس · موجود بـ«كل الصور عشوائي بدهم ترتيب»\n`;
  fs.writeFileSync(path.join(outDir, '٠ — شو فيه هون.txt'), '\ufeff' + note, 'utf8');

  report.push({ label, rows, p });
  console.log(`✅ ${label.padEnd(46)} ${rows.filter(r => !r[2]).length}/4`);
}

console.log('');
console.log(`انتنسخت: ${copied} صورة · فجوات: ${gaps}`);
fs.writeFileSync(
  'C:/Users/rayan/AppData/Local/Temp/claude/D--Ryan-Work-LUVIT/b94fa03f-ae48-41af-9864-72ab45fa1efe/scratchpad/sort-report.json',
  JSON.stringify(report.map(r => ({ label: r.label, rows: r.rows })), null, 1), 'utf8');
