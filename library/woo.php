/**
 * LUV IT · the wording on the place-order button.
 *
 * Ryan, 21 Aug: «غير نص الزر».
 *
 * The button read «تقديم طلب» · WooCommerce's literal Arabic for "Place Order".
 * Correct, and empty: it names no commitment, and every other line on the page
 * addresses a woman while this one is neutral filler. It is also the last thing
 * she reads before paying, which is where "no card needed" belongs.
 *
 * MEASURED before writing this, so the msgid is not a guess:
 *   wp.i18n.getLocaleData('woocommerce')["Place Order"] === ["تقديم طلب"]
 * No context prefix. A _x() string would have shown as "ctx\u0004Place Order".
 *
 * WHY THIS HOOK AND NOT THE OBVIOUS ONES, all three tried and measured:
 *
 *   gettext filter        · never fires. The checkout is React and its strings
 *                           are translated in the browser, not in PHP.
 *   wp.i18n.setLocaleData · ran at script #32, WooCommerce printed its own
 *                           translation table between #32 and #85, and
 *                           overwrote us before anything rendered.
 *   the same, re-applied
 *   on DOMContentLoaded   · the table then held our string, and the button
 *                           still said «تقديم طلب». WooCommerce reads the
 *                           label when its bundle EXECUTES, which is before
 *                           DOMContentLoaded fires. Too late by design.
 *
 * So edit the table itself, before it is ever printed. No ordering games, no
 * handle names to guess, and nothing to fight at runtime.
 *
 * The key inside locale_data is normally the domain, but WordPress writes
 * "messages" for some files, so both are walked. And the string is replaced
 * only where it already exists: if a WooCommerce update renames the source
 * string, this quietly does nothing instead of injecting a stray entry.
 */
add_filter(
	'load_script_translations',
	function ( $translations, $file, $handle, $domain ) {

		if ( 'woocommerce' !== $domain || empty( $translations ) ) {
			return $translations;
		}

		$data = json_decode( $translations, true );
		if ( ! is_array( $data ) || empty( $data['locale_data'] ) ) {
			return $translations;
		}

		$replacements = array(
			'Place Order' => 'أكّدي الطلب · الدفع عند الاستلام',

			/* 21 Aug. WooCommerce says "estimated" on the cart because the address
			   is not confirmed yet, and in a normal store that is honest: the rate
			   could still change. It cannot here. One flat rate covers the whole
			   country (shipping zone id 1, location country:JO, flat_rate), there
			   is no tax, and payment is cash on delivery. The number shown IS the
			   number she pays, so calling it an estimate only invites doubt.
			   🔴 Revisit the day a second shipping zone or a tax rate exists. */
			'Estimated total' => 'الإجمالي',
		);

		$changed = false;
		foreach ( $data['locale_data'] as $key => $messages ) {
			if ( ! is_array( $messages ) ) {
				continue;
			}
			foreach ( $replacements as $msgid => $translation ) {
				if ( isset( $messages[ $msgid ] ) ) {
					$data['locale_data'][ $key ][ $msgid ] = array( $translation );
					$changed = true;
				}
			}
		}

		return $changed ? wp_json_encode( $data ) : $translations;
	},
	10,
	4
);

/**
 * LUV IT · رمز الدينار.
 *
 * ريّان، ١ أيلول: «غيّره».
 *
 * ووكومرس بيطبع «د.ا» للدينار الأردني، وكل كوبي الموقع مكتوب «د.أ»
 * (الشحن · الإرجاع · البكجات · التشكيلة). فالزبونة بتشوف رمزين
 * مختلفين لنفس العملة بنفس الصفحة.
 *
 * والفرق مش إملائياً بس · تناقض بسيط زي هاد بيقرا إهمالاً على صفحة
 * فيها تسعير.
 *
 * ⚠️ وبينطبق على JOD وحدها · أي عملة تانية بتضل زي ما هي.
 */
add_filter( 'woocommerce_currency_symbol', function ( $symbol, $currency ) {
	return 'JOD' === $currency ? 'د.أ' : $symbol;
}, 10, 2 );

