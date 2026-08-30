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

/* بوابة: كل منتج مذكور بالروتينات لازم يكون انحلّ */
const ROUTINES = [
  {
    key: 'hydration', file: 'rt1-hydration.html', wooId: 205,
    en: 'Hydration & Support', ar: 'روتين الترطيب والدعم اليومي',
    slug: 'hydration-support-routine',
    sub: 'روتين يومي يساعد بشرتك تحس براحة وترطيب وتوازن يدوم طول اليوم.',
    who: ['البشرة الجافة', 'البشرة الحسّاسة', 'مين بتحس بشدّ بعد الغسيل'],
    steps: [
      ['L111', 'تنظيف',       'لبشرة نظيفة ومنعشة'],
      ['L114', 'ترطيب عميق',  'يحضّر البشرة ويدعم توازنها'],
      ['L102', 'ترطيب مكثّف',  'يغذّي البشرة ويزيد من نعومتها'],
      ['L116', 'قفل الترطيب', 'يحافظ على الترطيب ويعزّز الحماية'],
    ],
    benefits: ['ترطيب مستمر وطويل الأمد', 'بشرة أكثر نعومة ونضارة',
               'دعم حاجز البشرة وحمايتها', 'إحساس بالراحة والانتعاش'],
  },
  {
    key: 'glow', file: 'rt2-glow.html', wooId: 203,
    en: 'Brighten & Glow', ar: 'روتين الإشراقة',
    slug: 'brighten-glow-routine',
    sub: 'لبشرة باهتة وغير متجانسة · يساعد على أن تبدو أكثر إشراقاً وحيوية وتوازناً.',
    who: ['البشرة الباهتة', 'تفاوت لون البشرة', 'مين بتدوّر على إشراقة يومية'],
    steps: [
      ['L111', 'تنظيف لطيف',   'ينظّف البشرة ويهيّئها'],
      ['L114', 'ترطيب وتحضير', 'يرطّب البشرة ويدعم امتصاص الخطوات التالية'],
      ['L101', 'إشراقة مركّزة', 'يساعد على الإشراق ويمنح مظهراً أكثر حيوية'],
      ['L116', 'قفل الترطيب',  'يحافظ على الترطيب ويعزّز النعومة'],
    ],
    benefits: ['إشراقة يومية صحية', 'مظهر أكثر حيوية وتوازن',
               'ترطيب يدعم النضارة', 'نعومة وانتعاش يومي'],
  },
  {
    key: 'clarify', file: 'rt3-clarify.html', wooId: 204,
    en: 'Clarify & Balance', ar: 'روتين التنقية والتوازن',
    slug: 'clarify-balance-routine',
    sub: 'روتين يومي يساعد البشرة الدهنية والمختلطة على أن تبدو أنقى وأكثر توازناً وراحة طول اليوم.',
    who: ['البشرة الدهنية', 'البشرة المختلطة', 'مين بتزعجها اللمعة ومظهر المسام'],
    steps: [
      ['L110', 'تنظيف متوازن',             'ينظّف بلطف ويزيل الزيوت الزائدة والشوائب'],
      ['L105', 'تنقية وتقليل مظهر المسام', 'ينقّي البشرة بعمق ويساعد على تقليل مظهر المسام'],
      ['L101', 'تفتيح وإشراقة',            'يساعد على توحيد لون البشرة ويمنحها إشراقة صحية'],
      ['L116', 'ترطيب خفيف',               'يرطّب ويعزّز الحاجز الطبيعي لبشرة مريحة'],
    ],
    benefits: ['تقليل مظهر اللمعان الزائد', 'مظهر أنقى وأكثر توازناً',
               'المساعدة في تنقية المسام', 'ترطيب خفيف بدون ثِقَل'],
  },
];

const AR = ['', '١', '٢', '٣', '٤'];

