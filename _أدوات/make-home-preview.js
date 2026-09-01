/**
 * ============================================================================
 * معاينة محلية للصفحة الرئيسية · make-home-preview.js
 * ============================================================================
 *   node _أدوات/make-home-preview.js
 *
 * بتتولّد من **نفس** ملفات السكاشن اللي بتنرفع للإلمنتور
 * (library/sections/h1..h8) فما بتنحرف عنهم.
 *
 * ⚠️ **وبتخبّي فئة كاملة من الباغات · مقيس ١ أيلول:**
 *    الرأس الجانبي الملتصق اشتغل هون تماماً وطلع **ميتاً** على ووردبريس
 *    (body عندها overflow بيقتل sticky). فالمعاينة **شرط مش كافٍ** ·
 *    الحكم النهائي بالقياس على الموقع الحيّ.
 *
 * 🔴 وفيها نافبار وهمي بـ58px بقصد · معاينة بلا العنصر الثابت **بتكذب
 *    على كل قياس تحته**، وهاد صار فعلاً بهيرو المتجر.
 * ============================================================================
 */
const fs = require('fs');
const path = require('path');
const SEC = 'D:/Ryan-Work/LUVIT/luvit/library/sections';
const OUT = 'D:/Ryan-Work/LUVIT/luvit/library/home-new-preview.html';

const FILES = ['h1-trust.html', 'h2-routine.html', 'h3-quiz.html', 'h4-result.html',
               'h5-ingredients.html', 'h6-why.html', 'h7-quotes.html', 'h8-cta.html'];

let body = FILES.map((f) => {
  let h = fs.readFileSync(path.join(SEC, f), 'utf8');
  /* الصور المرفوعة لسا ما رُفعت · بنشير للمحلي بالمعاينة فقط */
  h = h.replace(/\/wp-content\/uploads\/2026\/09\/(luvit-case-[a-z-]+\.webp)/g, '/library/img/$1');
  return `<!-- ═══ ${f} ═══ -->\n${h}`;
}).join('\n\n');

const html = `<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>معاينة الرئيسية الجديدة</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=El+Messiri:wght@400..700&family=IBM+Plex+Sans+Arabic:wght@300;400;500;600&family=Jost:wght@300..700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/library/tokens.css">
<style>
  body { margin: 0; background: var(--color-paper, #fff); }
  /* 🔴 محاكاة النافبار الثابت · بلاها المعاينة بتكذب على كل قياس تحته
        (وهاد صار فعلاً مع هيرو المتجر ١ أيلول) */
  .fake-nav {
    position: fixed; inset-block-start: 12px; inset-inline: 12px;
    block-size: 58px; z-index: 90; border-radius: 999px;
    background: rgba(255,255,255,.86); backdrop-filter: blur(10px);
    box-shadow: 0 6px 24px rgba(2,26,30,.10);
    display: flex; align-items: center; justify-content: center;
    font-family: var(--font-latin); letter-spacing: .2em; font-size: 13px;
    color: #16788C;
  }
</style>
</head>
<body>
<div class="fake-nav">NAVBAR 58px</div>
${body}
<!-- 🔴 GSAP لازم يتحمّل **قبل** motion.js · نفس قاعدة أولوية WPCode
     (GSAP أولوية ٥ · motion.js أولوية ١٠) وإلا الحركة ما بتشتغل -->
<script src="https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/ScrollTrigger.min.js"></script>
<script src="/library/motion.js"></script>
</body>
</html>`;

fs.writeFileSync(OUT, html, 'utf8');
console.log('✅ ' + OUT + '  ' + (html.length / 1024).toFixed(0) + 'KB');
