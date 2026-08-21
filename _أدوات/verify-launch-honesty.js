#!/usr/bin/env node
/**
 * ============================================================================
 * فحص الصدق قبل الإطلاق · verify-launch-honesty.js
 * ============================================================================
 *
 * ريّان، ٨ آب: «الكذب خط أحمر.»
 * وريّان، ١٨ آب: «ما راح نطلق الموقع أصلاً إلا والأسعار والصور وكل إشي جاهز.»
 *
 * الجملة الثانية هي اللي بتخلّي الأولى قابلة للتنفيذ: الأرقام الوهمية مسموحة
 * أثناء البناء **لأن** الإطلاق مقفول عليها. وهاد الملف هو القفل.
 *
 * بيفحص ملفات المكتبة عن كل شي انحط كعيّنة أو كمثال وما إله مصدر، وبيرجّع
 * كود خروج غير صفر لو لقى إشي. بينحط على بند الإطلاق ٩.١ كبوابة، مش كنصيحة.
 *
 *   node _أدوات/verify-launch-honesty.js
 *
 * 🔴 الفحص **بيثبت مش بيفترض**: بيطبع عدد الملفات اللي قرأها فعلاً، وصفر
 *    نتيجة مع صفر ملفات مقروءة = فحص أعمى، مش ملف نظيف.
 *    (القاعدة من `_أدوات/٠ — اقرأ هون.md` و`measurement-tools-lie` بالذاكرة.)
 * ============================================================================
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SCAN = [
  'library/sections',
  'library/home-preview.html',
  'library/products-preview.html',
];

/* كل قاعدة: اسمها، النمط، وليش هي كذب.
   النمط بينطبق على النص المنشور بس — التعليقات بتنشال قبل الفحص، لأن
   التحذير المكتوب بتعليق هو **الحل** مش المشكلة. */
const RULES = [
  {
    id: 'fake-review',
    why: 'رأي زبونة ما موجودة · وهاد أخطر من سعر وهمي لأنه بيوهم زبونة حقيقية',
    re: /data-luvit-sample-review|luvit-sample-review/g,
  },
  {
    id: 'bestseller-badge',
    why: 'بادج «الأكثر مبيعًا» على متجر ما باع بعد',
    re: /الأكثر\s*مبيع/g,
  },
  {
    id: 'star-row',
    why: 'صف نجوم بلا تقييمات حقيقية',
    re: /★{3,}|⭐{3,}/g,
  },
  {
    id: 'countdown',
    why: 'عدّاد تنازلي أو ندرة مصطنعة · وتحت الدفع عند الاستلام بتدفع أجرة المندوب مرتين',
    re: /لفترة\s*محدودة|ينتهي\s*خلال|باقي\s*\d+\s*قطع|كمية\s*محدودة/g,
  },
  {
    id: 'unsourced-percent',
    why: 'نسبة مئوية بلا مصدر · النسب الوحيدة المسموحة هي نِسَب المكوّنات من العبوة',
    re: /خصم\s*\d+\s*%|\d+\s*%\s*خصم|وفّري\s*\d+\s*%/g,
  },
  {
    id: 'speed-claim',
    why: 'وعد بسرعة توصيل ما حدا أكّدها',
    re: /توصيل\s*سريع|خلال\s*ساعات|بنفس\s*اليوم/g,
  },
  {
    id: 'inspect-before-pay',
    why: '🔴 وعد بفحص الطلب قبل الدفع · غير مؤكد من شركة التوصيل',
    re: /بتفحصي\s*الطلب\s*وبعدها\s*بتدفعي|افحصي\s*قبل\s*ما\s*تدفعي/g,
  },
  {
    id: 'placeholder-price',
    why: 'سعر مثال · لازم ييجي من ووكومرس أو من صاحب الموقع',
    re: /luvit-card__price/g,
    note: 'هاد تنبيه مش منع: الأسعار بالمعاينة مقصودة، بس لازم تنشال من أي شي بينشر',
    warnOnly: true,
  },
  {
    id: 'dead-link',
    why: 'رابط ميت · بينزل الزبونة على أول الصفحة بدل ما يوديها',
    re: /href\s*=\s*"#"/g,
  },
  {
    id: 'em-dash',
    why: 'الشرطة الطويلة ممنوعة بأي نص بينشر · قاعدة ريّان',
    re: /—/g,
  },
];

