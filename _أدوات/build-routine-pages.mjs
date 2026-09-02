#!/usr/bin/env node
/**
 * ============================================================================
 * توليد صفحات الروتينات الثلاثة · build-routine-pages.mjs
 * ============================================================================
 *   node _أدوات/build-routine-pages.mjs
 *
 * 🔴 **ليش مولّد مش ثلاث ملفات بالإيد:** الصفحات الثلاثة نفس الهيكل بالضبط
 *    والاختلاف بيانات. كتابتها بالإيد بتعني إنه أي تصحيح سعر بده يتكرّر
 *    ثلاث مرات، وبتضيع وحدة. (صار فعلاً: الرئيسية كان فيها ١٨٫٥٠ لمنتج
 *    سعره ١٥.)
 *
 * 🔴 **ولا كلاس مخترع · والسكربت بيفحص ذلك بنفسه.**
 *    أول نسخة استعملت `luvit-ticks` و`luvit-pricelist` و`luvit-note`
 *    و`luvit-cta__actions` وكلهم مش معرّفين بـtokens.css. وأسوأ من هيك:
 *    عدّيتهم بـgrep فطلعوا «مستعملين ٢١ مرة» — **وهي مرات من ملفاتي أنا
 *    اللي ولّدتها للتو. العدّاد كان بيعد مخرَجه.**
 *    فصار الفحص جزءاً من البناء: `assertClasses()` تحت بتقرا tokens.css
 *    وبتوقف لو أي كلاس مش معرّف.
 *
 * 🔴 **ولا كلمة استعمال مخترعة.** «صباحاً ومساءً» جاية حرفياً من ظهر العلب
 *    («in your day and night routine») على المنظف والتونر والسيرومين.
 *    الروتين ما انقسم لصباحي ومسائي لأن **ما في مصدر** بيقول إنه بينقسم.
 *
 * المصادر:
 *   · الروتينات      → Highlight «Our Routines» على إنستغرام · ٢٤ حزيران
 *   · الأسعار        → `_خطة/بيانات-المنتجات-الرسمية.json` (بروفايل الصيدليات)
 *   · صياغة الادعاءات → ضوابط الاستراتيجية · «يساعد/يدعم» لا «يعالج/يزيل»
 * ============================================================================
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ROUTINES, عدد, منطوق, معرَّف, غير } from './routines.mjs';

const HERE   = path.dirname(fileURLToPath(import.meta.url));
const LIB    = path.resolve(HERE, '..', 'library');
const OUT    = path.join(LIB, 'sections');
const TOKENS = fs.readFileSync(path.join(LIB, 'tokens.css'), 'utf8');

/* ══════════════════════════════════════════════════════════════════════
   المنتجات · **بتنقرا من مصدر الحقيقة، ما بتنكتب بالإيد**
   ══════════════════════════════════════════════════════════════════════
   🔴 كانت هون خريطة مكتوبة بالإيد فيها الأسعار (١٤ · ١٣ · ١٨ · ١٩ · ١٥).
      وهاد **نفس فخ ملفات السكاشن البايتة** اللي كلّفنا صفحة كاملة:
      رقم مكتوب بمكانين بينحرف، والصفحة بتقول سعراً والسلة بتقول تاني.

   فالمصدران هما نفس مصدري صفحة المتجر:
     _وارد/woo-products.json            ← معرّف وسعر وصورة ورابط (الحي)
     _خطة/بيانات-المنتجات-الرسمية.json  ← الاسم الرسمي والنِسَب والحجم

   ⚠️ ولو ما انسحبت بيانات ووكومرس بعد، البناء بيوقف بدل ما يخترع.
   ══════════════════════════════════════════════════════════════════════ */
const REPO = path.resolve(HERE, '..');
const WOO_FILE = path.join(REPO, '_وارد', 'woo-products.json');
if (!fs.existsSync(WOO_FILE)) {
  console.error('🔴 ما لقيت _وارد/woo-products.json · اسحب بيانات ووكومرس أول');
  process.exit(1);
}
const woo = JSON.parse(fs.readFileSync(WOO_FILE, 'utf8'));
const cat = JSON.parse(fs.readFileSync(path.join(REPO, '_خطة', 'بيانات-المنتجات-الرسمية.json'), 'utf8'));

const bySlug = Object.fromEntries(woo.منتجات.map((p) => [p.slug, p]));

