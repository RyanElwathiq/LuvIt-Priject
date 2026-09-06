/* ══════════════════════════════════════════════════════════════════════
   مسبار الفحص البصري · بينحقن بتبويب ضيف وبيرجّع قياسات موضوعية
   ══════════════════════════════════════════════════════════════════════
   🔴 **قياسات لا أحكام.** الهدف نمسك الفئة اللي العين بتفوّتها وبتظهر
      بس بمقاس معيّن: تجاوز أفقي · تراكب · نصّ مقصوص · هدف لمس صغير ·
      عقدة نصّية سايبة · صورة مكسورة.

   ⚠️ **وما بيحكم على الجمال** · الجمال بينشاف بلقطة، والباغ بينقاس.
      [[layout-breaks-that-no-gate-can-see]] · [[contrast-must-be-measured-not-eyeballed]]

   ⚠️ **ولا يشتغل إلا بعد ما تستقر الحركة** · العناصر المتحرّكة بتبلّش
      `opacity: 0`، فقياسها قبل الاستقرار بيعطي إنذارات كاذبة.
      [[scrollto-does-not-drive-scrolltrigger]]
   ══════════════════════════════════════════════════════════════════════ */
(function () {
  var out = {
    w: window.innerWidth,
    h: window.innerHeight,
    title: document.title,
    path: location.pathname
  };

  var vis = function (el) {
    if (!el || !el.getBoundingClientRect) { return false; }
    var r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) { return false; }
    var s = getComputedStyle(el);
    return s.display !== 'none' && s.visibility !== 'hidden';
  };
  var box = function (el) {
    var r = el.getBoundingClientRect();
    return Math.round(r.left) + ',' + Math.round(r.top + window.scrollY) +
      ' ' + Math.round(r.width) + 'x' + Math.round(r.height);
  };
  var tag = function (el) {
    return el.tagName.toLowerCase() +
      (el.id ? '#' + el.id : '') +
      (el.className && typeof el.className === 'string'
        ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.')
        : '');
  };

  /* ── ١ · تجاوز أفقي · الصفحة ما بتنزلق يمين ويسار ───────────────── */
  out.docW = document.documentElement.scrollWidth;
  out.overflowX = out.docW > window.innerWidth + 1;
  out.overflowers = [];
  if (out.overflowX) {
    var all = document.querySelectorAll('body *');
    for (var i = 0; i < all.length; i++) {
      var r = all[i].getBoundingClientRect();
      if (!vis(all[i])) { continue; }
      if (r.right > window.innerWidth + 2 || r.left < -2) {
        out.overflowers.push(tag(all[i]) + ' ' + box(all[i]));
        if (out.overflowers.length >= 6) { break; }
      }
    }
  }

  /* ── ٢ · نصّ مقصوص · العنصر أصغر من محتواه ─────────────────────── */
  out.clipped = [];
  var texty = document.querySelectorAll('h1,h2,h3,h4,p,li,span,a,button,label,td,th');
  for (var j = 0; j < texty.length; j++) {
    var e = texty[j];
    if (!vis(e) || !e.textContent.trim()) { continue; }
    var cs = getComputedStyle(e);
    if (cs.overflow === 'visible' && cs.overflowY === 'visible') { continue; }
    if (e.scrollHeight > e.clientHeight + 3 || e.scrollWidth > e.clientWidth + 3) {
      out.clipped.push(tag(e) + ' ' + box(e) +
        ' scroll=' + e.scrollWidth + 'x' + e.scrollHeight +
        ' client=' + e.clientWidth + 'x' + e.clientHeight +
        ' « ' + e.textContent.trim().slice(0, 40));
      if (out.clipped.length >= 8) { break; }
    }
  }

  /* ── ٣ · هدف لمس أصغر من ٤٤ بكسل · معيار الموبايل ──────────────── */
  out.smallTargets = [];
  if (window.innerWidth < 900) {
    var tapp = document.querySelectorAll('a,button,input[type=checkbox],input[type=radio],[role=button]');
    for (var k = 0; k < tapp.length; k++) {
      var t = tapp[k];
      if (!vis(t)) { continue; }
      var tr = t.getBoundingClientRect();
      if (tr.height < 44 || tr.width < 24) {
        out.smallTargets.push(tag(t) + ' ' + Math.round(tr.width) + 'x' + Math.round(tr.height) +
          ' « ' + (t.textContent || t.getAttribute('aria-label') || '').trim().slice(0, 26));
        if (out.smallTargets.length >= 10) { break; }
      }
    }
  }

  /* ── ٤ · عقدة نصّية سايبة · فئة الذيول اليتيمة ─────────────────── */
  /* [[replacing-inside-nested-markup-leaves-a-tail]] */
  out.looseText = [];
  var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);
  var n;
  while ((n = walker.nextNode())) {
    var txt = n.textContent.trim();
    if (txt.length < 3) { continue; }
    var p = n.parentElement;
    if (!p || /^(SCRIPT|STYLE|NOSCRIPT|TITLE)$/.test(p.tagName)) { continue; }
    /* عقدة نصّية جوّا حاوية تخطيط (مش عنصر نصّ) = ذيل غالباً */
    if (/^(DIV|SECTION|UL|OL|NAV|HEADER|FOOTER|MAIN|ARTICLE)$/.test(p.tagName)) {
      if (!vis(p)) { continue; }
      out.looseText.push(tag(p) + ' « ' + txt.slice(0, 50));
      if (out.looseText.length >= 8) { break; }
    }
  }

  /* ── ٥ · صور مكسورة أو بلا نصّ بديل ───────────────────────────── */
  out.brokenImgs = [];
  out.noAlt = 0;
  var imgs = document.querySelectorAll('img');
  for (var q = 0; q < imgs.length; q++) {
    var im = imgs[q];
    if (im.complete && im.naturalWidth === 0) {
      out.brokenImgs.push((im.currentSrc || im.src || '').split('/').pop().slice(0, 50));
    }
    if (!im.getAttribute('alt')) { out.noAlt++; }
  }
  out.imgCount = imgs.length;

  /* ── ٦ · عناصر متراكبة · العنصر الثابت فوق محتوى ──────────────── */
  out.fixedOverlap = [];
  var fixed = [];
  var everything = document.querySelectorAll('body *');
  for (var f = 0; f < everything.length; f++) {
    if (getComputedStyle(everything[f]).position === 'fixed' && vis(everything[f])) {
      fixed.push(everything[f]);
    }
  }
  var heads = document.querySelectorAll('h1,h2');
  for (var g = 0; g < heads.length && g < 6; g++) {
    if (!vis(heads[g])) { continue; }
    var hr = heads[g].getBoundingClientRect();
    for (var x = 0; x < fixed.length; x++) {
      var fr = fixed[x].getBoundingClientRect();
      if (getComputedStyle(fixed[x]).pointerEvents === 'none') { continue; }
      var over = !(fr.bottom <= hr.top || fr.top >= hr.bottom ||
                   fr.right <= hr.left || fr.left >= hr.right);
      if (over && fr.height < window.innerHeight * 0.6) {
        out.fixedOverlap.push(tag(fixed[x]) + ' فوق ' + tag(heads[g]) +
          ' « ' + heads[g].textContent.trim().slice(0, 30));
      }
    }
  }

  /* ── ٧ · نصّ لاتيني بلا عزل اتجاه ─────────────────────────────── */
  /* [[brand-name-rtl-bug]] */
  out.latinNoDir = [];
  var cand = document.querySelectorAll('h1,h2,h3,p,li,span,a,button');
  for (var y = 0; y < cand.length; y++) {
    var el2 = cand[y];
    if (!vis(el2) || el2.children.length) { continue; }
    var tx = el2.textContent.trim();
    if (!/[A-Za-z]{2,}/.test(tx) || !/[؀-ۿ]/.test(tx)) { continue; }
    if (el2.closest('[dir="ltr"]')) { continue; }
    out.latinNoDir.push(tag(el2) + ' « ' + tx.slice(0, 46));
    if (out.latinNoDir.length >= 6) { break; }
  }

  return JSON.stringify(out);
})();
