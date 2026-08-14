/**
 * بيقص home-preview.html لملف منفصل لكل سكشن، جاهز للصق بـHTML widget.
 * ليش: الملف ٧٥ كيلوبايت وفيه الـ١٣ سكشن مع بعض + CSS وJS الهيرو. ريّان
 * بينسخ يدوي، وسؤال «أي جزء أنسخ؟» هو اللي أوقفنا قبل.
 *
 * القص من تعليق «N. NAME» لتعليق السكشن اللي بعده. الموجة اللي بين سكشنين
 * بتنضم للسكشن اللي فوقها، لأنها بصرياً بتختم السكشن مش بتفتح اللي بعده.
 */
const fs = require('fs');
const path = require('path');

const ROOT = 'D:/Ryan-Work/LUVIT/luvit/';
const SRC = ROOT + 'library/home-preview.html';
const OUT = ROOT + 'library/sections/';
const src = fs.readFileSync(SRC, 'utf8');

// بيانات كل سكشن: الرقم، الاسم بالعربي، الـid المطلوب بالإلمنتور، data-nav-bg، تحذيرات
const META = {
  1:  { slug: 'hero',         ar: 'الهيرو + ٥ فصول',   id: 'hero-seq',    bg: 'dark',
        warn: ['هذا السكشن مركّب على الموقع أصلاً. الصق من hero-sequence/scroll-sequence.html مش من هون.'] },
  2:  { slug: 'trust',        ar: 'شريط الثقة',        id: '',            bg: 'light',
        warn: ['«خلال ٢٤ لـ٤٨ ساعة» رقم مثال · أكّده قبل النشر'] },
  3:  { slug: 'routine',      ar: 'الروتينات',         id: 'routine',     bg: 'light',
        warn: ['🔴 لا تستعمل هذا الملف · استعمل 03-routine.html اللي فيه ٤ بطاقات'] },
  4:  { slug: 'quiz',         ar: 'تشويق الكويز',      id: 'quiz',        bg: 'dark',
        warn: ['زر «كمّلي الاختبار» href="#" · بده صفحة الكويز'] },
  5:  { slug: 'products',     ar: 'المنتجات',          id: 'products',    bg: 'light',
        warn: ['🔴 الأسعار الأربعة أمثلة · والصور placeholder',
               'روابط المنتجات href="#" · بدها روابط ووكومرس'] },
  6:  { slug: 'ingredients',  ar: 'المكوّنات',          id: 'ingredients', bg: 'dark',
        warn: ['✅ النِسَب مطابقة لعبوة LUV IT الظاهرة بفريم الهيرو الأخير:',
               '   10% Vitamin C · 2% Niasihamide · 2% Hyaluronic acid · 2% Panthenol',
               '⚠ الرقم الأول مموّه شوي بالفريم (10 أو 30) · أكّده من العبوة بيدك',
               '⚠ وهاي نِسَب سيروم فيتامين سي · إذا السكشن بيمثّل منتج تاني، طابقها من جديد'] },
  7:  { slug: 'compare',      ar: 'قبل وبعد',          id: '',            bg: 'light',
        warn: ['🔴 الصورتان placeholder والكوبي بيقول «صور حقيقية بلا فلاتر»',
               '🔴 «بعد ٤ أسابيع» رقم مثال'] },
  8:  { slug: 'why',          ar: 'ليش LUVIT',         id: 'why',         bg: 'dark',
        warn: ['روابط البطاقات href="#"'] },
  9:  { slug: 'how',          ar: 'كيف تطلبي',         id: 'how',         bg: 'light',
        warn: [] },
  10: { slug: 'testimonials', ar: 'آراء الزبونات',     id: '',            bg: 'light',
        warn: ['🔴 الآراء الثلاثة والأسماء والمدن كلها أمثلة',
               'نقطة واحدة لكل بطاقة، وإلا النقاط بتختل'] },
  11: { slug: 'faq',          ar: 'الأسئلة الشائعة',   id: 'faq',         bg: 'light',
        warn: ['🔴 مدة التوصيل ومدة ظهور النتيجة أرقام مثال'] },
  12: { slug: 'cta',          ar: 'CTA الختامي',       id: '',            bg: 'dark',
        warn: ['زر «اكتشفي روتينك» بيوصل لـ#routine · تأكد إن كونتينر الروتينات إله CSS ID = routine'] },
  13: { slug: 'footer',       ar: 'الفوتر',            id: '',            bg: 'dark',
        warn: ['بيتركّب بـTheme Builder ← Footer مش بالصفحة',
               'روابط السوشال وصفحات المساعدة href="#"'] },
};

