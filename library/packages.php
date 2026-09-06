<?php
/**
 * ============================================================================
 * LUVIT · luvit-packages
 * ============================================================================
 * WPCode snippet (PHP, Run Everywhere). Registers [luvit_packages].
 * Repo source of truth: library/packages.php
 * ============================================================================
 */

/* ==========================================================================
   عارض البكجات · بيقرا من قاعدة البيانات لا من HTML مكتوب بالإيد
   ==========================================================================
   🔴 **المشكلة اللي بيحلّها، مقيسة:** صفحة `/products/` كانت بترسم **١٦
      بطاقة مكتوبة بالإيد** والمتجر فيه **٣٠ منتجاً**. يعني **١٤ منتجاً**
      ما إلهن وجود على صفحة التشكيلة: ١٣ ثنائية، وروتين كامل (توحيد اللون
      للبشرة الجافة) **ما بيربط عليه ولا رابط بالموقع كله** · مفحوص على
      `/products/` و`/routines/` و`/shop/`.

   وهاي **نفس فئة** غلط الـ٢٢ ديناراً وغلط «المتجر أربعة والروتينات تلاتة»:
   بيانات منسوخة بتنحرف حتماً. [[duplicated-data-always-drifts]]

   ── من وين بتيجي محتويات البطاقة ────────────────────────────────────
   كلها **مشتقّة**، ولا سطر منها مكتوب هون:
     · الاسم والسعر والصورة والرابط ← ووكومرس
     · **المنتجات جوّا الباقة** ← `short_description` · شكلها ثابت:
       «اسم + اسم + اسم» · وبتنحلّ لمعرّفات بمطابقة الاسم
     · **التوفير** ← مجموع أسعار القطع ناقص سعر الباقة · **محسوب لحظتها**،
       فبيضل صادقاً لمّا صاحب العلامة يغيّر أي سعر

   ⚠️ **وفخّ الفاصل:** «واقي الشمس اليومي · SPF50+» فيه `+` وهو نفسه رمز
      الفصل. القصّ على `\s\+\s` (مسافة-زائد-مسافة) لأنّ زائد الاسم ملزوقة
      بـ«SPF50». بلا هالتفصيل **أربع باقات بتخسر منتجاً بصمت**، والتوفير
      بيطلع غلط · وهو رقم بيوعد الزبونة.

   🔴 **وما بينعرض رقم ما انثبت.** لو منتج بالباقة ما انحلّ، البطاقة بتطلع
      **بلا قائمة محتويات وبلا توفير** · الاسم والسعر والزرّ وبس. أرحم
      بكثير من رقم مخترع. [[a-noisy-checker-gets-ignored]]

   ⚠️ **وسطر «التوصيل مجاني» بيقرا نفس شرط السلة بالضبط**
      (`has_term( 'packages' )`) · مش نصّاً مكتوباً. القاعدة بسنيبت الشحن
      وهاي القراءة منها، فما بيصير الصفحة تقول مجاني والسلة تحاسب.
      [[shipping-cache-key-hook-order]]
   ========================================================================== */

/* تنظيف نصّ للمطابقة · بيشيل علامات الاتجاه وبيوحّد المسافات */
function luvit_pk_norm( $s ) {
	$s = preg_replace( '/[\x{200E}\x{200F}\x{061C}]/u', '', (string) $s );
	$s = preg_replace( '/\s+/u', ' ', $s );
	return trim( $s );
}

/* ══════════════════════════════════════════════════════════════════════
   🔴 **شرط الشحن المجاني · مصدر الحقيقة الوحيد**
   ══════════════════════════════════════════════════════════════════════
   قرار ريّان ٥ أيلول ٢٠٢٦: «الشحن المجاني بس بالروتينات الكبيرة اللي من
   أربع قطع وأكثر.»

   ⚠️ **والقاعدة القديمة كانت بالفئة** (`has_term('packages')`)، وهاد كان
      صحيحاً لمّا الفئة كانت روتينات وبس. بعد ما انضافت ١٣ ثنائية لنفس
      الفئة صار ثنائي بـ٢٤٫٢٥ ياخد شحناً بـ٢٫٥٠ فوق خصم ١٠٪ · يعني
      **~١٩٪ فعلي** مكان ١٠٪.

   🔴 **وسنيبت الشحن بينده هالدالة بالذات، والبطاقة كمان.** سطر واحد
      بيقرأه الاتنين · فما بيصير الصفحة تقول «مجاني» والسلة تحاسب.
      [[shipping-cache-key-hook-order]]

   ⚠️ **والعدّ من النصّ لا من الربط.** لو انتغيّر اسم منتج وما عاد يطابق،
      الربط بيفشل بس **العدّ بيضل صح** · فروتين ما بيخسر شحنه المجاني
      بسبب حرف بالاسم. الربط لازم للتوفير وحده.
   ══════════════════════════════════════════════════════════════════════ */
if ( ! defined( 'LUVIT_PK_SHIP_MIN' ) ) {
	define( 'LUVIT_PK_SHIP_MIN', 4 );
}

/* قطع الباقة كأسماء · القصّ على **مسافة-زائد-مسافة** لأنّ «SPF50+» فيه
   زائد ملزوقة، والقصّ على «+» لحاله بيسرق منتجاً من أربع باقات بصمت. */
function luvit_pk_parts( $text ) {
	$t = luvit_pk_norm( wp_strip_all_tags( (string) $text ) );
	return ( '' === $t ) ? array() : preg_split( '/\s\+\s/u', $t );
}

function luvit_pk_ship_free( $product_id ) {
	$product_id = (int) $product_id;
	if ( ! $product_id || ! has_term( 'packages', 'product_cat', $product_id ) ) {
		return false;
	}
	$p = function_exists( 'wc_get_product' ) ? wc_get_product( $product_id ) : null;
	if ( ! $p ) {
		return false;
	}
	return count( luvit_pk_parts( $p->get_short_description() ) ) >= LUVIT_PK_SHIP_MIN;
}