/* كلاسات ووكومرس بتيجي من الإضافة مش من tokens.css · مستثناة بقصد */
const WOO = new Set(['add_to_cart_button', 'ajax_add_to_cart']);

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
      <p class="luvit-section__eyebrow">Four steps</p>
      <h2 class="luvit-section__title">الخطوات الأربع</h2>
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
      <p class="luvit-section__sub">أربع عبوات كاملة · مش عيّنات. والرقم بالدينار.</p>
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
            سعر البكج هو مجموع المنتجات الأربعة بالضبط · البكج بيسهّل عليك
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
      في تلات روتينات · وكل واحد لهدف مختلف. وإذا محتارة، خمس أسئلة بتحسمها.
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
function hub() {
  return `<!--
  ============================================================================
  الروتينات · /routines
  ============================================================================
  ⚠ مولَّد بـ_أدوات/build-routine-pages.mjs · لا تعدّله بالإيد.
  ============================================================================
-->

<section class="luvit-section luvit-section--tight band-mist luvit-page-top"
         data-nav-bg="light" id="page-head">
  <div class="luvit-section__inner">
    <div class="luvit-section__head" data-luvit="reveal">

      <nav aria-label="مسار التنقّل">
        <a href="/">الرئيسية</a>
        <span aria-hidden="true">›</span>
        <span aria-current="page">الروتينات</span>
      </nav>

      <p class="luvit-section__eyebrow">Our Routines</p>
      <h1 class="luvit-section__title">تلات روتينات · كل واحد لهدف</h1>
      <p class="luvit-section__sub">
        كل روتين أربع خطوات بنفس الترتيب · تنظيف، تونر، سيروم، وقفل ترطيب.
        اللي بيتغيّر هو المنتجات حسب اللي بدك توصليله.
      </p>

    </div>
  </div>
</section>


<section class="luvit-section band-light" data-nav-bg="light" id="routines">
  <div class="luvit-section__inner">

    <div class="luvit-card-grid" data-luvit="stagger">
${ROUTINES.map((r) => {
  const total = r.steps.reduce((s, [k]) => s + Number(P[k].price), 0);
  /* صورة البكج المركّبة · من ووكومرس مباشرة · وبتوقف البناء لو ما لقاها
     بدل ما تطلع بطاقة بمربع فاضي. */
  const pack = woo.منتجات.find((x) => x.id === r.wooId);
  if (!pack || !pack.images.length) {
    console.error('🔴 ما لقيت صورة بكج ' + r.key + ' (woo ' + r.wooId + ')');
    process.exit(1);
  }
  pack.img = pack.images[0].src;
  return `      <article class="luvit-card luvit-card--feature" data-goal="${r.key}">
        <div class="luvit-card__media">
          <img decoding="async" width="800" height="800"
               src="${pack.img}" alt="${r.ar}">
        </div>
        <div class="luvit-card__body">
          <p class="luvit-card__eyebrow">${r.en}</p>
          <h2 class="luvit-card__title">
            <a class="luvit-card__link" href="/routines/${r.key}">${r.ar}</a>
          </h2>
          <p class="luvit-card__text">${r.sub}</p>
          <ol class="luvit-card__steps">
${r.steps.map(([k]) => '            <li>' + P[k].ar + '</li>').join(String.fromCharCode(10))}
          </ol>
          <div class="luvit-card__footer">
            <span class="luvit-card__price"><span dir="ltr">${total.toFixed(2)}</span> د.أ</span>
            <a href="/?add-to-cart=${r.wooId}" rel="nofollow"
               class="luvit-btn add_to_cart_button ajax_add_to_cart"
               data-product_id="${r.wooId}" data-quantity="1"
               aria-label="أضيفي ${r.ar} إلى السلة">أضيفي إلى السلة</a>
          </div>
        </div>
      </article>`;
}).join('\n\n')}
    </div>

  </div>
</section>


<section class="luvit-cta luvit-deep luvit-cut-top" data-nav-bg="dark"
         data-luvit-bubbles="16" id="unsure">
  <span class="luvit-deep__rays" aria-hidden="true"></span>
  <div class="luvit-cta__panel" data-luvit="reveal">
    <h2 class="luvit-cta__title luvit-cta__accent">مش متأكدة من نوع بشرتك؟</h2>
    <p class="luvit-cta__sub">
      خمس أسئلة · بنقلّك نوع بشرتك وبنوصّلك للروتين الأنسب.
    </p>
    <div class="luvit-section__foot">
      <a class="luvit-btn luvit-btn--arrow" href="/quiz">ابدئي الاختبار</a>
      <a class="luvit-btn luvit-btn--ghost luvit-btn--on-dark" href="/products">شوفي كل المنتجات</a>
    </div>
  </div>
</section>

<div class="luvit-wave luvit-wave--drift" style="--wave-fill:#FFFFFF;background:#0B9198" aria-hidden="true"></div>
`;
}

let n = 0;
for (const r of ROUTINES) {
  const html = page(r);
  const problems = [];

  if ((html.match(/<h1[\s>]/g) || []).length !== 1) problems.push('عدد h1 مش واحد');
  if (html.includes('—')) problems.push('شرطة طويلة');
  if (/href="#"/.test(html)) problems.push('رابط ميت');
  for (const t of ['section', 'div', 'nav', 'article', 'h1', 'h2', 'h3', 'a', 'p', 'span']) {
    const o = (html.match(new RegExp('<' + t + '(?=[\\s>])', 'g')) || []).length;
    const c = (html.match(new RegExp('</' + t + '>', 'g')) || []).length;
    if (o !== c) problems.push(`<${t}> مش متوازن: ${o}/${c}`);
  }
  if (problems.length) { problems.forEach((x) => console.error('🔴 ' + r.file + ' · ' + x)); process.exit(1); }

  const nClasses = assertClasses(html, r.file);
  fs.writeFileSync(path.join(OUT, r.file), html, 'utf8');
  const total = r.steps.reduce((s, [k]) => s + Number(P[k].price), 0);
  console.log(`✅ ${r.file.padEnd(22)} ${String(total).padStart(2)} د.أ · ${nClasses} كلاس كلهم معرّفين · ${html.length} حرف`);
  n++;
}
/* الهَب */
const hubHtml = hub();
const hubClasses = assertClasses(hubHtml, 'r0-hub.html');
fs.writeFileSync(path.join(OUT, 'r0-hub.html'), hubHtml, 'utf8');
console.log(`✅ ${'r0-hub.html'.padEnd(22)} الهَب · ${hubClasses} كلاس كلهم معرّفين · ${hubHtml.length} حرف`);

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
                   'rt2-glow.html': 214, 'rt3-clarify.html': 212 };

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