/**
 * LUV IT · تبويب «التنزيلات» بصفحة الحساب.
 *
 * ريّان، ١ أيلول · بعد ما شافه بالقائمة.
 *
 * ووكومرس بيحط تبويب Downloads للملفات الرقمية (كتب · كورسات · تراخيص).
 * وإحنا **منتجاتنا فيزيائية كلها** · فالتبويب بيفتح على صفحة بتقول
 * «ما في تنزيلات» ولا مرة بتتغيّر.
 *
 * وريّان اقترح نحط مكانه برنامج ولاء · وهاد بالخطة أصلاً (مرجع
 * beautyboxjo: نقاط · إحالات · مستويات). **بس التبويب ما بينحط قبل
 * ما يكون وراه شي** · تبويب بيفتح على فاضي أسوأ من غيابه.
 */
add_filter( 'woocommerce_account_menu_items', function ( $items ) {
	unset( $items['downloads'] );

	/* «قطراتك» بينحط **قبل** تفاصيل الحساب · مش بالآخر، عشان يقرا كميزة
	   لا كإعداد. والترتيب بينبنى بحلقة لأن PHP ما بتدعم إدخالاً بمكان. */
	$out = array();
	foreach ( $items as $key => $label ) {
		if ( 'edit-account' === $key ) {
			$out['drops'] = 'قطراتك';
		}
		$out[ $key ] = $label;
	}
	return $out;
}, 20 );


/**
 * LUV IT · نقطة نهاية «قطراتك».
 *
 * ريّان، ١ أيلول: «منبدّل ومنبني البنية · الموقع ما تم إطلاقه أصلاً».
 * فالتبويب بينبنى هلأ والمحتوى بيتعبّى لما يجهز البرنامج.
 *
 * 🔴 وفخّ نقاط النهاية بووكومرس: بلا `flush_rewrite_rules` بترجّع **404**.
 *    والمسح غالي، فبينعمل **مرة وحدة** ومحروس بخيار.
 *    ⚠️ لو غيّرت اسم النقطة، **بدّل رقم النسخة** بالخيار تحت وإلا
 *       بيضل الرابط القديم شغّالاً والجديد ٤٠٤.
 */
add_action( 'init', function () {
	add_rewrite_endpoint( 'drops', EP_ROOT | EP_PAGES );

	if ( '1' !== get_option( 'luvit_drops_flushed' ) ) {
		flush_rewrite_rules();
		update_option( 'luvit_drops_flushed', '1' );
	}
} );

add_action( 'woocommerce_account_drops_endpoint', function () {
	echo '<div class="luvit-drops">'
		. '<h2 class="luvit-drops__title">قطراتك</h2>'
		. '<p class="luvit-drops__sub">كل طلبية بتجمّعلك قطرات · وشو بتعمل فيهن منقولك أول ما يجهز البرنامج.</p>'
		. '<p class="luvit-drops__soon">البرنامج قيد التجهيز · وأول ما يشتغل بتلاقي رصيدك هون.</p>'
		. '</div>';
} );

/* ══════════════════════════════════════════════════════════════════════
   نصوص ووكومرس بصيغة الموقع · انضافت ٢ أيلول
   ══════════════════════════════════════════════════════════════════════
   ترجمة ووكومرس العربية بتخاطب **بالمذكّر**، وكوبي الموقع كله بيخاطب
   الزبونة بالمؤنث · فبنص الصفحة بتتغيّر الصيغة فجأة:

     صفحة تتبّع الطلب · نصّنا: «اكتبي رقم الطلب والإيميل اللي طلبتِ فيه»
                        وتحته: «فضلًا **أدخل** رقم طلبك ... **وأضغط** زر»

   وأسوأ من الصيغة إن الجملة **مكسورة** بالترجمة الرسمية:
   «وأضغط زر لتتبعه "تتبع الطلب" لعرض حالته» · ترتيب كلمات مش عربي.

   ⚠️ وليش `gettext` بيشتغل هون مع إن التعليق فوق بيقول إنه **ما بيفوت**:
      اللي فوق عن **الشيك أوت** وهو React بيترجم بالمتصفّح. وصفحتا
      `/track/` و`/my-account/` قوالب PHP كلاسيكية · فالفلتر بيمسكهن.
      (وانفحص بعد التركيب لا انفترض.)

   🔴 والمطابقة على **الإنجليزي الأصلي** لا على الترجمة · الترجمة بتتغيّر
      بين نسخة ونسخة والأصل ثابت. والنطاق محصور بـwoocommerce.
   🔴 وولا معلومة جديدة · النصّ الجديد بيقول نفس اللي بيقوله الأصل.
   ══════════════════════════════════════════════════════════════════════ */