// نلاقي مواقع تعليقات العناوين
const markers = [];
// الشكل الفعلي بالملف: ثلاث تعليقات متتالية، مش تعليق واحد متعدد الأسطر
//   <!-- ============ -->
//   <!-- 2. TRUST BAR -->
//   <!-- ============ -->
const re = /<!--\s*=+\s*-->\s*<!--\s*(\d{1,2})\.\s*(.*?)\s*-->\s*<!--\s*=+\s*-->/g;
let m;
while ((m = re.exec(src)) !== null) {
  markers.push({ n: Number(m[1]), title: m[2].trim(), start: m.index, afterHeader: re.lastIndex });
}
markers.sort((a, b) => a.start - b.start);

console.log('=== علامات السكاشن اللي انلقت: ' + markers.length + ' ===');
markers.forEach((x) => console.log(`  ${String(x.n).padStart(2)} · ${x.title}`));

if (markers.length !== 13) {
  console.log('\n🔴 توقّعنا ١٣ ولقينا ' + markers.length + ' · ما رح نكتب ولا ملف.');
  process.exit(1);
}

fs.mkdirSync(OUT, { recursive: true });
const written = [];

// ١ الهيرو مركّب أصلاً ومصدره scroll-sequence.html · ٣ الروتينات عندها ملف أصلي
// فيه ٤ بطاقات بينما المعاينة فيها ٣. توليد نسخة تانية لأي منهم بيوقع ريّان.
// ⚠ ولا تشيل ١ من هون: من ٩ آب صار home-preview.html بياخد الهيرو بالمزامنة
//   من scroll-sequence.html، فالكتلة صارت ١١٩٥ سطر وتوليدها هون بلا فايدة.
const SKIP = new Set([1, 3]);

for (let i = 0; i < markers.length; i++) {
  const cur = markers[i];
  const next = markers[i + 1];
  const meta = META[cur.n];
  if (SKIP.has(cur.n)) { console.log(`  (تخطّينا ${cur.n} · ${meta.ar})`); continue; }
  // من بعد التعليق لحد بداية تعليق السكشن اللي بعده (أو نهاية الـbody)
  let end = next ? next.start : src.indexOf('</body>');
  let body = src.slice(cur.afterHeader, end).replace(/^\s*\n/, '').trimEnd();

  // السكشن ١٣ بينتهي عند الفوتر · نشيل أي سكربت معاينة بعده
  if (cur.n === 13) body = body.replace(/<script[\s\S]*$/i, '').trimEnd();

  // 🔴 الصفحة المرجعية بتلفّ السكاشن بـ<main>، فالقص بياخد معه </main> يتيمة.
  // لو انلصقت بالإلمنتور بتسكّر عنصر مش تبعها وتكسر تخطيط الصفحة كلها.
  // (انكشفت بفحص توازن الوسوم على 12-cta.html · ما كانت تبين بالعين.)
  body = body.replace(/^\s*<\/?main\b[^>]*>\s*$/gim, '').trimEnd();

  const idLine = meta.id
    ? `  CSS ID  : ${meta.id}       ← Advanced ← CSS ID`
    : `  CSS ID  : ما بده`;

  const warnBlock = meta.warn.length
    ? '\n' + meta.warn.map((w) => '  ⚠ ' + w).join('\n')
    : '';

  const header = `<!--
  ============================================================================
  LUVIT · سكشن ${cur.n} من ١٣ · ${meta.ar}
  ============================================================================
  مولّد من library/home-preview.html · لا تعدّل هون، عدّل بالمعاينة وأعد التوليد.

  كيف بينركّب:
  1. Elementor ← اسحب ويدجت HTML جوّا كونتينر لحاله
  2. الصق كل اللي تحت
  3. اختار الكونتينر (مش الويدجت) ← Advanced ← Attributes، واكتب:
       data-nav-bg|${meta.bg}
     ⚠ الفاصل خط عامودي | مش يساوي =
${idLine}
  4. Update، وبعدها LiteSpeed ← Purge All، وافحص بنافذة تصفّح خفي
${warnBlock}
  ============================================================================
-->

${body}
`;

  const file = String(cur.n).padStart(2, '0') + '-' + meta.slug + '.html';
  fs.writeFileSync(OUT + file, header, 'utf8');
  written.push({ file, n: cur.n, ar: meta.ar, bytes: Buffer.byteLength(header, 'utf8') });
}

console.log('\n=== الملفات اللي انكتبت ===');
written.forEach((w) => console.log(`  ${w.file.padEnd(22)} ${String(w.bytes).padStart(7)} بايت · ${w.ar}`));
console.log('\nالمجلد: ' + OUT);
