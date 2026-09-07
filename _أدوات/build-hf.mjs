/* ══════════════════════════════════════════════════════════════════════════
   مولّد الهيدر والفوتر · library/header.html + footer.html → header-footer.php
   ══════════════════════════════════════════════════════════════════════════
   🔴 **الملف الناتج مكتوب عليه «لا تعدّله بالإيد»**، والمولّد كان مفقوداً
      من الريبو (انبنى بسكراتش‌باد جلسة سابقة وضاع). فأي تعديل على الهيدر
      كان بيتطلّب تعديلين يدويين يمكن ينحرفوا · [[duplicated-data-always-drifts]]

   التحويل بسيط بقصد: الـHTML بينحط **حرفياً** جوّا nowdoc.

   ⚠️ **وnowdoc بيشترط شرطين**، والاثنان محروسان تحت:
     ١) ولا سطر بالمحتوى بيساوي الفاصل `LUVIT_HF_END`
     ٢) الفاصل الختامي **ببداية السطر** بلا مسافة قبله

   ⤷ و`$` بالمحتوى آمنة لأنّ nowdoc ما بيفسّر · وهاد سبب اختياره أصلاً.

   التشغيل:  node _أدوات/build-hf.mjs
   ══════════════════════════════════════════════════════════════════════════ */
import fs from 'node:fs';

const ROOT = 'D:/Ryan-Work/LUVIT/luvit/library/';
const OUT = ROOT + 'header-footer.php';
const DELIM = 'LUVIT_HF_END';

const raw = fs.readFileSync(OUT, 'utf8');
const crlf = (raw.match(/\r\n/g) || []).length > 0;
const nl = crlf ? '\r\n' : '\n';

const readPart = (name) => {
  const t = fs.readFileSync(ROOT + name, 'utf8').split('\r\n').join('\n').replace(/\s+$/, '');
  /* حارس nowdoc · سطر بيساوي الفاصل بيكسر الملف كله */
  for (const line of t.split('\n')) {
    if (line.trim() === DELIM) {
      console.log('X ' + name + ' فيه سطر بيساوي الفاصل');
      process.exit(1);
    }
  }
  return t;
};

const header = readPart('header.html');
const footer = readPart('footer.html');

const build = (fn, body) =>
  'function ' + fn + '() {' + nl +
  '\treturn <<<\'' + DELIM + '\'' + nl +
  body.split('\n').join(nl) + nl +
  DELIM + ';' + nl +
  '}';

let out = raw;
const swap = (fn, body) => {
  /* من تعريف الدالة لأول `}` ببداية سطر بعد الفاصل الختامي */
  const re = new RegExp(
    'function\\s+' + fn + '\\s*\\(\\s*\\)\\s*\\{[\\s\\S]*?\\r?\\n' + DELIM + ';\\r?\\n\\}'
  );
  if (!re.test(out)) { console.log('X ما لقيت ' + fn); process.exit(1); }
  out = out.replace(re, build(fn, body));
};

swap('luvit_hf_header_html', header);
swap('luvit_hf_footer_html', footer);

/* ── الحرّاس ─────────────────────────────────────────────────────────── */
const cnt = (s, x) => s.split(x).length - 1;
const checks = [
  ['الدالتان موجودتان', cnt(out, 'function luvit_hf_header_html') === 1 && cnt(out, 'function luvit_hf_footer_html') === 1],
  ['الفاصل أربع مرات', cnt(out, DELIM) === 4],
  ['المحتوى وصل', out.includes('luvit-nav__brand') && out.includes('luvit-footer')],
  ['أقواس متوازنة', cnt(out, '{') === cnt(out, '}')],
  ['نهايات الأسطر ثابتة', ((out.match(/\r\n/g) || []).length > 0) === crlf],
];
const bad = checks.filter(([, ok]) => !ok).map(([n]) => n);
if (bad.length) { console.log('X ' + bad.join(' · ')); process.exit(1); }

fs.writeFileSync(OUT, out, 'utf8');
console.log('OK header-footer.php ' + raw.length + ' -> ' + out.length +
  '  (هيدر ' + header.length + ' · فوتر ' + footer.length + ')');