add_filter(
	'gettext',
	function ( $translated, $text, $domain ) {
		if ( 'woocommerce' !== $domain ) {
			return $translated;
		}

		static $map = null;
		if ( null === $map ) {
			$map = array(

				/* صفحة تتبّع الطلب · الفقرة التمهيدية فوق الفورم.
				   الأصل بيقول: اكتبي رقم الطلب، اضغطي الزر، ورقم الطلب
				   موجود بالإيصال وبإيميل التأكيد. ولا معلومة زيادة. */
				'To track your order please enter your Order ID in the box below and press the "Track" button. This was given to you on your receipt and in the confirmation email you should have received.'
					=> 'رقم الطلب بيطلعلك بصفحة تأكيد الطلب وبيوصلك بإيميل التأكيد كمان.',

				/* لوحة الحساب · نفس الشي، مؤنث وبلا «الخاص بك» */
				/* الصيغة الحقيقية بالقالب · الوسم **جوّا** المفتاح */
				'From your account dashboard you can view your <a href="%1$s">recent orders</a>, manage your <a href="%2$s">shipping and billing addresses</a>, and <a href="%3$s">edit your password and account details</a>.'
					=> 'من لوحة حسابك بتقدري تشوفي <a href="%1$s">طلباتك الأخيرة</a>، وتظبّطي <a href="%2$s">عناوين الشحن والفاتورة</a>، و<a href="%3$s">تعدّلي كلمة السر وبيانات حسابك</a>.',

				'From your account dashboard you can view your <a href="%1$s">recent orders</a>, manage your <a href="%2$s">billing address</a>, and <a href="%3$s">edit your password and account details</a>.'
					=> 'من لوحة حسابك بتقدري تشوفي <a href="%1$s">طلباتك الأخيرة</a>، وتظبّطي <a href="%2$s">عنوان الفاتورة</a>، و<a href="%3$s">تعدّلي كلمة السر وبيانات حسابك</a>.',

				/* جملة التحية · انتقلت لـaccount.php بأولوية 21 · «اطلعي» كانت بتنقرا
				   «اطلعي برّا» (ريّان ٢ أيلول) وصارت «تسجيل الخروج» هناك. */

				/* أزرار وحقول بتظهر بنفس الصفحة */
				'Track'        => 'تتبّع الطلب',
				'Order ID'     => 'رقم الطلب',
				'Billing email' => 'الإيميل اللي طلبتِ فيه',

				/* رسائل الخطأ · كانت بالمذكّر كمان */
				'Please enter a valid order ID'   => 'اكتبي رقم طلب صحيح',

				/* النصّ داخل الخانات · كان مذكّراً («ستجده» · «الذي استخدمته») */
				'Found in your order confirmation email.'
					=> 'بتلاقيه برسالة تأكيد الطلب.',
				'Email you used during checkout.'
					=> 'الإيميل اللي استعملتيه وقت الطلب.',
				'Please enter a valid email address' => 'اكتبي إيميل صحيح',
			);
		}

		if ( isset( $map[ $text ] ) ) {
			return $map[ $text ];
		}

		return $translated;
	},
	20,
	3
);

/**
 * نفس الشي للنصوص اللي إلها سياق (`_x`).
 *
 * ⚠️ ووكومرس بيستعمل `gettext_with_context` لأشياء زي عناوين الأعمدة ·
 *    الفلتر الأول **ما بيمسكها**، وهاد بيخلّي نصف الصفحة متغيّر ونصفها لأ.
 */
