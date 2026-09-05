<?php
/**
 * Plugin Name: LUVIT · تأكيد التسليم
 * Description: سجلّ تسليم لا بينمسح · وصفحة ضغطة وحدة للمندوب · أساس التسوية مع شركة التوصيل.
 * Version: 1.0.0
 */

/* ══════════════════════════════════════════════════════════════════════
   LUVIT · تأكيد التسليم · ٥ أيلول ٢٠٢٦
   ══════════════════════════════════════════════════════════════════════

   بالدفع عند الاستلام، ووكومرس **ما بيعرف أبداً** إنّ الطلب وصل وتحاسب.
   بيحطّه على `processing` لحظة الشراء وبيضلّه هناك. وهاد الملف بيخلق
   هاللحظة: رابط موقّع لكل طلبية، المندوب بيفتحه وبيضغط، والضغطة بتكتب
   سطراً بسجلّ **ما بينعدّل ولا بينمسح**.

   ── 🔴 ليش ملف مش سنيبت WPCode ──────────────────────────────────────
   سببان، والاتنين قاطعان:

   ١ · **السرعة.** ريّان: «لازم الفلو يكون شغّال مليون بالمية، خصوصاً
       عالتلفون وسريع كثير، عشان المندوب ما يتحجّج إنه مش شغّال الموقع».
       سنيبتات WPCode بتشتغل **كإضافة**، يعني بعد ما ووكومرس وإلمنتور
       ولايت سبيد ووردفنس ينتحمّلوا كلهم. هون بنمسك الطلب على
       `muplugins_loaded` · **قبل ما ولا وحدة منهن تنتحمّل أصلاً**.
       مش «بنخفّفهن» · هنّ ما بينشتغلن.

   ٢ · **ما إله زرّ إطفاء.** ملفات `mu-plugins` ما بتنعطّل من اللوحة.
       ومنطق بيقرّر تسوية مالية ما بيصير حدا يطفّيه بضغطة.
       [[wpcode-saves-the-other-textarea]]

   ── ⚠️ وشو بيترتّب على `muplugins_loaded` ────────────────────────────
   بهاي اللحظة `pluggable.php` **لساها ما انتحمّلت**، يعني:
     • ولا `wp_verify_nonce()` ولا `wp_salt()` ولا `wp_mail()`
       ⤷ فالتوقيع بـ`hash_hmac()` تبع PHP نفسها ومفتاح مستقل
     • و`wp_magic_quotes()` ما اشتغلت · **`$_POST` خام**
       ⤷ **ممنوع `wp_unslash()`** هون · بتزيد شرطات مالها لزوم

   ⤷ و`$wpdb` وكاش الكائنات و`get_option()` كلهن **جاهزين** بهاللحظة.

   ── ⚠️ والرابط بيفتح كذا مرة · وضغطة المصاري وحدها ما بتنعاد ─────────
   المندوب بيفتحه أربع مرات (تواصلنا · بالطريق · تسلّمت). رابط بيموت من
   أول فتحة **بيصنّع نفس الحجّة اللي بدنا نشيلها**.

   ── 🔴 والسجلّ مش حالة الطلب ────────────────────────────────────────
   حالة الطلب **أي أدمن بيقدر يغيّرها** والبلجنز بتكتب عليها · فما
   بتصلح أساس تسوية. السجلّ جدول **بينكتب فيه وبس**، وحالة الطلب صارت
   **انعكاساً** له لا مصدره.
   ══════════════════════════════════════════════════════════════════════ */

defined( 'ABSPATH' ) || exit;

const LUVIT_D_TABLE_VER = '1';

/* أبجدية بلا `0 O 1 I L` · المندوب بيكتب الرمز بإيده لمّا الرابط يخرب،
   وحرف ملتبس بيخلق فشلاً بيبيّن كأنه عطل بالنظام. */
const LUVIT_D_ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';

