
/* ══════════════════════════════════════════════════════════════════════
   البيانات
   ══════════════════════════════════════════════════════════════════════
   🔴 **تصحيح ٤ أيلول · كان مكتوب هون «كل سعر مقروء من ووكومرس، ولا رقم
      مكتوب بالإيد» · وهاد غلط.** كل رقم بهالملف **مكتوب بالإيد**، وهو
      النسخة **الرابعة** من قائمة الروتينات (مع `routines.mjs` وووكومرس
      وصفحات السكاشن) والنسخة **التانية** من قائمة المنتجات.

   ⚠️ **والبيانات بايتة فعلاً وقت هالتصحيح:**
     · `PACKS` تبع توحيد اللون فيه `id: null` وتعليق «لساه ما انعمل
       بووكومرس» · وهو **معمول من ١ أيلول** ورقمه 367
     · أسعار الروتينات 60/61/61/81.95 · والحقيقي بعد عرض الإطلاق
       47/48/48/70.70
     · ألفا أربوتين `٢٢٫٠٠` · والحقيقي 23.75

   ✅ **وما بتوصل ولا زبونة** · مقيس ٤ أيلول: نقاط التركيب `#pkrail`
      و`#cats` **مش موجودة بولا صفحة من الـ٤٦**. الشغّال من هالملف هو
      لوح الرأس (`#seqCanvas`) وبس، وهو ما بيقرا الأسعار.

   🔴 **فلو جيت تحيي `PACKS` أو قائمة المنتجات: ما تصدّق أرقامها.**
      اسحبها من `_وارد/woo-products.json` (فيها `price` و`regular`) أو
      ولّد الملف زي `build-shop-page.mjs`. الأرقام تحت **مرجع تاريخي
      لا مصدر حقيقة**.

   والصور من مكتبة وسائط الموقع (عامة · مفحوصة ٢٠٠).
   ══════════════════════════════════════════════════════════════════════ */
var U = 'https://plasmajo.com/wp-content/uploads/2026/08/';

/* عبوات لوح الرأس · بترتيب الاستعمال
   🔴 **مقصوصة** · الصور الأصلية مربّعة ٢٠٠٠×٢٠٠٠ والعبوة ثلثها، فالقياس
   بالارتفاع بيعطي صندوقاً ٣ مرات أعرض والعبوات بتنكمش لصفر بالفلكس.
   نفس الفخ اللي انحل بالغوص · . */
var TRIM = 'img/';
var PACKS = [
  { id: 205, goal: 'ترطيب ودعم', name: 'روتين الترطيب والدعم اليومي',
    img: 'luvit-bundle-hydration.webp', price: 60,
    who: 'للبشرة اللي بتشدّ وبتحسّ بالجفاف، وبدها ترطيب يثبت طول اليوم.',
    steps: [['غسول هيدرا', 'بينضّف بلا ما يشدّ', '١٤'],
            ['تونر 8D هيالورونيك', 'بيرطّب طبقات البشرة', '١٣'],
            ['سيروم الترطيب المكثّف', 'بيسحب المي ويحبسها', '١٨'],
            ['كريم الترطيب والترميم', 'بيقفل الترطيب ويدعم الحاجز', '١٥']] },

  { id: 203, goal: 'إشراقة', name: 'روتين الإشراقة',
    img: 'luvit-bundle-glow.webp', price: 61,
    who: 'للبشرة الباهتة واللي فيها تفاوت بسيط باللون وبدها نضارة.',
    steps: [['غسول هيدرا', 'بينضّف بلا ما يشدّ', '١٤'],
            ['تونر 8D هيالورونيك', 'بيهيّئ البشرة تمتصّ السيروم', '١٣'],
            ['سيروم فيتامين سي', 'بيوحّد اللون ويعطي إشراقة تدريجية', '١٩'],
            ['كريم الترطيب والترميم', 'بيثبّت الشغل ويحمي', '١٥']] },

  { id: 204, goal: 'تنقية وتوازن', name: 'روتين التنقية والتوازن',
    img: 'luvit-bundle-clarify.webp', price: 61,
    who: 'للبشرة الدهنية والمختلطة اللي بتلمع وبتطلع فيها حبوب.',
    steps: [['غسول البشرة الدهنية', 'بيوازن إفراز الدهون', '١٤'],
            ['تونر تضييق المسامات', 'بينضّف المسام ويهدّي', '١٣'],
            ['سيروم فيتامين سي', 'بيوحّد اللون ويقلّل مظهر الآثار', '١٩'],
            ['كريم الترطيب والترميم', 'بيرطّب بلا ما يثقّل', '١٥']] },

  /* 🔴 المقترح · لساه ما انعمل بووكومرس. السعر مجموع قطعه بالضبط زي الباقي. */
  { id: null, goal: 'توحيد اللون', name: 'روتين توحيد اللون', isNew: true,
    img: 'luvit-bundle-eventone.webp', price: 81.95,
    who: 'للبقع وآثار الحبوب وتفاوت لون البشرة · وفيه الحماية جوّاه لأنها شرط مش إضافة.',
    steps: [['غسول البشرة الدهنية', 'بيوازن إفراز الدهون', '١٤'],
            ['تونر تضييق المسامات', 'بينضّف المسام ويهدّي', '١٣'],
            ['سيروم ألفا أربوتين', 'بيشتغل على البقع وتفاوت اللون', '٢٢'],
            ['كريم الترطيب والترميم', 'بيهدّي ويدعم الحاجز', '١٥'],
            ['واقي الشمس SPF50+', 'بيمنع البقع ترجع', '١٧٫٩٥']] }
];

var AR = function (n) {
  return n.toFixed(2).replace(/\d/g, function (d) { return '٠١٢٣٤٥٦٧٨٩'[d]; }).replace('.', '٫');
};

/* ══ هيرو «القطرة» · تسلسل canvas مسحوب بالسكرول ═══════════════════
   🔴 المسار **بيكتشف نفسه** · وهاد مقصود.
      لو كان سطراً لازم تتذكّر تبدّله قبل اللصق بالإلمنتور، بينتنسى
      مرة وبيوقف الهيرو **بلا أي رسالة خطأ** — الصور بترجّع 404
      والكانفاس بيضل بلون العلامة، فبيقرا كأنه تصميم مقصود.

      محلياً: مسار نسبي من library/ للريبو.
      على الموقع: مجلد الرفع · نفس مكان فريمات هيرو الرئيسية
      (uploads/hero-seq/) وبنفس النمط.

   ✅ مرفوعة ومفحوصة ٣١ آب · **٢٤٠ فريماً كلهم 200** والمانيفستان.  */
