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
import { ROUTINES, عدد, منطوق, أطوال, بالسلَغ } from './routines.mjs';

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
const STEP_FALLBACK = { 276: { n: 3, label: 'علاج' }, 282: { n: 3, label: 'علاج' },
  /* واقي الشمس · الخطوة ٥ «حماية» · زي /eventone/ و/routines/ والمنتج 367 · كان بياخد
     الافتراضي «٣ · علاج» (تدقيق الكوبي ٢ أيلول · تناقض #12). */
  318: { n: 5, label: 'حماية' } };

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
/* 🔴 كلمة ريّان ٢ أيلول: «كل المنتجات مفحوصة جلدياً» · التلاتة اللي مش
   بالكتالوج الرسمي (سنتيلا 276 · ألفا أربوتين 282 · واقي الشمس 318) ما
   عندهم صفحة كتالوج، فشهادتهم الوحيدة المثبتة هي هاي · والباقي ما بينكتب. */
const EXTRA_CERTS = { 276: ['dermatologically-tested'], 282: ['dermatologically-tested'], 318: ['dermatologically-tested'] };
function certs(rec, id) {
  const list = rec && rec.certs ? rec.certs : (EXTRA_CERTS[id] || null);
  if (!list) return null;
  const names = list.map((c) => CERT_AR[c]).filter(Boolean).slice(0, 3);
  return names.length ? names.join(' · ') : null;
}

/* 🔴 **نفس فخ البكجات بالضبط** · الفلتر كان بيدوّر فئة `singles`
   بالإنجليزي واللقطة فيها `منتجات مفردة` بالعربي، فـ`singles` طلعت
   **مصفوفة فاضية** والشبكة الرئيسية بصفحة المتجر انفرغت من ١٢ منتجاً.

   ⚠️ وأنا صلّحت فخ البكجات ودفعت الصفحة **وما فحصت المفردات** · فالموقع
      قعد يقول «0 منتجاً مفرداً» بصفحة المتجر. البناء طبع «✅ ٨ سكشن»
      وولا بوابة حكت · **ريّان هو اللي شافها**.
   ⤷ الدرس: فخ بمكانين بينصلّح بمكانين · والبوابة تحت بتعدّ فعلياً. */
const فئة_المفردات = ['منتجات مفردة', 'singles'];
const singles = woo.منتجات
  .filter((p) => p.cats.some((c) => فئة_المفردات.includes(c)))
  .map((p) => {
    const rec = byWoo[p.id] || null;
    const step = rec ? STEPS[rec.cat] : STEP_FALLBACK[p.id];
    return {
      ...p,
      rec,
      step: step || { n: 3, label: 'علاج' },
      active: topActive(rec, p),
      ml: volume(rec, p),
      certs: certs(rec, p.id),
      inCatalogue: !!rec,
      /* 🔴 التنبيه على سيروم التقشير وحده · وعلى البطاقة مش بصفحة المنتج */
      warn: rec && rec.cat === 'TOPICAL TREATMENT' ? 'بالليل · مرة بالأسبوع بالبداية · مش يومي' : null,
    };
  })
  .sort((a, b) => a.step.n - b.step.n || parseFloat(a.price) - parseFloat(b.price));

const fail = (m) => { console.error('🔴 ' + m); process.exit(1); };

/* 🔴 كان الفلتر `p.cats.includes('packages')` واللقطة فيها **`بكجات`**
   بالعربي · فـ`packages` كانت **مصفوفة فاضية**، والصفحة بتنبني بشبكة
   بكجات **فاضية تماماً** و**ولا بوابة بتحكي**. أعلى وحدة قيمة بالصفحة
   بتختفي والبناء بيقول «✅ ٨ سكشن».
   ⤷ الترتيب صار من `routines.mjs` لا من ووكومرس · كل بكج **لازم** يكون
     إله روتين، وكل روتين **لازم** يكون إله بكج · والبوابتان تحت. */
