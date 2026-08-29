#!/usr/bin/env node
/**
 * ============================================================================
 * مولّد صفحة المتجر الموحّدة · build-shop-page.mjs
 * ============================================================================
 * الدمج · ريّان ٣٠ آب: «ندمجهم بصفحة وحدة قوية.»
 * ومعياره الثلاثي: **حلو ومجدي وبيبيع** · تلاتة مش واحد.
 *
 *   node _أدوات/build-shop-page.mjs
 *
 * المخرَج: library/sections/p1-*.html حتى p8-*.html
 *          + library/products-preview.html  (معاينة محلية مجمّعة)
 *
 * ── ليش مولّد أصلاً ──────────────────────────────────────────────────────
 * الملفات القديمة كانت **بايتة**: «منظف هيدرا اللطيف» بـ١٢ دينار وسيروم
 * فيتامين سي بـ٢٢، والحقيقة ١٤ و١٩. والصور كانت SVG مرسومة بالكود بينما
 * على الموقع صور حقيقية. يعني الملف اللي المفروض يكون مصدر اللصق **كان
 * بيكذب**، وأي تعديل يدوي عليه بيثبّت الكذبة.
 *
 * فالمولّد بيقرا من مصدرين، وما بيخترع ولا رقم:
 *   `_خطة/بيانات-المنتجات-الرسمية.json`  ← أسماء ونِسَب وأحجام وشهادات
 *                                          (انقرأت صفحة صفحة من بروفايل الصيدلية)
 *   `_وارد/woo-products.json`             ← معرّفات وأسعار وصور من الموقع الحي
 *                                          (بينسحب بممر serve.js · شوف الترويسة هناك)
 *
 * 🔴 **السعر بيجي من ووكومرس دايماً** · لأنه هو اللي بينحسب بالسلة. سعر
 *    مكتوب بالـHTML بينحرف عن السلة أول ما يتغيّر، والزبونة بتشوف رقمين.
 * ============================================================================
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '..');
const SECTIONS = path.join(REPO, 'library', 'sections');
const TOKENS = path.join(REPO, 'library', 'tokens.css');

const woo = JSON.parse(fs.readFileSync(path.join(REPO, '_وارد', 'woo-products.json'), 'utf8'));
const cat = JSON.parse(fs.readFileSync(path.join(REPO, '_خطة', 'بيانات-المنتجات-الرسمية.json'), 'utf8'));

/* ── ١ · الدمج ─────────────────────────────────────────────────────────
   الكتالوج مفهرس بـ`woo` (معرّف المنتج بووكومرس) · وهو الجسر الوحيد
   الموثوق بين المصدرين. الأسماء بتختلف بين الاثنين فما بتصلح مفتاحاً. */
const byWoo = Object.fromEntries(cat.منتجات.map((p) => [p.woo, p]));
const uncatalogued = new Set(cat.بلا_كتالوج.map((p) => p.woo));

/* ترتيب الاستعمال · وهو ترتيب الشبكة كمان.
   🔴 الفكرة إن **التصفّح نفسه بيعلّم الروتين**: الزبونة بتنزل بالشبكة
      فبتمشي بالروتين من أوله لآخره، وبتشوف شو ناقصها بلا ما تفتح صفحة.
      ولا واحد من المراجع الخمسة بيرتّب هيك · كلهم بالفئة أو بالمبيعات. */
const STEPS = {
  CLEANSERS:           { n: 1, label: 'تنظيف' },
  TONERS:              { n: 2, label: 'توازن' },
  SERUMS:              { n: 3, label: 'علاج' },
  'TOPICAL TREATMENT': { n: 3, label: 'علاج' },
  CREAMS:              { n: 4, label: 'ترطيب' },
};
/* المنتجان اللي مش بالكتالوج · خطوتهم من طبيعتهم مش من تخمين:
   سيروم بيوضع بعد التونر، وكريم للبقع علاج موضعي. */
const STEP_FALLBACK = { 276: { n: 3, label: 'علاج' }, 282: { n: 3, label: 'علاج' } };

/** المادة الفعّالة البطلة · وهي بديل النجوم على البطاقة.
 *  رقم **قابل للفحص على العبوة**، وأقوى من نجمة مجهولة المصدر.
 *
 *  🔴 والاختيار **بأول مادة بالقائمة، مش بأعلى نسبة**. جرّبت «الأعلى» أول
 *     وطلعت غلط بأربعة من تسعة:
 *       غسول البشرة الدهنية      → «١٪ شاي أخضر»  والبطل ٠.٥٪ ساليسيليك
 *       غسول الجافة والحساسة     → «٠.٨٪ نياسيناميد» والبطل هيالورونيك
 *       سيروم الترطيب المكثّف    → «٥٪ بانثينول»  والبطل ٢٪ هيالورونيك
 *     يعني الرقم الأكبر مش هو سبب الشراء · والكتالوج بيسرد البطلة **أول**
 *     بكل المنتجات التسعة. فالترتيب معلومة، مش صدفة، وبنحترمه.
 *     ⚠️ ولو انقلب الترتيب بنسخة كتالوج جاية، بينكسر هون بصمت · القاعدة
 *        مكتوبة عشان اللي بعدي يعرف على شو معتمدة. */