var SEQ_LOCAL = (location.hostname === 'localhost' || location.hostname === '127.0.0.1');
var SEQ_BASE = SEQ_LOCAL
  ? '../hero-sequence/'
  : 'https://plasmajo.com/wp-content/uploads/hero-seq/drop/';
/* fill = أقل نسبة من ارتفاع اللوح مسموح للفريم يشغلها قبل ما نكبّره.
   🔴 الطولية fill=0 · يعني **ما بنكبّر أبداً**، بنملأ العرض وبس.
      السبب مقيس: فريم ٣:٤ على شاشة ٣٩٠×٨٤٤ · التكبير لـ٩٤٪ من
      الارتفاع بيعمل عرضاً ٥٩٥px على شاشة ٣٩٠ = **٢٠٥px بتنقصّ من
      الجنبين، والعبوة الطرفية بتروح**. وطلع فعلاً باللقطة.
      واللي بيفضى فوق بينملي بـ--lagoon · وهناك الكلام أصلاً. */
/* 🔴 أسماء المجلدات بتختلف بين المحلي والموقع · وهاد مش إهمالاً:
   محلياً في أصلاً `frames-desktop/` لهيرو الرئيسية، فأسماء القطرة
   لازم تتميّز عنه. وعلى الموقع كل تسلسل بمجلده الخاص (`drop/`)
   فالأسماء بترجع بسيطة.
   والمفتاح **واحد** (SEQ_LOCAL) للمسار وللأسماء سوا · مفتاحان
   بيخلّوا وحدة تشتغل والتانية تفشل، وهي أصعب حالة تنمسك. */
var SEQ = {
  wide: { dir: SEQ_LOCAL ? 'frames-drop-final-desktop/' : 'frames-desktop/', fill: .94 },  /* 1920x1080 · ١٦:٩ */
  tall: { dir: SEQ_LOCAL ? 'frames-drop-final-mobile/'  : 'frames-mobile/',  fill: 0    }  /* 1248x1664 · ٣:٤  */
};

(function () {
  var cv = document.getElementById('seqCanvas');
  var pin = document.querySelector('.shop-hero__pin');
  var track = document.querySelector('.shop-hero__track');
  var load = document.getElementById('seqLoad');
  var bar = load && load.querySelector('i');
  if (!cv || !pin || !track) return;

  var ctx = cv.getContext('2d', { alpha: false });
  var LAGOON = (getComputedStyle(document.documentElement)
    .getPropertyValue('--lagoon') || '').trim() || '#063436';
  var MAX_DPR = 2;
  var dpr = 1, last = -1, p = 0;
  var cache = {}, key = null;

  var reduced = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function pick() {
    /* الفريمات الطولية للشاشات اللي أطول من عريضة · مش للعرض وحده،
       لأن تابلت أفقي بده العريضة رغم إنه ضيّق. */
    return (window.innerHeight > window.innerWidth * 1.05) ? 'tall' : 'wide';
  }

  /* ── الرسم ────────────────────────────────────────────────────────
     🔴 «ملء العرض · ملزوق بالأسفل» مش cover بالوسط.
        السبب مقيس: الفريم الطولي ٣:٤ على شاشة تلفون ٩:١٩ · لو عملنا
        cover بالوسط بينقصّ ٣٨٪ من العرض **والعبوات الطرفية بتروح**.
        وبالملزوق بالأسفل: المي والعبوات كاملة، واللي بينقصّ (أو
        بينكشف) هو **أعلى الكادر الغامق** — وهاد اللي بدنا نخفيه أصلاً،
        ومحلّه بيمتلي بـ--lagoon تبع العلامة.                          */
  function draw() {
    var v = cache[key];
    var cw = pin.clientWidth, ch = pin.clientHeight;
    /* 🔴 الكانفاس `alpha:false` يعني أرضيته **سودا** لحد ما ينرسم أول فريم ·
       فكان الرأس أسود على الموبايل لحد ما يخلص التسلسل كله (مقيس بتقرير
       الفحص ٣ أيلول). هلأ: أي استدعاء بيملّي بلون العلامة أول، وبعدين
       بيرسم الفريم لو جاهز · وأرضية Lagoon أحسن حالة ممكنة بلا فريم. */
    var i = (v && v.n)
      ? Math.max(0, Math.min(v.n - 1, Math.round(p * (v.n - 1))))
      : -1;
    if (i >= 0 && i === last) return;   /* نفس الفريم · ولا داعي لإعادة الرسم */
    var img = null;
    if (i >= 0) {
      img = v.img[i];
      /* الفريم المطلوب لساه ما نزل · أقرب فريم جاهز قبله بدل كادر فاضي */
      if (!img || !img.naturalWidth) {
        for (var b = i - 1; b >= 0; b--) {
          var cand = v.img[b];
          if (cand && cand.naturalWidth) { img = cand; break; }
        }
      }
      if (img && !img.naturalWidth) img = null;
    }
    ctx.fillStyle = LAGOON;
    ctx.fillRect(0, 0, cw, ch);
    if (!img) return;
    last = i;
    var fill = SEQ[key].fill || 0;
    var scale = cw / img.naturalWidth;
    var dh = img.naturalHeight * scale;
    if (fill && dh < ch * fill) { scale = ch * fill / img.naturalHeight; dh = ch * fill; }
    var dw = img.naturalWidth * scale;
    /* الملء صار فوق قبل أي خروج · واللون بينقرا من التوكن زي ما كان */
    ctx.drawImage(img, (cw - dw) / 2, ch - dh, dw, dh);
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
    var cw = pin.clientWidth, ch = pin.clientHeight;
    cv.width = Math.round(cw * dpr); cv.height = Math.round(ch * dpr);
    cv.style.width = cw + 'px'; cv.style.height = ch + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    last = -1; draw();
  }

  function loadSeq(k) {
    if (cache[k] && cache[k].promise) return cache[k].promise;
    var base = SEQ_BASE + SEQ[k].dir;
    var v = cache[k] = { img: [], n: 0, promise: null };
    v.promise = fetch(base + 'manifest.json', { cache: 'force-cache' })
      .then(function (r) {
        if (!r.ok) throw new Error('manifest ' + r.status);
        return r.json();
      })
      .then(function (m) {
        var fr = m.frames || [];
        v.n = fr.length; v.img = new Array(v.n);
        var done = 0;
        return Promise.all(fr.map(function (f, i) {
          return new Promise(function (res) {
            var im = new Image();
            im.decoding = 'async';
            im.src = base + f.file;
            v.img[i] = im;
            var fin = function () {
              done++;
              if (bar && k === key) bar.style.inlineSize = Math.round(done / v.n * 100) + '%';
              /* أول فريم بيفكّ بيتعرض فوراً · الباقي بيكمّل بالخلفية */
              if (k === key && done === 1) { last = -1; draw(); }
              res();
            };
            if (im.decode) im.decode().then(fin).catch(function () { im.onload = im.onerror = fin; });
            else im.onload = im.onerror = fin;
          });
        }));
      });
    return v.promise;
  }

  function activate(k) {
    key = k;
    loadSeq(k).then(function () {
      if (key !== k) return;
      if (load) load.classList.add('is-done');
      last = -1; resize();
      if (window.ScrollTrigger) window.ScrollTrigger.refresh();
    }).catch(function (e) {
      if (load) load.classList.add('is-done');
      console.warn('[shop-hero] فشل تحميل التسلسل:', e.message);
    });
  }

  /* أرضية العلامة قبل أي تحميل · بلاها الكادر أسود لثوانٍ */
  resize();
  activate(pick());

  /* 🔴 حركة مخفّضة: بنوقف السحب ونعرض **آخر فريم** — يعني العبوات
     كاملة، مش المي الفاضية. اللي أطفى الحركة لازم يشوف المنتج. */
  if (reduced) {
    p = 1;
    window.addEventListener('resize', resize);
    return;
  }

  if (window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.create({
      trigger: track,
      start: 'top top',
      end: 'bottom bottom',
      scrub: true,
      onUpdate: function (self) { p = self.progress; draw(); }
    });
    ScrollTrigger.addEventListener('refreshInit', resize);
  }

  window.addEventListener('resize', function () {
    var k = pick();
    if (k !== key) activate(k); else resize();
  });
})();

