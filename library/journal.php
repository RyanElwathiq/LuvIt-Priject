<?php
/**
 * ============================================================================
 * LUV IT · المدوّنة · شورتكودات المقالات
 * ============================================================================
 * سنيبت WPCode من نوع PHP · التشغيل: Run Everywhere
 *
 * بيوفّر شورتكودين:
 *
 *   [luvit_journal]        شبكة المقالات · بتقرا الصفحة والتصنيف من الرابط
 *   [luvit_journal_cats]   شرائح التصنيفات
 *
 * 🔴 **ليش شورتكود بدل ويدجت Posts تبع إلمنتور:**
 *    ويدجت إلمنتور بيولّد ماركبه هو، فكلاسات مكتبتنا ما بتنطبّق عليه ·
 *    وهاي نفس الفجوة الموثّقة بـCLAUDE.md عن ووكومرس وCartFlows. الشورتكود
 *    بيطلّع **ماركبنا** بكلاساتنا، فالبطاقة هون هي نفس بطاقة المنتجات
 *    والروتينات بالضبط · مش شبيهة فيها.
 *
 * ⚠️ والشورتكود لازم ينحط بكتلة `wp:shortcode` لحاله · جوّا كتلة HTML
 *    بينطبع نصاً حرفياً (صار معنا بصفحة /track).
 * ============================================================================
 */

/* ---------------------------------------------------------------------------
 * أدوات
 * ------------------------------------------------------------------------- */

/**
 * صورة الغلاف · وإذا ما في، بترجّع رسمة SVG من لوحة العلامة.
 *
 * 🔴 base64 مش utf8 · `wptexturize` بيقوّس الاقتباسات المفردة جوّا
 *    `data:image/svg+xml;utf8,` بمحتوى المقالات فبتنكسر الصورة. صار فعلاً
 *    ٢١ آب على صفحة المنتجات · ست صور مكسورة دفعة وحدة.
 */
function luvit_cover( $post_id, $size = 'large' ) {
	if ( has_post_thumbnail( $post_id ) ) {
		return get_the_post_thumbnail( $post_id, $size, array( 'loading' => 'lazy', 'decoding' => 'async' ) );
	}
	/* بذرة ثابتة من رقم المقال · نفس المقال بياخد نفس التدرّج كل مرة */
	$pairs = array(
		array( 'rgb(234,250,253)', 'rgb(116,214,231)' ),
		array( 'rgb(208,243,249)', 'rgb(41,169,192)' ),
		array( 'rgb(208,243,249)', 'rgb(30,134,156)' ),
		array( 'rgb(234,250,253)', 'rgb(166,231,241)' ),
	);
	$p   = $pairs[ $post_id % count( $pairs ) ];
	/* 🔴 width و height إلزاميان مع viewBox.
	 * SVG بـviewBox وحده **ما إله مقاس أصلي** جوّا <img>، فالمتصفح
	 * ما بيقدر يحسب أبعاده وما بيرسمه · ومع loading="lazy" بيضل
	 * complete=false وnaturalWidth=0 للأبد.
	 * مقيس ١ أيلول على /journal: تلات بطاقات · صناديقها ٣٨٢×٢١٥
	 * محجوزة صح و**ولا صورة ظهرت**. وريّان شافها فاضية. */
	$svg = "<svg xmlns='http://www.w3.org/2000/svg' width='640' height='360' viewBox='0 0 640 360'>"
		. "<defs><linearGradient id='g{$post_id}' x1='0' y1='0' x2='1' y2='1'>"
		. "<stop offset='0' stop-color='{$p[0]}'/><stop offset='1' stop-color='{$p[1]}'/>"
		. '</linearGradient></defs>'
		. "<rect width='640' height='360' fill='url(%23g{$post_id})'/>"
		. "<path d='M0 320 C 120 300, 240 340, 360 320 S 560 300, 640 316 L640 360 L0 360 Z' "
		. "fill='rgb(255,255,255)' opacity='.28'/>"
		. '</svg>';
	$b64 = base64_encode( $svg );
	return '<img loading="lazy" decoding="async" alt="" src="data:image/svg+xml;base64,' . $b64 . '">';
}

