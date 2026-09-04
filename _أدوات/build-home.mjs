#!/usr/bin/env node
/**
 * ============================================================================
 * بناء الصفحة الرئيسية · build-home.mjs
 * ============================================================================
 *   node _أدوات/build-home.mjs
 *
 * المخرَج:
 *   library/sections/h*.html      ← نسخة مقروءة لكل سكشن (للمراجعة والـgit)
 *   _وارد/page40-widgets.json     ← خريطة widgetId ← html  +  قائمة الحذف
 *
 * بعدها صفحة الأدمن بتسحب الـJSON من ممر serve.js وبتكتبه على
 * `_elementor_data` بالـREST. **قراءة وتعديل وإرجاع** · ولا مرة إعادة بناء
 * للعُقَد، لأن كل حاوية جذر عليها إعدادات إلمنتور (حشوة · خلفية ·
 * `data-nav-bg`) وإعادة بنائها بتضيّعها.
 *
 * ── 🔴 ليش انبنى · ريّان ١ أيلول ─────────────────────────────────────────
 * «شكل الصفحة فيها تكرار كثير بتحس ما فيها إبداع».
 *
 * والقياس على الصفحة الحيّة أعطى السبب بالضبط:
 *   · **٨ رؤوس من ٨ كلها بمحاذاة وسط** · نفس الحركة ثماني مرات
 *   · ٩ سكاشن من ١٢ بنفس القالب (عنوان + سطر + شبكة)
 *   · ٤ سكاشن **بلا ولا صورة** · ٢٥١٨px نصّ خالص
 *   · ٥ سكاشن **بلا أي زر** · بتقرا وما في مخرج
 *
 * ⚠️ **وقياسي الأول كان غلطاً وانتصحّح:** قلت «١١ من ١٢ فاتحة» وهاد مبني
 *    على `getComputedStyle().backgroundColor` · و`.luvit-deep` خلفيته
 *    **تدرّج**، فالخاصية بترجع شفافاً والسكشن بينعدّ فاتحاً. الصح **٤ من
 *    ١٢ غامقة**، والإيقاع اللوني موجود أصلاً. يعني العلّة **بالشكل** لا
 *    باللون · وهاد غيّر العلاج كله.
 *    (نفس فئة الفخ المسجَّلة: أداة القياس بتكذب · افحص طريقة القياس أول.)
 *
 * ── البنية الجديدة · ١٢ ← ٩ ──────────────────────────────────────────────
 * الفكرة الحاكمة **نزول**: الهيرو قطرة بتنزل بمي عميقة، والصفحة بتكمّل
 * النزول وبتنتهي بالعمق. اللون بيتناوب، و**الشكل** بيتغيّر مع كل محطة.
 *
 *   جذر ٠  غامق  الهيرو            ← **ما بينلمس**
 *   جذر ١  فاتح  شريط الثقة        · بلا رأس أصلاً
 *   جذر ٢  فاتح  الروتينات         · رأس وسط + بطاقات عرضية بأربع عبوات
 *   جذر ٣  غامق  الكويز            · بلا رأس
 *   جذر ٤  فاتح  **النتيجة**        · **رأس جانبي البداية** + قبل/بعد حقيقي
 *   جذر ٥  غامق  المكوّنات          · **رأس البداية** + صورة العبوة جنبها
 *   جذر ٦  فاتح  **ليش لَف إت**     · **رأس ملتصق** والمحتوى بيمرق جنبه
 *   جذر ٧  غامق  **الآراء**         · اقتباسات حقيقية بأحجام مختلفة
 *   جذر ٨  ✗ بينحذف (كيف تطلبي · مكانها الأسئلة والشحن)
 *   جذر ٩  ✗ بينحذف (الآراء القديمة · انتقلت لجذر ٧)
 *   جذر ١٠ ✗ بينحذف (الأسئلة · موجودة بصفحتها وبصفحة المتجر)
 *   جذر ١١ غامق  الختام
 *
 * وأربع معالجات رأس مختلفة بدل وحدة: **بلا رأس · وسط · بداية · ملتصق**.
 *
 * 🔴 والمنتجات انحذفت (كانت جذر ٤) لأن الرئيسية **مش كتالوج** · قاعدة
 *    ريّان بالحرف: «الـhome page هي الصفحة اللي فيها show off، مش الصفحة
 *    اللي فيها البكجات كاملة والمنتجات».
 * ============================================================================
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ROUTINES as ROUTINES_SRC, عدد, منطوق, أطوال } from './routines.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '..');
const LIB = path.join(REPO, 'library');
const SEC = path.join(LIB, 'sections');
const OUT = path.join(REPO, '_وارد');
const TOKENS = fs.readFileSync(path.join(LIB, 'tokens.css'), 'utf8');

/* ── البيانات · نفس مصادر صفحات الروتينات والمتجر ──────────────────────
   🔴 ولا رقم بينكتب بالإيد هون · الأسعار والصور بتيجي من ووكومرس الحي،
      والنِسَب من الكتالوج الرسمي. أي رقم مكتوب نصّاً بهالملف = باغ. */
const woo = JSON.parse(fs.readFileSync(path.join(OUT, 'woo-products.json'), 'utf8'));
const cat = JSON.parse(fs.readFileSync(path.join(REPO, '_خطة', 'بيانات-المنتجات-الرسمية.json'), 'utf8'));

const P = {};
for (const rec of cat.منتجات) {
  const w = woo.منتجات.find((x) => x.id === rec.woo);
  if (!w) continue;
  P[rec.sku] = {
    ar: rec.ar_رسمي || w.name,
    slug: w.slug,
    price: w.price,
    id: w.id,
    img: (w.images[0] || {}).src || null,
    actives: rec.actives || [],
  };
}