/* ══ التشكيلة بمجموعات · بترتيب الاستعمال ══════════════════════════
   🔴 الأسعار والأسماء من الكتالوج الرسمي · والفايدة من حقل role
      بـ_خطة/بيانات-المنتجات-الرسمية.json · ولا رقم مكتوب بالإيد. */
var U2 = 'https://plasmajo.com/wp-content/uploads/2026/08/';
var GROUPS = [
  { n: 1, name: 'المنظّفات', does: 'أول خطوة · بتشيل الزيت والأوساخ بلا ما تشدّ',
    items: [
      { id: 201, ar: 'غسول البشرة الجافة والحساسة', img: 'luvit-hydrating-gel-cleanser-1-bottle.webp',
        pct: '٠٫٥٪ هيالورونيك', ml: '٢٠٠ مل', price: '١٤٫٠٠', does: 'رغوة ناعمة بترطّب وهي بتنضّف' },
      { id: 280, ar: 'غسول البشرة الدهنية', img: 'luvit-sebum-balancing-gel-cleanser-1-bottle.webp',
        pct: '٠٫٥٪ ساليسيليك', ml: '٢٠٠ مل', price: '١٤٫٠٠', does: 'بيوازن إفراز الدهون وبيقلّل اللمعان' } ] },

  { n: 2, name: 'التونرات', does: 'بتوازن البشرة وبتحضّرها تمتصّ السيروم',
    items: [
      { id: 202, ar: 'تونر البشرة الجافة والحساسة', img: 'luvit-8d-hyaluronic-acid-toner-1-bottle.webp',
        pct: '٢٪ هيالورونيك 8D', ml: '٢٠٠ مل', price: '١٣٫٠٠', does: 'بيرطّب طبقات البشرة الواحدة ورا التانية' },
      { id: 278, ar: 'تونر تضييق المسامات', img: 'luvit-clarifying-pore-tightening-toner-1-bottle.webp',
        pct: '٥٪ AHA + ٠٫٥٪ BHA', ml: '٢٠٠ مل', price: '١٣٫٠٠', does: 'بينضّف المسام ويهدّي' } ] },

  { n: 3, name: 'السيرومات', does: 'الخطوة اللي بتشتغل على همّك إنتِ',
    items: [
      { id: 191, ar: 'سيروم فيتامين سي', img: 'luvit-vitamin-c-serum-1-bottle.webp',
        pct: '١٠٪ فيتامين سي', ml: '٣٠ مل', price: '١٩٫٠٠', does: 'بيوحّد اللون ويعطي إشراقة تدريجية' },
      { id: 275, ar: 'سيروم الترطيب المكثّف', img: 'luvit-intensive-hydrating-serum-1-bottle.webp',
        pct: '٢٪ هيالورونيك', ml: '٣٠ مل', price: '١٨٫٠٠', does: 'بيسحب المي لطبقات البشرة ويحبسها' },
      { id: 277, ar: 'سيروم تضييق المسامات', img: 'luvit-pore-tightening-brightening-serum-1-bottle.webp',
        pct: '١٠٪ نياسيناميد', ml: '٣٠ مل', price: '١٦٫٠٠', does: 'بيقلّل مظهر المسام ويوازن الدهون' },
      { id: 282, ar: 'سيروم ألفا أربوتين المركّب', img: 'luvit-alpha-arbutin-complex-serum-2-box-front.webp',
        pct: '٢٪ ألفا أربوتين', ml: '٣٠ مل', price: '٢٢٫٠٠', does: 'بيشتغل على البقع وتفاوت اللون' } ] },

  { n: 4, name: 'علاج موضعي', does: 'مرتين بالأسبوع · مش يومي',
    items: [
      { id: 279, ar: 'سيروم التقشير', img: 'luvit-aha-bha-peeling-serum-1-bottle.webp',
        pct: '١٠٪ AHA + ٢٪ BHA', ml: '٣٠ مل', price: '١٦٫٠٠', does: 'بيجدّد الملمس · وبيلزمه واقي شمس الصبح', warn: true },
      { id: 276, ar: 'كريم سنتيلا للبقع', img: 'luvit-centella-blemish-cream-1-bottle.webp',
        pct: '٥٪ خلاصة سنتيلا', ml: '٥٠ مل', price: '١٨٫٠٠', does: 'بيهدّي الاحمرار وآثار الحبوب' } ] },

  { n: 5, name: 'الترطيب', does: 'آخر خطوة مسا · بتقفل الشغل كله',
    items: [
      { id: 281, ar: 'كريم الترطيب والترميم', img: 'luvit-moisturizing-repairing-cream-1-bottle.webp',
        pct: '١٠٪ بانثينول', ml: '٧٥ مل', price: '١٥٫٠٠', does: 'بيثبّت الترطيب ويدعم حاجز البشرة' } ] },

  { n: 6, name: 'الحماية', does: 'آخر خطوة صبح · وبلاها الباقي بيروح',
    items: [
      { id: 318, ar: 'واقي الشمس اليومي', img: 'luvit-high-protection-sunscreen-1-bottle.webp',
        pct: 'SPF50+ · PA++++', ml: '٥٠ مل', price: '١٧٫٩٥', does: 'بيمنع البقع ترجع وبيحمي من الضوء الأزرق' } ] }
];