function topActive(rec, wooProduct) {
  if (rec && rec.actives && rec.actives.length) {
    const hero = rec.actives[0];
    return { pct: hero.pct, name: hero.name };
  }
  /* المنتجان بلا كتالوج · نِسَبهم مكتوبة بوصف ووكومرس نفسه، فبتنقرا منه
     بدل ما تُخترع. الصيغة: «2% ألفا أربوتين · 3% حمض ترانيكساميك · … · 30ml» */
  const m = (wooProduct.short || '').match(/(\d+(?:\.\d+)?%)\s*([^·]+)/);
  return m ? { pct: m[1].trim(), name: m[2].trim() } : null;
}

function volume(rec, wooProduct) {
  if (rec && rec.ml) return rec.ml;
  const m = (wooProduct.short || '').match(/(\d+\s*ml)\s*$/i);
  return m ? m[1].replace(/\s+/g, '') : null;
}

const CERT_AR = cat.شهادات;
function certs(rec) {
  if (!rec || !rec.certs) return null;
  const names = rec.certs.map((c) => CERT_AR[c]).filter(Boolean).slice(0, 3);
  return names.length ? names.join(' · ') : null;
}

const singles = woo.منتجات
  .filter((p) => p.cats.includes('singles'))
  .map((p) => {
    const rec = byWoo[p.id] || null;
    const step = rec ? STEPS[rec.cat] : STEP_FALLBACK[p.id];
    return {
      ...p,
      rec,
      step: step || { n: 3, label: 'علاج' },
      active: topActive(rec, p),
      ml: volume(rec, p),
      certs: certs(rec),
      inCatalogue: !!rec,
      /* 🔴 التنبيه على سيروم التقشير وحده · وعلى البطاقة مش بصفحة المنتج */
      warn: rec && rec.cat === 'TOPICAL TREATMENT' ? 'مرتين بالأسبوع · مش يومي' : null,
    };
  })
  .sort((a, b) => a.step.n - b.step.n || parseFloat(a.price) - parseFloat(b.price));

const packages = woo.منتجات
  .filter((p) => p.cats.includes('packages'))
  .map((p) => ({ ...p, parts: (p.short || '').split('+').map((s) => s.trim()).filter(Boolean) }));

/* ── ٢ · أدوات ماركب ──────────────────────────────────────────────── */
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
/** لاتيني جوّا عربي · بلا عزل بينقلب.
 *  ⚠️ نفس فخ اسم العلامة اللي ظهر مقلوباً بكل صفحة لأشهر (٩ آب). */
const ltr = (s) => `<span dir="ltr">${esc(s)}</span>`;

function productCard(p) {
  const img = p.images[0];
  const parts = [];
  parts.push('      <article class="luvit-card luvit-card--product">');
  parts.push('        <div class="luvit-card__media">');
  if (p.active) {
    parts.push(`          <span class="luvit-card__badge">${ltr(p.active.pct)} ${esc(p.active.name)}</span>`);
  }
  parts.push(`          <img loading="lazy" decoding="async" width="800" height="1000"`);
  parts.push(`               src="${esc(img.src)}" alt="${esc(p.name)}">`);
  parts.push('        </div>');
  parts.push('        <div class="luvit-card__body">');
  parts.push('          <div class="luvit-card__head">');
  parts.push(`            <span class="luvit-card__step" aria-hidden="true">${p.step.n}</span>`);
  parts.push('            <p class="luvit-card__spec">');
  parts.push(`              <b>${esc(p.step.label)}</b>`);
  if (p.ml) parts.push(`              <span class="luvit-card__vol">${esc(p.ml)}</span>`);
  parts.push('            </p>');
  parts.push('          </div>');
  parts.push(`          <h3 class="luvit-card__title"><a href="${esc(new URL(p.permalink).pathname)}">${esc(p.name)}</a></h3>`);
  if (p.certs) parts.push(`          <p class="luvit-card__certs">${esc(p.certs)}</p>`);
  if (p.warn) {
    parts.push('          <p class="luvit-card__warn">');
    parts.push('            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M12 8v5"/><path d="M12 16.5h.01"/><circle cx="12" cy="12" r="9"/></svg>');
    parts.push(`            ${esc(p.warn)}`);
    parts.push('          </p>');
  }
  parts.push('          <div class="luvit-card__footer">');
  /* 🔴 السعر من ووكومرس · ممنوع يتكتب رقم بالإيد. لو تغيّر بالوحة وما
     انعاد التوليد، الصفحة بتقول رقماً والسلة بتقول تاني. */
  parts.push(`            <span class="luvit-card__price">${ltr(p.price)} د.ا</span>`);
  parts.push(`            <a href="/?add-to-cart=${p.id}" rel="nofollow"`);
  parts.push('               class="luvit-btn add_to_cart_button ajax_add_to_cart"');
  parts.push(`               data-product_id="${p.id}" data-quantity="1"`);
  parts.push(`               aria-label="أضيفي ${esc(p.name)} إلى السلة">أضيفي إلى السلة</a>`);
  parts.push('          </div>');
  parts.push('        </div>');
  parts.push('      </article>');
  return parts.join('\n');
}

