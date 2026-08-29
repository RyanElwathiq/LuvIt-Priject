#!/usr/bin/env node
/**
 * ============================================================================
 * فحص منطق الكويز · test-quiz.js
 * ============================================================================
 * بيستخرج `decide()` الحقيقية من `motion.js` §15 وبيشغّلها على كل الحالات
 * اللي بتهم · بلا متصفح وبلا DOM.
 *
 * 🔴 وليش الفحص بيستخرج الدالة بدل ما ينسخها: نسخة مكتوبة بالفحص بتفحص
 *    نفسها. الدالة لازم تيجي من الملف اللي بينشحن فعلاً.
 *
 *   node _أدوات/test-quiz.js
 * ============================================================================
 */

const fs = require('fs');

const src = fs.readFileSync('D:/Ryan-Work/LUVIT/luvit/library/motion.js', 'utf8');
const from = src.indexOf('  function decide(t) {');
const to = src.indexOf('  function finish() {', from);
if (from < 0 || to < 0) {
  console.error('🔴 ما لقيت decide() بـmotion.js · تغيّر اسمها أو شكلها؟');
  process.exit(2);
}
const decide = new Function('return ' + src.slice(from, to).trim().replace(/^function /, 'function '))();

/* 🔴 و`route()` بتنستخرج كمان · هي اللي بتقرّر لوين بتروح الزبونة فعلاً.
   `decide()` بتقول نوع البشرة بس، و`route()` بتترجمه لروتين + بتطبّق
   قفل الحساسية. فحص decide() لحاله صار ناقصاً بعد ٢٩ آب. */
const rFrom = src.indexOf('  var TYPE_TO_ROUTINE = {');
const rTo   = src.indexOf('  var ARABIC = [', rFrom);
if (rFrom < 0 || rTo < 0) {
  console.error('🔴 ما لقيت TYPE_TO_ROUTINE/route() بـmotion.js');
  process.exit(2);
}
const route = new Function(src.slice(rFrom, rTo) + ' return route;')();

/* كل حالة: النقاط، والنتيجة المتوقعة، وليش */
const CASES = [
  [{ oily: 4, dry: 0, combination: 0, sensitive: 0 }, 'oily',        'دهنية صافية'],
  [{ oily: 0, dry: 4, combination: 0, sensitive: 0 }, 'dry',         'جافة صافية'],
  [{ oily: 0, dry: 0, combination: 3, sensitive: 0 }, 'combination', 'مختلطة صافية'],
  [{ oily: 0, dry: 0, combination: 0, sensitive: 4 }, 'sensitive',   'حسّاسة صافية'],

  /* تجاوز السلامة · الحسّاسة بتفوز من نقطتين حتى لو غيرها أعلى */
  [{ oily: 3, dry: 0, combination: 0, sensitive: 2 }, 'sensitive',   'دهنية ٣ وحسّاسة ٢ → السلامة'],
  [{ oily: 4, dry: 1, combination: 0, sensitive: 2 }, 'sensitive',   'دهنية ٤ وحسّاسة ٢ → السلامة'],
  [{ oily: 3, dry: 0, combination: 0, sensitive: 1 }, 'oily',        'حسّاسة ١ بس · ما بتتجاوز'],

  /* التعادل بين الدهنية والجافة = مختلطة بالتعريف */
  [{ oily: 2, dry: 2, combination: 0, sensitive: 0 }, 'combination', 'دهنية ٢ وجافة ٢ → مختلطة'],
  [{ oily: 1, dry: 1, combination: 1, sensitive: 0 }, 'combination', 'تعادل ثلاثي فيه دهنية وجافة'],

  /* كل الإجابات «ولا إشي» */
  [{ oily: 0, dry: 0, combination: 0, sensitive: 0 }, 'combination', 'صفر نقاط · ولا إشي بيصير'],

  /* 🔴 كل تعادل بالقمة = مختلطة · وهاي الحالات اللي كشفت إن النسخة الأولى
     كانت بتحسم بترتيب المفاتيح بالكائن مش بقاعدة */
  [{ oily: 2, dry: 0, combination: 2, sensitive: 0 }, 'combination', 'تعادل دهنية ومختلطة'],
  [{ oily: 0, dry: 3, combination: 3, sensitive: 0 }, 'combination', 'تعادل جافة ومختلطة'],
  [{ oily: 1, dry: 0, combination: 0, sensitive: 1 }, 'combination', 'تعادل دهنية وحسّاسة تحت العتبة'],
  [{ oily: 2, dry: 2, combination: 2, sensitive: 0 }, 'combination', 'تعادل ثلاثي'],

  /* المختلطة بتغلب لحالها */
  [{ oily: 1, dry: 1, combination: 3, sensitive: 0 }, 'combination', 'مختلطة أعلى'],
  [{ oily: 2, dry: 0, combination: 3, sensitive: 1 }, 'combination', 'مختلطة أعلى وحسّاسة ١'],
];

