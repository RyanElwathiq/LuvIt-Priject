#!/usr/bin/env node
/**
 * ============================================================================
 * تجميع أصول صفحة المتجر للنشر · bundle-shop.mjs
 * ============================================================================
 *   node _أدوات/bundle-shop.mjs
 *
 * المخرَج · تلات ملفات بـ_وارد/ بينسحبوا بممر serve.js:
 *   shop-bundle.css        ← الستايل · بينضاف لسنيبت tokens
 *   shop-bundle.js         ← السكربت · سنيبت WPCode بالفوتر
 *   page206-content.html   ← الماركب · محتوى صفحة Gutenberg
 *
 * ── 🔴 ليش انبنى ─────────────────────────────────────────────────────────
 * ريّان ١ أيلول: «صفحة المتجر اللي طلعت روحنا واحنا منشتغل عليها ما تحدّثت
 * ولا صرلها إشي · شكلك ما حدّثتها أو رفعتها.» **وهو محقّ.**
 *
 * الشغل كان بملف معاينة **مكتفٍ بذاته**: الماركب والستايل والسكربت كلهم
 * جوّاه. والمعاينة بتشتغل لأن كل شي بنفس الملف · والموقع لأ، لأن كل قطعة
 * إلها بيت مختلف. فالتركيب **مش لصقاً**، هو تفكيك لتلات وجهات.
 *
 * ⚠️ **والاستيراد النسبي هو الفخ الأساسي:**
 *    `import { revealAll } from './tawaazn-motion.js'`
 *    بيشتغل بالمعاينة (نفس المجلد) و**بينكسر على ووردبريس** لأن السكربت
 *    بينحقن بالفوتر لا بمجلد library. فبنحقن الوحدة **جوّا الحزمة**
 *    وبنشيل سطر الاستيراد.
 *
 * ⚠️ ومسارات الفريمات بتكتشف نفسها (SEQ_LOCAL) · مشروح بمكانه.
 * ============================================================================
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '..');
const LIB = path.join(REPO, 'library');
const OUT = path.join(REPO, '_وارد');
fs.mkdirSync(OUT, { recursive: true });

const prev = fs.readFileSync(path.join(LIB, 'shop-hero-packages.preview.html'), 'utf8');
const live = fs.readFileSync(path.join(LIB, 'products-preview.html'), 'utf8');

/* ── ١ · الستايل ─────────────────────────────────────────────────────── */
const styles = [...prev.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]);
if (!styles.length) { console.error('🔴 ولا كتلة style'); process.exit(1); }
const css = [
  '/* ══════════════════════════════════════════════════════════════════════',
  '   صفحة المتجر · هيرو القطرة + مختار الأهداف + التشكيلة',
  '   ══════════════════════════════════════════════════════════════════════',
  '   🔴 مولَّد بـ_أدوات/bundle-shop.mjs من',
  '      library/shop-hero-packages.preview.html · **لا تعدّله هون.**',
  '      عدّل المعاينة وأعد التجميع، وإلا الاثنان بينحرفوا.',
  '   ══════════════════════════════════════════════════════════════════════ */',
  '',
  styles.join('\n\n'),
].join('\n');
fs.writeFileSync(path.join(OUT, 'shop-bundle.css'), css, 'utf8');