/* خريطة الباقات · بتنبنى مرة بكل طلب وبتتخزّن بترانزيينت */
function luvit_pk_map() {
	static $map = null;
	if ( null !== $map ) {
		return $map;
	}

	$cached = get_transient( 'luvit_pk_map_v2' );
	if ( is_array( $cached ) ) {
		$map = $cached;
		return $map;
	}

	if ( ! function_exists( 'wc_get_products' ) ) {
		return array( 'routines' => array(), 'duos' => array(), 'shared' => array() );
	}

	/* المفردات · جدول بحث بالاسم المنظّف */
	$singles = wc_get_products( array(
		'status'   => 'publish',
		'limit'    => -1,
		'category' => array( 'singles' ),
	) );
	$by_name = array();
	foreach ( $singles as $p ) {
		$by_name[ luvit_pk_norm( $p->get_name() ) ] = $p->get_id();
	}

	/* ⚠️ لو الفئة `singles` فاضية (اسم مختلف · تعديل بالإدارة) بنرجع
	   لكل المنتجات · غياب الفئة ما بيصير سبباً لصفحة فاضية. */
	if ( empty( $by_name ) ) {
		foreach ( wc_get_products( array( 'status' => 'publish', 'limit' => -1 ) ) as $p ) {
			$by_name[ luvit_pk_norm( $p->get_name() ) ] = $p->get_id();
		}
	}

	$bundles = wc_get_products( array(
		'status'   => 'publish',
		'limit'    => -1,
		'category' => array( 'packages' ),
		'orderby'  => 'menu_order',
		'order'    => 'ASC',
	) );

	$routines = array();
	$duos     = array();

	foreach ( $bundles as $b ) {
		$parts = luvit_pk_parts( $b->get_short_description() );

		$ids      = array();
		$resolved = ! empty( $parts );
		foreach ( $parts as $name ) {
			$name = luvit_pk_norm( $name );
			if ( isset( $by_name[ $name ] ) ) {
				$ids[] = $by_name[ $name ];
			} else {
				$resolved = false;
			}
		}

		/* مجموع القطع · بيتحسب بس لو الكل انحلّ */
		$sum = 0.0;
		if ( $resolved ) {
			foreach ( $ids as $id ) {
				$c = wc_get_product( $id );
				if ( ! $c ) {
					$resolved = false;
					break;
				}
				$sum += (float) $c->get_price();
			}
		}

		$row = array(
			'id'       => $b->get_id(),
			'name'     => $b->get_name(),
			'url'      => get_permalink( $b->get_id() ),
			'price'    => (float) $b->get_price(),
			'ids'      => $ids,
			'resolved' => $resolved,
			'sum'      => $resolved ? $sum : 0.0,
			'sku'      => (string) $b->get_sku(),
			'thumb'    => (int) $b->get_image_id(),
			'freeship' => luvit_pk_ship_free( $b->get_id() ),
		);

		/* 🔴 التقسيم بعدد القطع · **مش بقائمة معرّفات**. باقة جديدة من
		   ثلاثة بتقع بالمجموعة الأولى تلقائياً، وما بتنعرض تحت عنوان
		   «ثنائيات» وهي مش ثنائية. */
		if ( 2 === count( $ids ) && $resolved ) {
			$duos[] = $row;
		} else {
			$routines[] = $row;
		}
	}

	/* القطعة المشتركة · موجودة بكل روتين · بتتعلّم بالبطاقة */
	$shared = array();
	if ( count( $routines ) > 1 ) {
		$first = true;
		foreach ( $routines as $r ) {
			if ( ! $r['resolved'] ) {
				continue;
			}
			$shared = $first ? $r['ids'] : array_intersect( $shared, $r['ids'] );
			$first  = false;
		}
	}

	$map = array( 'routines' => $routines, 'duos' => $duos, 'shared' => array_values( $shared ) );
	set_transient( 'luvit_pk_map_v2', $map, DAY_IN_SECONDS );
	return $map;
}

/* أي تعديل على منتج بيرمي الخريطة · السعر بيتغيّر والتوفير لازم يلحق */
add_action( 'woocommerce_update_product', function () { delete_transient( 'luvit_pk_map_v2' ); } );
add_action( 'woocommerce_new_product',    function () { delete_transient( 'luvit_pk_map_v2' ); } );
add_action( 'woocommerce_delete_product', function () { delete_transient( 'luvit_pk_map_v2' ); } );

/* سعر بصيغة البطاقة · اللاتيني معزول بـdir عشان ما ينقلب بالعربي */
function luvit_pk_price( $v ) {
	return '<span dir="ltr">' . esc_html( number_format( (float) $v, 2, '.', '' ) ) . '</span> د.أ';
}

/* الهدف من الـSKU · بيلوّن خلفية الصورة ورقم الخطوة */
function luvit_pk_goal( $sku ) {
	$sku = strtoupper( (string) $sku );
	if ( false !== strpos( $sku, 'HYDRATION' ) ) { return 'hydration'; }
	if ( false !== strpos( $sku, 'CLARIFY' ) )   { return 'clarify'; }
	if ( false !== strpos( $sku, 'BRIGHTEN' ) )  { return 'glow'; }
	if ( false !== strpos( $sku, 'EVEN_TONE' ) ) { return 'eventone'; }
	return '';
}

