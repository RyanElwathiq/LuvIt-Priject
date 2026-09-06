/**
 * LUV IT · صفحة الحساب بهوية العلامة · الطريقة «ب» · ٢ أيلول
 *
 * ريّان: «ما عملتلها تصميم» · واختار «ب» من ثلاث طرق: **الفورمات تضل
 * ووكومرس** (دخول · تسجيل · كلمة سر · عناوين · بيانات) · **والغلاف
 * ولوحة الترحيب ماركبنا**. ولا فورم فيه كلمة سر بينكتب بإيدنا · خط أحمر.
 *
 * ثلاث طبقات، كلها **بخطافات** لا باستبدال قوالب · فتحديثات ووكومرس
 * ما بتكسرها ولا بتطلّع تحذير «قالب قديم»:
 *
 *   ١ · رأس الصفحة (وهي داخلة)   · woocommerce_before_account_navigation
 *   ٢ · بطاقات لوحة الترحيب        · woocommerce_account_dashboard
 *   ٣ · رأس صفحة الدخول (وهي طالعة) · woocommerce_before_customer_login_form
 *
 * الخطافات الثلاثة مؤكدة من مرجعين خارجيين (Business Bloomer ·
 * StoreCustomizer) لا من الذاكرة · لأن خطاف بالاسم الغلط بيفشل بصمت
 * وبيبين زي اللي شغّال.
 *
 * ⚠️ سطر التحية «أهلاً %s (مش إنتِ؟ …)» **مكتوب بالقالب فوق خطاف اللوحة**
 *    فما بينحط شي فوقه · ونصّه بينعدّل بـgettext (تحت) لا بالماركب.
 *
 * 🔴 السابقة: «قطراتك» بـlibrary/woo.php معمولة بنفس الأسلوب بالضبط.
 */