/* 🔴 والكتالوج **مش جرد المتجر** · هو لقطة ٩ منتجات من بروفايل الصيدليات،
   والمتجر فيه ١٢ مفرداً. التلاتة الزيادة (L103 سنتيلا · L112 واقي الشمس ·
   L119 ألفا أربوتين) موجودين بووكومرس وحده · وبلاهم روتين توحيد اللون
   بيوقف البناء بـ«SKU مش موجود». (نفس الحلقة موجودة بـbuild-routine-pages.) */
/* 🔴 الحجم للمنتجات اللي برّا الكتالوج · بينستخرج من ووكومرس لا بينترك فاضياً.
   بلاها كان بيطبع **`null` نصاً على الصفحة الحيّة** تحت خطوتين
   («null · عبوة كاملة») · شفتها بلقطة ١ أيلول.
   ⚠️ والأرقام بتيجي **بصيغتين**: `30ml` لاتيني، و«٥٠ مل» بأرقام عربية
      وكلمة عربية · فالسحب لازم يمسك الاثنين. */
const عربي = { '٠':'0','١':'1','٢':'2','٣':'3','٤':'4','٥':'5','٦':'6','٧':'7','٨':'8','٩':'9' };
function حجم(w) {
  const t = ((w.name || '') + ' ' + (w.short || '')).replace(/[٠-٩]/g, (d) => عربي[d]);
  const m = t.match(/(d+)s*(?:ml|مل)/i);
  return m ? m[1] + 'ml' : null;
}

for (const w of woo.منتجات) {
  if (/^روتين /.test(w.name)) continue;              /* البكجات مش قطعاً */
  if (Object.values(P).some((x) => x.id === w.id)) continue;
  P[w.sku || ('W' + w.id)] = {
    ar: w.name, slug: w.slug, price: w.price, id: w.id,
    img: (w.images[0] || {}).src || null, actives: [],
  };
}

/* ⚠️ خمسة لا أربعة · روتين توحيد اللون خطواته خمس */
const AR = ['', '١', '٢', '٣', '٤', '٥'];

/* 🔴 الروتينات من `_أدوات/routines.mjs` · المصدر الوحيد.
   كانت مكتوبة هون **تلاتة** ومكرَّرة بملفّين تانيين، والمتجر بيقرا من
   ووكومرس فبيعرض أربعة · فالرئيسية كانت بتخبّي روتيناً موجوداً للبيع.
   ⚠️ و`steps` هون كانت لستة SKU مسطّحة، وبالمصدر ثلاثيّات
      [SKU, عنوان, وصف] · فبنسحب العمود الأول. */
/* ⚠️ `wooId` كان مسقوطاً من هالإعادة · انضاف ٤ أيلول.
   بدونه `تخفيض()` ما بتلاقي المنتج باللقطة وبترجع «مش عليه عرض» **بصمت**،
   فالرئيسية بتطبع مجموع القطع والسلة بتحاسب سعر الإطلاق. ولا خطأ بيطلع ·
   بس رقمان مختلفان بصفحتين. */
const ROUTINES = ROUTINES_SRC.map((r) => ({
  key: r.key, en: r.en, ar: r.ar, who: r.tag, wooId: r.wooId,
  steps: r.steps.map((x) => x[0]),
}));

/* بوابة · كل SKU مذكور لازم يكون انحلّ من ووكومرس */
for (const r of ROUTINES) {
  for (const k of r.steps) {
    if (!P[k]) { console.error('🔴 SKU مش موجود: ' + k + ' (روتين ' + r.key + ')'); process.exit(1); }
    if (!P[k].img) { console.error('🔴 ' + k + ' بلا صورة'); process.exit(1); }
  }
}

const money = (n) => Number(n).toFixed(2);
const total = (r) => money(r.steps.reduce((s, k) => s + Number(P[k].price), 0));

/**
 * تخفيض الروتين · بيقرا **سعر ووكومرس الفعلي** من اللقطة.
 *
 * 🔴 `total()` فوق بتحسب **مجموع القطع** · وكانت هي السعر لحد ٣ أيلول لأن
 *    البكج كان بيتباع بمجموع قطعه بالضبط. بـ٤ أيلول صار عليه عرض إطلاق،
 *    فصار المجموع هو **المشطوب** والسعر الفعلي إجا من ووكومرس.
 *    ⤷ ولو ضلّينا نطبع `total(r)` كانت الرئيسية بتقول ٦١ والسلة بتحاسب ٤٨.
 *
 * ⚠️ وبيرجّع فاضياً لما ما يكون في عرض · فالماركب ما بينحشى بعناصر فاضية.
 */
const تخفيض = (r) => {
  const pack = woo.منتجات.find((x) => x.id === r.wooId);
  const now = pack && pack.price ? Number(pack.price) : Number(total(r));
  const was = pack && pack.regular ? Number(pack.regular) : Number(total(r));
  if (!(was > now)) { return { onSale: false, now: money(now) }; }
  return {
    onSale: true,
    now: money(now),
    was: money(was),
    saves: money(Math.round((was - now) * 100) / 100),
  };
};

/* ═══════════════════════════════════════════════════════════════════════
   الآراء · **كلها حقيقية ومستخرَجة من لقطات بعتها ريّان ٣١ آب**
   المصدر الخام محفوظ بـ`_وارد-ريان/social-proof.json` مع رقم اللقطة.

   🔴 تلات قواعد ما بتنكسر:
     ١ · **ولا كلمة انتغيّرت.** الأخطاء الإملائية («حستيه» · «مفتتح»)
         مكتوبة كما هي · تصحيحها = تغيير كلام الزبونة.
     ٢ · **ولا اسم مخترع.** ما في ولا رأي إله اسم موثّق، فكلهن «زبونة».
         الأسماء المخترعة القديمة (رنا خ. · ليان م. · سلمى ع. · دانا ف.)
         **انشالت** · كانت كذباً على صفحة رئيسية.
     ٣ · **ولا نجوم.** التقييم بالنجوم القديم كان مخترَعاً كمان.
   ═══════════════════════════════════════════════════════════════════════ */