(function () {
  var root = document.getElementById('cats');
  if (!root) return;
  GROUPS.forEach(function (g) {
    var cards = g.items.map(function (it) {
      return '<article class="pc">' +
        '<div class="pc__media">' +
          '<img decoding="async" loading="lazy" width="800" height="600"' +
          ' src="' + U2 + it.img + '" alt="' + it.ar + '">' +
        '</div>' +
        '<div class="pc__body">' +
          '<h3 class="pc__name">' + it.ar + '</h3>' +
          '<p class="pc__does">' + it.does + '</p>' +
          /* 🔴 النسبة **برهان تحت الفايدة**، مش شارة فوق الصورة.
             ريّان: «روح لفوائد المكوّنات مش تذكرها» · و«مش تغلط بموضوع
             النسب مرة ثانية». فالفايدة بتقود والنسبة بتسند. */
          '<p class="pc__proof">' + it.pct + '</p>' +
          (it.warn ? '<span class="pc__warn">مرتين بالأسبوع · مش يومي</span>' : '') +
          '<div class="pc__foot">' +
            '<span class="pc__price">' + it.price + ' د.أ' +
              '<span class="pc__ml">' + it.ml + '</span>' +
            '</span>' +
            /* 🔴 قرص بأيقونة لا شريط · واسم واضح لقارئ الشاشة لأن
               الأيقونة وحدها ما بتقول شو بتضيف. */
            '<a class="pc__add" href="/?add-to-cart=' + it.id + '" rel="nofollow"' +
            ' aria-label="أضيفي ' + it.ar + ' إلى السلة" title="أضيفي إلى السلة">' +
              '<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor"' +
              ' stroke-width="2" stroke-linecap="round" aria-hidden="true">' +
              '<path d="M12 5v14M5 12h14"/></svg>' +
            '</a>' +
          '</div>' +
        '</div>' +
      '</article>';
    }).join('');

    /* 🔴 الرأس صار **عموداً ملتصقاً** جنب منتجاته لا شريطاً فوقها ·
       فبتضل «إنتِ بخطوة التنظيف» ظاهرة والزائرة بتتصفّح. */
    var sec = document.createElement('div');
    sec.className = 'grp';
    sec.innerHTML =
      '<div class="grp__wrap">' +
        '<div class="grp__head">' +
          '<b class="grp__n">' + g.n + '</b>' +
          '<h3>' + g.name + '</h3>' +
          '<p>' + g.does + '</p>' +
          '<span class="grp__count">' + g.items.length + ' منتج' + (g.items.length > 2 ? 'ات' : '') + '</span>' +
        '</div>' +
        '<div class="grp__row">' + cards + '</div>' +
      '</div>';
    root.appendChild(sec);
  });
})();

/* ══ البكجات · شريط أهداف + لوح مفصّل ═══════════════════════════════
   🔴 ولا رقم مكتوب هون · الأسعار والأسماء والخطوات كلها من PACKS،
      وPACKS من الكتالوج الرسمي. ومجموع القطع **بينحسب** من الخطوات
      نفسها مش بينكتب بالإيد — هيك لو تغيّر سعر قطعة ما بيصير تناقض
      بين المجموع والتفصيل.                                          */
(function () {
  var rail = document.getElementById('pkrail');
  var ind = document.getElementById('pkind');
  var panel = document.getElementById('pkpanel');
  if (!rail || !ind || !panel) return;

  var U = 'https://plasmajo.com/wp-content/uploads/2026/08/';
  var AR_D = '٠١٢٣٤٥٦٧٨٩';

  /* الرقم العربي للاتيني · لأن الخطوات مخزّنة بأرقام عربية */
  function toNum(s) {
    return parseFloat(String(s)
      .replace(/[٠-٩]/g, function (d) { return AR_D.indexOf(d); })
      .replace('٫', '.'));
  }
  function sumOf(p) {
    return p.steps.reduce(function (a, s) { return a + toNum(s[2]); }, 0);
  }

  var active = 0;

  /* ── الشريط ─────────────────────────────────────────────────────── */
  PACKS.forEach(function (p, i) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'pk__goal';
    b.setAttribute('role', 'tab');
    b.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
    b.setAttribute('aria-controls', 'pkpanel');
    b.tabIndex = i === 0 ? 0 : -1;
    b.innerHTML = '<b>' + p.goal +
      (p.isNew ? '<i aria-hidden="true"></i>' : '') + '</b>' +
      '<small>' + p.steps.length + ' خطوات</small>';
    if (p.isNew) b.setAttribute('aria-label', p.goal + ' · جديد');
    b.addEventListener('click', function () { select(i); });
    rail.appendChild(b);
  });
  var tabs = [].slice.call(rail.querySelectorAll('.pk__goal'));

  /* الكيبورد · سهم يمين/شمال بيتنقّل، وبالعربي الاتجاه بينعكس */
  rail.addEventListener('keydown', function (e) {
    var rtl = getComputedStyle(rail).direction === 'rtl';
    var d = e.key === 'ArrowRight' ? (rtl ? -1 : 1)
          : e.key === 'ArrowLeft' ? (rtl ? 1 : -1)
          : e.key === 'Home' ? -999 : e.key === 'End' ? 999 : 0;
    if (!d) return;
    e.preventDefault();
    var n = d === -999 ? 0 : d === 999 ? tabs.length - 1
          : Math.max(0, Math.min(tabs.length - 1, active + d));
    select(n);
    tabs[n].focus();
  });

  /* المؤشّر · transform بس · ولا left ولا width (قاعدة أداء ثابتة) */
  function moveInd() {
    var el = tabs[active];
    if (!el) return;
    var r = el.getBoundingClientRect();
    var rr = rail.getBoundingClientRect();
    var rtl = getComputedStyle(rail).direction === 'rtl';
    /* بالـRTL نقيس من الحافّة اليمنى لأن inset-inline-start هناك */
    var off = rtl ? (rr.right - r.right) : (r.left - rr.left);
    ind.style.transform = 'translateX(' + (rtl ? -off : off) + 'px) scaleX(' + (r.width / 10) + ')';
  }

  /* ── اللوح ──────────────────────────────────────────────────────── */
  function render(p) {
    var parts = sumOf(p);
    var steps = p.steps.map(function (s, i) {
      return '<li class="pk__step">' +
        '<b>' + (i + 1) + '</b>' +
        '<span>' + s[0] + '</span>' +
        '<u>' + s[2] + ' د.أ</u>' +
        '<em>' + s[1] + '</em>' +
      '</li>';
    }).join('');

    panel.innerHTML =
      /* ✅ الأربع صور مرفوعة ومفحوصة (٣١ آب · 200 · image/webp).
         كانت luvit-bundle-eventone.webp بترجّع 404 · انرفعت بمعرّف
         وسيط 324 على نفس المسار المتوقّع.

         والسقوط الآمن بيضل مقصوداً: أي صورة بكج جديدة بتنكتب بـPACKS
         قبل ما تنرفع، وبلا هالسطر بتطلع بالمعاينة **مربّعاً مكسوراً**
         بدل ما تشتغل من library/img/. فهو حماية دائمة لا ترقيع مؤقت. */
      '<div class="pk__shot">' +
        '<img src="' + U + p.img + '" alt="' + p.name + '"' +
        ' width="1000" height="1000" decoding="async" loading="lazy"' +
        " onerror=\"this.onerror=null;this.src='img/" + p.img + "'\">" +
      '</div>' +
      '<div class="pk__body">' +
        '<h3 class="pk__title">' + p.name + '</h3>' +
        '<p class="pk__who">' + p.who + '</p>' +
        '<ol class="pk__ladder">' + steps + '</ol>' +
        '<div class="pk__bill">' +
          '<div class="pk__row"><span>مجموع القطع</span><b>' + AR(parts) + ' د.أ</b></div>' +
          '<div class="pk__row pk__row--free"><span>التوصيل</span><b>مجاني</b></div>' +
          '<div class="pk__row pk__row--total"><span>الإجمالي</span><b>' + AR(parts) + ' د.أ</b></div>' +
          '<p class="pk__note">بتوفّري ١٣ دينار عن شراء الخطوات وحدة وحدة.</p>' +
        '</div>' +
        '<div class="pk__buy">' +
          (p.id
            ? '<a class="luvit-btn" href="/?add-to-cart=' + p.id + '" rel="nofollow">أضيفي الروتين إلى السلة</a>'
            : '<a class="luvit-btn luvit-btn--ghost" href="#catalogue">شوفي قطعه وحدة وحدة</a>') +
        '</div>' +
      '</div>';

    /* دخول اللوح · ٣٦٠ملي والتتابع ٢٤٠ · تحت سقف motion-doctrine */
    if (window.gsap && !(window.matchMedia &&
        matchMedia('(prefers-reduced-motion: reduce)').matches)) {
      gsap.fromTo(panel.children,
        { y: 14, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: .36, stagger: .07, ease: 'power2.out', overwrite: true });
      gsap.fromTo(panel.querySelectorAll('.pk__step'),
        { y: 8, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: .3, stagger: .04, ease: 'power2.out', delay: .1, overwrite: true });
    }
  }

  function select(i) {
    active = i;
    tabs.forEach(function (b, n) {
      b.setAttribute('aria-selected', n === i ? 'true' : 'false');
      b.tabIndex = n === i ? 0 : -1;
    });
    moveInd();
    /* 🔴 بلا هاد، اختيار بالكيبورد أو تبويب برّا المنظر بيتفعّل
       وهو مش ظاهر · المستخدم بيحس إنه ما صار إشي. */
    if (tabs[i] && tabs[i].scrollIntoView) {
      tabs[i].scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
    }
    render(PACKS[i]);
  }

  select(0);
  /* الخطوط بتوصل متأخرة وبتغيّر عرض التبويب · فبنعيد القياس بعدها */
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(moveInd);
  window.addEventListener('resize', moveInd);
})();