add_filter(
	'gettext_with_context',
	function ( $translated, $text, $context, $domain ) {
		if ( 'woocommerce' !== $domain ) {
			return $translated;
		}
		$map = array(
			'Order ID' => 'رقم الطلب',
		);
		return isset( $map[ $text ] ) ? $map[ $text ] : $translated;
	},
	20,
	4
);

/* ═════════════════════════════════════════════════
   ١٢ · تعريب إضافة Power Coupons · ٣ أيلول
   ═════════════════════════════════════════════════
   ريّان: «قبل الإطلاق لازم يكون فيه كوبونات كثيرة · والكوبونات مهمة كثير
   باستراتيجية البيع» · فالإضافة بتضل (درج كوبونات للزبونة بالسلة والشيك أوت)
   بس نصوصها إنجليزية. ستة نصوص انعرّبوا من إعداداتها (Text Customization)،
   والباقي (رسائل النجاح والخطأ وأزرار الدرج) بيمرّ من __() بنطاق الإضافة،
   فبيتعرّب هون. المطابقة حرفية على الإنجليزي كما بملفات الإضافة 1.0.6.  */
add_filter( 'gettext', function ( $translated, $text, $domain ) {
	if ( 'power-coupons' !== $domain && 'power-coupons-for-woocommerce' !== $domain ) {
		return $translated;
	}
	static $map = array(
		'Coupon applied successfully!'                     => 'انطبّق الكوبون · الخصم صار بالمجموع.',
		'Coupon code copied!'                              => 'انسخ الكود.',
		'Coupon removed.'                                  => 'انشال الكوبون.',
		'This coupon is already applied.'                  => 'هالكوبون مطبّق أصلاً.',
		'Applying...'                                      => 'لحظة…',
		'Removing...'                                      => 'لحظة…',
		'Apply Coupon'                                     => 'طبّقي الكوبون',
		'Copy Code'                                        => 'انسخي الكود',
		'Remove'                                           => 'شيلي',
		'View Details'                                     => 'التفاصيل',
		'Available Coupons'                                => 'الكوبونات المتاحة',
		'View Available Coupons'                           => 'شوفي الكوبونات المتاحة',
		'No coupons available at this time.'               => 'ما في كوبونات هلأ.',
		'Loading coupons...'                               => 'منجيب الكوبونات…',
		'Failed to apply coupon.'                          => 'ما انطبّق الكوبون · جرّبي مرة تانية.',
		'Failed to apply coupon. Please try again.'        => 'ما انطبّق الكوبون · جرّبي مرة تانية.',
		'Failed to remove coupon.'                         => 'ما انشال الكوبون · جرّبي مرة تانية.',
		'Failed to remove coupon. Please try again.'       => 'ما انشال الكوبون · جرّبي مرة تانية.',
		'Failed to load coupons. Please try again.'        => 'ما قدرنا نجيب الكوبونات · جرّبي مرة تانية.',
		'Connection error.'                                => 'انقطع الاتصال · جرّبي مرة تانية.',
		'Connection error. Please try again.'              => 'انقطع الاتصال · جرّبي مرة تانية.',
		'Sorry, something went wrong. Please try again.'   => 'صار خطأ · جرّبي مرة تانية.',
		'Applied'                                          => 'انطبّق',
	);
	if ( isset( $map[ $text ] ) ) {
		return $map[ $text ];
	}
	if ( 0 === strpos( $text, 'This coupon cannot be applied' ) ) {
		return 'هالكوبون ما بينطبّق على سلّتك الحالية.';
	}
	if ( 0 === strpos( $text, 'Connection error. Please check' ) ) {
		return 'انقطع الاتصال · تأكّدي من الإنترنت وجرّبي مرة تانية.';
	}
	return $translated;
}, 20, 3 );

