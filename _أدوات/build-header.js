#!/usr/bin/env node
/**
 * ============================================================================
 * بناء ماركب هيدر الموقع · build-header.js
 * ============================================================================
 * بيقرا نسخة الهيدر الأصلية وبيطلّع النسخة الجاهزة للنشر بويدجت HTML
 * جوّا قالب Elementor رقم **79** (`LUVIT — Water Pill Header`).
 *
 * 🔴 كان **خطوتين بملفين**، والمراجعة مسكتها: إعادة تشغيل الأول لحاله كانت
 *    بترجّع نسخة **مرفوضة** (روابط ميتة مخفية بالـCSS بدل ما تكون معلّقة)،
 *    وهاي مش اللي على الموقع. سكربت بناء بيطلّع غير المنشور هو فخ، لأن
 *    الجلسة الجاية بتشغّله وبتصدّق ناتجه.
 *
 * ⚠️ وأول محاولة دمج انخاطت آلياً من الملفين، فطلع فيها `require` مكرر
 *    والسكربت فشل. **والمقارنة بعدها قالت «مطابق»** لأن السكربت ما كتب شي
 *    فالملف قارن حاله بحاله. فحص بيقارن مخرجاً ما انكتب هو فحص أعمى.
 *
 *   node _أدوات/build-header.js
 *
 * المدخل  : <scratch>/header79.html        (اللي انسحب من الموقع)
 * المخرج  : <scratch>/header79.new.html    (اللي بينلصق) و library/header-79.html
 * ============================================================================
 */

const fs = require('fs');
const path = require('path');

const SP = 'C:/Users/rayan/AppData/Local/Temp/claude/D--Ryan-Work-LUVIT/' +
           'b94fa03f-ae48-41af-9864-72ab45fa1efe/scratchpad/';
const REPO = path.resolve(__dirname, '..');

const IN  = SP + 'header79.html';
const OUT = SP + 'header79.new.html';
const COPY = path.join(REPO, 'library', 'header-79.html');

if (!fs.existsSync(IN)) {
  console.error('🔴 ما لقيت المدخل: ' + IN);
  console.error('   اسحبه من الموقع أول · REST على elementor_library/79 ثم');
  console.error('   POST على السيرفر المحلي باسم header79.html');
  process.exit(2);
}

const raw = fs.readFileSync(IN, 'utf8');

/* 🔴 إلمنتور بيخزّن الماركب بـCRLF. أي مرساة مكتوبة بـ\n بتفشل بصمت لو ما
   وحّدنا. بنوحّد داخلياً وبنرجّع CRLF بالآخر عشان الفرق اللي بينحفظ يكون
   بالمحتوى وبس، مش بنهايات الأسطر كمان. */
const CRLF = /\r\n/.test(raw);
let h = raw.replace(/\r\n/g, '\n');
const before = h;
const log = [];

function sub(a, b, label) {
  if (!h.includes(a)) throw new Error('مرساة مفقودة: ' + label);
  const n = h.split(a).length - 1;
  h = h.split(a).join(b);
  log.push('✅ ' + label + ' ×' + n);
}

/* ── ١ · العروض (404) ← المنتجات (200) ─────────────────────────────── */
sub('<a class="luvit-nav__link" href="/offers">العروض</a>',
    '<a class="luvit-nav__link" href="/products">المنتجات</a>',
    'شريط · العروض←المنتجات');
sub('<a class="luvit-drawer__link" href="/offers">العروض</a>',
    '<a class="luvit-drawer__link" href="/products">المنتجات</a>',
    'درج · العروض←المنتجات');

/* ── ٢ · شيل aria-current الثابتة ──────────────────────────────────────
   القواعد بـtokens.css بتستعمل [aria-current] **بلا قيمة**، يعني حتى
   aria-current="false" بتطابق وبتلوّن الرابط. فالتصليح لازم يكون شيلاً
   كاملاً للسمة · و motion.js §14 بيحطها على الصفحة الصح. */
sub(' href="/" aria-current="page"', ' href="/"', 'شيل aria-current الثابتة');