function walk(p, out) {
  const abs = path.join(ROOT, p);
  if (!fs.existsSync(abs)) return out;
  const st = fs.statSync(abs);
  if (st.isFile()) { if (/\.html?$/i.test(abs)) out.push(abs); return out; }
  for (const name of fs.readdirSync(abs)) walk(path.join(p, name), out);
  return out;
}

/* بيرجّع النص **المنشور** بس. بينشال منه:
     · تعليقات HTML — التحذير المكتوب بتعليق هو الحل مش المشكلة
     · كتل <script> و<style> — تعليقات الكود جوّاها مش نص بتقراه الزبونة
   🔴 أول تشغيل للأداة رجّع ١١٦ مخالفة، أغلبها شرطات طويلة بتعليقات جافاسكربت
      داخل `home-preview.html`. أداة بتصرخ بالغلط بتنتجاهل، وأداة بتنتجاهل
      مش بوابة. فالحدّ لازم يكون دقيقاً قد ما هو صارم.

   🔴 والمحذوف بينستبدل بمسافات، مش بينشال. حذفه بيقصّر الملف وبيخلي كل رقم
      سطر بعده غلط. أول محاولة رجّعت «11-faq.html:32» والسطر الحقيقي 49.
      أداة بتعطي رقم سطر غلط بتضيّع وقت أكثر ما بتوفّر — نفس درس
      measurement-tools-lie: رقم غلط أسوأ من ولا رقم. */
function blankOut(match) {
  return match.replace(/[^\n]/g, ' ');
}
function publishedText(html) {
  return html
    .replace(/<!--[\s\S]*?-->/g, blankOut)
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, blankOut)
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, blankOut);
}

const files = SCAN.reduce((acc, p) => walk(p, acc), []);

if (files.length === 0) {
  console.error('🔴 ما قرأ ولا ملف · المسارات بـSCAN غلط، والفحص أعمى مش نظيف.');
  process.exit(2);
}

let blocking = 0, warnings = 0;
const report = [];

for (const abs of files) {
  const rel = path.relative(ROOT, abs).replace(/\\/g, '/');
  const raw = fs.readFileSync(abs, 'utf8');
  const body = publishedText(raw);
  const lines = body.split('\n');

  for (const rule of RULES) {
    lines.forEach((line, i) => {
      rule.re.lastIndex = 0;
      if (!rule.re.test(line)) return;
      const hit = { file: rel, line: i + 1, id: rule.id, why: rule.why, warnOnly: !!rule.warnOnly, text: line.trim().slice(0, 90) };
      report.push(hit);
      if (rule.warnOnly) warnings++; else blocking++;
    });
  }
}

console.log('قرأ ' + files.length + ' ملف');
console.log('');

if (!report.length) {
  console.log('✅ ما في ولا مخالفة · الصفحات جاهزة من ناحية الصدق');
  process.exit(0);
}

const byRule = {};
for (const h of report) (byRule[h.id] = byRule[h.id] || []).push(h);

for (const id of Object.keys(byRule)) {
  const hits = byRule[id];
  const head = hits[0].warnOnly ? '🟡' : '🔴';
  console.log(head + ' ' + id + ' · ' + hits[0].why);
  for (const h of hits) console.log('    ' + h.file + ':' + h.line + '  ' + h.text);
  console.log('');
}

console.log('مانع: ' + blocking + ' · تنبيه: ' + warnings);

if (blocking) {
  console.log('');
  console.log('🔴 الإطلاق مقفول · بند ٩.١ بخطة الإطلاق');
  process.exit(1);
}
process.exit(0);