function packageCard(p) {
  const img = p.images[0];
  return [
    '      <article class="luvit-card luvit-card--feature">',
    '        <div class="luvit-card__media">',
    `          <img loading="lazy" decoding="async" width="800" height="800"`,
    `               src="${esc(img.src)}" alt="${esc(p.name)}">`,
    '        </div>',
    '        <div class="luvit-card__body">',
    `          <h3 class="luvit-card__title"><a href="${esc(new URL(p.permalink).pathname)}">${esc(p.name)}</a></h3>`,
    /* ⚠️ محتوى البكج نصاً بفواصل · مش قائمة بكلاس جديد.
       كنت رح أكتب `luvit-ticks` وهو **من الأربعة اللي اخترعتهم ٢٩ آب**
       وانشالوا. الكلاس الموجود بيعمل الشغل، والبوابة تحت بتمسك الاختراع
       على أي حال. */
    `          <p class="luvit-card__text">${esc(p.parts.join(' · '))}</p>`,
    '          <div class="luvit-card__footer">',
    `            <span class="luvit-card__price">${ltr(p.price)} د.ا</span>`,
    `            <a href="/?add-to-cart=${p.id}" rel="nofollow"`,
    '               class="luvit-btn add_to_cart_button ajax_add_to_cart"',
    `               data-product_id="${p.id}" data-quantity="1"`,
    `               aria-label="أضيفي ${esc(p.name)} إلى السلة">أضيفي إلى السلة</a>`,
    '          </div>',
    '        </div>',
    '      </article>',
  ].join('\n');
}

/* ── ٣ · بوابة الكلاسات ────────────────────────────────────────────────
   🔴 اخترعت أربعة كلاسات مرة (٢٩ آب)، وأسوأ: عدّيتهم بـgrep فطلعوا
      «مستعملين ٢١ مرة» — وهي مرات من ملفاتي أنا اللي ولّدتها للتو.
      **العدّاد كان بيعد مخرَجه.** فالمصدر هون هو `tokens.css` وحده. */
function assertClasses(html, where) {
  const css = fs.readFileSync(TOKENS, 'utf8');
  const used = new Set();
  for (const m of html.matchAll(/class="([^"]+)"/g)) {
    for (const c of m[1].split(/\s+/)) if (c.startsWith('luvit-')) used.add(c);
  }
  /* كلاسات ووكومرس وسلوكياته · معرّفة عنده مش عندنا */
  const EXTERNAL = new Set(['luvit-btn']);
  const missing = [...used].filter((c) => !EXTERNAL.has(c) && !css.includes('.' + c));
  if (missing.length) {
    console.error('🔴 كلاسات مش معرّفة بـtokens.css · ' + where);
    missing.forEach((c) => console.error('   · ' + c));
    process.exit(1);
  }
  return used.size;
}


/* ══════════════════════════════════════════════════════════════════════
   ٤ · السكاشن الثمانية
   ══════════════════════════════════════════════════════════════════════
   إيقاع الألوان محفوظ زي ما هو موثّق بالصفحة القديمة:
     ١ mist · ٢ light · ٣ mist · ٤ light · ٥ mist · ٦ light · ٧ mist · ٨ غامق
   ⚠️ وكلاسات band-* **معاينة بس** · ما اشتغلت ولا مرة على الموقع الحي.
      بتنكتب للاتساق ولحتى المعاينة المحلية تبيّن صح، مش لأنها بتشحن.

   والمراسي محفوظة كلها: packages · skin-types · products · ingredients ·
   delivery · products-faq · لأن الفوتر والرئيسية وأربع صفحات روتين
   بيربطوا #ingredients تحديداً، وكسرها ما بيرمي أي خطأ. */

/* 🔴 المقاس **صريح بالماركب** · مش متروك للـCSS.
   السبب: `.luvit-option__icon` معرّف `font-size: 26px` لأنه انبنى أصلاً
   لإيموجي، وما في ولا قاعدة بتعطي SVG جوّاه مقاساً. أول توليد طلعت فيه
   الأيقونات **صفر×صفر** وبطاقات البوابات بانت فاضية بالمعاينة · بلا ولا
   خطأ بالكونسول ولا تحذير.
   ⚠️ وانضافت كمان قاعدة أمان بـtokens.css · شبكة أمان مش بديل. */