/* ══════════════════════════════════════════════════════════════════════
   ٠ · نصوص · بأولوية 21 عشان تغلب خريطة woo.php (20) بالسلاسل المشتركة
   ══════════════════════════════════════════════════════════════════════
   ريّان ٢ أيلول ومعه لقطة اللوحة: «اطلعي» لتسجيل الخروج **بتنقرا "اطلعي
   برّا"** · التباس ونبرة غلط. صارت «تسجيل الخروج» · نفس نص التبويب بالقائمة.

   🔴 المطابقة على الأصل الإنجليزي **حرفياً** كما بقالب ووكومرس · أي حرف
      غلط = الفلتر ما بيمسك وبيبين زي اللي شغّال. السلاسل تحت قصيرة
      ومستقرة عبر النسخ · والطويلة (الخصوصية مثلاً) تُركت عمداً لتدقيق
      الكوبي الجاري بدل ما تنكتب من الذاكرة.
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
				/* لوحة الحساب · التحية · «اطلعي» → «تسجيل الخروج» */
				'Hello %1$s (not %1$s? <a href="%2$s">Log out</a>)'
					=> 'أهلاً %1$s (مش إنتِ؟ <a href="%2$s">تسجيل الخروج</a>)',

				/* فورم الدخول · form-login.php · مؤنث */
				'Username or email address' => 'الإيميل أو اسم المستخدم',
				'Remember me'               => 'خلّيني مسجّلة',
				'Lost your password?'       => 'نسيتِ كلمة السر؟',
				'Log in'                    => 'دخول',
				'Login'                     => 'دخول',
				'Register'                  => 'إنشاء حساب',

				/* استرجاع كلمة السر · form-lost-password.php */
				'Lost your password? Please enter your username or email address. You will receive a link to create a new password via email.'
					=> 'نسيتِ كلمة السر؟ اكتبي إيميلك وبيوصلك رابط تعملي فيه كلمة سر جديدة.',
				'Reset password'            => 'إعادة تعيين كلمة السر',

				/* الطلبات · orders.php · الحالة الفاضية */
				'No order has been made yet.' => 'لسا ما طلبتِ ولا مرة.',
				'Browse products'             => 'شوفي المنتجات',

				/* ── ٤٠ سلسلة من تدقيق الكوبي ٢ أيلول · بالمؤنث وبصوت الموقع ──
				   المفاتيح الإنجليزية كما بقوالب ووكومرس · أي مفتاح غلط بيفشل بصمت
				   (ما بيمسك) وما بيكسر شي · [DOC] لحد ما تنفحص كل شاشة بعين. */
				'Sorry, the order could not be found. Please contact us if you are having difficulty finding your order details.'
					=> 'ما لقينا طلباً بهالرقم وهالإيميل · تأكّدي منهم من إيميل التأكيد، وإذا ما زبط اكتبيلنا من صفحة تواصلي معنا.',
				'Add to cart: “%s”'
					=> 'أضيفي %s إلى السلة',
				'Add to cart'
					=> 'أضيفي إلى السلة',
				'Thank you. Your order has been received.'
					=> 'شكراً · استلمنا طلبك وبلّشنا نجهّزه.',
				'Order received'
					=> 'استلمنا طلبك',
				'We were unable to verify the email address you provided. Please try again.'
					=> 'الإيميل اللي كتبتيه مش مطابق للطلب · جرّبي مرة تانية.',
				'Enter a new password below.'
					=> 'اكتبي كلمة السر الجديدة.',
				'Re-enter new password'
					=> 'كلمة السر مرة تانية',
				'Current password (leave blank to leave unchanged)'
					=> 'كلمة السر الحالية (اتركيها فاضية لو ما بدك تغيّريها)',
				'New password (leave blank to leave unchanged)'
					=> 'كلمة السر الجديدة (اتركيها فاضية لو ما بدك تغيّريها)',
				'Please enter your current password.'
					=> 'اكتبي كلمة السر الحالية.',
				'Enter a username or email address.'
					=> 'اكتبي إيميلك أو اسم المستخدم.',
				'Invalid username or email.'
					=> 'ما لقينا حساباً بهالإيميل أو الاسم.',
				'You have not set up this type of address yet.'
					=> 'لسا ما حفظتِ عنواناً هون.',
				'The following addresses will be used on the checkout page by default.'
					=> 'هدول العناوين بتنعبّى لحالها بصفحة إتمام الطلب.',
				'%1$s for %2$s item'
					=> '[0] %1$s لـ%2$s قطعة | [1] %1$s لقطعة وحدة | [2] %1$s لقطعتين | [3] %1$s لـ%2$s قطع | [4] %1$s لـ%2$s قطعة | [5] %1$s لـ%2$s قطعة',
				'Dashboard'
					=> 'لوحة الحساب',
				'Password'
					=> 'كلمة السر',
				'Username or email'
					=> 'الإيميل أو اسم المستخدم',
				'Are you sure you want to log out? <a href="%s">Confirm and log out</a>'
					=> 'أكيد بدك تسجّلي خروجك؟ <a href="%s">أكّدي وسجّلي الخروج</a>',
				'Password reset email has been sent.'
					=> 'بعثنالك رابط تغيير كلمة السر على الإيميل.',
				'A password reset email has been sent to the email address on file for your account, but may take several minutes to show up in your inbox. Please wait at least 10 minutes before attempting another reset.'
					=> 'الرابط راح على الإيميل المسجّل بحسابك · وممكن يتأخّر كم دقيقة. استنّي ١٠ دقايق قبل ما تطلبي رابطاً تانياً.',
				'Your password has been reset successfully.'
					=> 'تغيّرت كلمة السر · بتقدري تسجّلي دخولك فيها هلأ.',
				'On hold'
					=> 'قيد المراجعة',
				'Processing'
					=> 'قيد التجهيز',
				'Completed'
					=> 'وصل',
				'Cancelled'
					=> 'ملغى',
				'Refunded'
					=> 'مسترجَع',
				'Pending payment'
					=> 'بانتظار التأكيد',
				'Failed'
					=> 'ما اكتمل',
				/* فورم تفاصيل الحساب · ووكومرس بيقول «كلمة المرور» بسطرين والباقي «كلمة السر» · توحيد (٢ أيلول · لقطة ريّان) */
				'Password change'
					=> 'تغيير كلمة السر',
				'Confirm new password'
					=> 'تأكيد كلمة السر الجديدة',
				/* تأكيد الإيميل وربط الطلبات القديمة (ووكومرس 11 · CustomerEmailVerification) ·
				   ريّان ٣ أيلول: «خلّي إشعار تأكيد البريد واتأكد إنها شغّالة» · النصوص الأصلية فصحى
				   ومذكّرة («مرحبًا تجريبي، بمجرد أن تقوم…») فصارت بنبرة الموقع · المطابقة حرفية على الإنجليزي */
				'Confirm your email address to check for past orders and link them to your account.'
					=> 'أكّدي إيميلك عشان نلاقي طلباتك القديمة ونربطها بحسابك.',
				'Confirm your email address to check for past orders. A confirmation link was sent recently — please check your inbox.'
					=> 'بعثنالك رابط التأكيد قبل شوي · شوفي صندوق الوارد عندك.',
				'Confirm email address'
					=> 'تأكيد الإيميل',
				'A confirmation link has been sent to your email address. Please check your inbox.'
					=> 'بعثنالك رابط التأكيد على إيميلك · شوفي صندوق الوارد.',
				'A confirmation link was sent recently. Please check your inbox, or wait a moment before requesting a new one.'
					=> 'الرابط انبعت قبل شوي · شوفي صندوق الوارد، أو استنّي لحظة قبل ما تطلبي واحداً جديداً.',
				'Your email address has been confirmed.'
					=> 'تأكّد إيميلك · وأي طلبات قديمة بنفس الإيميل صارت بحسابك.',
				'This confirmation link is invalid or has expired. Please request a new one.'
					=> 'هالرابط انتهى أو مش صحيح · اطلبي رابطاً جديداً من تبويب الطلبات.',
				'Unable to confirm this email while you are logged in to a different account. Please log out and open the link again.'
					=> 'إنتِ داخلة بحساب تاني · سجّلي خروجك وافتحي الرابط مرة تانية.',
				'Invalid request. Please try again.'
					=> 'صار خطأ · جرّبي مرة تانية.',
				/* إيميل التأكيد نفسه */
				'Confirm your email address for {site_title}'
					=> 'أكّدي إيميلك على {site_title}',
				'Confirm your email address'
					=> 'أكّدي إيميلك',
				'Hi %s,'
					=> 'أهلاً %s،',
				"Once you've confirmed that %s is your email address, we'll link any past orders to your account."
					=> 'أول ما تأكّدي إن %s هو إيميلك، منربط أي طلبات قديمة بنفس الإيميل بحسابك.',
				"If you didn't request this email, there's nothing to worry about, and you can safely ignore it."
					=> 'إذا ما طلبتي هالإيميل ما في داعي تقلقي · تجاهليه وخلص.',
				'Thanks for reading.'
					=> 'شكراً إنك قرأتي.',
				'Order #%1$s was placed on %2$s and is currently %3$s.'
					=> 'طلبك رقم %1$s انعمل بتاريخ %2$s، وحالته هلأ: %3$s.',
				'Contact information'
					=> 'بيانات التواصل',
				'Proceed to Checkout'
					=> 'كمّلي الطلب',
				'Please enter a valid email address'
					=> 'اكتبي إيميل صحيح',
				'Be the first to review “%s”'
					=> 'كوني أول وحدة بتقيّم “%s”',
				'Not that bad'
					=> 'مش بطّال',
				'Your review'
					=> 'رأيك',
				'Reviews'
					=> 'الآراء',
				'Add a review'
					=> 'اكتبي رأيك',
				'There are no reviews yet.'
					=> 'ما في آراء لهلأ.',
			);
		}
		return isset( $map[ $text ] ) ? $map[ $text ] : $translated;
	},
	21,
	3
);

/* ══════════════════════════════════════════════════════════════════════
   أدوات صغيرة · اسم الزبونة بأمان
   ══════════════════════════════════════════════════════════════════════ */
if ( ! function_exists( 'luvit_account_first_name' ) ) {
	function luvit_account_first_name() {
		$u = wp_get_current_user();
		if ( ! $u || ! $u->ID ) {
			return '';
		}
		/* الاسم الأول لو موجود · وأول كلمة منه بس عشان التحية تقرا أحلى.
		   ولو ما في اسم أول، اسم العرض **كاملاً** لا أول كلمة منه ·
		   مقيس ٢ أيلول: «Luv it» صار «أهلاً، Luv» لما انقطع. */
		$first = trim( (string) $u->first_name );
		if ( '' !== $first ) {
			$parts = preg_split( '/\s+/', $first );
			return $parts && '' !== $parts[0] ? $parts[0] : '';
		}
		return trim( (string) $u->display_name );
	}
}

/* ══════════════════════════════════════════════════════════════════════
   ١ · رأس الصفحة · وهي داخلة
   ══════════════════════════════════════════════════════════════════════
   بينطبع **جوّا** غلاف .woocommerce اللي §5.2 حوّله لشبكة عمودين ·
   فالـCSS بيمدّه على العمودين (grid-column: 1 / -1).
   بلا موجة وبلا شريط غامق · نسخة هادئة من لغة الماء: هون بتقرا
   طلباتها مش بتنبهر.
   ══════════════════════════════════════════════════════════════════════ */
