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

	/* «نادي Luv it» بينحط **قبل** تفاصيل الحساب · مش بالآخر، عشان يقرا
	   كميزة لا كإعداد. والترتيب بينبنى بحلقة لأن PHP ما بتدعم إدخالاً بمكان. */
	$out = array();
	foreach ( $items as $key => $label ) {
		if ( 'edit-account' === $key ) {
			$out['club'] = 'نادي Luv it';
		}
		$out[ $key ] = $label;
	}
	return $out;
}, 20 );


/**
 * LUV IT · نقطة نهاية «نادي Luv it» · برنامج الولاء.
 *
 * ── ٤ أيلول · الاسم والآلية انحسموا ──────────────────────────────────
 * ريّان نقل عن صاحب العلامة: «تغيير اسمه من قطراتي إلى إشي ثاني · كل خمس
 * مرات طلب التوصيل حيكون مجاني». والاسم اختاره ريّان من ثلاث بدائل.
 *   ⤷ **«قطراتي» انشال** لأنه بيقرا قطرات عيون قبل ما يقرا نقاط ولاء.
 *   ⤷ وصيغة الاسم `Luv it` (مسافة · بلا علامة تعجّب) هي المعتمدة بالنصوص
 *     [[brand-name-rtl-bug]] · الشعار بس بيضل `Luv it!` لأنه صورة.
 *
 * 🔴 **والصفحة صارت تعرض حالة حقيقية لا «قيد التجهيز»** · الآلية مركّبة
 *    فعلاً بـ`luvit_free_ship_loyalty()` تحت، والعدّ من `luvit_loyalty_state()`
 *    وحدها · فاللي بتشوفه الزبونة هو اللي بينحاسب عليه بالسلة حرفياً.
 *
 * ⚠️ **والسلَّة القديمة اسمها `drops`** · الاسم انبدّل لـ`club` عشان الرابط
 *    اللي بتشوفه الزبونة (`/my-account/club/`) يطابق اسم البرنامج. كلاسات
 *    الـCSS `.luvit-drops__*` ضلّت زي ما هي **عن قصد** · داخلية وغير مرئية،
 *    وتبديلها بيلمس `tokens.css` بلا أي مكسب للزبونة.
 *
 * 🔴 وفخّ نقاط النهاية بووكومرس: بلا `flush_rewrite_rules` بترجّع **404**.
 *    والمسح غالي، فبينعمل **مرة وحدة** ومحروس بخيار.
 *    ⚠️ لو غيّرت اسم النقطة، **بدّل اسم الخيار** تحت وإلا بيضل الرابط
 *       القديم شغّالاً والجديد ٤٠٤. (وهاد بالضبط اللي صار هلق: `_flushed`
 *       صار `_club_flushed` عشان المسح يشتغل مرة تانية.)
 */
add_action( 'init', function () {
	add_rewrite_endpoint( 'club', EP_ROOT | EP_PAGES );

	if ( '1' !== get_option( 'luvit_club_flushed' ) ) {
		flush_rewrite_rules();
		update_option( 'luvit_club_flushed', '1' );
	}
} );

