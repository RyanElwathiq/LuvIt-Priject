/* ==========================================================================
   LUVIT Jordan — GSAP Motion System  (v2)
   Requires GSAP + ScrollTrigger loaded BEFORE this file.

   v2 additions:
   - DATA-ATTRIBUTE API: animate straight from Elementor, no JS per element.
       data-luvit="reveal"    fade + rise on scroll
       data-luvit="stagger"   children reveal one-by-one (grids, lists)
       data-luvit="slide"     RTL-aware slide-in from the side
       data-luvit="parallax"  scroll-linked drift (decorative layers only)
       data-luvit="float"     gentle infinite bobbing (product images)
       data-luvit="counter"   count up a number when visible
     Optional modifiers:
       data-luvit-y="24"          rise distance px (reveal)
       data-luvit-delay="0.2"     delay seconds
       data-luvit-amount="10"     parallax strength (yPercent)
       data-luvit-mobile="off"    skip this animation on mobile
   - gsap.matchMedia(): desktop gets full motion, mobile gets lighter motion
   - LUVIT.bubbles(selector, count): brand water-bubble field generator
   - ScrollTrigger.batch for grids (better performance than per-item triggers)
   - v1 functions kept: luvitReveal, luvitParallax, luvitSlideIn,
     luvitSignatureHero, luvitPressFeedback (backward compatible)
   ========================================================================== */

gsap.registerPlugin(ScrollTrigger);

/* NOTE — read the RESOLVED direction, not the dir attribute.
   This used to be `document.documentElement.getAttribute('dir') === 'rtl'`.
   That is true in our standalone previews, where the markup carries
   <html dir="rtl">. It is NOT reliable on WordPress: the attribute is written
   from the SITE language, so an Arabic-content site running an English admin
   locale ships <html> with no dir at all.

   When that happens the CSS and the JS disagree. Our stylesheet sets
   direction: rtl on the components, so `inset-inline-start` resolves to the
   RIGHT edge — while this flag came back false and every direction-aware
   animation fanned to the RIGHT as well. Both to the same side, so the
   testimonial stack crept off-centre instead of spreading.

   Symptom seen live on 9 Aug: stack visibly shifted on desktop, and fine on
   mobile only because the phone fan is 5% and the drift was too small to spot.

   getComputedStyle answers what the browser actually laid out, whatever the
   attribute says, so CSS and JS can no longer disagree. Reading <body> too
   because a theme may set direction there rather than on <html>. */
var LUVIT_RTL = (function () {
  var el = document.documentElement;
  if (el.getAttribute('dir') === 'rtl') return true;
  if (getComputedStyle(el).direction === 'rtl') return true;
  return !!(document.body && getComputedStyle(document.body).direction === 'rtl');
})();
var LUVIT_REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
var LUVIT_MM = gsap.matchMedia();

/* --------------------------------------------------------------------------
   Small helpers
   -------------------------------------------------------------------------- */
function luvitNum(el, attr, fallback) {
  var v = parseFloat(el.getAttribute(attr));
  return isNaN(v) ? fallback : v;
}

/* --------------------------------------------------------------------------
   Tier 0 — Instant press feedback (buttons)
   -------------------------------------------------------------------------- */
function luvitPressFeedback(el) {
  if (LUVIT_REDUCED) return;
  el.addEventListener('pointerdown', function () {
    gsap.to(el, { scale: 0.97, duration: 0.15, ease: 'power1.out' });
  });
  ['pointerup', 'pointerleave'].forEach(function (evt) {
    el.addEventListener(evt, function () {
      gsap.to(el, { scale: 1, duration: 0.18, ease: 'power1.out' });
    });
  });
}

/* --------------------------------------------------------------------------
   Tier 1 — Reveal (fade + rise)
   -------------------------------------------------------------------------- */
function luvitReveal(selector, opts) {
  opts = opts || {};
  var targets = gsap.utils.toArray(selector);
  if (!targets.length) return;

  if (LUVIT_REDUCED) { gsap.set(targets, { opacity: 1, y: 0 }); return; }

  targets.forEach(function (group) {
    var children = opts.stagger ? group.children : [group];
    gsap.from(children, {
      opacity: 0,
      y: opts.y || 16,
      duration: opts.duration || 0.45,
      delay: opts.delay || 0,
      ease: 'power2.out',
      stagger: opts.stagger ? (opts.staggerAmount || 0.08) : 0,
      scrollTrigger: {
        trigger: group,
        start: 'top 88%',
        toggleActions: 'play none none reverse',
      },
    });
  });
}

/* Efficient batch reveal for product grids (one trigger, many cards) */
function luvitBatchReveal(selector, opts) {
  opts = opts || {};
  var items = gsap.utils.toArray(selector);
  if (!items.length) return;
  if (LUVIT_REDUCED) { gsap.set(items, { opacity: 1, y: 0 }); return; }

  gsap.set(items, { opacity: 0, y: opts.y || 20 });
  ScrollTrigger.batch(items, {
    start: 'top 90%',
    onEnter: function (batch) {
      gsap.to(batch, {
        opacity: 1, y: 0,
        duration: 0.5, ease: 'power2.out',
        stagger: opts.staggerAmount || 0.08,
        overwrite: true,
      });
    },
    onLeaveBack: function (batch) {
      gsap.to(batch, { opacity: 0, y: opts.y || 20, duration: 0.3, overwrite: true });
    },
  });
}

/* --------------------------------------------------------------------------
   Tier 2 — Parallax (decorative layers ONLY)
   -------------------------------------------------------------------------- */
function luvitParallax(selector, opts) {
  if (LUVIT_REDUCED) return;
  opts = opts || {};
  gsap.utils.toArray(selector).forEach(function (layer, i) {
    gsap.to(layer, {
      yPercent: opts.amount || (8 + i * 2),
      ease: 'none',
      scrollTrigger: {
        trigger: layer.closest('section') || layer.parentElement,
        scrub: opts.scrub !== undefined ? opts.scrub : 0.5,
      },
    });
  });
}

/* --------------------------------------------------------------------------
   Dive — the bottle that rises out of the light and sinks into the water
   --------------------------------------------------------------------------
   الغوص · وافق عليها ريّان ٢٩ آب.

   القصة بثلاث مراحل مربوطة بالسكرول (scrub · مش تشغيل تلقائي):
     ١ · العبوة بتطلع من السكشن الفاتح وبتكبر شوي · «بتخرج من الماء»
     ٢ · بتوصل ذروتها بالضبط عند الحد بين السكشنين
     ٣ · بتغطس بالسكشن الغامق وبتصغر · «بتنزل تحت»

   🔴 وثلاث قواعد ما بتنكسر:
     · `transform` و`opacity` بس · ولا خاصية بتسبب تخطيطاً.
     · ScrollTrigger مش `addEventListener('scroll')` · اللي بيشتغل كل
       فريم وبيقتل الموبايل.
     · تحت `prefers-reduced-motion` **ما بتنعمل الحركة أصلاً** · والعبوة
       بتضل ساكنة بمكانها الطبيعي بالـCSS. يعني ما بتختفي، بس
       ما بتتحرّك.

   ⚠️ وعلى التلفون بتنطفي بالـCSS (`display: none`) · فبنوقف هون كمان
      عشان ما نبني ScrollTrigger لعنصر مخفي (بيحسب أطوالاً غلط).
   -------------------------------------------------------------------------- */
function luvitDive(el) {
  if (LUVIT_REDUCED) return;
  if (window.matchMedia('(max-width: 899px)').matches) return;

  var img = el.querySelector('img');
  if (!img) return;

  /* 🔴 تايم‌لاين **وحدة** · مش تويّنتين.
     أول نسخة كانت تويّنتين مستقلتين (صعود مربوط بالسكشن الفاتح، وغطس
     مربوط بالغامق) وهاي **انكسرت بصمت**: التويّنة الثانية بتسجّل قيمة
     بدايتها أول ما تنعرض، فكل ما ScrollTrigger يحدّثها وهي على صفر
     بترجّع العبوة لمكان البداية وبتمسح الصعود. مقيس:
       تقدّم الصعود ٠٫٥٠ → المصفوفة لساها قيمة البداية بالضبط.
     ومداهما كانوا متداخلين ٧٠px كمان (بسبب `luvit-cut-top`).

     والمرجع صار **العبوة نفسها** مش السكشنين · لسببين:
       · القصة بتلعب وهي على الشاشة فعلاً · `top bottom` لـ`bottom top`
         يعني من لحظة ما تطلع من تحت لحد ما تختفي من فوق. المدى القديم
         كان بيخلّص الغطس والعبوة أصلاً طالعة برّا الشاشة من فوق.
       · بلا تبعية للجيران · نقل السكشن أو زيادة سكشن بينهم ما بيكسرها. */
  var tl = gsap.timeline({
    scrollTrigger: {
      trigger: el,
      start: 'top bottom',
      end: 'bottom top',
      scrub: 1.2,
    },
  });

  /* النصف الأول: بتطلع وبتكبر · «بتخرج من الماء»
     والنصف الثاني: بتغطس وبتصغر · «بتنزل تحت»
     المدّتان متساويتان، فالذروة بنص المدى · وهاد بيقع عملياً على الحدّ
     بين السكشنين لأن العبوة مركّبة عليه. */
  tl.fromTo(img,
      { yPercent: 14, scale: 0.88 },
      { yPercent: -18, scale: 1.06, ease: 'none', duration: 1 })
    .to(img,
      { yPercent: 34, scale: 0.8, ease: 'none', duration: 1 });
}

/* --------------------------------------------------------------------------
   Float — gentle infinite bobbing for product bottles
   -------------------------------------------------------------------------- */
function luvitFloat(selector, opts) {
  if (LUVIT_REDUCED) return;
  opts = opts || {};
  gsap.utils.toArray(selector).forEach(function (el, i) {
    gsap.to(el, {
      y: opts.distance || 12,
      rotation: opts.rotate !== undefined ? opts.rotate : 1.5,
      duration: opts.duration || 2.6,
      ease: 'sine.inOut',
      yoyo: true,
      repeat: -1,
      delay: i * 0.35, /* desync multiple bottles */
    });
  });
}

/* --------------------------------------------------------------------------
   Counter — count a number up when it scrolls into view
   Usage: <span data-luvit="counter">1500</span>
   -------------------------------------------------------------------------- */
function luvitCounter(el) {
  var end = parseFloat((el.textContent || '0').replace(/[^\d.]/g, '')) || 0;
  var obj = { v: 0 };
  gsap.to(obj, {
    v: end,
    duration: 1.4,
    ease: 'power1.out',
    scrollTrigger: { trigger: el, start: 'top 90%', once: true },
    onUpdate: function () { el.textContent = Math.round(obj.v).toLocaleString('en'); },
  });
}

/* --------------------------------------------------------------------------
   RTL-aware slide-in
   -------------------------------------------------------------------------- */
function luvitSlideIn(selector, distance) {
  if (LUVIT_REDUCED) return;
  var dir = LUVIT_RTL ? 1 : -1;
  gsap.utils.toArray(selector).forEach(function (el) {
    gsap.from(el, {
      x: dir * (distance || 32),
      opacity: 0,
      duration: 0.5,
      ease: 'power2.out',
      scrollTrigger: { trigger: el, start: 'top 88%', toggleActions: 'play none none reverse' },
    });
  });
}

/* --------------------------------------------------------------------------
   Tier 3 — Signature hero (word-level split, Arabic-safe)
   -------------------------------------------------------------------------- */
function luvitSplitWords(el) {
  var words = el.textContent.trim().split(/\s+/);
  el.innerHTML = words
    .map(function (w) { return '<span class="luvit-word" style="display:inline-block">' + w + '</span>'; })
    .join(' ');
  return el.querySelectorAll('.luvit-word');
}

function luvitSignatureHero(root) {
  root = typeof root === 'string' ? document.querySelector(root) : root;
  if (!root) return;
  var eyebrow = root.querySelector('.hero-eyebrow');
  var headline = root.querySelector('.hero-headline');
  var subtext = root.querySelector('.hero-subtext');
  var cta = root.querySelector('.hero-cta');
  var image = root.querySelector('.hero-image');

  if (LUVIT_REDUCED) {
    gsap.set([eyebrow, subtext, cta, image].filter(Boolean), { opacity: 1, y: 0, scale: 1 });
    return;
  }

  var words = headline ? luvitSplitWords(headline) : [];
  var tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

  if (eyebrow) tl.from(eyebrow, { opacity: 0, y: 10, duration: 0.5 });
  if (words.length) tl.from(words, { opacity: 0, y: 24, duration: 0.7, stagger: 0.05 }, '-=0.2');
  if (subtext) tl.from(subtext, { opacity: 0, y: 14, duration: 0.55 }, '-=0.3');
  if (cta) tl.from(cta, { opacity: 0, y: 12, duration: 0.5 }, '-=0.3');
  if (image) tl.from(image, { opacity: 0, scale: 1.04, duration: 0.9 }, '-=0.6');

  return tl;
}