add_action( 'woocommerce_before_account_navigation', function () {
	if ( ! is_user_logged_in() ) {
		return;
	}
	$name = luvit_account_first_name();
	$hi   = '' !== $name ? 'أهلاً، ' . esc_html( $name ) : 'أهلاً فيكِ';
	echo '<header class="luvit-acct-head">'
		. '<p class="luvit-acct-head__eyebrow">حسابك على <span dir="ltr">Luv it</span></p>'
		. '<h1 class="luvit-acct-head__title">' . $hi . '</h1>'
		. '<p class="luvit-acct-head__sub">طلباتك وعناوينك ونادي التوصيل · كلها هون بمكان واحد.</p>'
		. '</header>';
}, 5 );

/* ══════════════════════════════════════════════════════════════════════
   ٢ · لوحة الترحيب · ثلاث بطاقات بعد فقرة ووكومرس
   ══════════════════════════════════════════════════════════════════════
   كل بطاقة بتقول **حقيقة من الحساب** لا كوبي عام: آخر طلب برقمه وحالته
   وتاريخه، وعنوان التوصيل لو موجود، وقطراتك. والفاضي بيقول إنه فاضي
   وبيعطي الخطوة الجاية · لا شاشة مكسورة ولا وعد.

   🔴 كل قيمة من ووكومرس بتمرّ بـesc_html · وولا رقم مكتوب بالإيد.
   ══════════════════════════════════════════════════════════════════════ */
add_action( 'woocommerce_account_dashboard', function () {
	$uid = get_current_user_id();
	if ( ! $uid ) {
		return;
	}

	/* آخر طلب */
	$last   = null;
	$orders = function_exists( 'wc_get_orders' ) ? wc_get_orders( array(
		'customer_id' => $uid,
		'limit'       => 1,
		'orderby'     => 'date',
		'order'       => 'DESC',
		'return'      => 'objects',
	) ) : array();
	if ( ! empty( $orders ) ) {
		$last = $orders[0];
	}

	/* عنوان التوصيل · من كائن الزبونة */
	$city = '';
	$addr = '';
	if ( class_exists( 'WC_Customer' ) ) {
		try {
			$c    = new WC_Customer( $uid );
			$city = trim( (string) $c->get_shipping_city() );
			$addr = trim( (string) $c->get_shipping_address_1() );
			if ( '' === $city && '' === $addr ) {
				$city = trim( (string) $c->get_billing_city() );
				$addr = trim( (string) $c->get_billing_address_1() );
			}
		} catch ( Exception $e ) {
			$city = '';
			$addr = '';
		}
	}

	$u_orders = esc_url( wc_get_account_endpoint_url( 'orders' ) );
	$u_addr   = esc_url( wc_get_account_endpoint_url( 'edit-address' ) );
	/* ⚠️ مفتاح النقطة `club` من ٤ أيلول (كان `drops`) · اسم المتغيّر ضلّ
	   زي ما هو عشان ما نلمس أسطراً ما إلها علاقة. */
	$u_drops  = esc_url( wc_get_account_endpoint_url( 'club' ) );
	$u_shop   = esc_url( home_url( '/products/' ) );

	echo '<div class="luvit-acct-grid">';

	/* ── آخر طلب ── */
	echo '<article class="luvit-acct-card">';
	echo '<p class="luvit-acct-card__eyebrow">آخر طلب</p>';
	if ( $last ) {
		$num    = esc_html( $last->get_order_number() );
		$status = esc_html( wc_get_order_status_name( $last->get_status() ) );
		$when   = $last->get_date_created() ? esc_html( wc_format_datetime( $last->get_date_created() ) ) : '';
		echo '<h3 class="luvit-acct-card__title"><span dir="ltr">#' . $num . '</span></h3>';
		echo '<p class="luvit-acct-card__line">' . $status . ( $when ? ' · ' . $when : '' ) . '</p>';
		echo '<a class="luvit-acct-card__link" href="' . esc_url( $last->get_view_order_url() ) . '">تفاصيل الطلب</a>';
	} else {
		echo '<h3 class="luvit-acct-card__title">لسا ما طلبتِ</h3>';
		echo '<p class="luvit-acct-card__line">أول طلب بيظهر هون مع حالته خطوة خطوة.</p>';
		echo '<a class="luvit-acct-card__link" href="' . $u_shop . '">شوفي المنتجات</a>';
	}
	echo '</article>';

	/* ── عنوان التوصيل ── */
	echo '<article class="luvit-acct-card">';
	echo '<p class="luvit-acct-card__eyebrow">عنوان التوصيل</p>';
	if ( '' !== $city || '' !== $addr ) {
		echo '<h3 class="luvit-acct-card__title">' . esc_html( '' !== $city ? $city : $addr ) . '</h3>';
		if ( '' !== $city && '' !== $addr ) {
			echo '<p class="luvit-acct-card__line">' . esc_html( $addr ) . '</p>';
		}
		echo '<a class="luvit-acct-card__link" href="' . $u_addr . '">تعديل العنوان</a>';
	} else {
		echo '<h3 class="luvit-acct-card__title">ما في عنوان لسا</h3>';
		echo '<p class="luvit-acct-card__line">أضيفيه مرة، وبيتعبّى لحاله بكل طلب.</p>';
		echo '<a class="luvit-acct-card__link" href="' . $u_addr . '">أضيفي عنوانك</a>';
	}
	echo '</article>';

	/* ── نادي Luv it ──────────────────────────────────────────────────
	   🔴 **الأرقام من `luvit_loyalty_state()` لا من حساب محلي** · نفس
	      الدالة اللي بيقرا منها فلتر الشحن، فاللي بتشوفه الزبونة هون هو
	      اللي بينحاسب عليه بالسلة حرفياً. [[duplicated-data-always-drifts]] */
	$club = function_exists( 'luvit_loyalty_state' ) ? luvit_loyalty_state() : null;
	echo '<article class="luvit-acct-card luvit-acct-card--drops">';
	echo '<p class="luvit-acct-card__eyebrow">نادي <span dir="ltr">Luv it</span></p>';
	if ( is_array( $club ) && (int) $club['every'] > 0 ) {
		if ( $club['due'] ) {
			echo '<h3 class="luvit-acct-card__title">طلبيتك الجاي فيها هديتك</h3>';
			echo '<p class="luvit-acct-card__line">بتيجي بنفس الكرتونة · ما بدك تعملي إشي.</p>';
		} else {
			/* ⚠️ الصيغة من `luvit_orders_word()` بـwoo.php · «2 طلبات» غلط عربي.
			   والحارس لأنّ السنيبتين ممكن ينحفظوا بترتيب مختلف. */
			$word = function_exists( 'luvit_orders_word' )
				? luvit_orders_word( $club['done'] )
				: (string) $club['done'] . ' طلبات';
			echo '<h3 class="luvit-acct-card__title">' . esc_html( $word ) . '</h3>';
			echo '<p class="luvit-acct-card__line">وهديتك مع الطلبية رقم '
				. esc_html( (string) $club['next'] ) . '.</p>';
		}
	} else {
		echo '<h3 class="luvit-acct-card__title">موقوف مؤقتاً</h3>';
		echo '<p class="luvit-acct-card__line">منرجّعه قريباً.</p>';
	}
	echo '<a class="luvit-acct-card__link" href="' . $u_drops . '">شو القصة</a>';
	echo '</article>';

	echo '</div>';
}, 10 );