const icon = (paths, size = 24) =>
  `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" ` +
  `stroke="currentColor" stroke-width="1.8" stroke-linecap="round" ` +
  `stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;

const I = {
  wallet: '<rect x="2" y="6" width="20" height="13" rx="2"/><path d="M2 10h20"/><circle cx="12" cy="14.5" r="2"/>',
  truck: '<path d="M3 16V6h11v10"/><path d="M14 9h4l3 3.5V16h-7"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>',
  flask: '<path d="M9 3h6"/><path d="M10 3v6.5L4.8 18a2 2 0 0 0 1.7 3h11a2 2 0 0 0 1.7-3L14 9.5V3"/><path d="M7.5 15h9"/>',
  drop: '<path d="M12 3s6 6.5 6 10.5A6 6 0 0 1 6 13.5C6 9.5 12 3 12 3z"/>',
  leaf: '<path d="M4 20c8 0 15-5 16-16C11 4 4 9 4 20z"/><path d="M4 20c3-5 7-8 11-10"/>',
  sun: '<circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.2 5.2l1.6 1.6M17.2 17.2l1.6 1.6M18.8 5.2l-1.6 1.6M6.8 17.2l-1.6 1.6"/>',
  shield: '<path d="M12 3 5 6v6c0 4.5 3 7.8 7 9 4-1.2 7-4.5 7-9V6z"/><path d="m9 12 2 2 4-4"/>',
};

/* ── ١ · الوعد والترويسة ─────────────────────────────────────────────── */
function s1() {
  return `<!--
  LUVIT · صفحة المتجر الموحّدة (/products/) · سكشن ١ من ٨ · الوعد والترويسة
  🔴 مولّد بـ_أدوات/build-shop-page.mjs · لا تعدّله بالإيد، عدّل المولّد.

  · شريط الوعد أول شي بالصفحة **قبل أي سعر** · صفحة متجر بيوتي بوكس تركت
    نفس المساحة فاضية بالكود، وصفحتها ما فيها ولا كلمة عن الشحن أو الدفع.
  · luvit-shop-root مرساة CSS · قسم 5.16 بـtokens.css بيستعملها عشان
    يطفي الـbackdrop-filter بالموبايل على هالصفحة (وهي مش صفحة ووكومرس
    فما بتاخد كلاس woocommerce-shop).
-->
<section class="luvit-section luvit-section--tight band-mist luvit-shop-root" data-nav-bg="light" id="page-head">
  <div class="luvit-promise">
    <span class="luvit-promise__item">${icon(I.wallet, 18)} الدفع عند الاستلام</span>
    <span class="luvit-promise__item">${icon(I.truck, 18)} التوصيل ٢ دنانير لكل محافظات الأردن</span>
    <span class="luvit-promise__item">${icon(I.flask, 18)} النِسَب مكتوبة على العبوة</span>
  </div>

  <div class="luvit-section__inner">
    <div class="luvit-section__head" data-luvit="reveal">
      <p class="luvit-section__eyebrow">Shop</p>
      <h1 class="luvit-section__title">التشكيلة كاملة، والنِسَب مكتوبة</h1>
      <p class="luvit-section__sub">${singles.length} منتجاً مفرداً و${packages.length} روتينات جاهزة · مرتّبة بترتيب استعمالها، فتقدري تشوفي مكان كل وحدة بروتينك قبل ما تشتري.</p>
    </div>
  </div>
</section>
`;
}

/* ── ٢ · رفّ الروتينات الجاهزة ──────────────────────────────────────── */
function s2() {
  return `<!--
  LUVIT · صفحة المتجر (/products/) · سكشن ٢ من ٨ · الروتينات الجاهزة
  🔴 مولّد · لا تعدّله بالإيد.

  · أعلى وحدة قيمة بالصفحة فبتيجي أول · وولا واحد من المراجع الخمسة عنده
    رفّ بكجات حقيقي (كلهم أشرطة منتجات مفردة).
  · الأسعار من ووكومرس · وهي **بالضبط مجموع القطع**، لأن استراتيجية
    العلامة بتمنع الخصومات الأونلاين (بتضعف موقف الصيدليات). فالبكج
    بينباع بالتنسيق مش بالتوفير، والكوبي ما بيدّعي خصماً.
-->
<section class="luvit-section band-light" data-nav-bg="light" id="packages">
  <div class="luvit-section__inner">
    <div class="luvit-section__head" data-luvit="reveal">
      <p class="luvit-section__eyebrow">Routines</p>
      <h2 class="luvit-section__title">روتين كامل بطلبية وحدة</h2>
      <p class="luvit-section__sub">أربع خطوات مرتّبة بترتيبها الصح · بدل ما تختاري وحدة وحدة وتحتاري إذا بتناسبوا بعض.</p>
    </div>

    <div class="luvit-card-grid luvit-card-grid--wide" data-luvit="stagger">
${packages.map(packageCard).join('\n')}
    </div>
  </div>
</section>
`;
}

/* ── ٣ · بوابات الهدف ───────────────────────────────────────────────── */
function s3() {
  /* 🔴 بتمرّر وبتبرز · ما بتفلتر وما بتخفي.
     الشبكة تحت بتضل كاملة دايماً، فالزبونة ما بتشوف ولا مرة شبكة فاضية
     وما بتفقد إحساس إن المتجر كله مكشوف قدامها. وزر «تصفية» ما بيصفّي
     بيحرق الثقة · شفناه عند بيوتي بوكس على ١٥٦ منتجاً.
     ⚠️ والمرساة skin-types محفوظة من الصفحة القديمة مع إن المحتوى
        صار بالهدف · تغيير الـid بيكسر أي رابط قديم بلا ما يحكي. */
  const gates = [
    { href: '/routines/hydration', icon: I.drop, label: 'ترطيب ودعم', note: 'للبشرة الجافة أو الحسّاسة' },
    { href: '/routines/clarify',   icon: I.leaf, label: 'تنقية وتوازن', note: 'للبشرة الدهنية أو المختلطة' },
    { href: '/routines/glow',      icon: I.sun,  label: 'إشراقة', note: 'للبهتان وتفاوت اللون' },
  ];
  return `<!--
  LUVIT · صفحة المتجر (/products/) · سكشن ٣ من ٨ · بوابات الهدف
  🔴 مولّد · لا تعدّله بالإيد.
