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

const P = {
  L111: { ar: 'غسول البشرة الجافة والحساسة',  slug: 'hydrating-gel-cleanser',           price: 14, ml: '200ml' },
  L110: { ar: 'غسول البشرة الدهنية',          slug: 'sebum-balancing-gel-cleanser',     price: 14, ml: '200ml' },
  L114: { ar: 'تونر البشرة الجافة والحساسة',  slug: '8d-hyaluronic-acid-toner',         price: 13, ml: '200ml' },
  L105: { ar: 'تونر تضييق المسامات',          slug: 'clarifying-pore-tightening-toner', price: 13, ml: '200ml' },
  L102: { ar: 'سيروم الترطيب المكثّف',         slug: 'intensive-hydrating-serum',        price: 18, ml: '30ml' },
  L101: { ar: 'سيروم فيتامين سي',             slug: 'vitamin-c-serum',                  price: 19, ml: '30ml' },
  L116: { ar: 'كريم الترطيب والترميم',         slug: 'moisturizing-repairing-cream',     price: 15, ml: '75ml' },
};

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
  const total  = r.steps.reduce((s, [k]) => s + P[k].price, 0);
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
        <span class="luvit-step__num">${AR[i + 1]}</span>
        <div class="luvit-step__body">
          <h3 class="luvit-step__title">${title}</h3>
          <p class="luvit-step__text">
            <a href="/product/${p.slug}/">${p.ar}</a> · ${role}.
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
         data-product_id="${r.wooId}" rel="nofollow">أضيفي البكج للسلة · ${total}.00 د.أ</a>
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


<section class="luvit-section luvit-section--tight band-light" data-nav-bg="light" id="other">
  <div class="luvit-section__inner">

    <div class="luvit-section__head" data-luvit="reveal">
      <h2 class="luvit-section__title">مش هاد روتينك؟</h2>
      <p class="luvit-section__sub">في تلات روتينات · وكل واحد لهدف مختلف.</p>
    </div>

    <div class="luvit-section__foot">
${others.map((o) => `      <a class="luvit-btn luvit-btn--ghost" href="/routines/${o.key}">${o.ar}</a>`).join('\n')}
      <a class="luvit-btn luvit-btn--arrow" href="/quiz">جرّبي الاختبار</a>
    </div>

  </div>
</section>
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
  const total = r.steps.reduce((s, [k]) => s + P[k].price, 0);
  return `      <article class="luvit-card luvit-card--feature">
        <div class="luvit-card__body">
          <p class="luvit-card__eyebrow">${r.en}</p>
          <h2 class="luvit-card__title">
            <a class="luvit-card__link" href="/routines/${r.key}">${r.ar}</a>
          </h2>
          <p class="luvit-card__text">${r.sub}</p>
          <p class="luvit-card__text">مناسب لـ ${r.who.slice(0, 2).join(' و')}.</p>
          <div class="luvit-card__footer">
            <span class="luvit-card__price">${total}.00 د.أ</span>
          </div>
        </div>
      </article>`;
}).join('\n\n')}
    </div>

  </div>
</section>


<section class="luvit-section luvit-section--tight band-mist" data-nav-bg="light" id="unsure">
  <div class="luvit-section__inner">

    <div class="luvit-section__head" data-luvit="reveal">
      <h2 class="luvit-section__title">مش متأكدة من نوع بشرتك؟</h2>
      <p class="luvit-section__sub">
        خمس أسئلة · بنقلّك نوع بشرتك وبنوصّلك للروتين الأنسب.
      </p>
    </div>

    <div class="luvit-section__foot">
      <a class="luvit-btn luvit-btn--arrow" href="/quiz">ابدئي الاختبار</a>
      <a class="luvit-btn luvit-btn--ghost" href="/products">شوفي كل المنتجات</a>
    </div>

  </div>
</section>
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
  const total = r.steps.reduce((s, [k]) => s + P[k].price, 0);
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