/* ══════════════════════════════════════════════════════════════════════
   ٣ · رأس صفحة الدخول · وهي طالعة
   ══════════════════════════════════════════════════════════════════════
   ووكومرس بيعرض «دخول» و«إنشاء حساب» جنب بعض (التسجيل مفتوح بالإعدادات ·
   مقيس ٢ أيلول). الرأس بيقول شو هالصفحة بجملة، وCSS §5.2b بيحوّل العمودين
   لبطاقتين وبيحط «أول مرة هون؟» فوق التسجيل.

   ⚠️ [DOC] · شكل الفورمات وهي طالعة **ما بينشاف من أي متصفح داخل**
      («قريباً» بتحجبه) · بينفحص من نافذة خاصة عند ريّان أو يوم الإطلاق.
   ══════════════════════════════════════════════════════════════════════ */
add_action( 'woocommerce_before_customer_login_form', function () {
	/* ⚠️ **الترحيب انشال من هون · ريّان ٥ أيلول** · «احذف الترحيب اللي
	   فوق وارفع الكرت لفوق وخلي كل البيانات اللي فيه واضحة من أول مرة
	   بدون الحاجة لسكرول».

	   المقيس اللي أثبت كلامه (1440×800): الترحيب **١٦٦ بكسل** وتحته
	   فجوة شبكة ٤٨ · فالكرت كان بيبدأ عند ٣٧٤ وبيخلص عند ١٠١٩، يعني
	   **زرّ الدخول نفسه (٧٧١) تحت الطيّة**.

	   ⤷ وانشال من **هالخطّاف وحده** · صفحتا «نسيت كلمة السر» و«كلمة سر
	     جديدة» إلهن خطّافاتهن الخاصة تحت، ورؤوسهن ضلّت زي ما هي لأنهن
	     صفحتان بلا سياق ثاني يشرحهن.

	   🔴 **واللوح بيضل** · هو اللي بيحمل هوية الصفحة بعد ما راح الترحيب. */

	/* ══════════════════════════════════════════════════════════════════
	   اللوح الجانبي · شاشة مقسومة · ٤ أيلول
	   ══════════════════════════════════════════════════════════════════
	   ريّان بعت ثلاثة مراجع من 21st.dev وقال «صفحة تسجيل الدخول وإنشاء
	   حساب غلط، تكون هيك».

	   🔴 **والمراجع كلها React + Tailwind + shadcn · وموقعنا ووردبريس.**
	      فما بينلصقوا. المشترك بينهم **النمط** لا الكود: شاشة مقسومة ·
	      فورم واحد بمرة · ولوح فيه صورة واقتباس. وهاد اللي انبنى هون
	      بتوكناتنا · [[our-own-rules-are-the-enemy]] بتقول التقليد
	      بيتكسر، والقاعدة الأولى بالمشروع «21st.dev إلهام بس».

	   ── الأبيات · ٥ أيلول ────────────────────────────────────────────
	   كان هون **اقتباس زبونة حقيقي**، وبدّله ريّان: «خليها من فلسفة
	   Luv it واعملها كأنها أبيات شعر فارسي أو أندلسي».

	   ⤷ والتبديل **حسّن الصدق مش عكسه**: الاقتباس كان بيشتغل كدليل
	     اجتماعي بمكان ما بينفع فيه (قبل ما تدخل الزبونة أصلاً)، وهلق
	     صار صوت العلامة بيقدّم نفسه · ولا ادّعاء ولا شهادة بمحلّ غلط.

	   **البيتان:** مجزوء الرمل · فاعلاتن فاعلاتن بكل شطر (والخبن زحاف
	   قياسي فيه) · القافية لام مشدّدة مضمومة من جذرين مختلفين
	   (قلل/ضلل) لا من نفس الوزن الصرفي.

	   🔴 **والمعنى مقصود بدقّة:** «رُبَّ بَحْرٍ لَا يُرَوِّي» بتفشّخ
	      **الكثير** بدل ما تنفخ **القليل** · يعني بتوصل «منتجات أقل
	      بتكفي» بلا ما توعد بإشي. و«وَبِهَذَا لَا نَضِلُّ» الضمير
	      **علينا إحنا** لا على الزبونة · إحنا اللي منضلّ لو ما سألنا،
	      مش هي اللي جاهلة. وهاد فرق نبرة كامل.

	   ── ⚠️ وانتصحّح ٥ أيلول · وريّان هو اللي حسّه ────────────────────
	   ريّان: «الحركات غلط دقّقها». وطلع أكثر من حركات:

	   **١ · ثلاث حركات ناقصة فعلاً** · `يُرَوِّي` كانت شدّة بلا حركة
	      (والعين ما بتعرف تستقر بين المعلوم والمجهول) · و`سُؤَالٌ` بلا
	      فتحة على الهمزة · و`الدَّرْبِ` بلا سكون على الراء.

	   **٢ · والوزن كان صحيحاً** · مجزوء الرمل، وثلاثة من أربعة أشطر
	      مضبوطة. الكسر كان **بكلمة وحدة**: `وَبِلاهُ`.
	      ⤷ الهاء ضمير قصير وما بتقدر تقفل التفعيلة، وصلة هاء الضمير
	        ما بتيجي بعد ساكن (ألف `لا`) · فما في رخصة تنقذها.

	   **٣ · 🔴 والأسوأ إنها بتنقرا غلط** · باللام العارية `وبلاه`
	      بتنقرا أول مرة **`وَبَلاهُ`** يعني *بلاؤه ومحنته* · فيصير
	      المعنى «أوّل الدرب سؤال، ومحنته قد نضلّ». كئيب وعكس المقصود،
	      والقارئة بتعطي سطراً على شاشة دخول ثانيتين وبتاخد أول قراءة.
	      ⤷ وهاي بالضبط «كلمة بتنفهم غلط» اللي منعها ريّان.

	   **٤ · و`بِلاه` عامية شامية** بسطر فصيح · الفصيح `بِدُونِهِ` أو
	      `مِنْ غَيْرِهِ` · وكلهن بيكسرن الوزن لنفس السبب (ضمير قصير).

	   ⤷ فالبديل `وَبِهَذَا لَا نَضِلُّ` · موزون (فَعِلاتُنْ فاعِلاتُنْ)،
	     وضربه فاعِلاتُنْ زي الشطر الأول بالضبط، وبيشيل `قَدْ` المضعِّفة
	     فبيصير الكلام مثبتاً: **وبهذا لا نضلّ**.

	   ⚠️ ومحطوطة كسطرين بـ`<br>` لا كفقرة · الشطر ما بينكسر بمكان
	      عشوائي لمّا يضيق اللوح.

	   ⚠️ والصورة `luvit-about-ripple.webp` مولَّدة عنا ومرفوعة للمكتبة ·
	      مجرّدة وبلا وجوه · قاعدة ريّان على الصور.
	   ══════════════════════════════════════════════════════════════════ */
	echo '<aside class="auth-side" aria-hidden="true">'
		. '<img class="auth-side__img" loading="lazy" decoding="async" alt=""'
		. ' src="https://plasmajo.com/wp-content/uploads/2026/09/luvit-about-ripple.webp"'
		. ' width="1000" height="1000">'
		. '<span class="auth-side__veil"></span>'
		. '<div class="auth-side__body">'
		. '<blockquote class="auth-side__quote">'
		. 'رُبَّ بَحْرٍ لَا يُرَوِّي · وَقَلِيلٍ لَا يَقِلُّ<br>'
		. 'أَوَّلُ الدَّرْبِ سُؤَالٌ · وَبِهَذَا لَا نَضِلُّ'
		. '</blockquote>'
		. '<cite class="auth-side__by">من فلسفة <span dir="ltr">Luv it</span></cite>'
		. '</div>'
		. '</aside>';
}, 5 );

