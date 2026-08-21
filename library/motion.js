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

  var active = links.filter(function (l) { return l.hasAttribute('aria-current'); })[0] || links[0];
  var settleTimer = null;

  function moveTo(el) {
    if (!el) return;
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

  links.forEach(function (l) {
    l.addEventListener('click', function () {
      links.forEach(function (x) { x.removeAttribute('aria-current'); });
      l.setAttribute('aria-current', 'page');
      active = l;
    });
  });

  /* Pointer leaves the whole pill -> the bead flows back to the current page. */
  bar.addEventListener('pointerleave', function () { moveTo(active); });
  bar.addEventListener('focusout', function (e) {
    if (!bar.contains(e.relatedTarget)) moveTo(active);
  });

  /* Initial placement + keep it correct on resize / font load. */
  requestAnimationFrame(function () { moveTo(active); });
  window.addEventListener('load', function () { moveTo(active); });
  var rt;
  window.addEventListener('resize', function () {
    clearTimeout(rt);
    rt = setTimeout(function () { moveTo(active); }, 120);
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
    /* Links surface one after another once the water is up. */
    var items = drawer.querySelectorAll('.luvit-drawer__link');
    Array.prototype.forEach.call(items, function (el, i) {
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

    io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) apply(en.target.getAttribute('data-nav-bg'));
      });
    }, {
      rootMargin: '-' + line + 'px 0px -' + below + 'px 0px',
      threshold: 0
    });

    Array.prototype.forEach.call(sections, function (s) { io.observe(s); });
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
  if (!v) return 'هذا الحقل مطلوب';

  if (v.valueMissing) {
    if (control.type === 'checkbox' || control.type === 'radio') return 'الرجاء الاختيار';
    if (control.tagName === 'SELECT') return 'الرجاء الاختيار من القائمة';
    return 'هذا الحقل مطلوب';
  }
  if (v.typeMismatch) {
    if (control.type === 'email') return 'الرجاء إدخال بريد إلكتروني صحيح';
    if (control.type === 'url')   return 'الرجاء إدخال رابط صحيح';
    return 'القيمة غير صحيحة';
  }
  if (v.patternMismatch) {
    if (control.type === 'tel') return 'الرجاء إدخال رقم هاتف صحيح';
    return 'الصيغة غير صحيحة';
  }
  if (v.tooShort)  return 'النص قصير جدًا، الحد الأدنى ' + control.minLength + ' حرفًا';
  if (v.tooLong)   return 'النص طويل جدًا';
  if (v.rangeUnderflow) return 'القيمة أقل من المسموح';
  if (v.rangeOverflow)  return 'القيمة أكبر من المسموح';
  if (v.stepMismatch)   return 'القيمة غير مسموحة';
  if (v.badInput)       return 'القيمة غير صحيحة';
  return 'القيمة غير صحيحة';
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
  var nodes = document.querySelectorAll('.luvit-nav__count, #luvit-cart-count');
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
    fetch('/wp-json/wc/store/v1/cart', { credentials: 'include' })
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