/* --------------------------------------------------------------------------
   Bubbles — brand water-bubble field
   Usage: LUVIT.bubbles('.hero-section', 14)
   Container must have position:relative (or absolute/fixed).
   -------------------------------------------------------------------------- */
function luvitBubbles(selector, count) {
  if (LUVIT_REDUCED) return;
  var container = typeof selector === 'string' ? document.querySelector(selector) : selector;
  if (!container) return;
  count = count || 12;

  var wrap = document.createElement('div');
  wrap.style.cssText = 'position:absolute;inset:0;overflow:hidden;pointer-events:none;z-index:0';
  container.prepend(wrap);

  for (var i = 0; i < count; i++) {
    var b = document.createElement('div');
    var sz = 8 + Math.random() * 30;
    b.style.cssText =
      'position:absolute;border-radius:50%;' +
      'background:radial-gradient(circle at 30% 30%, rgba(255,255,255,.9), rgba(76,197,218,.18));' +
      'border:1px solid rgba(255,255,255,.5);' +
      'width:' + sz + 'px;height:' + sz + 'px;' +
      'left:' + (Math.random() * 100) + '%;top:' + (60 + Math.random() * 50) + '%';
    wrap.appendChild(b);

    gsap.to(b, {
      y: -(container.offsetHeight + 120),
      x: '+=' + (Math.random() * 40 - 20),
      duration: 9 + Math.random() * 8,
      ease: 'none',
      repeat: -1,
      delay: Math.random() * 8,
      opacity: 0.9,
    });
  }
}

/* --------------------------------------------------------------------------
   DATA-ATTRIBUTE AUTO-INIT
   Add attributes in Elementor → Advanced → Attributes, e.g.:
     data-luvit|reveal
     data-luvit-y|24
   -------------------------------------------------------------------------- */
function luvitAutoInit() {
  var isMobile = window.matchMedia('(max-width: 767px)').matches;

  document.querySelectorAll('[data-luvit]').forEach(function (el) {
    var kind = el.getAttribute('data-luvit');
    if (isMobile && el.getAttribute('data-luvit-mobile') === 'off') {
      gsap.set(el, { clearProps: 'all', opacity: 1 });
      return;
    }
    var delay = luvitNum(el, 'data-luvit-delay', 0);

    switch (kind) {
      case 'reveal':
        luvitReveal(el, { y: luvitNum(el, 'data-luvit-y', isMobile ? 12 : 16), delay: delay });
        break;
      case 'stagger':
        luvitReveal(el, { stagger: true, y: luvitNum(el, 'data-luvit-y', isMobile ? 12 : 16), delay: delay });
        break;
      case 'slide':
        luvitSlideIn(el, luvitNum(el, 'data-luvit-y', isMobile ? 20 : 32));
        break;
      case 'parallax':
        if (!isMobile) luvitParallax(el, { amount: luvitNum(el, 'data-luvit-amount', 10) });
        break;
      case 'float':
        luvitFloat(el, { distance: isMobile ? 8 : 12 });
        break;
      case 'counter':
        luvitCounter(el);
        break;
      case 'dive':
        luvitDive(el);
        break;
    }
  });
}

/* --------------------------------------------------------------------------
   Public namespace + boot
   -------------------------------------------------------------------------- */
window.LUVIT = {
  reveal: luvitReveal,
  batchReveal: luvitBatchReveal,
  parallax: luvitParallax,
  slideIn: luvitSlideIn,
  float: luvitFloat,
  counter: luvitCounter,
  hero: luvitSignatureHero,
  bubbles: luvitBubbles,
  press: luvitPressFeedback,
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', luvitAutoInit);
} else {
  luvitAutoInit();
}

/* Recalculate triggers after full load (images shift layout) */
window.addEventListener('load', function () { ScrollTrigger.refresh(); });

/* ==========================================================================
   LIQUID GLASS v1  —  BUBBLE-POP press ripple
   --------------------------------------------------------------------------
   Our signature button press: a single bubble grows from the exact point you
   touched/clicked, swells and dissolves — the same visual family as the hero
   bubble field, so the whole site speaks one motion language.

   Performance rules kept:
     · transform + opacity ONLY (compositor thread, no layout/paint thrash)
     · ONE element per press, removed the moment it finishes
     · skipped entirely under prefers-reduced-motion
     · event delegation, so it also works on buttons added later (popups,
       AJAX carts, Elementor lightboxes) without re-initialising anything

   Pairs with the .luvit-bubble styles in tokens.css (LIQUID GLASS v1).
   ========================================================================== */

var LUVIT_BUBBLE_MS = 450;

/* Create + animate one bubble inside `el`, centred on the press point. */
function luvitSpawnBubble(el, clientX, clientY) {
  if (LUVIT_REDUCED) return;
  if (!el || el.hasAttribute('disabled') || el.getAttribute('aria-disabled') === 'true') return;

  var r = el.getBoundingClientRect();
  if (!r.width || !r.height) return;

  /* Press point, relative to the button. Falls back to the centre for
     keyboard activation, where there are no pointer coordinates. */
  var x = (typeof clientX === 'number' && clientX) ? clientX - r.left : r.width / 2;
  var y = (typeof clientY === 'number' && clientY) ? clientY - r.top : r.height / 2;

  /* Size it so the bubble still reaches the furthest corner from that point. */
  function dist(px, py) { return Math.sqrt(px * px + py * py); }
  var far = Math.max(
    dist(x, y),
    dist(r.width - x, y),
    dist(x, r.height - y),
    dist(r.width - x, r.height - y)
  );
  var size = Math.ceil(far * 2);

  var b = document.createElement('span');
  b.className = 'luvit-bubble';
  b.setAttribute('aria-hidden', 'true');
  b.style.width = size + 'px';
  b.style.height = size + 'px';
  b.style.left = x + 'px';
  b.style.top = y + 'px';
  el.appendChild(b);

  /* Ghost buttons get a much fainter bubble so they never shout. */
  var startOpacity = el.classList.contains('luvit-btn--ghost') ? 0.4 : 0.85;

  /* xPercent/yPercent centres it on the press point WITHOUT us hand-writing a
     transform string — so GSAP owns the transform and nothing fights it. */
  gsap.set(b, { xPercent: -50, yPercent: -50, scale: 0, opacity: startOpacity });
  gsap.to(b, {
    scale: 1,
    opacity: 0,
    duration: LUVIT_BUBBLE_MS / 1000,
    ease: 'power2.out',
    onComplete: function () { if (b.parentNode) b.parentNode.removeChild(b); }
  });
}

/* Bind the bubble to ONE element explicitly.
   Usage: LUVIT.bubblePress(document.querySelector('.my-cta')) */
function luvitBubblePress(el) {
  if (!el || el.dataset.luvitBubble === 'bound') return;
  el.dataset.luvitBubble = 'bound';
  el.addEventListener('pointerdown', function (e) {
    luvitSpawnBubble(el, e.clientX, e.clientY);
  }, { passive: true });
}

/* Auto-init for every .luvit-btn, now and in the future, via one delegated
   listener. Elements bound manually above are skipped so they never double up. */
document.addEventListener('pointerdown', function (e) {
  var btn = e.target && e.target.closest ? e.target.closest('.luvit-btn') : null;
  if (!btn) return;
  if (btn.dataset.luvitBubble === 'bound') return;   /* already bound directly */
  luvitSpawnBubble(btn, e.clientX, e.clientY);
}, { passive: true });

/* Keyboard users get the same feedback on Enter/Space (no pointer coords, so
   the bubble blooms from the centre). */
document.addEventListener('keydown', function (e) {
  if (e.key !== 'Enter' && e.key !== ' ' && e.key !== 'Spacebar') return;
  var el = document.activeElement;
  if (!el || !el.classList || !el.classList.contains('luvit-btn')) return;
  if (e.repeat) return;
  luvitSpawnBubble(el);
});

/* Extend the public namespace (defined above) rather than replacing it. */
window.LUVIT.bubblePress = luvitBubblePress;

/* ==========================================================================
   LIQUID GLASS v1  —  COMPONENT 3: NAVIGATION
   --------------------------------------------------------------------------
   Three behaviours:
     1. luvitNavDroplet()  the water bead that slides between desktop links
     2. luvitNavDrawer()   the mobile drawer (water rises to fill the screen)
     3. luvitNavHero()     turns the blur off while the hero is pinned

   Performance notes:
     · The droplet is positioned with transform (compositor). It is absolutely
       positioned, so changing its width can't reflow the rest of the bar.
     · Measurements use physical offsets (rect.left - barRect.left), which is
       why this works unchanged in RTL as well as LTR.
     · Hero detection uses IntersectionObserver, not a scroll listener, so
       nothing runs on every scroll frame.
   ========================================================================== */

/* --------------------------------------------------------------------------
   1. Droplet indicator
   -------------------------------------------------------------------------- */