/* المراحل · بالترتيب. الرقم بيمنع الرجوع للورا.

   🔴 **وما في زرّ «ما ردّت» · بقصد، وريّان هو اللي شالها.**
   السبب إنّ «ما ردّت» **حالة عابرة**: المندوب بيرنّ وما بترد، وبعد
   ساعة بيرنّ وبترد. فتسجيلها بتخلق ضجيجاً وحالة ميتة بالسجلّ.

   ⤷ **والغياب هو الإشارة.** طلبية قاعدة على `received` وما انضغط
     عليها `answered` معناها الزبونة ما بترد · بلا ما يعمل المندوب
     أي إشي. التنبيه اليومي بيمسكها، وكل ضغطة بنشيلها من على المندوب
     هي ضغطة أقل معرّضة إنها ما تنعمل. */
function luvit_d_stages() {
	return array(
		'new'       => array( 'n' => 0, 'label' => 'طلب جديد' ),
		'received'  => array( 'n' => 1, 'label' => 'استلمنا البضاعة' ),
		'answered'  => array( 'n' => 2, 'label' => 'ردّت واتفقنا على الموعد' ),
		'delivered' => array( 'n' => 3, 'label' => 'تسلّمت والمبلغ محصّل' ),
		'refused'   => array( 'n' => 3, 'label' => 'رفضت الاستلام' ),
	);
}

/* ══════════════════════════════════════════════════════════════════════
   ١ · الرمز · موقّع ومشتق · بلا جدول بحث
   ══════════════════════════════════════════════════════════════════════
   الشكل `<رقم الطلب بأبجديتنا>-<٨ خانات توقيع>` مثل `3F-K7QM2XBR`.
   فبنقدر نقرا رقم الطلب من الرمز ونتحقّق من التوقيع · بلا ما نخزّن ولا
   نفهرس ولا نخاف من تصادم.

   ⚠️ و`hash_equals` لا `===` · المقارنة العادية بتفضح الفرق بالتوقيت.
   ══════════════════════════════════════════════════════════════════════ */

function luvit_d_secret() {
	return defined( 'LUVIT_D_SECRET' ) ? LUVIT_D_SECRET : '';
}

function luvit_d_b32( $n ) {
	$a = LUVIT_D_ALPHABET;
	$len = strlen( $a );
	$out = '';
	$n = (int) $n;
	if ( $n === 0 ) {
		return $a[0];
	}
	while ( $n > 0 ) {
		$out = $a[ $n % $len ] . $out;
		$n = intdiv( $n, $len );
	}
	return $out;
}

function luvit_d_unb32( $s ) {
	$a = LUVIT_D_ALPHABET;
	$len = strlen( $a );
	$n = 0;
	$s = strtoupper( $s );
	for ( $i = 0, $L = strlen( $s ); $i < $L; $i++ ) {
		$p = strpos( $a, $s[ $i ] );
		if ( $p === false ) {
			return 0;
		}
		$n = $n * $len + $p;
	}
	return $n;
}

function luvit_d_sig( $order_id ) {
	$secret = luvit_d_secret();
	if ( $secret === '' ) {
		return '';
	}
	$raw = hash_hmac( 'sha256', 'luvit-delivery|v1|' . (int) $order_id, $secret, true );
	$a   = LUVIT_D_ALPHABET;
	$len = strlen( $a );
	$out = '';
	for ( $i = 0; $i < 8; $i++ ) {
		$out .= $a[ ord( $raw[ $i ] ) % $len ];
	}
	return $out;
}

function luvit_d_token( $order_id ) {
	$sig = luvit_d_sig( $order_id );
	return $sig === '' ? '' : luvit_d_b32( $order_id ) . '-' . $sig;
}

/* بترجّع رقم الطلب أو 0 · وما بتلمس قاعدة البيانات أبداً */
function luvit_d_parse( $token ) {
	$token = strtoupper( preg_replace( '/[^0-9A-Za-z\-]/', '', (string) $token ) );
	$parts = explode( '-', $token );
	if ( count( $parts ) !== 2 || $parts[0] === '' || strlen( $parts[1] ) !== 8 ) {
		return 0;
	}
	$id = luvit_d_unb32( $parts[0] );
	if ( $id <= 0 ) {
		return 0;
	}
	$expect = luvit_d_sig( $id );
	if ( $expect === '' || ! hash_equals( $expect, $parts[1] ) ) {
		return 0;
	}
	return $id;
}