const بكج = Object.fromEntries(woo.منتجات.map((p) => [p.slug, p]));
const packages = ROUTINES.map((r) => {
  const p = بكج[r.slug];
  if (!p) fail('روتين ' + r.key + ' بلا بكج بووكومرس (سلَغ ' + r.slug + ')');
  /* 🔴 التقسيم على «+» محاط بفراغات · لا على أي «+» · لأن «SPF50+» كان بينقطع
     لـ«SPF50» (تدقيق الكوبي ٢ أيلول · #43 · تناقض #15). */
  const parts = (p.short || '').split(' + ').map((s) => s.trim()).filter(Boolean);
  if (parts.length !== r.steps.length) {
    fail('بكج ' + r.slug + ' فيه ' + parts.length + ' قطعة والروتين ' + r.steps.length + ' خطوات');
  }
  return { ...p, parts };
});

/* والعكس · بكج بووكومرس بلا روتين بيختفي بصمت من الصفحة */
const فئة_البكجات = ['بكجات', 'packages'];
for (const p of woo.منتجات) {
  if (!p.cats.some((c) => فئة_البكجات.includes(c))) continue;
  if (!ROUTINES.some((r) => r.slug === p.slug)) {
    fail('بكج «' + p.name + '» بووكومرس وما إله روتين بـroutines.mjs');
  }
}
if (!packages.length) fail('شبكة البكجات فاضية');

/* 🔴 والعدّ الفعلي · «فاضية» مش كافية، الرقم لازم يطابق المتجر.
   منتج بينضاف لووكومرس وما بيوصل الصفحة = نفس الصمت. */
const مفردات_حيّة = woo.منتجات.filter((p) => !/^روتين /.test(p.name)).length;
if (!singles.length) fail('شبكة المنتجات المفردة فاضية');
if (singles.length !== مفردات_حيّة) {
  fail('المتجر فيه ' + مفردات_حيّة + ' منتجاً مفرداً والصفحة بتعرض ' + singles.length);
}

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
  /* 🔴 زر المفضّلة · جوّا الميديا وبالزاوية المقابلة للشارة.
     المعرّف هو معرّف ووكومرس نفسه · هو الجسر الوحيد بين البطاقة وصفحة
     المفضّلة، وأي مفتاح تاني (سلَغ · اسم) بينكسر أول ما ينتغيّر. */
  parts.push(`          <button class="luvit-wish" type="button" data-wish="${p.id}"`);
  parts.push(`                  aria-pressed="false" aria-label="أضيفي ${esc(p.name)} للمفضّلة">`);
  parts.push('            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.3 4.6 13a4.7 4.7 0 0 1 0-6.7 4.7 4.7 0 0 1 6.7 0l.7.7.7-.7a4.7 4.7 0 0 1 6.7 0 4.7 4.7 0 0 1 0 6.7z"/></svg>');
  parts.push('          </button>');
  parts.push(`          <img decoding="async" width="800" height="1000"`);
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
  parts.push(`            <span class="luvit-card__price">${ltr(p.price)} د.أ</span>`);
  parts.push(`            <a href="/?add-to-cart=${p.id}" rel="nofollow"`);
  parts.push('               class="luvit-btn add_to_cart_button ajax_add_to_cart"');
  parts.push(`               data-product_id="${p.id}" data-quantity="1"`);
  parts.push(`               aria-label="أضيفي ${esc(p.name)} إلى السلة">أضيفي إلى السلة</a>`);
  parts.push('          </div>');
  parts.push('        </div>');
  parts.push('      </article>');
  return parts.join('\n');
}

/* ── ربط كل بكج بروتينه · عشان اللون والرابط ────────────────────────
   المفتاح هو السلَغ · وهو الجسر الوحيد الموثوق بين ووكومرس والروتينات. */
const PACK_GOAL = Object.fromEntries(
  ROUTINES.map((r) => [r.slug, { goal: r.key, route: '/routines/' + r.key }]),
);

/* 🔴 القطعة المشتركة بين كل البكجات · محسوبة من البيانات مش مكتوبة.
   لو تغيّر تركيب بكج، الحساب بيتغيّر معه بدل ما يضل نصاً بايتاً. */