function luvitNavDroplet(root) {
  root = root || document.querySelector('.luvit-nav');
  if (!root) return;

  var bar  = root.querySelector('.luvit-nav__bar');
  var drop = root.querySelector('.luvit-nav__drop');
  if (!bar || !drop) return;

  /* The bead travels the WHOLE pill, not just the link list — so the cart (and
     any other icon button) is a target too. Anything you want it to visit just
     needs one of these classes. */
  var TARGETS = '.luvit-nav__link, .luvit-nav__icon-btn';

  function visibleTargets() {
    return Array.prototype.slice.call(bar.querySelectorAll(TARGETS))
      .filter(function (el) { return el.offsetParent !== null; });
  }

  var links = Array.prototype.slice.call(bar.querySelectorAll('.luvit-nav__link'));
  if (!links.length) return;

  /* 🔴 THIS USED TO BE A CAPTURED VARIABLE, AND THAT WAS A BUG:

         var active = links.filter(has aria-current)[0] || links[0];

     Two things were wrong with it at once. It read the DOM ONCE at init, and
     when nothing matched it fell back to links[0] — الرئيسية.

     That was harmless only while aria-current was hard-coded in the markup.
     The moment §14 took over writing it, the ordering decided the outcome:
     luvitNavInit registers its DOMContentLoaded listener at this point in the
     file and §14 registers one at the very end, so the bead read the attribute
     BEFORE §14 wrote it, found none, and parked on الرئيسية — on every page of
     the site, while the colour highlight moved to the right link.

     Two indicators disagreeing is worse than one being wrong: the page tells
     the reader two different things about where they are.

     Re-reading on demand fixes both halves. There is no fallback to links[0]
     any more either: on a page with no nav entry of its own (/checkout) the
     honest answer is that no link is current, and the bead hides. */
  var pinned = null;
  function current() {
    if (pinned && bar.contains(pinned) && pinned.offsetParent !== null) return pinned;

    /* 🔴 visibleTargets(), NOT `links`. Two separate reasons, both found by a
       review of this change rather than by writing it:

       1. §14 marks .luvit-nav__icon-btn too, so that /cart has a current item
          in the bar. Searching only .luvit-nav__link meant the one page where
          the cart button IS the current page was the one page the bead refused
          to sit anywhere at all.

       2. A hidden link still matches [aria-current]. Its rect is all zeros, so
          `r.left - b.left` came out at -128.5px with width 0 — the bead would
          collapse and park itself outside the bar. offsetParent is null for
          anything display:none, including via a hidden ancestor, which also
          covers the whole link row below the 1024px breakpoint. */
    var t = visibleTargets();
    for (var i = 0; i < t.length; i++) {
      if (t[i].hasAttribute('aria-current')) return t[i];
    }
    return null;
  }
  var settleTimer = null;

  function moveTo(el) {
    /* no current page in this bar (e.g. /checkout) → the bead has nothing
       honest to point at, so it fades instead of guessing */
    if (!el) { drop.classList.add('is-idle'); return; }
    drop.classList.remove('is-idle');
    var b = bar.getBoundingClientRect();
    var r = el.getBoundingClientRect();

    /* Physical offsets from the bar's top-left. Because both rects are
       physical, this is correct in RTL and LTR alike — but it REQUIRES the
       droplet to be anchored with `left: 0; top: 0` in CSS, never with
       inset-inline-start (which flips to the right edge in Arabic). */
    var x = r.left - b.left;
    var y = r.top - b.top;

    /* Match the target's SHAPE as well as its position: a pill over a text
       link, a circle over the round cart button. */
    drop.style.setProperty('--drop-x', x + 'px');
    drop.style.setProperty('--drop-y', y + 'px');
    drop.style.width = r.width + 'px';
    drop.style.height = r.height + 'px';

    if (LUVIT_REDUCED) return;

    /* Squash while travelling, then settle — this is what makes it read as a
       bead of water rather than a box sliding sideways. */
    drop.classList.add('is-moving');
    clearTimeout(settleTimer);
    settleTimer = setTimeout(function () {
      drop.classList.remove('is-moving');
    }, 180);
  }

  /* Delegated, so targets added later (a wishlist icon, a search button) are
     picked up without re-initialising anything. */
  bar.addEventListener('pointerover', function (e) {
    var t = e.target.closest && e.target.closest(TARGETS);
    if (t && bar.contains(t)) moveTo(t);
  });
  bar.addEventListener('focusin', function (e) {
    var t = e.target.closest && e.target.closest(TARGETS);
    if (t && bar.contains(t)) moveTo(t);
  });

  /* same target set as current(): clicking the cart button should move the
     bead there too, not leave it on the link it was sitting on */
  Array.prototype.slice.call(bar.querySelectorAll(TARGETS)).forEach(function (l) {
    l.addEventListener('click', function () {
      Array.prototype.slice.call(bar.querySelectorAll(TARGETS))
        .forEach(function (x) { x.removeAttribute('aria-current'); });
      l.setAttribute('aria-current', 'page');
      /* pinned, not `active`: the click happens before the next document
         exists, so the bead has to follow the intent rather than the URL */
      pinned = l;
    });
  });

  /* Pointer leaves the whole pill -> the bead flows back to the current page. */
  bar.addEventListener('pointerleave', function () { moveTo(current()); });
  bar.addEventListener('focusout', function (e) {
    if (!bar.contains(e.relatedTarget)) moveTo(current());
  });

  /* Initial placement + keep it correct on resize / font load. */
  /* 🔴 NOT requestAnimationFrame. It never fires in a tab Chrome has stopped
     painting, and this ran during a session where exactly that happened: an
     await on rAF froze a call for 45 seconds until it timed out. A timer runs
     in a sleeping tab; rAF does not. Same reasoning as §11.b and §12. */
  setTimeout(function () { moveTo(current()); }, 0);
  window.addEventListener('load', function () { moveTo(current()); });

  /* Restoring from bfcache re-runs no script and fires no DOMContentLoaded,
     but it DOES fire pageshow with persisted=true. Without this the bead keeps
     whatever position it had when the page was frozen, which after a back
     button is the position for a DIFFERENT page. */
  window.addEventListener('pageshow', function (e) {
    if (!e.persisted) return;
    pinned = null;
    if (window.LUVIT && window.LUVIT.navCurrent) window.LUVIT.navCurrent.init();
    moveTo(current());
  });

  var rt;
  window.addEventListener('resize', function () {
    clearTimeout(rt);
    rt = setTimeout(function () { moveTo(current()); }, 120);
  });

  return { move: moveTo };
}

/* --------------------------------------------------------------------------
   2. Mobile drawer — open/close, focus trap, Escape, scroll lock
   -------------------------------------------------------------------------- */
function luvitNavDrawer(opts) {
  opts = opts || {};
  var drawer = document.querySelector(opts.drawer || '.luvit-drawer');
  var toggle = document.querySelector(opts.toggle || '.luvit-nav__toggle');
  if (!drawer || !toggle) return;

  var closeBtn = drawer.querySelector('.luvit-drawer__close');   /* optional */
  var lastFocused = null;

  /* The toggle lives OUTSIDE the drawer but acts as its close button (it has
     morphed into an X), so it must be part of the focus trap — otherwise a
     keyboard user could tab to the close control and get thrown out of the
     trap, or worse, never reach it. */
  function focusables() {
    var list = Array.prototype.slice.call(drawer.querySelectorAll('a, button'));
    if (closeBtn) list = list.filter(function (el) { return el !== closeBtn; }).concat(closeBtn);
    list.unshift(toggle);
    return list.filter(function (el) { return el && el.offsetParent !== null; });
  }

  function stagger(open) {
    /* Links surface one after another once the water is up.

       🔴 The index has to count only the links that will actually appear.
       Hidden ones (a page that has not been built yet) used to take their turn
       in the sequence and reveal nothing, so the cascade came out with gaps in
       it — a beat of silence where a link should have been. offsetParent is
       null for anything display:none, including an ancestor that is hidden. */
    var items = Array.prototype.filter.call(
      drawer.querySelectorAll('.luvit-drawer__link'),
      function (el) { return el.offsetParent !== null; }
    );
    items.forEach(function (el, i) {
      el.style.transitionDelay = open && !LUVIT_REDUCED ? (160 + i * 45) + 'ms' : '0ms';
    });
  }

  function open() {
    lastFocused = document.activeElement;
    stagger(true);
    drawer.classList.add('is-open');
    drawer.removeAttribute('aria-hidden');
    toggle.setAttribute('aria-expanded', 'true');
    document.body.classList.add('luvit-locked');
    /* Move focus into the drawer so keyboard users aren't left behind it. */
    setTimeout(function () {
      var first = drawer.querySelector('.luvit-drawer__link');
      (first || closeBtn || toggle).focus();
    }, 60);
  }

  function close() {
    stagger(false);
    drawer.classList.remove('is-open');
    drawer.setAttribute('aria-hidden', 'true');
    toggle.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('luvit-locked');
    if (lastFocused && lastFocused.focus) lastFocused.focus();
  }

  function isOpen() { return drawer.classList.contains('is-open'); }

  toggle.addEventListener('click', function () { isOpen() ? close() : open(); });
  if (closeBtn) closeBtn.addEventListener('click', close);

  /* Tapping a link navigates — close so it isn't still open on return. */
  drawer.querySelectorAll('.luvit-drawer__link').forEach(function (l) {
    l.addEventListener('click', close);
  });

  document.addEventListener('keydown', function (e) {
    if (!isOpen()) return;

    if (e.key === 'Escape') { close(); return; }

    /* Focus trap: keep Tab inside the drawer (plus its close control). */
    if (e.key !== 'Tab') return;
    var f = focusables();
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });

  /* Never leave the drawer open when we cross to the desktop layout. */
  var mq = window.matchMedia('(min-width: 1024px)');
  var onChange = function (e) { if (e.matches && isOpen()) close(); };
  if (mq.addEventListener) mq.addEventListener('change', onChange);
  else if (mq.addListener) mq.addListener(onChange);

  close();   /* start closed, with the correct aria state */
  return { open: open, close: close, isOpen: isOpen };
}

/* --------------------------------------------------------------------------
   3. Hero blur guard — drop backdrop-filter while the hero is on screen.
   Uses IntersectionObserver so nothing runs per scroll frame.
   -------------------------------------------------------------------------- */
function luvitNavHeroGuard(heroSelector) {
  var nav = document.querySelector('.luvit-nav');
  var hero = document.querySelector(heroSelector || '#hero-seq');
  if (!nav || !hero || !('IntersectionObserver' in window)) return;

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      nav.classList.toggle('is-over-hero', en.isIntersecting);
    });
  }, { threshold: 0 });

  io.observe(hero);
  return io;
}

/* --------------------------------------------------------------------------
   4. Adaptive theme — re-colour the bar for whatever section is behind it.

   Mark every section:  <section data-nav-bg="dark">  or  data-nav-bg="light"
   Anything unmarked counts as dark, so existing pages keep working.

   How it works: a 1px detection band is placed exactly at the bar's centre
   line, and each marked section is observed against it. Whichever section is
   crossing that line is the one physically behind the bar. Uses
   IntersectionObserver, so nothing runs per scroll frame.
   -------------------------------------------------------------------------- */
function luvitNavTheme() {
  var nav = document.querySelector('.luvit-nav');
  var bar = nav && nav.querySelector('.luvit-nav__bar');
  if (!nav || !bar || !('IntersectionObserver' in window)) return;

  /* 🔴 صفحات القالب · ٤ أيلول
     ريّان: «المقالات فيها خلل بالناف بار».
     القياس على `/why-results-take-time/`: الصفحة فيها **علامتان بس وكلاهما
     `dark`** (الرأس والفوتر)، وجسم المقالة `main.site-main` (٢٩٧٧px من
     الأبيض) **بلا أي علامة**. وقاعدة «غير المعلَّم = غامق» المكتوبة فوق
     بتخلّي `--nav-fg` يضل `rgba(255,255,255,.86)`، فالروابط **بتختفي**
     على الأبيض. مقيس: `linkColor` أبيض و`barBg` فاتح بنفس اللحظة.

     ⤷ فأي جسم قالب **ما إله علامات جوّاه ولا فوقه** بينحسب فاتحاً.
     ⚠️ والشرط ثلاثي بقصد: لو حطّينا العلامة على `main` وجوّاه سكاشن
        معلَّمة، بيصير عندنا صندوقان متداخلان بيتقاطعوا مع نفس الخط
        والنتيجة بتعتمد على ترتيب نداءات المراقب. صفحاتنا المولَّدة
        معلَّمة جوّا `main`، فهاد الشرط بيستثنيها كلها. */
  var themeMain = document.querySelector('main.site-main');
  if (themeMain &&
      !themeMain.hasAttribute('data-nav-bg') &&
      !themeMain.querySelector('[data-nav-bg]') &&
      !themeMain.closest('[data-nav-bg]')) {
    themeMain.setAttribute('data-nav-bg', 'light');
  }

  var sections = document.querySelectorAll('[data-nav-bg]');
  if (!sections.length) return;

  var io = null;

  function apply(mode) {
    nav.classList.toggle('is-on-light', mode === 'light');
    nav.classList.toggle('is-on-dark', mode !== 'light');
  }

  function build() {
    if (io) io.disconnect();

    var r = bar.getBoundingClientRect();
    var line = Math.round(r.top + r.height / 2);   /* bar's centre line */
    var below = Math.max(0, window.innerHeight - line - 1);

    /* 🔴 قرار واحد بينادوه الاثنان · ٤ أيلول
       كان المراقب بيطبّق قيمة **العنصر اللي طلق**، والمسح اليدوي بياخد
       **أول عنصر بالترتيب** بيقطع الخط. الاثنان بينكسروا لما تتداخل
       الصناديق: جسم القالب `main` بيغطّي الصفحة كلها، فهو أول واحد
       بالترتيب و«بيربح» دايماً، والمراقب بيصير مين يطلق آخر مرة.
       ⤷ مقيس على مقالة: النافبار ضلّ `is-on-light` **حتى فوق الفوتر
         الغامق**، والقياس أثبت إنّ الفوتر بيقطع الخط فعلاً.

       فالقرار صار **للأصغر ارتفاعاً** من كل اللي بيقطعوا الخط · وهو
       الأقرب لواقع اللي ورا الشريط، وحاسم مهما كان ترتيب النداءات. */
    function decide() {
      var best = null, bestH = Infinity;
      Array.prototype.forEach.call(sections, function (s) {
        var b = s.getBoundingClientRect();
        if (b.top <= line && b.bottom >= line && b.height < bestH) {
          best = s;
          bestH = b.height;
        }
      });
      if (best) apply(best.getAttribute('data-nav-bg'));
    }

    io = new IntersectionObserver(function () { decide(); }, {
      rootMargin: '-' + line + 'px 0px -' + below + 'px 0px',
      threshold: 0
    });

    Array.prototype.forEach.call(sections, function (s) { io.observe(s); });

    /* 🔴 AND THEN DECIDE ONCE, BY HAND. 3 Sep.
       IntersectionObserver only calls back when an intersection CHANGES. On the
       home page the hero is 500vh and something always crosses soon after load,
       so the bar got its colour and nobody noticed the gap. On every INNER page
       the head is already sitting under the bar at scroll 0, so there is no
       change to report and the callback never ran: the bar kept its default
       (dark glass) over a light head until the shopper scrolled.
       MEASURED on /shipping/: navbar centre line 77px, head top 32px, so it
       does cross, and `crossesLine` is true, and yet the class list was empty.
       Ryan asked twice for the bar to follow the background; this was why.
       So after wiring the observer, read the current state directly and apply
       it. Cheap (one getBoundingClientRect per marked section, and inner pages
       have 2 to 10) and it runs once per build. */
    decide();
  }

  build();

  /* The centre line moves if the viewport resizes, so rebuild the band. */
  var t;
  window.addEventListener('resize', function () {
    clearTimeout(t);
    t = setTimeout(build, 150);
  });

  return { refresh: build };
}