function luvit_pk_card( $row, $shared, $feature ) {
	$name = $row['name'];
	$goal = $feature ? luvit_pk_goal( $row['sku'] ) : '';

	$o  = '<article class="luvit-card ' . ( $feature ? 'luvit-card--feature' : 'luvit-card--duo' ) . '"';
	$o .= $goal ? ' data-goal="' . esc_attr( $goal ) . '"' : '';
	$o .= '>';

	/* ── الصورة ────────────────────────────────────────────────────────
	   الروتينات عندها صورة باقة · والثنائيات **ما عندها ولا وحدة**، فبتاخد
	   **صورتَي منتجيها الحقيقيتين**. مش عنصراً نائباً مكرّراً: صورة نائبة
	   بتتكرّر ١٣ مرة بتخلّي الشبكة تبيّن أفرغ من نصّ صافي. */
	$o .= '<div class="luvit-card__media' . ( $feature ? '' : ' luvit-card__media--pair' ) . '">';
	$o .= '<button class="luvit-wish" type="button" data-wish="' . esc_attr( $row['id'] ) . '"'
		. ' aria-pressed="false" aria-label="' . esc_attr( 'أضيفي ' . $name . ' للمفضّلة' ) . '">'
		. '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.3 4.6 13a4.7 4.7 0 0 1 0-6.7 4.7 4.7 0 0 1 6.7 0l.7.7.7-.7a4.7 4.7 0 0 1 6.7 0 4.7 4.7 0 0 1 0 6.7z"/></svg>'
		. '</button>';

	if ( $feature && $row['thumb'] ) {
		$o .= wp_get_attachment_image( $row['thumb'], 'woocommerce_single', false, array(
			'alt'      => $name,
			'decoding' => 'async',
		) );
	} else {
		foreach ( $row['ids'] as $cid ) {
			$c = wc_get_product( $cid );
			if ( ! $c || ! $c->get_image_id() ) {
				continue;
			}
			$o .= wp_get_attachment_image( $c->get_image_id(), 'woocommerce_thumbnail', false, array(
				'alt'      => $c->get_name(),
				'loading'  => 'lazy',
				'decoding' => 'async',
			) );
		}
	}
	$o .= '</div>';

	$o .= '<div class="luvit-card__body">';
	$o .= '<h3 class="luvit-card__title"><a href="' . esc_url( $row['url'] ) . '">' . esc_html( $name ) . '</a></h3>';

	/* ── المحتويات · بتنعرض بس لو الكل انحلّ ─────────────────────────
	   ⚠️ والاسم ملفوف بـ`<span>` عن قصد. الـ`li` عندها `display:grid`
	      بعمودين (الرقم والنصّ)، فأي طفل ثالث بينفى لصف جديد بعرض العمود
	      الأول · «بكلهن» كانت بتطلع بـ**١١px** مقيسة.
	      [[explicit-grid-rows-exile-new-children]] */
	if ( $row['resolved'] && ! empty( $row['ids'] ) ) {
		$o .= '<ol class="luvit-card__steps">';
		foreach ( $row['ids'] as $cid ) {
			$c = wc_get_product( $cid );
			if ( ! $c ) {
				continue;
			}
			$is_shared = $feature && in_array( $cid, (array) $shared, true );
			$o .= '<li' . ( $is_shared ? ' data-shared' : '' ) . '><span>' . esc_html( $c->get_name() );
			$o .= $is_shared ? ' <small>بكلهن</small>' : '';
			$o .= '</span></li>';
		}
		$o .= '</ol>';
	}

	$o .= '<div class="luvit-card__footer"><span class="luvit-card__pricewrap">';
	if ( $row['resolved'] && $row['sum'] > $row['price'] ) {
		$o .= '<s class="luvit-card__was">' . luvit_pk_price( $row['sum'] ) . '</s>';
	}
	$o .= '<span class="luvit-card__price">' . luvit_pk_price( $row['price'] ) . '</span>';
	if ( $row['resolved'] && $row['sum'] > $row['price'] ) {
		$o .= '<span class="luvit-card__save">وفّرتِ ' . luvit_pk_price( $row['sum'] - $row['price'] ) . '</span>';
	}
	if ( $row['freeship'] ) {
		$o .= '<span class="luvit-card__ship">والتوصيل مجاني</span>';
	}
	$o .= '</span>';
	$o .= '<a href="' . esc_url( '/?add-to-cart=' . $row['id'] ) . '" rel="nofollow"'
		. ' class="luvit-btn add_to_cart_button ajax_add_to_cart"'
		. ' data-product_id="' . esc_attr( $row['id'] ) . '" data-quantity="1"'
		. ' aria-label="' . esc_attr( 'أضيفي ' . $name . ' إلى السلة' ) . '">أضيفي إلى السلة</a>';
	$o .= '</div></div></article>';

	return $o;
}

add_shortcode( 'luvit_packages', function () {  // LUVIT_PK
	$map = luvit_pk_map();

	/* 🔴 ولا شبكة فاضية بتنشحن · لو ما في باقات بترجع لا شي والسكشن
	   بيقعد بعنوانه بس، أرحم من إطار فاضي. */
	if ( empty( $map['routines'] ) && empty( $map['duos'] ) ) {
		return '';
	}

	$o = '';

	if ( ! empty( $map['routines'] ) ) {
		$o .= '<div class="luvit-card-grid luvit-card-grid--wide" data-luvit="stagger">';
		foreach ( $map['routines'] as $r ) {
			$o .= luvit_pk_card( $r, $map['shared'], true );
		}
		$o .= '</div>';
	}

	if ( ! empty( $map['duos'] ) ) {
		$o .= '<div class="luvit-section__head luvit-section__head--tier" data-luvit="reveal">';
		$o .= '<h2 class="luvit-section__title">ثنائيات بخطوتين</h2>';
		$o .= '<p class="luvit-section__sub">لمّا الروتين الكامل كثير عليكِ.</p>';
		$o .= '</div>';
		$o .= '<div class="luvit-card-grid" data-luvit="stagger">';
		foreach ( $map['duos'] as $d ) {
			$o .= luvit_pk_card( $d, array(), false );
		}
		$o .= '</div>';
	}

	return $o;
} );