/* ═════════════════════════════════════════════════
   ١٣ · صفحة المنتج المفرد · مرساة الأرضية وشريط الوعد · ٣ أيلول
   ═════════════════════════════════════════════════
   تقرير الفحص: الصفحة كانت **بلا طبقة تصميم** (معرض وتبويبات وسعر
   افتراضيّو ووكومرس · وصفر قاعدة إلها بـtokens.css) · وريّان وافق على
   بنائها. الستايل كله بقسم 5.55 بـtokens.css · وهون شغلتان بالماركب
   ما بينعملوا بالـCSS:

   ١ · **مرساة أرضية المي** · الأرضية معرّفة مرة وحدة بقسم 5.16 على
       `body:has(.luvit-shop-root)` · فبدل ما نعيد كتابة ٦٠ سطر تدرّجات
       لصفحة المنتج، منحقن نفس المرساة. سبان فاضي بلا أثر بصري.
   ٢ · **شريط الوعد** · موجود بالمتجر والشحن والاستبدال والخصوصية،
       وصفحة المنتج كانت الوحيدة بلاه رغم إنها أقرب صفحة للشراء.
       الأرقام: التوصيل من ووكومرس (flat_rate 2.50) والصياغة كلمة ريّان
       ٣ أيلول: «من يوم ليومين بدينارين ونص ومجاني مع الروتين».
   ⚠️ الخطافان من ووكومرس نفسه (`woocommerce_before_single_product` و
      `woocommerce_before_main_content`) · وبيشتغلوا بالقالب الحالي
      Hello Elementor. ولو انتغيّر القالب بينختفي الشريط بهدوء ولا بيوقع شي. */
add_action( 'woocommerce_before_single_product', function () {
	echo '<span class="luvit-shop-root" aria-hidden="true"></span>';
} );

add_action( 'woocommerce_before_main_content', function () {
	if ( ! function_exists( 'is_product' ) || ! is_product() ) {
		return;
	}
	$items = array(
		array( '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2.5" y="5.5" width="19" height="13" rx="2.5"/><path d="M2.5 10h19"/><circle cx="17.5" cy="14.5" r="1.2"/></svg>', 'الدفع عند الاستلام' ),
		array( '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2.5 6.5h11v9h-11z"/><path d="M13.5 9.5h4l3 3v3h-7z"/><circle cx="6.5" cy="17.5" r="1.6"/><circle cx="17" cy="17.5" r="1.6"/></svg>', 'التوصيل من يوم ليومين' ),
		array( '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="9" width="18" height="11" rx="2"/><path d="M3 13h18M12 9v11"/><path d="M12 9S9.5 4.5 7.5 5.5 9 9 12 9zM12 9s2.5-4.5 4.5-3.5S15 9 12 9z"/></svg>', 'مجاني مع أي روتين' ),
	);
	echo '<div class="luvit-promise luvit-promise--product">';
	foreach ( $items as $it ) {
		echo '<span class="luvit-promise__item">' . $it[0] . ' ' . esc_html( $it[1] ) . '</span>';
	}
	echo '</div>';
}, 5 );


/* ==========================================================================
   ١٤ · صفحات الشركاء · حاوية واحدة تحمل `data-nav-bg`   (٣ أيلول)
   --------------------------------------------------------------------------
   ريّان مرتين بنفس الرسالة: «واتاكد من انه النافبار كمان بتنعكس الوانه
   عحسب الخلفيه زي ماحنا عاملين بباقي الموقع» · و«واتاكد انه الناف بار
   كمان داينامك عحسب الخلفيه».

   🔴 والسبب مقروء من كودنا لا مخمَّن: `luvitNavTheme()` بـmotion.js
      بتوقف من أولها لو ما لقيت ولا عنصر:
        var sections = document.querySelectorAll('[data-nav-bg]');
        if (!sections.length) return;
      وصفحتا الشركاء مولَّدتان من شورتكود الإضافة، فما فيهن ولا سمة ·
      يعني النافبار **ما بيستلم أي إشارة** وبيضل على حالته الابتدائية.

   ⤷ فمنلفّ مخرَج الشورتكود بحاوية وحدة تحمل السمة. وهاي بتحلّ اتنين
     بضربة: النافبار بيصير ديناميكياً، وبينعطينا حاوية نعلّق عليها
     التخطيط بدل ما نستهدف `body` نفسها.

   ⚠️ و`light` لأنّ جلد اللوحة أرضيته ضباب فاتح · التايل الغامق الوحيد
      فيها جوّا الصفحة لا تحت النافبار. لو انقلبت الأرضية يوماً لغامق،
      هالسطر هو المكان الوحيد اللي بينتغيّر.

   ⚠️ والاستهداف بمعرَّف الصفحة لأن الشورتكود بينطبع بـ`the_content` ·
      والمعرَّفان مكتوبان بالتوثيق وبالـCSS كمان:
        480 = Affiliate Dashboard    · /affiliates/
        481 = Affiliate Registration · /affiliate-registration/
   ========================================================================== */