/* ══════════════════════════════════════════════════════════════════════
   ٣ب · مبدّل «دخول / حساب جديد» · ٤ أيلول
   ══════════════════════════════════════════════════════════════════════
   ووكومرس بيطبع الفورمين **جنب بعض دايماً** وما بيعطي خطافاً يخفي وحدة.
   المراجع كلها بتعرض **فورماً واحداً** ورابط بيبدّل · وهاد أهدأ، خصوصاً
   على الموبايل حيث الفورمان بيصيروا عمودين طوال.

   ⚠️ والتبديل **بكلاس على `<body>` لا بحذف من الـDOM** · لأن ووكومرس
      بيرجّع رسائل الخطأ للفورم اللي انبعت، ولو كان محذوفاً الزبونة بتشوف
      خطأً بلا حقول. والكلاس بينحطّ **قبل أول رسم** من سكربت بالرأس عشان
      ما تقفز الصفحة.

   🔴 ولو الجافاسكربت وقف لأي سبب، **الفورمان بيضلّوا ظاهرين الاثنان** ·
      الإخفاء معلَّق على `body.auth-js` اللي بيحطّه السكربت نفسه. فشل
      السكربت بيرجّعنا للسلوك القديم لا لصفحة بلا فورم.
   ══════════════════════════════════════════════════════════════════════ */
add_action( 'woocommerce_login_form_end', function () {
	echo '<p class="auth-swap"><span>ما عندك حساب؟</span>'
		. '<button type="button" class="auth-swap__btn" data-auth-go="register">اعملي حساب</button></p>';
} );

add_action( 'woocommerce_register_form_end', function () {
	echo '<p class="auth-swap"><span>عندك حساب أصلاً؟</span>'
		. '<button type="button" class="auth-swap__btn" data-auth-go="login">سجّلي دخولك</button></p>';
} );

add_action( 'wp_head', function () {
	if ( ! function_exists( 'is_account_page' ) || ! is_account_page() || is_user_logged_in() ) {
		return;
	}
	/* 🔴 بالرأس لا بالتذييل · الكلاس لازم يكون موجوداً قبل أول رسم وإلا
	   الفورمان بيبيّنوا لحظة وبعدين وحدة بتختفي · قفزة مرئية. */
	echo "<script>(function(){var b=document.documentElement;b.classList.add('auth-js');"
		. "try{if(location.hash==='#register')b.classList.add('auth-register');}catch(e){}})();</script>";
}, 1 );

add_action( 'wp_footer', function () {
	if ( ! function_exists( 'is_account_page' ) || ! is_account_page() || is_user_logged_in() ) {
		return;
	}
	echo <<<'JS'
<script>
(function () {
  var root = document.documentElement;
  function go(which) {
    root.classList.toggle('auth-register', which === 'register');
    /* التركيز بينتقل لأول حقل بالفورم الجديد · بلاه قارئة الشاشة
       بتضل واقفة على زرّ اختفى. */
    var sel = which === 'register' ? '.register' : '.login';
    var f = document.querySelector(sel);
    if (f) {
      var first = f.querySelector('input:not([type=hidden])');
      if (first) { first.focus({ preventScroll: true }); }
    }
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('[data-auth-go]') : null;
    if (!b) { return; }
    e.preventDefault();
    go(b.getAttribute('data-auth-go'));
  });
  /* لو ووكومرس رجّع خطأ تسجيل، بنفتح فورم التسجيل لا الدخول · وإلا
     الزبونة بتشوف رسالة خطأ فوق فورم ما بعتته. */
  var err = document.querySelector('.woocommerce-error');
  if (err && /كلمة السر|الموبايل|تاريخ ميلادك|اسمك/.test(err.textContent)) {
    root.classList.add('auth-register');
  }
})();
</script>
JS;
}, 99 );

/* ══════════════════════════════════════════════════════════════════════
   ٣ب · سطر صغير فوق عنوان التسجيل · «أول مرة هون؟»
   ══════════════════════════════════════════════════════════════════════
   بخطاف جوّا الفورم (form-login.php: woocommerce_register_form_start)
   لا بـCSS content · الكوبي بالماركب عشان ينقرأ وينترجم وينفحص.
   ⚠️ الخطاف بينطلق **بعد** وسم <form> وقبل الحقول · وعنوان h2 «إنشاء حساب»
      فوقه بالقالب · فالسطر بيظهر تحت العنوان لا فوقه. §5.2b بيرفعه
      بصرياً بـorder داخل العمود لو لزم · وإلا بيضل تحته وبيقرا طبيعي.
   ══════════════════════════════════════════════════════════════════════ */