const P = {};
for (const rec of cat.منتجات) {
  const w = woo.منتجات.find((x) => x.id === rec.woo);
  if (!w) continue;
  /* المادة البطلة = **أول** مادة بالقائمة مش أعلى نسبة · القاعدة مشروحة
     بالتفصيل بـbuild-shop-page.mjs، وطلعت غلط بأربعة من تسعة لو أخذنا الأعلى. */
  const hero = (rec.actives || [])[0] || null;
  P[rec.sku] = {
    ar: rec.ar_رسمي || w.name,
    slug: w.slug,
    price: w.price,          /* نص من ووكومرس · مش رقم مكتوب */
    ml: rec.ml,
    id: w.id,
    img: (w.images[0] || {}).src || null,
    pct: hero ? hero.pct : null,
    active: hero ? hero.name : null,
  };
}

/* 🔴 والكتالوج **مش جرد المتجر** · هو لقطة ٩ منتجات من بروفايل الصيدليات.
   المتجر فيه ١٢ مفرداً · تلاتة أحدث منه (L103 سنتيلا · L112 واقي الشمس ·
   L119 ألفا أربوتين) موجودين بووكومرس وحده.
   وبلا هالحلقة، أي روتين فيه وحدة منهم **بيوقف البناء** بـ«SKU مش موجود».
   ⤷ الاسم والسعر والصورة من ووكومرس · و`actives` بتضل فاضية لأن النِسَب
     الرسمية مصدرها الكتالوج، وما منخترعها من وصف تسويقي. */
/* 🔴 الحجم للمنتجات اللي برّا الكتالوج · بينستخرج من ووكومرس لا بينترك فاضياً.
   بلاها كان بيطبع **`null` نصاً على الصفحة الحيّة** تحت خطوتين
   («null · عبوة كاملة») · شفتها بلقطة ١ أيلول.
   ⚠️ والأرقام بتيجي **بصيغتين**: `30ml` لاتيني، و«٥٠ مل» بأرقام عربية
      وكلمة عربية · فالسحب لازم يمسك الاثنين. */
const عربي = { '٠':'0','١':'1','٢':'2','٣':'3','٤':'4','٥':'5','٦':'6','٧':'7','٨':'8','٩':'9' };
function حجم(w) {
  const t = ((w.name || '') + ' ' + (w.short || ''))
    .replace(/[٠-٩]/g, (d) => عربي[d]);
  const m = t.match(/(\d+)\s*(?:ml|مل)/i);
  return m ? m[1] + 'ml' : null;
}

for (const w of woo.منتجات) {
  if (/^روتين /.test(w.name)) continue;              /* البكجات مش قطعاً */
  if (Object.values(P).some((x) => x.id === w.id)) continue;
  const sku = (w.sku || ('W' + w.id));
  P[sku] = {
    ar: w.name, slug: w.slug, price: w.price, ml: حجم(w), id: w.id,
    img: (w.images[0] || {}).src || null, pct: null, active: null,
    fromWooOnly: true,
  };
}

/* 🔴 الروتينات **انتقلت لـ`_أدوات/routines.mjs`** · هي المصدر الوحيد،
   وبتقرا منها كمان `build-home.mjs` و`build-shop-page.mjs`.
   كانت معرَّفة هون وبملفّين تانيين، فانحرفوا: المتجر أربعة والروتينات
   تلاتة · وريّان هو اللي مسكها ١ أيلول لا أي بوابة. */

/* ⚠️ خمسة لا أربعة · روتين توحيد اللون خطواته خمس */
const AR = ['', '١', '٢', '٣', '٤', '٥'];

/* كلاسات ووكومرس بتيجي من الإضافة مش من tokens.css · مستثناة بقصد */
const WOO = new Set(['add_to_cart_button', 'ajax_add_to_cart']);

/* 🔴 قيمة جافاسكربت فاضية بتوصل الصفحة **نصاً** · «null · عبوة كاملة»
   ظهرت تحت خطوتين بروتين توحيد اللون على الموقع الحيّ، لأن `ml` كانت
   `null` للمنتجات اللي برّا الكتالوج والقالب طبعها كما هي.
   ⚠️ ولا بوابة مسكتها: الكلاسات صحيحة والوسوم متوازنة والسعر مضبوط ·
      **الماركب كان سليماً والمحتوى كذّاب.**
   ⤷ الفحص على **النص الظاهر** لا على الماركب · وسمة اسمها data-null
     أو كلاس فيه null ما بتزعج. */