/* ==========================================================================
   LUVIT_AFFILIATE_HEAD · رأس صفحتَي الشركاء · ٣ أيلول
   ==========================================================================
   ريّان: «واتاكد انه في كل صفحه من الموقع فيه تصميم للراس تبعها زي تبعه
   الشحن». وصفحتا الشركاء الوحيدتان اللي ما بينفع نضيف لهن الرأس بملف
   سكشن، لأن محتواهن **كله** مطبوع من شورتكود الإضافة بـ`the_content`
   وما في كونتينر إلمنتور نلصق فيه.

   ⤷ فالرأس بينطبع من هون **بنفس ماركب الطبقة (ب) بالحرف**: نفس الكلاسات
     ونفس الترتيب ونفس الموجة · فبيورث طابع الماء من
     `.band-mist.luvit-page-top` تلقائياً بلا ولا سطر CSS جديد.

   🔴 وفيل الموجة `#FFFFFF` **مقيس لا مفترض**: أرضية `.luvit-affiliate`
      شفافة و`body` تبع الصفحة `rgb(255, 255, 255)` · وقاعدة الموجات
      بتقول الفيل لازم يطابق اللي تحت بالضبط وإلا بيطلع شكل أبيض عايم.

   ⚠️ والاسم: ريّان طلب «اسم جذاب واحلى بدل ال affiliate». اللي هون
      **وصف مش علامة**: «لوحتك» و«صيري من شركاء نجاحنا» · والثانية
      كلماته هو حرفياً من رابط الفوتر، فالزبونة اللي بتضغط الرابط بتنزل
      على صفحة عنوانها نفس الجملة. وخانة الاسم التجاري لساها مفتوحة إله.
   ========================================================================== */