/* --------------------------------------------------------------------------
   Boot the navigation (safe to call twice; each piece no-ops if absent)
   -------------------------------------------------------------------------- */
function luvitNavInit() {
  /* 🔴 FIRST, AND THE ORDER IS THE WHOLE POINT. luvitNavDroplet reads
     aria-current to decide where the bead sits, and §14 is what writes it.
     §14 registers its own DOMContentLoaded listener at the end of this file,
     which fires AFTER this one — so leaving it to run on its own put the write
     after the read and parked the bead on الرئيسية everywhere.
     Function declarations hoist, so calling it here is safe despite §14 being
     defined 900 lines further down. */
  luvitNavCurrent();
  luvitNavDroplet();
  luvitNavDrawer();
  luvitNavHeroGuard();
  luvitNavTheme();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', luvitNavInit);
} else {
  luvitNavInit();
}

window.LUVIT.nav = {
  init:      luvitNavInit,
  droplet:   luvitNavDroplet,
  drawer:    luvitNavDrawer,
  heroGuard: luvitNavHeroGuard,
  theme:     luvitNavTheme
};

/* ==========================================================================
   LIQUID GLASS v1  —  COMPONENT 4: FORMS
   --------------------------------------------------------------------------
   Validation runs on BLUR, per the UX guidance: validating on every keystroke
   nags while the user is still typing; validating only on submit tells them
   too late. Once a field has been marked invalid it re-checks as they type,
   so the error clears the moment it's fixed.

   We use the browser's native constraint validation to DETECT problems
   (checkValidity + the validity flags), because it honours type="email",
   required, minlength and pattern without us re-implementing any of it.

   But we write the MESSAGES ourselves, in Arabic. The browser's own
   validationMessage is translated into the BROWSER's language, not the page's
   — so an Arabic site viewed in an English-language browser shows
   "Please include an '@' in the email address", which is wrong for this
   audience. luvitErrorMessage() below maps each validity flag to Arabic
   wording, and a data-error attribute on the field overrides it.
   ========================================================================== */

/* Arabic message per failure type. Override per field with data-error="...". */
function luvitErrorMessage(control) {
  var custom = control.getAttribute('data-error');
  if (custom) return custom;

  var v = control.validity;
  if (!v) return 'هاي الخانة مطلوبة';

  if (v.valueMissing) {
    if (control.type === 'checkbox' || control.type === 'radio') return 'لازم تختاري';
    if (control.tagName === 'SELECT') return 'اختاري من القائمة';
    return 'هاي الخانة مطلوبة';
  }
  if (v.typeMismatch) {
    if (control.type === 'email') return 'اكتبي إيميل صحيح';
    if (control.type === 'url')   return 'اكتبي رابط صحيح';
    return 'القيمة مش صحيحة';
  }
  if (v.patternMismatch) {
    if (control.type === 'tel') return 'اكتبي رقم تلفون صحيح';
    return 'الصيغة مش صحيحة';
  }
  if (v.tooShort)  return 'النص قصير · أقل شي ' + control.minLength + ' حروف';
  if (v.tooLong)   return 'النص طويل كثير';
  if (v.rangeUnderflow) return 'القيمة أقل من المسموح';
  if (v.rangeOverflow)  return 'القيمة أكبر من المسموح';
  if (v.stepMismatch)   return 'القيمة مش مسموحة';
  if (v.badInput)       return 'القيمة مش صحيحة';
  return 'القيمة مش صحيحة';
}

function luvitFieldOf(control) {
  return control.closest ? control.closest('.luvit-field') : null;
}

function luvitSetFieldState(control, valid, message) {
  var field = luvitFieldOf(control);
  if (!field) return;

  field.classList.toggle('is-invalid', !valid);
  field.classList.toggle('is-valid', valid && control.value !== '');
  control.setAttribute('aria-invalid', valid ? 'false' : 'true');

  var err = field.querySelector('.luvit-field__error');
  if (!err) return;

  /* role="alert" makes screen readers announce it — a flagged High rule. */
  if (!err.hasAttribute('role')) err.setAttribute('role', 'alert');
  if (!valid) {
    err.textContent = message || luvitErrorMessage(control);
    if (!err.id) err.id = 'luvit-err-' + Math.round(performance.now()) + '-' + (control.name || 'f');
    control.setAttribute('aria-describedby', err.id);
  }
}

function luvitValidateControl(control) {
  if (control.disabled || control.type === 'hidden') return true;
  var ok = typeof control.checkValidity === 'function' ? control.checkValidity() : true;
  /* Our Arabic wording, NOT control.validationMessage (browser-language). */
  luvitSetFieldState(control, ok, ok ? '' : luvitErrorMessage(control));
  return ok;
}

function luvitFormInit(form) {
  form = typeof form === 'string' ? document.querySelector(form) : form;
  if (!form || form.dataset.luvitForm === 'bound') return;
  form.dataset.luvitForm = 'bound';

  var controls = Array.prototype.slice.call(
    form.querySelectorAll('.luvit-input, .luvit-textarea, .luvit-select')
  );

  controls.forEach(function (c) {
    c.addEventListener('blur', function () { luvitValidateControl(c); });
    /* Only re-check while typing AFTER it has already failed once. */
    c.addEventListener('input', function () {
      var f = luvitFieldOf(c);
      if (f && f.classList.contains('is-invalid')) luvitValidateControl(c);
    });
  });

  form.addEventListener('submit', function (e) {
    var firstBad = null;
    controls.forEach(function (c) {
      if (!luvitValidateControl(c) && !firstBad) firstBad = c;
    });
    if (firstBad) {
      e.preventDefault();
      firstBad.focus();
      firstBad.scrollIntoView({ block: 'center', behavior: LUVIT_REDUCED ? 'auto' : 'smooth' });
      return;
    }
    /* Valid: show the loading state (flagged rule — never a silent submit). */
    var btn = form.querySelector('button[type="submit"], .luvit-btn[type="submit"]');
    if (btn) {
      btn.classList.add('is-loading');
      btn.setAttribute('aria-busy', 'true');
    }
  });

  return { validate: function () { return controls.every(luvitValidateControl); } };
}

/* :has() fallback for the option cards — older browsers get .is-checked. */
function luvitOptionCards(scope) {
  scope = scope || document;
  var opts = scope.querySelectorAll('.luvit-option input');
  if (!opts.length) return;

  function sync(input) {
    var card = input.closest('.luvit-option');
    if (!card) return;
    if (input.type === 'radio' && input.name) {
      document.querySelectorAll('input[name="' + input.name + '"]').forEach(function (o) {
        var c = o.closest('.luvit-option');
        if (c) c.classList.toggle('is-checked', o.checked);
      });
    } else {
      card.classList.toggle('is-checked', input.checked);
    }
  }

  Array.prototype.forEach.call(opts, function (input) {
    input.addEventListener('change', function () { sync(input); });
    sync(input);
  });
}

/* Report the form's outcome without a page reload (AJAX submits etc.). */
function luvitFormStatus(form, kind, message) {
  form = typeof form === 'string' ? document.querySelector(form) : form;
  if (!form) return;
  var box = form.querySelector('.luvit-form__status');
  var btn = form.querySelector('button[type="submit"], .luvit-btn[type="submit"]');
  if (btn) { btn.classList.remove('is-loading'); btn.removeAttribute('aria-busy'); }
  if (!box) return;
  box.classList.remove('is-success', 'is-error');
  box.classList.add(kind === 'error' ? 'is-error' : 'is-success');
  box.setAttribute('role', 'status');
  box.textContent = message || '';
}

function luvitFormsInit() {
  document.querySelectorAll('.luvit-form').forEach(luvitFormInit);
  luvitOptionCards();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', luvitFormsInit);
} else {
  luvitFormsInit();
}

window.LUVIT.form = {
  init:     luvitFormInit,
  initAll:  luvitFormsInit,
  validate: luvitValidateControl,
  status:   luvitFormStatus,
  optionCards: luvitOptionCards
};

/* ==========================================================================
   LIQUID GLASS v1  —  COMPONENT 5: TESTIMONIALS  ("The Drift")
   --------------------------------------------------------------------------
   A swipeable stack of cards. Dragging is the delight; the buttons, dots and
   keyboard are the actual interface — a drag-only carousel is unusable for
   keyboard and screen-reader users, which is why the reference implementation
   could not ship as-is.

   RTL: the stack fans toward the trailing edge and "next" follows the reading
   direction, both mirrored off LUVIT_RTL.

   Performance: only the front card is driven per frame while dragging, and
   only transform/opacity are touched.
   ========================================================================== */

var LUVIT_TST_THRESHOLD = 110;   /* px of drag needed to advance */

function luvitTestimonials(root) {
  root = typeof root === 'string' ? document.querySelector(root) : root;
  if (!root || root.dataset.luvitTst === 'bound') return;

  var stack = root.querySelector('.luvit-testimonials__stack');
  if (!stack) return;

  var cards = Array.prototype.slice.call(stack.querySelectorAll('.luvit-testimonial'));
  if (cards.length < 2) return;
  root.dataset.luvitTst = 'bound';

  var dir = LUVIT_RTL ? -1 : 1;    /* fan direction: right in LTR, left in RTL */
  var index = 0;                   /* which card is at the front */
  var dots = Array.prototype.slice.call(root.querySelectorAll('.luvit-testimonials__dot'));
  var live = root.querySelector('[data-tst-live]');

  /* ---- Rendering: position every card by its distance from the front ---- */
  function render(skipTransition) {
    cards.forEach(function (card, i) {
      var pos = (i - index + cards.length) % cards.length;   /* 0 = front */
      var isFront = pos === 0;

      if (skipTransition) card.classList.add('is-dragging');

      if (pos > 2) {
        /* Hidden behind the stack — parked, not painted. */
        card.style.transform = 'translateX(' + (dir * 52) + '%) rotate(' + (dir * 9) + 'deg)';
        card.style.opacity = '0';
        card.style.zIndex = '0';
      } else {
        var x = dir * pos * parseFloat(getComputedStyle(root).getPropertyValue('--tst-fan-x') || 26);
        var rot = (pos - 1) * parseFloat(getComputedStyle(root).getPropertyValue('--tst-fan-rot') || 6);
        card.style.transform = 'translateX(' + x + '%) rotate(' + (dir * rot) + 'deg)';
        card.style.opacity = '1';
        card.style.zIndex = String(10 - pos);
      }

      card.classList.toggle('luvit-testimonial--front', isFront);
      card.setAttribute('aria-hidden', isFront ? 'false' : 'true');
      /* Only the front card's links/buttons are reachable by keyboard. */
      card.querySelectorAll('a, button').forEach(function (el) {
        if (el.closest('.luvit-testimonials__controls')) return;
        el.tabIndex = isFront ? 0 : -1;
      });

      if (skipTransition) {
        void card.offsetWidth;                 /* flush, then re-enable */
        card.classList.remove('is-dragging');
      }
    });

    dots.forEach(function (d, i) {
      d.setAttribute('aria-selected', i === index ? 'true' : 'false');
    });
    if (live) live.textContent = 'رأي ' + (index + 1) + ' من ' + cards.length;
  }

  function go(step) {
    index = (index + step + cards.length) % cards.length;
    render();
  }

  /* ---- Drag (pointer events: mouse + touch + pen in one path) ---- */
  var startX = 0, dragging = false, current = null;

  stack.addEventListener('pointerdown', function (e) {
    var card = e.target.closest('.luvit-testimonial');
    if (!card || !card.classList.contains('luvit-testimonial--front')) return;
    if (LUVIT_REDUCED) return;              /* buttons still work */
    dragging = true;
    current = card;
    startX = e.clientX;
    card.classList.add('is-dragging');
    card.setPointerCapture && card.setPointerCapture(e.pointerId);
  });

  stack.addEventListener('pointermove', function (e) {
    if (!dragging || !current) return;
    var dx = e.clientX - startX;
    /* Follow the finger, with a little tilt — like a card slipping in water. */
    current.style.transform =
      'translateX(calc(' + dx + 'px)) rotate(' + (dx * 0.04) + 'deg)';
    current.style.opacity = String(Math.max(0.35, 1 - Math.abs(dx) / 420));
  });

  function endDrag(e) {
    if (!dragging || !current) return;
    var dx = (e.clientX || startX) - startX;
    current.classList.remove('is-dragging');
    dragging = false;

    if (Math.abs(dx) > LUVIT_TST_THRESHOLD) {
      /* Dragging against the reading direction goes forward. */
      go(dx * dir < 0 ? 1 : -1);
    } else {
      render();                              /* snap back */
    }
    current = null;
  }
  stack.addEventListener('pointerup', endDrag);
  stack.addEventListener('pointercancel', endDrag);
  stack.addEventListener('pointerleave', endDrag);

  /* ---- Buttons ---- */
  var next = root.querySelector('[data-tst-next]');
  var prev = root.querySelector('[data-tst-prev]');
  if (next) next.addEventListener('click', function () { go(1); });
  if (prev) prev.addEventListener('click', function () { go(-1); });
  dots.forEach(function (d, i) {
    d.addEventListener('click', function () { index = i; render(); });
  });

  /* ---- Keyboard: arrows move the stack when it has focus ---- */
  root.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight') { go(LUVIT_RTL ? -1 : 1); e.preventDefault(); }
    if (e.key === 'ArrowLeft')  { go(LUVIT_RTL ? 1 : -1); e.preventDefault(); }
  });

  render(true);
  return { next: function () { go(1); }, prev: function () { go(-1); } };
}

