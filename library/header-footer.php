<?php
/**
 * ============================================================================
 * LUVIT · الهيدر والفوتر بلا Elementor Pro
 * ============================================================================
 * WPCode snippet (PHP, Run Everywhere).
 * 🔴 مولَّد من library/header.html و library/footer.html · لا تعدّله بالإيد.
 *    المصدر هو ملفّا الـHTML، وهاد الملف بينبني منهن بـscratchpad/build-hf.mjs
 * ============================================================================
 */

/* ==========================================================================
   ليش هالملف موجود
   ==========================================================================
   الهيدر والفوتر كانوا بـ**Theme Builder**، وهي ميزة **Elementor Pro**.
   وElementor Pro عنّا ماشية بلا ترخيص (Activator)، يعني **ما بتاخد ولا
   ترقيع أمني** · وووردفانس أشّر على 4.2.1 بـ**CVSS 9.8 · حرجة** بـ٦ أيلول.

   ── والقياس اللي خلّى النقل آمناً ───────────────────────────────────
   قبل أي لمسة انقاس التالي على الموقع الحيّ:

     · **إلمنتور مستعمل بتلات مستندات بس** (الرئيسية ٤٠ · هيدر ٧٩ · فوتر ١٨١)
       ونوع الويدجت المستعمل **واحد: `html`** · **صفر ويدجت من Pro**.
     · `post-79.css` و`post-181.css` **كلهن أصفار** · كل هامش وحشوة
       `0px`. يعني حاويات إلمنتور **ما بتضيف ولا بكسل**، والـHTML تبعنا
       بيعمل كل الشغل.
     · **صفر كلاس إلمنتور** بـ`header.html` و`footer.html`.
     · و`tokens.css` فيها ٦ ذكر لكلمة elementor **كلهن جوّا تعليقات**،
       و`motion.js` صفر. يعني ستايلنا ما بيعتمد على ماركب إلمنتور.

   ⤷ فالنقل **مش إعادة بناء** · هو طبع نفس الـHTML من مكان تاني.

   ── وكيف القالب بيتصرّف ─────────────────────────────────────────────
   `hello-elementor/footer.php` بيقول حرفياً:

     if ( ! function_exists( 'elementor_theme_do_location' )
          || ! elementor_theme_do_location( 'footer' ) ) {
         if ( hello_elementor_display_header_footer() ) { ... }
     }

   يعني بلا Pro بيرجع لهيدر وفوتر القالب الافتراضيين · ولهيك بنكتم
   `hello_elementor_header_footer` **قبل** ما نطبع تبعنا. بلا الكتمة
   بيطلع هيدران.

   ⚠️ **والترتيب مقصود:** التوب بار بينطبع على `wp_body_open` بأولوية ١٠
      (`woo.php`)، فهيدرنا على **٢٠** عشان يقعد تحته زي ما كان بالضبط.
      والفوتر على `wp_footer` بأولوية **٥** عشان يسبق سكربتات الإضافات.

   ⚠️ **وحارس الطبع المزدوج** `static $done` · لو انتنده الخطّاف مرتين
      (قالب غريب · استدعاء يدوي) ما بيطلع هيدران.
   ========================================================================== */

/* القالب ما بيطبع هيدره وفوتره الافتراضيين · إحنا بنطبع تبعنا */
add_filter( 'hello_elementor_header_footer', '__return_false' );