/* ==========================================================================
   بطاقات الكمية · ١ · ٢ · ٣ · على المفردات وحدها
   ==========================================================================
   ريّان طلبها زي الوكالة الأم، وحطّ الشرط: «خصم ما يكون عالي ولا قليل
   ومنطقي، ويضل يوجّه العميل عالبكجات اللي من أربع بشكل غير مباشر».

   ── السلّم وليش هو هيك ──────────────────────────────────────────────
     عبوتين  →  ٥٪    ·  **أقلّ من الثنائي (١٠٪)** · الثنائي منتجان
                         مختلفان بنفس الخصم، فبيضل أوفر منطقياً
     ثلاثة   →  ١٠٪   ·  بيساوي الثنائي بس بمنتج مكرّر
     الروتين →  ٢١٫٥٪ + شحن مجاني · وبيضل الأعلى بوضوح

   🔴 **والتوجيه بالترتيب لا بالكلام.** ما في سطر بيقول «الروتين أوفر» ·
      الأرقام بترتّب نفسها. [[promising-the-baseline-signals-past-failure]]

   ⚠️ وحتى مع كود الإنفلونسر (١٠٪ للعميلة فوق أي خصم) الترتيب ما بينقلب:
      ٣ عبوات ١٠٪+١٠٪ = ١٩٪ · والروتين ٢١٫٥٪+١٠٪ = ٢٩٪ وشحنه مجاني.

   ── ولا رقم مكتوب مرتين ─────────────────────────────────────────────
   نفس الدالة بتحسب **سعر البطاقة على الصفحة** و**سعر السطر بالسلة**.
   البطاقة بتقول ١٧٫١٠ والسلة بتحاسب ١٧٫١٠ · [[shipping-cache-key-hook-order]]
   ========================================================================== */

function luvit_pk_tiers() {
	/* الكمية => نسبة الخصم · مرتّبة تصاعدياً */
	return array( 1 => 0, 2 => 5, 3 => 10 );
}

function luvit_pk_is_single( $product_id ) {
	return has_term( 'singles', 'product_cat', (int) $product_id );
}

/* أعلى شريحة بتنطبق · «٣ فأكثر» بتاخد شريحة الثلاثة */
function luvit_pk_tier_pct( $product_id, $qty ) {
	if ( ! luvit_pk_is_single( $product_id ) ) {
		return 0;
	}
	$best = 0;
	foreach ( luvit_pk_tiers() as $n => $pct ) {
		if ( (int) $qty >= (int) $n ) {
			$best = (int) $pct;
		}
	}
	return $best;
}

/* 🔴 الأساس **من المنتج لا من نسخة السلة**.
   `woocommerce_before_calculate_totals` بينده أكثر من مرة بالطلب الواحد،
   ولو حسبنا من السعر الحالي بيصير الخصم بينطبق فوق نفسه وبينزل السعر
   لكل نداء. القراءة من `wc_get_product()` بتخلّي الحساب **ثابتاً**
   مهما انعاد. */
function luvit_pk_tier_price( $product_id, $qty ) {
	$p = function_exists( 'wc_get_product' ) ? wc_get_product( $product_id ) : null;
	if ( ! $p ) {
		return null;
	}
	$base = (float) $p->get_price();
	$pct  = luvit_pk_tier_pct( $product_id, $qty );
	$dec  = function_exists( 'wc_get_price_decimals' ) ? wc_get_price_decimals() : 2;
	return round( $base * ( 100 - $pct ) / 100, $dec );
}

/* 🔴 **نسبة واحدة للسطر، مش خصمين فوق بعض.**
   سطر إجا من عرض الشيك أوت (٥٪) وبعدين رفعت كميته لتلاتة (١٠٪) لازم
   ياخد **الأعلى** لا المجموع · الجمع بيوصل ١٥٪ على منتج مفرد وهاد أعلى
   من الثنائي، فبينقلب السلّم اللي بيوجّه على الباقات. */
function luvit_pk_line_pct( $item ) {
	$pct = luvit_pk_tier_pct( $item['product_id'], $item['quantity'] );
	if ( ! empty( $item['luvit_bump'] ) ) {
		$pct = max( $pct, LUVIT_PK_BUMP_PCT );
	}
	return (int) $pct;
}

add_action( 'woocommerce_before_calculate_totals', function ( $cart ) {
	if ( is_admin() && ! defined( 'DOING_AJAX' ) ) {
		return;
	}
	if ( ! $cart || ! method_exists( $cart, 'get_cart' ) ) {
		return;
	}
	foreach ( $cart->get_cart() as $item ) {
		if ( empty( $item['data'] ) || empty( $item['product_id'] ) ) {
			continue;
		}
		$pct = luvit_pk_line_pct( $item );
		if ( ! $pct ) {
			continue;
		}
		$p = wc_get_product( $item['product_id'] );
		if ( ! $p ) {
			continue;
		}
		$dec = function_exists( 'wc_get_price_decimals' ) ? wc_get_price_decimals() : 2;
		$item['data']->set_price( round( (float) $p->get_price() * ( 100 - $pct ) / 100, $dec ) );
	}
}, 20 );

/* سطر بالسلة بيقول ليش السعر نزل · بلاه بتبيّن غلطة لا هدية */
add_filter( 'woocommerce_get_item_data', function ( $data, $item ) {
	if ( empty( $item['product_id'] ) ) {
		return $data;
	}
	if ( ! empty( $item['luvit_bump'] ) ) {
		$data[] = array(
			'name'  => 'عرض الشيك أوت',
			'value' => LUVIT_PK_BUMP_PCT . '٪',
		);
		return $data;
	}
	$pct = luvit_pk_tier_pct( $item['product_id'], $item['quantity'] );
	if ( $pct ) {
		$data[] = array(
			'name'  => 'خصم الكمية',
			'value' => $pct . '٪ على ' . (int) $item['quantity'] . ' عبوات',
		);
	}
	return $data;
}, 10, 2 );

/* ── البطاقات على صفحة المنتج ────────────────────────────────────────
   ⚠️ **الحقل اسمه `luvit_qty` مش `quantity`.** حقلان بنفس الاسم بفورم
      واحد بيخلّي PHP تاخد الأخير، وترتيب الخطّافات مش عقداً · فحقل مستقل
      والسيرفر بيقراه صراحةً، والجافاسكربت بتحدّث حقل الكمية الأصلي كمان
      عشان العدد يبيّن للعين. */
