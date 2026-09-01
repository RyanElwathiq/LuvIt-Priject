#!/usr/bin/env node
/**
 * ============================================================================
 * بوابة بلوكات الصفحات · check-page-blocks.mjs
 * ============================================================================
 *   node _أدوات/check-page-blocks.mjs           يفحص التصريحات بالملفات
 *   node _أدوات/check-page-blocks.mjs --live    يطبع سكربت فحص للمتصفح
 *
 * ── 🔴 ليش انبنت ─────────────────────────────────────────────────────────
 * **مسحت قائمة المقالات كلها من الموقع الحيّ.**
 *
 * `library/sections/j1-journal.html` فيه **رأس الصفحة وبس**، وقائمة
 * المقالات بتيجي من شورتكودين بكتل `wp:shortcode` **منفصلة**:
 *     [luvit_journal_cats]  ·  [luvit_journal]
 *
 * وسكربت الدفع تبعي بيلفّ أي ملف بكتلة `wp:html` وحدة ويدفعه كمحتوى
 * الصفحة **كامل** · فالشورتكودان انمسحوا وصفحة المقالات صارت رأساً
 * وفوتر وبس. **وريّان هو اللي شافها**، وسألني «وين راحوا واختفوا؟».
 *
 * 🔴 **والتحذير كان مكتوباً بنصّ الملف نفسه**، بأول تعليق فيه:
 *      «⚠️ الشورتكودان بينحطوا بكتل wp:shortcode منفصلة تحت هالسكشن»
 *    قرأه إنسان بيفهمه · وسكربت بيلفّ الملف ما بيقراه. **التوثيق
 *    اللي بس بني آدم بيقراه ما بيحمي من أتمتة.**
 *
 * ⤷ فالتصريح صار **آلياً** بأول الملف:
 *      <!-- luvit-blocks: shortcode=luvit_journal_cats,luvit_journal -->
 *    والبوابة بتقارنه بالصفحة الحيّة · لو ناقص شورتكود بتوقف.
 *
 * ⚠️ وصفحتان بس محتاجاتها اليوم (المقالات والتتبّع) · بس الملف اللي
 *    بينضاف بكرة ما بيعرف · فالفحص بيمشي على الكل.
 * ============================================================================
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '..');
const DIR = path.join(REPO, 'library', 'sections');

const errs = [];
const صرّحوا = [];

for (const f of fs.readdirSync(DIR)) {
  if (!f.endsWith('.html')) continue;
  const src = fs.readFileSync(path.join(DIR, f), 'utf8');
  if (src.includes('LUVIT-LEGACY')) continue;

  const تصريح = src.match(/<!--\s*luvit-blocks:\s*shortcode=([^>]+?)\s*-->/);
  /* الشورتكودات المذكورة بالتعليقات · هاي إشارة إن الصفحة محتاجتها */
  const مذكورة = [...new Set(
    (src.match(/\[[a-z][a-z_]*\]/g) || []).map((s) => s.slice(1, -1)),
  )].filter((s) => s.length > 4);

  if (!مذكورة.length && !تصريح) continue;

  if (!تصريح) {
    errs.push(f + ' · بيذكر شورتكود (' + مذكورة.join(' · ') +
      ') وما فيه تصريح `luvit-blocks` · الدفع بيمسحه');
    continue;
  }
  const مصرَّح = تصريح[1].split(',').map((s) => s.trim()).filter(Boolean);
  const ناقص = مذكورة.filter((m) => !مصرَّح.includes(m));
  if (ناقص.length) errs.push(f + ' · مذكور وما هو مصرَّح: ' + ناقص.join(' · '));
  صرّحوا.push({ file: f, codes: مصرَّح });
}

if (errs.length) {
  console.error('🔴 صفحات محتواها أكثر من كتلة HTML:');
  errs.forEach((e) => console.error('     ' + e));
  console.error('');
  console.error('     الحل: ضيف بأول الملف سطراً زي:');
  console.error('     <!-- luvit-blocks: shortcode=اسم_الشورتكود,اسم_تاني -->');
  console.error('     ودفع هالملف لازم يضيف كتل wp:shortcode بعد كتلة الـHTML.');
  process.exit(1);
}

console.log('✅ ' + صرّحوا.length + ' ملفاً بيحتاج بلوكات إضافية · وكلهم مصرِّحون');
صرّحوا.forEach((s) => console.log('     ' + s.file.padEnd(20) + s.codes.join(' · ')));