/* ══════════════════════════════════════════════════════════════════════
   الحركة · مبنية بمكتبة توازَن · مش صورة ذكاء اصطناعي.
   المفردات المستعملة: revealAll · EASES · reduced.
   ⚠️ ومقسّم كلمات **محلي** بدل wordReveal · السبب مشروح عند الدالة.

   🔴 وقرار مبني على «قانون الحركة» (motion-doctrine · Part 2):
      «Idle sine loops (breathe, float, drift, glow pulse) are BANNED as
       sustained motion · they read as the video is waiting.»

      فالنسخة الأولى كانت غلط: العبوات كانت تهتزّ بـyoyo لا نهائي
      والفقاعات بتصعد بحلقة أبدية. **الاثنان تعبئة وقت مش حركة.**

      البديل المعتمد هو مسار **«الكشف المتدرّج»** (Staged reveals)،
      وهلأ صار **مسارين معاً**:
        ١) دخول الكلام · العنوان كلمةً كلمة، ثم اللِيد، ثم — بعد
           سكتة — الحقائق. بيخلص ويرتاح.
        ٢) **تسلسل مسحوب بالسكرول** (Animated sequences) · مي ساكنة
           ← قطرة ← تاج ← حلقة ← العبوات بتطلع. ١٢٠ فريماً على canvas.

      والفرق الجوهري: الحياة المستمرة **مش حلقة أبدية**، هي
      **الزائرة نفسها** وهي بتنزل بالصفحة. توقّف السكرول = توقّف
      المشهد · وهاد بالضبط اللي بيطلبه القانون.

   وقيود التوقيت من نفس المصدر:
     · دخول العنصر الواحد ≤ ٨٠٠ملي · والتتابع الكلي ≤ ٥٠٠ملي
     · سكتة ٠٫٣ لـ٠٫٧٥ ثانية قبل البيتة الأخيرة
     · ممنوع bounce.out وelastic.out · وback.out(1.4-1.7) مسموحة
   ══════════════════════════════════════════════════════════════════════ */
/* ── وحدة توازَن محقونة · كانت import نسبياً بالمعاينة ──────────────
   المسار النسبي بيشتغل بالمعاينة وبينكسر على ووردبريس لأن السكربت
   بينحقن بالفوتر لا بمجلد library. المطلوب: revealAll · reduced · EASES
   ⚠️ ولا تعدّل هون · عدّل library/tawaazn-motion.js وأعد التجميع. */
/* ══════════════════════════════════════════════════════════════════════
 * نسخة من مكتبة حركة توازَن · مصدرها:
 *   D:Ryan-WorkTawaazn-العدةmotion	awaazn-motion.js  ·  v0.1.4
 *   انسخت لمشروع LUVIT بـ٣٠ آب ٢٠٢٦.
 *
 * 🔴 هاي **نسخة** · التعديل بينعمل بالمصدر بتوازَن وبعدها بتنعاد النسخة.
 *    وأي تعديل هون بيضيع أول مرة تنعاد، وبيخلي هوية اللي بيستعملها تختلف
 *    عن باقي عملاء توازَن. **وهاد بالضبط اللي المنتج قايم على منعه.**
 *
 * والاستعمال هون: فيلم رأس صفحة المتجر · مبني بالكود، مش صورة ذكاء اصطناعي.
 * ══════════════════════════════════════════════════════════════════════ */