/**
 * مدة القراءة بالدقائق.
 *
 * ⚠️ الرقم **تقديري ومكتوب كتقدير** («قراءة ٣ دقايق»)، مش وعداً. ومعدّل
 *    ١٨٠ كلمة بالدقيقة للعربي أبطأ من المعتاد بالإنجليزي لأن الكلمة
 *    العربية أكثف.
 */
function luvit_read_minutes( $post ) {
	$words = str_word_count( wp_strip_all_tags( $post->post_content ) );
	if ( $words < 1 ) {
		$words = mb_strlen( wp_strip_all_tags( $post->post_content ) ) / 5;
	}
	return max( 1, (int) ceil( $words / 180 ) );
}

/**
 * صيغة العدد بالعربي · وهاي مش تفصيلة لغوية.
 *
 * 🔴 العربية إلها **خمس صيغ عدد** مش اثنتين زي الإنجليزي. وأول تشغيل
 *    للصفحة طلّع «قراءة 1 دقايق» · وهاي بتقرا كأن الموقع مترجَم آلياً،
 *    وبتكسر الإحساس بموقع مكتوب بالعربي أصلاً بأصغر عنصر بالبطاقة.
 *
 *    ١ → دقيقة  ·  ٢ → دقيقتين  ·  ٣ لـ١٠ → X دقايق  ·  ١١+ → X دقيقة
 */
function luvit_minutes_ar( $n ) {
	if ( 1 === $n ) {
		return 'دقيقة';
	}
	if ( 2 === $n ) {
		return 'دقيقتين';
	}
	if ( $n <= 10 ) {
		return $n . ' دقايق';
	}
	return $n . ' دقيقة';
}

/* ---------------------------------------------------------------------------
 * [luvit_journal_cats]
 * ------------------------------------------------------------------------- */
function luvit_journal_cats() {
	$cats = get_categories( array( 'hide_empty' => true ) );
	if ( count( $cats ) < 2 ) {
		return ''; /* شريحة وحدة مش فلتر · هي زينة بتوهم بخيار مش موجود */
	}
	$current = isset( $_GET['cat'] ) ? sanitize_title( wp_unslash( $_GET['cat'] ) ) : '';
	$base    = get_permalink();

	/* نفس سبب الحاوية بشورتكود الشبكة · ناتج الشورتكود بينطبع بمحتوى الصفحة
	   مباشرة وما بينلفّ بشي، فبيمتد على عرض الشاشة. */
	$out  = '<section class="luvit-section luvit-section--tight band-light" data-nav-bg="light">';
	$out .= '<div class="luvit-section__inner">';
	$out .= '<div class="luvit-rail__chips" role="group" aria-label="تصنيفات المقالات">';
	$out .= sprintf(
		'<a class="luvit-rail__chip" href="%s"%s>الكل</a>',
		esc_url( $base ),
		'' === $current ? ' aria-current="true"' : ''
	);
	foreach ( $cats as $c ) {
		$out .= sprintf(
			'<a class="luvit-rail__chip" href="%s"%s>%s</a>',
			esc_url( add_query_arg( 'cat', $c->slug, $base ) ),
			$current === $c->slug ? ' aria-current="true"' : '',
			esc_html( $c->name )
		);
	}
	$out .= '</div></div></section>';
	return $out;
}
add_shortcode( 'luvit_journal_cats', 'luvit_journal_cats' );

/* ---------------------------------------------------------------------------
 * [luvit_journal]
 * ------------------------------------------------------------------------- */