const QUOTES = [
  {
    wide: true, src: 'm22352-12',
    text: 'انا مبسوطة من نتيجة الفيتامين سي الحمدلله أبدا ما تحسست منه وبحطه كل يوم قبل ما انام وبعدين مرطب وكان عندي حبة كبيرة بلش ينشفها',
    by: 'زبونة · رسالة خاصة نشرتها Luv it على إنستجرام',
  },
  {
    wide: true, src: 'm22352-14',
    text: 'انا مبسوطة كتير ع الغسول و المرطب لطيفين جدا و بتحسي الوجه بينظف بحق الله. اختي وجهها فرق كتير ماشالله الحبوب خفت و مفتتح الحمدلله',
    by: 'زبونة · رسالة خاصة نشرتها Luv it على إنستجرام',
  },
  {
    src: 'm22352-03',
    text: 'وجهي من الجهة اليمين صار اهدى بكثير ما بعرف ليش هاي الجهة دايما متهيجة هسا صارت احسن واهدى',
    by: 'زبونة · من محادثة استشارة نشرتها د. رَماس عبدالنبي',
  },
  {
    src: 'm22352-03',
    text: 'مافي لسعة بعد المرطب والغسول',
    by: 'زبونة · من نفس المحادثة',
  },
  {
    src: 'm22352-04',
    text: 'ثاني شي حستيه بصغر المسام',
    by: 'زبونة · من محادثة خاصة نشرتها د. رَماس',
  },
];

/* ═══════════════════════════════════════════════════════════════════════ */
const H = (s) => s.replace(/^\n/, '').replace(/\s+$/, '');

/* ── جذر ١ · شريط الثقة ────────────────────────────────────────────────
   بيضل زي ما هو · هو **السكشن الوحيد اللي كان مختلف الشكل أصلاً**
   (بلا رأس، صف أيقونات)، فتغييره بيقلّل التنويع لا بيزيده. */
const ICON = {
  truck: '<rect x="1" y="6" width="14" height="11" rx="2"/><path d="M15 9h4l3 3v5h-7z"/><circle cx="6" cy="19" r="1.6"/><circle cx="18" cy="19" r="1.6"/>',
  card: '<rect x="2" y="6" width="20" height="13" rx="2"/><path d="M2 10h20"/><circle cx="12" cy="14.5" r="2"/>',
  shield: '<path d="M12 2 4 6v6c0 5 3.4 8.9 8 10 4.6-1.1 8-5 8-10V6z"/><path d="m9 12 2 2 4-4"/>',
  chat: '<path d="M21 11.5a8.4 8.4 0 0 1-9 8.4L3 21l1.1-9A8.4 8.4 0 1 1 21 11.5z"/>',
};
const svg = (k) => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" ' +
  'stroke-linecap="round" stroke-linejoin="round">' + ICON[k] + '</svg>';

const TRUST = [
  /* 🔴 الصياغة كلمة ريّان ٣ أيلول بالحرف: «من يوم ليومين بدينارين ونص
     ومجاني مع الروتين · هاي العبارة الصح والباقي من بيانات عندك مش محدّثة».
     والرقم مصدره ووكومرس (flat_rate 2.50 · زون الأردن) لا مكتوب من الراس ·
     وأي تغيير فيه لازم يتغيّر هون وبـs1-shipping وf1-faq وp7-faq وwoo.php.
     ⚠️ و«مجاني مع أي روتين» مش هون · الشريط أربع خانات ونصّها قصير،
        والوعد مكتوب كامل بصفحة المنتج وبالشحن وبالأسئلة وبـ«من نحن». */
  ['truck', 'توصيل لكل الأردن', 'من يوم ليومين · بدينارين ونص'],
  ['card', 'الدفع عند الاستلام', 'ادفعي لمّا يوصلك'],
  ['shield', 'أصلي <span data-luvit="counter">100</span>٪', 'وصلك تالف؟ منستبدله'],
  ['chat', 'منرافقك خطوة بخطوة', 'استشارة مجانية'],
];

const sTrust = () => H(`
<section class="luvit-section luvit-section--tight band-light" data-nav-bg="light">
  <div class="luvit-section__inner">
    <div class="luvit-trust" data-luvit="stagger">
${TRUST.map(([i, t, n]) => `
      <div class="luvit-trust__item">
        <span class="luvit-trust__icon" aria-hidden="true">${svg(i)}</span>
        <p class="luvit-trust__title">${t}</p>
        <p class="luvit-trust__note">${n}</p>
      </div>`).join('\n')}
    </div>
  </div>
</section>
`);

/* ── جذر ٢ · الروتينات ─────────────────────────────────────────────────
   🔴 اللي كان غلطاً: البطاقة كانت بتوري **صورة البكج** (عبوتان بالصورة)
      والكوبي فوقها بيقول «أربع خطوات». يعني الصورة بتناقض النص بنفس
      البطاقة · ووحدة من الزبونات بتشوف اثنتين وبتقرا أربعة.
   والحل: **العبوات الأربع نفسها**، من نفس مصدر صفحة الروتينات، فما
   بيصير تناقض بين صفحتين كمان. */