/* ══════════════════════════════════════════════════════════════════════
   ٢ · الجدول · بينكتب فيه وبس
   ══════════════════════════════════════════════════════════════════════
   ولا `UPDATE` ولا `DELETE` بهاد الملف · بالقصد. الحالة الحالية بتنقرا
   من **آخر سطر**، والتاريخ كله بيضل محفوظاً للتسوية.

   ⚠️ و`dbDelta` بـ`wp-admin/includes/upgrade.php` وما بتنتحمّل بمسارنا
      السريع · فالإنشاء بيصير على `admin_init` بـSQL خام.
   ══════════════════════════════════════════════════════════════════════ */

function luvit_d_table() {
	global $wpdb;
	return $wpdb->prefix . 'luvit_delivery_log';
}

function luvit_d_maybe_install() {
	if ( get_option( 'luvit_d_ver' ) === LUVIT_D_TABLE_VER ) {
		return;
	}
	global $wpdb;
	$t = luvit_d_table();
	$charset = $wpdb->get_charset_collate();
	$wpdb->query(
		"CREATE TABLE IF NOT EXISTS {$t} (
			id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
			order_id BIGINT UNSIGNED NOT NULL,
			stage VARCHAR(20) NOT NULL,
			amount DECIMAL(10,3) NULL,
			source VARCHAR(20) NOT NULL,
			request_id VARCHAR(40) NULL,
			ip VARCHAR(45) NULL,
			ua VARCHAR(255) NULL,
			created_at DATETIME NOT NULL,
			PRIMARY KEY (id),
			KEY order_id (order_id),
			KEY created_at (created_at),
			UNIQUE KEY request_id (request_id)
		) {$charset}"
	);
	update_option( 'luvit_d_ver', LUVIT_D_TABLE_VER, false );
}

/* ⚠️ `request_id` فريد · فإعادة إرسال نفس الضغطة (شبكة رجّعت، ضغط
   مرتين، إعادة تحميل) **بتنرفض من قاعدة البيانات نفسها** لا من كودنا.
   وهاد أمتن من أي فحص بالتطبيق. */
function luvit_d_write( $order_id, $stage, $source, $request_id = null, $amount = null ) {
	global $wpdb;
	$ua = isset( $_SERVER['HTTP_USER_AGENT'] ) ? substr( (string) $_SERVER['HTTP_USER_AGENT'], 0, 255 ) : '';
	$ip = isset( $_SERVER['REMOTE_ADDR'] ) ? substr( (string) $_SERVER['REMOTE_ADDR'], 0, 45 ) : '';
	$ok = (bool) $wpdb->insert(
		luvit_d_table(),
		array(
			'order_id'   => (int) $order_id,
			'stage'      => $stage,
			'amount'     => $amount,
			'source'     => $source,
			'request_id' => $request_id,
			'ip'         => $ip,
			'ua'         => $ua,
			'created_at' => gmdate( 'Y-m-d H:i:s' ),
		),
		array( '%d', '%s', '%s', '%s', '%s', '%s', '%s', '%s' )
	);

	/* الراية · بيقراها العامل بـ`woo.php` بطلب عادي وبيعكس السطر على
	   حالة الطلب. **الفتحات ما بترفعها** · هي مش حدث بيغيّر شي.
	   ⚠️ وخيار محمَّل مسبقاً بقصد · قراءته بالطلبات التانية **ببلاش**،
	      فما في استعلام زيادة على كل صفحة بالموقع. */
	if ( $ok && 'view' !== $stage ) {
		update_option( 'luvit_d_dirty', 1 );
	}

	return $ok;
}

function luvit_d_current_stage( $order_id ) {
	global $wpdb;
	$t = luvit_d_table();
	$row = $wpdb->get_var(
		$wpdb->prepare(
			"SELECT stage FROM {$t} WHERE order_id = %d AND stage <> 'view' ORDER BY id DESC LIMIT 1",
			(int) $order_id
		)
	);
	return $row ? $row : 'new';
}