/* ── ٣ · الدوك · الروتين ← المنتجات ───────────────────────────────────
   الدوك ٤ خانات؛ إخفاء الروتين بيخليها ٣ وبيكسر التوزيع. وريّان ٢١ آب:
   «الـhome page هي صفحة الshow off... وما حتكون الصفحة اللي منجر العملاء
   عليها» — فالمنتجات وجهة الإعلانات وأحق بخانة الدوك من الروتين. */
const dockOld = [
'  <a class="luvit-dock__item" href="/routines">',
'    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"',
'         stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">',
'      <path d="M12 3s6 6.5 6 10.5A6 6 0 0 1 6 13.5C6 9.5 12 3 12 3z"/>',
'    </svg>',
'    <span>الروتين</span>',
'  </a>'].join('\n');
const dockNew = [
'  <a class="luvit-dock__item" href="/products">',
'    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"',
'         stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">',
'      <rect x="3" y="3" width="7.5" height="7.5" rx="2"/>',
'      <rect x="13.5" y="3" width="7.5" height="7.5" rx="2"/>',
'      <rect x="3" y="13.5" width="7.5" height="7.5" rx="2"/>',
'      <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="2"/>',
'    </svg>',
'    <span>المنتجات</span>',
'  </a>'].join('\n');
sub(dockOld, dockNew, 'دوك · الروتين←المنتجات');

/* ── ٤ · الروابط اللي صفحاتها ما انبنت ────────────────────────────────
   🔴 بتنعلّق، ما بتنخفى بالـCSS. `display:none` بيخفي الرابط عن **الناس**:
   بيضل بالـDOM، وبالـHTML اللي بتقراه الزواحف، وبيضل وعداً بصفحة بترجّع
   404 — تسعة منهم على كل صفحة بالموقع.

   والتعليق بيضل الماركب مقروءاً كقائمة مهام، وهاد كان السبب الوحيد إني ما
   أحذفهم أصلاً. وبناء أي صفحة بيضل تعديل سطر: احذف علامتي التعليق. */
/* 🔴 هاي القائمة **بتنقص** كل ما تنبني صفحة · مش قائمة ثابتة.
   /track انشالت منها ٢٢ آب لما انعملت صفحة 210 وانفحصت 200. */
const DEAD = ['/about', '/contact'];

/* عدّ كم رابط بالماركب بيشير على مسار ميت · قبل ما نلمس إشي.
   هاد هو العدد اللي لازم ينعلّق، وأي فرق معناه إن سطراً ما انطابق. */
const expected = DEAD.reduce(
  (n, href) => n + (h.match(new RegExp('href="' + href + '"', 'g')) || []).length, 0);

const lines = h.split('\n');
const out = [];
let wrapped = 0;
const seen = {};
for (const line of lines) {
  const m = line.match(/^(\s*)<a class="[^"]*" href="(\/[a-z-]+)"[^>]*>.*<\/a>\s*$/);
  if (!m || !DEAD.includes(m[2])) { out.push(line); continue; }
  const indent = m[1], href = m[2];
  seen[href] = (seen[href] || 0) + 1;
  out.push(indent + '<!-- ' + href + ' لسا ما انبنت · شيل التعليق لما تنبني');
  out.push(indent + '     ' + line.trim());
  out.push(indent + '-->');
  wrapped++;
}
h = out.join('\n');
/* 🔴 العدد **بينحسب من الماركب**، ما بينكتب بالإيد.

   كان مكتوباً رقماً ثابتاً بمكانين (الشرط والرسالة)، وكل مرة تنبني صفحة
   لازم يتغيّروا الاثنين. أول مرة انفتح رابطا الشحن والأسئلة، الشرط انغيّر
   والرسالة لأ · فطلعت «توقّعت ٥ ولقيت ٣» وهي كذبة بالحالتين.

   والعدد المتوقّع مش عدد المسارات: `/about` موجود بالشريط **وبالدرج**،
   فمسار واحد بيعطي تعليقين. فبنعدّ من الملف نفسه قبل التعديل. */
if (wrapped !== expected) {
  throw new Error('توقّعت ' + expected + ' رابط ميت بالماركب ولقيت ' + wrapped +
    ' · المسارات: ' + DEAD.join(' '));
}
log.push('✅ روابط معلّقة ×' + wrapped + ' على ' + Object.keys(seen).length + ' مسار');

