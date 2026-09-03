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
		. '<p class="luvit-acct-head__sub">طلباتك وعناوينك وقطراتك · كلها هون بمكان واحد.</p>'
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
	$u_drops  = esc_url( wc_get_account_endpoint_url( 'drops' ) );
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

	/* ── قطراتك ── */
	echo '<article class="luvit-acct-card luvit-acct-card--drops">';
	echo '<p class="luvit-acct-card__eyebrow">قطراتك</p>';
	echo '<h3 class="luvit-acct-card__title">قيد التجهيز</h3>';
	echo '<p class="luvit-acct-card__line">كل طلبية بتجمّعلك قطرات · وشو بتعمل فيهن منقولك أول ما يجهز البرنامج.</p>';
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
	echo '<header class="luvit-acct-head luvit-acct-head--login">'
		. '<p class="luvit-acct-head__eyebrow">حسابك على <span dir="ltr">Luv it</span></p>'
		. '<h1 class="luvit-acct-head__title">أهلاً فيكِ</h1>'
		. '<p class="luvit-acct-head__sub">سجّلي دخولك، أو اعملي حساباً بدقيقة · عشان تتابعي طلباتك وتحفظي عنوانك.</p>'
		. '</header>';
}, 5 );

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

