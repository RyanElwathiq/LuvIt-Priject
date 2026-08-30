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

/* ═══ بنك المنحنيات · مقيس من المواقع الستة ═══ */
export const EASES = {
  base: 'cubic-bezier(.23,1,.32,1)',     // Miu Miu ×18 · الأساس لكل شي
  reveal: 'cubic-bezier(.16,1,.3,1)',    // الكشف الطويل
  soft: 'cubic-bezier(.22,1,.36,1)',     // Aventura · التمايل الناعم
  snap: 'cubic-bezier(0,0,0,1)',         // wamdigital · الحسم
  settle: 'cubic-bezier(.33,0,.11,1)',   // LAVA · بداية هادية ونهاية حاسمة
  pop: 'cubic-bezier(.2,2.5,.4,1)',      // LAVA · بيتجاوز الهدف وبيرجع، للحظات الفرح
};

export const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ═══ تقسيم كلمات عربي آمن · بديل SplitText الخفيف ═══ */
export const splitWords = (el) => {
  el.innerHTML = el.textContent.trim().split(/\s+/)
    .map((w) => '<span style="display:inline-block;overflow:clip;vertical-align:bottom">'
      + '<i style="display:inline-block;font-style:normal">' + w + '</i></span>').join(' ');
  return el.querySelectorAll(':scope span > i');
};

/* ═══ ١ · كشف الكلمات المتدرّج · dongwon ═══ */
export const wordReveal = (target, { delay = 0, stagger = .08, dur = 1.05 } = {}) => {
  const words = typeof SplitText !== 'undefined'
    ? new SplitText(target, { type: 'words' }).words
    : splitWords(document.querySelector(target));
  if (reduced()) return gsap.set(words, { opacity: 1 });
  gsap.set(words, { yPercent: 112, opacity: 0 });
  return gsap.to(words, { yPercent: 0, opacity: 1, duration: dur, stagger, delay, ease: 'expo.out' });
};

/* ═══ ٢ · كشف أسطر بقناع · بيحتاج SplitText 3.15+ ═══ */
export const lineMask = (target, trigger, start = 'top 74%') => {
  const s = new SplitText(target, { type: 'lines', mask: 'lines' });
  if (reduced()) return;
  gsap.from(s.lines, { yPercent: 105, duration: 1, stagger: .12, ease: 'expo.out',
    scrollTrigger: { trigger: trigger || target, start } });
};

/* ═══ ٣ · بلور-فيد-أب العام · لكل عنصر .rv ═══ */
export const revealAll = (sel = '.rv', { blur = true } = {}) => {
  if (reduced()) return gsap.set(sel, { opacity: 1 });
  gsap.utils.toArray(sel).forEach((el) => {
    gsap.fromTo(el,
      { opacity: 0, y: 32, filter: blur ? 'blur(6px)' : 'none' },
      { opacity: 1, y: 0, filter: 'blur(0px)', duration: .8, ease: 'expo.out',
        scrollTrigger: { trigger: el, start: 'top 91%' } });
  });
};

/* ═══ ٤ · تعبئة نص بالتمرير · كلمة كلمة ═══
 * colorFn دالّة عشان تنقرا حيّة · وعند قلب الثيم: نادِ ‪.invalidate()‬ على الراجع */
export const scrubFill = (target, trigger, colorFn) => {
  const words = typeof SplitText !== 'undefined'
    ? new SplitText(target, { type: 'words' }).words
    : splitWords(document.querySelector(target));
  return gsap.to(words, { color: colorFn, stagger: .06, ease: 'none',
    scrollTrigger: { trigger, start: 'top 78%', end: 'bottom 45%', scrub: true } });
};

/* ═══ ٥ · مراحل مثبّتة بتزامن حتمي · القاعدة ٣ ═══
 * steps عناصر متراكبة · onIndex(i) بتنستدعى لما تتغيّر المرحلة (رقم، نقاط، تعليق…) */
export const pinnedSteps = ({ trigger, steps, length = '+=280%', scrub = .55, onIndex, onProgress }) => {
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
 * railEl/fillEl مساران متطابقان · curEl دائرة المؤشر · بيرجع دالة بتربطها بتايملاين */
export const pathProgress = (railEl, fillEl, curEl) => {
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
 * chip حاوية fixed فيها صور data-i · rows حاوية الصفوف .row[data-im] */
export const hoverChip = (chipSel, rowsSel, { rot = -3 } = {}) => {
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
 * بالـRTL المسار بيفيض عاليسار فبينسحب لليمين (x موجب) · عكسه بالـLTR */
export const horizontalGallery = (trigger, track, wrap, { rtl = true, scrub = .6 } = {}) => {
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

/* ═══ ٩ · إطار بصور بتتبدّل · Pegasus ═══ */
export const crossfadeFrame = (frameSel, { hold = 3.4, fade = .8 } = {}) => {
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

/* ═══ ١٠ · الناف بيختفي نازلاً وبيرجع طالعاً ═══ */
export const navAutoHide = (navEl, threshold = 280) => {
  let lastY = 0;
  ScrollTrigger.create({ onUpdate(self) {
    const y = self.scroll();
    navEl.classList.toggle('hide', y > lastY && y > threshold);
    lastY = y;
  } });
};

/* ═══ ١١ · الجو الانزلاقي · Lenis-feel بـScrollSmoother · مكتب فقط ═══ */
export const smoothScroll = ({ smooth = 1.15 } = {}) => {
  /* v0.1.3: البوابة صارت نوع المؤشر لا العرض — نافذة مكتب مصغّرة ماوس برضه،
     وإطفاء النعومة فيها خلّى التجربة نيّئة (لاحظها ريّان بالفيديو). اللمس بس بينستثنى. */
  if (reduced() || matchMedia('(pointer: coarse)').matches) return null;
  if (typeof ScrollSmoother === 'undefined') return null;
  return ScrollSmoother.create({ wrapper: '#wrap', content: '#content', smooth, effects: true });
};

/* ═══ ١٢ · مشهد متوازٍ بالتمرير · طبقات بعمق data-depth ═══
 * أقوى من تأثير data-speed التجميلي: العمق بيتحرّك بنسبة من ارتفاعه مع خروج المقطع */
export const sceneParallax = (trigger, sel = '[data-depth]') => {
  if (reduced()) return;
  gsap.utils.toArray(sel).forEach((el) => {
    gsap.fromTo(el, { yPercent: 0 }, { yPercent: -100 * +el.dataset.depth, ease: 'none',
      scrollTrigger: { trigger, start: 'top top', end: 'bottom top', scrub: true } });
  });
};

/* ═══ ١٣ · انجراف محيطي · ضباب وغبار وسحب، حركة دايمة حتى بلا تمرير ═══ */
export const drift = (el, { x = 46, y = 8, dur = 13, delay = 0 } = {}) => {
  if (reduced()) return;
  return gsap.to(el, { x, y, duration: dur, delay, yoyo: true, repeat: -1, ease: 'sine.inOut' });
};

/* ═══ ١٤ · ورقة بتوقع · حلقة سقوط بدوران وتلاشٍ ═══ */
export const fall = (el, { y = 380, x = -90, rot = 130, dur = 8, delay = 0, pause = 3 } = {}) => {
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
 * انضاف بعد ما النمط انكتب بالإيد بثلاث صفحات ونُسي بالرابعة — المكتبة أضمن من الذاكرة. */
export const accordion = (sel = '.qa', { dur = .55 } = {}) => {
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