function luvitTestimonialsInit() {
  document.querySelectorAll('.luvit-testimonials').forEach(luvitTestimonials);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', luvitTestimonialsInit);
} else {
  luvitTestimonialsInit();
}

window.LUVIT.testimonials = { init: luvitTestimonials, initAll: luvitTestimonialsInit };

/* ==========================================================================
   LIQUID GLASS v1  —  COMPONENT 9: ACCORDION (enhancement only)
   --------------------------------------------------------------------------
   The accordion is built on native <details>/<summary>, so it already works
   with zero JavaScript — keyboard, screen readers and open/close state all
   come free. This adds ONE optional behaviour: opening a question closes the
   others, so the list never becomes a wall of text.

   Opt in per group:   <div class="luvit-acc" data-acc-single>
   Leave the attribute off and several can stay open at once.
   ========================================================================== */
function luvitAccordion(scope) {
  scope = scope || document;
  var groups = scope.querySelectorAll('.luvit-acc[data-acc-single]');

  Array.prototype.forEach.call(groups, function (group) {
    if (group.dataset.luvitAcc === 'bound') return;
    group.dataset.luvitAcc = 'bound';

    var items = Array.prototype.slice.call(group.querySelectorAll('.luvit-acc__item'));
    items.forEach(function (item) {
      item.addEventListener('toggle', function () {
        if (!item.open) return;
        items.forEach(function (other) {
          if (other !== item) other.open = false;
        });
      });
    });
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () { luvitAccordion(); });
} else {
  luvitAccordion();
}

window.LUVIT.accordion = { init: luvitAccordion };

/* ==========================================================================
   LIQUID GLASS v1  —  COMPONENT 13: BEFORE / AFTER SLIDER
   --------------------------------------------------------------------------
   The control is a real <input type="range">, so keyboard and screen-reader
   support come free. This just mirrors its value into a CSS variable, which
   drives the clip-path and the divider position — no layout, no reflow.
   ========================================================================== */
function luvitCompare(scope) {
  scope = scope || document;
  var boxes = scope.querySelectorAll('.luvit-compare');

  Array.prototype.forEach.call(boxes, function (box) {
    if (box.dataset.luvitCmp === 'bound') return;
    box.dataset.luvitCmp = 'bound';

    var range = box.querySelector('.luvit-compare__range');
    if (!range) return;

    function apply() {
      box.style.setProperty('--cmp', range.value + '%');
    }
    range.addEventListener('input', apply);
    apply();
  });
}

/* ==========================================================================
   Scroll-reveal helpers used by the assembled pages
   --------------------------------------------------------------------------
   luvitAutoInit() already handles [data-luvit] elements. These two just wire
   up things that were built long ago and never actually used on a page:
   the brand bubble field, and the count-up numbers.
   ========================================================================== */

/* <div class="luvit-deep" data-luvit-bubbles="12"> -> a drifting bubble field */
function luvitAutoBubbles(scope) {
  scope = scope || document;
  if (LUVIT_REDUCED) return;
  scope.querySelectorAll('[data-luvit-bubbles]').forEach(function (el) {
    if (el.dataset.luvitBubbled === 'yes') return;
    el.dataset.luvitBubbled = 'yes';
    var n = parseInt(el.getAttribute('data-luvit-bubbles'), 10) || 10;
    luvitBubbles(el, n);
  });
}

/* ==========================================================================
   WAVE DIVIDER — tile sizing
   --------------------------------------------------------------------------
   The wave is a repeat-x mask. It tiles at --wave-tile, and the drift animation
   slides it by exactly that distance, so the tile MUST match the element's own
   width or consecutive loops creep out of phase with the section edges.

   CSS alone can't do this: 100vw includes the vertical scrollbar on Windows,
   and a wave inside a padded container is narrower than the viewport anyway.
   So it is measured. The CSS fallback still tiles if this never runs — the
   worst case is a slightly different number of cycles, never a gap.

   --wave-cycles (optional, on the element) sets how many complete waves span
   the box: 1 = one long lazy swell, 2 = a livelier surface.
   ========================================================================== */
function luvitWaves(scope) {
  scope = scope || document;
  scope.querySelectorAll('.luvit-wave').forEach(function (el) {
    var w = el.clientWidth;
    if (!w) return;                       /* hidden or not laid out yet */
    var cycles = parseFloat(el.getAttribute('data-wave-cycles')) || 1;
    if (cycles < 0.25) cycles = 0.25;
    el.style.setProperty('--wave-tile', (w / cycles).toFixed(2) + 'px');
  });
}

/* Re-measure on resize. Debounced, because clientWidth forces layout and a
   drag-resize would otherwise thrash it on every pixel. */
var luvitWaveTimer;
window.addEventListener('resize', function () {
  clearTimeout(luvitWaveTimer);
  luvitWaveTimer = setTimeout(function () { luvitWaves(); }, 150);
});

function luvitPageEnhance() {
  luvitCompare();
  luvitAutoBubbles();
  luvitWaves();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', luvitPageEnhance);
} else {
  luvitPageEnhance();
}

window.LUVIT.compare = { init: luvitCompare };
window.LUVIT.autoBubbles = luvitAutoBubbles;
window.LUVIT.waves = { init: luvitWaves };

/* --------------------------------------------------------------------------
   10. Anchor smooth scroll — replaces the global CSS rule.

   `html { scroll-behavior: smooth }` applied to EVERY scroll on the site,
   including a plain finger flick on checkout. A flick then became an eased
   animation: the page looked frozen for a beat and lurched. Measured from
   Ryan's screen recording, 21 Aug — the content area sat at the noise floor
   through most of a scroll, with occasional jumps of 6-7x that.

   Scoping the CSS rule with `html:has(...)` was tried and REVERTED: a :has()
   on the root re-evaluates on every DOM mutation, and the home page mutates
   constantly (hero canvas, GSAP, IntersectionObservers), which visibly broke
   the waves.

   So: no CSS smooth scrolling anywhere. Smooth behaviour is applied here,
   only to same-page anchor clicks, only when the target exists, and never
   when the visitor asked for reduced motion.
   -------------------------------------------------------------------------- */
function luvitAnchorScroll() {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest ? e.target.closest('a[href*="#"]') : null;
    if (!a) return;

    var href = a.getAttribute('href') || '';
    var hash = href.indexOf('#') > -1 ? href.slice(href.indexOf('#')) : '';
    if (!hash || hash === '#') return;                 /* placeholder link */

    /* only same-document links */
    if (a.pathname !== window.location.pathname || a.host !== window.location.host) return;

    var target;
    try { target = document.querySelector(hash); } catch (err) { return; }
    if (!target) return;

    e.preventDefault();
    target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });

    /* keep the URL honest without triggering a second jump */
    if (window.history && window.history.pushState) {
      window.history.pushState(null, '', hash);
    }
  }, { passive: false });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', luvitAnchorScroll);
} else {
  luvitAnchorScroll();
}

window.LUVIT.anchorScroll = { init: luvitAnchorScroll };

/* --------------------------------------------------------------------------
   11. Cart count badge — plan item 3.4, wired 21 Aug at Ryan's request.

   The header pill already renders `.luvit-nav__count`; it was hard-coded to 0
   because nothing ever fed it. WooCommerce's Store API exposes the live count
   without a page reload, and the blocks fire events whenever the cart changes.

   Cheap by design: one fetch on load, then only on cart-change events. No
   polling, no timers.
   -------------------------------------------------------------------------- */