add_action( 'woocommerce_register_form_start', function () {
	echo '<p class="luvit-acct-first">أول مرة هون؟ بياخد دقيقة.</p>';
}, 5 );

/* ═════════════════════════════════════════════════
   ٤ · رأس صفحة «نسيت كلمة السر» و«كلمة سر جديدة» · ٢ أيلول
   ═════════════════════════════════════════════════
   الفورم كان بيطلع على أبيض بلا عنوان ولا غلاف (لقطة الفحص الليلي) ·
   نفس رأس الدخول عشان الزبونة تحس إنها لسا بنفس المكان.
   الخطافان من قوالب ووكومرس نفسها:
     myaccount/form-lost-password.php  → woocommerce_before_lost_password_form
     myaccount/form-reset-password.php → woocommerce_before_reset_password_form
   ⚠️ جملة «نسيتِ كلمة السر؟ اكتبي إيميلك…» موجودة أصلاً جوّا الفورم (gettext فوق)
      فالرأس ما بيعيدها · عنوانه قصير وسطره بيكمّلها.                       */
add_action( 'woocommerce_before_lost_password_form', function () {
	echo '<header class="luvit-acct-head luvit-acct-head--login">'
		. '<p class="luvit-acct-head__eyebrow">حسابك على <span dir="ltr">Luv it</span></p>'
		. '<h1 class="luvit-acct-head__title">كلمة سر جديدة</h1>'
		. '<p class="luvit-acct-head__sub">دقيقة وبترجعي لحسابك · الرابط بيوصل على إيميلك.</p>'
		. '</header>';
}, 5 );
add_action( 'woocommerce_before_reset_password_form', function () {
	echo '<header class="luvit-acct-head luvit-acct-head--login">'
		. '<p class="luvit-acct-head__eyebrow">حسابك على <span dir="ltr">Luv it</span></p>'
		. '<h1 class="luvit-acct-head__title">اختاري كلمة سر جديدة</h1>'
		. '<p class="luvit-acct-head__sub">مرتين عشان نتأكد إنها نفسها · وبعدها بتسجّلي دخولك فيها.</p>'
		. '</header>';
}, 5 );

/* ═════════════════════════════════════════════════
   ٥ · إشعار «قم بتأكيد عنوان بريدك» بتبويب الطلبات · **بيضل** · ٣ أيلول
   ═════════════════════════════════════════════════
   انشال لساعة (مسح $wp_filter · شوف الذاكرة wc-internal-hooks-remove-by-scan)
   ثم ريّان: «خلّي إشعار تأكيد البريد واتأكد إنها شغّالة والمنطق تبعها شغّال».
   فرجع · وهو ميزة ووكومرس 11: الزبونة بتضغط «تأكيد عنوان البريد» ← رابط
   لمرة وحدة على إيميلها ← بعد التأكيد طلبات الضيف القديمة بنفس الإيميل
   بتنربط بحسابها (woocommerce_customer_email_verified →
   wc_update_new_customer_past_orders). النصوص من ترجمة ووكومرس العربية. */

/* ══════════════════════════════════════════════════════════════════════
   ٦ · شاشة إكمال البيانات · /my-account/complete/ · ٤ أيلول
   ══════════════════════════════════════════════════════════════════════
   ريّان طلبها لما شرحت إنّ الدخول بجوجل بيجيب **الاسم والإيميل بس**،
   و**رقم الموبايل وتاريخ الميلاد ما بيجوا منه** · والموبايل هو الحقل
   التشغيلي عنّا لأن الدفع عند الاستلام بيمشي عليه.

   ── 🔴 وانبنت مستقلّة عن جوجل بقصد ──────────────────────────────────
   الشرط مش «سجّلت بجوجل» · هو **«حسابها ناقصه بيانات»**. فبتشتغل
   من هلق على:
     · حسابات انعملت من الشيك أوت (ووكومرس بيعملها بلا موبايل أحياناً)
     · الحسابات القديمة اللي سبقت حقول التسجيل الجديدة
     · وبكرا الداخلات بجوجل، بلا ولا سطر جديد
   ⤷ يعني ما بتقعد كود ميت بانتظار إضافة لسا ما انركّبت ·
     [[build-it-before-there-is-data]] · ريّان صحّحني بنفس النقطة قبل.

   ── ⚠️ وليش نداء مش حجز ────────────────────────────────────────────
   ما بتقفل الحساب ولا بتحوّل إجبارياً · بتحطّ بطاقة واضحة باللوحة
   وبتفتح الشاشة لمّا تضغط. الحجز الكامل بيحبس زبونة عندها طلب شغّال
   برّا حسابها، والشيك أوت أصلاً بيطلب الموبايل فما في خطر تشغيلي.

   🔴 وفخّ نقاط النهاية: بلا `flush_rewrite_rules` بترجّع 404 · محروس
      بخيار مرّة وحدة، ونفس القاعدة: بدّلت الاسم؟ بدّل اسم الخيار.
   ══════════════════════════════════════════════════════════════════════ */
add_action( 'init', function () {
	add_rewrite_endpoint( 'complete', EP_ROOT | EP_PAGES );

	if ( '1' !== get_option( 'luvit_complete_flushed' ) ) {
		flush_rewrite_rules();
		update_option( 'luvit_complete_flushed', '1' );
	}
} );

/** شو ناقص بحساب المستخدمة الحالية · بترجّع مصفوفة فاضية لو كامل. */
function luvit_profile_gaps() {
	if ( ! is_user_logged_in() ) {
		return array();
	}
	$uid  = get_current_user_id();
	$gaps = array();
	$name = trim( get_user_meta( $uid, 'first_name', true ) . ' ' . get_user_meta( $uid, 'last_name', true ) );
	if ( $name === '' ) {
		$gaps[] = 'name';
	}
	if ( trim( (string) get_user_meta( $uid, 'billing_phone', true ) ) === '' ) {
		$gaps[] = 'phone';
	}
	if ( trim( (string) get_user_meta( $uid, 'luvit_dob', true ) ) === '' ) {
		$gaps[] = 'dob';
	}
	return $gaps;
}

