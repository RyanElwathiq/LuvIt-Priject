# رفع مقالات المدوّنة

المقالات مكتوبة بـ`library/journal/<id>-<slug>.html` بماركب جوتنبرج.

**قبل أي رفع:**

```
node _أدوات/check-journal-posts.mjs
```

بيفحص: توازن كتل `wp:` والوسوم · الشرطة الطويلة · **كل نسبة لازم تكون
بالكتالوج الرسمي** · الروابط الداخلية حيّة · وصيغ الوعود.

## الرفع

الملفات بتنسحب من ممر `serve.js` وبتنكتب بالـREST من صفحة الأدمن:

```js
const n = window.wpApiSettings.nonce;
const POSTS = [
  { id: 225, f: '225-oily-skin-why-moisturize.html' },
  { id: 224, f: '224-why-layer-order-matters.html' },
  { id: 223, f: '223-niacinamide-what-it-does.html' },
];
for (const p of POSTS) {
  const html = await (await fetch(
    'http://localhost:4399/library/journal/' + p.f, { cache: 'no-store' })).text();
  await fetch('/wp-json/wp/v2/posts/' + p.id, {
    method: 'POST', credentials: 'include',
    headers: { 'X-WP-Nonce': n, 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: html }),
  });
}
```

ثم **LiteSpeed ← Purge All**، وافحص الصفحة الحيّة.

## 🔴 وثلاث قواعد محتوى ما بتنكسر

**١ · ولا رقم من الراس.** كل نسبة من `_خطة/بيانات-المنتجات-الرسمية.json`.
والمقال القديم عن النياسيناميد كان بيقول «بمنتجاتنا النسبة 2%» و**هاد
غلط**: عنا خمس نِسَب (0.5 · 0.8 · 2 · 2 · 10)، وأعلاها بسيروم تضييق
المسامات وهو اللي مبنيّ عليه أصلاً. الجملة كانت بتقرا كحقيقة وضلّت منشورة.

**٢ · ولا وعد بنتيجة ولا بمدة.** «بيعالج» · «خلال أسبوعين» · «مضمون» ·
كلها بتوقف الفاحص. وكلمة **«مظهر»** مقصودة بالنصوص: هاي منتجات عناية لا
أدوية، وشغلها على شكل البشرة لا على تشخيص حالة.

**٣ · المخاطبة مؤنثة.** الزبونات نساء · «بتقدري» «بشرتك» «احطّي».
(والمخاطبة مع ريّان نفسه **مذكرة** · صيغتان مختلفتان بالمشروع.)

## ⚠️ ورابط كان ميتاً

مقال ٢٢٥ كان بيربط على `/routines/oily` · وهاي **انشالت ٣٠ آب** وبترجّع
404. الروتينات صارت حسب الهدف لا حسب نوع البشرة:
`/routines/hydration` · `/routines/glow` · `/routines/clarify`.
والفاحص بيمسك هالفئة من هلأ.