const sRoutine = () => H(`
<section class="luvit-section band-light" data-nav-bg="light" id="routine">
  <div class="luvit-section__inner">

    <div class="luvit-section__head" data-luvit="reveal">
      <h2 class="luvit-section__title">الترتيب هو الفكرة كلها</h2>
      <p class="luvit-section__sub">
        ${منطوق(عدد)} روتينات · نفس الترتيب بكلهن، واللي بيتغيّر المنتجات
        حسب اللي بدك توصليله. وسعر الروتين مجموع قطعه بالضبط.
      </p>
    </div>

${ROUTINES.map((r, i) => `
    <article class="luvit-home-rt" data-luvit="reveal">
      <div class="luvit-home-rt__top">
        <div class="luvit-home-rt__id">
          <p class="luvit-home-rt__eyebrow">${r.en}</p>
          <h3 class="luvit-home-rt__title">
            <a href="/routines/${r.key}">${r.ar}</a>
          </h3>
          <p class="luvit-home-rt__who">${r.who}</p>
        </div>
        <div class="luvit-home-rt__buy">
          ${(() => { const خ = تخفيض(r); return خ.onSale
            ? `<s class="luvit-card__was"><span dir="ltr">${خ.was}</span> د.أ</s>`
            : ''; })()}
          <span class="luvit-home-rt__price"><span dir="ltr">${تخفيض(r).now}</span> د.أ</span>
          ${(() => { const خ = تخفيض(r); return خ.onSale
            ? `<span class="luvit-card__save">وفّرتِ ${خ.saves} د.أ</span>`
            : ''; })()}
          <a class="luvit-btn luvit-btn--arrow" href="/routines/${r.key}">شوفي الروتين</a>
        </div>
      </div>

      <ol class="luvit-steps luvit-steps--compact">
${r.steps.map((k, n) => `
        <li class="luvit-step">
          <span class="luvit-step__num">${AR[n + 1]}</span>
          <span class="luvit-step__media">
            <img src="${P[k].img}" alt="${P[k].ar}" width="400" height="500"
                 loading="${i === 0 ? 'eager' : 'lazy'}" decoding="async">
          </span>
          <span class="luvit-step__body">
            <span class="luvit-step__title">${P[k].ar}</span>
          </span>
        </li>`).join('')}
      </ol>
    </article>`).join('\n')}

    <div class="luvit-section__foot">
      <a class="luvit-btn luvit-btn--ghost" href="/routines">كل الروتينات</a>
    </div>

  </div>
</section>
`);

/* ── جذر ٣ · الكويز · غامق · بلا رأس ───────────────────────────────── */
const OPT = [
  ['dry', '💧', 'جفاف وشدّ'],
  ['oil', '✦', 'لمعة ودهون'],
  ['acne', '◇', 'حبوب'],
  ['calm', '✿', 'احمرار وحساسية'],
];
const sQuiz = () => H(`
<section class="luvit-section luvit-section--dark luvit-deep luvit-cut-top" data-nav-bg="dark"
         data-luvit-bubbles="10" id="quiz">
  <span class="luvit-deep__rays" aria-hidden="true"></span>
  <div class="luvit-section__inner">
    <div class="luvit-quiz luvit-quiz--on-dark" data-luvit="reveal">
      <h2 class="luvit-quiz__q">شو أكثر إشي بيزعجك ببشرتك؟</h2>

      <div class="luvit-optiongrid">
${OPT.map(([v, i, l]) => `
        <label class="luvit-option">
          <input type="radio" name="home-quiz" value="${v}">
          <span class="luvit-option__icon" aria-hidden="true">${i}</span>
          <span class="luvit-option__label">${l}</span>
        </label>`).join('')}
      </div>

      <div class="luvit-quiz__foot">
        <a href="/quiz" class="luvit-btn luvit-btn--arrow">كمّلي الاختبار</a>
        <p class="luvit-quiz__hint">أقل من دقيقة · ٥ أسئلة بس.</p>
      </div>
    </div>
  </div>
</section>

<div class="luvit-wave luvit-wave--drift" style="--wave-fill:#FFFFFF;background:#0B9198" aria-hidden="true"></div>
`);

/* ── جذر ٤ · النتيجة · قبل/بعد حقيقي ───────────────────────────────────
   🔴 اللي كان مكانه: سلايدر فيه **صورتان SVG مرسومتان** مكتوب عليهن
      حرفياً BEFORE وAFTER، وفوقهن كوبي بيقول «صور حقيقية بلا فلاتر».
      يعني الكوبي بيقول «حقيقية» والصورة مرسومة · وهاد أخطر شي كان
      عالصفحة.

   واللي محلّه: **حالة حقيقية** من استشارة د. رَماس عبدالنبي، شريكة
   معتمدة للعلامة (إلها كود خصم ورابط). بعت ريّان اللقطة ٣١ آب.

   ⚠️ والحجم صغير **بقرار مقيس** · أوسع لوحة بالمصدر ١٧٤ بكسل.
      مشروح بـ_أدوات/crop-before-after.mjs وبـtokens.css.

   🔴 **بند إطلاق مفتوح:** هاي وجه إنسانة حقيقية · بدها إذن مكتوب منها
      ومن د. رَماس ومن صاحب العلامة قبل ما الموقع ينزل. */
const sResult = () => H(`
<section class="luvit-section band-mist" data-nav-bg="light" id="result">
  <div class="luvit-section__inner">
    <div class="luvit-section__head luvit-section__head--start" data-luvit="reveal">
      <p class="luvit-section__eyebrow">One real case</p>
      <h2 class="luvit-section__title">أسبوعان، وحالة وحدة بس</h2>
      <p class="luvit-section__sub">
        ما منعرض قبل وبعد لكل وحدة، لأن ما عنا غير حالة وحدة موثّقة لهلأ.
        هاي هي، وبنقول عنها كل اللي منعرفه.
      </p>
    </div>

    <div class="luvit-case" data-luvit="reveal">
      <div class="luvit-case__pair">
        <figure class="luvit-case__fig">
          <img src="/wp-content/uploads/2026/09/luvit-case-a-before.webp"
               alt="بشرة الخد قبل بداية الروتين" width="260" height="406"
               loading="lazy" decoding="async">
          <span class="luvit-case__tag">قبل</span>
        </figure>
        <figure class="luvit-case__fig">
          <img src="/wp-content/uploads/2026/09/luvit-case-a-after.webp"
               alt="نفس المنطقة بعد أسبوعين من الروتين" width="278" height="434"
               loading="lazy" decoding="async">
          <span class="luvit-case__tag">بعد أسبوعين</span>
        </figure>
      </div>

      <div class="luvit-case__body">
        <p class="luvit-case__note">
          <strong>من وين الصورة:</strong> حالة تابعتها د. رَماس عبدالنبي، مستشارة بشرة
          وشريكة للعلامة، ونشرتها على حسابها. البطل بحالتها كان المرطب مع وقف
          المنتجات اللي كانت بتهيّج بشرتها.
        </p>
        <p class="luvit-case__note">
          <strong>وشو ما منقوله:</strong> هاي حالة وحدة، والنتيجة بتختلف من بشرة
          لبشرة وحسب الالتزام والمدة والعوامل اللي برّا الروتين. مش وعداً، ولا
          متوسّطاً لنتائج.
        </p>
        <div class="luvit-section__foot">
          <a class="luvit-btn luvit-btn--arrow" href="/quiz">شوفي أي روتين يناسب بشرتك</a>
        </div>
      </div>
    </div>
  </div>
</section>
`);

