/* ==========================================================================
   LUV IT · المفضّلة
   ==========================================================================
   بتخزّن بالمتصفح (localStorage) · مش بالحساب.

   🔴 وهاد قرار مش كسل. الزبونة بتضيف للمفضّلة **قبل** ما تسجّل، وغالباً
      ما بتسجّل أبداً · فربط المفضّلة بالحساب معناه إنها بتضيع بأول ضغطة.
      لما تصير العضوية شغّالة، المزامنة بتنضاف فوق هالطبقة مش بدالها:
      اللي بالمتصفح بينرفع للحساب أول تسجيل دخول.

   🔴 والمفتاح هو **معرّف ووكومرس** · نفس الرقم اللي بيروح للسلة. أي مفتاح
      تاني (سلَغ · اسم) بينكسر أول ما ينتغيّر اسم منتج، وهاد بيصير.
   ========================================================================== */
(function () {
  'use strict';

  var KEY = 'luvit_wish_v1';
  var MAX = 200;                     /* سقف · عشان ما يكبر التخزين بلا حد */

  /* ── التخزين ─────────────────────────────────────────────────────────
     ⚠️ كل قراءة وكتابة محروسة · التخزين بيرمي استثناءً بنافذة خاصة
        وبمتصفحات مقفّلة الكوكيز، والاستثناء بيوقف السكربت كله. */
  function read() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return [];
      var v = JSON.parse(raw);
      if (!Array.isArray(v)) return [];
      /* أرقام صحيحة فقط · وبلا تكرار */
      var out = [], seen = {};
      for (var i = 0; i < v.length && out.length < MAX; i++) {
        var n = parseInt(v[i], 10);
        if (n > 0 && !seen[n]) { seen[n] = 1; out.push(n); }
      }
      return out;
    } catch (e) { return []; }
  }

  function write(list) {
    try { localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX))); }
    catch (e) { /* ممتلئ أو مقفل · الواجهة بتضل شغّالة لهالجلسة */ }
  }

  function toggle(id) {
    var list = read();
    var i = list.indexOf(id);
    if (i === -1) list.unshift(id); else list.splice(i, 1);
    write(list);
    return i === -1;                 /* true = انضافت */
  }

  /* ── العدّاد بالهيدر ───────────────────────────────────────────────── */
  function paintCount() {
    var el = document.getElementById('luvit-wish-count');
    if (!el) return;
    var n = read().length;
    el.textContent = String(n);
    /* [hidden] معرّف بـtokens.css كـdisplay:none · فبنستعمل الخاصية
       نفسها مش style.display، عشان ما نتصارع مع الـCSS. */
    el.hidden = n === 0;
  }

  /* ── حالة الأزرار على البطاقات ─────────────────────────────────────── */
  function paintButtons(root) {
    var list = read();
    var btns = (root || document).querySelectorAll('.luvit-wish[data-wish]');
    for (var i = 0; i < btns.length; i++) {
      var id = parseInt(btns[i].getAttribute('data-wish'), 10);
      btns[i].setAttribute('aria-pressed', list.indexOf(id) !== -1 ? 'true' : 'false');
    }
  }

  function renderEmptyIfNeeded() {
    var wrap = document.getElementById('luvit-wish-list');
    if (!wrap) return;
    var empty = document.getElementById('luvit-wish-empty');
    var n = wrap.querySelectorAll('[data-wish-card]').length;
    if (empty) empty.hidden = n !== 0;
    /* شريط المجموع بيمشي مع الشبكة · فاضية = مخفي */
    var sum = document.getElementById('luvit-wish-sum');
    if (sum) sum.hidden = n === 0;
  }

  /* ── الضغط ───────────────────────────────────────────────────────────
     مفوَّض على المستند · البطاقات بتنبني بعد التحميل بصفحات كثيرة،
     والاستماع على كل زر لحاله بيفوّت اللي بينبني بعدين. */
  document.addEventListener('click', function (ev) {
    var t = ev.target;
    var btn = (t && t.closest) ? t.closest('.luvit-wish[data-wish]') : null;
    if (!btn) return;
    ev.preventDefault();
    var id = parseInt(btn.getAttribute('data-wish'), 10);
    if (!(id > 0)) return;
    var added = toggle(id);
    btn.setAttribute('aria-pressed', added ? 'true' : 'false');
    paintCount();

    /* ⚠️ الاسم والسعر بينقروا من البطاقة اللي الزر جوّاها · مش من نداء
       شبكة. لو الزر برّا بطاقة (ما بيصير حالياً) بينبعت المعرّف وحده،
       والحدث بيضل صالحاً لإعادة الاستهداف. */
    if (added) {
      var host = btn.closest('[data-wish-card]') || btn.closest('.luvit-card') || btn.closest('article');
      var nameEl = host && host.querySelector('.luvit-card__title');
      var priceEl = host && host.querySelector('.luvit-card__price');
      var num = priceEl ? parseFloat((priceEl.textContent || '').replace(/[^0-9.]/g, '')) : NaN;
      track('add_to_wishlist', {
        currency: 'JOD',
        value: isFinite(num) ? num : undefined,
        items: [{
          item_id: String(id),
          item_name: nameEl ? nameEl.textContent.trim() : undefined,
          price: isFinite(num) ? num : undefined
        }]
      });
    }

    /* لو إحنا بصفحة المفضّلة، الشيل لازم يشيل البطاقة كمان */
    var card = btn.closest('[data-wish-card]');
    if (card && !added) { card.remove(); renderEmptyIfNeeded(); renderList(); }
  }, false);

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /* ── التتبّع ─────────────────────────────────────────────────────────
     🔴 ريّان ٤ أيلول: «ما عندي آلية إني أعرف إيش اللي انضاف عالـwishlist
        لأنها مهمة بإعلانات الـretargeting».
     المفضّلة كانت **ما بتطلق ولا حدث لحدا** · مقيس: صفر مطابقة لـgtag
     أو dataLayer بهالملف.

     ⚠️ **وصراحة عن حدود هالشغل:** GA4 وكلاريتي بيستقبلوا فوراً من هون.
        بس **بناء جمهور إعادة استهداف على جوجل بده حساب Google Ads
        مربوط بـGA4** · والحدث لحاله ما بيعمل جمهوراً.
        و**ما في بكسل ميتا على الموقع أصلاً** (مقيس: صفر `fbq`)، فإعلانات
        إنستغرام وفيسبوك **بدها البكسل ينركّب أول**. بلاه الحدث بيروح
        لجوجل وبس.

     وبيفشل صامتاً بقصد · مانع إعلانات أو غياب gtag ما بيوقف المفضّلة. */
  function track(name, params) {
    try {
      if (typeof window.gtag === "function") { window.gtag("event", name, params || {}); }
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push(Object.assign({ event: name }, params || {}));
    } catch (e) {}
  }

  /* السعر بالـStore API بأصغر وحدة · والمنازل بتيجي بالرد لا بتنفترض */
  function priceOf(p) {
    var pr = (p && p.prices) || {};
    var minor = typeof pr.currency_minor_unit === "number" ? pr.currency_minor_unit : 2;
    if (pr.price == null) return null;
    return parseInt(pr.price, 10) / Math.pow(10, minor);
  }

  /* ── صفحة المفضّلة ───────────────────────────────────────────────────
     البيانات بتنجاب من Store API تبع ووكومرس · وهي **عامة** وما بدها
     مصادقة، ونفس المصدر اللي بتقرا منه السلة. يعني السعر والصورة
     بيجوا من نفس المكان اللي بيحاسب، فما في احتمال يختلفوا. */
  function renderList() {
    var wrap = document.getElementById('luvit-wish-list');
    if (!wrap) return;

    var ids = read();
    var status = document.getElementById('luvit-wish-status');

    if (!ids.length) { renderEmptyIfNeeded(); if (status) status.hidden = true; return; }

    if (status) { status.hidden = false; status.textContent = 'لحظة، منجيب مفضّلتك…'; }

    fetch('/wp-json/wc/store/v1/products?per_page=100&include=' + ids.join(','), {
      credentials: 'same-origin'
    })
      .then(function (r) {
        if (!r.ok) { throw new Error('HTTP ' + r.status); }
        return r.json();
      })
      .then(function (items) {
        if (status) status.hidden = true;

        /* 🔴 الترتيب بيتبع ترتيب الإضافة · والـAPI بترجّع بترتيبها هي.
           وبنمشي على ids مش على items عشان: (أ) الترتيب يضل صح،
           و(ب) أي منتج انحذف من المتجر ما بيرجع من الـAPI فبينشال
           من القائمة بدل ما يضل معرّفاً ميتاً مخزَّناً للأبد. */
        var byId = {};
        for (var i = 0; i < items.length; i++) { byId[items[i].id] = items[i]; }

        var alive = [], html = [];
        for (var j = 0; j < ids.length; j++) {
          var p = byId[ids[j]];
          if (!p) continue;
          alive.push(ids[j]);
          html.push(card(p));
        }
        if (alive.length !== ids.length) write(alive);

        wrap.innerHTML = html.join('');

        /* ── المجموع ────────────────────────────────────────────────
           🔴 بينحسب من **نفس الاستجابة** اللي رسمت البطاقات · فما في
              احتمال يختلف عن الأرقام اللي شايفتها الزبونة، ولا نداء
              زيادة على الشبكة. */
        var total = 0, tracked = [];
        for (var k = 0; k < alive.length; k++) {
          var it = byId[alive[k]];
          var v = priceOf(it);
          if (v != null) total += v;
          tracked.push({ item_id: String(alive[k]), item_name: it.name, price: v == null ? undefined : v });
        }
        var tEl = document.getElementById('luvit-wish-total');
        if (tEl) tEl.innerHTML = '<span dir="ltr">' + total.toFixed(2) + '</span> د.أ';

        paintButtons(wrap);
        paintCount();
        renderEmptyIfNeeded();

        /* حدث عرض القائمة · بيعطينا محتوى المفضّلة كاملاً مرة وحدة */
        if (tracked.length) {
          track('view_item_list', {
            item_list_id: 'wishlist',
            item_list_name: 'المفضّلة',
            currency: 'JOD',
            value: Number(total.toFixed(2)),
            items: tracked
          });
        }
      })
      .catch(function () {
        if (status) {
          status.hidden = false;
          status.textContent = 'ما قدرنا نجيب المفضّلة هلأ · جرّبي تحدّثي الصفحة.';
        }
      });
  }

  function card(p) {
    var img = (p.images && p.images[0]) ? p.images[0].src : '';
    var alt = (p.images && p.images[0] && p.images[0].alt) ? p.images[0].alt : p.name;
    /* الأسعار بالـStore API بتيجي بأصغر وحدة · currency_minor_unit بيقول
       كم منزلة عشرية، فالقسمة عليه مش على 100 المكتوبة بالإيد. */
    var pr = p.prices || {};
    var minor = typeof pr.currency_minor_unit === 'number' ? pr.currency_minor_unit : 2;
    var val = pr.price != null ? (parseInt(pr.price, 10) / Math.pow(10, minor)) : null;
    var price = (val == null) ? '' : val.toFixed(minor === 0 ? 0 : 2);

    var out = [];
    out.push('<article class="luvit-card luvit-card--product" data-wish-card="' + p.id + '">');
    out.push('<div class="luvit-card__media">');
    out.push('<button class="luvit-wish" type="button" data-wish="' + p.id + '" aria-pressed="true" aria-label="شيلي ' + esc(p.name) + ' من المفضّلة">');
    out.push('<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.3 4.6 13a4.7 4.7 0 0 1 0-6.7 4.7 4.7 0 0 1 6.7 0l.7.7.7-.7a4.7 4.7 0 0 1 6.7 0 4.7 4.7 0 0 1 0 6.7z"/></svg>');
    out.push('</button>');
    if (img) {
      out.push('<img decoding="async" width="800" height="1000" src="' + esc(img) + '" alt="' + esc(alt) + '">');
    }
    out.push('</div>');
    out.push('<div class="luvit-card__body">');
    out.push('<h3 class="luvit-card__title"><a href="' + esc(p.permalink) + '">' + esc(p.name) + '</a></h3>');
    out.push('<div class="luvit-card__footer">');
    if (price) {
      out.push('<span class="luvit-card__price"><span dir="ltr">' + esc(price) + '</span> د.أ</span>');
    }
    out.push('<a href="/?add-to-cart=' + p.id + '" rel="nofollow" class="luvit-btn add_to_cart_button ajax_add_to_cart" data-product_id="' + p.id + '" data-quantity="1" aria-label="أضيفي ' + esc(p.name) + ' إلى السلة">أضيفي إلى السلة</a>');
    out.push('</div>');
    out.push('</div>');
    out.push('</article>');
    return out.join('');
  }

  /* ── أضيفي الكل للسلة ────────────────────────────────────────────────
     بيستعمل **نقطة أجاكس ووكومرس نفسها** اللي بتستعملها أزرار الإضافة
     على كل بطاقة (`wc_add_to_cart_params.wc_ajax_url`)، فما في نونس ولا
     مسار خاص فينا ينكسر مع أي تحديث.

     ⚠️ **بالتتابع لا بالتوازي بقصد** · جلسة السلة بووكومرس ملف واحد،
        وطلبات متوازية عليها بتتسابق وبتضيع أغراض. البطء مقبول: عشر
        قطع = عشر نداءات قصيرة.

     🔴 وبيرجّع الزر لحالته ويعرض شو صار · ولا مرة بيدّعي نجاحاً ما صار. */
  function addAll(btn) {
    var ids = read();
    if (!ids.length) return;
    var base = (window.wc_add_to_cart_params && wc_add_to_cart_params.wc_ajax_url)
      ? wc_add_to_cart_params.wc_ajax_url.replace("%%endpoint%%", "add_to_cart") : null;
    if (!base) { window.location.href = "/cart/"; return; }

    var label = btn.textContent;
    btn.disabled = true;
    btn.textContent = "لحظة…";

    var done = 0, failed = 0, i = 0;
    function step() {
      if (i >= ids.length) {
        btn.disabled = false;
        btn.textContent = failed ? ("انضاف " + done + " من " + ids.length) : label;
        try { if (window.jQuery) window.jQuery(document.body).trigger("wc_fragment_refresh"); } catch (e) {}
        if (done) { window.location.href = "/cart/"; }
        return;
      }
      var id = ids[i++];
      fetch(base, {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: "product_id=" + encodeURIComponent(id) + "&quantity=1"
      })
        .then(function (r) { if (r.ok) { done++; } else { failed++; } })
        .catch(function () { failed++; })
        .then(step);
    }
    step();
  }

  document.addEventListener("click", function (ev) {
    var t = ev.target;
    var b = (t && t.closest) ? t.closest("#luvit-wish-addall") : null;
    if (!b) return;
    ev.preventDefault();
    addAll(b);
  }, false);

  function boot() { paintCount(); paintButtons(); renderList(); }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  /* تبويب تاني غيّر المفضّلة · الحدث بينطلق بالتبويبات التانية بس */
  window.addEventListener('storage', function (e) {
    if (e.key === KEY) { paintCount(); paintButtons(); }
  });
})();