function luvitCartCount() {
  /* 🔴 الاستثناء مش تجميلاً · شارة المفضّلة (٢ أيلول) بتستعمل نفس الكلاس
     `.luvit-nav__count` عشان الستايل، فالمحدِّد القديم كان بياخدها كمان
     وبيكتب عليها **عدد السلة**. النتيجة المقيسة على الموقع الحي: المفضّلة
     فيها منتجان والشارة بتقول صفر.

     وهاد نمط تكرر عندنا: تعليق هالقسم نفسه بيقول «الهيدر أصلاً بيرسم
     .luvit-nav__count» · وهو كان صحيحاً لما كانت الشارة وحدة. إضافة شارة
     تانية بنفس الكلاس كسرت قارئاً ما كان أحد يفكر فيه. */
  var nodes = document.querySelectorAll('.luvit-nav__count:not(#luvit-wish-count), #luvit-cart-count');
  if (!nodes.length) return;

  var painted = null;   /* last value actually written, so we repaint nothing */
  var settled = false;  /* true once one real reading has landed */

  var srRegion = null;   /* polite region, created once, OUTSIDE the link */

  /* Arabic counts in four buckets, not two: 1 singular, 2 dual, 3-10 plural of
     paucity, 11+ singular as tamyiz. The line we shipped was right only for
     3 to 10 and said "11 قطع" for everything above. Bucket on n % 100 so 103
     lands in the 3-10 bucket and 111 in the 11+ one. */
  function countPhrase(n) {
    if (n === 1) return 'قطعة واحدة';
    if (n === 2) return 'قطعتان';
    var tail = n % 100;
    if (tail >= 3 && tail <= 10) return n + ' قطع';
    return n + ' قطعة';
  }

  /* WHY the name moves onto the LINK: the badge is a bare <span>, which maps to
     role `generic`, and ARIA 1.2 prohibits naming a generic. Chrome, Firefox
     and Safari all DROP an aria-label there, so what a screen reader actually
     announced was the bare digit. The link is nameable; the span is not. */
  function paint(n) {
    if (typeof n !== 'number' || n === painted) return;
    var first = (painted === null);
    painted = n;
    settled = true;

    for (var i = 0; i < nodes.length; i++) {
      nodes[i].textContent = String(n);
      /* hide a zero badge rather than advertise an empty cart.
         tokens.css carries `.luvit-nav__count[hidden]{display:none}` because our
         own `display:block` would otherwise beat the UA rule for [hidden]. */
      nodes[i].hidden = (n === 0);
      nodes[i].setAttribute('aria-hidden', 'true');
      nodes[i].removeAttribute('aria-label');
      var link = nodes[i].closest('a, button');
      if (link) {
        link.setAttribute('aria-label',
          'سلة التسوّق، ' + (n === 0 ? 'فارغة' : countPhrase(n)));
      }
    }

    var host = nodes[0].closest('a, button');
    if (!srRegion && host && host.parentNode) {
      srRegion = host.parentNode.querySelector('.luvit-nav__count-sr');
      if (!srRegion) {
        srRegion = document.createElement('span');
        srRegion.className = 'luvit-sr-only luvit-nav__count-sr';
        srRegion.setAttribute('role', 'status');
        host.insertAdjacentElement('afterend', srRegion);
      }
    }
    /* silent on first paint: nobody asked, so nobody is told */
    if (srRegion && !first) {
      srRegion.textContent =
        (n === 0 ? 'السلة صارت فارغة' : countPhrase(n) + ' بالسلة');
    }
  }

  /* ---- A · the blocks data store.
     Instant and free: no network, the number is already in memory. Only the cart
     and checkout pages register this store, so it is a bonus path, not the path.

     MEASURED 21 Aug: the store's shape is `itemsCount` (camelCase). `items_count`
     is the REST shape and is undefined here — reading it is why the badge never
     moved. Confirmed against `Object.keys(getCartData())`. ---- */
  function fromStore() {
    try {
      if (!window.wp || !window.wp.data) return false;
      var sel = window.wp.data.select('wc/store/cart');
      if (!sel || typeof sel.getCartData !== 'function') return false;
      var cart = sel.getCartData();
      if (!cart || typeof cart.itemsCount !== 'number') return false;
      /* before the store resolves it answers 0. Trust a zero only once something
         real has already landed, otherwise the badge blinks off on every load. */
      if (!settled && cart.itemsCount === 0) return false;
      paint(cart.itemsCount);
      return true;
    } catch (e) { return false; }
  }

  /* ---- B · Store API. Works on every page, including the shop grid. ---- */
  function read() {
    /* 🔴 `cache: 'no-store'` + كاسر كاش إلزاميان: هاد طلب GET، وLiteSpeed
       بيخزّن الـGET. بدونهم الرد بيرجع سلة قديمة، والعدّاد بيرسم 0 فيختفي
       بالكامل — وهاد بالضبط بلاغ ريّان «لما أحط منتج واحد بتروح بالمرة». */
    fetch('/wp-json/wc/store/v1/cart?_=' + Date.now(),
          { credentials: 'include', cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (c) { if (c && typeof c.items_count === 'number') paint(c.items_count); })
      .catch(function () { /* offline or blocked — leave the badge as it is */ });
  }

  fromStore();
  read();

  /* ---- C · what actually fires.
     MEASURED 21 Aug by wrapping EventTarget.prototype.dispatchEvent for the whole
     duration of a quantity change: WooCommerce 11 emits exactly ONE event,
     `wc-blocks_store_sync_required`, on WINDOW. The three names this function
     used to listen for never fired once, which is why the badge sat on a stale
     number while the cart itself updated correctly. ---- */
  window.addEventListener('wc-blocks_store_sync_required', read);

  /* ---- C٢ · 🔴 الحدث اللي كان ناقصاً · بلاغ ريّان ٢٩ آب.
     كل اللي فوق أحداث **WooCommerce Blocks**، وهي بتطلق بصفحات السلة
     والشيك أوت بس. **والمتجر والرئيسية بيستعملوا الإضافة الكلاسيكية**
     (`ajax_add_to_cart` + `wc-add-to-cart.js`)، وهي بتطلق حدث **jQuery**
     اسمه `added_to_cart` على `document.body` — وهاد ما كان بالقائمة.

     فالنتيجة: الإضافة بتنجح والسلة بتتحدّث فعلاً، **والشارة بتضل على رقمها
     القديم** لأنها ما سمعت ولا حدث. ولما ريّان ينتقل لصفحة السلة بتتحدّث،
     فبان له إنها «أحياناً بتشتغل».

     ⚠ وهاد حدث jQuery مش DOM: `addEventListener` **ما بيمسكه**. لازم
       `jQuery(document.body).on(...)`. ---- */
  if (window.jQuery) {
    window.jQuery(document.body).on(
      'added_to_cart removed_from_cart wc_fragments_refreshed wc_fragments_loaded',
      function () { read(); }
    );
  }

  /* the older names cost nothing and still exist on some paths */
  ['wc-blocks_added_to_cart', 'wc-blocks_removed_from_cart', 'wc-blocks_cart_updated']
    .forEach(function (ev) {
      document.body.addEventListener(ev, read);
      window.addEventListener(ev, read);
    });

  /* ---- D · the store subscription is what makes it feel instant: it lands on the
     optimistic update, before the round trip finishes. `read()` above still runs
     as the correction. ---- */
  if (window.wp && window.wp.data && typeof window.wp.data.subscribe === 'function') {
    window.wp.data.subscribe(fromStore);
  }

  /* ---- E · classic AJAX add-to-cart (the shop grid uses this one) ---- */
  if (window.jQuery) {
    window.jQuery(document.body).on('added_to_cart removed_from_cart updated_cart_totals', read);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', luvitCartCount);
} else {
  luvitCartCount();
}

window.LUVIT.cartCount = { init: luvitCartCount };

/* --------------------------------------------------------------------------
   11.b · The totals are recalculating, and someone should be told.

   The visible half of this is 5.24-5: Woo's placeholder bars, repainted so they
   can actually be seen. This is the other half. Under prefers-reduced-motion
   the sweep is off, so a static bar is the only signal there is, and a static
   bar says nothing to a screen reader at all.

   The region hangs off <body>, outside every React root, so reconciliation can
   never drop it. A MutationObserver and not the `wc-blocks_*` events, because
   those were measured on 21 Aug and only one of them fires. Coalesced through
   rAF: a bare observer on the checkout subtree fires on every React render.
   -------------------------------------------------------------------------- */
(function luvitTotalsBusy() {
  var b = document.body;
  if (!b) return;
  if (!b.classList.contains('woocommerce-cart') &&
      !b.classList.contains('woocommerce-checkout')) return;

  var region = document.createElement('div');
  region.className = 'luvit-sr-only';
  region.setAttribute('role', 'status');
  region.setAttribute('aria-live', 'polite');
  b.appendChild(region);

  var busy = false, queued = false;
  function sync() {
    queued = false;
    var loading = !!document.querySelector('.wc-block-components-skeleton__element');
    if (loading === busy) return;
    busy = loading;
    region.textContent = loading ? 'يتم تحديث الإجمالي' : 'تم تحديث الإجمالي';
  }
  /* same reasoning as §12: a timer, not rAF, so a background tab still keeps
     the live region honest. */
  function schedule() { if (!queued) { queued = true; setTimeout(sync, 32); } }
  new MutationObserver(schedule).observe(b, { childList: true, subtree: true });
  sync();
})();


/* --------------------------------------------------------------------------
   12. Checkout field hints — 21 Aug, at Ryan's request.

   "يكون جوا المربع بكلام خفيف grayed out انه حط الايميل"

   `placeholder` is a DOM attribute, so CSS cannot write one; 5.25 only styles
   it. WooCommerce ships none, which is why every box on the checkout was blank
   inside until she guessed what belonged there.

   Two rules kept the list honest:
     · a hint that repeats its own label is noise, so the name fields get none
     · a hint shows the FORMAT she is being asked for, nothing else

   Also set here: `inputmode`, so the phone and postcode fields open a number pad
   instead of a full keyboard. MEASURED 21 Aug — every field on the live page had
   `inputmode` unset.

   Re-applied through a MutationObserver because the checkout is React: an
   address change unmounts and rebuilds these inputs, and a one-shot pass would
   survive only until the first re-render.
   -------------------------------------------------------------------------- */
function luvitFieldHints() {
  if (!document.body || !/woocommerce-checkout|woocommerce-cart/.test(document.body.className)) return;

  /* keyed by the id WooCommerce gives each input, measured on the live page */
  var HINTS = {
    'email':               { ph: 'name@example.com', im: 'email' },
    'shipping-phone':      { ph: '07 9999 9999',     im: 'tel' },
    'billing-phone':       { ph: '07 9999 9999',     im: 'tel' },
    'shipping-address_1':  { ph: 'اسم الشارع ورقم البناية' },
    'billing-address_1':   { ph: 'اسم الشارع ورقم البناية' },
    'shipping-address_2':  { ph: 'شقة أو طابق (اختياري)' },
    'billing-address_2':   { ph: 'شقة أو طابق (اختياري)' },
    'shipping-city':       { ph: 'عمّان' },
    'billing-city':        { ph: 'عمّان' },
    'shipping-postcode':   { ph: '11118', im: 'numeric' },
    'billing-postcode':    { ph: '11118', im: 'numeric' },
    /* the coupon box: 5.27 hides its visible label because the disclosure right
       above it already reads «إضافة قسيمة». This is what stands in its place. */
    'wc-block-components-totals-coupon__input-coupon': { ph: 'كود الخصم' }
  };

  function apply() {
    var ids = Object.keys(HINTS);
    for (var i = 0; i < ids.length; i++) {
      var el = document.getElementById(ids[i]);
      if (!el || el.tagName !== 'INPUT') continue;
      var h = HINTS[ids[i]];
      if (h.ph && el.getAttribute('placeholder') !== h.ph) el.setAttribute('placeholder', h.ph);
      if (h.im && el.getAttribute('inputmode') !== h.im) el.setAttribute('inputmode', h.im);
      /* required is already set by Woo; mirror it for screen readers, which do
         not all infer aria-required from the attribute */
      if (el.required && el.getAttribute('aria-required') !== 'true') {
        el.setAttribute('aria-required', 'true');
      }
    }

    /* MEASURED: #email carries autocomplete="section-contact contact email".
       Woo builds that string in JS and the contact group passes type='contact'.
       In the HTML autofill grammar the token before the field name has to be
       shipping, billing, or a contact-mode token — `contact` is none of those,
       so the whole hint fails to parse and the email drops out of the address
       autofill group. One extra tap per order, on a phone.
       Scoped to that one exact value: billing inputs parse fine and must keep
       their own section, and autocomplete="off" must never be rewritten. */
    var mail = document.getElementById('email');
    if (mail && mail.getAttribute('autocomplete') === 'section-contact contact email') {
      mail.setAttribute('autocomplete', 'section-shipping shipping email');
    }
  }

  apply();

  /* CORRECTED 21 Aug: this used to observe `.wc-block-checkout, .wc-block-cart`.
     Both are rendered by React, so on a cold load neither exists yet when this
     runs, the function returned early, and no observer was ever installed.
     Measured on the cart: the coupon field opened with no placeholder because
     nothing was watching for it. `body` is always there. */
  if (typeof MutationObserver !== 'function') return;

  /* setTimeout and not requestAnimationFrame. rAF is tied to painting, and a
     tab that is not compositing never runs it — measured 21 Aug, when the
     coupon field kept opening with no placeholder while calling the same
     function by hand set it instantly. A timer still coalesces the burst of
     mutations React fires, and it runs whether or not anyone is looking. */
  var queued = false;
  new MutationObserver(function () {
    if (queued) return;
    queued = true;
    setTimeout(function () { queued = false; apply(); }, 32);
  }).observe(document.body, { childList: true, subtree: true });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', luvitFieldHints);
} else {
  luvitFieldHints();
}

window.LUVIT.fieldHints = { init: luvitFieldHints };

/* --------------------------------------------------------------------------
   13. The rail — a shelf you can push. It drifts on a desktop, and only there.

   Ryan settled this on 21 Aug after reading the evidence:
     «التحرك التلقاي الفكره منه جماليه مش اكثر ومش الهدف منها انه الناس تقرا ·
      وعالموبايل اختار افضل حل يكون سريع · عادي لو تلغيه كله»

   That resolves the one place the research argued against the brief. Baymard's
   prohibition is specifically about TOUCH: with no hover there is no pause, and
   a card that moves mid-tap opens the wrong product — on the page paid traffic
   lands on. NN/g's case is about READING: a participant missed the single
   biggest offer on a page because rotation left it visible about a fifth of the
   time. Neither objection touches a slow drift on a mouse-driven screen that
   nobody is trying to read, which is exactly what Ryan asked for.

   So the gate is `(hover: hover) and (pointer: fine)` — the capability, never
   the viewport width and never the user agent. A touch laptop reports coarse
   pointer and gets no timer, which is the case Baymard actually forbids and the
   case a width breakpoint would get wrong.

   Everything else the browser already does well is left to the browser: the
   rail is a native scroll-snap scroller (5.31). Momentum, touch, trackpad,
   wheel and keyboard are its job, not ours. This file adds a mouse drag, the
   controls, and that one desktop drift.

   RTL: `scrollLeft` disagrees between engines in a right-to-left scroller, so
   nothing here reads its sign or magnitude. Direction comes from
   `getComputedStyle().direction` and never from the `dir` attribute — that
   mistake is already in CLAUDE.md, from the day motion.js read `dir` and
   shipped a mirrored bug that only showed up on WordPress.
   -------------------------------------------------------------------------- */
function luvitRails() {
  var rails = document.querySelectorAll('.luvit-rail');
  if (!rails.length) return;

  var reduced = window.matchMedia &&
                window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* the capability gate, evaluated once */
  var pointerFine = window.matchMedia &&
                    window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  Array.prototype.forEach.call(rails, function (root) {
    var track = root.querySelector('.luvit-rail__track');
    if (!track) return;

    var items = Array.prototype.slice.call(track.querySelectorAll('.luvit-rail__item'));
    if (items.length < 2) return;

    var prevBtn = root.querySelector('[data-rail="prev"]');
    var nextBtn = root.querySelector('[data-rail="next"]');
    var chipsWrap = root.querySelector('.luvit-rail__chips');

    /* MEASURED, never assumed: which way is "forward" in this scroller */
    var forward = getComputedStyle(track).direction === 'rtl' ? -1 : 1;

    var behaviour = reduced ? 'auto' : 'smooth';

    /* ---- geometry ---------------------------------------------------------
       offsetLeft is measured from the left edge in every engine, so all the
       maths below happens in that one stable coordinate space and only the
       final scroll call is flipped. ---- */
    function maxScroll() { return track.scrollWidth - track.clientWidth; }

    function scrollToLeft(px) {
      var clamped = Math.max(0, Math.min(px, maxScroll()));
      track.scrollTo({ left: forward === 1 ? clamped : -(maxScroll() - clamped), behavior: behaviour });
    }
    function readLeft() {
      return forward === 1 ? track.scrollLeft : maxScroll() + track.scrollLeft;
    }

    function step() {
      if (items.length < 2) return items[0].offsetWidth;
      return Math.abs(items[1].offsetLeft - items[0].offsetLeft) || items[0].offsetWidth;
    }

    function currentIndex() {
      var mid = readLeft() + track.clientWidth / 2;
      var best = 0, bestDist = Infinity;
      for (var i = 0; i < items.length; i++) {
        var d = Math.abs(items[i].offsetLeft + items[i].offsetWidth / 2 - mid);
        if (d < bestDist) { bestDist = d; best = i; }
      }
      return best;
    }

    function atStart() { return readLeft() < 2; }
    function atEnd() { return readLeft() >= maxScroll() - 2; }

    function go(dir) { scrollToLeft(readLeft() + dir * step()); }

    function goTo(i) {
      var t = items[i];
      if (!t) return;
      scrollToLeft(t.offsetLeft - (track.clientWidth - t.offsetWidth) / 2);
    }

    /* ---- controls.
       Named chips, not anonymous dots: a dot says "there is more" and nothing
       else, while a chip carrying the package name says WHICH more. Falls back
       to a numbered label when an item has no `data-rail-label`. ---- */
    var chips = [];
    if (chipsWrap) {
      items.forEach(function (item, i) {
        var label = item.getAttribute('data-rail-label');
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'luvit-rail__chip' + (label ? '' : ' luvit-rail__chip--dot');
        b.textContent = label || '';
        b.setAttribute('aria-label', label
          ? label
          : 'اذهبي إلى البطاقة ' + (i + 1) + ' من ' + items.length);
        b.addEventListener('click', function () { halt(); goTo(i); });
        chipsWrap.appendChild(b);
        chips.push(b);
      });
    }

    function sync() {
      var i = currentIndex();
      chips.forEach(function (c, n) {
        c.setAttribute('aria-current', n === i ? 'true' : 'false');
      });
      if (prevBtn) prevBtn.disabled = atStart();
      if (nextBtn) nextBtn.disabled = atEnd();
    }

    var syncQueued = false;
    track.addEventListener('scroll', function () {
      if (syncQueued) return;
      syncQueued = true;
      /* a timer and not rAF: a tab that is not compositing never runs rAF, and
         the controls would then lie about where the rail is. Measured 21 Aug. */
      setTimeout(function () { syncQueued = false; sync(); }, 90);
    }, { passive: true });

    if (prevBtn) prevBtn.addEventListener('click', function () { halt(); go(-1); });
    if (nextBtn) nextBtn.addEventListener('click', function () { halt(); go(1); });

    /* ---- mouse drag. Touch scrolls natively; this exists only because a
       desktop pointer cannot fling a scroller. ---- */
    var dragging = false, startX = 0, startScroll = 0, moved = 0;

    track.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      dragging = true; moved = 0;
      startX = e.clientX;
      startScroll = track.scrollLeft;
      track.classList.add('is-dragging');
      halt();
    });

    track.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      var dx = e.clientX - startX;
      moved = Math.abs(dx);
      track.scrollLeft = startScroll - dx;
    });

    function endDrag(e) {
      if (!dragging) return;
      dragging = false;
      track.classList.remove('is-dragging');
      /* a drag that crossed a link must not also open it */
      if (moved > 6 && e && e.target && e.target.closest && e.target.closest('a, button')) {
        window.addEventListener('click', function kill(ev) {
          ev.preventDefault(); ev.stopPropagation();
        }, { capture: true, once: true });
      }
      goTo(currentIndex());   /* snapping was off during the drag */
      sync();
    }
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (ev) {
      track.addEventListener(ev, endDrag);
    });

    /* ---- the drift.
       Desktop only, slow, and it never comes back once she has touched it.
       6000ms because Ryan's purpose is decorative: the eye should catch a
       change, not be asked to keep up with one. ---- */
    var timer = null;
    var stoppedForGood = false;
    var DWELL = 6000;
    var eligible = pointerFine && !reduced;

    function drift() {
      if (document.hidden || dragging) return;
      if (atEnd()) { goTo(0); } else { go(1); }
    }
    function start() {
      if (!eligible || stoppedForGood || timer) return;
      timer = setInterval(drift, DWELL);
    }
    function pause() {
      if (!timer) return;
      clearInterval(timer);
      timer = null;
    }
    /* an interaction is a decision. After it, the rail is hers. */
    function halt() { stoppedForGood = true; pause(); }

    if (eligible) {
      root.addEventListener('pointerenter', pause);
      root.addEventListener('pointerleave', function () { if (!dragging) start(); });
      ['pointerdown', 'keydown', 'wheel'].forEach(function (ev) {
        root.addEventListener(ev, halt, { passive: true });
      });
      root.addEventListener('focusin', halt);
      document.addEventListener('visibilitychange', function () {
        if (document.hidden) pause(); else start();
      });

      /* and only while it is on screen. A drift nobody can see is a battery
         bill and a needless repaint. */
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (entries) {
          entries.forEach(function (en) { en.isIntersecting ? start() : pause(); });
        }, { threshold: 0.35 }).observe(root);
      } else {
        start();
      }
    }

    /* ---- a rail that does not overflow is a grid wearing a rail's clothes.
       Hide the controls rather than ship two dead buttons and a chip row that
       cannot go anywhere. ---- */
    function fit() {
      var overflows = track.scrollWidth > track.clientWidth + 2;
      root.classList.toggle('is-static', !overflows);
      if (!overflows) { halt(); }
    }
    fit();
    if ('ResizeObserver' in window) {
      new ResizeObserver(function () { fit(); sync(); }).observe(track);
    } else {
      window.addEventListener('resize', function () { fit(); sync(); });
    }

    sync();
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', luvitRails);
} else {
  luvitRails();
}