function luvit_hf_header_html() {
	return <<<'LUVIT_HF_END'
<a class="luvit-skip" href="#main">تخطّي إلى المحتوى</a>

<header class="luvit-nav" id="luvit-nav">
  <div class="luvit-nav__bar">
    <span class="luvit-nav__drop" aria-hidden="true"></span>

    <a class="luvit-nav__brand" href="/" aria-label="Luv it! Jordan"><img class="luvit-nav__logo" src="https://plasmajo.com/wp-content/uploads/2026/08/luvit-logo.png" alt="Luv it! Jordan" width="417" height="220" decoding="async"></a>

    <nav class="luvit-nav__links" aria-label="التنقل الرئيسي">
      <a class="luvit-nav__link" href="/">الرئيسية</a>
      <a class="luvit-nav__link" href="/products">المتجر</a>
      <a class="luvit-nav__link" href="/routines">الروتينات</a>
      <a class="luvit-nav__link" href="/journal">المقالات</a>
      <a class="luvit-nav__link" href="/about">من نحن</a>
    </nav>

    <div class="luvit-nav__actions">
      <a class="luvit-nav__icon-btn luvit-nav__icon-btn--wide" href="/wishlist" aria-label="المفضّلة">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"
             stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M12 20.3 4.6 13a4.7 4.7 0 0 1 0-6.7 4.7 4.7 0 0 1 6.7 0l.7.7.7-.7a4.7 4.7 0 0 1 6.7 0 4.7 4.7 0 0 1 0 6.7z"/>
        </svg>
        <span class="luvit-nav__count" id="luvit-wish-count" hidden>0</span>
      </a>

      <a class="luvit-nav__icon-btn luvit-nav__icon-btn--wide" href="/my-account" aria-label="حسابي">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"
             stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <circle cx="12" cy="8.2" r="3.6"/>
          <path d="M4.8 20.2a7.2 7.2 0 0 1 14.4 0"/>
        </svg>
      </a>

      <a class="luvit-nav__icon-btn" href="/cart" aria-label="سلة التسوّق">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"
             stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
          <path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>
        </svg>
        <span class="luvit-nav__count" id="luvit-cart-count">0</span>
      </a>

      <button class="luvit-nav__icon-btn luvit-nav__toggle" type="button"
              aria-label="فتح القائمة" aria-expanded="false" aria-controls="luvit-drawer">
        <span class="luvit-nav__burger" aria-hidden="true"><span></span><span></span><span></span></span>
      </button>
    </div>
  </div>
</header>

<div class="luvit-drawer" id="luvit-drawer" role="dialog" aria-modal="true"
     aria-label="قائمة التنقل" aria-hidden="true">
  <div class="luvit-drawer__water" aria-hidden="true"></div>

  <nav class="luvit-drawer__panel" aria-label="قائمة الجوال">
    <a class="luvit-drawer__link" href="/">الرئيسية</a>
    <a class="luvit-drawer__link" href="/products">المتجر</a>
    <a class="luvit-drawer__link" href="/routines">الروتينات</a>
    <a class="luvit-drawer__link" href="/journal">المقالات</a>
    <a class="luvit-drawer__link" href="/quiz">اختبار نوع البشرة</a>
    <a class="luvit-drawer__link" href="/about">من نحن</a>

    <div class="luvit-drawer__sep" role="presentation"></div>

    <a class="luvit-drawer__link luvit-drawer__small" href="/my-account">حسابي</a>
    <a class="luvit-drawer__link luvit-drawer__small" href="/wishlist">المفضّلة</a>
    <a class="luvit-drawer__link luvit-drawer__small" href="/track">تتبّع طلبي</a>
    <a class="luvit-drawer__link luvit-drawer__small" href="/shipping">الشحن والتوصيل</a>
    <a class="luvit-drawer__link luvit-drawer__small" href="/faq">الأسئلة الشائعة</a>
    <a class="luvit-drawer__link luvit-drawer__small" href="/contact">تواصلي معنا</a>
  </nav>
</div>

<nav class="luvit-dock" aria-label="التنقل السريع">
  <a class="luvit-dock__item" href="/">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"
         stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/>
    </svg>
    <span>الرئيسية</span>
  </a>

  <a class="luvit-dock__item" href="/products">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"
         stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><path d="M3 6h18"/>
    </svg>
    <span>المتجر</span>
  </a>

  <a class="luvit-dock__item" href="/routines">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"
         stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M12 3s6 6.5 6 10.5A6 6 0 0 1 6 13.5C6 9.5 12 3 12 3z"/>
    </svg>
    <span>الروتينات</span>
  </a>

  <a class="luvit-dock__item" href="/cart">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"
         stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <circle cx="9" cy="20" r="1.4"/><circle cx="18" cy="20" r="1.4"/>
      <path d="M2 3h3l2.6 12.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.6L21 7H6"/>
    </svg>
    <span>السلة</span>
  </a>
</nav>
LUVIT_HF_END;
}

