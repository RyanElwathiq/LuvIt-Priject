/* ══════════════════════════════════════════════════════════════════════
   حارس أعداد الأسئلة · ٣ أيلول
   ══════════════════════════════════════════════════════════════════════
   رأس صفحة الأسئلة صار يطبع **عدد الأسئلة بكل قسم** («خمس أسئلة» ·
   «ست أسئلة» · «ثلاث أسئلة»)، والأعداد نفسها موجودة أصلاً بالسكاشن
   تحت على شكل عناصر <details>.

   🔴 وهاد بالضبط شكل الخلل اللي كلّفنا قبل: **بيانات منسوخة بتنحرف
      حتماً.** أول ما ينضاف سؤال أو ينشال، الرأس بيضل يقول الرقم القديم،
      وما في إشي بيصرخ. تعليق «انتبه حدّثهم سوا» **ما بيوقف ولا سكربت**،
      وهاي كمان قاعدة مسجَّلة عندنا.

   ⤷ فالحارس بيعدّ <details> فعلياً بكل قسم وبيقارنه بالرقم المكتوب
     بالرأس · وبيرجّع خروج غير صفري لو اختلفوا، عشان ينفع ينحط بأي
     سلسلة فحص قبل النشر.

   الاستعمال:
     node "_أدوات/check-faq-counts.mjs"
   ══════════════════════════════════════════════════════════════════════ */
import fs from 'node:fs';

const FILE = 'D:/Ryan-Work/LUVIT/luvit/library/sections/f1-faq.html';

/* الأقسام بالترتيب اللي بينقرا فيه الرأس · والمفتاح هو `id` السكشن */
const SECTIONS = [
  { id: 'faq-order',   label: 'الطلب والدفع' },
  { id: 'faq-product', label: 'المنتجات والمكوّنات' },
  { id: 'faq-account', label: 'الحساب والتتبّع' },
];

/* الأعداد بتنكتب بالرأس كلمات عربية لا أرقام · فالجدول ثنائي الاتجاه */
const WORDS = {
  1: 'سؤال واحد', 2: 'سؤالين', 3: 'ثلاث أسئلة', 4: 'أربع أسئلة',
  5: 'خمس أسئلة', 6: 'ست أسئلة', 7: 'سبع أسئلة', 8: 'ثمان أسئلة',
  9: 'تسع أسئلة', 10: 'عشر أسئلة',
};
const DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
const toArabic = (n) => String(n).split('').map((d) => DIGITS[+d]).join('');

const raw = fs.readFileSync(FILE, 'utf8').split('\r').join('');

/* الرأس = من أول <section> لحد أول </section> · الباقي هو الأقسام */
const headEnd = raw.indexOf('</section>');
const head = raw.slice(0, headEnd);
const bodyAll = raw.slice(headEnd);

let bad = 0;
for (const s of SECTIONS) {
  /* حدود السكشن: من `id="<id>"` لحد `</section>` اللي بعده */
  const at = bodyAll.indexOf('id="' + s.id + '"');
  if (at < 0) { console.log('X ما لقيت السكشن ' + s.id); bad++; continue; }
  const end = bodyAll.indexOf('</section>', at);
  const chunk = bodyAll.slice(at, end < 0 ? undefined : end);
  const real = (chunk.match(/<details[\s>]/g) || []).length;

  /* المكتوب بالرأس: الكلمة والرقم سوا */
  const expectedWord = WORDS[real];
  const wordOk = expectedWord ? head.includes(expectedWord) : false;
  const digitOk = head.includes('>' + toArabic(real) + '<');

  const ok = wordOk && digitOk;
  if (!ok) bad++;
  console.log(
    (ok ? 'OK  ' : 'X   ') + s.label.padEnd(22) +
    ' <details> = ' + real +
    ' · الرقم ' + toArabic(real) + (digitOk ? ' ✓' : ' ناقص/مختلف') +
    ' · الكلمة «' + (expectedWord || '?') + '»' + (wordOk ? ' ✓' : ' ناقصة/مختلفة')
  );
}

if (bad) {
  console.log('\n' + bad + ' اختلاف · الرأس بيقول رقماً والأقسام بتقول رقماً تاني.');
  console.log('صلّح الرأس بـlibrary/sections/f1-faq.html وبعدها ادفع الصفحة ٢٢٠.');
  process.exit(1);
}
console.log('\nالأعداد مطابقة.');