add_filter( 'the_content', function ( $content ) {
	if ( ! is_page( array( 480, 481 ) ) || ! in_the_loop() || ! is_main_query() ) {
		return $content;
	}

	$is_reg = is_page( 481 );

	$crumb   = $is_reg ? 'شركاء نجاحنا' : 'لوحتك';
	$eyebrow = $is_reg ? 'Partners' : 'Partner dashboard';
	$title   = $is_reg ? 'صيري من شركاء نجاحنا' : 'لوحتك';
	$sub     = $is_reg
		? 'كودك الخاص ورابطك، وصفحة إلك بتوريك كل طلب أجا منك.'
		: 'كل طلب إجا من كودك، وكم صار إلك · بالتفصيل.';

	/* ── الخيط · ثلاث محطات · صفحة الانضمام وحدها ── */
	$flow = '';
	if ( $is_reg ) {
		$steps = array(
			array( '١', 'كودك',  'كود باسمك بتعطيه لدايرتك' ),
			array( '٢', 'رابطك', 'رابط بيعرّف إن الطلب أجا منك' ),
			array( '٣', 'لوحتك', 'صفحة بتوريك طلباتك وزبوناتك' ),
		);
		/* 🔴 role="list" إلزامي · `.rt-flow` عليها `list-style: none`،
		   وسفاري مع VoiceOver بتشيل دلالة القائمة معها. */
		$flow = '<ol class="rt-flow" role="list" data-luvit="stagger">';
		foreach ( $steps as $s ) {
			$flow .= '<li class="rt-flow__item">'
				. '<span class="rt-flow__dot">' . esc_html( $s[0] ) . '</span>'
				. '<span class="rt-flow__label">' . esc_html( $s[1] ) . '</span>'
				. '<span class="rt-flow__note">' . esc_html( $s[2] ) . '</span>'
				. '</li>';
		}
		$flow .= '</ol>';
		$flow .= '<div class="luvit-section__foot">'
			. '<a class="luvit-btn luvit-btn--arrow" href="#partner-form">سجّلي طلبك</a>'
			. '</div>';
	}

	/* ── الشريحة · فاضية بتنتظر على صفحة الانضمام، وباسمها باللوحة ──
	   🔴 والكود **ما بينطبع هون بقصد**: الإضافة بتطبعه أصلاً على بعد
	      ~100px تحت بـ`.wcu-coupon-title`، ونسخة تانية بتضمن الانحراف
	      لو غيّرته من لوحة الكوبونات. فالشريحة بتحمل اسمها · حقيقي،
	      شخصي، وما بينكتب بأي مكان تاني بالصفحة. */
	$chip = '';
	if ( $is_reg ) {
		$chip = '<div class="pt-chip">'
			. '<span class="pt-chip__label">كودك الخاص</span>'
			. '<span class="pt-chip__slot" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i></span>'
			. '<span class="pt-chip__note">بينولد أول ما تسجّلي</span>'
			. '</div>';
	} else {
		$u    = wp_get_current_user();
		$name = '';
		if ( $u && $u->ID ) {
			$name = trim( $u->first_name ) !== '' ? $u->first_name : $u->display_name;
		}
		$chip = '<div class="pt-chip">'
			. '<span class="pt-chip__label">أهلاً فيكِ</span>';
		if ( $name !== '' ) {
			$chip .= '<span class="pt-chip__code">' . esc_html( $name ) . '</span>';
		}
		$chip .= '<span class="pt-chip__note">كودك ورابطك تحت · وكل طلب فيهم بينعدّ إلك</span>'
			. '</div>';
	}

	/* ── الدوائر · قطرة وحدة بماء ساكن مشوفة من فوق ── */
	$rings = '<svg class="pt-rings" viewBox="0 0 400 400" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false">';
	foreach ( array( 34, 66, 104, 148, 197 ) as $i => $r ) {
		$rings .= '<circle cx="200" cy="200" r="' . (int) $r . '" style="--i:' . (int) $i . '"></circle>';
	}
	$rings .= '</svg>';

	$mod = $is_reg ? 'pt-head--join' : 'pt-head--desk';

	$head  = '<section class="luvit-section luvit-section--dark luvit-page-top pt-head ' . $mod . '"';
	$head .= ' data-nav-bg="dark" id="page-head">';
	$head .= '<span class="pt-head__caustic" aria-hidden="true"></span>';
	$head .= '<div class="luvit-section__inner"><div class="pt-grid">';
	$head .= '<div class="luvit-section__head luvit-section__head--start" data-luvit="reveal">';
	$head .= '<nav aria-label="مسار التنقّل">';
	$head .= '<a href="' . esc_url( home_url( '/' ) ) . '">الرئيسية</a>';
	$head .= ' <span aria-hidden="true">›</span> ';
	$head .= '<span aria-current="page">' . esc_html( $crumb ) . '</span>';
	$head .= '</nav>';
	$head .= '<p class="luvit-section__eyebrow">' . esc_html( $eyebrow ) . '</p>';
	$head .= '<h1 class="luvit-section__title">' . esc_html( $title ) . '</h1>';
	$head .= '<p class="luvit-section__sub">' . esc_html( $sub ) . '</p>';
	$head .= $flow;
	$head .= '</div>';
	$head .= '<div class="pt-mark">' . $rings . $chip . '</div>';
	$head .= '</div></div></section>';

	/* 🔴 الموجة غامق-لفاتح · بدها **الفيل وحده**: أبيض لأن اللي
	   تحتها `.luvit-affiliate` على ورق أبيض، و`background` inline بلون
	   قاع التدرّج ظنّاً إنه بيسدّ خطاً قاطعاً · والقياس بعد النشر رجّع
	   `backgroundColor: rgba(0, 0, 0, 0)` لأن `.luvit-wave:not(.seq-blend)`
	   بتكتب `background: transparent !important` **بقصد** (موثّق سطر ٢٧٥٥)
	   عشان تدهس الخلفيات الـinline المكتوبة بموجات قديمة. والآلية أصلاً
	   ما بدها خلفية: الموجة بتسحب حالها `-70px` فوق السكشن الغامق،
	   و`--wave-fill` هو **لون اللي تحت** وهو طالع فوق. فالسمة انشالت ·
	   كود ميت بيوهم إنه شغّال أسوأ من ولا كود.
	   */
	$head .= '<div class="luvit-wave" style="--wave-fill:#FFFFFF" aria-hidden="true"></div>';

	/* `id` على الحاوية عشان زرّ «سجّلي طلبك» يلاقي وجهته · الفورم نفسه
	   من الإضافة وما بنقدر نحقن فيه سمة. */
	return $head . '<div class="luvit-affiliate" id="partner-form" data-nav-bg="light">' . $content . '</div>';
}, 20 );

