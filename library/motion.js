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
  if (v.tooShort)  return 'النص قصير جدًا — الحد الأدنى ' + control.minLength + ' حرفًا';
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