/* ── جذر ٥ · المكوّنات · غامق · رأس بداية + صورة العبوة ───────────────
   السكشن كان **نصّاً خالصاً** · والصورة بتثبت الادعاء بدل ما تقوله.
   والنِسَب بتنسحب من الكتالوج الرسمي · ولا رقم مكتوب هون. */
const VITC = P.L101;

/* 🔴 صورة العبوة **مقصوصة ومنعّمة** لا صورة ووكومرس المربّعة.
   القياس (sharp على `صور-المنتجات/_للويب/luvit-vitamin-c-serum-1-bottle.webp`):
     الملف 2000×2000 · **90.86٪ منه بكسل شفاف**
     صندوق الحبر عند العتبة ١٢ = **386×1192** عند (807, 534)
     ومركزه الأفقي 49.98٪ والعمودي 56.47٪
   ⤷ يعني `max-inline-size: 320px` القديمة كانت بتعطي عبوة مرئية
     **62×191 بكسل** بصندوق 320×320 · وهاد بالضبط «العلبة شكلها
     مش حلو بالمرة» مترجَماً لأرقام.

   والتوأم المقصوص مولَّد من قبل بأدوات المشروع نفسها، وموجود بالريبو:
     node "$(ls _<tools>/trim-bottle.mjs)"   luvit-vitamin-c-serum-1-bottle
     node "$(ls _<tools>/soften-cutout.mjs)" luvit-vitamin-c-serum-1-bottle-trim
     (<tools> = *  ·  النجمة مكتوبة هيك لأن النجمة مع / بتقفل التعليق)
   → library/img/luvit-vitamin-c-serum-1-bottle-soft.webp · 386×1192

   وليش `-soft` لا `-trim`: حافّة الألفا الحادّة بتقرا ملصقاً مقصوصاً
   لا غرضاً واقفاً · نفس علّة ٣٠ آب اللي انبنت `soften-cutout.mjs` إلها.

   وفك التشفير: 0.46 مليون بكسل بدل 4.0 مليون · بنفس وزن الملف. */
const SHOT = {
  local: 'luvit-vitamin-c-serum-1-bottle-soft.webp',
  /* ⚠️ الرابط من مكتبة الميديا **بعد الرفع** · مجلد الشهر بيتغيّر
     حسب تاريخ الرفع، فتأكد منه من اللوحة ولا تحزره. */
  src: 'https://plasmajo.com/wp-content/uploads/2026/09/luvit-vitamin-c-serum-1-bottle-soft.webp',
  w: 386,
  h: 1192,
};

/* 🔴 بوابة · اسم التوأم لازم يكون مشتقّاً من صورة ووكومرس الأولى،
   والملف المحلي لازم يكون موجوداً. فلو صاحب الموقع رتّب صور المنتج
   باللوحة وصارت `2-box-front.webp` أول وحدة، **البناء بيوقف** بدل ما
   ينشر عبوة غلط · وهاد اللي `check()` ما بتقدر تشوفه (بتفحص كلاسات
   وتوازن وسوم، ولا بكسل). */
{
  const base = String(VITC.img || '').split('/').pop().replace(/\.webp$/i, '');
  if (base + '-soft.webp' !== SHOT.local) {
    console.error('🔴 صورة ووكومرس الأولى تغيّرت: ' + base);
    console.error('   ولّد التوأم ثم حدّث SHOT:');
    console.error('   node "$(ls _*/trim-bottle.mjs)" ' + base);
    console.error('   node "$(ls _*/soften-cutout.mjs)" ' + base + '-trim');
    process.exit(1);
  }
  if (!fs.existsSync(path.join(LIB, 'img', SHOT.local))) {
    console.error('🔴 ما لقيت library/img/' + SHOT.local);
    process.exit(1);
  }
}

const sIng = () => H(`
<section class="luvit-section luvit-section--dark luvit-deep luvit-cut-top" data-nav-bg="dark"
         data-luvit-bubbles="14" id="ingredients">
  <span class="luvit-deep__rays" aria-hidden="true"></span>
  <div class="luvit-section__inner">
    <div class="luvit-section__head luvit-section__head--start" data-luvit="reveal">
      <h2 class="luvit-section__title">كل مادة إلها شغلة</h2>
      <p class="luvit-section__sub">
        خدي ${VITC.ar} مثالاً: هون كل مادة فيه، وشو بتعمل لبشرتك.
      </p>
    </div>

    <div class="luvit-ing-split" data-luvit="reveal">
      <figure class="luvit-ing-split__shot">
        <img class="luvit-shot-img" src="${SHOT.src}" alt="عبوة ${VITC.ar}"
             width="${SHOT.w}" height="${SHOT.h}" loading="lazy" decoding="async">
        <img class="luvit-shot-mirror" src="${SHOT.src}" alt=""
             width="${SHOT.w}" height="${SHOT.h}" loading="lazy" decoding="async">
        <figcaption class="luvit-shot-cap">${VITC.ar}</figcaption>
      </figure>

      <div class="luvit-ing luvit-ing--on-dark" data-luvit="stagger">
${VITC.actives.map((a) => `
        <div class="luvit-ing__row">
          <span class="luvit-ing__pct">${a.pct}</span>
          <div class="luvit-ing__body">
            <p class="luvit-ing__name">${a.name}</p>
            <p class="luvit-ing__note">${a.role}</p>
          </div>
        </div>`).join('')}
      </div>
    </div>

    <div class="luvit-section__foot">
      <a href="/product/${VITC.slug}" class="luvit-btn luvit-btn--arrow">شوفي السيروم</a>
      <a href="/products#ingredients" class="luvit-btn luvit-btn--ghost luvit-btn--on-dark">وشو بيعمل البانثينول بباقي المنتجات</a>
    </div>
  </div>
</section>

<div class="luvit-wave luvit-wave--drift" style="--wave-fill:#FFFFFF;background:#0B9198" aria-hidden="true"></div>
`);