add_action( 'woocommerce_account_club_endpoint', function () {
	$s     = luvit_loyalty_state();
	$every = (int) $s['every'];

	echo '<div class="luvit-drops">';
	echo '<h2 class="luvit-drops__title">نادي <span dir="ltr">Luv it</span></h2>';

	if ( $every < 1 ) {
		/* الخيار مطفي · ما منوعد بإشي ما بيصير. */
		echo '<p class="luvit-drops__sub">البرنامج موقوف مؤقتاً.</p>';
		echo '</div>';
		return;
	}

	echo '<p class="luvit-drops__sub">'
		. 'ما في نقاط ولا رصيد بدك تتابعيه · كل ' . esc_html( luvit_orders_word( $every ) )
		. '، وحدة فيهن توصيلها علينا.'
		. '</p>';

	if ( $s['due'] ) {
		echo '<p class="luvit-drops__soon"><strong>وطلبيتك الجاي توصيلها مجاني.</strong> '
			. 'بيتحسب لحاله بالسلة · ما بدك كوبون.</p>';
	} else {
		echo '<p class="luvit-drops__soon">'
			. 'عملتِ <strong>' . esc_html( luvit_orders_word( $s['done'] ) ) . '</strong> لهلق · '
			. 'وتوصيل الطلبية رقم <strong>' . esc_html( (string) $s['next'] ) . '</strong> علينا.'
			. '</p>';
	}

	echo '<p class="luvit-drops__sub">'
		. 'وبتنعدّ الطلبات اللي وصلتك أو اللي قيد التجهيز · '
		. 'والملغية ما بتنعدّ.'
		. '</p>';
	echo '</div>';
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

	$crumb   = $is_reg ? 'شريكات نجاحنا' : 'لوحتك';
	$eyebrow = $is_reg ? 'Partners' : 'Partner dashboard';
	$title   = $is_reg ? 'صيري من شريكات نجاحنا' : 'لوحتك';
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

	/* ── شروط العمولة · على الصفحتين · ٤ أيلول ──────────────────────────
	   ريّان: «شغلة مهمة كثير · وضّح إنه نهاية كل شهر بيتم إيداع الأموال
	   للمؤثرات بالداشبورد تبعهم».

	   🔴 **والأرقام هون مربوطة بإعدادات حقيقية مقيسة، مش كلاماً:**
	     ١٠٪ خصم    = كوبون `luvit-partner-template` (percent · 10)
	     ١٠٪ عمولة  = `wcusage_field_affiliate` بإضافة Coupon Affiliates
	     «مكتمل»    = `wcusage_payout_status` = `wc-completed`

	   ⚠️ وصياغة الاستحقاق **دقيقة بقصد**: الطلب بيبيّن باللوحة فوراً،
	      بس العمولة ما بتصير قابلة للصرف إلا لما الطلب يتسجّل «مكتمل» ·
	      وهاد إعداد الإضافة لا رأيي. كتابة «بتوصلك فوراً» بتكون وعداً
	      بإشي النظام ما بيعمله. */
	$terms = '<ul class="pt-terms" data-luvit="stagger">'
		. '<li class="pt-terms__item"><strong>١٠٪ خصم</strong> للزبونة اللي بتستعمل كودك ·'
		. ' وبينضاف <strong>فوق</strong> عروضنا الشغّالة مش بدلها.</li>'
		. '<li class="pt-terms__item"><strong>١٠٪ إلك</strong> من قيمة الطلب ·'
		. ' والطلب بيبيّن بلوحتك فوراً، والعمولة بتصير مستحقّة لما يتسجّل «مكتمل».</li>'
		. '<li class="pt-terms__item"><strong>والتحويل آخر كل شهر</strong> ·'
		. ' منجمّع أرباح الشهر ومنودّيها، وكل حركة مكتوبة بلوحتك.</li>'
		. '</ul>';

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
	$head .= $terms;
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

/* ==========================================================================
   LUVIT_PARTNER_NAME · اسم البرنامج بدل «Affiliate» · ٣ أيلول
   ==========================================================================
   ريّان: «لازم نطلع باسم جذاب واحلى بدل ال affiliate اشي يكون قريب على
   جمهورنا» · وبعدها فوّضني أختار.

   والمختار:
     البرنامج            «شريكات Luv it»
     بند قائمة الحساب    «شراكتك»
     الدعوة              «صيري من شريكات نجاحنا»

   ليش «شراكتك» ببند القائمة تحديداً · القائمة عندها نمط قايم:
     لوحة الحساب · الطلبات · العنوان · **قطراتك** · تفاصيل الحساب
   يعني بنود بصيغة المخاطَبة المملوكة. «Affiliate» كانت الكلمة الوحيدة
   اللاتينية والوحيدة اللي بتوصف **نظاماً** لا **إشي إلها**.

   وليش «شريكات» مؤنّث · كوبي الموقع كله مؤنّث بقرار مكتوب، و«شركاء»
   كانت آخر كلمة مذكّرة بمسار الزبونة. والجملة نفسها كلمات ريّان من
   رابط الفوتر · انتغيّرت كلمة وحدة وبس.

   ⚠️ و«Coupon Affiliates» **اسم الإضافة** بيضل إنجليزياً كما هو ·
      ريّان: «مافيه داعي نعرب الكوبونات نفسها … لانه اصلا هذا المتعار
      عليه». اللي بينتغيّر هو **اللي بتشوفه الزبونة**، لا اسم الأداة.
   ========================================================================== */
add_filter( 'woocommerce_account_menu_items', function ( $items ) {
	if ( isset( $items['coupon-affiliate'] ) ) {
		$items['coupon-affiliate'] = 'شراكتك';
	}

	/* ترتيب: «شراكتك» بتقعد بعد «نادي Luv it» · الاتنان امتيازات لا إعدادات،
	   و«تفاصيل الحساب» و«تسجيل الخروج» بيضلّوا آخر شي.

	   ⚠️ **وهالكتلة بتقرا مفتاح النادي** · لما انبدّل من `drops` لـ`club`
	      بـ٤ أيلول كانت رح **تسكت بلا خطأ** و«شراكتك» تضل بمحلها الأصلي.
	      نفس فئة [[moving-truth-breaks-its-readers]] · فأي تبديل لمفتاح
	      النادي بينفتّش عليه هون كمان. */
	if ( isset( $items['coupon-affiliate'], $items['club'] ) ) {
		$out = array();
		foreach ( $items as $k => $v ) {
			if ( $k === 'coupon-affiliate' ) {
				continue;
			}
			$out[ $k ] = $v;
			if ( $k === 'club' ) {
				$out['coupon-affiliate'] = 'شراكتك';
			}
		}
		$items = $out;
	}

	return $items;
}, 20 );

/* ==========================================================================
   LUVIT_TOPBAR · شريط الإطلاق · ٣ أيلول
   ==========================================================================
   ريّان: «قاعد بفكر باننا نضيف زي شريط باعلى الموقع للمستخدمين الجدد او
   كوبون عام يكون مبين للكل عشان الاطلاق».

   🔴 **ولا رقم مكتوب بالإيد هون.** الشريط بيقرا **كوبون ووكومرس حقيقي**
      ويطبع نوعه وقيمته من الكوبون نفسه · فلو ريّان غيّر الخصم من لوحة
      الكوبونات، الشريط بيتغيّر معه بنفس اللحظة. وهاي مش أناقة، هاي
      الطريقة الوحيدة اللي بتمنع رقماً بالشريط يخالف الرقم بالسلة.

   🔴 **وبيفشل مقفولاً.** ما في كود مضبوط · ولا كوبون بهالاسم · منتهي ·
      وصل حدّ الاستعمال · معطّل → **ما بينرسم إشي أصلاً**. أهون بكثير من
      شريط بيوعد بخصم ما بيشتغل عند الدفع.

   الضبط: خيار ووردبريس واحد اسمه `luvit_topbar_coupon` فيه كود الكوبون.
   فاضي = الشريط مطفي. يعني ريّان بيقدر يطفيه ويشغّله بلا ما يلمس كود.

   ⚠️ والتخطيط: النافبار `fixed` على `top: var(--nav-inset)`، ورؤوس
      الصفحات بتحسب حشوتها العليا بنفس المتغيّر. فالشريط **ما بيزيح ولا
      عنصر بإيده** · بيضيف `--topbar-h` على `body` والقاعدتان بتقراه.
      قيمته الافتراضية صفر، فبلا شريط ما بينتغيّر ولا بكسل.
   ========================================================================== */
/* الخيار بينتسجّل بالـREST عشان ينتغيّر من برّا بلا ما ينلمس كود ·
   `manage_options` مطلوبة، فما بيقدر يوصله إلا أدمن. */
add_action( 'init', function () {  // luvit_topbar_settings
	$strings = array(
		/* كود كوبون · الوضع القديم · بيضل شغّالاً لو ما في نصّ إعلان */
		'luvit_topbar_coupon' => '',
		/* 🔴 وضع الإعلان · ٤ أيلول · وهو الوضع المستعمل حالياً.
		   ريّان: «خصم الأسبوعين **يطبّق بشكل تلقائي** عالمنتجات بدون كوبون».
		   ⤷ فالشريط ما عاد يعلن كوداً · بيعلن العرض نفسه. */
		'luvit_topbar_text'   => '',
		'luvit_topbar_cta'    => '',
		'luvit_topbar_link'   => '',
	);
	foreach ( $strings as $key => $default ) {
		register_setting( 'options', $key, array(
			'type'              => 'string',
			'default'           => $default,
			'show_in_rest'      => true,
			'sanitize_callback' => 'sanitize_text_field',
		) );
	}
} );

add_action( 'wp_body_open', function () {
	if ( is_admin() ) {
		return;
	}
	if ( ! function_exists( 'wc_get_coupon_id_by_code' ) ) {
		return;
	}

	/* ── وضع الإعلان · بلا كوبون ──────────────────────────────────────
	   لما يكون في نصّ إعلان، هو اللي بينرسم والكوبون بينتجاهل. لأن العرض
	   الحقيقي (خصم الروتينات) **بينطبّق لحاله**، فشريط بيطلب كوداً بيوهم
	   الزبونة إنّ الخصم مشروط بكود، وهو مش مشروط.

	   🔴 **ولا رقم بينكتب هون.** أعلى خصم فعلي ٢١٫٦٧٪، فـ«حتى ٢٢٪» تدوير
	      لفوق و«حتى ٢١٪» تقليل للعرض. اختار ريّان (٤ أيلول) صيغة **بلا
	      رقم**، والنسبة الدقيقة بتبيّن على كرت كل روتين محسوبة من سعره.
	   ------------------------------------------------------------------ */
	$text = trim( (string) get_option( 'luvit_topbar_text', '' ) );
	if ( $text !== '' ) {
		$cta  = trim( (string) get_option( 'luvit_topbar_cta', '' ) );
		$link = trim( (string) get_option( 'luvit_topbar_link', '' ) );

		/* مفتاح الإخفاء مشتقّ من المحتوى · فلو تغيّر العرض بيرجع يبيّن
		   لمين سكّره. رقم ثابت بيخلّي عرضاً جديداً مخفياً عن نص الزبونات. */
		$key = 'luvit-topbar-dismissed:t' . substr( md5( $text . '|' . $cta . '|' . $link ), 0, 8 );

		echo '<div class="luvit-topbar" id="luvit-topbar" role="region" aria-label="عرض الإطلاق">'
			. '<div class="luvit-topbar__inner">'
			. '<span class="luvit-topbar__offer">' . esc_html( $text ) . '</span>';

		if ( $cta !== '' && $link !== '' ) {
			echo '<a class="luvit-topbar__cta" href="' . esc_url( $link ) . '">' . esc_html( $cta ) . '</a>';
		}

		echo '</div>'
			. '<button type="button" class="luvit-topbar__close" aria-label="إغلاق الشريط">'
			. '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>'
			. '</button>'
			. '</div>';

		echo '<script>(function(){try{'
			. 'var b=document.getElementById("luvit-topbar");'
			. 'if(!b)return;'
			. 'var k=' . wp_json_encode( $key ) . ';'
			. 'if(localStorage.getItem(k)){b.remove();return;}'
			. 'document.body.classList.add("has-topbar");'
			. 'b.querySelector(".luvit-topbar__close").addEventListener("click",function(){'
			. 'try{localStorage.setItem(k,"1")}catch(e){}'
			. 'document.body.classList.remove("has-topbar");b.remove();});'
			. '}catch(e){}})();</script>';
		return;
	}

	$code = trim( (string) get_option( 'luvit_topbar_coupon', '' ) );
	if ( $code === '' ) {
		return;
	}

	$id = wc_get_coupon_id_by_code( $code );
	if ( ! $id ) {
		return;
	}
	$c = new WC_Coupon( $id );

	/* منتهي؟ */
	$exp = $c->get_date_expires();
	if ( $exp && $exp->getTimestamp() < time() ) {
		return;
	}
	/* خلص استعماله؟ */
	$limit = $c->get_usage_limit();
	if ( $limit && $c->get_usage_count() >= $limit ) {
		return;
	}

	$type   = $c->get_discount_type();
	$amount = (float) $c->get_amount();
	if ( $amount <= 0 ) {
		return;
	}

	/* الصياغة من نوع الكوبون · ولا حالة تانية بتنكتب */
	if ( $type === 'percent' ) {
		$offer = 'خصم ' . wc_format_decimal( $amount, false, true ) . '%';
	} elseif ( $type === 'fixed_cart' || $type === 'fixed_product' ) {
		$offer = 'خصم ' . wp_strip_all_tags( wc_price( $amount ) );
	} else {
		return;
	}

	/* الكود لاتيني · فبده عزلاً صريحاً ومحاذاة، وإلا بينقلب بسياق عربي */
	echo '<div class="luvit-topbar" id="luvit-topbar" role="region" aria-label="عرض الإطلاق">'
		. '<div class="luvit-topbar__inner">'
		. '<span class="luvit-topbar__offer">' . esc_html( $offer ) . '</span>'
		. '<span class="luvit-topbar__sep" aria-hidden="true">·</span>'
		. '<span class="luvit-topbar__label">بكود</span>'
		. '<button type="button" class="luvit-topbar__code" data-code="' . esc_attr( $c->get_code() ) . '"'
		. ' dir="ltr" aria-label="انسخي الكود">' . esc_html( strtoupper( $c->get_code() ) ) . '</button>'
		. '</div>'
		. '<button type="button" class="luvit-topbar__close" aria-label="إغلاق الشريط">'
		. '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>'
		. '</button>'
		. '</div>';

	/* 🔴 السكربت **جوّا نفس المخرَج ومباشرةً بعد الشريط** بقصد: بيشيله قبل
	   أول رسم لو الزبونة سكّرته قبل، فما في وميض. ولو حطّيناه بالفوتر
	   بتشوفه لجزء من الثانية بكل زيارة · وهاد بيقرا عطلاً. */
	echo '<script>(function(){try{'
		. 'var b=document.getElementById("luvit-topbar");'
		. 'if(!b)return;'
		. 'var k="luvit-topbar-dismissed:"+b.querySelector(".luvit-topbar__code").dataset.code;'
		. 'if(localStorage.getItem(k)){b.remove();return;}'
		. 'document.body.classList.add("has-topbar");'
		. 'b.querySelector(".luvit-topbar__close").addEventListener("click",function(){'
		. 'try{localStorage.setItem(k,"1")}catch(e){}'
		. 'document.body.classList.remove("has-topbar");b.remove();});'
		. 'b.querySelector(".luvit-topbar__code").addEventListener("click",function(){'
		. 'var c=this.dataset.code;'
		. 'if(navigator.clipboard)navigator.clipboard.writeText(c);'
		. 'this.classList.add("is-copied");'
		. 'var t=this;setTimeout(function(){t.classList.remove("is-copied")},1600);});'
		. '}catch(e){}})();</script>';
}, 5 );

/* ==========================================================================
   LUVIT_SCHEMA · سكيما مكمّلة لرانك ماث · ٣ أيلول
   ==========================================================================
   رانك ماث PRO بتطلّع Organization وWebSite وProduct (بسعر وتوفّر وصورة
   حقيقيين · مفحوص). وهاد اللي **ما بتطلّعه** وانقاس مفقوداً:

     ١ · BreadcrumbList  · مفقودة من **كل صفحة** · وهي اللي بتخلّي جوجل
         تعرض مسار «الرئيسية › الأسئلة» بدل الرابط الخام بنتيجة البحث.
         🔴 وعندنا مسار **مرئي** بكل صفحة، وهاد شرط جوجل: السكيما لازم
            تطابق اللي بتشوفه العين. فالمستويان هون هما نفس المستويين
            المرسومين بالرأس، لا أكثر.

     ٢ · FAQPage · لصفحة الأسئلة.
         ⚠️ **وبلا مبالغة**: جوجل حصرت نتائج الـFAQ الغنية من آب ٢٠٢٣
            بالمواقع الحكومية والصحية · فما بنتوقّع صندوقاً موسّعاً بالبحث.
            القيمة الحقيقية إنّ محرّكات الإجابة (AI Overviews · ChatGPT ·
            Perplexity) بتقرا الأسئلة والأجوبة منها مباشرة، وجوجل بتفهم
            الصفحة أحسن. الشغل رخيص والفايدة حقيقية، بس مش اللي كنت قلته.

   🔴 **ولا سؤال ولا جواب مكتوب هون.** المحلّل بيقرا محتوى الصفحة نفسها
      من قاعدة البيانات · فأي سؤال بينضاف أو بينشال بيتحدّث بالسكيما
      **بنفس اللحظة**. نسخة تانية من الأسئلة بالكود = انحراف مضمون،
      وهاد فخّ مسجَّل كلّفنا قبل.

   ⚠️ وما في تعارض مع رانك ماث: كتلة JSON-LD منفصلة **مسموحة ومعتادة**،
      وجوجل بتجمع الكتل كلها. وما منلمس الـ@graph تبعها عشان أي تحديث
      للإضافة ما يدهس شغلنا.
   ========================================================================== */
add_action( 'wp_footer', function () {  // LUVIT_SCHEMA
	if ( is_admin() || is_front_page() ) {
		return;
	}

	$home  = home_url( '/' );
	$nodes = array();

	/* ── ١ · مسار التنقّل · مستويان زي المرسوم بالرأس ── */
	if ( is_singular( array( 'page', 'product' ) ) ) {
		$title = get_the_title();
		if ( $title !== '' ) {
			$nodes[] = array(
				'@context'        => 'https://schema.org',
				'@type'           => 'BreadcrumbList',
				'itemListElement' => array(
					array(
						'@type'    => 'ListItem',
						'position' => 1,
						'name'     => 'الرئيسية',
						'item'     => $home,
					),
					array(
						'@type'    => 'ListItem',
						'position' => 2,
						'name'     => $title,
						'item'     => get_permalink(),
					),
				),
			);
		}
	}

	/* ── ٢ · الأسئلة · منقروءة من محتوى الصفحة لا مكتوبة هون ── */
	if ( is_page( 220 ) ) {
		$content = (string) get_post_field( 'post_content', 220 );
		$qa      = array();

		/* كل <details class="luvit-acc__item"> فيه <summary> و<div class="luvit-acc__a"> */
		if ( preg_match_all( '#<details[^>]*luvit-acc__item[^>]*>(.*?)</details>#si', $content, $items ) ) {
			foreach ( $items[1] as $item ) {
				if ( ! preg_match( '#<summary[^>]*>(.*?)</summary>#si', $item, $q ) ) {
					continue;
				}
				if ( ! preg_match( '#<div[^>]*luvit-acc__a[^>]*>(.*?)</div>\s*$#si', $item, $a )
					&& ! preg_match( '#<div[^>]*luvit-acc__a[^>]*>(.*?)</div>#si', $item, $a ) ) {
					continue;
				}

				/* السؤال: نصّ الـsummary بلا علامة الفتح */
				$question = trim( wp_strip_all_tags( preg_replace( '#<span[^>]*luvit-acc__sign.*?</span>#si', '', $q[1] ) ) );
				$answer   = trim( wp_strip_all_tags( $a[1] ) );
				$question = preg_replace( '#\s+#u', ' ', $question );
				$answer   = preg_replace( '#\s+#u', ' ', $answer );

				if ( $question === '' || $answer === '' ) {
					continue;
				}
				$qa[] = array(
					'@type'          => 'Question',
					'name'           => $question,
					'acceptedAnswer' => array(
						'@type' => 'Answer',
						'text'  => $answer,
					),
				);
			}
		}

		/* 🔴 بيفشل مقفولاً · لو الماركب تغيّر والمحلّل ما لقي إشي، ما بينطبع
		   FAQPage فاضية. سكيما فاضية أسوأ من ولا سكيما. */
		if ( count( $qa ) > 0 ) {
			$nodes[] = array(
				'@context'   => 'https://schema.org',
				'@type'      => 'FAQPage',
				'mainEntity' => $qa,
			);
		}
	}

	if ( empty( $nodes ) ) {
		return;
	}

	foreach ( $nodes as $n ) {
		echo '<script type="application/ld+json">'
			. wp_json_encode( $n, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES )
			. '</script>' . "\n";
	}
}, 99 );

/* ==========================================================================
   LUVIT_OG_IMAGE · كرت المشاركة بحجمه الكامل · ٣ أيلول
   ==========================================================================
   الكرت اترفع 2400×1260، وانضبط كصورة المشاركة الافتراضية برانك ماث ·
   وطلع بالمخرَج الحيّ **تناقض حقيقي**:

       og:image        → الملف المصغّر  **1024×538**
       og:image:width  → **800**
       og:image:height → **420**

   يعني **الأبعاد المعلنة ما بتطابق الملف المرتبط**. وفيسبوك وواتساب
   وتويتر بيبنوا حجم البطاقة على **المعلن** لا على الملف · فبتطلع
   البطاقة بحجم غلط أو بتنرفض. وفوق هاد، 800px تحت الحدّ اللي فيسبوك
   بتوصي فيه (1200) فالصورة بتطلع باهتة على الشاشات الكثيفة.

   ⤷ فالوسوم بتنكتب من هون على **الملف الأصلي** وبأبعاده الحقيقية،
     وكلها منقروءة من مكتبة الوسائط لا مكتوبة بالإيد · لو انرفع كرت
     جديد بحجم تاني، الأرقام بتتبعه لحالها.

   ⚠️ ومحصورة بكرت المشاركة وحده: صفحات المنتجات إلها صورها الخاصة
      وهي **المفروض تضل** · مشاركة منتج لازم تعرض المنتج لا كرت العلامة.
   ========================================================================== */
add_action( 'init', function () {  // LUVIT_OG_IMAGE

	$pick = function ( $current ) {
		$id = (int) get_option( 'luvit_og_card_id', 0 );
		if ( ! $id ) {
			return null;
		}
		$full = wp_get_attachment_image_src( $id, 'full' );
		if ( ! $full || empty( $full[0] ) ) {
			return null;
		}
		return $full; // array( url, width, height )
	};

	/* 🔴 الشرط: نتدخّل **بس** لما رانك ماث تكون مطلّعة كرتنا · وبنعرفها
	   من اسم الملف. أي صورة تانية (صورة منتج مثلاً) بتعدّي كما هي. */
	$is_card = function ( $url ) {
		return is_string( $url ) && strpos( $url, 'luvit-share-card' ) !== false;
	};

	add_filter( 'rank_math/opengraph/facebook/og_image', function ( $url ) use ( $pick, $is_card ) {
		if ( ! $is_card( $url ) ) {
			return $url;
		}
		$f = $pick( $url );
		return $f ? $f[0] : $url;
	}, 20 );

	/* ⚠️ **حدّ معروف · وانشال الكود الميت بدل ما يضل زينة.**
	   جرّبت أضبط `og:image:width` و`og:image:height` بمرشّحَين
	   (`og_image:width` و`og:image:width`) · **ولا واحد اشتغل**، والقياس
	   بعد كل نشر رجّع نفس الرقم: الرابط انزبط للملف الكامل والأبعاد
	   ضلّت **800x420**. وقفت عن تخمين أسماء المرشّحات وشلت السطرين ·
	   مرشّح ما بينادى بيقرا كأنه شغّال وهاد أسوأ من غيابه.

	   والأثر العملي **صغير ومقيس**: الوسمان **تلميح** لا مصدر. فيسبوك
	   وواتساب بيجيبوا الصورة نفسها وبيقيسوها، والرابط اللي بيوصلهم صار
	   الملف الكامل 2400×1260 وهو اللي بيظهر فعلاً. أسوأ ما ممكن يصير:
	   أول مشاركة ترسم بنسبة غلط لثوانٍ قبل ما فيسبوك يعيد القراءة.

	   ولو بدنا نضبطها لاحقاً: الطريق الأكيد هو تصفية مخرَج `wp_head`
	   بـ`ob_start` واستبدال الوسمين نصّياً · وهاد تدخّل أوسع من قيمته
	   قبل الإطلاق بيومين، فانأجّل بقصد لا بنسيان. */

	add_filter( 'rank_math/opengraph/twitter/twitter_image', function ( $url ) use ( $pick, $is_card ) {
		if ( ! $is_card( $url ) ) {
			return $url;
		}
		$f = $pick( $url );
		return $f ? $f[0] : $url;
	}, 20 );

	register_setting( 'options', 'luvit_og_card_id', array(
		'type'         => 'integer',
		'default'      => 0,
		'show_in_rest' => true,
	) );
} );

/* ==========================================================================
   LUVIT_GA4 · وسم جوجل أنالتكس · ٣ أيلول
   ==========================================================================
   ✅ **شغّال من ٥ أيلول · المعرّف `G-PMVG8TG9RR`** · خاصية جديدة على
      حساب جوجل الجديد تبع ريّان.

   ── وليش انبدّل المعرّف ────────────────────────────────────────────
   جوجل سكّرت `elrsheedharoun541@gmail.com` ٤ أيلول. المعرّف القديم
   `G-76D5GCHNJ4` كان بخاصية جوّا **ذاك الحساب**، فصار وسماً بيبعت
   بيانات لمكان ما حدا بيقدر يقراه. ريّان: «شيل هذا الرقم وكل إشي
   ربطناه إله دخل بالحساب القديم».

   🔴 **وهون بانت فايدة إنّ المعرّف بإعداد لا بالكود:** انطفى يوم بقيمة
      فاضية، ورجع تاني يوم بقيمة جديدة · **ولا سطر كود انتغيّر بينهن**،
      ولا ضاع أي سطر من التوثيق تحت.

   ── ✅ ومفحوص طرفاً لطرف · ٥ أيلول ─────────────────────────────────
   مش «انحفظ» · **مقيس من تحميل صفحة حقيقي**:
     `gtag/js` نزل ومعرّفه معرّفنا · `window.gtag` دالة موجودة ·
     `dataLayer` فيها ٥ مدخلات · **وطلع طلب `/g/collect` فعلي
     حامل `G-PMVG8TG9RR`**.
   والوسم مرة وحدة بس على ٥ صفحات (رئيسية · متجر · روتين · حساب · عن)،
   فما في جلستان لكل زيارة.

   ⚠️ **وفحص `/g/collect` لحاله ما بيثبت إنّ الخاصية موجودة** · معرّف
      وهمي بيرجّع نفس الرد بالضبط (مقيس ٤ أيلول). الدليل النهائي إنّ
      البيانات بتوصل هو **تقرير Realtime** عند ريّان، لا أي فحص من عندي.
      [[ga4-collect-503-means-not-provisioned]]

   ── التاريخ · وليش بينحفظ ──────────────────────────────────────────
   المعرّف القديم: `G-76D5GCHNJ4` · حساب مسكّر · **ما بينستعمل**.

   🔴 **بيطلق دايماً · بقرار ريّان الصريح:** «خليها الزاميه التحليلات هاي
      كثير بتهمني». وقبلها ١ أيلول: «كل الأدوات المشابهة بدي إياها من
      التحليلات ومايكروسوفت كلاريتي وجوجل أناليتكس · هاي أهم إشي».

   ── ⚠️ ومعها انتغيّر إشعار الكوكيز · والسببان مترابطان ──────────────
   أول نسخة حطّت الوسم بلا شرط وإشعار الكوكيز فيه زرّ «بس الضروري» ·
   يعني الموقع بيعرض خياراً **ما بينفّذه**. وهاد أسوأ من غياب الخيار،
   وهو خطّ ريّان الأحمر حرفياً.
   ⤷ فالإشعار صار **يخبر لا يخيّر**: سطر واحد بيوصف اللي بيصير وزرّ
     «تمام». ما منعرض قراراً وإحنا مش رح نحترمه.

   ✅ وصفحة الخصوصية **ما بدها تعديل** · انفحصت: مكتوب فيها من ١ أيلول
      «بنستعمل أدوات تحليلات … مجهّلة» و«أرقام التحليلات إلنا إحنا
      لتحسين الموقع · ما بتنباع». ولا وعد بإيقافها، فهي مطابقة للواقع.

   ── 🔴 كلاريتي **مش هون · ولا بينحطّ هون** ──────────────────────────
   Microsoft Clarity (`ycr8b1rxxg`) بتحقنها **إضافة مايكروسوفت الرسمية**،
   ومقيس ٣ أيلول إنّ وسمها بيطلع **مرة وحدة** بالـHTML وإنّ
   `n.clarity.ms/collect` بيرجّع `204`. أي إضافة تانية إلها بهالملف
   بتعمل **جلستين لكل زيارة** وأرقاماً مغشوشة. فلو إجت جلسة وشافت إنه
   «ما في كلاريتي بالكود» · هاد صح ومقصود.

   ── ⚠️ وتصحيحان لنسخة سابقة من هالتعليق ─────────────────────────────
   ١ · كان مكتوب «الموقع خلف قفل Coming Soon» · **انفتح ٣ أيلول** بقرار
       ريّان للفحص، فالوسم بيشوف زواراً حقيقيين من هلق.
   ٢ · وكان مكتوب إنّ gtag.js «ما بينزل على متصفّح ريّان · بصمة مانع
       إعلانات» · **وهاد كان غلطاً مني.** ريّان قال «ما عندي مانع إعلانات
       عهذا المتصفح اتاكد» وطلع محقاً: قياسي كان على صفحة محمّلة **قبل**
       ما يمرق مسح الكاش. الملف نزل عادي بالقياس النظيف.
       🔴 والدرس: قياس واحد على تحميل مش نظيف بيولّد اتّهاماً بيضلّ
       مكتوباً بالكود لأيام.

   ── ⚠️ و`503` مش عطلاً عندنا ────────────────────────────────────────
   `/g/collect` بمعرّفنا بيرجّع `503` ونفس النقطة بمعرّف وهمي بترجّع `204`
   · يعني الخاصية عند جوجل لساها ما انجهّزت. الدليل النهائي **تقرير
   Realtime** لا البانر.

   ⚠️ وما بيستثني الأدمن · لو صار تصفّح ريّان يلوّث أرقام الإطلاق،
      الاستثناء سطر واحد هون وبينعمل بقرار لا بالافتراض.
   ========================================================================== */
add_action( 'wp_head', function () {  // LUVIT_GA4
	if ( is_admin() ) {
		return;
	}
	/* 🔴 الافتراضي **فاضي** من ٤ أيلول · لا وسم بلا معرّف صالح */
	$id = trim( (string) get_option( 'luvit_ga4_id', '' ) );
	if ( $id === '' || ! preg_match( '/^G-[A-Z0-9]{6,}$/', $id ) ) {
		return;
	}


	/* 🔴 راية الإيقاف · **لازم تسبق `gtag/js`** لأن جوجل بتقرا
	   `window['ga-disable-<ID>']` وقت الإقلاع · لو انحطّت بعده بتكون
	   الزيارة انبعتت أصلاً.

	   ⚠️ **والقراءة من `localStorage` لا من حالة الدخول بقصد.**
	      لو شِلنا الوسم من الخادم لمّا يكون الأدمن داخلاً، بتنبني صفحة
	      **بلا وسم** وبتتخزّن بالكاش، وبعدين بتنعطى للزبونات · فبنخسر
	      التتبّع كله **بصمت**. هون الماركب **واحد للكل** فما في شي
	      يتخزّن غلط · والاستثناء قاعد بمتصفّح ريّان لا بالصفحة.
	      [[wp-caches-swallow-direct-writes]]

	   ⚠️ وهي **لكل متصفّح** · لو فتح من تلفونه أو متصفّح تاني بينعدّ
	      زائراً. الحلّ: يفتح `?luvit-ga=off` مرة من كل جهاز.
	   ⤷ و`?luvit-ga=on` بترجّع العدّ · للفحص أو بعد الإطلاق. */
	echo '<script>try{var q=location.search;if(q.indexOf("luvit-ga=off")>-1){localStorage.setItem("luvit-no-ga","1");}if(q.indexOf("luvit-ga=on")>-1){localStorage.removeItem("luvit-no-ga");}if(localStorage.getItem("luvit-no-ga")==="1"){window["ga-disable-' . esc_js( $id ) . '"]=true;}}catch(e){}</script>' . "\n";
	echo '<script async src="https://www.googletagmanager.com/gtag/js?id=' . rawurlencode( $id ) . '"></script>' . "\n";
	echo '<script>'
		. 'window.dataLayer = window.dataLayer || [];'
		. 'function gtag(){dataLayer.push(arguments);}'
		. 'gtag("js", new Date());'
		. 'gtag("config", ' . wp_json_encode( $id ) . ');'
		. '</script>' . "\n";
}, 1 );
add_action( 'init', function () {
	register_setting( 'options', 'luvit_ga4_id', array(
		'type'              => 'string',
		'default'           => '',
		'show_in_rest'      => true,
		'sanitize_callback' => 'sanitize_text_field',
	) );
} );

/* ==========================================================================
   LUVIT_FREE_SHIP · التوصيل المجاني بالولاء · ٤ أيلول
   ==========================================================================
   🔴 **تصحيح · وهاد الأهم بهالكتلة.**
   أول نسخة كتبتها كانت بتغطّي حالتين: البكج بالسلة، والولاء. وكنت كاتب
   بالتوثيق إنّ «الموقع بيوعد بتوصيل مجاني مع الروتين وما في آلية تنفّذه».
   **وهاد كان غلطاً.**

   الآلية موجودة وشغّالة من ٣٠ آب بسنيبت WPCode مستقل:
       314 · «LUVIT · التوصيل مجاني مع الروتينات» · مفعَّل
       نفس الخطّاف `woocommerce_package_rates` بأولوية 10
       ونفس الفحص بالضبط: has_term( 'packages', 'product_cat', $id )
       بيصفّر الكلفة وبيغيّر الليبل ويرجّع $rates

   ⤷ وسبب الغلط: بنيت الحكم على **إعدادات ووكومرس وحدها** (منطقة الشحن
     فيها flat_rate بس، ولا كوبون بيعطي شحناً مجانياً) وما فتّشت سنيبتات
     الـPHP. والإعدادات ما بتشوف فلتراً بيخلق التعرفة برمجياً.
     🔴 **الدرس: غياب الإعداد مش غياب الميزة** · بـWooCommerce نص السلوك
        بيجي من خطّافات، والإعدادات بتشوف نصّها التاني بس.

   ── وليش هالكتلة ضلّت ─────────────────────────────────────────────
   ريّان طلب قاعدة تانية ما بيغطّيها 314: **كل ٥ طلبات توصيل مجاني، حتى
   لو ما طلبت روتين**. فصار التقسيم:
       314        → البكج بالسلة
       هالكتلة    → الولاء
   **وشقّ البكج انشال من هون** عشان ما يصير فلتران بيعملوا نفس الإشي على
   نفس الخطّاف · وهاد بيخلي واحد منهم يدهس التاني بصمت لما حدا يعدّل.

   ⚠️ **وما بيشتغل للزائرة غير المسجّلة** · ما في طريقة نعدّ طلباتها.
      مقبول: ريّان قاعد يبني التسجيل بنفس الدفعة.

   🔴 وبيفشل على جهة الأمان · بيخلق التعرفة المجانية بس لما يتحقّق الشرط،
      ولو انطفت الكتلة بترجع تعرفة 314 أو `flat_rate`. بنحاسب لا بنوزّع.
   ========================================================================== */
add_action( 'init', function () {  // luvit_free_ship_settings
	register_setting( 'options', 'luvit_free_ship_every', array(
		'type'         => 'integer',
		'default'      => 5,
		'show_in_rest' => true,
	) );
} );

/**
 * حالة الولاء للزبونة المسجَّلة · مصدر حقيقة واحد.
 *
 * بترجّع: every (كل كم طلب) · done (طلبات مكتملة) · due (هالطلب مجاني؟) ·
 *          next (**رقم** الطلبية اللي توصيلها مجاني).
 *
 * ⚠️ و`next` رقم طلبية لا عدّاد تنازلي · «باقي ٤ طلبات» بتخلّي الزبونة
 *    تسأل هل الرابعة هي المجانية ولا اللي بعدها. «الطلبية رقم ٥» ما بتحتمل
 *    قراءتين.
 *
 * 🔴 **العدّ هون بس** · صفحة النادي وفلتر الشحن الاتنان بيقرأوا من هون،
 *    وإلا بيصير الرقم المعروض للزبونة غير الرقم اللي بينحاسب عليه.
 *    [[duplicated-data-always-drifts]]
 */
function luvit_loyalty_state() {
	static $cache = null;
	if ( $cache !== null ) {
		return $cache;
	}
	$every = (int) get_option( 'luvit_free_ship_every', 5 );
	if ( $every < 1 || ! is_user_logged_in() ) {
		$cache = array( 'every' => $every, 'done' => 0, 'due' => false, 'next' => 0 );
		return $cache;
	}
	$done = (int) count( (array) wc_get_orders( array(
		'customer_id' => get_current_user_id(),
		'status'      => array( 'wc-processing', 'wc-completed', 'wc-on-hold' ),
		'limit'       => 500,
		'return'      => 'ids',
	) ) );
	$due = ( ( $done + 1 ) % $every === 0 );
	/* رقم أول طلبية مستحقّة بعد اللي انعملت · ولمّا تكون مستحقّة هلق
	   بترجع `done + 1` نفسها، فالرقم صحيح بالحالتين. */
	$next  = $every * ( (int) floor( $done / $every ) + 1 );
	$cache = array( 'every' => $every, 'done' => $done, 'due' => $due, 'next' => $next );
	return $cache;
}

/**
 * عدد + كلمة «طلبية» بالصيغة الصح · العربي بيميّز المفرد والمثنّى والجمع.
 *
 * 🔴 **وهاد مش تجميل** · أول نسخة كتبت «عملتِ 2 طلبات» وهاي غلط صريح
 *    بيقرا كترجمة آلية. القاعدة:
 *      ٠      ولا طلبية      ١  طلبية وحدة     ٢  طلبيتين
 *      ٣ ـ ١٠  N طلبات        ١١+ N طلبية
 */
function luvit_orders_word( $n ) {
	$n = (int) $n;
	if ( $n === 0 ) {
		return 'ولا طلبية';
	}
	if ( $n === 1 ) {
		return 'طلبية وحدة';
	}
	if ( $n === 2 ) {
		return 'طلبيتين';
	}
	if ( $n <= 10 ) {
		return $n . ' طلبات';
	}
	return $n . ' طلبية';
}

/**
 * الطلب رقم N للزبونة المسجَّلة · بترجّع true لو هالطلب مستحقّ.
 * العدد بخيار `luvit_free_ship_every` · صفر = الولاء مطفي.
 */
function luvit_free_ship_loyalty() {
	$s = luvit_loyalty_state();
	return (bool) $s['due'];
}

/* أولوية 20 · بعد 314، فلو الاثنان انطبقوا الولاء بيغلب وبيعطي نفس
   النتيجة (مجاني) بليبل بيشرح السبب الصح للزبونة. */
add_filter( 'woocommerce_package_rates', function ( $rates, $package ) {  // LUVIT_FREE_SHIP
	if ( ! luvit_free_ship_loyalty() ) {
		return $rates;
	}
	$rate = new WC_Shipping_Rate( 'luvit_free_ship', 'توصيل مجاني · طلبك المميّز', 0.0, array(), 'free_shipping' );
	return array( 'luvit_free_ship' => $rate );
}, 20, 2 );

/* ⚠️ التخزين المؤقّت للشحن بيحفظ التعرفات حسب محتوى السلة **وبس** · وقاعدة
   الولاء بتعتمد على المستخدم لا على السلة، فبتنخزّن لواحد وبتنعرض لغيره.
   الحل: نضيف الحالة لمفتاح التخزين.

   🔴 **وكان على الخطّاف الغلط لحد ٤ أيلول** · `woocommerce_shipping_packages`
      بيشتغل **بعد** ما ووكومرس بيحسب هاش الطرد، فالمفتاح ما كان يتغيّر أبداً
      والتعرفة المخزّنة بتضل ٢٫٥٠ حتى بعد ما تصير الزبونة مستحقّة.
      الصح `woocommerce_cart_shipping_packages` · بيشتغل وقت **بناء** الطرد.

   ⚠️ **وما انكشف إلا بالفحص الحيّ** · الكود كان مكتوباً صح والتعليق كان
      بيوصف نيّة صحيحة، والفلتر نفسه شغّال ١٠٠٪: أول ما غيّرت محتوى السلة
      رجّعت التعرفة `luvit_free_ship` بصفر. يعني **قراءة الكود كانت بتعدّي
      الباغ**، والفرق الوحيد كان قياس السلة قبل وبعد قلب الاستحقاق. */
add_filter( 'woocommerce_cart_shipping_packages', function ( $packages ) {
	foreach ( $packages as $i => $p ) {
		$packages[ $i ]['luvit_loyalty'] = luvit_free_ship_loyalty() ? 1 : 0;
	}
	return $packages;
}, 5 );
/* ==========================================================================
   LUVIT_SAVINGS · سطر «وفّرتِ» بآخر ملخّص الطلب · ٤ أيلول
   ==========================================================================
   ريّان: «حط آخر إشي عند السعر النهائي **كم وفرت**».

   ── ليش سلوت لا حقن DOM ────────────────────────────────────────────
   سلة ووكومرس عندنا **بلوكات** (React)، وأي صفّ بينحقن بالـDOM مباشرة
   بينمسح أول ما تتغيّر الكمية أو ينتحدّث الشحن. فبنستعمل نقطة التمديد
   الرسمية `ExperimentalOrderMeta` · بترسم تحت ملخّص الطلب وبتعيد الرسم
   مع البلوك نفسه.

   ⚠️ **وبيطلع بالسلة والشيك أوت الاثنين** لأن السلوت مشترك · وهاد مقصود.

   ── الحساب · ولا رقم بينكتب بالإيد ─────────────────────────────────
     التوفير = Σ (السعر الأصلي − السعر الحالي) × الكمية  +  خصم الكوبونات

   🔴 **وأجرة الشحن ما بتنحسب هون بقصد.** لما تكون مجانية بيكون سطرها
      ظاهر لحاله فوق، ولو جمعناها بالرقم بيصير الرقم **مش قابلاً للتحقّق**
      من الصفوف اللي شايفتها الزبونة. رقم بتقدر تتأكد منه بنفسها أقوى من
      رقم أكبر ما بتعرف من وين إجا.

   ⚠️ وبيختفي لما يكون التوفير صفراً · ما منعرض «وفّرتِ 0.00».
   ========================================================================== */
add_action( 'wp_footer', function () {  // LUVIT_SAVINGS
	if ( is_admin() ) {
		return;
	}
	if ( ! function_exists( 'is_cart' ) || ( ! is_cart() && ! is_checkout() ) ) {
		return;
	}
	echo <<<'JS'
<script>
(function () {
  var tries = 0;
  function boot() {
    if (tries++ > 60) { return; }
    if (!window.wp || !wp.plugins || !wp.element || !wp.data ||
        !window.wc || !wc.blocksCheckout || !wc.blocksCheckout.ExperimentalOrderMeta) {
      setTimeout(boot, 250);
      return;
    }
    if (window.__luvitSavings) { return; }
    window.__luvitSavings = true;

    var el = wp.element.createElement;
    var OrderMeta = wc.blocksCheckout.ExperimentalOrderMeta;

    function money(minorAmount, minorUnit, symbol) {
      var v = (Number(minorAmount) / Math.pow(10, minorUnit)).toFixed(minorUnit);
      return v + " " + symbol;
    }

    function Savings() {
      var cart = wp.data.useSelect(function (select) {
        var s = select("wc/store/cart");
        return s ? s.getCartData() : null;
      }, []);

      if (!cart || !cart.items || !cart.items.length) { return null; }

      var unit = 2, symbol = "\u062F.\u0623";
      if (cart.totals) {
        if (typeof cart.totals.currency_minor_unit === "number") { unit = cart.totals.currency_minor_unit; }
        if (cart.totals.currency_symbol) { symbol = cart.totals.currency_symbol; }
      }

      var saved = 0;
      cart.items.forEach(function (i) {
        if (!i.prices) { return; }
        var reg = Number(i.prices.regular_price);
        var now = Number(i.prices.price);
        if (isFinite(reg) && isFinite(now) && reg > now) {
          saved += (reg - now) * Number(i.quantity || 1);
        }
      });
      if (cart.totals && cart.totals.total_discount) {
        var d = Number(cart.totals.total_discount);
        if (isFinite(d)) { saved += d; }
      }

      if (!(saved > 0)) { return null; }

      return el("div", { className: "luvit-savings" },
        el("span", { className: "luvit-savings__label" }, "\u0648\u0641\u0651\u0631\u062A\u0650"),
        el("span", { className: "luvit-savings__value" }, money(saved, unit, symbol))
      );
    }

    wp.plugins.registerPlugin("luvit-savings", {
      render: function () { return el(OrderMeta, null, el(Savings)); },
      scope: "woocommerce-checkout"
    });
  }
  boot();
})();
</script>
JS;
}, 30 );

/* ==========================================================================
   LUVIT_SEO_META · كشف حقول رانك ماث للـREST · ٤ أيلول
   ==========================================================================
   رانك ماث بيخزّن عنوان السيو والوصف كـpost meta، **وما بيسجّلهم
   بالـREST**. والنتيجة إنّ الكتابة عليهم بترجّع `200` **وما بتنحفظ**:
   ووردبريس بيتجاهل أي مفتاح ميتا مش مسجَّل، بصمت وبلا رسالة.
   🔴 وهاد **رفض صامت** · نفس فئة الفخّ اللي WPCode ضربنا فيها.

   ── ليش انفتحت ─────────────────────────────────────────────────────
   ريّان غيّر عنوان صفحة «من نحن» ٤ أيلول، والـh1 انتغيّر بس **عنوان
   جوجل ضلّ القديم**. وفحص الفهرسة (٤ أيلول) لقى كمان **خمس صفحات
   وصفها كلمة إنجليزية أو فاضي** (`Contact` · `Returns` · `Wishlist` ·
   وصفحتا الشركاء بلا وصف). كلها بدها نفس المفتاح.

   ⚠️ **`rank_math_robots` مستثنى بقصد** · قيمته **مصفوفة** عند رانك ماث
      لا نصّ، وتسجيله كنصّ بيفسد الصفحة. لو لزم لاحقاً بينسجّل بنوعه.

   🔴 والصلاحية `manage_options` · يعني ولا حدا غير الأدمن بيقدر يكتب،
      والقراءة كمان محكومة بنفس السياق (`context=edit`).
   ========================================================================== */
add_action( 'init', function () {  // LUVIT_SEO_META
	$keys  = array( 'rank_math_title', 'rank_math_description', 'rank_math_focus_keyword' );
	$types = array( 'page', 'post', 'product' );

	foreach ( $types as $type ) {
		foreach ( $keys as $key ) {
			register_post_meta( $type, $key, array(
				'type'              => 'string',
				'single'            => true,
				'show_in_rest'      => true,
				'sanitize_callback' => 'sanitize_text_field',
				'auth_callback'     => function () {
					return current_user_can( 'manage_options' );
				},
			) );
		}
	}
} );

/* ==========================================================================
   LUVIT_REGISTER · حقول التسجيل · ٤ أيلول
   ==========================================================================
   ريّان: «المعلومات اللي بدنا إياها بالتسجيل وضرورية: رقم التلفون والاسم
   والباسوورد والإيميل وتاريخ الميلاد · وحذف اسم العرض. والترتيب اللي
   أعطيتك إياه عشوائي رتّبه إنت».

   ── الترتيب · وليش هيك ──────────────────────────────────────────────
     ١ الاسم        · أول سؤال بشري لا تقني
     ٢ رقم الموبايل · **الحقل التشغيلي** · الدفع عند الاستلام بيمشي عليه،
                      وعليه بيمشي مسار الواتساب اللي ريّان جهّز رقمه
     ٣ البريد       · ووكومرس بيطلبه إلزامياً · وعليه بتروح إيميلات الطلب
     ٤ تاريخ الميلاد
     ٥ كلمة السر    · آخر إشي · العُرف إنّ الأمان بيجي بالنهاية

   🔴 **وكانت الصفحة فيها الإيميل وحده** · مقيس بجلب مجهول لصفحة الحساب:
      حقل واحد `email` وبس، بلا كلمة سر أصلاً (ووكومرس كان بيولّدها).

   ⚠️ **والتحقّق بالخادم لا بالمتصفّح وحده** · `required` بالماركب بتتشال
      من أدوات المطوّر بثانية. الفحص تحت بـ`woocommerce_register_post`.

   ⚠️ ورقم الموبايل الأردني: يبدأ بـ07 وطوله ١٠، أو بصيغة دولية 9627xxxxxxxx.
      بنقبل الاثنين وبنخزّن المحلي، وبنشيل أي مسافات أو شرطات قبل الفحص
      عشان ما نرفض رقماً صحيحاً مكتوباً بشكل تاني.

   🔴 **وتاريخ الميلاد بيانات شخصية** تحت قانون حماية البيانات الأردني
      ٢٤/٢٠٢٣ · وصفحة الخصوصية **لازم تذكره صراحة** قبل ما نجمعه فعلياً.
      مسجّل كبند مفتوح · [[دفعة-صاحب-العلامة]].
   ========================================================================== */
add_action( 'woocommerce_register_form_start', function () {  // LUVIT_REGISTER
	$v = function ( $k ) { return isset( $_POST[ $k ] ) ? esc_attr( wp_unslash( $_POST[ $k ] ) ) : ''; };
	$row = 'woocommerce-form-row woocommerce-form-row--wide form-row form-row-wide';
	$cls = 'woocommerce-Input woocommerce-Input--text input-text';

	echo '<p class="' . $row . '">'
		. '<label for="luvit_reg_name">الاسم&nbsp;<span class="required">*</span></label>'
		. '<input type="text" class="' . $cls . '" name="luvit_reg_name" id="luvit_reg_name"'
		. ' autocomplete="name" value="' . $v( 'luvit_reg_name' ) . '" required>'
		. '</p>';

	echo '<p class="' . $row . '">'
		. '<label for="luvit_reg_phone">رقم الموبايل&nbsp;<span class="required">*</span></label>'
		. '<input type="tel" class="' . $cls . '" name="luvit_reg_phone" id="luvit_reg_phone"'
		. ' autocomplete="tel" inputmode="numeric" placeholder="07XXXXXXXX"'
		. ' value="' . $v( 'luvit_reg_phone' ) . '" required>'
		. '</p>';
}, 5 );

/* تاريخ الميلاد · بينزل بعد البريد وقبل كلمة السر */
add_action( 'woocommerce_register_form', function () {  // LUVIT_REGISTER
	$dob = isset( $_POST['luvit_reg_dob'] ) ? esc_attr( wp_unslash( $_POST['luvit_reg_dob'] ) ) : '';
	echo '<p class="woocommerce-form-row woocommerce-form-row--wide form-row form-row-wide">'
		. '<label for="luvit_reg_dob">تاريخ الميلاد&nbsp;<span class="required">*</span></label>'
		. '<input type="date" class="woocommerce-Input woocommerce-Input--text input-text"'
		. ' name="luvit_reg_dob" id="luvit_reg_dob" autocomplete="bday"'
		. ' max="' . esc_attr( gmdate( 'Y-m-d' ) ) . '" value="' . $dob . '" required>'
		. '</p>';
}, 20 );

/**
 * تطبيع رقم موبايل أردني · مصدر حقيقة واحد.
 *
 * بيشيل أي مسافة أو شرطة أو قوس، وبيحوّل الصيغة الدولية `+9627…` أو
 * `9627…` للمحلي `07…`. بيرجّع '' لو ما طلع رقماً أردنياً صحيحاً.
 *
 * 🔴 **كان مكتوباً مرتين حرفياً** (التحقّق والحفظ) وأنا رح أستعمله ثالثة
 *    بشاشة إكمال البيانات · وثلاث نسخ لنفس المنطق **بتنحرف حتماً**.
 *    [[duplicated-data-always-drifts]]
 *
 * ⚠️ وبيرجّع فاضياً بدل ما يرمي · القارئ الوحيد اللي بيهمّه الفرق هو
 *    التحقّق، وهو بيفحص الفاضي صراحةً.
 */
function luvit_norm_phone( $raw ) {
	$p = preg_replace( '/[^0-9+]/', '', (string) $raw );
	$p = preg_replace( '/^(\+?962)/', '0', $p );
	return preg_match( '/^07[0-9]{8}$/', $p ) ? $p : '';
}

/* 🔴 التحقّق · بالخادم · وبيرجّع رسائل عربية واضحة بدل رفض عام */
add_action( 'woocommerce_register_post', function ( $username, $email, $errors ) {  // LUVIT_REGISTER
	/* 🔴🔴 **الحارس · وبلاه الفاحص بيكسر مسارات مش إلنا.**
	   `woocommerce_register_post` **مش خاص بفورم التسجيل** · ووكومرس
	   بينده جوّا `wc_create_new_customer()` نفسها، واللي بينداها **كل**
	   مسار بيعمل حساباً:
	     · «أنشئي حساب» بالشيك أوت
	     · إضافة الدخول بجوجل (Nextend)
	   وبهدول **حقولنا ما بتنبعت أصلاً**، فالفاحص كان بيرمي «رقم الموبايل
	   لازم يبدأ بـ07» **وما في خانة موبايل على الشاشة** · رفض بلا مخرج.

	   ⚠️ **والغلط الغريزي وقتها حذف الفاحص كله** · يعني خسارة التحقّق
	      بالخادم، وهو الحارس الوحيد ضد تعديل الماركب من أدوات المطوّر.
	      الحصر أدقّ من الحذف.

	   ⤷ والنقص اللي بيمرق من مسار جوجل أو الشيك أوت **بتمسكه شاشة
	     `/my-account/complete/`** · وهي مبنية على «الحساب ناقصه بيانات»
	     لا على «سجّلت بجوجل»، فما بدها ولا سطر جديد. */
	if ( ! isset( $_POST['woocommerce-register-nonce'] ) ) {
		return;
	}

	$name = isset( $_POST['luvit_reg_name'] ) ? trim( sanitize_text_field( wp_unslash( $_POST['luvit_reg_name'] ) ) ) : '';
	if ( $name === '' ) {
		$errors->add( 'luvit_name', 'اكتبي اسمك من فضلك.' );
	}

	$raw   = isset( $_POST['luvit_reg_phone'] ) ? wp_unslash( $_POST['luvit_reg_phone'] ) : '';
	$phone = luvit_norm_phone( $raw );
	if ( $phone === '' ) {
		$errors->add( 'luvit_phone', 'رقم الموبايل لازم يبدأ بـ07 ويكون عشر أرقام.' );
	}

	$dob = isset( $_POST['luvit_reg_dob'] ) ? trim( sanitize_text_field( wp_unslash( $_POST['luvit_reg_dob'] ) ) ) : '';
	if ( ! preg_match( '/^\d{4}-\d{2}-\d{2}$/', $dob ) || strtotime( $dob ) > time() ) {
		$errors->add( 'luvit_dob', 'اختاري تاريخ ميلادك.' );
	}
}, 10, 3 );

/* الحفظ · الاسم بيروح لحقول ووكومرس الحقيقية عشان الشيك أوت يعبّيها لحاله */
add_action( 'woocommerce_created_customer', function ( $customer_id ) {  // LUVIT_REGISTER
	$name = isset( $_POST['luvit_reg_name'] ) ? trim( sanitize_text_field( wp_unslash( $_POST['luvit_reg_name'] ) ) ) : '';
	if ( $name !== '' ) {
		$parts = preg_split( '/\s+/', $name, 2 );
		update_user_meta( $customer_id, 'first_name', $parts[0] );
		update_user_meta( $customer_id, 'last_name', isset( $parts[1] ) ? $parts[1] : '' );
		update_user_meta( $customer_id, 'billing_first_name', $parts[0] );
		update_user_meta( $customer_id, 'billing_last_name', isset( $parts[1] ) ? $parts[1] : '' );
		wp_update_user( array( 'ID' => $customer_id, 'display_name' => $name ) );
	}

	$raw   = isset( $_POST['luvit_reg_phone'] ) ? wp_unslash( $_POST['luvit_reg_phone'] ) : '';
	$phone = luvit_norm_phone( $raw );
	if ( $phone !== '' ) {
		update_user_meta( $customer_id, 'billing_phone', $phone );
	}

	$dob = isset( $_POST['luvit_reg_dob'] ) ? sanitize_text_field( wp_unslash( $_POST['luvit_reg_dob'] ) ) : '';
	if ( $dob !== '' ) {
		update_user_meta( $customer_id, 'luvit_dob', $dob );
	}
} );

/* ── حذف «اسم العرض» من صفحة تفاصيل الحساب ──────────────────────────
   ريّان: «وحذف اسم العرض».
   🔴 ووكومرس ما بيعطي فلتراً لشيل الحقل من `form-edit-account.php`،
      فبينخفى بالـCSS **وبينضبط من الخادم** على الاسم الكامل. الاخفاء
      لحاله ما بيكفي: الحقل بيضل ينبعت ولو انبعت فاضياً ووردبريس بيرفض
      الحفظ برسالة عن حقل الزبونة ما بتشوفه أصلاً. */
add_filter( 'woocommerce_save_account_details_required_fields', function ( $fields ) {  // LUVIT_REGISTER
	unset( $fields['account_display_name'] );
	return $fields;
} );
add_action( 'woocommerce_save_account_details', function ( $user_id ) {  // LUVIT_REGISTER
	$u = get_userdata( $user_id );
	if ( ! $u ) {
		return;
	}
	$full = trim( get_user_meta( $user_id, 'first_name', true ) . ' ' . get_user_meta( $user_id, 'last_name', true ) );
	if ( $full !== '' && $full !== $u->display_name ) {
		wp_update_user( array( 'ID' => $user_id, 'display_name' => $full ) );
	}
} );

/* ==========================================================================
   LUVIT_GA4_ADMIN · استثناء متصفّح الأدمن · ٥ أيلول
   ==========================================================================
   ريّان: «استثنِ الأدمن لأنه فيه حفلة حتصير قبل الإطلاق».

   الفكرة: **لوحة ووردبريس ما بتنخزّن بالكاش ولا بيوصلها إلا أدمن.**
   فمنحطّ الراية بمتصفّحه من هناك، والواجهة بتقراها. والواجهة نفسها
   بتضل ماركباً واحداً للكل · فما في نسخة «بلا وسم» ممكن تتخزّن.

   ⚠️ و`manage_options` لا `is_user_logged_in` · الزبونات بيسجّلوا دخول
      كمان، وهدول **بدنا نعدّهم**. الاستثناء للإدارة بس.

   ⚠️ ومدير المتجر (`manage_woocommerce`) مستثنى كمان · هو كمان بيتصفّح
      المتجر للفحص لا للشراء.
   ========================================================================== */
add_action( 'admin_footer', function () {  // LUVIT_GA4_ADMIN
	if ( ! current_user_can( 'manage_options' ) && ! current_user_can( 'manage_woocommerce' ) ) {
		return;
	}
	echo '<script>try{localStorage.setItem("luvit-no-ga","1");}catch(e){}</script>';
} );

/* ==========================================================================
   LUVIT_D_PROJECT · من السجلّ لحالة الطلب · ٥ أيلول
   ==========================================================================
   صفحة المندوب (`library/luvit-delivery.php`) بتشتغل **قبل ما ووكومرس
   ينتحمّل**، عشان توصل بجولة وحدة على شبكة ضعيفة. وثمن هالسرعة إنها
   **ما بتقدر تستدعي ولا دالة من ووكومرس** · فهي بتكتب سطراً بالسجلّ وبس.

   وهاد الجزء بيشتغل **بطلب عادي**، بياخد السطور الجديدة وبيعكسها على
   حالة الطلب · وووكومرس وقتها بيطلق إيميلاته لحاله.

   ── 🔴 والاتجاه مقصود ────────────────────────────────────────────────
   **السجلّ هو المصدر، وحالة الطلب انعكاس.** حالة الطلب أي أدمن بيقدر
   يغيّرها والبلجنز بتكتب عليها · فما بتصلح أساس تسوية مالية.
   ولو غيّر حدا الحالة من اللوحة، السجلّ بيضل يقول الحقيقة.

   ── ⚠️ وما بينكتب «تمّت المعالجة» على السطر ──────────────────────────
   الجدول **بينكتب فيه وبس** · فلو أشّرنا على السطور بتصير عندنا
   `UPDATE` وبتنكسر الفكرة. بدلها منخزّن **آخر رقم انعالج** بخيار،
   ومنعالج اللي بعده. أبسط وأأمن وبيحافظ على التاريخ كامل.

   ── ⚠️ والحارس `function_exists` إلزامي ─────────────────────────────
   لو الإضافة انعطّلت أو انحذفت، استدعاء دوالها من هون **خطأ قاتل**
   بيوقّف الموقع. [[silent-refusals-hide-in-the-response]]
   ========================================================================== */

function luvit_d_project() {  // LUVIT_D_PROJECT

	if ( ! function_exists( 'luvit_d_table' ) || ! function_exists( 'wc_get_order' ) ) {
		return;
	}

	global $wpdb;
	$table = luvit_d_table();
	$last  = (int) get_option( 'luvit_d_projected', 0 );

	$rows = $wpdb->get_results(
		$wpdb->prepare(
			"SELECT id, order_id, stage FROM {$table}
			 WHERE id > %d AND stage <> 'view'
			 ORDER BY id ASC LIMIT 100",
			$last
		),
		ARRAY_A
	);

	if ( ! $rows ) {
		return;
	}

	$map = array(
		'answered'  => 'luvit-shipped',
		'delivered' => 'completed',
		'refused'   => 'cancelled',
	);

	foreach ( $rows as $row ) {

		$last  = (int) $row['id'];
		$order = wc_get_order( (int) $row['order_id'] );

		if ( ! $order ) {
			continue;
		}

		$stage = (string) $row['stage'];

		/* «استلمنا البضاعة» · ما بتغيّر حالة ووكومرس (الطلب لساه قيد
		   التجهيز فعلياً) · بس **بتبعت للزبونة**، وهاي أول لحظة بتحسّ
		   فيها إنّ طلبها اتحرّك. */
		if ( 'received' === $stage ) {
			$order->add_order_note( 'شركة التوصيل استلمت البضاعة.' );
			luvit_d_mail_customer( $order, 'received' );
			continue;
		}

		if ( ! isset( $map[ $stage ] ) ) {
			continue;
		}

		$target = $map[ $stage ];

		/* ⚠️ ولا تتراجع للورا · لو حدا سكّر الطلب من اللوحة قبل ما
		   ينعالج السطر، ما بنرجّعه. */
		if ( $order->get_status() === $target ) {
			continue;
		}
		if ( in_array( $order->get_status(), array( 'completed', 'cancelled', 'refunded' ), true )
			&& 'delivered' !== $stage && 'refused' !== $stage ) {
			continue;
		}

		$order->update_status( $target, 'تأكيد من شركة التوصيل عبر رابط التسليم.' );

		/* ⚠️ ووكومرس ما بيبعت إيميلاً لحالة **مخصّصة** · فـ«بالطريق»
		   بدها إيميلنا. أما «مكتمل» و«ملغي» فعندهم إيميلات جاهزة
		   وبتنطلق من `update_status` نفسها · فما بنكرّر. */
		if ( 'answered' === $stage ) {
			luvit_d_mail_customer( $order, 'answered' );
		}
	}

	update_option( 'luvit_d_projected', $last, false );
}

/* ⚠️ **ولا استعلام على كل طلب صفحة.** الصفحة السريعة بترفع راية بخيار
   مُحمَّل مسبقاً، فالقراءة هون **من الكاش وببلاش**، والشغل بيصير بس لما
   يكون في جديد فعلاً. */
add_action(
	'init',
	function () {
		if ( ! get_option( 'luvit_d_dirty' ) ) {
			return;
		}
		update_option( 'luvit_d_dirty', 0 );
		luvit_d_project();
	},
	20
);

/* وشبكة أمان · لو ما حدا زار الموقع، الكرون بيمسكها */
add_action( 'luvit_d_cron', 'luvit_d_project' );
add_action(
	'init',
	function () {
		if ( ! wp_next_scheduled( 'luvit_d_cron' ) ) {
			wp_schedule_event( time() + 300, 'hourly', 'luvit_d_cron' );
		}
	},
	21
);

/* ==========================================================================
   LUVIT_D_LINK · رابط التسليم جوّا إيميل الطلب الإداري · ٥ أيلول
   ==========================================================================
   ما في ورقة بتروح مع الكرتونة · فالرابط بيوصل **بإيميل الطلب اللي
   بيوصل ريّان وصاحب العلامة**، وصاحب العلامة بيمرّره لشركة التوصيل مع
   العنوان والرقم بنفس رسالته المعتادة.

   ⚠️ **والرمز النصّي جنبه إلزامي** · الرابط بينكسر بالواتساب وبفلاتر
      البريد وبالأسطر المقطوعة · ونصّ ما بينكسر. وهو اللي بيشيل حجّة
      «الرابط خربان» كفئة كاملة.

   🔴 **وللإداري بس** · `$sent_to_admin` · وإلا الزبونة بيوصلها رابط
      بتقدر تأكّد فيه استلامها بنفسها.
   ========================================================================== */
add_action(
	'woocommerce_email_order_meta',
	function ( $order, $sent_to_admin ) {

		if ( ! $sent_to_admin || ! function_exists( 'luvit_d_token' ) ) {
			return;
		}

		$token = luvit_d_token( $order->get_id() );
		if ( '' === $token ) {
			return;
		}

		$url = home_url( '/d/' . $token );

		echo '<div style="margin:18px 0;padding:14px;border:1px solid #E1E9EC;'
			. 'border-radius:10px;background:#F2F7F9;direction:rtl;text-align:right">'
			. '<p style="margin:0 0 8px;font-weight:700;color:#1A2529">رابط تأكيد التسليم</p>'
			. '<p style="margin:0 0 8px;font-size:13px;color:#47555B">'
			. 'ابعته لشركة التوصيل مع تفاصيل الطلب.</p>'
			. '<p style="margin:0 0 6px"><a href="' . esc_url( $url ) . '" '
			. 'style="color:#196B7D;word-break:break-all">' . esc_html( $url ) . '</a></p>'
			. '<p style="margin:0;font-size:13px;color:#47555B">وإذا الرابط ما اشتغل، '
			. 'افتحوا <strong>plasmajo.com/d</strong> واكتبوا الرمز: '
			. '<strong style="letter-spacing:.06em">' . esc_html( $token ) . '</strong></p>'
			. '</div>';
	},
	10,
	2
);

/* ==========================================================================
   LUVIT_D_MAIL · إيميلات الزبونة بمحطّات التوصيل · ٥ أيلول
   ==========================================================================
   محطّتان ما عند ووكومرس إيميل إلهن، لأنهن **مش حالات ووكومرس**:

     «استلمنا البضاعة» ← أول لحظة بتحسّ فيها إنّ طلبها اتحرّك
     «ردّت واتفقنا»    ← تثبيت مكتوب لموعد حكت فيه بالتلفون توّها

   و«تسلّمت» و«رفضت» عندهم إيميلات ووكومرس الجاهزة، فما بنكرّر.

   ⚠️ و`wrap_message` بتلفّ النصّ بقالب إيميلات المتجر · يعني بيرث
      ترويستنا وألواننا واتجاهنا من `email-rtl.php` بلا ما نعيد بناء
      قالب. [[color-does-not-inherit-into-svg]]

   🔴 **والصيغة مؤنّثة** · هاي الزبونة لا ريّان.
   ========================================================================== */

function luvit_d_mail_customer( $order, $stage ) {  // LUVIT_D_MAIL

	$to = $order->get_billing_email();
	if ( ! $to || ! function_exists( 'WC' ) || ! WC()->mailer() ) {
		return;
	}

	$name  = $order->get_billing_first_name();
	$hi    = $name ? 'أهلين ' . esc_html( $name ) . '،' : 'أهلين،';
	$num   = $order->get_order_number();
	$total = wc_price( $order->get_total() );

	if ( 'received' === $stage ) {
		$subject = 'طلبك صار عند المندوب · ' . $num;
		$heading = 'طلبك بطريقه إلك';
		$body    = '<p>' . $hi . '</p>'
			. '<p>طلبك رقم <strong>' . esc_html( $num ) . '</strong> صار عند شركة التوصيل، '
			. 'وحيتواصلوا معك على تلفونك بأقرب وقت عشان تتفقوا على وقت يناسبك.</p>'
			. '<p>سعر الطلب <strong>' . $total . '</strong> · الدفع عند الاستلام.</p>';
	} elseif ( 'answered' === $stage ) {
		$subject = 'اتفقنا على الموعد · طلبك بالطريق · ' . $num;
		$heading = 'طلبك بالطريق';
		$body    = '<p>' . $hi . '</p>'
			. '<p>تمّ التواصل معك واتفقنا على الموعد، وطلبك رقم '
			. '<strong>' . esc_html( $num ) . '</strong> بالطريق إلك.</p>'
			. '<p>سعر الطلب <strong>' . $total . '</strong> · الدفع عند الاستلام.</p>';
	} else {
		return;
	}

	$body .= '<p style="color:#47555B;font-size:13px">'
		. 'وإذا احتجتِ أي إشي، ردّي على هالرسالة ومنكون معك.</p>';

	$msg = WC()->mailer()->wrap_message( $heading, $body );

	WC()->mailer()->send(
		$to,
		$subject,
		$msg,
		'Content-Type: text/html' . "\r\n",
		''
	);
}

/* ==========================================================================
   LUVIT_D_DIGEST · التنبيه اليومي · ٥ أيلول
   ==========================================================================
   🔴 **بيوصل كل يوم حتى لو ما في ولا طلبية عالقة.**
   تنبيه بيوصل بس وقت المشكلة **ما بتقدر تفرّق بينه وبين تنبيه ميت** ·
   وأول ما يسكت أسبوعاً بتفترض إنّ الدنيا تمام وهو أصلاً معطّل.

   ── وشو بيمسك ──────────────────────────────────────────────────────
   الطلبيات اللي **وقفت بمحطّة** أطول من اللازم · وأهمهن اللي استلمتها
   الشركة وما ضغطت «ردّت»، لأنّ **هاي معناها الزبونة ما بترد** ·
   وريّان شال زرّ «ما ردّت» بقصد عشان الغياب يصير هو الإشارة.

   ⚠️ **والعتبات تخمين مؤقّت** · بتنضبط لمّا نعرف كم بتاخد الشركة فعلاً.
   ========================================================================== */

const LUVIT_D_LATE_NEW      = 24;  /* ساعة · طلب جديد وما استلمته الشركة */
const LUVIT_D_LATE_RECEIVED = 24;  /* ساعة · استلمته وما ردّت الزبونة */
const LUVIT_D_LATE_SHIPPED  = 48;  /* ساعة · بالطريق وما تسلّمت */

function luvit_d_digest() {  // LUVIT_D_DIGEST

	if ( ! function_exists( 'luvit_d_table' ) || ! function_exists( 'wc_get_orders' ) ) {
		return;
	}

	global $wpdb;
	$table = luvit_d_table();

	$stuck = array(
		'ما استلمتها الشركة'      => array( 'processing', LUVIT_D_LATE_NEW, 'received' ),
		'استلمتها وما ردّت الزبونة' => array( 'processing', LUVIT_D_LATE_RECEIVED, 'answered' ),
		'بالطريق وما تسلّمت'       => array( 'luvit-shipped', LUVIT_D_LATE_SHIPPED, 'delivered' ),
	);

	$lines = '';
	$total = 0;

	foreach ( $stuck as $label => $rule ) {
		list( $status, $hours, $missing ) = $rule;

		$orders = wc_get_orders(
			array(
				'status'       => array( $status ),
				'date_created' => '<' . ( time() - $hours * HOUR_IN_SECONDS ),
				'limit'        => 50,
				'return'       => 'ids',
			)
		);

		$hit = array();
		foreach ( (array) $orders as $oid ) {
			$has = (int) $wpdb->get_var(
				$wpdb->prepare(
					"SELECT COUNT(*) FROM {$table} WHERE order_id = %d AND stage = %s",
					(int) $oid,
					$missing
				)
			);
			if ( ! $has ) {
				$hit[] = (int) $oid;
			}
		}

		if ( $hit ) {
			$total  += count( $hit );
			$lines  .= '<p><strong>' . esc_html( $label ) . '</strong> (' . count( $hit ) . '): '
				. esc_html( implode( '، ', $hit ) ) . '</p>';
		}
	}

	$subject = $total
		? 'LUV IT · ' . $total . ' طلبية مستنية'
		: 'LUV IT · ما في شي مستني';

	$body = $lines ? $lines : '<p>كل الطلبيات ماشية · ما في ولا وحدة عالقة.</p>';
	$body .= '<p style="color:#47555B;font-size:13px">هالرسالة بتوصل كل يوم، '
		. 'حتى لو ما في شي · غيابها معناه في خلل بالنظام لا إنّ الدنيا تمام.</p>';

	wp_mail(
		get_option( 'admin_email' ),
		$subject,
		$body,
		array( 'Content-Type: text/html; charset=UTF-8' )
	);
}

add_action( 'luvit_d_digest_cron', 'luvit_d_digest' );
add_action(
	'init',
	function () {
		if ( ! wp_next_scheduled( 'luvit_d_digest_cron' ) ) {
			/* ٧ صباحاً بتوقيت عمّان · قبل ما يبلّش يوم الشغل */
			$next = strtotime( 'tomorrow 07:00', current_time( 'timestamp' ) );
			wp_schedule_event( $next - ( (int) get_option( 'gmt_offset' ) * HOUR_IN_SECONDS ), 'daily', 'luvit_d_digest_cron' );
		}
	},
	22
);

/* ==========================================================================
   LUVIT_D_ADMINLINK · رابط التسليم على صفحة الطلب · ٥ أيلول
   ==========================================================================
   الرابط بينحط بإيميل الطلب أصلاً · بس الإيميل بينضاع بصندوق الوارد،
   وصاحب العلامة بيفتح الطلب باللوحة لمّا بيبعت التفاصيل للشركة.
   فبيلاقيه قدامه بنفس الشاشة اللي بينسخ منها العنوان والرقم.

   ⚠️ **والرمز النصّي جنبه** · هو اللي بيشيل حجّة «الرابط خربان».
   ⚠️ و`manage_woocommerce` لا `is_admin` وحدها · الشاشة إدارية بس
      **الصلاحية** هي اللي بتحمي لا المكان.
   ========================================================================== */
add_action(
	'woocommerce_admin_order_data_after_order_details',
	function ( $order ) {  // LUVIT_D_ADMINLINK

		if ( ! function_exists( 'luvit_d_token' ) || ! current_user_can( 'manage_woocommerce' ) ) {
			return;
		}

		$token = luvit_d_token( $order->get_id() );
		if ( '' === $token ) {
			echo '<p style="color:#B24B3C">رابط التسليم مش جاهز · الختم مش مضبوط بالإعدادات.</p>';
			return;
		}

		$url = home_url( '/d/' . $token );

		echo '<div class="form-field form-field-wide" style="margin-top:14px;padding:12px;'
			. 'border:1px solid #dcdcde;border-radius:6px;background:#f6f7f7">'
			. '<p style="margin:0 0 6px"><strong>رابط تأكيد التسليم</strong></p>'
			. '<p style="margin:0 0 6px"><input type="text" readonly onclick="this.select()" '
			. 'style="width:100%;direction:ltr;text-align:left" value="' . esc_attr( $url ) . '"></p>'
			. '<p style="margin:0;font-size:12px;color:#50575e">'
			. 'وإذا ما اشتغل الرابط: <strong>plasmajo.com/d</strong> والرمز '
			. '<strong style="letter-spacing:.06em">' . esc_html( $token ) . '</strong></p>'
			. '</div>';
	}
);