/* ══════════════════════════════════════════════════════════════════════
   ٣ · حالة «بالطريق» · بتنسجّل دايماً لا بس بمسار `/d/`
   ══════════════════════════════════════════════════════════════════════
   ⚠️ ووكومرس بيسجّل حالاته على `init` أولوية 9 · فلازم نيجي بعده.
   ⚠️ و`show_in_admin_all_list` و`show_in_admin_status_list` **الاتنين
      إلزاميين** · بلا واحدة منهن الحالة بتصير موجودة و**غير مرئية**.
   ══════════════════════════════════════════════════════════════════════ */

add_action(
	'init',
	function () {
		register_post_status(
			'wc-luvit-shipped',
			array(
				'label'                     => 'بالطريق',
				'public'                    => false,
				'exclude_from_search'       => false,
				'show_in_admin_all_list'    => true,
				'show_in_admin_status_list' => true,
				'label_count'               => _n_noop( 'بالطريق (%s)', 'بالطريق (%s)' ),
			)
		);
	},
	10
);

add_filter(
	'wc_order_statuses',
	function ( $statuses ) {
		$out = array();
		foreach ( $statuses as $key => $label ) {
			$out[ $key ] = $label;
			if ( 'wc-processing' === $key ) {
				$out['wc-luvit-shipped'] = 'بالطريق';
			}
		}
		return $out;
	}
);

add_action( 'admin_init', 'luvit_d_maybe_install' );

/* ══════════════════════════════════════════════════════════════════════
   ٤ · الحارس · بيكلّف باقي الموقع `strncmp` واحد
   ══════════════════════════════════════════════════════════════════════ */

$luvit_d_uri = isset( $_SERVER['REQUEST_URI'] ) ? (string) $_SERVER['REQUEST_URI'] : '';
$luvit_d_path = strtok( $luvit_d_uri, '?' );
if ( $luvit_d_path !== '/d' && $luvit_d_path !== '/d/' && strncmp( $luvit_d_path, '/d/', 3 ) !== 0 ) {
	return;
}

/* 🔴 **نفس الملف بيشتغل بمكانين · بقصد.**

   ما في PHP على جهاز ريّان نفحص فيه الصياغة قبل الرفع · وخطأ صياغة
   بملف `mu-plugins` بيوقّف **الموقع كله** وما إله زرّ إطفاء باللوحة.

   فالنشر بيصير على مرحلتين:
     ١ · `wp-content/plugins/` كإضافة عادية · **ووردبريس بيفحصها عند
         التفعيل وبيرفضها لو فيها خطأ، بدل ما يكسر الموقع**
     ٢ · وبعد ما تثبت، بتنتقل لـ`wp-content/mu-plugins/` للسرعة

   ⚠️ ووقت ما تكون إضافة عادية، `muplugins_loaded` **بتكون انطلقت
      خلاص** · فالتعليق عليها بيخلّي الصفحة ما تشتغل أبداً ويبيّن
      كأنّ الكود غلط. `did_action()` بتكشف الحالة وبتعلّق على
      `plugins_loaded` بدلها.
   ⤷ وقتها بتشتغل الصفحة **صح بس أبطأ** (ووكومرس بيكون انتحمّل) ·
     وهاد كافي للفحص، مش كافي للإطلاق. */
$luvit_d_hook = did_action( 'muplugins_loaded' ) ? 'plugins_loaded' : 'muplugins_loaded';
add_action( $luvit_d_hook, 'luvit_d_router', 0 );

/* ══════════════════════════════════════════════════════════════════════
   ٥ · قراءة الطلب · بـSQL خام لأنّ ووكومرس ما انتحمّل
   ══════════════════════════════════════════════════════════════════════
   🔴 **ما بنقدر نستعمل `wc_get_order()`** هون · هي أول ثمن للسرعة.
   والقراءة بتدعم التخزينين: جدول ووكومرس الجديد (HPOS) وجدول التدوينات
   القديم · **والفحص بوجود الجدول لا بافتراض**.

   ⚠️ والصفحة **ما بتوري عنوان الزبونة ولا رقمها** بقصد · رقم الطلب
      والمنطقة والمبلغ وبس. العنوان واصل للشركة بالقناة العادية، فما في
      داعي نكرّره برابط ممكن ينمرّر لعشرين واحد.
   ══════════════════════════════════════════════════════════════════════ */