const partCount = {};
for (const p of packages) for (const s of p.parts) partCount[s] = (partCount[s] || 0) + 1;
const sharedByAll = Object.keys(partCount).filter((k) => partCount[k] === packages.length);

function packageCard(p) {
  const img = p.images[0];
  const meta = PACK_GOAL[p.slug] || {};
  const steps = p.parts.map((s) => {
    const shared = sharedByAll.includes(s);
    /* ⚠️ العلامة **عنصر داخل السطر** مش `::after` · لأن الـli شبكة عمودين،
       فـ`::after` بينزل صفاً جديداً وبتبيّن العلامة يتيمة تحت الاسم.
       انمسكت باللقطة. */
    return `            <li${shared ? ' data-shared' : ''}>${esc(s)}` +
           `${shared ? ' <small>بكلهن</small>' : ''}</li>`;
  }).join('\n');

  return [
    `      <article class="luvit-card luvit-card--feature"${meta.goal ? ` data-goal="${meta.goal}"` : ''}>`,
    '        <div class="luvit-card__media">',
    `          <img decoding="async" width="800" height="800"`,
    `               src="${esc(img.src)}" alt="${esc(p.name)}">`,
    '        </div>',
    '        <div class="luvit-card__body">',
    `          <h3 class="luvit-card__title"><a href="${esc(new URL(p.permalink).pathname)}">${esc(p.name)}</a></h3>`,
    '          <ol class="luvit-card__steps">',
    steps,
    '          </ol>',
    '          <div class="luvit-card__footer">',
    `            <span class="luvit-card__price">${ltr(p.price)} د.أ</span>`,
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
  /* 🔴 رأس المتجر هو هيرو «القطرة» · تسلسل canvas مسحوب بالسكرول (١٢٠ فريماً
     على السيرفر بـuploads/hero-seq/drop/) · والماركب مصدره الوحيد ملف
     المعاينة library/shop-hero-packages.preview.html · بينسحب من هون وقت
     البناء عشان ما يصير نسختين. انركّب ١ أيلول (0d6d7db) وانداس برأس نصّي
     لما انبنت الصفحة من هالمولّد يوم ٢ أيلول · ريّان: «كل شوي كنت تحذفه».
     · luvit-shop-root مرساة CSS (قسم 5.16 بـtokens.css) · بتضل على الهيرو.
     · الرابط الثاني بيوصل لـ#products (اسم الكتالوج بهالصفحة، مش #catalogue). */
  const src = fs.readFileSync(new URL('../library/shop-hero-packages.preview.html', import.meta.url), 'utf8');
  const m = src.match(/<section class="shop-hero"[\s\S]*?<\/section>/);
  if (!m) fail('هيرو القطرة مش موجود بملف المعاينة');
  const hero = m[0]
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\n[ \t]*\n+/g, '\n')
    .replace('<section class="shop-hero"', '<section class="shop-hero luvit-shop-root"')
    .replace('href="#catalogue"', 'href="#products"');
  if (!hero.includes('luvit-shop-root') || !hero.includes('href="#products"')) fail('هيرو القطرة · التعديلان ما انطبّقا');
  return `<!--
  LUVIT · صفحة المتجر الموحّدة (/products/) · سكشن ١ من ٨ · هيرو «القطرة»
  🔴 مولّد بـ_أدوات/build-shop-page.mjs من library/shop-hero-packages.preview.html
     · لا تعدّله بالإيد · عدّل المعاينة وأعد البناء.
  · التسلسل بيرسمه سكربت المتجر بالفوتر (SEQ_BASE → uploads/hero-seq/drop/).
-->
${hero}
`;
}