function luvit_hf_footer_html() {
	return <<<'LUVIT_HF_END'
<!--
  ============================================================================
  LUVIT · سكشن 13 من ١٣ · الفوتر
  ============================================================================
  مولّد من library/home-preview.html · لا تعدّل هون، عدّل بالمعاينة وأعد التوليد.

  كيف بينركّب:
  1. Elementor ← اسحب ويدجت HTML جوّا كونتينر لحاله
  2. الصق كل اللي تحت
  3. اختار الكونتينر (مش الويدجت) ← Advanced ← Attributes، واكتب:
       data-nav-bg|dark
     ⚠ الفاصل خط عامودي | مش يساوي =
  CSS ID  : ما بده
  4. Update، وبعدها LiteSpeed ← Purge All، وافحص بنافذة تصفّح خفي

  ⚠ بيتركّب بـTheme Builder ← Footer مش بالصفحة
  ✅ روابط السوشال حقيقية · إنستغرام وفيسبوك (١ أيلول)
     ⚠ أيقونة واتساب انشالت لحد ما يوصل رقمها · وتيك توك ما في حساب
  ============================================================================
-->

<footer class="luvit-footer luvit-cut-top" data-nav-bg="dark">
  <div class="luvit-footer__inner">

    <div>
      <p class="luvit-footer__brand">
        <img src="https://plasmajo.com/wp-content/uploads/2026/08/luvit-logo.png"
             alt="Luv it!" width="132" height="52" loading="lazy" decoding="async">
      </p>
      <p class="luvit-footer__tag">
        عناية بالبشرة مبنية على حاجتك، ومرافقة حقيقية قبل الطلب وبعده.
        بشرتك بدها حب.
      </p>
      <div class="luvit-footer__social">
        <a href="https://www.instagram.com/luvit.skin.jordan/" target="_blank" rel="noopener" aria-label="إنستغرام">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1"/></svg>
        </a>
        <a href="https://www.facebook.com/luvitjordan" target="_blank" rel="noopener" aria-label="فيسبوك">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
        </a>
      </div>
    </div>

    <div>
      <p class="luvit-footer__h">تسوّقي</p>
      <ul class="luvit-footer__list">
        <li><a href="/products">كل المنتجات</a></li>
        <li><a href="/routines">الروتينات</a></li>
        <li><a href="/products#packages">البكجات</a></li>
        <li><a href="/quiz">اختبار نوع البشرة</a></li>
      </ul>
    </div>

    <div>
      <p class="luvit-footer__h">مساعدة</p>
      <ul class="luvit-footer__list">
        <li><a href="/#how">كيف تطلبي</a></li>
        <li><a href="/track">تتبّع طلبي</a></li>
        <li><a href="/faq">الأسئلة الشائعة</a></li>
          <li><a href="/journal">المقالات</a></li>
        <li><a href="/contact">تواصلي معنا</a></li>
        <li><a href="/returns">سياسة الاستبدال</a></li>
            <li><a href="/shipping">الشحن والتوصيل</a></li>
            <li><a href="/privacy">سياسة الخصوصية</a></li>
            <li><a href="/terms">الشروط والأحكام</a></li>
      </ul>
    </div>

  </div>

  <a class="luvit-footer__partner" href="/affiliate-registration">
    <span class="luvit-footer__partner-mark" aria-hidden="true">
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M20.5 7.5 12 3 3.5 7.5 12 12z"/><path d="M3.5 12 12 16.5 20.5 12"/><path d="M3.5 16.5 12 21l8.5-4.5"/></svg>
    </span>
    <span class="luvit-footer__partner-copy">
      <b class="luvit-footer__partner-title">صيري من شريكات نجاحنا</b>
      <span class="luvit-footer__partner-sub">كودك الخاص ورابطك، وصفحة إلك بتوريك كل طلب أجا منك.</span>
    </span>
    <span class="luvit-footer__partner-go">سجّلي</span>
  </a>

  <div class="luvit-footer__bar">
    <span>© 2026 Luv it Jordan · جميع الحقوق محفوظة</span>
    <span class="luvit-footer__pay">
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><rect x="2" y="6" width="20" height="13" rx="2"/><path d="M2 10h20"/></svg>
      الدفع عند الاستلام
    </span>
  </div>
</footer>
LUVIT_HF_END;
}

add_action( 'wp_body_open', function () {
	static $done = false;
	if ( $done ) {
		return;
	}
	$done = true;
	echo luvit_hf_header_html();
}, 20 );

add_action( 'wp_footer', function () {
	static $done = false;
	if ( $done ) {
		return;
	}
	$done = true;
	echo luvit_hf_footer_html();
}, 5 );
