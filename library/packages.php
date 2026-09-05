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

/* خريطة الباقات · بتنبنى مرة بكل طلب وبتتخزّن بترانزيينت */
function luvit_pk_map() {
	static $map = null;
	if ( null !== $map ) {
		return $map;
	}

	$cached = get_transient( 'luvit_pk_map' );
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
		$raw   = luvit_pk_norm( wp_strip_all_tags( $b->get_short_description() ) );
		$parts = ( '' === $raw ) ? array() : preg_split( '/\s\+\s/u', $raw );

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
			'freeship' => has_term( 'packages', 'product_cat', $b->get_id() ),
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
	set_transient( 'luvit_pk_map', $map, DAY_IN_SECONDS );
	return $map;
}

/* أي تعديل على منتج بيرمي الخريطة · السعر بيتغيّر والتوفير لازم يلحق */
add_action( 'woocommerce_update_product', function () { delete_transient( 'luvit_pk_map' ); } );
add_action( 'woocommerce_new_product',    function () { delete_transient( 'luvit_pk_map' ); } );
add_action( 'woocommerce_delete_product', function () { delete_transient( 'luvit_pk_map' ); } );

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