window.LUVIT.rails = { init: luvitRails };

/* --------------------------------------------------------------------------
   14. Which nav item is the current page — 21 Aug.

   The header shipped with `aria-current="page"` HARD-CODED on الرئيسية in three
   places: the bar, the drawer and the dock. MEASURED on the live /products/
   page: the nav still announced الرئيسية as current, so the highlight sat on
   the wrong item on every page of the site except the home page.

   That is not a cosmetic bug. `aria-current="page"` is the machine-readable
   claim "you are here", and a screen reader repeats it verbatim.

   The attribute is now absent from the markup and written here instead.

   TWO THINGS THIS HAS TO GET RIGHT
   --------------------------------
   1. REMOVE, never set to "false". tokens.css selects on `[aria-current]` with
      no value (lines 1375, 1494, 1613), so `aria-current="false"` still matches
      and still paints the link. Only removeAttribute() actually clears it.

   2. `/products` and `/product/abc` are one character apart and mean different
      things — our hub page versus a single WooCommerce product. A naive
      startsWith would light up المنتجات on every product page. The prefix test
      below always appends the separator ('/products/' vs '/product/'), which
      keeps them apart.

   WooCommerce archive URLs are mapped rather than matched: a product page has
   no nav link of its own, and المتجر is the honest ancestor for it.
   -------------------------------------------------------------------------- */
