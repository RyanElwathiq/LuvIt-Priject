#!/usr/bin/env node
/**
 * ============================================================================
 * تحويل ملفات سكاشن لمحتوى صفحة ووردبريس · build-page.js
 * ============================================================================
 *   node _أدوات/build-page.js <اسم-المخرج> <سكشن.html> [سكشن.html ...]
 *
 * كل سكشن بينلف بكتلة `wp:html` لحاله، ونفس الترتيب اللي بتمرّره.
 * المخرج بينكتب بمجلد الـscratchpad عشان السيرفر المحلي يقدّمه للمتصفح.
 *
 * ⚠️ **الشورتكودات ما بتنفّذ جوّا `wp:html`** · بتنطبع نصاً حرفياً. أي
 *    شورتكود بده كتلة `wp:shortcode` لحاله (زي ما صار بصفحة `/track`).
 *    فإذا لقى السكربت شورتكود جوّا سكشن، بيوقف.
 *
 * ⚠️ **وتعليقات HTML بتنشال من المخرج.** التعليقات بملفات السكاشن مكتوبة
 *    للمطوّر (تحذيرات تركيب وقواعد محتوى)، وما إلها شغل بمحتوى الصفحة.
 *    وهي كمان أكبر من المحتوى نفسه أحياناً.
 *
 * 🔴 والفحوصات تحت **بتوقف السكربت**، ما بتحذّر وبس. سكربت بناء بيطلّع
 *    مخرجاً مكسوراً وبيقول «تمام» أخطر من سكربت بيفشل.
 * ============================================================================
 */

const fs = require('fs');
const path = require('path');

const SP = 'C:/Users/rayan/AppData/Local/Temp/claude/D--Ryan-Work-LUVIT/' +
           'b94fa03f-ae48-41af-9864-72ab45fa1efe/scratchpad/';

const [outName, ...files] = process.argv.slice(2);
if (!outName || !files.length) {
  console.error('استعمال: node _أدوات/build-page.js <اسم-المخرج> <سكشن.html> [...]');
  process.exit(2);
}

/* الصفحات الحية · أي رابط داخلي غيرها بيوقف البناء.
   🔴 هاي القائمة بتكبر كل ما تنبني صفحة · حدّثها وقتها. */
const LIVE = new Set([
  '/', '/shop', '/products', '/cart', '/checkout', '/my-account', '/track',
  '/routines', '/routines/oily', '/routines/dry', '/routines/combination',
  '/routines/sensitive', '/quiz', '/shipping', '/faq',
]);

const blocks = [];
let totalChars = 0;

for (const f of files) {
  if (!fs.existsSync(f)) { console.error('🔴 مش موجود: ' + f); process.exit(1); }
  const raw = fs.readFileSync(f, 'utf8');
  const name = path.basename(f);

  if (/\[[a-z_]+[\s\]]/.test(raw.replace(/<!--[\s\S]*?-->/g, ''))) {
    console.error('🔴 ' + name + ' فيه شورتكود · لازم كتلة wp:shortcode لحاله');
    process.exit(1);
  }

  /* شيل تعليقات المطوّر · بس خلّي الأسطر عشان أرقام السطور تضل صحيحة
     لو حدا دوّر عن مقطع بالملف الأصلي */
  const body = raw.replace(/<!--[\s\S]*?-->/g, (m) => m.replace(/[^\n]/g, '')).trim();
  if (!body) { console.error('🔴 ' + name + ' فاضي بعد شيل التعليقات'); process.exit(1); }

  blocks.push('<!-- wp:html -->\n' + body + '\n<!-- /wp:html -->');
  totalChars += body.length;
  console.log('· ' + name.padEnd(24) + body.length + ' حرف');
}

const content = blocks.join('\n\n');

/* ── فحوصات · كلها بتوقف ─────────────────────────────────────────── */
const problems = [];

const h1 = (content.match(/<h1[\s>]/g) || []).length;
if (h1 !== 1) problems.push('عدد <h1> = ' + h1 + ' · لازم واحد بالضبط');

for (const t of ['section', 'div', 'article', 'details', 'summary', 'nav', 'h1', 'h2', 'h3', 'a', 'p', 'span']) {
  const o = (content.match(new RegExp('<' + t + '(?=[\\s>])', 'g')) || []).length;
  const c = (content.match(new RegExp('</' + t + '>', 'g')) || []).length;
  if (o !== c) problems.push('وسم <' + t + '> مش متوازن: ' + o + ' فتح · ' + c + ' إغلاق');
}

if (/<\/[a-z]+>\s*>/.test(content)) problems.push('وسم إغلاق يتيم');
if (content.includes('—')) problems.push('شرطة طويلة بالنص المنشور');
if (/href="#"/.test(content)) problems.push('رابط ميت href="#"');
if (/PLACEHOLDER_/.test(content)) problems.push('علامة صورة ما انولّدت · شغّل make-placeholders.js');
if (/svg\+xml;utf8/.test(content)) problems.push('صورة بصيغة utf8 · wptexturize بيكسرها · لازم base64');

/* 🔴 شيل الكويري سترنغ قبل المقارنة. زر «أضيفي للسلة» تبع ووكومرس بيروح على
   `/?add-to-cart=204` وهو رابط سليم تماماً · المسار `/` والباقي كويري.
   أول نسخة من هذا الفحص رفضته وهو صح. */
const norm = (h) => (h.split('?')[0].replace(/\/$/, '') || '/');
const hrefs = [...new Set((content.match(/href="(\/[^"#]*)"/g) || []).map((h) => h.slice(6, -1)))];
const dead = hrefs.filter((h) => !LIVE.has(norm(h)));
if (dead.length) problems.push('روابط على صفحات مش بقائمة الحية: ' + dead.join(' · '));

/* كل صورة base64 لازم تنفكّ لـSVG سليم · «انشفّرت» مش «اشتغلت» */
let imgs = 0, badImgs = 0;
for (const m of content.matchAll(/src="data:image\/svg\+xml;base64,([^"]+)"/g)) {
  imgs++;
  try {
    const dec = Buffer.from(m[1], 'base64').toString('utf8');
    if (!/^<svg[\s\S]*<\/svg>$/.test(dec.trim())) badImgs++;
  } catch (e) { badImgs++; }
}
if (badImgs) problems.push(badImgs + ' صورة base64 مقطوعة من ' + imgs);

if (problems.length) {
  console.error('');
  problems.forEach((p) => console.error('🔴 ' + p));
  process.exit(1);
}

const out = SP + outName;
fs.writeFileSync(out, content, 'utf8');

console.log('---');
console.log('✅ ' + content.length + ' حرف · ' + blocks.length + ' كتلة · ' + imgs + ' صورة سليمة');
console.log('   h1: ' + h1 + ' · الوسوم متوازنة · ولا رابط ميت');
console.log('   روابط: ' + hrefs.join(' '));
console.log('   المخرج: ' + out);
