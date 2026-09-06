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
		if ( ! luvit_pk_tier_pct( $item['product_id'], $item['quantity'] ) ) {
			continue;
		}
		$price = luvit_pk_tier_price( $item['product_id'], $item['quantity'] );
		if ( null !== $price ) {
			$item['data']->set_price( $price );
		}
	}
}, 20 );

/* سطر بالسلة بيقول ليش السعر نزل · بلاه بتبيّن غلطة لا هدية */
add_filter( 'woocommerce_get_item_data', function ( $data, $item ) {
	if ( empty( $item['product_id'] ) ) {
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