/* ── ٢ · السكربت · مع حقن وحدة توازَن ────────────────────────────────── */
const scripts = [...prev.matchAll(/<script(?![^>]*\ssrc=)[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
if (!scripts.length) { console.error('🔴 ولا كتلة script'); process.exit(1); }
let js = scripts.join('\n\n');

const IMPORT = /^\s*import\s+\{([^}]+)\}\s+from\s+['"]\.\/tawaazn-motion\.js['"];?\s*$/m;
const imp = js.match(IMPORT);
if (!imp) { console.error('🔴 ما لقيت استيراد توازَن · البنية اتغيّرت'); process.exit(1); }

let motion = fs.readFileSync(path.join(LIB, 'tawaazn-motion.js'), 'utf8');
/* `export` بتنكسر برّا الوحدات · بنشيلها وبنخلي التعريفات كما هي */
motion = motion.replace(/^\s*export\s+(?=(const|let|var|function|class)\b)/gm, '');
motion = motion.replace(/^\s*export\s*\{[^}]*\}\s*;?\s*$/gm, '');

const wanted = imp[1].split(',').map((s) => s.trim()).filter(Boolean);
const missing = wanted.filter((w) => !new RegExp('\\b(const|let|var|function|class)\\s+' + w + '\\b').test(motion));
if (missing.length) { console.error('🔴 ناقص من توازَن: ' + missing.join(', ')); process.exit(1); }

js = js.replace(IMPORT, [
  '/* ── وحدة توازَن محقونة · كانت import نسبياً بالمعاينة ──────────────',
  '   المسار النسبي بيشتغل بالمعاينة وبينكسر على ووردبريس لأن السكربت',
  '   بينحقن بالفوتر لا بمجلد library. المطلوب: ' + wanted.join(' · '),
  '   ⚠️ ولا تعدّل هون · عدّل library/tawaazn-motion.js وأعد التجميع. */',
  motion.trim(),
  '/* ── نهاية توازَن ──────────────────────────────────────────────────── */',
].join('\n'));

fs.writeFileSync(path.join(OUT, 'shop-bundle.js'), js, 'utf8');

/* ── ٣ · الماركب ─────────────────────────────────────────────────────── */
function grab(html, id) {
  const m = new RegExp('<section[^>]*\\sid="' + id + '"', 'g').exec(html);
  if (!m) return null;
  let depth = 0;
  const tag = /<\/?section\b[^>]*>/g;
  tag.lastIndex = m.index;
  let t;
  while ((t = tag.exec(html))) {
    if (t[0][1] === '/') { depth--; if (!depth) return html.slice(m.index, t.index + t[0].length); }
    else depth++;
  }
  return null;
}

const ORDER = [
  ['page-head', prev, 'الهيرو · تسلسل القطرة'],
  ['packages', prev, 'مختار الأهداف'],
  ['skin-types', live, 'نوع البشرة · 🟡 متقاطع مع الأهداف · قرار ريّان'],
  ['catalogue', prev, 'التشكيلة · رأس ملتصق'],
  ['ingredients', live, 'المكوّنات'],
  ['delivery', live, 'التوصيل'],
  ['products-faq', live, 'الأسئلة'],
];

const parts = [];
for (const [id, src, label] of ORDER) {
  const html = grab(src, id);
  if (!html) { console.error('🔴 ما لقيت #' + id); process.exit(1); }
  parts.push(html);
  console.log('  ✅ ' + ('#' + id).padEnd(15) + String(html.length).padStart(6) + ' حرف · ' + label);
}
const wp = parts.map((p) => '<!-- wp:html -->\n' + p.trim() + '\n<!-- /wp:html -->').join('\n\n');

/* فحوصات · على المحتوى المرئي فقط.
   🔴 وبنشيل style وscript كمان · تعليقاتهم مليانة تشديد ماركداون
      وبتطلّع إنذاراً كاذباً (صار فعلاً ١ أيلول). */
const vis = wp
  .replace(/<!--[\s\S]*?-->/g, '')
  .replace(/<style[\s\S]*?<\/style>/g, '')
  .replace(/<script[\s\S]*?<\/script>/g, '');
const bad = [];
if ((vis.match(/<h1[\s>]/g) || []).length > 1) bad.push('أكثر من h1');
if (vis.includes('—')) bad.push('شرطة طويلة');
if (/href="#"/.test(vis)) bad.push('رابط ميت');
if (/\*\*[^*\n]+\*\*/.test(vis)) bad.push('نجمات ماركداون');
for (const tag of ['section', 'div', 'article', 'h1', 'h2', 'h3', 'p', 'a', 'span', 'ol', 'li', 'button']) {
  const o = (vis.match(new RegExp('<' + tag + '(?=[\\s>])', 'g')) || []).length;
  const c = (vis.match(new RegExp('</' + tag + '>', 'g')) || []).length;
  if (o !== c) bad.push('<' + tag + '> ' + o + '/' + c);
}
if (bad.length) { bad.forEach((b) => console.error('🔴 ' + b)); process.exit(1); }

fs.writeFileSync(path.join(OUT, 'page206-content.html'), wp, 'utf8');

console.log('');
console.log('✅ ثلاث قطع جاهزة بـ_وارد/');
console.log('   shop-bundle.css       ' + String(css.length).padStart(7) + ' حرف');
console.log('   shop-bundle.js        ' + String(js.length).padStart(7) + ' حرف  (فيها توازَن محقونة)');
console.log('   page206-content.html  ' + String(wp.length).padStart(7) + ' حرف  · ' + parts.length + ' سكشن');