/**
 * tawaazn-motion.js · مكتبة حركة توازَن · v0.1
 *
 * وعد توازَن المنشور: «قواعد الحركة بالكود مش بجملة» — وهاد الكود.
 * مفردات حركة مجرَّبة، محايدة الهوية: بتاخد توكنز العميل وبتشتغل عربي RTL من أول يوم.
 *
 * المصدر: انبنت وانفحصت بسامبلَي عيادة الأخرس (آب ٢٠٢٦)، ومفرداتها مجموعة من تفكيك
 * ستة مواقع مرجعية بالفيديو والقياس (dongwon · otsuka · Pegasus · wamdigital · Miu Miu · LAVA).
 *
 * الاعتماديات: gsap + ScrollTrigger (إلزامي) · ScrollSmoother وSplitText (اختياري).
 *
 * 🔴 قواعد مقيسة، مش أذواق:
 *   ١) العربية بتتقسم كلماتٍ لا أحرفاً — الحروف متصلة والتقسيم الحرفي بيكسر الرسم.
 *   ٢) overflow-x: clip لا hidden — hidden بتخلّي overflow-y محسوباً auto فبتنكسر sticky.
 *   ٣) أي تزامن مع تايملاين مسحوب بينحسب من progress بكل تحديث، لا بكولباكات مزروعة —
 *      الكولباك ما بينعكس صح مع رجوع التمرير.
 *   ٤) القيم الدالّية (زي لون من متغيّر CSS) بتنقرا عند الإنشاء — أي قلب ثيم لازم
 *      يستدعي tween.invalidate() وإلا ضلّت القيم القديمة.
 *   ٥) prefers-reduced-motion بتحترم دايماً: المحتوى بيظهر ثابتاً، ما بينحجب.
 */

/* ═══ بنك المنحنيات · مقيس من المواقع الستة ═══ */const EASES = {
  base: 'cubic-bezier(.23,1,.32,1)',     // Miu Miu ×18 · الأساس لكل شي
  reveal: 'cubic-bezier(.16,1,.3,1)',    // الكشف الطويل
  soft: 'cubic-bezier(.22,1,.36,1)',     // Aventura · التمايل الناعم
  snap: 'cubic-bezier(0,0,0,1)',         // wamdigital · الحسم
  settle: 'cubic-bezier(.33,0,.11,1)',   // LAVA · بداية هادية ونهاية حاسمة
  pop: 'cubic-bezier(.2,2.5,.4,1)',      // LAVA · بيتجاوز الهدف وبيرجع، للحظات الفرح
};const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ═══ تقسيم كلمات عربي آمن · بديل SplitText الخفيف ═══ */const splitWords = (el) => {
  el.innerHTML = el.textContent.trim().split(/\s+/)
    .map((w) => '<span style="display:inline-block;overflow:clip;vertical-align:bottom">'
      + '<i style="display:inline-block;font-style:normal">' + w + '</i></span>').join(' ');
  return el.querySelectorAll(':scope span > i');
};

/* ═══ ١ · كشف الكلمات المتدرّج · dongwon ═══ */const wordReveal = (target, { delay = 0, stagger = .08, dur = 1.05 } = {}) => {
  const words = typeof SplitText !== 'undefined'
    ? new SplitText(target, { type: 'words' }).words
    : splitWords(document.querySelector(target));
  if (reduced()) return gsap.set(words, { opacity: 1 });
  gsap.set(words, { yPercent: 112, opacity: 0 });
  return gsap.to(words, { yPercent: 0, opacity: 1, duration: dur, stagger, delay, ease: 'expo.out' });
};

/* ═══ ٢ · كشف أسطر بقناع · بيحتاج SplitText 3.15+ ═══ */const lineMask = (target, trigger, start = 'top 74%') => {
  const s = new SplitText(target, { type: 'lines', mask: 'lines' });
  if (reduced()) return;
  gsap.from(s.lines, { yPercent: 105, duration: 1, stagger: .12, ease: 'expo.out',
    scrollTrigger: { trigger: trigger || target, start } });
};

/* ═══ ٣ · بلور-فيد-أب العام · لكل عنصر .rv ═══ */const revealAll = (sel = '.rv', { blur = true } = {}) => {
  if (reduced()) return gsap.set(sel, { opacity: 1 });
  gsap.utils.toArray(sel).forEach((el) => {
    gsap.fromTo(el,
      { opacity: 0, y: 32, filter: blur ? 'blur(6px)' : 'none' },
      { opacity: 1, y: 0, filter: 'blur(0px)', duration: .8, ease: 'expo.out',
        scrollTrigger: { trigger: el, start: 'top 91%' } });
  });
};

/* ═══ ٤ · تعبئة نص بالتمرير · كلمة كلمة ═══
 * colorFn دالّة عشان تنقرا حيّة · وعند قلب الثيم: نادِ ‪.invalidate()‬ على الراجع */const scrubFill = (target, trigger, colorFn) => {
  const words = typeof SplitText !== 'undefined'
    ? new SplitText(target, { type: 'words' }).words
    : splitWords(document.querySelector(target));
  return gsap.to(words, { color: colorFn, stagger: .06, ease: 'none',
    scrollTrigger: { trigger, start: 'top 78%', end: 'bottom 45%', scrub: true } });
};

/* ═══ ٥ · مراحل مثبّتة بتزامن حتمي · القاعدة ٣ ═══
 * steps عناصر متراكبة · onIndex(i) بتنستدعى لما تتغيّر المرحلة (رقم، نقاط، تعليق…) */const pinnedSteps = ({ trigger, steps, length = '+=280%', scrub = .55, onIndex, onProgress }) => {
  const els = gsap.utils.toArray(steps);
  gsap.set(els[0], { opacity: 1, visibility: 'visible' });
  let last = 0;
  const tl = gsap.timeline({
    scrollTrigger: { trigger, start: 'top top', end: length, pin: !reduced(), scrub, anticipatePin: 1 },
    onUpdate() {
      if (onProgress) onProgress(this.progress());
      const idx = Math.min(els.length - 1, Math.floor(this.progress() * els.length));
      if (idx === last) return;
      gsap.to(els[last], { opacity: 0, y: -20, visibility: 'hidden', duration: .3, ease: 'power2.in' });
      gsap.fromTo(els[idx], { opacity: 0, y: 24, visibility: 'hidden' },
        { opacity: 1, y: 0, visibility: 'visible', duration: .45, ease: 'expo.out' });
      last = idx;
      if (onIndex) onIndex(idx);
    },
  });
  /* 🔴 v0.1.2: تايملاين بلا أي حركة مدّته صفر، فالسحب ما عنده شو يسوق —
     القسم بيتثبّت وبيتجمّد. حركة سائقة فارغة بتعطيه مدّةً فبيمشي التقدّم.
     (الخلل ظهر بأول صفحة استعملت المكتبة صافيةً بلا حركات مضافة يدوياً.) */
  tl.to({}, { duration: 1 }, 0);
  return tl;
};

