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

var LUVIT_RTL = document.documentElement.getAttribute('dir') === 'rtl';
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