-->
<section class="luvit-section band-mist" data-nav-bg="light" id="skin-types">
  <div class="luvit-section__inner">
    <div class="luvit-section__head" data-luvit="reveal">
      <p class="luvit-section__eyebrow">Start here</p>
      <h2 class="luvit-section__title">مش عارفة من وين تبلّشي؟</h2>
      <p class="luvit-section__sub">اختاري الهدف، ومنوريكِ الروتين كامل بخطواته.</p>
    </div>

    <div class="luvit-card-grid luvit-card-grid--wide" data-luvit="stagger">
${gates.map((g) => [
  `      <a class="luvit-option" href="${g.href}">`,
  `        <span class="luvit-option__icon" aria-hidden="true">${icon(g.icon, 40)}</span>`,
  `        <span class="luvit-option__label">${g.label}<br><small>${g.note}</small></span>`,
  '      </a>',
].join('\n')).join('\n')}
    </div>

    <div class="luvit-section__foot">
      <a class="luvit-btn luvit-btn--ghost" href="/quiz">أو جاوبي كم سؤال ومنختارلك</a>
    </div>
  </div>
</section>
`;
}

/* ── ٤ · الشبكة الكاملة ─────────────────────────────────────────────── */
function s4() {
  /* 🔴 بلا فلتر وبلا فرز وبلا ترقيم صفحات · ١١ منتجاً بيخلصوا بشاشتين.
     أربع خيارات فرز على ١١ منتجاً أثاث ميت · وكاشمير عندها أربعة وما
     فيها «الأحدث» مع إنها ناشرة شريط «وصل حديثاً». */
  return `<!--
  LUVIT · صفحة المتجر (/products/) · سكشن ٤ من ٨ · الشبكة الكاملة
  🔴 مولّد · لا تعدّله بالإيد · وخصوصاً الأسعار: بتنسحب من ووكومرس.

  · الترتيب **بترتيب الاستعمال** مش بالسعر ولا بالأبجدية: غسول ← تونر ←
    سيروم ← كريم · فالتصفّح نفسه بيعلّم الروتين.
  · كل بطاقة حاملة رقم خطوتها، ونسبة مادتها الفعّالة البطلة كشارة ·
    وهاي **بديل النجوم** عندنا: رقم قابل للفحص على العبوة، بينما ولا
    واحد من المراجع الخمسة عنده دليل اجتماعي على مستوى المنتج أصلاً.
-->
<section class="luvit-section band-light" data-nav-bg="light" id="products">
  <div class="luvit-section__inner">
    <div class="luvit-section__head" data-luvit="reveal">
      <p class="luvit-section__eyebrow">All products</p>
      <h2 class="luvit-section__title">المنتجات بترتيب استعمالها</h2>
      <p class="luvit-section__sub">من الغسول للكريم · الرقم على كل بطاقة هو مكانها بالروتين.</p>
    </div>

    <div class="luvit-card-grid" data-luvit="stagger">
${singles.map(productCard).join('\n')}
    </div>
  </div>
</section>
`;
}

/* ── ٥ · المكوّنات · التمايز الوحيد الحقيقي ─────────────────────────── */
function s5() {
  /* بيجي **بعد** الشبكة عن قصد · هو بيبرّر السعر مش بيقدّمه.
     والمواد بتنسحب من الكتالوج نفسه · وبتنعرض المواد اللي بتتكرر بأكثر
     من منتج، لأنها هي اللي بتوصف الخط كله مش منتجاً واحداً. */
  const tally = new Map();
  for (const s of singles) {
    if (!s.rec || !s.rec.actives) continue;
    for (const a of s.rec.actives) {
      if (!tally.has(a.name)) tally.set(a.name, { ...a, n: 0, max: 0 });
      const t = tally.get(a.name);
      t.n += 1;
      const v = parseFloat(a.pct);
      if (v > t.max) { t.max = v; t.pct = a.pct; }
    }
  }
  const rows = [...tally.values()].filter((t) => t.n >= 2)
    .sort((a, b) => b.n - a.n || b.max - a.max).slice(0, 6);

  return `<!--
  LUVIT · صفحة المتجر (/products/) · سكشن ٥ من ٨ · المكوّنات
  🔴 مولّد بـ_أدوات/build-shop-page.mjs · لا تعدّله بالإيد.

  · المواد والنِسَب **مسحوبة من الكتالوج الرسمي** · ولا رقم مكتوب بالإيد.
  · معروضة المواد اللي بتتكرر بمنتجين فأكثر · لأنها بتوصف الخط كله.
  · 🔴 والمرساة ingredients **ممنوع تتغيّر**: الفوتر والرئيسية وأربع
    صفحات روتين بيربطوا /products#ingredients · وكسرها ما بيرمي خطأ.