function luvit_d_read_order( $order_id ) {
	global $wpdb;

	$hpos = $wpdb->prefix . 'wc_orders';
	$has_hpos = (bool) $wpdb->get_var( $wpdb->prepare( 'SHOW TABLES LIKE %s', $hpos ) );

	if ( $has_hpos ) {
		$row = $wpdb->get_row(
			$wpdb->prepare(
				"SELECT id, status, total_amount, currency FROM {$hpos} WHERE id = %d AND type = 'shop_order'",
				(int) $order_id
			),
			ARRAY_A
		);
		if ( ! $row ) {
			return null;
		}
		$addr = $wpdb->prefix . 'wc_order_addresses';
		$city = $wpdb->get_var(
			$wpdb->prepare(
				"SELECT city FROM {$addr} WHERE order_id = %d AND address_type = 'shipping' LIMIT 1",
				(int) $order_id
			)
		);
		return array(
			'id'     => (int) $row['id'],
			'status' => (string) $row['status'],
			'total'  => (float) $row['total_amount'],
			'city'   => (string) ( $city ? $city : '' ),
		);
	}

	$row = $wpdb->get_row(
		$wpdb->prepare(
			"SELECT ID, post_status FROM {$wpdb->posts} WHERE ID = %d AND post_type = 'shop_order'",
			(int) $order_id
		),
		ARRAY_A
	);
	if ( ! $row ) {
		return null;
	}
	$meta = $wpdb->get_results(
		$wpdb->prepare(
			"SELECT meta_key, meta_value FROM {$wpdb->postmeta}
			 WHERE post_id = %d AND meta_key IN ('_order_total','_shipping_city')",
			(int) $order_id
		),
		ARRAY_A
	);
	$m = array();
	foreach ( (array) $meta as $r ) {
		$m[ $r['meta_key'] ] = $r['meta_value'];
	}
	return array(
		'id'     => (int) $row['ID'],
		'status' => (string) $row['post_status'],
		'total'  => isset( $m['_order_total'] ) ? (float) $m['_order_total'] : 0.0,
		'city'   => isset( $m['_shipping_city'] ) ? (string) $m['_shipping_city'] : '',
	);
}

/* ══════════════════════════════════════════════════════════════════════
   ٦ · حدّ المحاولات · على الرمز المكتوب بالإيد
   ══════════════════════════════════════════════════════════════════════
   الرمز النصّي بابٌ مفتوح للتخمين لو تُرك بلا حدّ · والعدّاد بالكاش
   لأنه ما بده يعيش أكثر من نافذته.
   ══════════════════════════════════════════════════════════════════════ */
function luvit_d_throttle( $bucket, $max, $window ) {
	$ip  = isset( $_SERVER['REMOTE_ADDR'] ) ? (string) $_SERVER['REMOTE_ADDR'] : '0';
	$key = 'luvit_d_' . $bucket . '_' . md5( $ip );
	$n   = (int) get_transient( $key );
	if ( $n >= $max ) {
		return false;
	}
	set_transient( $key, $n + 1, $window );
	return true;
}

/* ══════════════════════════════════════════════════════════════════════
   ٧ · الصفحة · مكتفية بذاتها · ولا طلب إضافي واحد
   ══════════════════════════════════════════════════════════════════════
   ولا CSS خارجي ولا خط ولا صورة ولا أيقونة · كل شي جوّا الصفحة، فبتوصل
   **بجولة ذهاب وإياب وحدة**. وعلى شبكة ضعيفة اللي بيقتل مش الحجم، هو
   عدد الجولات.

   ⚠️ ولا خطوط ويب · خط النظام العربي على أندرويد بيرسم فوراً، وأي خط
      منزّل بيأخّر الرسم على نفس الشبكة اللي بنصمّم إلها.
   ══════════════════════════════════════════════════════════════════════ */