add_action( 'woocommerce_after_add_to_cart_quantity', function () {
	global $product;
	if ( ! $product || ! luvit_pk_is_single( $product->get_id() ) ) {
		return;
	}
	$id   = $product->get_id();
	$base = (float) $product->get_price();
	if ( $base <= 0 ) {
		return;
	}

	echo '<div class="luvit-qty" role="radiogroup" aria-label="اختاري الكمية">';
	foreach ( luvit_pk_tiers() as $n => $pct ) {
		$total = luvit_pk_tier_price( $id, $n ) * $n;
		$save  = ( $base * $n ) - $total;
		$label = ( 1 === $n ) ? 'عبوة وحدة' : ( ( 2 === $n ) ? 'عبوتين' : 'ثلاث عبوات' );

		echo '<label class="luvit-qty__opt">';
		echo '<input type="radio" name="luvit_qty" value="' . esc_attr( $n ) . '"' . ( 1 === $n ? ' checked' : '' ) . '>';
		echo '<span class="luvit-qty__box">';
		echo '<span class="luvit-qty__n">' . esc_html( $label ) . '</span>';
		echo '<span class="luvit-qty__price">' . luvit_pk_price( $total ) . '</span>';
		echo $save > 0
			? '<span class="luvit-qty__save">وفّرتِ ' . luvit_pk_price( $save ) . '</span>'
			: '<span class="luvit-qty__save luvit-qty__save--none" aria-hidden="true"></span>';
		echo '</span></label>';
	}
	echo '</div>';

	echo '<script>(function(){var g=document.currentScript.previousElementSibling;'
		. 'if(!g)return;var q=document.querySelector("form.cart input.qty");'
		. 'g.addEventListener("change",function(e){if(e.target.name!=="luvit_qty")return;'
		. 'if(q){q.value=e.target.value;q.dispatchEvent(new Event("change",{bubbles:true}));}});})();</script>';
}, 20 );

/* والسيرفر بيقرا الحقل المستقل · فبتشتغل حتى بلا جافاسكربت */
add_filter( 'woocommerce_add_to_cart_quantity', function ( $qty ) {
	if ( isset( $_POST['luvit_qty'] ) ) {
		$n = absint( wp_unslash( $_POST['luvit_qty'] ) );
		if ( $n > 0 && $n <= 99 ) {
			return $n;
		}
	}
	return $qty;
}, 10, 1 );


/* ==========================================================================
   اقتراحات السلة · مبنية على تركيب الباقات الحقيقي
   ==========================================================================
   ريّان: «لما العميلة تضيف إشي بالسلة وتيجي تفتح السلة تطلعلها منتجات
   مقترحة زي أمازون» · وبعدها الشرط القاطع: «بدي إياه يكون دايناميك مبني
   عبيانات حقيقية مش اقتراح عشوائي» و«إذا ما كان إله علاقة أو ممكن يضر
   بتبين زي كإنه بدنا نبيع أي إشي وبس ومنتخوث».

   ── من وين بتيجي «العلاقة» ──────────────────────────────────────────
   **من الباقات اللي بناها صاحب العلامة نفسه.** منتجان بينحسبوا مترابطين
   لمّا يكونوا **بنفس الباقة** · ودرجة الترابط = كم باقة بتجمعهن.
   يعني الاقتراح بيقول إشي **قابل للتحقّق**: «هدول الاتنين بنفس الروتين».

   🔴 **ولهيك كل بطاقة بتحمل سببها مكتوباً** («مع سيروم فيتامين سي
      بروتين الإشراقة») · اقتراح بلا سبب هو بالضبط اللي بيبيّن «بدنا نبيع
      أي إشي». [[benefits-not-ingredient-lists]]

   ── وشو **ما** بينقترح ──────────────────────────────────────────────
     · إشي موجود بالسلة أصلاً
     · إشي **جوّا باقة موجودة بالسلة** · هي شارِيته وما بتعرف
     · باقات · اقتراح باقة على وحدة شارية نصّها بيعني تدفع مرتين
     · وأي إشي لمّا تكون البيانات ناقصة · **بترجع فاضية أحسن من عشوائية**

   ── ليش جافاسكربت مش PHP ────────────────────────────────────────────
   صفحة السلة **بلوكات ووكومرس**، والسلة بتتغيّر بلا ما تنعاد الصفحة.
   اقتراح مرسوم بالسيرفر بيبيت أول ما تشيل منتجاً. فالبيانات بتنبعت مرة
   وحدة والحساب بيصير بالمتصفّح مع كل تغيّر · والإضافة عبر Store API
   الرسمي وبعدها `receiveCart` فالمجاميع بتتحدّث لحالها.
   ========================================================================== */

function luvit_pk_suggest_payload() {
	$map = luvit_pk_map();
	$out = array( 'products' => array(), 'bundles' => array() );

	if ( ! function_exists( 'wc_get_products' ) ) {
		return $out;
	}

	foreach ( wc_get_products( array( 'status' => 'publish', 'limit' => -1, 'category' => array( 'singles' ) ) ) as $p ) {
		$img = $p->get_image_id() ? wp_get_attachment_image_url( $p->get_image_id(), 'woocommerce_thumbnail' ) : '';
		$out['products'][ (string) $p->get_id() ] = array(
			'name'  => $p->get_name(),
			'price' => (float) $p->get_price(),
			'url'   => get_permalink( $p->get_id() ),
			'img'   => $img ? $img : '',
		);
	}

	foreach ( array_merge( $map['routines'], $map['duos'] ) as $b ) {
		if ( empty( $b['resolved'] ) || count( $b['ids'] ) < 2 ) {
			continue;
		}
		$out['bundles'][] = array(
			'id'   => (int) $b['id'],
			'name' => $b['name'],
			'ids'  => array_map( 'intval', $b['ids'] ),
		);
	}

	return $out;
}

