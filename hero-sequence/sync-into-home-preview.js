/**
 * ============================================================================
 * sync-into-home-preview.js
 * ============================================================================
 * يزرع كتلة الهيرو من scroll-sequence.html جوّا library/home-preview.html.
 *
 * ليش هذا السكربت موجود
 * ---------------------
 * كان في نسختان مختلفتان من كود الهيرو، مش نسخة ونسخة قديمة: بـhome-preview
 * كان اللوح radius:26 ولونه 12,51,60 وعتامته 0.40 وخلفيته طبقتين، وبالملف
 * المصدر radius:34 ولون Lagoon 6,52,54 وعتامة 0.51 وثلاث طبقات.
 *
 * يعني أي حكم على الهيرو من المعاينة الرئيسية كان حكم على شي مش موجود على
 * الموقع. اكتشفناها ٩ آب ٢٠٢٦ بعد ما انصرف وقت على تقييم النسخة الغلط.
 *
 * فبدل ما ننسخ يدوي كل مرة (وترجع تفترق)، هذا السكربت بيزامن.
 *
 * شغّله بعد أي تعديل على scroll-sequence.html:
 *     node hero-sequence/sync-into-home-preview.js
 *     node hero-sequence/make-local-preview.js
 *
 * الفرق الوحيد المسموح بين النسختين هو مسار الفريمات:
 *   المصدر  -> روابط plasmajo.com المباشرة (عشان الإلمنتور)
 *   المعاينة -> ../hero-sequence/frames/ (نسبي من مجلد library)
 * ============================================================================
 */
const fs = require('fs');
const path = require('path');

const HERE = __dirname;
const SRC = path.join(HERE, 'scroll-sequence.html');
const DST = path.join(HERE, '..', 'library', 'home-preview.html');

/* المصدر -> المعاينة. المسار نسبي من library/ مش من جذر الريبو. */
const FRAME_PATHS = [
  ['https://plasmajo.com/wp-content/uploads/hero-seq/extracted/frames-desktop/', '../hero-sequence/frames-desktop/'],
  ['https://plasmajo.com/wp-content/uploads/hero-seq/extracted/frames/',         '../hero-sequence/frames/'],
];

/* حدود الكتلة جوّا home-preview.html. لا نلمس تعليق «1. HERO» اللي فوقها:
   هو علامة القص اللي بيعتمد عليها مولّد ملفات السكاشن. */
const BLOCK_START_MARK = 'LUVIT — HERO SCROLL SEQUENCE + STORY CHAPTERS';
const BLOCK_END_MARK   = '<!-- Wave hand-off';

function die(msg) {
  console.error('\n🔴 ' + msg + '\n   ما انكتب ولا حرف.');
  process.exit(1);
}

let src = fs.readFileSync(SRC, 'utf8');
const dst = fs.readFileSync(DST, 'utf8');

/* --- 1. حوّل مسارات الفريمات --- */
let swapped = 0;
for (const [from, to] of FRAME_PATHS) {
  const n = src.split(from).length - 1;
  if (n) { src = src.split(from).join(to); swapped += n; }
}
if (swapped === 0) {
  die('ولا مسار فريمات انتحوّل. يا إنه المصدر تغيّر، يا إنه FRAME_PATHS بايتة.');
}

/* --- 2. لاقي حدود الكتلة بالوجهة --- */
const markIdx = dst.indexOf(BLOCK_START_MARK);
if (markIdx === -1) die('ما لقيت علامة بداية كتلة الهيرو بـhome-preview.html.');

/* ارجع لبداية التعليق اللي جوّاه العلامة */
const startIdx = dst.lastIndexOf('<!--', markIdx);
if (startIdx === -1) die('لقيت العلامة بس ما لقيت بداية التعليق اللي حاضنها.');

const endIdx = dst.indexOf(BLOCK_END_MARK, startIdx);
if (endIdx === -1) die('ما لقيت علامة نهاية الكتلة (' + BLOCK_END_MARK + ').');
if (endIdx <= startIdx) die('النهاية قبل البداية · الحدود مش منطقية.');

const oldBlock = dst.slice(startIdx, endIdx);

/* --- 3. ركّب --- */
const next = dst.slice(0, startIdx) + src.trimEnd() + '\n\n' + dst.slice(endIdx);

if (next === dst) {
  console.log('لا تغيير · النسختان متطابقتان أصلاً.');
  process.exit(0);
}

fs.writeFileSync(DST, next, 'utf8');

/* --- 4. تقرير · بأرقام مش بـ«تم» --- */
const lines = (s) => s.split(/\r?\n/).length;
console.log('  زامنّا  : hero-sequence/scroll-sequence.html  ->  library/home-preview.html');
console.log('  مسارات فريمات انتحوّلت : ' + swapped);
console.log('  الكتلة القديمة : ' + lines(oldBlock) + ' سطر · ' + oldBlock.length + ' حرف');
console.log('  الكتلة الجديدة : ' + lines(src) + ' سطر · ' + src.length + ' حرف');
console.log('  حجم الملف      : ' + dst.length + ' -> ' + next.length + ' حرف');

/* --- 5. تحقّق ذاتي · ما نطبع ✅ بلا ما نفحص --- */
const after = fs.readFileSync(DST, 'utf8');
const checks = [
  ['ولا رابط plasmajo ضل بالمعاينة', !/plasmajo\.com\/wp-content\/uploads\/hero-seq/.test(after)],
  ['مسار الفريمات النسبي موجود',      after.includes('../hero-sequence/frames/')],
  ['تعليق «1. HERO» ما انمس',         after.includes('1. HERO')],
  ['تعليق «2. TRUST BAR» ما انمس',    after.includes('2. TRUST BAR')],
  ['وصلة الموجة ما انمست',            after.includes('luvit-wave--drift seq-blend')],
  ['section الهيرو موجود',            /<section id="hero-seq"/.test(after)],
  ['ولا > يتيمة',                     !/<\/[a-z]+>>/.test(after)],
];
console.log('\n  التحقق:');
let bad = 0;
for (const [label, ok] of checks) {
  console.log('    ' + (ok ? '✅' : '🔴') + ' ' + label);
  if (!ok) bad++;
}
if (bad) { console.error('\n🔴 ' + bad + ' فحص فشل · راجع الملف قبل ما تكمّل.'); process.exit(1); }
console.log('\n  بعدها شغّل: node hero-sequence/make-local-preview.js');