function luvit_d_page( $title, $body, $code = 200 ) {
	if ( ! headers_sent() ) {
		luvit_d_status( $code );
		header( 'Content-Type: text/html; charset=utf-8' );
		header( 'Cache-Control: no-store, no-cache, must-revalidate, max-age=0' );
		header( 'X-LiteSpeed-Cache-Control: no-cache' );
		header( 'X-Robots-Tag: noindex, nofollow' );
		header( 'Referrer-Policy: no-referrer' );
	}
	echo '<!doctype html><html dir="rtl" lang="ar"><head><meta charset="utf-8">'
		. '<meta name="viewport" content="width=device-width,initial-scale=1">'
		. '<title>' . $title . '</title><style>'
		. ':root{--a:#29A9C0;--d:#1A2529;--g:#F2F7F9;--ok:#3F8F72;--no:#B24B3C}'
		. '*{box-sizing:border-box}'
		. 'body{margin:0;padding:16px;font:16px/1.6 system-ui,"Segoe UI",Tahoma,sans-serif;'
		. 'color:var(--d);background:var(--g);-webkit-text-size-adjust:100%}'
		. '.c{max-width:420px;margin:0 auto;background:#fff;border-radius:14px;padding:18px}'
		. 'h1{margin:0 0 4px;font-size:19px}'
		. '.m{font-size:30px;font-weight:700;color:var(--a);margin:10px 0}'
		. '.r{color:#47555B;font-size:14px;margin:2px 0}'
		. 'button{display:block;width:100%;margin:10px 0 0;padding:16px;font:600 17px/1.2 inherit;'
		. 'color:#fff;background:var(--a);border:0;border-radius:12px;cursor:pointer}'
		. 'button.g{background:var(--ok)}button.b{background:var(--no)}'
		. 'button.o{background:#fff;color:var(--d);border:1.5px solid #E1E9EC}'
		. 'button[disabled]{opacity:.5}'
		. '#s{margin-top:12px;padding:10px;border-radius:10px;font-size:15px;display:none}'
		. '#s.w{display:block;background:#FDF4E3;color:#B07A22}'
		. '#s.e{display:block;background:#FBEDEA;color:var(--no)}'
		. 'input{width:100%;padding:14px;font:17px inherit;border:1.5px solid #E1E9EC;'
		. 'border-radius:12px;text-align:center;letter-spacing:.08em}'
		. '</style></head><body><div class="c">' . $body . '</div></body></html>';
	exit;
}

/* بديل `status_header()` · وهي بـ`wp-includes/functions.php` ومتاحة،
   بس بتستدعي فلاتر ما انسجّلت بعد · فبنكتب الترويسة مباشرة. */
function luvit_d_status( $code ) {
	$map = array( 200 => 'OK', 400 => 'Bad Request', 404 => 'Not Found', 429 => 'Too Many Requests' );
	$txt = isset( $map[ $code ] ) ? $map[ $code ] : 'OK';
	header( 'HTTP/1.1 ' . (int) $code . ' ' . $txt, true, (int) $code );
}

function luvit_d_esc( $s ) {
	return htmlspecialchars( (string) $s, ENT_QUOTES, 'UTF-8' );
}

/* ══════════════════════════════════════════════════════════════════════
   ٨ · الموجّه
   ══════════════════════════════════════════════════════════════════════
   🔴 **ولا تغيير حالة على `GET`** · واتساب وبرامج فحص البريد بتفتح
      الروابط لحالها عشان تعمل معاينة · فـ`GET` بيغيّر حالة يعني
      طلبيات بتنأكّد لحالها.
   ══════════════════════════════════════════════════════════════════════ */