/* ── جذر ٦ · ليش لَف إت · **رأس ملتصق** ────────────────────────────────
   الشكل الرابع · العنوان بيثبت والمحتوى بيمرق جنبه.
   🔴 وانحذف رابطان ميتان كانوا هون (`href="#"`) · كانوا بيوعدوا بصفحة
      وبيرجّعوا لفوق الصفحة. */
const WHY = [
  ['01', 'روتين على قدّك', 'منسألك شو بيزعجك ببشرتك ومنركّب الخطوات على أساسه · مش نفس الوصفة لكل وحدة.'],
  ['02', 'ترتيب مش تشكيلة', 'ما منبيعك أربع قطع، منبيعك ترتيباً. نفس القطع بترتيب غلط بتعطي أقل.'],
  ['03', 'النتيجة بتاخد وقت', 'ما منوعد بأسبوع. البشرة بتتجدّد على مهلها، ومنقولك هيك من البداية.'],
  ['04', 'بتدفعي لمّا يوصلك', 'الدفع عند الاستلام · افتحي الطرد وشوفي الختوم قدام المندوب.'],
  ['05', 'وسؤالك مفتوح', 'قبل الطلب وبعده. الاستشارة مجانية وما بتنتهي لمّا تدفعي.'],
];
const sWhy = () => H(`
<section class="luvit-section band-light" data-nav-bg="light" id="why">
  <div class="luvit-section__inner">
    <div class="luvit-split">

      <div class="luvit-split__aside">
        <div class="luvit-section__head luvit-section__head--start" data-luvit="reveal">
          <h2 class="luvit-section__title">العناية مش رفاهية، هي حقّك</h2>
          <p class="luvit-section__sub">
            ما منبيع وعود. منبيع وضوح، ومنضلّ معك بعد الطلب.
          </p>
        </div>
      </div>

      <ol class="luvit-split__list" data-luvit="stagger">
${WHY.map(([n, t, p]) => `
        <li class="luvit-split__item">
          <span class="luvit-split__n">${n}</span>
          <h3 class="luvit-split__t">${t}</h3>
          <p class="luvit-split__p">${p}</p>
        </li>`).join('')}
      </ol>

    </div>
  </div>
</section>
`);

/* ── جذر ٧ · الآراء · غامق · أحجام مختلفة ─────────────────────────────
   🔴 الأربعة القدامى كانوا **مخترَعين بالكامل** · أسماء ومدن ونجوم.
      انشالوا. هدول حقيقيون، والمصدر مسجَّل بـ`_وارد-ريان/`. */
const sQuotes = () => H(`
<section class="luvit-section luvit-section--dark luvit-deep luvit-cut-top" data-nav-bg="dark"
         data-luvit-bubbles="12" id="reviews">
  <span class="luvit-deep__rays" aria-hidden="true"></span>
  <div class="luvit-section__inner">
    <div class="luvit-section__head" data-luvit="reveal">
      <p class="luvit-section__eyebrow">In their words</p>
      <h2 class="luvit-section__title">كلام زبوناتنا زي ما وصلنا</h2>
      <p class="luvit-section__sub">
        منسوخ حرفياً من رسائلهن، بلا تصليح إملاء وبلا إعادة صياغة.
      </p>
    </div>

    <div class="luvit-quotes" data-luvit="stagger">
${QUOTES.map((q) => `
      <figure class="luvit-quote${q.wide ? ' luvit-quote--wide' : ''}">
        <span class="luvit-quote__mark" aria-hidden="true">&rdquo;</span>
        <blockquote class="luvit-quote__text">${q.text}</blockquote>
        <figcaption class="luvit-quote__by">${q.by}</figcaption>
      </figure>`).join('')}
    </div>
  </div>
</section>
`);

/* ── جذر ١١ · الختام ───────────────────────────────────────────────────
   🔴 **الموجة البيضا انشالت من بعد الآراء · و`luvit-cut-top` ضلّت هون.**

   اللقطة عند 5500 مسكت الباغ: الآراء غامق والختام غامق، وبينهم موجة
   متعبّاية **أبيض** بتشقّ العمق نصّين. شِلتها.

   وبعد الشيل ضلّ **خط أفقي حادّ** (تيل #0B9198 بينتهي عند غامق #08262E)
   فرجّعت `luvit-cut-top` · وهاد بالضبط اللي بتقوله قاعدة الموجات
   بالمشروع: الانتقال **لغامق** ما بينعمل بموجة منفصلة، لأن الفيل وقتها
   لازم يطابق تدرّجاً وتوهّجات وفقاعات وشريط بلون واحد ما بيقدر ·
   فالسكشن الغامق **بيقص حافته العليا بماسك** ويبيّن اللي تحته.

   ⤷ والنتيجة مقصودة: النزول بينتهي بالعمق · الآراء والختام منطقة
     غامقة وحدة، والحدّ بينهم منحنى لا خط.
   ⚠️ و`cut-top` بتاكل ٧٠px من أعلى العنصر · `.luvit-cta` معوّضة أصلاً
      بحشوتها، وهي نفس التركيبة اللي كانت شغّالة قبل. */