function luvit_journal( $atts ) {
	$a = shortcode_atts( array( 'per_page' => 9 ), $atts, 'luvit_journal' );

	/* 🔴 `paged` مش `page` · و`cat` مش `c`.
	   ووردبريس عنده متغيّرات استعلام محجوزة، وواحد منها اسمه `m` (أرشيف
	   سنة-شهر) بيخلي صفحة سليمة ترجّع 404. وقعنا فيها ٢٢ آب لما استعملنا
	   `?m=1` ككاسر كاش. فالأسماء هون مقصودة. */
	$paged = max( 1, (int) get_query_var( 'paged' ) ?: (int) get_query_var( 'page' ) ?: 1 );
	$slug  = isset( $_GET['cat'] ) ? sanitize_title( wp_unslash( $_GET['cat'] ) ) : '';

	$args = array(
		'post_type'           => 'post',
		'post_status'         => 'publish',
		'posts_per_page'      => (int) $a['per_page'],
		'paged'               => $paged,
		'ignore_sticky_posts' => true,
	);
	if ( $slug ) {
		$args['category_name'] = $slug;
	}

	$q = new WP_Query( $args );

	if ( ! $q->have_posts() ) {
		wp_reset_postdata();
		return '<section class="luvit-section band-light" data-nav-bg="light">'
			. '<div class="luvit-section__inner">'
			. '<div class="luvit-journal__empty"><p>'
			. ( $slug
				? 'ما في مقالات بهذا التصنيف لهلأ.'
				: 'المقالات لسا بتتكتب · وأول ما تنزل بتلاقيها هون.' )
			. '</p></div></div></section>';
	}

	/* 🔴 الحاوية · بلاها المخرج بيمتد على عرض الشاشة كاملة.
	   ووردبريس بيطبع ناتج الشورتكود بمحتوى الصفحة مباشرة، وقالب
	   `elementor_header_footer` ما بيلفّه بشي · نفس اللي صار مع فورم تتبّع
	   الطلب بصفحة `/track` (سكشن 5.40 بـtokens.css). */
	$out  = '<section class="luvit-section band-light" data-nav-bg="light" id="posts">';
	$out .= '<div class="luvit-section__inner">';
	$out .= '<div class="luvit-card-grid luvit-card-grid--wide" data-luvit="stagger">';
	while ( $q->have_posts() ) {
		$q->the_post();
		$id   = get_the_ID();
		$cats = get_the_category( $id );
		$eyebrow = ( $cats && ! empty( $cats[0] ) ) ? $cats[0]->name : '';

		$out .= '<article class="luvit-card luvit-card--post">';
		$out .= '<div class="luvit-card__media">' . luvit_cover( $id ) . '</div>';
		$out .= '<div class="luvit-card__body">';
		if ( $eyebrow ) {
			$out .= '<p class="luvit-card__eyebrow">' . esc_html( $eyebrow ) . '</p>';
		}
		$out .= '<h2 class="luvit-card__title"><a class="luvit-card__link" href="'
			. esc_url( get_permalink() ) . '">' . esc_html( get_the_title() ) . '</a></h2>';
		$out .= '<p class="luvit-card__text">' . esc_html( wp_trim_words( get_the_excerpt(), 26, '…' ) ) . '</p>';
		$out .= '<p class="luvit-card__meta"><time datetime="' . esc_attr( get_the_date( 'c' ) ) . '">'
			. esc_html( get_the_date( 'j F Y' ) ) . '</time>'
			. ' · قراءة ' . esc_html( luvit_minutes_ar( luvit_read_minutes( get_post() ) ) ) . '</p>';
		$out .= '</div></article>';
	}
	$out .= '</div>';

	if ( $q->max_num_pages > 1 ) {
		$links = paginate_links( array(
			'total'     => $q->max_num_pages,
			'current'   => $paged,
			'prev_text' => 'السابق',
			'next_text' => 'التالي',
			'type'      => 'array',
			/* التصنيف المختار لازم يضل بالرابط، وإلا الصفحة التانية
			   بترجّع كل المقالات وبتبيّن الفلتر كأنه انكسر */
			'add_args'  => $slug ? array( 'cat' => $slug ) : array(),
		) );
		if ( $links ) {
			$out .= '<nav class="luvit-pager" aria-label="صفحات المقالات">' . implode( '', $links ) . '</nav>';
		}
	}

	/* إغلاق الحاوية اللي انفتحت فوق · inner ثم section */
	$out .= '</div></section>';

	wp_reset_postdata();
	return $out;
}
add_shortcode( 'luvit_journal', 'luvit_journal' );
