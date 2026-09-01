/* ═══════════════════════════════════════════════════════════════════════
   سكربت تمهيدي لأداة اللقطات · تجميد الحركة قبل التصوير
   ═══════════════════════════════════════════════════════════════════════
     node _أدوات/shoot.mjs <out> <url> <w> <h> <scrolls> _أدوات/prelude-freeze.js

   بيخلّي كل عنصر `data-luvit="reveal|stagger"` بحالته النهائية، وبيحوّل
   الصور الكسولة لتحميل فوري · فاللقطة بتمسك التصميم لا لحظة من الحركة.

   ⚠️ **الهيرو مستثنى بقصد** · تصفير `opacity/transform` على عناصره
      بيكسر تثبيت ScrollTrigger، فبتطلع لقطة لصفحة مكسورة من صنعنا
      وبتنحكم على تصميم مش موجود. صارت فعلاً ١ أيلول.

   🔴 وملاحظة عن plasmajo تحديداً · مقيسة ١ أيلول:
      **قفل «قريباً» تبع هوستنجر على السيرفر لا بالـCSS.** الطلب بلا
      تسجيل دخول بيرجّع ١٥٦ كيلوبايت ما فيها ولا كلاس من كلاساتنا
      (`luvit-home-rt` · `luvit-quote` · `luvit-case` = صفر). يعني
      **ما بتنفع تصوّر الرئيسية بمتصفّح نظيف** لحد ما الموقع ينزل ·
      الفحص البصري للحيّ لازم يمرق بمتصفّح ريّان المسجَّل.

      ⚠️ وانخدعت بهاي أول مرة: `grep -c` على نمط فيه بدائل رجّع ٥،
         وقرأتها «سكاشننا موجودة» وهي كانت ٤ من `hsr-coming-soon`
         وواحد `<section`. **عدّ نمط فيه بدائل مش دليل على أي بديل طابق.**
   ═══════════════════════════════════════════════════════════════════════ */
const hero = document.querySelector('#hero-seq');
let frozen = 0;
for (const el of document.querySelectorAll('[data-luvit="reveal"],[data-luvit="stagger"]')) {
  if (hero && hero.contains(el)) continue;
  el.style.opacity = '1';
  el.style.transform = 'none';
  frozen++;
}
let eager = 0;
for (const img of document.querySelectorAll('img[loading="lazy"]')) { img.loading = 'eager'; eager++; }

await new Promise((r) => setTimeout(r, 800));

return { frozen, eager, sections: document.querySelectorAll('section').length };