const sCta = () => H(`
<section class="luvit-cta luvit-deep luvit-cut-top" data-nav-bg="dark" data-luvit-bubbles="16">
  <span class="luvit-deep__rays" aria-hidden="true"></span>
  <div class="luvit-cta__panel" data-luvit="reveal">
    <h2 class="luvit-cta__title luvit-cta__accent">بشرتك مستنّية مِنِّك خطوة.</h2>
    <p class="luvit-cta__sub">ابدئي باختبار قصير، ومنبنيلك روتين على قدّك، والدفع عند الاستلام.</p>
    <a href="/quiz" class="luvit-btn luvit-btn--arrow">اكتشفي روتينك</a>
  </div>
</section>
`);

/* ═══════════════════════════════════════════════════════════════════════
   الخريطة · جذر ← عنصر ← محتوى
   🔴 معرّفات العناصر مقروءة من `_وارد/page40-before.json` · لو انبدّلت
      بالإلمنتور، أعد التنزيل وحدّثها. البوابة تحت بتوقف لو ما تطابقت.
   ═══════════════════════════════════════════════════════════════════════ */
const PLAN = [
  { root: 0, widget: 'c009678', keep: true, name: 'الهيرو' },
  { root: 1, widget: '3a273c6', file: 'h1-trust.html', build: sTrust, name: 'شريط الثقة' },
  { root: 2, widget: '5db08dc', file: 'h2-routine.html', build: sRoutine, name: 'الروتينات' },
  { root: 3, widget: '8b90fbf', file: 'h3-quiz.html', build: sQuiz, name: 'الكويز' },
  { root: 4, widget: '1d1f09b', file: 'h4-result.html', build: sResult, name: 'النتيجة · قبل/بعد' },
  { root: 5, widget: 'd2f1f55', file: 'h5-ingredients.html', build: sIng, name: 'المكوّنات' },
  { root: 6, widget: '0a83774', file: 'h6-why.html', build: sWhy, name: 'ليش لَف إت' },
  { root: 7, widget: 'a200f43', file: 'h7-quotes.html', build: sQuotes, name: 'الآراء' },
  { root: 8, widget: '4989794', drop: true, name: 'كيف تطلبي (بينحذف)' },
  { root: 9, widget: '52e71fd', drop: true, name: 'الآراء القديمة (بينحذف)' },
  { root: 10, widget: '630fed2', drop: true, name: 'الأسئلة (بينحذف)' },
  { root: 11, widget: '5ce3e55', file: 'h8-cta.html', build: sCta, name: 'الختام' },
];

/* ═══════════════════════════════════════════════════════════════════════
   🔴 بوابة الربط · انبنت بعد باغ حقيقي مسكته التجربة الجافّة
   ═══════════════════════════════════════════════════════════════════════
   أول نسخة من الخطة كتبت **أرقام جذور غلط**: حطّت «ليش» على `a200f43`
   و«الآراء» على `52e71fd`. والحقيقة من الشجرة:
       a200f43 = جذر ٧ (غامق)   ·   52e71fd = جذر ٩   ·   0a83774 = جذر ٦
   يعني لو انكتبت:
     · «ليش» (فاتح) كان بينحط بحاوية **غامقة** · النافبار بيقلب أبيض على أبيض
     · «الآراء» كانت بتنكتب بجذر ٩ · **وهو أصلاً بقائمة الحذف** فبتختفي
     · وجذر ٦ (قبل/بعد الوهمي بصور SVG) **كان بيضل على الموقع**

   ⤷ الدرس: معرّف العنصر بيمشي بالفحص («لقيت الثمانية») والربط بيضل غلطاً.
     **وجود العنصر مش إثبات إنه بالمكان الصح.**

   فالبوابة بتفحص شيئين من `_وارد/page40-before.json`:
     ١ · المعرّف فعلاً بالجذر المعلَن
     ٢ · `data-nav-bg` تبع الحاوية بيطابق غمق المحتوى الجديد
   ═══════════════════════════════════════════════════════════════════════ */
function assertPlan(builtHtml) {
  const SNAP = path.join(OUT, 'page40-before.json');
  if (!fs.existsSync(SNAP)) {
    console.error('🔴 ما لقيت _وارد/page40-before.json · نزّل لقطة الصفحة أول');
    process.exit(1);
  }
  const tree = JSON.parse(JSON.parse(fs.readFileSync(SNAP, 'utf8')).meta._elementor_data);
  const bad = [];

  PLAN.forEach((s) => {
    const root = tree[s.root];
    if (!root) { bad.push('جذر ' + s.root + ' مش موجود'); return; }

    /* أول عنصر html بهالجذر */
    let wid = null;
    const stack = [root];
    while (stack.length) {
      const e = stack.shift();
      if (e.widgetType === 'html') { wid = e.id; break; }
      if (e.elements) stack.push(...e.elements);
    }
    if (wid !== s.widget)
      bad.push('جذر ' + s.root + ' فيه ' + wid + ' لا ' + s.widget + ' (' + s.name + ')');

    if (s.keep || s.drop) return;

    /* غمق الحاوية مقابل غمق المحتوى
       🔴 المفتاح `_attributes` **بشرطة سفلية** · أول نسخة قرأت
          `attributes` فرجعت `undefined` دايماً، والفحص مرق بصمت على
          كل الجذور. فحص بيمرّ لأنه ما قرا إشي **أخطر من ولا فحص** ·
          فهون النقص نفسه فشل، لا تجاوُز. */
    const attrs = (root.settings || {})._attributes;
    if (typeof attrs !== 'string' || !attrs.includes('data-nav-bg')) {
      bad.push('جذر ' + s.root + ' حاويته بلا data-nav-bg بـ_attributes (' + s.name + ')');
      return;
    }
    const navBg = (attrs.match(/data-nav-bg\|(\w+)/) || [])[1];
    const html = builtHtml[s.widget] || '';
    const wants = (html.match(/data-nav-bg="(\w+)"/) || [])[1];
    if (!wants) { bad.push('محتوى ' + s.name + ' بلا data-nav-bg'); return; }
    if (navBg !== wants)
      bad.push('جذر ' + s.root + ' حاويته ' + navBg + ' والمحتوى ' + wants + ' (' + s.name + ')');
  });

  if (bad.length) {
    console.error('🔴 بوابة الربط وقفت البناء:');
    bad.forEach((b) => console.error('     ' + b));
    process.exit(1);
  }
  console.log('  ✅ بوابة الربط · ١٢ جذراً · المعرّفات والغمق مطابقان');
}