function luvitNavCurrent() {
  /* .luvit-nav__icon-btn is in here so the cart button in the bar can be the
     current page on /cart. It is also a droplet target, so leaving it out left
     the bead with nothing to sit on there. */
  var links = document.querySelectorAll(
    '.luvit-nav__link, .luvit-drawer__link, .luvit-dock__item, .luvit-nav__icon-btn'
  );
  if (!links.length) return;

  /* a URL with no nav link of its own borrows its ancestor's.

     🔴 '/order-received/' was wrong and never matched once: WooCommerce nests
     the thank-you page under the checkout page, at /checkout/order-received/…,
     so nothing ever starts with it. The prefix below is the real one. */
  /* 🔴 الثلاثة الأوائل كانوا بيستعيروا '/shop'، وبالدمج (٣٠ آب) انشال رابط
     /shop من الهيدر كلياً وصارت الوجهة الموحّدة /products. لو ضلّوا على
     /shop، الدالة بتستعير مساراً **ما إله رابط بالقائمة** فما بتلاقي ولا
     تطابق · النتيجة: كل صفحة منتج وكل أرشيف فئة أو وسم بيوقفوا بلا أي
     تمييز بالقائمة، **وبلا ولا خطأ بالكونسول**. نفس باغ ٢١ آب راجعاً من
     الباب الخلفي، وما كان حدا رح يمسكه إلا بالعين. */
  var ALIAS = [
    { when: '/product/',           use: '/products' },
    { when: '/product-category/',  use: '/products' },
    { when: '/product-tag/',       use: '/products' },
    { when: '/shop',               use: '/products' },   /* التحويل ٣٠١ · احتياط */
    { when: '/checkout/order-received', use: '/cart' }
  ];

  function norm(p) {
    try { p = decodeURI(p); } catch (e) { /* malformed escape: use it raw */ }
    p = p.split('?')[0].split('#')[0];
    if (p.length > 1) p = p.replace(/\/+$/, '');
    return p || '/';
  }

  var here = norm(window.location.pathname);
  var exact = true;                     /* false once we borrow an ancestor */
  for (var a = 0; a < ALIAS.length; a++) {
    if (here.indexOf(ALIAS[a].when) === 0) { here = ALIAS[a].use; exact = false; break; }
  }

  /* the longest matching href wins, so '/shop/sale' beats '/shop' when both
     are present. Home is exact-match only — every path starts with '/'. */
  var best = null, bestLen = -1;
  var i, el, href;
  for (i = 0; i < links.length; i++) {
    el = links[i];
    href = el.getAttribute('href') || '';
    if (href.charAt(0) !== '/') continue;          /* skip #anchors and absolutes */
    href = norm(href);

    var hit;
    if (href === '/') {
      hit = here === '/';
    } else if (here === href) {
      hit = true;
    } else if (here.indexOf(href + '/') === 0) {
      hit = true;
      exact = false;                    /* /my-account/orders under /my-account */
    } else {
      hit = false;
    }

    if (hit && href.length > bestLen) { best = href; bestLen = href.length; }
  }

  for (i = 0; i < links.length; i++) {
    el = links[i];
    href = el.getAttribute('href') || '';
    if (best !== null && href.charAt(0) === '/' && norm(href) === best) {
      /* 🔴 "page" means THIS IS the page. On /product/xyz the link that lights
         up is المتجر, which is an ancestor and not the page at all — announcing
         it as "current page" tells a screen-reader user they are somewhere they
         are not. "true" is the value for current-within-a-set, and tokens.css
         selects on [aria-current] with no value, so the highlight is identical
         either way. The styling does not change; the claim does. */
      el.setAttribute('aria-current', exact ? 'page' : 'true');
    } else {
      el.removeAttribute('aria-current');          /* see note 1 above */
    }
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', luvitNavCurrent);
} else {
  luvitNavCurrent();
}

window.LUVIT.navCurrent = { init: luvitNavCurrent };

/* --------------------------------------------------------------------------
   15. Skin quiz — 22 Aug.

   Five questions, one visible at a time, then a suggested routine. All five
   are in the markup from the first byte; this only hides four of them.

   WHY THE MARKUP CARRIES ALL FIVE
   -------------------------------
   With this script absent or broken, the reader still sees every question and
   a line telling her the result needs JavaScript, plus a link to /routines so
   she can choose for herself. The alternative — an empty container filled by
   script — shows nothing at all when the script fails, and a quiz that shows
   nothing is worse than no quiz.

   🔴 THE RESULT IS A SUGGESTION, NOT A DIAGNOSIS. Five questions cannot tell
   anyone what their skin is. The page says so in its own copy, twice, and this
   file must never start producing anything that reads as a verdict.

   THE TIE RULE, AND WHY IT IS NOT A MAJORITY
   ------------------------------------------
   `sensitive` wins outright at 2 points or more, even when another type scores
   higher. That is not what the answers say; it is a deliberate override, and
   the reason is asymmetric risk:

       a gentle routine on ordinary skin ....... fine
       an active routine on reactive skin ...... not fine

   So when the answers are ambiguous the suggestion errs toward the routine
   that cannot hurt. Everything else is a plain highest-score, and a tie
   between oily and dry resolves to `combination`, which is what a face with
   both actually is.

   `none` is a real answer, not a missing one: "nothing happens" and "no
   difference between summer and winter" both describe balanced skin and
   deliberately score nothing.
   -------------------------------------------------------------------------- */
function luvitQuiz() {
  var root = document.querySelector('[data-luvit-quiz]');
  if (!root) return;

  var steps    = Array.prototype.slice.call(root.querySelectorAll('[data-quiz-step]'));
  var result   = root.querySelector('[data-quiz-result]');
  var foot     = root.querySelector('[data-quiz-foot]');
  var progress = root.querySelector('[data-quiz-progress]');
  var fill     = root.querySelector('[data-quiz-fill]');
  var nowEl    = root.querySelector('[data-quiz-now]');
  var backBtn  = root.querySelector('[data-quiz-back]');
  var nojs     = root.querySelector('.luvit-quiz__nojs');
  if (!steps.length || !result) return;

  /* ═══════════════════════════════════════════════════════════════════════
     الكويز بيشخّص **نوع البشرة**، والعلامة بتبيع **روتينات حسب الهدف**.
     فهون طبقتان: `decide()` بترجّع النوع (منطقها مفحوص بـ١٦ حالة ومـا
     انلمس)، و`route()` بتترجم النوع + الشكوى لروتين.

     الروتينات الثلاثة هي المنشورة على إنستغرام (Highlight «Our Routines»
     ٢٤ حزيران) — مش اختراعنا.
     ═══════════════════════════════════════════════════════════════════════ */
  var TYPES = {
    oily: 'الدهنية', dry: 'الجافة', combination: 'المختلطة', sensitive: 'الحسّاسة'
  };

  var ROUTES = {
    hydration: { ar: 'روتين الترطيب والدعم اليومي', href: '/routines/hydration',
                 line: 'أربع خطوات بتحبس المي بالبشرة · تنظيف، تونر، سيروم، وقفل ترطيب.' },
    glow:      { ar: 'روتين الإشراقة', href: '/routines/glow',
                 line: 'نفس الأربع خطوات، بس السيروم هون فيتامين سي · للبهتان وتفاوت اللون.' },
    clarify:   { ar: 'روتين التنقية والتوازن', href: '/routines/clarify',
                 line: 'تنظيف موازن للدهون وتونر بيقلّل مظهر المسام · للبشرة الدهنية والمختلطة.' },
    eventone:  { ar: 'روتين توحيد اللون', href: '/routines/eventone',
                 line: 'خمس خطوات · وفيها واقي الشمس، لأن الحماية شرط بروتين بيشتغل على اللون.' }
  };

  /* 🔴 بوابة · كل مخرَج ممكن من route() لازم يكون بـROUTES.
     بلاها المفتاح الناقص بينبلع بالاحتياطي وبتطلع الزبونة بنتيجة
     **متناقضة**: نوع بشرة صح مع روتين غلط. صار فعلاً ٢ أيلول. */
  (function () {
    var كل = ['hydration', 'glow', 'clarify', 'eventone'];
    for (var i = 0; i < كل.length; i++) {
      if (!ROUTES[كل[i]]) {
        console.error('[luvit] ROUTES ناقصها ' + كل[i] + ' · نتيجة الاختبار بتنبلع');
      }
    }
  })();

  /* النوع → الروتين. جدول صريح عشان يكون مقروءاً ومراجعاً، مش شرطاً مدفوناً. */
  var TYPE_TO_ROUTINE = {
    oily: 'clarify', combination: 'clarify', dry: 'hydration', sensitive: 'hydration'
  };

  function route(type, concern) {
    /* 🔴 البشرة الحسّاسة ما بتنساق لروتين الإشراقة مهما كانت الشكوى.
       استراتيجية العلامة بتقول إن ادعاءات فيتامين سي والحساسية بدها تأكيد
       رسمي من الشركة الأم، وهو ما إجا. فنفس روح الـoverride تبع decide():
       **قرار مخاطرة، مش حسبة.** */
    if (type === 'sensitive') return 'hydration';

    /* الشكوى بتغلب النوع لما تكون هدفاً مش نوع بشرة · بشرة دهنية بتقدر
       تكون باهتة وبشرة جافة كمان، ونفس الإشي للبقع.

       🔴 و`eventone` انضاف ٢ أيلول · قبله كان الاختبار بيوصل لتلاتة
          من أربعة روتينات بس، والرابع **غير قابل للوصول بنيوياً**
          (٢٠ توليفة · صفر). وخيار «بهتان وتفاوت لون» كان بيلمّ هدفين
          فبيوصّل نصّ الزبونات لروتين فيه فيتامين سي وهنّ بدهن ألفا
          أربوتين. */
    if (concern === 'glow') return 'glow';
    if (concern === 'eventone') return 'eventone';

    return TYPE_TO_ROUTINE[type] || 'hydration';
  }

  var ARABIC = ['٠', '١', '٢', '٣', '٤', '٥'];
  var at = 0;

  /* the markup shows everything for the no-JS reader; from here the script
     owns visibility, so it takes over before anything else happens */
  if (nojs) nojs.hidden = true;
  if (progress) progress.hidden = false;
  if (foot) foot.hidden = false;

  function show(i) {
    at = i;
    steps.forEach(function (s, n) { s.hidden = (n !== i); });
    result.hidden = true;
    if (foot) foot.hidden = false;
    if (backBtn) backBtn.hidden = (i === 0);
    if (nowEl) nowEl.textContent = ARABIC[i + 1] || String(i + 1);
    if (fill) fill.style.inlineSize = ((i + 1) / steps.length * 100) + '%';
    var bar = root.querySelector('[role="progressbar"]');
    if (bar) bar.setAttribute('aria-valuenow', String(i + 1));

    /* move focus to the question so a keyboard or screen-reader user lands on
       the new one instead of staying on the option they just left behind */
    var legend = steps[i].querySelector('legend');
    if (legend) {
      legend.setAttribute('tabindex', '-1');
      try { legend.focus({ preventScroll: true }); } catch (e) { legend.focus(); }
    }
  }

  function score() {
    var tally = { oily: 0, dry: 0, combination: 0, sensitive: 0 };
    var answered = 0, concern = null;
    steps.forEach(function (s) {
      var picked = s.querySelector('input[type="radio"]:checked');
      if (!picked) return;
      answered++;
      /* الشكوى الأساسية بتنقرا من السؤال ١ لحالها. قيمتها ممكن تكون `glow`
         وهي **مش نوع بشرة**، فـ`hasOwnProperty` تحت بتتجاهلها من الـtally
         تلقائياً وما بتلوّث التشخيص. */
      if (s.getAttribute('data-quiz-step') === '1') concern = picked.value;
      if (picked.value !== 'none' && tally.hasOwnProperty(picked.value)) tally[picked.value]++;
    });
    return { tally: tally, answered: answered, concern: concern };
  }

  function decide(t) {
    /* see the note at the top: this override is about risk, not arithmetic */
    if (t.sensitive >= 2) return 'sensitive';

    var best = null, bestN = -1, tied = [];
    Object.keys(t).forEach(function (k) {
      if (t[k] > bestN) { bestN = t[k]; best = k; tied = [k]; }
      else if (t[k] === bestN) { tied.push(k); }
    });

    /* 🔴 ANY TIE AT THE TOP RESOLVES TO `combination`, AND THAT IS A RULE, NOT
       A FALLBACK.

       The first version only caught an oily/dry tie and let everything else
       fall through to `best`. `best` is whichever tied key the loop happened
       to reach first, which is the order the keys were written in the object
       literal — so a 2-2 tie between oily and combination returned `oily`
       purely because `oily` is typed above `combination` in this file. That is
       a result decided by source formatting, and moving one line would have
       changed what a reader is told about her own face.

       MEASURED on the live page before the fix: answers oily / combination /
       combination / none / oily gave oily 2, combination 2, and the page said
       البشرة الدهنية.

       The principled answer was already sitting there: a tie means the five
       answers did not agree on one type, and a face showing more than one type
       at once is what `combination` means. So the tie IS the finding, not a
       problem to break. */
    if (tied.length > 1) return 'combination';

    /* nobody scored: every answer was "nothing happens" */
    if (bestN === 0) return 'combination';
    return best;
  }

  function finish() {
    var s = score();
    var type = decide(s.tally);                 /* نوع البشرة · منطق مفحوص */
    var key  = route(type, s.concern);          /* → روتين حسب الهدف */
    var r    = ROUTES[key] || ROUTES.hydration;
    var typeAr = TYPES[type] || '';

    steps.forEach(function (st) { st.hidden = true; });
    if (progress) progress.hidden = true;
    if (foot) foot.hidden = true;

    result.innerHTML =
      '<p class="luvit-quiz__resultlabel">على حسب إجاباتك · بشرتك ' + typeAr + '</p>' +
      '<h2 class="luvit-quiz__resulttitle">' + r.ar + '</h2>' +
      '<p class="luvit-quiz__resultline">' + r.line + '</p>' +
      '<div class="luvit-quiz__resultfoot">' +
      '<a class="luvit-btn luvit-btn--arrow" href="' + r.href + '">شوفي الروتين</a>' +
      '<button type="button" class="luvit-btn luvit-btn--ghost luvit-btn--on-dark" ' +
      'data-quiz-again>أعيدي الاختبار</button>' +
      '</div>' +
      /* 🔴 this line is not decoration. It is the difference between a
         suggestion and a claim, and it ships with every single result. */
      '<p class="luvit-quiz__resultnote">هاد اقتراح مبني على خمس أسئلة · مش تشخيص. ' +
      'وبتقدري تشوفي <a href="/routines">كل الروتينات</a> وتختاري غيره.</p>';
    result.hidden = false;

    var again = result.querySelector('[data-quiz-again]');
    if (again) again.addEventListener('click', reset);

    result.setAttribute('tabindex', '-1');
    try { result.focus({ preventScroll: true }); } catch (e) { result.focus(); }
  }

  function reset() {
    root.querySelectorAll('input[type="radio"]').forEach(function (i) { i.checked = false; });
    result.innerHTML = '';
    if (progress) progress.hidden = false;
    show(0);
  }

  /* delegated: one listener for all five questions, and it keeps working if a
     question is ever added or removed from the markup */
  root.addEventListener('change', function (e) {
    var input = e.target;
    if (!input || input.type !== 'radio') return;
    var step = input.closest('[data-quiz-step]');
    if (!step) return;
    var i = steps.indexOf(step);
    if (i < 0) return;

    /* a beat before moving on, so the chosen option is visibly chosen first.
       🔴 setTimeout, not requestAnimationFrame: rAF never fires in a tab the
       browser has stopped painting, and this has already frozen a call in this
       project for 45 seconds. Same reasoning as §11.b, §12 and §14. */
    setTimeout(function () {
      if (i + 1 < steps.length) show(i + 1);
      else finish();
    }, LUVIT_REDUCED ? 0 : 260);
  });

  if (backBtn) {
    backBtn.addEventListener('click', function () {
      if (at > 0) show(at - 1);
    });
  }

  show(0);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', luvitQuiz);
} else {
  luvitQuiz();
}

window.LUVIT.quiz = { init: luvitQuiz };