/* الحفظ · على `template_redirect` عشان الرسالة تبيّن بنفس الطلب */
add_action( 'template_redirect', function () {
	if ( ! isset( $_POST['luvit_complete_nonce'] ) || ! is_user_logged_in() ) {
		return;
	}
	if ( ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['luvit_complete_nonce'] ) ), 'luvit_complete' ) ) {
		wc_add_notice( 'انتهت الجلسة · جرّبي كمان مرة.', 'error' );
		return;
	}
	$uid  = get_current_user_id();
	$errs = 0;
	$gaps = luvit_profile_gaps();

	$name = isset( $_POST['luvit_c_name'] ) ? trim( sanitize_text_field( wp_unslash( $_POST['luvit_c_name'] ) ) ) : '';
	if ( $name !== '' ) {
		$parts = preg_split( '/\s+/', $name, 2 );
		update_user_meta( $uid, 'first_name', $parts[0] );
		update_user_meta( $uid, 'last_name', isset( $parts[1] ) ? $parts[1] : '' );
		update_user_meta( $uid, 'billing_first_name', $parts[0] );
		update_user_meta( $uid, 'billing_last_name', isset( $parts[1] ) ? $parts[1] : '' );
		wp_update_user( array( 'ID' => $uid, 'display_name' => $name ) );
	} elseif ( in_array( 'name', $gaps, true ) ) {
		wc_add_notice( 'اكتبي اسمك من فضلك.', 'error' );
		$errs++;
	}

	/* 🔴 نفس دالة التطبيع تبعت التسجيل · مصدر واحد لا نسخة ثالثة */
	$raw   = isset( $_POST['luvit_c_phone'] ) ? wp_unslash( $_POST['luvit_c_phone'] ) : '';
	$phone = function_exists( 'luvit_norm_phone' ) ? luvit_norm_phone( $raw ) : '';
	if ( $phone !== '' ) {
		update_user_meta( $uid, 'billing_phone', $phone );
	} elseif ( trim( (string) $raw ) !== '' ) {
		wc_add_notice( 'رقم الموبايل لازم يبدأ بـ07 ويكون عشر أرقام.', 'error' );
		$errs++;
	} elseif ( in_array( 'phone', $gaps, true ) ) {
		wc_add_notice( 'رقم الموبايل مطلوب · عليه منتواصل معك بالطلب.', 'error' );
		$errs++;
	}

	$dob = isset( $_POST['luvit_c_dob'] ) ? trim( sanitize_text_field( wp_unslash( $_POST['luvit_c_dob'] ) ) ) : '';
	if ( $dob !== '' && preg_match( '/^\d{4}-\d{2}-\d{2}$/', $dob ) && strtotime( $dob ) <= time() ) {
		update_user_meta( $uid, 'luvit_dob', $dob );
	} elseif ( $dob !== '' ) {
		wc_add_notice( 'اختاري تاريخ ميلادك.', 'error' );
		$errs++;
	} elseif ( in_array( 'dob', $gaps, true ) ) {
		wc_add_notice( 'اختاري تاريخ ميلادك.', 'error' );
		$errs++;
	}

	if ( $errs === 0 ) {
		wc_add_notice( 'تمام · بياناتك انحفظت.', 'success' );
		wp_safe_redirect( wc_get_account_endpoint_url( 'dashboard' ) );
		exit;
	}
}, 5 );

add_action( 'woocommerce_account_complete_endpoint', function () {
	$uid  = get_current_user_id();
	$gaps = luvit_profile_gaps();
	$name = trim( get_user_meta( $uid, 'first_name', true ) . ' ' . get_user_meta( $uid, 'last_name', true ) );

	/* ⚠️ العنوان بينعدّ · أول نسخة كتبت «بضل معلومتين» ثابتة، وحساب
	   الأدمن ناقصه **اثنتان** فطلعت صح بالصدفة. لو الناقص وحدة بتصير
	   الصفحة بتكذب برقم صغير · وهاد بيكفي. */
	$n     = count( $gaps );
	$count = $n === 1 ? 'معلومة وحدة' : ( $n === 2 ? 'معلومتين' : $n . ' معلومات' );

	/* ⚠️ والرأس نفسه بيتغيّر لمّا ما يكون في نقص · وإلا الصفحة بتقول
	   «بضل ٠ معلومات · خطوة أخيرة» وتحتها «بياناتك كاملة». */
	$eyebrow = $n ? 'خطوة أخيرة' : 'حسابك';
	$title   = $n ? 'بضل ' . $count : 'كلّه تمام';
	$sub     = $n
		? 'عشان نقدر نوصّلك الطلب ونحكي معك لو احتجنا · <strong>ما بتتنشر ولا بتنشارك مع حدا</strong>.'
		: 'ما في إشي ناقص بحسابك.';

	/* 🔴 **`h2` وكلاسات النادي · لا `luvit-acct-head` ولا `h1`.**
	   غلاف الحساب بيطبع تحيته على **كل** صفحة داخلية، فأول نسخة طلّعت
	   ترويستين فوق بعض و**ثلاث `h1` بصفحة وحدة** (مقيس: «حسابي» ·
	   «أهلاً، Luv it» · «بضل معلومتين»). وهاد كسر تخطيط وكسر دلالة سوا.
	   ⤷ والكلاسات هي نفسها تبعت `/my-account/club/` بقصد · صفحتان
	     جارتان بنفس السياق لازم يقرأوا نفس القراءة، وبلا ولا سطر CSS
	     جديد. [[one-template-across-pages-reads-as-default]] بالمقلوب:
	     التناسق هون مطلوب لأنّ السياق **فعلاً** واحد. */
	echo '<div class="luvit-complete luvit-drops">';
	echo '<p class="luvit-acct-card__eyebrow">' . esc_html( $eyebrow ) . '</p>'
		. '<h2 class="luvit-drops__title">' . esc_html( $title ) . '</h2>'
		. '<p class="luvit-drops__sub">' . $sub . '</p>';

	if ( ! $gaps ) {
		echo '<p class="luvit-complete__done">بياناتك كاملة · ما في إشي ناقص.</p>';
		echo '<a class="luvit-btn luvit-btn--arrow" href="' . esc_url( wc_get_account_endpoint_url( 'dashboard' ) ) . '">رجوع للوحة</a>';
		echo '</div>';
		return;
	}

	echo '<form class="woocommerce-form luvit-complete__form" method="post">';
	wp_nonce_field( 'luvit_complete', 'luvit_complete_nonce' );

	if ( in_array( 'name', $gaps, true ) ) {
		echo '<p class="woocommerce-form-row form-row form-row-wide">'
			. '<label for="luvit_c_name">الاسم&nbsp;<span class="required">*</span></label>'
			. '<input type="text" class="woocommerce-Input woocommerce-Input--text input-text"'
			. ' name="luvit_c_name" id="luvit_c_name" autocomplete="name"'
			. ' value="' . esc_attr( $name ) . '" required>'
			. '</p>';
	}
	if ( in_array( 'phone', $gaps, true ) ) {
		echo '<p class="woocommerce-form-row form-row form-row-wide">'
			. '<label for="luvit_c_phone">رقم الموبايل&nbsp;<span class="required">*</span></label>'
			. '<input type="tel" class="woocommerce-Input woocommerce-Input--text input-text"'
			. ' name="luvit_c_phone" id="luvit_c_phone" autocomplete="tel"'
			. ' inputmode="numeric" placeholder="07XXXXXXXX" required>'
			. '<span class="luvit-complete__hint">عليه منتواصل معك وقت التوصيل.</span>'
			. '</p>';
	}
	if ( in_array( 'dob', $gaps, true ) ) {
		$privacy = esc_url( home_url( '/privacy/' ) );
		echo '<p class="woocommerce-form-row form-row form-row-wide">'
			. '<label for="luvit_c_dob">تاريخ الميلاد&nbsp;<span class="required">*</span></label>'
			. '<input type="date" class="woocommerce-Input woocommerce-Input--text input-text"'
			. ' name="luvit_c_dob" id="luvit_c_dob" autocomplete="bday"'
			. ' max="' . esc_attr( gmdate( 'Y-m-d' ) ) . '" required>'
			. '<span class="luvit-complete__hint">منستعمله عشان التوصيات تناسب عمر بشرتك · '
			. '<a href="' . $privacy . '">سياسة الخصوصية</a>.</span>'
			. '</p>';
	}

	echo '<p class="form-row"><button type="submit" class="woocommerce-Button button luvit-btn">احفظي</button></p>';
	echo '</form>';
	echo '</div>';
} );

