/**
 * LUV IT · the wording on the place-order button.
 *
 * Ryan, 21 Aug: «غير نص الزر».
 *
 * The button read «تقديم طلب» — WooCommerce's literal Arabic for "Place Order".
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