/* ═══ ٦ · مسار بيترسّم ومؤشر بيمشي عليه · LAVA بنيةً ═══
 * railEl/fillEl مساران متطابقان · curEl دائرة المؤشر · بيرجع دالة بتربطها بتايملاين */const pathProgress = (railEl, fillEl, curEl) => {
  const len = railEl.getTotalLength();
  fillEl.style.strokeDasharray = len;
  fillEl.style.strokeDashoffset = len;
  return (p) => {
    fillEl.style.strokeDashoffset = len * (1 - p);
    if (curEl) {
      const pt = railEl.getPointAtLength(Math.max(.001, p) * len);
      curEl.setAttribute('cx', pt.x); curEl.setAttribute('cy', pt.y);
    }
  };
};

/* ═══ ٧ · رقاقة صورة لاحقة بالمؤشر · dongwon hover ═══
 * chip حاوية fixed فيها صور data-i · rows حاوية الصفوف .row[data-im] */const hoverChip = (chipSel, rowsSel, { rot = -3 } = {}) => {
  if (!matchMedia('(hover:hover)').matches || reduced()) return;
  const chip = document.querySelector(chipSel);
  const imgs = gsap.utils.toArray(chipSel + ' img');
  const qx = gsap.quickTo(chip, 'x', { duration: .45, ease: 'power3.out' });
  const qy = gsap.quickTo(chip, 'y', { duration: .45, ease: 'power3.out' });
  gsap.set(chip, { xPercent: -50, yPercent: -58 });
  const rows = document.querySelector(rowsSel);
  rows.addEventListener('pointermove', (e) => { qx(e.clientX); qy(e.clientY); });
  rows.addEventListener('pointerover', (e) => {
    const r = e.target.closest('.row'); if (!r) return;
    imgs.forEach((im) => gsap.set(im, { opacity: +im.dataset.i === +r.dataset.im ? 1 : 0 }));
    gsap.to(chip, { opacity: 1, scale: 1, rotate: rot, duration: .5, ease: 'back.out(2.2)' });
  });
  rows.addEventListener('pointerleave', () =>
    gsap.to(chip, { opacity: 0, scale: .75, rotate: rot ? -rot * 1.3 : 0, duration: .35, ease: 'power2.in' }));
};

/* ═══ ٨ · معرض أفقي مثبّت · otsuka · جاهز للـRTL ═══
 * بالـRTL المسار بيفيض عاليسار فبينسحب لليمين (x موجب) · عكسه بالـLTR */const horizontalGallery = (trigger, track, wrap, { rtl = true, scrub = .6 } = {}) => {
  const t = document.querySelector(track);
  const w = document.querySelector(wrap);
  /* v0.1.3: على اللمس التثبيت الأفقي مزعج — سحب أصابع طبيعي أصدق وأخف */
  if (matchMedia('(pointer: coarse)').matches || reduced()) {
    w.style.overflowX = 'auto';
    w.style.webkitOverflowScrolling = 'touch';
    return null;
  }
  const dist = () => t.scrollWidth - w.clientWidth;
  return gsap.to(t, { x: () => (rtl ? 1 : -1) * dist(), ease: 'none',
    scrollTrigger: { trigger, start: 'top top', end: () => '+=' + dist(),
      pin: true, scrub, anticipatePin: 1, invalidateOnRefresh: true } });
};

/* ═══ ٩ · إطار بصور بتتبدّل · Pegasus ═══ */const crossfadeFrame = (frameSel, { hold = 3.4, fade = .8 } = {}) => {
  if (reduced()) return;
  const imgs = gsap.utils.toArray(frameSel + ' img');
  const tl = gsap.timeline({ repeat: -1 });
  imgs.forEach((im, i) => {
    const nxt = imgs[(i + 1) % imgs.length];
    tl.to(nxt, { opacity: 1, duration: fade, ease: 'power2.inOut' }, i * hold + hold)
      .set(im, { opacity: 0 });
  });
  return tl;
};

/* ═══ ١٠ · الناف بيختفي نازلاً وبيرجع طالعاً ═══ */const navAutoHide = (navEl, threshold = 280) => {
  let lastY = 0;
  ScrollTrigger.create({ onUpdate(self) {
    const y = self.scroll();
    navEl.classList.toggle('hide', y > lastY && y > threshold);
    lastY = y;
  } });
};

/* ═══ ١١ · الجو الانزلاقي · Lenis-feel بـScrollSmoother · مكتب فقط ═══ */const smoothScroll = ({ smooth = 1.15 } = {}) => {
  /* v0.1.3: البوابة صارت نوع المؤشر لا العرض — نافذة مكتب مصغّرة ماوس برضه،
     وإطفاء النعومة فيها خلّى التجربة نيّئة (لاحظها ريّان بالفيديو). اللمس بس بينستثنى. */
  if (reduced() || matchMedia('(pointer: coarse)').matches) return null;
  if (typeof ScrollSmoother === 'undefined') return null;
  return ScrollSmoother.create({ wrapper: '#wrap', content: '#content', smooth, effects: true });
};

/* ═══ ١٢ · مشهد متوازٍ بالتمرير · طبقات بعمق data-depth ═══
 * أقوى من تأثير data-speed التجميلي: العمق بيتحرّك بنسبة من ارتفاعه مع خروج المقطع */const sceneParallax = (trigger, sel = '[data-depth]') => {
  if (reduced()) return;
  gsap.utils.toArray(sel).forEach((el) => {
    gsap.fromTo(el, { yPercent: 0 }, { yPercent: -100 * +el.dataset.depth, ease: 'none',
      scrollTrigger: { trigger, start: 'top top', end: 'bottom top', scrub: true } });
  });
};

/* ═══ ١٣ · انجراف محيطي · ضباب وغبار وسحب، حركة دايمة حتى بلا تمرير ═══ */const drift = (el, { x = 46, y = 8, dur = 13, delay = 0 } = {}) => {
  if (reduced()) return;
  return gsap.to(el, { x, y, duration: dur, delay, yoyo: true, repeat: -1, ease: 'sine.inOut' });
};

/* ═══ ١٤ · ورقة بتوقع · حلقة سقوط بدوران وتلاشٍ ═══ */const fall = (el, { y = 380, x = -90, rot = 130, dur = 8, delay = 0, pause = 3 } = {}) => {
  if (reduced()) return;
  const tl = gsap.timeline({ repeat: -1, delay, repeatDelay: pause });
  tl.set(el, { y: 0, x: 0, rotation: 0, opacity: 0 })
    .to(el, { opacity: 1, duration: .8, ease: 'power1.in' }, 0)
    .to(el, { y, x, rotation: rot, duration: dur, ease: 'sine.inOut' }, 0)
    .to(el, { x: '+=30', duration: dur / 3, yoyo: true, repeat: 2, ease: 'sine.inOut' }, 0)
    .to(el, { opacity: 0, duration: 1.1 }, dur - 1.1);
  return tl;
};