add_shortcode( 'luvit_cart_suggest', function () {  // LUVIT_SUGGEST
	if ( is_admin() ) {
		return '';
	}
	$d = luvit_pk_suggest_payload();

	/* 🔴 بوابة البيانات · أقلّ من هيك يعني الاشتقاق انكسر، والاقتراح
	   وقتها بيصير تخميناً. **بترجع فاضية.** */
	if ( count( $d['products'] ) < 8 || count( $d['bundles'] ) < 10 ) {
		return '';
	}

	$json = wp_json_encode( $d, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES );

	$o  = '<section class="luvit-sug" id="luvit-suggest" hidden>';
	$o .= '<h2 class="luvit-sug__h">بيتكمّلوا مع اللي بسلّتك</h2>';
	$o .= '<ul class="luvit-sug__list"></ul>';
	$o .= '</section>';
	$o .= '<script type="application/json" id="luvit-suggest-data">' . $json . '</script>';
	$o .= '<script>' . luvit_pk_suggest_js() . '</script>';

	return $o;
} );

function luvit_pk_suggest_js() {
	/* nowdoc · ولا تفسير لأي `$` جوّا الجافاسكربت */
	return <<<'JS'
(function () {
  var root = document.getElementById('luvit-suggest');
  var dataEl = document.getElementById('luvit-suggest-data');
  if (!root || !dataEl) { return; }
  var D;
  try { D = JSON.parse(dataEl.textContent); } catch (e) { return; }
  if (!D || !D.products || !D.bundles) { return; }

  var MAX = 3;
  var list = root.querySelector('.luvit-sug__list');
  var money = function (v) {
    return '<span dir="ltr">' + v.toFixed(2) + '</span> د.أ';
  };

  function cartIds() {
    try {
      var c = window.wp.data.select('wc/store/cart').getCartData();
      return (c && c.items ? c.items : []).map(function (i) { return i.id; });
    } catch (e) { return null; }
  }

  /* الأساسات = اللي بالسلة **زائد** قطع أي باقة بالسلة · لأنّ الباقة
     بتعني إنها بتملك قطعها، فما منقترحها عليها ومنقترح جيرانها. */
  function anchorsAndOwned(ids) {
    var owned = {}, anchors = [];
    ids.forEach(function (id) {
      owned[id] = 1;
      anchors.push(id);
      D.bundles.forEach(function (b) {
        if (b.id === id) {
          b.ids.forEach(function (m) { owned[m] = 1; anchors.push(m); });
        }
      });
    });
    return { owned: owned, anchors: anchors };
  }

  function pick(ids) {
    var ao = anchorsAndOwned(ids), cand = {};
    ao.anchors.forEach(function (a) {
      D.bundles.forEach(function (b) {
        if (b.ids.indexOf(a) < 0) { return; }
        b.ids.forEach(function (m) {
          if (ao.owned[m] || !D.products[m]) { return; }
          if (!cand[m]) { cand[m] = { id: m, score: 0, why: null }; }
          cand[m].score++;
          if (!cand[m].why && D.products[a]) {
            cand[m].why = { bundle: b.name, withName: D.products[a].name };
          }
        });
      });
    });
    var out = Object.keys(cand).map(function (k) { return cand[k]; })
      .filter(function (c) { return c.why; });
    out.sort(function (x, y) {
      return y.score - x.score || D.products[x.id].price - D.products[y.id].price;
    });
    return out.slice(0, MAX);
  }

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  function card(c) {
    var p = D.products[c.id];
    var img = p.img
      ? '<img src="' + esc(p.img) + '" alt="' + esc(p.name) + '" loading="lazy" decoding="async">'
      : '';
    return '<li class="luvit-sug__item">'
      + '<a class="luvit-sug__media" href="' + esc(p.url) + '" tabindex="-1" aria-hidden="true">' + img + '</a>'
      + '<div class="luvit-sug__body">'
      + '<a class="luvit-sug__name" href="' + esc(p.url) + '">' + esc(p.name) + '</a>'
      + '<p class="luvit-sug__why">مع ' + esc(c.why.withName) + ' · ' + esc(c.why.bundle) + '</p>'
      + '</div>'
      + '<div class="luvit-sug__buy">'
      + '<span class="luvit-sug__price">' + money(p.price) + '</span>'
      + '<button type="button" class="luvit-sug__add" data-add="' + esc(c.id) + '">أضيفي</button>'
      + '</div></li>';
  }

  function render() {
    var ids = cartIds();
    if (ids === null || !ids.length) { root.hidden = true; return; }
    var picks = pick(ids);
    if (!picks.length) { root.hidden = true; return; }
    list.innerHTML = picks.map(card).join('');
    root.hidden = false;
  }

  /* 🔴 **النونس بيجي بترويسة الرد، مش من `wcSettings`.**
     `wcSettings.storeApiNonce` **مش موجود** على هالتركيب · مفحوص، ولا
     مفتاح بـ`wcSettings` فيه كلمة nonce. والطلب بلا نونس **بيرجّع 201**
     بس بيشتغل على جلسة تانية، فالسلة ما بتتغيّر ولا بيطلع خطأ · فشل
     صامت بالضبط. [[silent-refusals-hide-in-the-response]]
     ⤷ فبنسحبه من `GET /cart` وبنحدّثه من ترويسة كل رد. */
  var _n = null;
  function grabNonce(r) {
    var v = r.headers.get('Nonce');
    if (v) { _n = v; }
    return r;
  }
  function withNonce() {
    if (_n) { return Promise.resolve(_n); }
    return fetch('/wp-json/wc/store/v1/cart', { credentials: 'include' })
      .then(grabNonce).then(function () { return _n || ''; });
  }

  list.addEventListener('click', function (ev) {
    var btn = ev.target.closest('[data-add]');
    if (!btn) { return; }
    var id = parseInt(btn.getAttribute('data-add'), 10);
    var old = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'لحظة...';
    withNonce().then(function (nv) {
      return fetch('/wp-json/wc/store/v1/cart/add-item', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'Nonce': nv },
        body: JSON.stringify({ id: id, quantity: 1 })
      });
    }).then(grabNonce).then(function (r) {
      if (!r.ok) { throw new Error(r.status); }
      return r.json();
    }).then(function (j) {
      try { window.wp.data.dispatch('wc/store/cart').receiveCart(j); }
      catch (e) { window.location.reload(); return; }
      render();
    }).catch(function () {
      btn.disabled = false;
      btn.textContent = 'ما زبطت · جرّبي كمان مرة';
      setTimeout(function () { btn.textContent = old; }, 3000);
    });
  });

  /* wp.data بترنّ كثير · المفتاح بيمنع إعادة الرسم بلا داعي */
  var last = null;
  function tick() {
    var ids = cartIds();
    if (ids === null) { return; }
    var key = ids.join(',');
    if (key === last) { return; }
    last = key;
    render();
  }
  /* 🔴 **السكربت بيشتغل قبل ما `wp.data` تتحمّل.**
     هو مضمّن بمتن الصفحة، وسكربتات بلوكات ووكومرس بتتحمّل بالتذييل ·
     يعني وقت تشغيلنا `window.wp.data` **لساها مش موجودة**، فالاشتراك
     ما بينعمل. وبعدها السلة بتوصل من الشبكة ولا حدا بيعيد الرسم،
     فالقسم بيضل مخفي **وكل إشي بيبيّن شغّال**: البيانات موجودة،
     الخوارزمية بترجّع مرشّحين، وما في خطأ بالكونسول.
     ⤷ فبنحاول كل ٤٠٠ملّي لحد ما نشترك، وبنوقف أول ما ننجح.
     [[computed-style-goes-stale]] · نفس عائلة «الوقت مش مضمون».
     ⚠️ وسقف ٤٠ محاولة (١٦ ثانية) عشان ما يضل مؤقّت شغّال للأبد. */
  var subscribed = false;
  function ensure() {
    tick();
    if (!subscribed && window.wp && window.wp.data && window.wp.data.subscribe) {
      window.wp.data.subscribe(tick);
      subscribed = true;
    }
  }
  var tries = 0;
  var iv = setInterval(function () {
    ensure();
    if (subscribed || ++tries > 40) { clearInterval(iv); }
  }, 400);
  ensure();
})();
JS;
}


