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
    /* لو إحنا بصفحة المفضّلة، الشيل لازم يشيل البطاقة كمان */
    var card = btn.closest('[data-wish-card]');
    if (card && !added) { card.remove(); renderEmptyIfNeeded(); }
  }, false);

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
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
        paintButtons(wrap);
        paintCount();
        renderEmptyIfNeeded();
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