/* النداء باللوحة · بطاقة بتبيّن بس لو في نقص · وبتختفي لحالها لما يكتمل */
add_action( 'woocommerce_account_dashboard', function () {
	$gaps = luvit_profile_gaps();
	if ( ! $gaps ) {
		return;
	}
	$what = array();
	if ( in_array( 'name', $gaps, true ) ) {
		$what[] = 'اسمك';
	}
	if ( in_array( 'phone', $gaps, true ) ) {
		$what[] = 'رقم موبايلك';
	}
	if ( in_array( 'dob', $gaps, true ) ) {
		$what[] = 'تاريخ ميلادك';
	}

	echo '<div class="luvit-gap-call">'
		. '<p class="luvit-gap-call__title">بضل ' . esc_html( implode( ' و', $what ) ) . '</p>'
		. '<p class="luvit-gap-call__line">دقيقة وبتخلص · وبعدها طلباتك بتمشي بلا ما نسألك كل مرة.</p>'
		. '<a class="luvit-gap-call__btn" href="' . esc_url( wc_get_account_endpoint_url( 'complete' ) ) . '">كمّلي بياناتك</a>'
		. '</div>';
}, 4 );

/* ══════════════════════════════════════════════════════════════════════
   ٧ · زرّ «تابعي بجوجل» على فورمات ووكومرس · ٥ أيلول
   ══════════════════════════════════════════════════════════════════════
   Nextend المجانية بتركّب الزرّ على `wp-login.php` بس · وتركيبه على
   فورمات ووكومرس هو **الميزة اللي بتبيعها النسخة المدفوعة**.
   ⤷ وهي عملياً استدعاء شورتكود بخطّاف · فانكتبت هون.

   🔴 **والمكان مقصود** · فوق الحقول لا تحتها.
      الزرّ اللي بينحط بعد «دخول» بيقرا كخيار احتياطي، والزبونة بتكون
      خلّصت كتابة إيميلها قبل ما تشوفه. وفوق الحقول بيقرا كطريق أول ·
      وهاد اللي بمراجع ريّان الثلاثة كلها.

   ⚠️ **وبيتحقّق إنّ الإضافة شغّالة قبل ما يطبع** · لو انعطّلت أو
      انحذفت، الشورتكود بيطلع **نصّاً خاماً** على الصفحة بدل زرّ.
      `shortcode_exists()` بتمنع هالفئة كلها.

   ⚠️ ونصّ الزرّ نفسه بينكتب من Nextend (إنجليزي افتراضاً) · فبينتعرّب
      بالـCSS عبر `content` لا بتعديل الإضافة، عشان تحديثها ما يدهسه.
   ══════════════════════════════════════════════════════════════════════ */
function luvit_google_button() {

	if ( ! shortcode_exists( 'nextend_social_login' ) ) {
		return;
	}

	echo '<div class="luvit-social">';
	/* ⚠️ **مخرَج الإضافة بينتعدّل هون لا الإضافة نفسها** · أي تحديث إلها
	   بيدهس أي تعديل جوّاها، وهاد بيضل شغّالاً.

	   وثلاث حركات بالترتيب:
	     أ · النصّ بالعربي (الإضافة بتطبعه إنجليزياً وما بتخلّينا نغيّره ·
	         جرّبنا حقل `login_label` وردّ **رفض صامت**).
	     ب · الرابط بياخد كلاسات زرّنا · فبيرث الحبّة والحدّ والفقاعة
	         من `tokens.css` و`motion.js` بلا سطر إضافي.
	         ⤷ ومستمع الفقاعة **مفوَّض على `.luvit-btn`**، فبيمسك
	           الزرّ حتى لو انحقن بعد تحميل الصفحة.
	     ج · `aria-label` كان فيه `<b>` حرفياً · قارئ الشاشة بيلفظها.

	   🔴 وكل استبدال **بعدد** · لو الإضافة غيّرت ماركبها بيفشل الاستبدال
	      وبيطلع الزرّ الإنجليزي الأصلي · مش صفحة مكسورة.
	      [[silent-refusals-hide-in-the-response]] */
	$btn = do_shortcode( '[nextend_social_login provider="google"]' );

	$btn = preg_replace(
		'#(<div class="nsl-button-label-container">).*?(</div>)#s',
		'${1}تابعي بحساب <b>جوجل</b>${2}',
		$btn,
		1
	);

	$btn = preg_replace(
		'#aria-label="[^"]*"#',
		'aria-label="تابعي بحساب جوجل"',
		$btn,
		1
	);

	$btn = preg_replace(
		'#<a (?=href="[^"]*loginSocial)#',
		'<a class="luvit-btn luvit-btn--ghost luvit-social__btn" ',
		$btn,
		1
	);

	echo $btn;


	echo '<p class="luvit-social__or"><span>أو بالبريد</span></p>';
	echo '</div>';
}

/* الدخول · قبل الحقول مباشرة */
add_action( 'woocommerce_login_form_start', 'luvit_google_button', 5 );

/* التسجيل · نفس المكان
   ⚠️ وأولوية 4 عشان يسبق حقلَي الاسم والموبايل اللي بـwoo.php (أولوية 5) */
add_action( 'woocommerce_register_form_start', 'luvit_google_button', 4 );