function luvit_d_router() {

	if ( luvit_d_secret() === '' ) {
		luvit_d_page( 'غير مهيّأ', '<h1>الصفحة مش جاهزة</h1><p class="r">تواصل مع إدارة المتجر.</p>', 200 );
	}

	$path  = strtok( isset( $_SERVER['REQUEST_URI'] ) ? (string) $_SERVER['REQUEST_URI'] : '', '?' );
	$token = trim( substr( $path, 3 ), '/' );
	$post  = ( isset( $_SERVER['REQUEST_METHOD'] ) && 'POST' === $_SERVER['REQUEST_METHOD'] );

	/* ⚠️ `$_POST` خام هون · `wp_magic_quotes()` ما اشتغلت · ممنوع `wp_unslash` */
	if ( $token === '' && $post && isset( $_POST['code'] ) ) {
		if ( ! luvit_d_throttle( 'code', 5, 600 ) ) {
			luvit_d_page( 'كثير محاولات', '<h1>كثير محاولات</h1><p class="r">استنّى عشر دقايق وجرّب كمان مرة.</p>', 429 );
		}
		$token = (string) $_POST['code'];
	}

	/* الرمز بالإيد · لمّا الرابط ينكسر بالواتساب أو بفلتر بريد */
	if ( $token === '' ) {
		luvit_d_page(
			'تأكيد التسليم',
			'<h1>اكتب رمز الطلب</h1>'
			. '<p class="r">الرمز مكتوب جنب الرابط بنفس الرسالة.</p>'
			. '<form method="post" action="/d"><input name="code" placeholder="3F-K7QM2XBR" '
			. 'autocapitalize="characters" autocomplete="off" required>'
			. '<button type="submit">افتح</button></form>'
		);
	}

	$order_id = luvit_d_parse( $token );
	if ( $order_id <= 0 ) {
		luvit_d_page(
			'رمز غير صحيح',
			'<h1>الرمز مش مضبوط</h1><p class="r">راجع الرمز أو الرابط، وإذا ضلّ نفس الإشي تواصل مع المتجر.</p>'
			. '<form method="post" action="/d"><input name="code" placeholder="3F-K7QM2XBR" '
			. 'autocapitalize="characters" autocomplete="off" required>'
			. '<button type="submit">جرّب كمان مرة</button></form>',
			404
		);
	}

	$order = luvit_d_read_order( $order_id );
	if ( ! $order ) {
		luvit_d_page( 'الطلب مش موجود', '<h1>الطلب مش موجود</h1><p class="r">تواصل مع إدارة المتجر.</p>', 404 );
	}

	$stages = luvit_d_stages();
	$now    = luvit_d_current_stage( $order_id );

	/* ── الضغطة ─────────────────────────────────────────────────────── */
	if ( $post && isset( $_POST['stage'] ) ) {
		$stage = (string) $_POST['stage'];
		$rid   = isset( $_POST['rid'] ) ? substr( preg_replace( '/[^a-zA-Z0-9]/', '', (string) $_POST['rid'] ), 0, 40 ) : '';

		if ( ! isset( $stages[ $stage ] ) || 'new' === $stage || $rid === '' ) {
			luvit_d_page( 'خطأ', '<h1>ما زبطت</h1><p class="r">أعد تحميل الصفحة وجرّب كمان مرة.</p>', 400 );
		}

		$amount = ( 'delivered' === $stage ) ? number_format( (float) $order['total'], 3, '.', '' ) : null;

		/* بترجّع false لو `request_id` مكرّر · وهاي **نجاح** لا فشل:
		   يعني الضغطة وصلت قبل والشبكة بس ما رجّعت الجواب. */
		luvit_d_write( $order_id, $stage, 'link', $rid, $amount );

		$now = luvit_d_current_stage( $order_id );
		luvit_d_receipt( $order_id, $now, $order, $stages );
	}

	/* ── العرض ──────────────────────────────────────────────────────── */
	luvit_d_write( $order_id, 'view', 'link', null, null );

	if ( in_array( $now, array( 'delivered', 'refused' ), true ) ) {
		luvit_d_receipt( $order_id, $now, $order, $stages );
	}

	$n = $stages[ $now ]['n'];
	$b = '<h1>طلب رقم ' . (int) $order_id . '</h1>';
	if ( $order['city'] !== '' ) {
		$b .= '<p class="r">' . luvit_d_esc( $order['city'] ) . '</p>';
	}
	$b .= '<p class="r">المطلوب تحصيله</p>'
		. '<div class="m">' . number_format( (float) $order['total'], 2 ) . ' د.أ</div>'
		. '<p class="r">الحالة: ' . luvit_d_esc( $stages[ $now ]['label'] ) . '</p>'
		. '<form method="post" id="f">'
		. '<input type="hidden" name="stage" id="st"><input type="hidden" name="rid" id="rid">';

	/* الأزرار اللي إلها معنى بس · حسب المرحلة.
	   ⚠️ وكل ضغطة بترسل إيميلاً للزبونة · فالترتيب هو قصّتها هي، لا
	      تصنيفاً داخلياً إلنا. */
	if ( $n < 1 ) {
		$b .= '<button data-s="received">استلمنا البضاعة</button>';
	}
	if ( $n < 2 ) {
		$b .= '<button data-s="answered">ردّت واتفقنا على الموعد</button>';
	}
	$b .= '<button class="g" data-s="delivered">تسلّمت والمبلغ محصّل</button>'
		. '<button class="b" data-s="refused">رفضت الاستلام</button>'
		. '</form><div id="s"></div>';

	/* ⚠️ الحالات الأربع **بتبيّن** · فاضية / بتبعت / انحفظت / ما انحفظت.
	   ضغطة غامضة أسوأ من ضغطة فشلت بوضوح، لأنّ التسوية معلّقة عليها. */
	$b .= '<script>(function(){'
		. 'var f=document.getElementById("f"),s=document.getElementById("s"),busy=0;'
		. 'function rid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,10)}'
		. 'f.addEventListener("click",function(e){'
		. 'var b=e.target.closest("button[data-s]");if(!b||busy)return;e.preventDefault();'
		. 'busy=1;document.getElementById("st").value=b.dataset.s;'
		. 'var r=rid();document.getElementById("rid").value=r;'
		. 'try{localStorage.setItem("luvit_d_pending",r)}catch(x){}'
		. 's.className="w";s.textContent="بتبعت...";'
		. '[].forEach.call(f.querySelectorAll("button"),function(x){x.disabled=true});'
		. 'var n=0;(function go(){n++;'
		. 'var d=new FormData(f);'
		. 'fetch(location.pathname,{method:"POST",body:d,credentials:"omit"})'
		. '.then(function(res){return res.text()})'
		. '.then(function(html){document.open();document.write(html);document.close();'
		. 'try{localStorage.removeItem("luvit_d_pending")}catch(x){}})'
		. '.catch(function(){if(n<3){s.textContent="الشبكة ضعيفة · بنعيد المحاولة...";'
		. 'setTimeout(go,n*4000)}else{s.className="e";'
		. 's.textContent="ما انحفظت · اضغط الزر كمان مرة لمّا ترجع الشبكة";busy=0;'
		. '[].forEach.call(f.querySelectorAll("button"),function(x){x.disabled=false})}});'
		. '})();});'
		. '})();</script>';

	luvit_d_page( 'طلب ' . (int) $order_id, $b );
}

