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
process.exit(fail ? 1 : 0);