/* ==========================================================================
   عرض الشيك أوت · اقتراح واحد بخصم خفيف
   ==========================================================================
   ريّان: «لما تيجي تعمل شيك أوت نقترح عليها كمان منتجات بخصومات معينة
   خفيفة زي خمسة بالمية · وطبعاً بطريقة تبيّن كنصيحة مش إشي مزعج يخرب
   الاستخدام».

   ── ثلاث قرارات بتنفّذ «مش مزعج» ────────────────────────────────────
     · **واحد لا ثلاثة.** الشيك أوت لحظة قرار، وثلاث خيارات بترجّعها
       للتصفّح. اللي بالسلة اقتراحاته تلاتة، وهون **الأقوى وبس**.
     · **مربّع اختيار لا زرّ.** الزرّ بيعمل فعلاً ما بينلغى بسهولة ·
       المربّع بينشال بنفس الضغطة، والقرار بيضل بإيدها.
     · **بلا عدّاد ولا «لفترة محدودة».** الاستعجال بيصنع بالضبط الطلبية
       اللي بتنرفض عالباب، وبالدفع عند الاستلام منّا بندفع الشحن مرّتين.

   ── ليش Store API callback مش زرّ عادي ──────────────────────────────
   الشيك أوت **بلوك**، والسطر لازم ينكتب **بعلامة** عشان الخصم يعرف حاله.
   `add-item` العادي ما بياخد بيانات سطر مخصّصة · فالمسار الرسمي هو
   `woocommerce_store_api_register_update_callback` · بينده بالسيرفر
   والسلة محمّلة، وبيرجّع السلة كاملة فالمجاميع بتتحدّث لحالها.

   🔴 **والعلامة على السطر لا على المنتج** · نفس المنتج ممكن يكون بالسلة
      مرتين، وحدة عادية ووحدة من العرض، والخصم لازم يفرّق.
   ========================================================================== */

if ( ! defined( 'LUVIT_PK_BUMP_PCT' ) ) {
	define( 'LUVIT_PK_BUMP_PCT', 5 );
}

/* ملاحظة: ما في داعي لفلتر `woocommerce_add_cart_item_data` · ووكومرس
   بيبني مفتاح السطر من هاش بيانات السطر، فتمرير `luvit_bump` كوسيط
   خامس لـ`add_to_cart` بيعمل سطراً منفصلاً لحاله. */

add_action( 'woocommerce_blocks_loaded', function () {
	if ( ! function_exists( 'woocommerce_store_api_register_update_callback' ) ) {
		return;
	}
	woocommerce_store_api_register_update_callback( array(
		'namespace' => 'luvit-bump',
		'callback'  => function ( $data ) {
			$id = isset( $data['id'] ) ? absint( $data['id'] ) : 0;
			$on = ! empty( $data['on'] );
			if ( ! function_exists( 'WC' ) || ! WC()->cart ) {
				return;
			}
			$cart = WC()->cart;

			/* أي سطر عرض قديم بينشال أول · فما بيصير سطران من العرض */
			foreach ( $cart->get_cart() as $key => $item ) {
				if ( ! empty( $item['luvit_bump'] ) ) {
					$cart->remove_cart_item( $key );
				}
			}
			if ( ! $on || ! $id || ! luvit_pk_is_single( $id ) ) {
				return;
			}
			$cart->add_to_cart( $id, 1, 0, array(), array( 'luvit_bump' => 1 ) );
		},
	) );
} );

add_shortcode( 'luvit_checkout_bump', function () {  // LUVIT_BUMP
	if ( is_admin() ) {
		return '';
	}
	$d = luvit_pk_suggest_payload();
	if ( count( $d['products'] ) < 8 || count( $d['bundles'] ) < 10 ) {
		return '';
	}
	$json = wp_json_encode( $d, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES );

	$o  = '<aside class="luvit-bump" id="luvit-bump" hidden data-pct="' . esc_attr( LUVIT_PK_BUMP_PCT ) . '"></aside>';
	$o .= '<script type="application/json" id="luvit-bump-data">' . $json . '</script>';
	$o .= '<script>' . luvit_pk_bump_js() . '</script>';
	return $o;
} );