let fail = 0;
for (const [tally, want, why] of CASES) {
  let got;
  try { got = decide(tally); } catch (e) { got = '🔴 ' + e.message; }
  const ok = got === want;
  if (!ok) fail++;
  console.log(
    (ok ? '✅' : '🔴') + ' ' +
    JSON.stringify(tally).replace(/"/g, '').padEnd(48) +
    '→ ' + String(got).padEnd(13) +
    (ok ? '' : '(متوقّع ' + want + ') ') +
    '[' + why + ']'
  );
}

console.log('---');
console.log('انفحص ' + CASES.length + ' حالة · فشل ' + fail + (fail ? ' 🔴' : ' ✅'));

/* 🔴 صفر نتيجة = فحص أعمى مش منطق نظيف */
if (!CASES.length) { console.error('🔴 ولا حالة · الفحص أعمى'); process.exit(2); }
/* 🔴 كان هون `process.exit(fail ? 1 : 0)` وهو **قطع الفحص الثاني بصمت** —
   الكتلة تحت انضافت ٢٩ آب وما اشتغلت ولا مرة، والمخرَج كان بيقول «فشل 0»
   وهو ما فحص التوجيه أصلاً. الخروج انتقل لآخر الملف. */
if (fail) process.exitCode = 1;

/* ══════════════════════════════════════════════════════════════════════════
   طبقة التوجيه · النوع + الشكوى → روتين
   ══════════════════════════════════════════════════════════════════════════ */
const ROUTE_CASES = [
  ['oily',        null,        'clarify',   'دهنية بلا شكوى إشراق → التنقية'],
  ['combination', null,        'clarify',   'مختلطة → التنقية'],
  ['dry',         null,        'hydration', 'جافة → الترطيب'],
  ['sensitive',   null,        'hydration', 'حسّاسة → الترطيب'],

  ['oily',        'glow',      'glow',      'الشكوى بتغلب النوع'],
  ['dry',         'glow',      'glow',      'جافة وباهتة → الإشراقة'],
  ['combination', 'glow',      'glow',      'مختلطة وباهتة → الإشراقة'],

  /* 🔴 القفل: الحسّاسة ما بتروح للإشراقة أبداً حتى لو هي شكواها،
     لأن روتين الإشراقة فيه فيتامين سي وادعاءات الحساسية ما انتأكدت رسمياً */
  ['sensitive',   'glow',      'hydration', 'قفل الحساسية بيغلب الشكوى'],

  ['oily',        'oily',      'clarify',   'شكوى مطابقة للنوع'],
  ['dry',         'dry',       'hydration', 'شكوى مطابقة للنوع'],
  ['sensitive',   'sensitive', 'hydration', 'حسّاسة صافية'],
  ['oily',        'unknown',   'clarify',   'شكوى مش معروفة بتنتجاهل'],
];

let rPass = 0, rFail = 0;
console.log('');
console.log('🔀 توجيه الروتين · ' + ROUTE_CASES.length + ' حالة');
console.log('─'.repeat(72));
for (const [type, concern, want, why] of ROUTE_CASES) {
  const got = route(type, concern);
  const ok = got === want;
  if (ok) rPass++; else rFail++;
  console.log(
    (ok ? '  ✅ ' : '  🔴 ') +
    (type + ' + ' + (concern === null ? '—' : concern)).padEnd(24) +
    '→ ' + String(got).padEnd(11) +
    (ok ? '' : '(المتوقّع: ' + want + ')  ') + why
  );
}
console.log('─'.repeat(72));
console.log('توجيه: نجح ' + rPass + ' · فشل ' + rFail);
if (rFail) process.exitCode = 1;