-->
<section class="luvit-section band-mist" data-nav-bg="light" id="ingredients">
  <div class="luvit-section__inner">
    <div class="luvit-section__head" data-luvit="reveal">
      <p class="luvit-section__eyebrow">Inside the bottle</p>
      <h2 class="luvit-section__title">شو جوّا العبوة بالضبط</h2>
      <p class="luvit-section__sub">المواد الخام كورية والتصنيع بتركيا · والنِسَب مكتوبة على العبوة نفسها، تقدري تقرأيها وتتأكدي قبل ما تشتري.</p>
    </div>

    <div class="luvit-ing" data-luvit="stagger">
${rows.map((r) => [
  '      <div class="luvit-ing__row">',
  `        <span class="luvit-ing__pct">${ltr(r.pct)}</span>`,
  '        <div class="luvit-ing__body">',
  /* ⚠️ بعض المواد اسمها العربي هو نفسه اللاتيني (AHA + BHA)، فطباعة
     الاثنين بتطلع «AHA + BHA · AHA + BHA». انمسكت بالعين باللقطة. */
  `          <p class="luvit-ing__name">${esc(r.name)}${r.en && r.en !== r.name ? ' · <bdi>' + esc(r.en) + '</bdi>' : ''}</p>`,
  `          <p class="luvit-ing__note">${esc(r.role)} · بـ${r.n} منتجات من التشكيلة.</p>`,
  '        </div>',
  '      </div>',
].join('\n')).join('\n')}
    </div>
  </div>
</section>
`;
}

/* ── ٦ · التوصيل والدفع ─────────────────────────────────────────────── */
function s6() {
  /* أسهل نقطة نتفوّق فيها: صفحة العناية بالبشرة عند بيوتي بوكس فيها
     **صفر كلمة** عن الشحن أو الإرجاع أو الدفع · مفحوصة بالبحث النصي. */
  const facts = [
    { icon: I.wallet, title: 'الدفع عند الاستلام', note: 'ادفعي للمندوب لمّا يوصلك · ما في دفع مسبق' },
    { icon: I.truck,  title: 'التوصيل ٢ دنانير',   note: 'نفس السعر لكل محافظات الأردن' },
    { icon: I.shield, title: 'سعر الصيدلية نفسه',  note: 'ما منرفع وما منّزل · نفس المنتج ونفس السعر' },
  ];
  return `<!--
  LUVIT · صفحة المتجر (/products/) · سكشن ٦ من ٨ · التوصيل والدفع
  🔴 مولّد · لا تعدّله بالإيد.

  · 🔴 الحقيقة الثالثة هي **قلب قيد لميزة**. استراتيجية العلامة بتمنع
    الخصومات الأونلاين عشان ما تضرب الصيدليات · فبدل ما نخبّيها كقيد،
    منعلنها كوعد. وهي أصدق من «حتى ٨٠٪» تبع كاشمير اللي حقيقتها ٥٠٪
    ثابتة على ٢٧٥ من ٢٧٥ منتجاً.
-->
<section class="luvit-section band-light" data-nav-bg="light" id="delivery">
  <div class="luvit-section__inner">
    <div class="luvit-section__head" data-luvit="reveal">
      <p class="luvit-section__eyebrow">Delivery</p>
      <h2 class="luvit-section__title">كيف بتوصلك الطلبية</h2>
    </div>

    <div class="luvit-trust" data-luvit="stagger">
${facts.map((f) => [
  '      <div class="luvit-trust__item">',
  `        <span class="luvit-trust__icon" aria-hidden="true">${icon(f.icon, 26)}</span>`,
  `        <p class="luvit-trust__title">${f.title}</p>`,
  `        <p class="luvit-trust__note">${f.note}</p>`,
  '      </div>',
].join('\n')).join('\n')}
    </div>

    <div class="luvit-section__foot">
      <a class="luvit-btn luvit-btn--ghost" href="/shipping">تفاصيل الشحن والتوصيل</a>
    </div>
  </div>