/* ── ٢ · رفّ الروتينات الجاهزة ──────────────────────────────────────── */
function s2() {
  return `<!--
  LUVIT · صفحة المتجر (/products/) · سكشن ٢ من ٨ · الروتينات الجاهزة
  🔴 مولّد · لا تعدّله بالإيد.

  · أعلى وحدة قيمة بالصفحة فبتيجي أول · وولا واحد من المراجع الخمسة عنده
    رفّ بكجات حقيقي (كلهم أشرطة منتجات مفردة).
  · الأسعار من ووكومرس · وهي **بالضبط مجموع القطع** · البكج بينباع
    بالتنسيق مش بالتوفير، والكوبي ما بيدّعي خصماً على البكج نفسه.
    ⚠️ الخصومات بتيجي بالكوبونات (ريّان ٣ أيلول: «الكوبونات مهمة كثير
    باستراتيجية البيع») · لا بسعر مكتوب هون.
-->
<section class="luvit-section band-light" data-nav-bg="light" id="packages">
  <div class="luvit-section__inner">
    <div class="luvit-section__head" data-luvit="reveal">
      <h2 class="luvit-section__title">روتين كامل بطلبية وحدة</h2>
      <p class="luvit-section__sub">خطوات مرتّبة بترتيبها الصح · والتوصيل مجاني مع أي روتين.</p>
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
  /* 🔴 كانت **تلات بوابات مكتوبة بالإيد** وسكشن البكجات فوقها بيقرا من
     ووكومرس · فالمتجر كان بيعرض أربع بكجات وتلات بوابات بنفس الصفحة.
     صارت من `routines.mjs` · بتنمو معه لحالها. */
  const gates = ROUTINES.map((r) => ({
    href: '/routines/' + r.key, goal: r.key, icon: I[r.gate.icon],
    label: r.gate.label, note: r.gate.note,
  }));
  for (const g of gates) if (!g.icon) fail('أيقونة مش موجودة لبوابة ' + g.goal);
  return `<!--
  LUVIT · صفحة المتجر (/products/) · سكشن ٣ من ٨ · بوابات الهدف
  🔴 مولّد · لا تعدّله بالإيد.
-->
<section class="luvit-section band-mist" data-nav-bg="light" id="skin-types">
  <div class="luvit-section__inner">
    <div class="luvit-section__head luvit-section__head--start" data-luvit="reveal">
      <h2 class="luvit-section__title">مش عارفة من وين تبلّشي؟</h2>
      <p class="luvit-section__sub">اختاري الهدف، ومنوريكِ الروتين كامل بخطواته.</p>
    </div>

    <div class="luvit-card-grid luvit-card-grid--wide" data-luvit="stagger">
${gates.map((g) => [
  `      <a class="luvit-option" data-goal="${g.goal}" href="${g.href}">`,
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

/* ── ٥ · سلّم البانثينول · «الرقم هو اللي بيحاسبنا» ────────────────────
   🔴 هالسكشن **انبنى من الصفر** بعد نقد ريّان ٣٠ آب:
   > «معلومة النِسَب هاي مادة تسويقية كـUSP مش نحطها بالهبل هذا · أكيد
   >  المكوّنات حتكون عالعلبة وهاي بديهيات · وكل منتج مكوّناته بتختلف عن
   >  الثانية · المفروض نكتب ليش هاي المنتجات وليش أغلى من السوق.»

   **واللي كان قبله كان أسوأ من «معروض غلط»**: جدول بيدمج مواد من منتجات
   مختلفة، فبيعطي انطباعاً إن كل المنتجات فيها نفس الإشي. وهاد غير صحيح.

   ── الفكرة ──────────────────────────────────────────────────────────
   **مادة وحدة · خمس جرعات · خمس منتجات.** البانثينول من ١٠٪ لـ٠.٥٪.
   مقيس من الكتالوج: بسبعة منتجات، بخمس قيم مختلفة، وفرق **٢٠ ضعف** بين
   الأعلى والأدنى.

   وهاد بالضبط جواب اعتراض ريّان «كل منتج مكوّناته بتختلف»:
   **آه بتختلف · وهاد دليل تركيب مدروس مش عشوائية.**

   والصف الأول `؟` مقابل جملة «فيه بانثينول» · وهي جملة صادقة مية بالمية
   سواء كان جوّاها نص بالمية أو عشرة · ولهيك ما بتكفي.

   ── ليش غامق ────────────────────────────────────────────────────────
   الصفحة كانت **ثمانية سكاشن كلها فاتح**، وريّان حسّها «نايمة». والقياس
   أثبته: `band-light` مقابل `band-mist` تباينهم **1.03:1** يعني غير مرئي
   عملياً. فهاد السكشن صار **الغامق الوحيد بوسط الصفحة** · وهو اللي بيعمل
   الإيقاع.
   ⚠️ و`band-mist` انشالت من الكلاسات: معرّفة بـtokens.css بعد `luvit-deep`
      بآلاف الأسطر، فبتدهس لون الخلفية وبتلغي كل الشغل.

   ── وشو انشال من اقتراح الوكلاء ──────────────────────────────────────
   اقترحوا نضيف شريط «سعر الصيدلية نفسه». **انشال**: القصة محكية أصلاً
   بـp6-delivery وبـp7-faq · إضافتها هون بتخلي ثلاث سكاشن متتالية بنفس
   الجملة. */
function s5() {
  const LADDER = [
    { pct: null, name: 'فيه بانثينول',
      note: 'جملة صادقة مية بالمية · وبتزبط سواء كان جوّاها نص بالمية أو عشرة. ولهيك ما منكتفي فيها.',
      href: null },
    { pct: '10%', slug: 'moisturizing-repairing-cream', product: 'كريم الترطيب والترميم',
      note: 'ترطيب البشرة وعلاجها بشكل مكثّف · أعلى جرعة بالتشكيلة كلها.' },
    { pct: '5%', slug: 'intensive-hydrating-serum', product: 'سيروم الترطيب المكثّف',
      note: 'نص جرعة الكريم · وبالروتين بيجي قبله.' },
    { pct: '2%', slug: 'vitamin-c-serum', product: 'سيروم فيتامين سي',
      note: 'ترطيب حاجز البشرة · هون البانثينول مساعد، والبطل 10% فيتامين سي.' },
    { pct: '1%', slug: 'clarifying-pore-tightening-toner', product: 'تونر تضييق المسامات',
      note: 'ترطيب طبقات البشرة · بيوازن الحموضة اللي بيشيلها التقشير.' },
    { pct: '0.5%', slug: 'hydrating-gel-cleanser', product: 'غسول البشرة الجافة والحساسة',
      note: 'تغذية وحماية · الغسول بينشطف، فجرعة أعلى بتروح بالميّ.' },
  ];

  /* 🔴 كل رقم هون **بينفحص من الكتالوج وقت البناء** · لو تغيّرت نسخة
     الكتالوج وما عاد الرقم مطابقاً، البناء بيوقف بدل ما ينشر رقماً كاذباً. */
  for (const row of LADDER) {
    if (!row.pct) continue;
    const rec = cat.منتجات.find((p) => {
      const w = woo.منتجات.find((x) => x.slug === row.slug);
      return w && p.woo === w.id;
    });
    if (!rec) { console.error('🔴 سلّم البانثينول · ما لقيت ' + row.slug + ' بالكتالوج'); process.exit(1); }
    const found = (rec.actives || []).find((a) => (a.name || '').includes('بانثينول'));
    if (!found) { console.error('🔴 ' + row.slug + ' ما فيه بانثينول بالكتالوج'); process.exit(1); }
    if (found.pct !== row.pct) {
      console.error('🔴 نسبة البانثينول بـ' + row.slug + ' صارت ' + found.pct + ' والمكتوب ' + row.pct);
      process.exit(1);
    }
  }

  const rows = LADDER.map((r) => {
    const num = r.pct
      ? `        <span class="luvit-ing__pct">${ltr(r.pct)}</span>`
      : '        <span class="luvit-ing__pct" aria-hidden="true">؟</span>';
    const title = r.href === null
      ? `          <p class="luvit-ing__name">${esc(r.name)}</p>`
      : `          <p class="luvit-ing__name"><a href="/product/${esc(r.slug)}/">${esc(r.product)}</a></p>`;
    return [
      '      <div class="luvit-ing__row">',
      num,
      '        <div class="luvit-ing__body">',
      title,
      `          <p class="luvit-ing__note">${esc(r.note)}</p>`,
      '        </div>',
      '      </div>',
    ].join('\n');
  }).join('\n');

  return `<!--
  LUVIT · صفحة المتجر (/products/) · سكشن ٥ من ٨ · سلّم البانثينول
  🔴 مولّد بـ_أدوات/build-shop-page.mjs · لا تعدّله بالإيد، عدّل المولّد.

  · **السكشن الغامق الوحيد بالصفحة** · وهو اللي بيعمل الإيقاع.
    والصفحة قبله كانت ثمانية سكاشن فاتح، وتباين band-light مقابل band-mist
    مقيس **1.03:1** يعني غير مرئي · فالإيقاع كان وهماً.
  · luvit-deep بيرسم ماءه الحي: توهّجان بدورتين ٣٤ و٤٤ ثانية وأشعة ٤٠ ·
    كلها transform وopacity بس، وكلها بتنطفي تحت prefers-reduced-motion.
  · luvit-deep__rays لازم يكون **أول ابن**.
  · luvit-cut-top بيخلي السكشن يقص حافته العليا بنفسه · **ولا موجة قبله**:
    شريط بلون واحد ما بيقدر يطابق تدرّجاً عمودياً وتوهّجين وحقل فقاعات.
  · والموجة **بعده** لأنه غامق داخل على فاتح · و--wave-fill لازم يطابق لون
    p6-delivery بالضبط وهو band-light = #FFFFFF. حرف غلط = شريط أبيض عايم.
  · 🔴 والمرساة ingredients ممنوع تتغيّر · الفوتر والرئيسية وأربع صفحات
    روتين بيربطوا /products#ingredients، وكسرها ما بيرمي أي خطأ.
-->
<section class="luvit-section luvit-section--dark luvit-deep luvit-cut-top"
         data-nav-bg="dark" data-luvit-bubbles="12" id="ingredients">
  <span class="luvit-deep__rays" aria-hidden="true"></span>

  <div class="luvit-section__inner">
    <div class="luvit-section__head" data-luvit="reveal">
      <h2 class="luvit-section__title">الرقم هو اللي بيحاسبنا</h2>
      <p class="luvit-section__sub">اسم المكوّن عالعلبة إشي بديهي، وأي علامة بتقدر تكتبه · اللي بيفرق هو قدّيش منه. خدي مادة وحدة، البانثينول، وشوفي شو بيصير فيها من منتج لمنتج.</p>
    </div>

    <div class="luvit-ing luvit-ing--on-dark" data-luvit="stagger">
${rows}
    </div>

    <div class="luvit-section__foot">
      <a class="luvit-btn luvit-btn--ghost luvit-btn--on-dark" href="#products">شوفي التشكيلة كاملة</a>
    </div>
  </div>
</section>
<div class="luvit-wave luvit-wave--drift" style="--wave-fill:#FFFFFF;background:#0B9198" aria-hidden="true"></div>
`;
}

/* ── ٦ · مفحوص وموثّق · الشهادات ────────────────────────────────────
   🔴 هالسكشن كان «التوصيل والدفع» و**كان بيعيد نفسه**: حقيقتان من
   شريط الوعد بأول الصفحة، وثالثة من سكشن الأسئلة اللي بعده.

   والبديل مبني على المؤكد وحده · الشهادات من الكتالوج الرسمي،
   **وأعدادها محسوبة من البيانات مش مكتوبة**. */
function s6() {
  /* المجموع = الكتالوج + التلاتة برّاه · ولازم يساوي المفردات بالمتجر */
  const total = cat.منتجات.length + Object.keys(EXTRA_CERTS).length;
  if (total !== singles.length) fail('الشهادات · ' + total + ' منتجاً بالعدّ مقابل ' + singles.length + ' مفردة بالمتجر');
  const tally = {};
  for (const p of cat.منتجات) for (const c of (p.certs || [])) tally[c] = (tally[c] || 0) + 1;
  for (const list of Object.values(EXTRA_CERTS)) for (const c of list) tally[c] = (tally[c] || 0) + 1;
  const rows = Object.entries(tally)
    .map(([k, n]) => ({ n, label: cat.شهادات[k] || k }))
    .filter((r) => r.label)
    .sort((a, b) => b.n - a.n);

  const all = rows.filter((r) => r.n === total).length;

  return `<!--
  LUVIT · صفحة المتجر (/products/) · سكشن ٦ من ٨ · مفحوص وموثّق
  🔴 مولّد بـ_أدوات/build-shop-page.mjs · لا تعدّله بالإيد.

  · **كان سكشن «التوصيل والدفع» وانشال** لأنه كان بيعيد حقيقتين من شريط
    الوعد بأول الصفحة وثالثة من سكشن الأسئلة · يعني ما كان بيقول جديداً.
    وحقائق التوصيل ضلّت بمكانين: شريط الوعد فوق، وصفحة /shipping كاملة.
  · والشهادات **أقوى بديل عن آراء الزبونات** اللي لساها ما وصلت · وهي
    الفجوة اللي ولا واحد من المراجع الخمسة ساداها (Real Cosmetics عمرها
    سنين ولها ١٠ فروع وما فيها ولا مراجعة).
  · 🔴 والأعداد **محسوبة من الكتالوج وقت البناء** · «٩ من ٩» بتقول إشي،
    و«منتجاتنا مفحوصة» لحالها ادعاء زي أي ادعاء.
  · وعائلة التخطيط **شرائح مش بطاقات** · مقصود، عشان تكسر تكرار الشبكة.
-->
<section class="luvit-section band-light" data-nav-bg="light" id="delivery">
  <div class="luvit-section__inner">
    <div class="luvit-section__head luvit-section__head--start" data-luvit="reveal">
      <h2 class="luvit-section__title">مفحوص، ومكتوب على العبوة</h2>
      <p class="luvit-section__sub">المواد الخام كورية والتصنيع بتركيا · ${all === 1 ? 'و<b>كل</b> منتج بالتشكيلة مفحوص من ناحية جلدية، والباقي مكتوب رقماً برقم' : 'و' + all + ' شهادات على <b>كل</b> منتج بالتشكيلة، مش على واحد مختار'}.</p>
    </div>

    <div class="luvit-certs" data-luvit="stagger">
${rows.map((r) => {
  const flag = r.n === total ? ' data-all' : '';
  return `      <span class="luvit-certs__item"${flag}><b>${ltr(r.n + ' / ' + total)}</b> ${esc(r.label)}</span>`;
}).join('\n')}
    </div>

    <div class="luvit-section__foot">
      <a class="luvit-btn luvit-btn--ghost" href="/shipping">الشحن والتوصيل بالتفصيل</a>
    </div>
  </div>
</section>
`;
}

/* ── ٧ · الأسئلة · مفتوحة مش أكورديون ──────────────────────────────── */
function s7() {
  /* 🔴 الترتيب **بالخوف أول** · هدول الأسئلة اللي بتوقف الشراء بالدفع
     عند الاستلام.
     ⚠️ وممنوع أي ادعاء من نوع «الأسئلة اللي بتوصلنا أكثر شي» · المتجر
        ما انطلق بعد فولا سؤال «وصل». */
  const qa = [
    ['كم بتوصل الطلبية؟',
     'من يوم ليومين · لكل محافظات الأردن بدينارين ونص. والتوصيل <strong>مجاني</strong> مع أي روتين جاهز.'],
    ['وإذا المنتج ما ناسب بشرتي؟',
     'المفتوح ما بيرجع، وهاد معيار صناعة مستحضرات التجميل كلها لأسباب صحية · والمعيب بيرجع دايماً.'],
    /* 🔴 كان «ليش ما في خصومات؟» (سعر الموقع = سعر الصيدلية) · ريّان ٣ أيلول:
       «قبل الإطلاق لازم يكون فيه كوبونات كثيرة · والكوبونات مهمة كثير باستراتيجية
       البيع» · فالسؤال انقلب لطريقة استعمال الكوبون · ⚠️ ولا رقم خصم هون. */
    ['عندي كوبون · وين بحطه؟',
     'بصفحة السلة أو إتمام الطلب في خانة «إضافة قسيمة» · اكتبي الكود قبل ما تأكّدي وبيبين الخصم بالمجموع على طول.'],
    ['كيف بعرف إن النِسَب صحيحة؟',
     'كل نسبة معروضة هون مكتوبة على العبوة نفسها · تقدري تقريها لمّا توصلك وتتأكدي بنفسك.'],
    ['أشتري روتين كامل ولا منتج واحد؟',
     'لو مبلّشة، الروتين الجاهز بيوفّر عليكِ الاختيار ومرتّب بترتيبه الصح · ولو ناقصك خطوة وحدة بس، المنتج المفرد أوفر.'],
    ['بقدر أستعمل أكثر من سيروم؟',
     'نعم، بس مش بنفس الوقت · وسيروم التقشير تحديداً بالليل، مرة بالأسبوع بالبداية ولحد مرتين لما تتعوّد بشرتك · والأفضل بالشتاء أو بعيداً عن الشمس، وواقي الشمس الصبح إلزامي. الروتينات الجاهزة مرتّبة بحيث ما يتعارضوا.'],
  ];

  return `<!--
  LUVIT · صفحة المتجر (/products/) · سكشن ٧ من ٨ · الأسئلة
  🔴 مولّد · لا تعدّله بالإيد.

  · **مفتوحة مش أكورديون.** الأجوبة هون هي معالجة الاعتراضات، وهي أهم
    محتوى ثقة عندنا لأن ما في ولا مراجعة زبونة بعد · ومحتوى الثقة
    المخبّى وراء ضغطة هو محتوى ما انقرا.
  · عمودان على الشاشات المتوسطة وفوق، وعمود على التلفون.
  · وعائلة التخطيط **نصّية بخط رفيع** · بلا صناديق وبلا بطاقات، فبتكسر
    تكرار الشبكة اللي بباقي الصفحة.
-->
<section class="luvit-section band-mist" data-nav-bg="light" id="products-faq">
  <div class="luvit-section__inner">
    <div class="luvit-section__head" data-luvit="reveal">
      <h2 class="luvit-section__title">أسئلة قبل ما تطلبي</h2>
    </div>

    <dl class="luvit-qa" data-luvit="stagger">
${qa.map(([q, a]) => [
  '      <div>',
  `        <dt>${q}</dt>`,
  `        <dd>${a}</dd>`,
  '      </div>',
].join('\n')).join('\n')}
    </dl>

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

/* ══════════════════════════════════════════════════════════════════════
   ٧ · محتوى صفحة ووردبريس · جاهز للتركيب
   ══════════════════════════════════════════════════════════════════════
   الصفحة ٢٠٦ محتواها **بلوكات Gutenberg من نوع wp:html** بالـpost_content
   (مش إلمنتور · إلمنتور بيعطيها الهيدر والفوتر بس عبر القالب).
   مقيس على الحي: ٨ بلوكات و٨ سكاشن · تطابق واحد لواحد مع ملفاتنا.

   فبينكتب الملف هون، والمتصفح بيسحبه من السيرفر المحلي وبيحطه بالصفحة ·
   بدل ما ينتنقل ٣٠ كيلوبايت جوّا مكالمة أداة.

   ⚠️ والموجة اللي بعد سكشن ٥ **مش سكشن** · هي div شقيق. فبتنحط بنفس
      البلوك تبع سكشن ٥ عشان ما تنفصل عنه بحاوية بلوك تانية. */
const wpContent = FILES.map(([name, fn]) => {
  const html = fn().replace(/^<!--[\s\S]*?-->\n/, '').trim();
  return '<!-- wp:html -->\n' + html + '\n<!-- /wp:html -->';
}).join('\n\n');

const OUTDIR = path.join(REPO, '_وارد');
fs.mkdirSync(OUTDIR, { recursive: true });
fs.writeFileSync(path.join(OUTDIR, 'page206-content.html'), wpContent, 'utf8');
console.log('\n✅ محتوى الصفحة جاهز · _وارد/page206-content.html');
console.log('   ' + Buffer.byteLength(wpContent, 'utf8') + ' بايت · ' +
            (wpContent.match(/<!-- wp:html -->/g) || []).length + ' بلوك · ' +
            (wpContent.match(/<section /g) || []).length + ' سكشن');