/* ═══ ١٥ · أكورديون أسئلة · v0.1.4 ═══
 * بنية متوقعة: حاوية فيها button و .a (الجواب) · الحالة صنف open على الحاوية.
 * انضاف بعد ما النمط انكتب بالإيد بثلاث صفحات ونُسي بالرابعة — المكتبة أضمن من الذاكرة. */const accordion = (sel = '.qa', { dur = .55 } = {}) => {
  document.querySelectorAll(sel).forEach((qa) => {
    const a = qa.querySelector('.a');
    qa.querySelector('button').addEventListener('click', () => {
      const open = qa.classList.toggle('open');
      gsap.to(a, { height: open ? a.scrollHeight : 0, duration: dur,
        ease: open ? 'expo.out' : 'power2.in',
        onComplete: () => ScrollTrigger.refresh() });
    });
  });
};
/* ── نهاية توازَن ──────────────────────────────────────────────────── */
gsap.registerPlugin(ScrollTrigger);

/* ══ تقسيم بالكلمات **بيحافظ على الماركب** ═══════════════════════════
   🔴 ليش محلي ومش من المكتبة: `splitWords` بتوازَن بتعمل
      `el.innerHTML = el.textContent` · يعني **بتسطّح أي عنصر جوّا**.
      فالـ<em> تبع الكلمة المميّزة كان بينمسح، وقاعدة تلوينها ما بتلاقي
      شي تلوّنه. (انكشف بالفحص: querySelector('em') رجّع null.)

   🔴 وما بنعدّل tawaazn-motion.js · هو **نسخة** من مصدر ريّان بمشروع
      توازَن، وأي تعديل لازم يروح للمصدر مش للنسخة. فالحل محلي.

   والمنطق: بنمشي على أبناء العنصر · النص بينقسم كلمات، والعنصر
   (زي <em>) بيضل عنصراً كامل وبيتعامل كوحدة تتابع وحدة. */
function splitKeepMarks(el) {
  if (!el || el.dataset.split) return el.querySelectorAll(':scope > span > i');

  /* 🔴 الوحدة هي **المسافة بالنص الأصلي**، مش عقدة الـDOM.
     الباغ اللي انكشف بالفحص: الفاصلة بعد </em> كانت بتصير span
     مستقلاً، فبتاخذ فرصة كسر سطر وبتهبط لأول السطر اللي بعده منفصلة
     عن كلمتها. (ظهر حرفياً: «شغلة» بسطر و«، وكل مكوّن» بالسطر التاني.)

     فبنجمّع: أي عقدة (نص أو عنصر) ما قبلها مسافة **بتنضمّ لنفس
     المجموعة**. يعني <em>شغلة</em> والفاصلة اللي بعدها = وحدة وحدة.
     وهاي مش تفصيلة عربية · نفس الشي بينطبق على أي علامة ترقيم. */
  const groups = [];
  let cur = null;
  const push = (node) => {
    if (!cur) { cur = document.createDocumentFragment(); groups.push(cur); }
    cur.appendChild(node);
  };
  const brk = () => { cur = null; };

  [...el.childNodes].forEach((n) => {
    if (n.nodeType === 3) {
      const parts = n.textContent.split(/(\s+)/);
      parts.forEach((p) => {
        if (!p) return;
        if (/^\s+$/.test(p)) brk();
        else push(document.createTextNode(p));
      });
    } else {
      push(n);                       /* <em> بيضل <em> · بكل قواعده */
    }
  });

  const out = document.createDocumentFragment();
  groups.forEach((g, i) => {
    if (i) out.appendChild(document.createTextNode(' '));
    const s = document.createElement('span');
    s.style.cssText = 'display:inline-block;overflow:clip;vertical-align:bottom';
    const it = document.createElement('i');
    it.style.cssText = 'display:inline-block;font-style:normal';
    it.appendChild(g);
    s.appendChild(it);
    out.appendChild(s);
  });

  el.innerHTML = '';
  el.appendChild(out);
  el.dataset.split = '1';
  return el.querySelectorAll(':scope > span > i');
}

const h1 = document.querySelector('.shop-hero h1');
const facts = gsap.utils.toArray('.shop-hero__fact');
const lede = ['.shop-hero__sub', '.shop-hero__cta'];

if (reduced()) {
  /* القاعدة ٥ بمكتبة توازَن: المحتوى بيظهر ثابتاً، ما بينحجب أبداً */
  gsap.set([facts, lede], { opacity: 1, y: 0, clearProps: 'transform' });
} else {
  const words = splitKeepMarks(h1);

  gsap.set(words, { yPercent: 112, opacity: 0 });
  gsap.set(lede, { y: 16, autoAlpha: 0 });
  gsap.set(facts, { y: 14, autoAlpha: 0 });

  /* 🔴 تايم‌لاين **وحدة** لكل الرأس · مش تويّنات متفرّقة.
     السبب مقيس بهالمشروع: تويّنتان على نفس العنصر بتتصارعا، والتانية
     بتسجّل قيمة البداية وبتمسح شغل الأولى بصمت.

     والتوقيت من motion-doctrine:
       · دخول العنصر الواحد ≤ ٨٠٠ملي  → ٧٢٠
       · التتابع الكلي ≤ ٥٠٠ملي        → ٨ كلمات × ٠٫٠٦ = ٤٨٠
       · سكتة ٠٫٣-٠٫٧٥ث قبل البيتة الأخيرة → ٠٫٤٥ قبل الحقائق */
  gsap.timeline({ delay: .12 })
    .to(words, { yPercent: 0, opacity: 1, duration: .72, stagger: .06, ease: 'expo.out' }, 0)
    .to(lede, { y: 0, autoAlpha: 1, duration: .56, stagger: .08, ease: EASES ? EASES.out : 'power2.out' }, .34)
    /* السكتة قبل الحسم · «stillness before climax» */
    .to(facts, { y: 0, autoAlpha: 1, duration: .5, stagger: .06, ease: 'power2.out' }, '+=0.45');
}

/* ولا حلقة أبدية بالرأس · الحياة الباقية كلها مربوطة بالسكرول،
   وهي تسلسل القطرة نفسه. الزائرة بتسوق المشهد، مش بتستنى فيه. */

/* بطاقات البكجات · كشف بالتمرير */
/* 🔴 مش .pkc · البطاقات انشالت. اللوح بيدخل بحركته الخاصة عند
   كل اختيار (شوف render)، فما بده كشف بالتمرير كمان — حركتان على
   نفس العنصر بتتصارعا، وهاد فخ مقيس بهالمشروع. */
revealAll('.pk__promise > div');