function assertNoEmpty(html, file) {
  const نص = html
    .replace(/<!--[sS]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ');
  const bad = [];
  for (const w of ['null', 'undefined', 'NaN', '[object Object]']) {
    const n = نص.split(w).length - 1;
    if (n) bad.push(w + ' ×' + n);
  }
  if (bad.length) {
    console.error('🔴 ' + file + ' · قيم فاضية وصلت النص الظاهر: ' + bad.join(' · '));
    process.exit(1);
  }
}

function assertClasses(html, file) {
  const used = new Set();
  for (const m of html.matchAll(/class="([^"]+)"/g))
    m[1].split(/\s+/).filter(Boolean).forEach((c) => used.add(c));

  const missing = [...used].filter((c) => !WOO.has(c) && !TOKENS.includes('.' + c));
  if (missing.length) {
    console.error('🔴 ' + file + ' · كلاسات مش معرّفة بـtokens.css:');
    missing.forEach((c) => console.error('     .' + c));
    process.exit(1);
  }
  return used.size;
}

function page(r) {
  const total  = r.steps.reduce((s, [k]) => s + Number(P[k].price), 0);
  const others = ROUTINES.filter((x) => x.key !== r.key);

  const featureCards = (items, icon) => items.map((t) =>
`      <article class="luvit-card luvit-card--feature">
        <div class="luvit-card__body">
          <span class="luvit-card__icon" aria-hidden="true">${icon}</span>
          <h3 class="luvit-card__title">${t}</h3>
        </div>
      </article>`).join('\n\n');

  return `<!--
  ============================================================================
  ${r.ar} · /routines/${r.key}
  ============================================================================
  ⚠ مولَّد بـ_أدوات/build-routine-pages.mjs · **لا تعدّله بالإيد.**
     عدّل البيانات بالسكربت وأعد التوليد، وإلا التعديل بيضيع بأول تشغيل.

  🔴 الروتين منشور على إنستغرام (Highlight «Our Routines» ٢٤ حزيران) ·
     مش اختراعنا. والأسعار من بروفايل الصيدليات الرسمي.

  🔴 «صباحاً ومساءً» مكتوبة على ظهر كل عبوة حرفياً · الروتين ما انقسم
     لصباحي ومسائي لأن ما في مصدر بيقول إنه بينقسم.

  🔴 ولا وعد بنتيجة ولا بمدة · الصياغة كلها «يساعد» و«يدعم».
  ============================================================================
-->

<section class="luvit-section luvit-section--tight band-mist luvit-page-top"
         data-nav-bg="light" id="page-head">
  <div class="luvit-section__inner">
    <div class="luvit-section__head" data-luvit="reveal">

      <nav aria-label="مسار التنقّل">
        <a href="/">الرئيسية</a>
        <span aria-hidden="true">›</span>
        <a href="/routines">الروتينات</a>
        <span aria-hidden="true">›</span>
        <span aria-current="page">${r.ar}</span>
      </nav>

      <p class="luvit-section__eyebrow">${r.en}</p>
      <h1 class="luvit-section__title">${r.ar}</h1>
      <p class="luvit-section__sub">${r.sub}</p>

    </div>
  </div>
</section>


<section class="luvit-section luvit-section--tight band-light" data-nav-bg="light" id="who">
  <div class="luvit-section__inner">

    <div class="luvit-section__head" data-luvit="reveal">
      <h2 class="luvit-section__title">مناسب لـ</h2>
    </div>

    <div class="luvit-card-grid" data-luvit="stagger">
${featureCards(r.who, '◇')}
    </div>

  </div>
</section>


<section class="luvit-section band-mist" data-nav-bg="light" id="steps">
  <div class="luvit-section__inner">

    <div class="luvit-section__head" data-luvit="reveal">
      <p class="luvit-section__eyebrow">Five steps</p>
      <h2 class="luvit-section__title">الخطوات الخمس</h2>
      <p class="luvit-section__sub">
        نفس الترتيب صباحاً ومساءً · زي ما مكتوب على ظهر كل عبوة.
      </p>
    </div>

    <div class="luvit-steps" data-luvit="stagger">
${r.steps.map(([k, title, role], i) => {
  const p = P[k];
  return `      <div class="luvit-step">
        <div class="luvit-step__media">
          <img decoding="async" width="800" height="1000"
               src="${p.img}" alt="${p.ar}">
        </div>
        <span class="luvit-step__num">${AR[i + 1]}</span>
        <div class="luvit-step__body">
          <h3 class="luvit-step__title">${title}</h3>
          <p class="luvit-step__text">
            <a href="/product/${p.slug}/">${p.ar}</a> · ${role}.
          </p>
          <p class="luvit-card__spec">${p.pct ? '<b>' + p.pct + ' ' + p.active + '</b>' : ''}<span class="luvit-card__vol">${p.ml}</span></p>
          <p class="luvit-step__buy">
            <span class="luvit-card__price"><span dir="ltr">${p.price}</span> د.أ</span>
            <a href="/?add-to-cart=${p.id}" rel="nofollow"
               class="luvit-btn add_to_cart_button ajax_add_to_cart"
               data-product_id="${p.id}" data-quantity="1"
               aria-label="أضيفي ${p.ar} إلى السلة">أضيفي إلى السلة</a>
          </p>
        </div>
      </div>`;
}).join('\n\n')}
    </div>

  </div>
</section>


<section class="luvit-section band-light" data-nav-bg="light" id="pack">
  <div class="luvit-section__inner">

    <div class="luvit-section__head" data-luvit="reveal">
      <h2 class="luvit-section__title">شو جوّا البكج</h2>
      <p class="luvit-section__sub">خمس عبوات كاملة · مش عيّنات. والرقم بالدينار.</p>
    </div>

    <div class="luvit-ing" data-luvit="stagger">
${r.steps.map(([k]) => {
  const p = P[k];
  return `      <div class="luvit-ing__row">
        <span class="luvit-ing__pct">${p.price}</span>
        <div class="luvit-ing__body">
          <p class="luvit-ing__name"><a href="/product/${p.slug}/">${p.ar}</a></p>
          <p class="luvit-ing__note">${p.ml} · عبوة كاملة</p>
        </div>
      </div>`;
}).join('\n\n')}

      <div class="luvit-ing__row">
        <span class="luvit-ing__pct">${total}</span>
        <div class="luvit-ing__body">
          <p class="luvit-ing__name">المجموع</p>
          <p class="luvit-ing__note">
            سعر البكج هو مجموع المنتجات ${معرَّف(r.steps.length)} بالضبط · البكج بيسهّل عليك
            الاختيار والترتيب، مش خصماً.
          </p>
        </div>
      </div>
    </div>

    <div class="luvit-section__foot">
      <a class="luvit-btn luvit-btn--arrow add_to_cart_button ajax_add_to_cart"
         href="/?add-to-cart=${r.wooId}" data-quantity="1"
         data-product_id="${r.wooId}" rel="nofollow">أضيفي البكج للسلة · ${total.toFixed(2)} د.أ</a>
      <a class="luvit-btn luvit-btn--ghost" href="/product/${r.slug}/">تفاصيل البكج</a>
    </div>

  </div>
</section>


<section class="luvit-section luvit-section--tight band-mist" data-nav-bg="light" id="benefits">
  <div class="luvit-section__inner">

    <div class="luvit-section__head" data-luvit="reveal">
      <h2 class="luvit-section__title">الفوائد</h2>
    </div>

    <div class="luvit-card-grid" data-luvit="stagger">
${featureCards(r.benefits, '✦')}
    </div>

  </div>
</section>


<!-- 🔴 الخاتمة الغامقة · نفس نمط باقي صفحات الموقع.
     أول نسخة انتهت بصف أزرار على خلفية فاتحة على بُعد ٤٨px من الفوتر،
     وريّان وصفها «الزر ملزوق بالفوتر». **والزر مش هو المشكلة** · كل
     صفحة تانية بتنتهي بشريط ماء عميق مع موجة تقصّه، وصفحاتي ما كان
     فيها خاتمة أصلاً. -->
<section class="luvit-cta luvit-deep luvit-cut-top" data-nav-bg="dark"
         data-luvit-bubbles="16" id="other">
  <span class="luvit-deep__rays" aria-hidden="true"></span>
  <div class="luvit-cta__panel" data-luvit="reveal">
    <h2 class="luvit-cta__title luvit-cta__accent">مش هاد روتينك؟</h2>
    <p class="luvit-cta__sub">
      في ${منطوق(others.length)} روتينات تانية · وكل واحد لهدف مختلف. وإذا محتارة، خمس أسئلة بتحسمها.
    </p>
    <div class="luvit-section__foot">
      <a class="luvit-btn luvit-btn--arrow" href="/quiz">جرّبي الاختبار</a>
${others.map((o) => `      <a class="luvit-btn luvit-btn--ghost luvit-btn--on-dark" href="/routines/${o.key}">${o.ar}</a>`).join('\n')}
    </div>
  </div>
</section>

<div class="luvit-wave luvit-wave--drift" style="--wave-fill:#FFFFFF;background:#0B9198" aria-hidden="true"></div>
`;
}

/* ═══════════════════════════════════════════════════════════════════════════
   صفحة الهَب · /routines
   ---------------------------------------------------------------------------
   🔴 الزبونة بتعرف **نوع بشرتها** مش «هدفها»، فالبطاقات بتحكي بالاثنين:
      العنوان هدف، وتحته سطر «مناسب لـ» بأنواع البشرة. هيك ما بتضيع وحدة
      بتدوّر على «البشرة الدهنية» وما بتلاقيها.
   ═══════════════════════════════════════════════════════════════════════════ */
/* ══ الهَب · إعادة تصميم كاملة · ١ أيلول ═══════════════════════════════
   🔴 ريّان بعد ما شاف النسخة السابقة: «ارجع عيد تصميم صفحة الروتينات
      كلها من أول وجديد · لما تشوفها حتعرف ليش». وشفتها، وعرفت.

   اللي كان غلط · وهو غلطي أنا:
     · **ست سكاشن، خمسة منها عنوان + فقرة + أيقونة.** صورة وحدة بالصفحة كلها.
     · **الروتينات — اللي إجت الزبونة عشانها — عند 1533px**، ثلث الصفحة تحت،
       بعد أربع سكاشن متتالية كلها أنا بشرح.
     · **قلت رح أوري الآلية وكتبت فقرة لكل خطوة.**
     · ولا أثر للغة العلامة: أبيض ← باهت ← أبيض. وباقي الصفحات فيها
       عمق وموجات وحبيبات.

   🔴 الخلاصة: **بنيت صفحة بتشرح بدل صفحة بتوري** · وهاي حرفياً نفس
      شكوى ريّان الأصلية عن النسخة القديمة. عملتها مختلفة مش أحسن.

   واللي تغيّر:
     ١ · **الروتينات أول شي** · بعبواتها وأسعارها · لا محاضرة قبلها.
     ٢ · **الآلية بتنعرض بالعبوات** · أربع صور بترتيبها لا أربع فقرات.
     ٣ · كل روتين إله حضور: عبواته · سعره · وزر.
     ٤ · النصّ اللي بيشرح انضغط لسطر جوّا السكشن، مش سكشناً لحاله.
   ══════════════════════════════════════════════════════════════════════ */
function hub() {
  /* عبوات الروتين · بتنسحب من نفس مصدر الأسعار · وعددها من الروتين لا مكتوب */
  const bottles = (r) => r.steps.map(([k], n) =>
    `<li class="luvit-step"><span class="luvit-step__num">${AR[n + 1]}</span><span class="luvit-step__media"><img src="${P[k].img}" alt="${P[k].ar}" width="400" height="500" loading="lazy" decoding="async"></span><span class="luvit-step__body"><span class="luvit-step__title">${P[k].ar}</span><span class="luvit-step__text">${r.steps[n][1]}</span></span></li>`).join("");

  return `<!--
  ============================================================================
  الروتينات · /routines
  ============================================================================
  ⚠ مولَّد بـ_أدوات/build-routine-pages.mjs · لا تعدّله بالإيد.
  ============================================================================
-->

<section class="luvit-section luvit-deep luvit-page-top rt-head"
         data-nav-bg="dark" data-luvit-bubbles="14" id="page-head">
  <span class="luvit-deep__rays" aria-hidden="true"></span>
  <div class="luvit-section__inner">
    <div class="luvit-section__head luvit-section__head--start" data-luvit="reveal">

      <nav aria-label="مسار التنقّل">
        <a href="/">الرئيسية</a>
        <span aria-hidden="true">›</span>
        <span aria-current="page">الروتينات</span>
      </nav>

      <p class="luvit-section__eyebrow">Our routines</p>
      <h1 class="luvit-section__title">روتين كامل · مرتّب ومحسوب</h1>
      <p class="luvit-section__sub">
        أربع خطوات بترتيبها الصح · وخمس بروتين توحيد اللون لأن الحماية جزء منه · وسعر الروتين مجموع قطعه بالضبط.
        اختاري هدفك وإحنا رتّبنا الباقي.
      </p>

      <!-- 🔴 الترتيب **بينعرض** هون · وهو أطروحة الصفحة كلها -->
      <ol class="rt-flow" data-luvit="stagger">
        <li class="rt-flow__item">
          <span class="rt-flow__dot">١</span>
          <span class="rt-flow__label">تنظيف</span>
          <span class="rt-flow__note">بشرة نضيفة عشان اللي بعده يوصل</span>
        </li>
        <li class="rt-flow__item">
          <span class="rt-flow__dot">٢</span>
          <span class="rt-flow__label">تونر</span>
          <span class="rt-flow__note">بيهيّئها تمتصّ بدل ما يقعد عالسطح</span>
        </li>
        <li class="rt-flow__item">
          <span class="rt-flow__dot">٣</span>
          <span class="rt-flow__label">سيروم</span>
          <span class="rt-flow__note">هون بيشتغل على همّك · وهو اللي بيتغيّر</span>
        </li>
        <li class="rt-flow__item">
          <span class="rt-flow__dot">٤</span>
          <span class="rt-flow__label">ترطيب</span>
          <span class="rt-flow__note">بيقفل الشغل كله جوّا البشرة</span>
        </li>
      </ol>

    </div>
  </div>
</section>

<!-- 🔴 background لازم يطابق آخر لون بتدرّج .luvit-deep بالضبط · #0B9198 -->
<div class="luvit-wave" style="--wave-fill:#FFFFFF;background:#0B9198" aria-hidden="true"></div>


<!-- ═══════════ الروتينات · **أول شي** لا بعد أربع سكاشن شرح ═══════════ -->
<section class="luvit-section band-light" data-nav-bg="light" id="routines">
  <div class="luvit-section__inner">

${ROUTINES.map((r, ri) => {
  const total = r.steps.reduce((s, [k]) => s + Number(P[k].price), 0);
  const pack = woo.منتجات.find((x) => x.id === r.wooId);
  if (!pack || !pack.images.length) {
    console.error(String.fromCharCode(0x1F534) + " ما لقيت صورة بكج " + r.key);
    process.exit(1);
  }
  return `    <article class="luvit-card luvit-card--feature luvit-card--routine" data-goal="${r.key}" data-luvit="reveal">

      <div class="luvit-card__media">
        <img src="${pack.images[0].src}" alt="${r.ar}"
             width="1000" height="1000" loading="${ri === 0 ? "eager" : "lazy"}" decoding="async">
      </div>

      <div class="luvit-card__body">
        <p class="luvit-card__eyebrow">${r.en}</p>
        <h2 class="luvit-card__title">
          <a class="luvit-card__link" href="/routines/${r.key}">${r.ar}</a>
        </h2>
        <p class="luvit-card__text">${r.sub}</p>

        <!-- 🔴 العبوات نفسها · مش وصفاً إلها. هاد الفرق كله بين النسختين. -->
        <ol class="luvit-steps luvit-steps--compact">
${bottles(r)}
        </ol>

        <div class="luvit-card__footer">
          <span class="luvit-card__price"><span dir="ltr">${total.toFixed(2)}</span> د.أ</span>
          <a class="luvit-btn luvit-btn--arrow" href="/routines/${r.key}">شوفي الروتين</a>
        </div>
      </div>

    </article>`;
}).join("\n\n")}

  </div>
</section>


<!-- ═══════════ ليش الترتيب · **سطران** لا سكشن محاضرة ═══════════ -->
<section class="luvit-section band-mist" data-nav-bg="light" id="why">
  <div class="luvit-section__inner">
    <div class="luvit-section__head luvit-section__head--start" data-luvit="reveal">
      <h2 class="luvit-section__title">نفس القطع بترتيب غلط بتعطي أقل</h2>
      <p class="luvit-section__sub">
        سيروم على بشرة مش محضّرة بينمتصّ أقل · وكريم بلا تونر قبله بيقفل
        على بشرة ناشفة. الترتيب مش تفضيلاً، هو اللي بيخلّي كل خطوة تشتغل.
      </p>
    </div>

    <div class="luvit-trust" data-luvit="stagger">
      <div class="luvit-trust__item">
        <p class="luvit-trust__title">بتنباع بالصيدليات الأردنية</p>
        <p class="luvit-trust__note">الصيدلية ما بتحطّ على رفّها بضاعة ما بتنباع.</p>
      </div>
      <div class="luvit-trust__item">
        <p class="luvit-trust__title">التوصيل مجاني مع أي روتين</p>
        <p class="luvit-trust__note">دينارين على القطعة المفردة · وصفر مع الروتين.</p>
      </div>
      <div class="luvit-trust__item">
        <p class="luvit-trust__title">وسعره مجموع قطعه</p>
        <p class="luvit-trust__note">ما منرفع السعر عشان ننزّله · بتشوفي التفصيل بصفحته.</p>
      </div>
      <div class="luvit-trust__item">
        <p class="luvit-trust__title">وبتدفعي وقت الاستلام</p>
        <p class="luvit-trust__note">افتحي الطرد وشوفي الختوم قدام المندوب.</p>
      </div>
    </div>
  </div>
</section>


<section class="luvit-cta luvit-deep luvit-cut-top" data-nav-bg="dark"
         data-luvit-bubbles="16" id="unsure">
  <span class="luvit-deep__rays" aria-hidden="true"></span>
  <div class="luvit-cta__panel" data-luvit="reveal">
    <h2 class="luvit-cta__title luvit-cta__accent">مش متأكدة أي واحد يناسبك؟</h2>
    <p class="luvit-cta__sub">
      خمس أسئلة عن بشرتك، ومنقولك أي روتين يناسبها وليش.
    </p>
    <div class="luvit-section__foot">
      <a class="luvit-btn luvit-btn--arrow" href="/quiz">ابدئي الاختبار</a>
      <a class="luvit-btn luvit-btn--ghost luvit-btn--on-dark" href="/products">شوفي التشكيلة كاملة</a>
    </div>
  </div>
</section>

<div class="luvit-wave luvit-wave--drift" style="--wave-fill:#FFFFFF;background:#0B9198" aria-hidden="true"></div>
`;
}
/* ══ فاحص واحد لكل الصفحات ═══════════════════════════════════════════
   🔴 كان الفحص بيشتغل **على صفحات الروتين وحدها** · والهَب بيمرّ بفحص
      الكلاسات وبس. يعني أوسع صفحة بالقسم كانت أقلّهن فحصاً.

   ⚠️ والنجمات بتنفحص **بعد شيل التعليقات**: تعليقات المطوّر مليانة
      **تشديد** بالماركداون، وbuild-page.js بيشيل التعليقات أصلاً فما
      بتوصل الزائرة. فحص بلا هالاستثناء بيطلّع إنذاراً كاذباً بكل بناء،
      والفاحص المزعج بينتجاهل وبعدها بينشال.                            */
function validate(html, file) {
  const problems = [];
  const visible = html.replace(/<!--[\s\S]*?-->/g, "");

  if ((html.match(/<h1[\s>]/g) || []).length > 1) problems.push("أكثر من h1");
  if (visible.includes("—")) problems.push("شرطة طويلة");
  if (/href="#"/.test(html)) problems.push("رابط ميت");
  if (/\*\*[^*\n]+\*\*/.test(visible)) problems.push("نجمات ماركداون بالمحتوى المرئي");
  for (const tag of ["section", "div", "nav", "article", "h1", "h2", "h3", "a", "p", "span", "ol", "li"]) {
    const o = (html.match(new RegExp("<" + tag + "(?=[\\s>])", "g")) || []).length;
    const c = (html.match(new RegExp("</" + tag + ">", "g")) || []).length;
    if (o !== c) problems.push("<" + tag + "> مش متوازن: " + o + "/" + c);
  }
  if (problems.length) {
    problems.forEach((x) => console.error(String.fromCharCode(0x1F534) + " " + file + " · " + x));
    process.exit(1);
  }
}

let n = 0;for (const r of ROUTINES) {
  const html = page(r);
  validate(html, r.file);

  const nClasses = assertClasses(html, r.file);
  assertNoEmpty(html, r.file);
  fs.writeFileSync(path.join(OUT, r.file), html, 'utf8');
  const total = r.steps.reduce((s, [k]) => s + Number(P[k].price), 0);
  console.log(`✅ ${r.file.padEnd(22)} ${String(total).padStart(2)} د.أ · ${nClasses} كلاس كلهم معرّفين · ${html.length} حرف`);
  n++;
}
/* الهَب */
const hubHtml = hub();
validate(hubHtml, 'r0-hub.html');
const hubClasses = assertClasses(hubHtml, 'r0-hub.html');
  assertNoEmpty(hubHtml, 'r0-hub.html');
fs.writeFileSync(path.join(OUT, 'r0-hub.html'), hubHtml, 'utf8');
console.log(`✅ ${'r0-hub.html'.padEnd(22)} الهَب · ${hubClasses} كلاس كلهم معرّفين · ${hubHtml.length} حرف`);

/* ══ المعاينة الكاملة · بتنكتب من نفس المصدر ═══════════════════════════
   🔴 ليش هون وليش آلياً:
   `library/routines-hub-preview.html` كانت **نسخة يدوية** من نفس السكشن.
   ونسختان لنفس المحتوى بتنحرفا بصمت: المولّد بيتحدّث والمعاينة بتضل قديمة،
   فبتحكم على شكل مش موجود. صار معنا بنفس اليوم مع الهيرو (ثلاث نسخ)
   ومع صفحات السكاشن.

   فالمعاينة صارت **مخرَجاً** لا مصدراً: بنستبدل جوّا <main> وبس، والقشرة
   (الترويسة والفوتر والسكربتات) بتضل زي ما هي لأنها مشتركة مع باقي
   المعاينات.                                                            */
const PREVIEW = path.join(LIB, "routines-hub-preview.html");
if (fs.existsSync(PREVIEW)) {
  const shell = fs.readFileSync(PREVIEW, "utf8");
  const a = shell.indexOf("<main id=\"main\">");
  const b = shell.indexOf("</main>", a);
  if (a === -1 || b === -1) {
    console.error("🔴 المعاينة بلا <main> · ما انتحدّثت");
    process.exit(1);
  }
  const open = "<main id=\"main\">";
  const next = shell.slice(0, a + open.length) + "\n\n" + hubHtml + "\n\n" + shell.slice(b);
  fs.writeFileSync(PREVIEW, next, "utf8");
  console.log("✅ " + "routines-hub-preview".padEnd(22) + " المعاينة انتحدّثت من نفس المصدر");
} else {
  console.error("🔴 ما لقيت routines-hub-preview.html");
  process.exit(1);
}

console.log('');
console.log((n + 1) + ' صفحات · متوازنة · بلا روابط ميتة · بلا كلاس مخترع');

/* ══════════════════════════════════════════════════════════════════════
   محتوى صفحات ووردبريس · جاهز للتركيب
   ══════════════════════════════════════════════════════════════════════
   ⚠️ وصفحات الروتينات **بلوك wp:html واحد** بكل سكاشنها · مش بلوك لكل
      سكشن زي صفحة المتجر. مقيس على الحي: صفحة الهَب بلوك واحد وتلات
      سكاشن، وكل صفحة روتين بلوك واحد وستة.
      كتابتها بثمانية بلوكات بتشتغل، بس بتغيّر شكل المحرّر عن اللي
      ريّان متعوّد عليه بلا سبب.
   ══════════════════════════════════════════════════════════════════════ */
const PAGE_IDS = { 'r0-hub.html': 211, 'rt1-hydration.html': 213,
                   'rt2-glow.html': 214, 'rt3-clarify.html': 212,
                   'rt4-eventone.html': 368 };

const INBOX = path.join(path.resolve(HERE, '..'), '_وارد');
fs.mkdirSync(INBOX, { recursive: true });
let shipped = 0;
for (const [file, id] of Object.entries(PAGE_IDS)) {
  const src = fs.readFileSync(path.join(OUT, file), 'utf8');
  /* تعليق الترويسة بينشال · هو للمطوّر مش للصفحة */
  const body = src.replace(/^<!--[\s\S]*?-->\s*/, '').trim();
  const wp = '<!-- wp:html -->\n' + body + '\n<!-- /wp:html -->';
  fs.writeFileSync(path.join(INBOX, 'page' + id + '-content.html'), wp, 'utf8');
  shipped++;
}
console.log('\n✅ ' + shipped + ' صفحة جاهزة للتركيب بـ_وارد/');