/* ── الفحوصات · بتوقف مش بتحذّر ────────────────────────────────────── */
const WOO_CLASSES = new Set(['add_to_cart_button', 'ajax_add_to_cart']);
const LIVE = new Set([
  '/', '/products', '/cart', '/checkout', '/my-account', '/track', '/routines',
  '/quiz', '/shipping', '/faq', '/journal', '/about', '/contact', '/returns',
  '/privacy', '/terms',
  ...ROUTINES.map((r) => '/routines/' + r.key),
  ...cat.منتجات.filter((r) => P[r.sku]).map((r) => '/product/' + P[r.sku].slug),
]);

function check(html, name) {
  const bad = [];

  /* ١ · كل كلاس لازم يكون معرّفاً بـtokens.css */
  const used = new Set();
  for (const m of html.matchAll(/class="([^"]+)"/g))
    m[1].split(/\s+/).filter(Boolean).forEach((c) => used.add(c));
  const missing = [...used].filter((c) => !WOO_CLASSES.has(c) && !TOKENS.includes('.' + c));
  if (missing.length) bad.push('كلاسات مش بـtokens.css: ' + missing.join(' · '));

  /* ٢ · توازن الوسوم · الفخّ اللي خلّى `</div>>` تطلع نصاً على الموقع */
  const vis = html.replace(/<!--[\s\S]*?-->/g, '');
  for (const t of ['section', 'div', 'article', 'figure', 'ol', 'li', 'p', 'h2', 'h3',
                   'span', 'a', 'blockquote', 'figcaption', 'label']) {
    const o = (vis.match(new RegExp('<' + t + '(?=[\\s>])', 'g')) || []).length;
    const c = (vis.match(new RegExp('</' + t + '>', 'g')) || []).length;
    if (o !== c) bad.push('<' + t + '> ' + o + '/' + c);
  }

  /* ٣ · الشرطة الطويلة ممنوعة بأي نص بينشر */
  if (vis.includes('—')) bad.push('شرطة طويلة');

  /* ٤ · نجمات ماركداون · بتطلع نصاً حرفياً */
  if (/\*\*[^*\n]+\*\*/.test(vis)) bad.push('نجمات ماركداون');

  /* ٥ · روابط ميتة · وكان فيه اثنان بسكشن «ليش» */
  for (const m of vis.matchAll(/href="([^"]+)"/g)) {
    const h = m[1];
    if (h === '#') { bad.push('رابط ميت href="#"'); continue; }
    if (h.startsWith('#') || h.startsWith('http')) continue;
    const p = h.split('#')[0].replace(/\/$/, '') || '/';
    if (!LIVE.has(p)) bad.push('رابط مش بالقائمة الحيّة: ' + h);
  }

  /* ٦ · ولا h1 · الرئيسية عنوانها بالهيرو */
  if (/<h1[\s>]/.test(vis)) bad.push('h1 بسكشن مش الهيرو');

  /* ٧ · كل صورة بدها alt وأبعاد · بتمنع قفزة التخطيط */
  for (const m of vis.matchAll(/<img\b[^>]*>/g)) {
    const tag = m[0];
    if (!/\salt="/.test(tag)) bad.push('img بلا alt');
    if (!/\swidth="/.test(tag) || !/\sheight="/.test(tag)) bad.push('img بلا أبعاد');
  }

  if (bad.length) {
    console.error('🔴 ' + name);
    [...new Set(bad)].forEach((b) => console.error('     ' + b));
    return false;
  }
  return true;
}

/* ── التنفيذ ──────────────────────────────────────────────────────── */
fs.mkdirSync(SEC, { recursive: true });
const widgets = {};
const drop = [];
let ok = true;

console.log('الصفحة الرئيسية · ١٢ جذر ← ٩');
console.log('');

for (const s of PLAN) {
  if (s.keep) { console.log('  ·  جذر ' + String(s.root).padStart(2) + '  ' + s.name.padEnd(24) + 'ما انلمس'); continue; }
  if (s.drop) { drop.push(s.root); console.log('  ✗  جذر ' + String(s.root).padStart(2) + '  ' + s.name); continue; }

  const html = s.build();
  if (!check(html, 'جذر ' + s.root + ' · ' + s.name)) { ok = false; continue; }
  fs.writeFileSync(path.join(SEC, s.file), html + '\n', 'utf8');
  widgets[s.widget] = html;
  console.log('  ✅ جذر ' + String(s.root).padStart(2) + '  ' + s.name.padEnd(24) +
              String(html.length).padStart(6) + ' حرف  → ' + s.file);
}

if (!ok) { console.error('\n🔴 وقف · صلّح اللي فوق'); process.exit(1); }

console.log('');
assertPlan(widgets);

/* بوابة أخيرة · العدد لازم يطابق الخطة */
const built = Object.keys(widgets).length;
if (built !== 8) { console.error('🔴 المتوقّع ٨ عناصر مبنية · طلع ' + built); process.exit(1); }
if (drop.length !== 3) { console.error('🔴 المتوقّع حذف ٣ جذور · طلع ' + drop.length); process.exit(1); }

fs.writeFileSync(path.join(OUT, 'page40-widgets.json'),
  JSON.stringify({ widgets, dropRoots: drop }, null, 1), 'utf8');

const bytes = Object.values(widgets).reduce((n, h) => n + h.length, 0);
console.log('');
console.log('✅ ٨ عناصر مبنية · ٣ جذور بتنحذف · ' + bytes + ' حرف');
console.log('   _وارد/page40-widgets.json جاهز للدفع');