/* ══════════════════════════════════════════════════════════════════════
   ٩ · الإيصال · المندوب بيصوّره
   ══════════════════════════════════════════════════════════════════════
   🔴 **مقصود إنه إثبات إله هو.** لمّا يكون عنده ورقة بتقول «أنا ضغطت
      وهاد وقتها»، بيصير مرتاح يضغط بدل ما يخاف يتلام. والخوف من الضغط
      هو أكبر خطر على الآلية كلها.
   ══════════════════════════════════════════════════════════════════════ */
function luvit_d_receipt( $order_id, $stage, $order, $stages ) {
	$label = isset( $stages[ $stage ] ) ? $stages[ $stage ]['label'] : $stage;
	$ok    = ( 'delivered' === $stage );
	$b = '<h1>' . ( $ok ? 'انحفظت' : 'انسجّلت' ) . '</h1>'
		. '<p class="r">طلب رقم <strong>' . (int) $order_id . '</strong></p>'
		. '<p class="r">' . luvit_d_esc( $label ) . '</p>';
	if ( $ok ) {
		$b .= '<div class="m">' . number_format( (float) $order['total'], 2 ) . ' د.أ</div>';
	}
	$b .= '<p class="r">' . luvit_d_esc( luvit_d_now() ) . '</p>'
		. '<p class="r">صوّر هالشاشة · هي إثبات إنك أكّدت.</p>';
	luvit_d_page( 'انحفظت', $b );
}

/* ⚠️ `date_i18n()` بـ`wp-includes/functions.php` بس بتعتمد على إعدادات
   ما انتحمّلت · فالوقت بينكتب بتوقيت عمّان مباشرة. */
function luvit_d_now() {
	$tz = new DateTimeZone( 'Asia/Amman' );
	$d  = new DateTime( 'now', $tz );
	return $d->format( 'Y-m-d · H:i' );
}