</section>
`;
}

/* ── ٧ · الأسئلة ────────────────────────────────────────────────────── */
function s7() {
  /* 🔴 الترتيب **بالخوف أول**: كم بتوصل؟ وإذا ما ناسبتني؟ · هدول
     السؤالان اللي بيوقفوا الشراء بالدفع عند الاستلام.
     ⚠️ وممنوع أي ادعاء من نوع «الأسئلة اللي بتوصلنا أكثر شي» · المتجر
        ما انطلق بعد، فولا سؤال «وصل». نفس سبب شيل شارة «الأكثر مبيعاً». */
  const qa = [
    ['كم بتوصل الطلبية؟',
     'التوصيل لكل محافظات الأردن بـ٢ دنانير · وبنتواصل معك على الواتساب لتثبيت الطلب قبل ما نرسله.'],
    ['وإذا المنتج ما ناسب بشرتي؟',
     'المفتوح ما بيرجع، وهاد معيار صناعة مستحضرات التجميل كلها لأسباب صحية · والمعيب بيرجع دايماً. التفاصيل كاملة بصفحة الاستبدال والإرجاع.'],
    ['ليش ما في خصومات؟',
     'سعر الموقع هو نفس سعر الصيدلية بالضبط · ما منرفع وما منّزل. خصم أونلاين بيخلق تضارب أسعار مع الصيدليات اللي بتبيع نفس المنتج.'],
    ['كيف بعرف إن النِسَب صحيحة؟',
     'كل نسبة معروضة هون مكتوبة على العبوة نفسها · تقدري تقرأيها لمّا توصلك وتتأكدي بنفسك.'],
    ['أشتري روتين كامل ولا منتج واحد؟',
     'لو مبلّشة، الروتين الجاهز بيوفّر عليكِ الاختيار ومرتّب بترتيبه الصح · ولو ناقصك خطوة وحدة بس، المنتج المفرد أوفر.'],
    ['بقدر أستعمل أكثر من سيروم؟',
     'نعم، بس مش بنفس الوقت · وسيروم التقشير تحديداً مرتين بالأسبوع مش يومي. الروتينات الجاهزة مرتّبة بحيث ما يتعارضوا.'],
  ];
  return `<!--
  LUVIT · صفحة المتجر (/products/) · سكشن ٧ من ٨ · الأسئلة
  🔴 مولّد · لا تعدّله بالإيد.
-->
<section class="luvit-section band-mist" data-nav-bg="light" id="products-faq">
  <div class="luvit-section__inner">
    <div class="luvit-section__head" data-luvit="reveal">
      <p class="luvit-section__eyebrow">FAQ</p>
      <h2 class="luvit-section__title">أسئلة قبل ما تطلبي</h2>
    </div>

    <div class="luvit-acc" data-luvit="stagger">
${qa.map(([q, a], i) => [
  `      <details class="luvit-acc__item"${i === 0 ? ' open' : ''}>`,
  '        <summary class="luvit-acc__q">',
  `          ${q}`,
  '          <span class="luvit-acc__sign" aria-hidden="true"></span>',
  '        </summary>',
  `        <div class="luvit-acc__a"><p>${a}</p></div>`,
  '      </details>',
].join('\n')).join('\n')}
    </div>

    <div class="luvit-section__foot">
      <a class="luvit-btn luvit-btn--ghost" href="/faq">كل الأسئلة الشائعة</a>
    </div>
  </div>
</section>
`;
}

/* ── ٨ · الخاتمة ────────────────────────────────────────────────────── */
function s8() {
  /* الشريط الغامق مع الموجة · نفس خاتمة كل صفحة بالموقع.
     🔴 وغيابه هو اللي خلّى زر «شوفي كل المنتجات» يبيّن ملزوقاً بالفوتر
        بالصفحات المولّدة · بلاغ ريّان ٢٩ آب. */
  return `<!--
  LUVIT · صفحة المتجر (/products/) · سكشن ٨ من ٨ · الخاتمة
  🔴 مولّد · لا تعدّله بالإيد.
-->
<section class="luvit-cta luvit-deep luvit-cut-top" data-nav-bg="dark" data-luvit-bubbles="16">
  <span class="luvit-deep__rays" aria-hidden="true"></span>
  <div class="luvit-cta__panel" data-luvit="reveal">
    <h2 class="luvit-cta__title luvit-cta__accent">لسا محتارة بين منتج ومنتج؟</h2>
    <p class="luvit-cta__sub">جاوبي على كم سؤال عن بشرتك، ومنوريكِ الروتين اللي بيناسبها · والدفع عند الاستلام.</p>
    <a href="/quiz" class="luvit-btn luvit-btn--arrow">اكتشفي روتينك</a>
  </div>