/* ── فحوصات · كلها لازم تمر قبل الكتابة ──────────────────────────────── */

/* توازن الوسوم · وسّعناه بعد ملاحظة المراجعة إنه كان بيفحص <a> وبس */
const TAGS = ['a', 'div', 'nav', 'header', 'span', 'button', 'svg'];
const unbalanced = [];
for (const t of TAGS) {
  const o = (h.match(new RegExp('<' + t + '(?=[\\s>])', 'g')) || []).length;
  const c = (h.match(new RegExp('</' + t + '>', 'g')) || []).length;
  if (o !== c) unbalanced.push(t + ': ' + o + '/' + c);
}
if (unbalanced.length) throw new Error('وسوم مش متوازنة → ' + unbalanced.join(' | '));
log.push('✅ الوسوم متوازنة · ' + TAGS.join(' '));

/* وسم إغلاق يتيم · </div>> ضلّت نصاً على الموقع أشهر */
const orphan = h.match(/<\/[a-z]+>\s*>/g);
if (orphan) throw new Error('وسم إغلاق يتيم: ' + orphan.join(' '));

/* كل رابط باقٍ بالـDOM لازم يكون على صفحة حية · مقيس ٢١ آب بكود الحالة */
const LIVE = ['/', '/shop', '/products', '/cart', '/checkout', '/my-account', '/track',
              '/routines', '/quiz', '/shipping', '/faq'];
const domHrefs = [];
h.replace(/<!--[\s\S]*?-->/g, '').replace(/href="(\/[^"]*)"/g, (m, u) => { domHrefs.push(u); return m; });
const dead = [...new Set(domHrefs)].filter(u => !LIVE.includes(u));
if (dead.length) throw new Error('روابط ميتة لساها بالـDOM: ' + dead.join(' · '));
log.push('✅ كل رابط بالـDOM حي · ' + [...new Set(domHrefs)].sort().join(' '));

if (/aria-current/.test(h)) throw new Error('لسا فيه aria-current ثابتة بالماركب');
if (/luvit-unbuilt/.test(h)) throw new Error('لسا فيه كلاس luvit-unbuilt · المفروض تعليق مش إخفاء');

/* 🔴 كان هون فحص طول («أقل من 4600 = مقطوع») وكان **مقياساً غلط**.
   كل ما تنبني صفحة، بينشال رابط من قائمة الميتة، وبينشال معه سطرا التعليق
   اللي حواليه · فالملف **بيقصر كل ما الموقع بيكبر**. العتبة انكسرت أول مرة
   انفتح فيها رابطا الروتينات والكويز، وهي كانت بتقاتل الاتجاه الصح.

   الطول مش دليل على السلامة أصلاً. الدليل إن القطع اللي لازم تكون موجودة
   موجودة، وهاد بينفحص بالاسم. */
const MUST = [
  ['<header class="luvit-nav"', 'الهيدر'],
  ['luvit-drawer', 'الدرج'],
  ['luvit-dock', 'الدوك'],
  ['id="luvit-cart-count"', 'عدّاد السلة'],
  ['luvit-skip', 'رابط تخطّي المحتوى'],
  ['href="/products"', 'رابط المنتجات'],
  ['href="/shop"', 'رابط المتجر'],
];
const missing = MUST.filter(([needle]) => !h.includes(needle)).map(([, name]) => name);
if (missing.length) throw new Error('ناقص من المخرج: ' + missing.join(' · '));
log.push('✅ كل قطعة أساسية موجودة · ' + MUST.length + ' فحص');

/* ── الكتابة ─────────────────────────────────────────────────────────── */
const final = CRLF ? h.replace(/\n/g, '\r\n') : h;
fs.writeFileSync(OUT, final, 'utf8');
fs.writeFileSync(COPY, final, 'utf8');

console.log(log.join('\n'));
console.log('---');
console.log('الطول (LF): ' + before.length + ' → ' + h.length);
console.log('المخرج    : ' + OUT);
console.log('ونسخة     : ' + COPY);
