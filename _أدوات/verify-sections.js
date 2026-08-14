/**
 * بيفحص إنه القص ما كسر وسوم: كل وسم فاتح إله وسم سكّر، وما في وسم زايد.
 * فحص بيطبع ✅ بلا ما يعدّ إشي = ثقة كاذبة، فهون منعدّ ومنطبع الأرقام.
 */
const fs = require('fs');
const path = require('path');
const DIR = 'D:/Ryan-Work/LUVIT/luvit/library/sections/';

const VOID = new Set(['area','base','br','col','embed','hr','img','input','link',
  'meta','param','source','track','wbr','path','circle','rect','line','polyline',
  'polygon','ellipse','stop','use']);

let allOk = true;
const files = fs.readdirSync(DIR).filter(f => f.endsWith('.html')).sort();

console.log('الملف'.padEnd(24) + 'وسوم' + '   عمق أخير   ' + 'section  حالة');
console.log('-'.repeat(72));

for (const f of files) {
  let src = fs.readFileSync(DIR + f, 'utf8');
  // نشيل التعليقات عشان ما نعدّ وسوم جوّاها
  src = src.replace(/<!--[\s\S]*?-->/g, '');
  // 🔴 الصور placeholder هي SVG مكتوبة جوّا src="data:image/svg+xml;utf8,<svg …>".
  // بلا هالسطر الفاحص بيعدّ وسوم جوّا قيمة attribute وبيطلع إنذار كاذب على
  // routine و products و compare. (وقعت فيها أول تشغيلة.)
  src = src.replace(/="[^"]*"/g, '=""').replace(/='[^']*'/g, "=''");

  const stack = [];
  const errors = [];
  let count = 0;
  const re = /<(\/?)([a-zA-Z][a-zA-Z0-9-]*)\b([^>]*?)(\/?)>/g;
  let m;
  while ((m = re.exec(src)) !== null) {
    const closing = m[1] === '/';
    const tag = m[2].toLowerCase();
    const selfClosed = m[4] === '/';
    if (VOID.has(tag) || selfClosed) continue;
    count++;
    if (!closing) stack.push(tag);
    else {
      const top = stack.pop();
      if (top !== tag) errors.push(`سكّر </${tag}> والمفتوح <${top || 'ولا إشي'}>`);
    }
  }

  const sectionOpen = (src.match(/<section\b/g) || []).length;
  const sectionClose = (src.match(/<\/section>/g) || []).length;
  const footerOpen = (src.match(/<footer\b/g) || []).length;
  const footerClose = (src.match(/<\/footer>/g) || []).length;

  const ok = stack.length === 0 && errors.length === 0
    && sectionOpen === sectionClose && footerOpen === footerClose;
  if (!ok) allOk = false;

  console.log(
    f.padEnd(24) +
    String(count).padStart(4) +
    String(stack.length).padStart(11) +
    `      ${sectionOpen}/${sectionClose}` +
    (footerOpen ? ` +footer ${footerOpen}/${footerClose}` : '') +
    (ok ? '   ✅' : '   🔴')
  );
  if (stack.length) console.log('        ضلّ مفتوح: ' + stack.join(' > '));
  errors.slice(0, 3).forEach(e => console.log('        ! ' + e));
}

console.log('-'.repeat(72));
console.log(allOk ? 'كل الملفات متوازنة الوسوم.' : '🔴 في ملف مكسور فوق.');

// فحص إضافي: كل ملف لازم يكون فيه data-nav-bg بالتعليمات وبالماركب
console.log('\nفحص data-nav-bg بالماركب:');
for (const f of files) {
  const src = fs.readFileSync(DIR + f, 'utf8');
  const body = src.replace(/<!--[\s\S]*?-->/g, '');
  const has = /data-nav-bg\s*=/.test(body);
  const val = (body.match(/data-nav-bg\s*=\s*["']([^"']+)["']/) || [])[1] || '—';
  console.log('  ' + f.padEnd(24) + (has ? '✅ ' + val : '🔴 ناقص بالماركب'));
}