/* ==========================================================================
   LUVIT_404 · صفحة «ما لقيناها» · ٣ أيلول
   ==========================================================================
   المقيس قبل الشغل: `/this-slug-does-not-exist/` بترجّع `h1` نصّه
   `The page can't be found.` · **إنجليزي من قالب Hello Elementor**،
   بلا رأس وبلا تصميم وبلا ولا رابط يرجّع الزائرة لمكان مفيد. وهي صفحة
   بيوصلها زوار فعليون: رابط قديم، حرف ناقص، لينك منسوخ ناقص.

   ⤷ فبناخذ العرض كله من `template_redirect` ومنطبع سكشناً واحداً
     بمفردات الموقع نفسها: الماء العميق + أشعة + فقاعات، وتحته الروابط
     اللي بتلزم فعلاً. وبعده `get_footer()` فالفوتر بيقصّ جوّا السكشن
     الغامق **بنفس آلية سكشن الـCTA** (الاثنان `luvit-deep`)، فما في
     خطّ فاصل ولا شكل عايم.

   🔴 و`status_header( 404 )` بتضل · الصفحة تصميمها تغيّر لا حالتها.
      محرّكات البحث لازم تضل تشوف 404 حقيقية.

   ⚠️ والأولوية **99 بقصد**: إضافات إعادة التوجيه (رانك ماث فيها موديول
      Redirections) بتشتغل على نفس الخطاف، ولو سبقناها بترجع الروابط
      القديمة تطلع 404 بدل ما تتحوّل لوجهتها. منخلّيهم يشتغلوا أول.

   ⚠️ ولو انعمل يوماً قالب 404 بـElementor Theme Builder، هالمعالج بيغلبه ·
      وقتها احذف هالكتلة بدل ما تتصارع الاتنين.
   ========================================================================== */
add_action( 'template_redirect', function () {
	if ( ! is_404() ) {
		return;
	}

	status_header( 404 );
	nocache_headers();

	get_header();

	$links = array(
		array( '/',          'الرئيسية',      true ),
		array( '/shop/',     'المتجر',        false ),
		array( '/routines/', 'الروتينات',     false ),
		array( '/track/',    'تتبّعي طلبك',   false ),
		array( '/contact/',  'تواصلي معنا',   false ),
	);

	$foot = '';
	foreach ( $links as $l ) {
		$cls   = $l[2] ? 'luvit-btn luvit-btn--arrow' : 'luvit-btn luvit-btn--ghost luvit-btn--on-dark';
		$foot .= '<a class="' . $cls . '" href="' . esc_url( home_url( $l[0] ) ) . '">' . esc_html( $l[1] ) . '</a>';
	}

	echo '<section class="luvit-section luvit-section--dark luvit-deep luvit-page-top"'
		. ' data-nav-bg="dark" data-luvit-bubbles="10" id="page-head">'
		. '<span class="luvit-deep__rays" aria-hidden="true"></span>'
		. '<div class="luvit-section__inner">'
		. '<div class="luvit-section__head" data-luvit="reveal">'
		. '<p class="luvit-section__eyebrow">404</p>'
		. '<h1 class="luvit-section__title">ما لقينا هالصفحة</h1>'
		. '<p class="luvit-section__sub">'
		. 'يمكن الرابط قديم، أو ناقصه حرف · وهاي الطرق اللي بتوصّلك بسرعة.'
		. '</p>'
		. '<div class="luvit-section__foot">' . $foot . '</div>'
		. '</div></div></section>';

	get_footer();
	exit;
}, 99 );
