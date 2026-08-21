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

  /* ══════════════════════════════════════════════════════════════════════
     🔴 الأربع قواعد تحت انضافوا ٢٢ آب بعد تدقيق يدوي لقى خمس ادعاءات حية
        على الرئيسية، وهاي الأداة كانت ماسكة **وحدة** منها بس.

        اللي فاتها بالضبط:
          «عادة ٢٤ لـ٤٨ ساعة عمل داخل عمّان، ولحد ٣ أيام لباقي المحافظات»
          «أغلب البشرات بتبين عليها فرق خلال ٢ لـ٤ أسابيع»
          «استشارة مجانية»
          «عنا خط مخصص للبشرة الحسّاسة»

        وقاعدة `speed-claim` فوق كانت بتدوّر عن **صفات** («توصيل سريع»)
        بينما الادعاء الحقيقي كان **رقماً**. الصفة أسهل بالكتابة والرقم
        أسهل بالتصديق · فالرقم هو الأخطر وهو اللي كان مفلّت.

        ⚠️ ودرس أعمّ: أي قاعدة بتلاحق صياغة بعينها بتمسك الصياغة اللي
        كتبتها إنت. الصياغة اللي بيكتبها حدا تاني بتعدّي. القواعد تحت
        بتلاحق **الشكل** (رقم + وحدة زمن) مش الجملة.
     ══════════════════════════════════════════════════════════════════════ */
  {
    id: 'delivery-duration',
    why: '🔴 مدة توصيل برقم · شركة التوصيل ما ردّت لحد الآن، فولا رقم مؤكد',
    /* أرقام عربية أو لاتينية + وحدة زمن. `دقيقة` مستثناة عن قصد: «أقل من
       دقيقة» بالكويز تقدير عن تعبئة فورم مش وعد تشغيلي. */
    re: /[\d٠-٩]+\s*(?:لـ|إلى|-|–)?\s*[\d٠-٩]*\s*(?:ساعة|ساعات|يوم|أيام|أسبوع|أسابيع|شهر|شهور)/g,
  },
  {
    id: 'result-timing',
    why: '🔴 وعد بظهور نتيجة على البشرة · ادعاء طبي، وممنوع مطلقاً بلا مصدر',
    re: /بتبين\s*(?:عليها|عليكِ|علي?ك)?\s*فرق|بتلاحظي\s*(?:فرق|نتيجة|تحسّن)|النتيجة\s*بتبين|بتحسي\s*بفرق|خلال\s*[\d٠-٩]+\s*(?:أسبوع|أسابيع|شهر)/g,
  },
  {
    id: 'phantom-service',
    why: '🔴 خدمة مذكورة وما إلها وجود · الدومين بلا MX وولا رقم تلفون مثبت',
    re: /استشارة\s*مجانية|دعم\s*(?:على\s*مدار|٢٤|24)|خدمة\s*عملاء\s*[\d٠-٩]|رد\s*خلال/g,
  },
  {
    id: 'phantom-product-line',
    why: '🔴 خط أو تشكيلة منتجات ما بتوجد · المتجر فيه ستة منتجات وبس',
    re: /خط\s*مخصص|تشكيلة\s*(?:خاصة|مخصصة)|مجموعة\s*مخصصة\s*لل/g,
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

/* ══════════════════════════════════════════════════════════════════════════
   فحص المحتوى المركّب · اللي مش بملف
   ──────────────────────────────────────────────────────────────────────────
   الفحص فوق بيقرا الملفات. بس أخطر محتوى وهمي بالمشروع **مش بملف** — هو
   بقاعدة بيانات ووردبريس: ١٥ تقييم عيّنة انركّبوا ٢١ آب بطلب ريّان («حط
   أمور عشوائية عشان يبين الشكل مش أكثر»).

   🔴 والرأي الوهمي أخطر من السعر الوهمي: السعر بينكشف عند الدفع، أما الرأي
      فبيقنع زبونة حقيقية تشتري بناءً على كلام ما قاله ولا إنسان.

   وما بينفحص بطلب شبكة، لأن الموقع خلف قفل Coming Soon وبيرجّع الصفحة
   المؤقتة لأي زيارة غير مسجّلة. **متفحوص ٢١ آب:** `/` و`/products/` رجّعوا
   نفس الـ78049 بايت، وولا اسم منتج ولا سعر ولا اسم مقيّمة فيهم.
   ⚠️ وأول محاولة فحص قالت «الموقع مكشوف» غلطاً، لأن النمط طابق `luvit-rail`
      جوّا الـCSS اللي WPCode بيحقنه بكل صفحة **بما فيها صفحة قريباً**.
      نمط الفحص لازم يكون نصاً بيظهر بالمحتوى وبس.

   فالمرجع هون **ملف البيان**: طول ما `library/sample-reviews.json` موجود،
   التقييمات مركّبة على الموقع.

   ## الحذف · بتنلصق بكونسول لوحة ووردبريس وإنت داخل
   ```js
   const n = wpApiSettings.nonce;
   const r = await (await fetch("/wp-json/wc/v3/products/reviews?per_page=100",
       {credentials:"include",headers:{"X-WP-Nonce":n}})).json();
   const s = r.filter(x => /@luvit[.]invalid$/.test(x.reviewer_email || ""));
   for (const x of s) await fetch("/wp-json/wc/v3/products/reviews/" + x.id +
       "?force=true", {method:"DELETE",credentials:"include",
                       headers:{"X-WP-Nonce":n}});
   "انحذف " + s.length;
   ```
   وبعدها احذف `library/sample-reviews.json` عشان البوابة تفتح.
   ══════════════════════════════════════════════════════════════════════════ */
const MANIFESTS = [
  {
    file: "library/sample-reviews.json",
    why: "🔴 تقييمات عيّنة مركّبة على الموقع · ولا وحدة منها قالها إنسان",
    count: function (raw) { try { return JSON.parse(raw).length } catch (e) { return "?" } },
  },
];

const manifestHits = [];
for (const m of MANIFESTS) {
  const abs = path.join(ROOT, m.file);
  if (!fs.existsSync(abs)) continue;
  manifestHits.push({ why: m.why, n: m.count(fs.readFileSync(abs, "utf8")), file: m.file });
}

const files = SCAN.reduce((acc, p) => walk(p, acc), []);

if (files.length === 0) {
  console.error('🔴 ما قرأ ولا ملف · المسارات بـSCAN غلط، والفحص أعمى مش نظيف.');
  process.exit(2);
}

let blocking = 0, warnings = 0;
const report = [];

for (const h of manifestHits) {
  console.log(h.why);
  console.log("    " + h.file + "  ·  " + h.n + " تقييم مركّب على plasmajo.com");
  console.log("    الحذف: اقرأ رأس هذا الملف · كتلة «الحذف»");
  console.log("");
  blocking++;
}

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

if (!report.length && !manifestHits.length) {
  console.log('✅ ما في ولا مخالفة · الصفحات جاهزة من ناحية الصدق');
  process.exit(0);
}
if (!report.length) {
  console.log('مانع: ' + blocking + ' · كله محتوى مركّب على الموقع مش بالملفات');
  console.log('');
  console.log('🔴 الإطلاق مقفول · بند ٩.١ بخطة الإطلاق');
  process.exit(1);
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