function luvit_pk_bump_js() {
	return <<<'JS'
(function () {
  var root = document.getElementById('luvit-bump');
  var dataEl = document.getElementById('luvit-bump-data');
  if (!root || !dataEl) { return; }
  var D;
  try { D = JSON.parse(dataEl.textContent); } catch (e) { return; }
  if (!D || !D.products || !D.bundles) { return; }
  var PCT = parseInt(root.getAttribute('data-pct'), 10) || 5;

  var _n = null;
  function grabNonce(r) { var v = r.headers.get('Nonce'); if (v) { _n = v; } return r; }
  function withNonce() {
    if (_n) { return Promise.resolve(_n); }
    return fetch('/wp-json/wc/store/v1/cart', { credentials: 'include' })
      .then(grabNonce).then(function () { return _n || ''; });
  }

  function cartItems() {
    try { return window.wp.data.select('wc/store/cart').getCartData().items || []; }
    catch (e) { return null; }
  }

  /* أقوى مرشّح واحد · نفس منطق السلة بالضبط */
  function best(items) {
    var ids = items.map(function (i) { return i.id; });
    var owned = {}, anchors = [];
    ids.forEach(function (id) {
      owned[id] = 1; anchors.push(id);
      D.bundles.forEach(function (b) {
        if (b.id === id) { b.ids.forEach(function (m) { owned[m] = 1; anchors.push(m); }); }
      });
    });
    var cand = {};
    anchors.forEach(function (a) {
      D.bundles.forEach(function (b) {
        if (b.ids.indexOf(a) < 0) { return; }
        b.ids.forEach(function (m) {
          if (owned[m] || !D.products[m]) { return; }
          if (!cand[m]) { cand[m] = { id: m, score: 0, why: null }; }
          cand[m].score++;
          if (!cand[m].why && D.products[a]) {
            cand[m].why = { bundle: b.name, withName: D.products[a].name };
          }
        });
      });
    });
    var out = Object.keys(cand).map(function (k) { return cand[k]; })
      .filter(function (c) { return c.why; });
    out.sort(function (x, y) { return y.score - x.score || D.products[x.id].price - D.products[y.id].price; });
    return out.length ? out[0] : null;
  }

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }
  function money(v) { return '<span dir="ltr">' + v.toFixed(2) + '</span> د.أ'; }

  var current = null;

  function draw(c, checked) {
    var p = D.products[c.id];
    var was = p.price;
    var now = Math.round(was * (100 - PCT)) / 100;
    root.innerHTML =
      '<label class="luvit-bump__row">'
      + '<input type="checkbox" class="luvit-bump__cb"' + (checked ? ' checked' : '') + '>'
      + '<span class="luvit-bump__box">'
      + (p.img ? '<img class="luvit-bump__img" src="' + esc(p.img) + '" alt="" loading="lazy">' : '')
      + '<span class="luvit-bump__body">'
      + '<span class="luvit-bump__name">' + esc(p.name) + '</span>'
      + '<span class="luvit-bump__why">مع ' + esc(c.why.withName) + ' · ' + esc(c.why.bundle) + '</span>'
      + '</span>'
      + '<span class="luvit-bump__price">'
      + '<s>' + money(was) + '</s>'
      + '<b>' + money(now) + '</b>'
      + '<small>خصم ' + PCT + '٪</small>'
      + '</span></span></label>';
    root.hidden = false;
  }

  function toggle(id, on, cb) {
    cb.disabled = true;
    withNonce().then(function (nv) {
      return fetch('/wp-json/wc/store/v1/cart/extensions', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'Nonce': nv },
        body: JSON.stringify({ namespace: 'luvit-bump', data: { id: id, on: on } })
      });
    }).then(grabNonce).then(function (r) {
      if (!r.ok) { throw new Error(r.status); }
      return r.json();
    }).then(function (j) {
      try { window.wp.data.dispatch('wc/store/cart').receiveCart(j); }
      catch (e) { window.location.reload(); return; }
      cb.disabled = false;
    }).catch(function () {
      cb.checked = !on;
      cb.disabled = false;
    });
  }

  root.addEventListener('change', function (ev) {
    var cb = ev.target.closest('.luvit-bump__cb');
    if (!cb || !current) { return; }
    toggle(current.id, cb.checked, cb);
  });

  var lastKey = null;
  function tick() {
    var items = cartItems();
    if (items === null) { return; }
    var bumped = items.filter(function (i) {
      return (i.item_data || []).some(function (d) { return d.name === 'عرض الشيك أوت'; });
    })[0];
    var key = items.map(function (i) { return i.id + 'x' + i.quantity; }).join(',');
    if (key === lastKey) { return; }
    lastKey = key;

    if (!items.length) { root.hidden = true; return; }
    if (bumped) {
      /* العرض مقبول · منعرضه معلّماً بدل ما نخفيه، عشان تقدر تشيله */
      current = { id: bumped.id, why: null };
      var w = best(items.filter(function (i) { return i.id !== bumped.id; }));
      current.why = (w && w.id === bumped.id) ? w.why : { bundle: '', withName: '' };
      if (D.products[bumped.id]) { draw({ id: bumped.id, why: current.why }, true); }
      return;
    }
    var c = best(items);
    if (!c) { root.hidden = true; current = null; return; }
    current = c;
    draw(c, false);
  }

  var subscribed = false;
  function ensure() {
    tick();
    if (!subscribed && window.wp && window.wp.data && window.wp.data.subscribe) {
      window.wp.data.subscribe(tick);
      subscribed = true;
    }
  }
  var tries = 0;
  var iv = setInterval(function () {
    ensure();
    if (subscribed || ++tries > 40) { clearInterval(iv); }
  }, 400);
  ensure();
})();
JS;
}