</section>
`;
}

/* ══════════════════════════════════════════════════════════════════════
   ٥ · الكتابة · مع البوابات
   ══════════════════════════════════════════════════════════════════════ */
const FILES = [
  ['p1-header.html',      s1],
  ['p2-packages.html',    s2],
  ['p3-skin-types.html',  s3],
  ['p4-products.html',    s4],
  ['p5-ingredients.html', s5],
  ['p6-delivery.html',    s6],
  ['p7-faq.html',         s7],
  ['p8-cta.html',         s8],
];

/* مراسي لازم تضل موجودة · مربوطة من برّا الصفحة */
const REQUIRED_IDS = ['ingredients', 'packages', 'products', 'delivery', 'products-faq', 'skin-types'];

const written = [];
let allHtml = '';
for (const [name, fn] of FILES) {
  const html = fn();
  assertClasses(html, name);

  /* توازن الوسوم · `</div>>` يتيمة ظهرت نصاً على الموقع الحي لأشهر */
  const o = (html.match(/<section\b/g) || []).length;
  const c = (html.match(/<\/section>/g) || []).length;
  if (o !== c) { console.error('🔴 وسوم section مش متوازنة بـ' + name); process.exit(1); }
  if (/<\/[a-z]+>\s*>/.test(html)) { console.error('🔴 وسم إغلاق يتيم بـ' + name); process.exit(1); }

  /* كل سكشن لازم يحمل data-nav-bg · verify-sections بيفحصها */
  if (!/data-nav-bg\s*=/.test(html)) { console.error('🔴 data-nav-bg ناقصة بـ' + name); process.exit(1); }

  fs.writeFileSync(path.join(SECTIONS, name), html, 'utf8');
  written.push({ name, bytes: Buffer.byteLength(html, 'utf8') });
  allHtml += html;
}

/* 🔴 بوابة المراسي · كسر مرساة ما بيرمي أي خطأ وقت التشغيل */
const missingIds = REQUIRED_IDS.filter((id) => !allHtml.includes('id="' + id + '"'));
if (missingIds.length) {
  console.error('🔴 مراسي مفقودة · مربوطة من برّا الصفحة: ' + missingIds.join(' · '));
  process.exit(1);
}

/* بوابة الشرطة الطويلة · ممنوعة بأي نص بينشر · قاعدة ريّان */
const emdash = (allHtml.match(/—/g) || []).length;
if (emdash) { console.error('🔴 في ' + emdash + ' شرطة طويلة بالمخرَج · ممنوعة'); process.exit(1); }

/* بوابة الأسعار · ولا سعر مكتوب بالإيد */
const wooPrices = new Set(woo.منتجات.map((p) => p.price));
for (const m of allHtml.matchAll(/([\d]+\.[\d]{2})\s*<\/span>\s*د\.ا|>([\d]+\.[\d]{2})<\/span>\s*د\.ا/g)) {
  const v = m[1] || m[2];
  if (!wooPrices.has(v)) { console.error('🔴 سعر مش من ووكومرس: ' + v); process.exit(1); }
}

console.log('\n✅ انكتبوا ' + written.length + ' سكشن');
for (const w of written) console.log('   ' + w.name.padEnd(22) + String(w.bytes).padStart(7) + ' بايت');
console.log('\nالبوابات اللي مرقت: الكلاسات · توازن الوسوم · data-nav-bg · المراسي الست · الشرطة الطويلة · الأسعار');

/* ══════════════════════════════════════════════════════════════════════
   ٦ · المعاينة المحلية
   ══════════════════════════════════════════════════════════════════════
   بتاخد قشرة المعاينة القديمة (الترويسة والملاحة والفوتر والسكربتات)
   وبتبدّل جسمها بالسكاشن الجديدة · فبنشوف الصفحة كاملة بلا ما نلمس
   الموقع الحي.

   ⚠️ والمعاينة **مش الموقع**: ألوان الأشرطة (band-*) بتشتغل هون وما
      بتشتغل هناك، والماركب اللي بيولّده ووكومرس مش موجود هون أصلاً.
      فحص المعاينة **شرط مش كافٍ** · قاعدة ٩ آب.
*/
const PREVIEW = path.join(REPO, 'library', 'products-preview.html');
if (fs.existsSync(PREVIEW)) {
  let shell = fs.readFileSync(PREVIEW, 'utf8');

  /* ── قائمة المعاينة بتنسحب من الهيدر المنشور ────────────────────────
     🔴 بلاغ ريّان ٣٠ آب من لقطة المعاينة: «وين اللوجو الصحيح؟ ووين
        المقالات؟»

     السبب: قشرة المعاينة كانت حاملة **نسخة مكتوبة بالإيد** من القائمة،
     وهي من قبل ما ينضاف اللوجو (٢٩ آب) ومن قبل ما تنبنى المقالات ومن
     قبل الدمج. فالمعاينة كانت بتعرض موقعاً ما عاد موجوداً · وأنا كنت
     بحكم على التصميم من خلالها.

     ⚠️ وهاد **نفس فخ الهيدر بالضبط**: نسخة يدوية لشي إله مصدر مولّد.
        الحل نفس الحل: تنسحب من `library/header-79.html` كل توليد،
        فما بتقدر تبيت أبداً. */
  const HEADER = path.join(REPO, 'library', 'header-79.html');
  if (fs.existsSync(HEADER)) {
    const nav = fs.readFileSync(HEADER, 'utf8').replace(/\r\n/g, '\n');
    const navStart = shell.indexOf('<a class="luvit-skip"');
    const dockEnd = shell.indexOf('</nav>', shell.indexOf('<nav class="luvit-dock"'));
    if (navStart > 0 && dockEnd > navStart) {
      shell = shell.slice(0, navStart) + nav.trim() + shell.slice(dockEnd + '</nav>'.length);
      console.log('✅ قائمة المعاينة انسحبت من header-79.html');
    } else {
      console.error('⚠️ ما لقيت حدود القائمة بالمعاينة · انتخطّت');
    }
  }

  const a = shell.indexOf('<main id="main">');
  const b = shell.indexOf('</main>');
  if (a > 0 && b > a) {
    const body = '<main id="main">\n\n' + FILES.map(([, fn]) => fn()).join('\n') + '\n</main>';
    const out = shell.slice(0, a) + body + shell.slice(b + '</main>'.length);
    fs.writeFileSync(PREVIEW, out, 'utf8');
    console.log('\n✅ المعاينة اتحدّثت · library/products-preview.html');
    console.log('   http://localhost:4322/library/products-preview.html');
  } else {
    console.error('⚠️ ما لقيت <main> بالمعاينة · انتخطّت');
  }
}
