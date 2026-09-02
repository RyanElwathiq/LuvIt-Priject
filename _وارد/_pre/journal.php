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
	/* 🔴 كانت التدرّجات تبدأ من شبه أبيض (234,250,253) وتنتهي فاتحة ·
	 * فالغلاف كان **بينختفي** بالبطاقة البيضا، وريّان شافه فراغاً.
	 * الأزواج تحت بتبدأ من عمق فعلي · الغلاف صار يقرا كصورة لا كفراغ،
	 * وبيمشي مع لغة الماء تبع باقي الموقع بدل ما يكون رمادياً محايداً. */
	$pairs = array(
		array( 'rgb(18,77,90)',   'rgb(76,197,218)' ),
		array( 'rgb(8,38,46)',    'rgb(41,169,192)' ),
		array( 'rgb(30,134,156)', 'rgb(166,231,241)' ),
		array( 'rgb(12,51,60)',   'rgb(116,214,231)' ),
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
		/* 🔴 `#` حرفي · **مش** `%23`.
		 * الترميز `%23` لازم لمّا الـSVG بينحط بـ`data:image/svg+xml;utf8,`
		 * لأنه وقتها **جوّا رابط**، و`#` بتقطع الرابط عند الشظية.
		 * بس الصورة انتحوّلت لـbase64 (هربًا من wptexturize) و**الترميز ضلّ
		 * مكانه** · فصار الـXML المفكوك فيه `fill='url(%23g225)'` وهاد
		 * **مرجع غير صالح**، فالمستطيل ما انرسم ولا مرة والغلاف طلع شفافاً.
		 * ⤷ يعني الأغلفة كانت فاضية **من يوم ما انبنت**، واللي كنا نشوفه
		 *   خلفية البطاقة + الموجة البيضا (فيلها حرفي فاشتغل).
		 * ⚠️ والفخّ الأصلي (base64 بدل utf8) انحلّ صح · اللي انتنسي إنه
		 *   **تغيير الوعاء بيبطّل هروب الوعاء القديم**. */
		. "<rect width='640' height='360' fill='url(#g{$post_id})'/>"
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
	/* 🔴 كان `str_word_count` مع احتياطي `if ( \$words < 1 )` · وهاد **مكسور
	 * للعربي**، والحارس ما بيمسكه:
	 *   `str_word_count` بتعدّ تسلسلات **الحروف اللاتينية وبس**، فالمقال
	 *   العربي بيرجّع صفراً والاحتياطي بينده. بس **كلمة إنجليزية وحدة**
	 *   («B3» · «AHA») بتخليها ترجّع 1، والحارس `< 1` ما بينطبق،
	 *   فبتنحسب المقالة كلها **كلمة وحدة**.
	 *
	 * مقيس ١ أيلول على المقالات الجديدة:
	 *   نياسيناميد  ٣٦٥ كلمة → `str_word_count`=1 → «قراءة دقيقة»  🔴
	 *   الترتيب     ٣٦٦ كلمة → =0 → الاحتياطي اشتغل → «٣ دقايق»  ✅
	 *   الدهنية     ٣٤٧ كلمة → =2 → «قراءة دقيقة»  🔴
	 * يعني الرقم كان بيكذب على مقالين من تلاتة، **والتلاتة نفس الطول**.
	 *
	 * ⤷ والحل مش تحسين الحارس · الحل **دالة بتعدّ بأي لغة**:
	 *   الفصل على المسافات مع راية `u` بيمشي على العربي واللاتيني سوا.
	 *
	 * ⚠️ و`round` لا `ceil`: ٣٦٥ كلمة = ٢٫٠٣ دقيقة، و`ceil` بتطلّعها
	 *    «٣ دقايق» · مبالغة بنص دقيقة على رقم معروض كتقدير أصلاً. */
	$text  = trim( wp_strip_all_tags( $post->post_content ) );
	$parts = preg_split( '/\s+/u', $text, -1, PREG_SPLIT_NO_EMPTY );
	$words = is_array( $parts ) ? count( $parts ) : 0;

	/* ١٨٠ كلمة بالدقيقة · أبطأ من المعتاد بالإنجليزي لأن الكلمة العربية أكثف */
	return max( 1, (int) round( $words / 180 ) );
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
	/* المعرّف مطلوب · CSS بتحاذي الشرائح لجهة البداية عبره، عشان تقرا
	   كفلتر لا كزينة بالوسط */
	$out  = '<section class="luvit-section luvit-section--tight band-light" data-nav-bg="light" id="journal-cats">';
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

/* ===========================================================================
 * صفحة المقال الواحد
 * ===========================================================================
 * 🔴 ريّان ١ أيلول: «صفحة المقالات كشكل عام برضه ما تحدثت». وفتحت المقال
 *    نفسه ولقيت إنه **ما إله تصميم أبداً** · قالب Hello الخام:
 *        .page-header > h1   ثم   .page-content   ثم   فورم تعليقات
 *    ولا تصنيف، ولا تاريخ، ولا مدة قراءة، ولا مقالات مقترحة، ولا مخرج.
 *    والعنوان بيصطدم بالنافبار، والنص بعرض **1140px** · سطر ما بينقرا.
 *
 * ── وليش `the_content` لا قالب ─────────────────────────────────────────
 * القالب بيطبع `h1` **قبل** المحتوى، فما بقدر أحقن الرأس فوقه من هون.
 * والبديل (إخفاء `.page-header` وإعادة طباعة `h1` جوّا المحتوى) بيعمل
 * **عنوانين h1 بنفس الصفحة** · ضرر SEO حقيقي مقابل مكسب تجميلي.
 *
 * ⤷ فالتقسيم: الشريط العميق بينعمل **بالـCSS** على `.page-header`
 *   الموجودة، والبيانات والمقترحات بينحقنوا هون. كل واحد بمكانه الصح.
 *
 * ⚠️ والحارس تحت مش زينة: `the_content` بينده بسياقات كثيرة (المقتطفات ·
 *    حلقات تانية · فيدات RSS). بلا `is_main_query` و`in_the_loop` بيصير
 *    الرأس ينطبع جوّا بطاقات القائمة كمان.
 * ========================================================================= */
function luvit_single_article( $content ) {
	if ( ! is_singular( 'post' ) || ! in_the_loop() || ! is_main_query() ) {
		return $content;
	}

	$id   = get_the_ID();
	$cats = get_the_category( $id );

	/* ── سطر البيانات · تصنيف · تاريخ · مدة · ورجعة للقائمة ── */
	$meta  = '<p class="luvit-artmeta">';
	if ( $cats && ! empty( $cats[0] ) ) {
		$meta .= sprintf(
			'<a class="luvit-artmeta__cat" href="%s">%s</a>',
			esc_url( add_query_arg( 'cat', $cats[0]->slug, home_url( '/journal/' ) ) ),
			esc_html( $cats[0]->name )
		);
	}
	$meta .= sprintf(
		'<time datetime="%s">%s</time>',
		esc_attr( get_the_date( 'c', $id ) ),
		esc_html( get_the_date( 'j F Y', $id ) )
	);
	$meta .= '<span aria-hidden="true">·</span>';
	$meta .= 'قراءة ' . esc_html( luvit_minutes_ar( luvit_read_minutes( get_post( $id ) ) ) );
	$meta .= '<a class="luvit-artmeta__back" href="' . esc_url( home_url( '/journal/' ) ) . '">كل المقالات</a>';
	$meta .= '</p>';

	/* ── المقترحات · من نفس التصنيف أول، وبتكمّل من الأحدث ──
	 * 🔴 ولا مرة `orderby => rand` · بتكسر كاش الصفحات وبتخلي نفس القارئة
	 *    تشوف ترتيباً مختلفاً كل تحديث بلا سبب. */
	$related = '';
	$ids     = array();
	if ( $cats && ! empty( $cats[0] ) ) {
		$ids = get_posts( array(
			'post_type'        => 'post',
			'posts_per_page'   => 3,
			'post__not_in'     => array( $id ),
			'category__in'     => array( (int) $cats[0]->term_id ),
			'fields'           => 'ids',
			'suppress_filters' => false,
		) );
	}
	if ( count( $ids ) < 3 ) {
		$more = get_posts( array(
			'post_type'      => 'post',
			'posts_per_page' => 3 - count( $ids ),
			'post__not_in'   => array_merge( array( $id ), $ids ),
			'fields'         => 'ids',
		) );
		$ids = array_merge( $ids, $more );
	}

	if ( $ids ) {
		$related .= '<aside class="luvit-related">';
		$related .= '<h2 class="luvit-related__title">اقرأي كمان</h2>';
		$related .= '<ul class="luvit-related__list">';
		foreach ( $ids as $rid ) {
			$rc       = get_the_category( $rid );
			$related .= '<li class="luvit-related__item"><a href="' . esc_url( get_permalink( $rid ) ) . '">';
			if ( $rc && ! empty( $rc[0] ) ) {
				$related .= '<span class="luvit-related__eyebrow">' . esc_html( $rc[0]->name ) . '</span>';
			}
			$related .= '<span class="luvit-related__name">' . esc_html( get_the_title( $rid ) ) . '</span>';
			$related .= '</a></li>';
		}
		$related .= '</ul></aside>';
	}

	/* ── المخرج · مقال بلا مخرج صفحة ميتة ── */
	$cta  = '<aside class="luvit-related luvit-related--cta">';
	$cta .= '<h2 class="luvit-related__title">وإذا بدك تطبّقي اللي قريتيه</h2>';
	$cta .= '<p class="luvit-section__foot">';
	$cta .= '<a class="luvit-btn luvit-btn--arrow" href="' . esc_url( home_url( '/quiz/' ) ) . '">اكتشفي روتينك</a> ';
	$cta .= '<a class="luvit-btn luvit-btn--ghost" href="' . esc_url( home_url( '/routines/' ) ) . '">شوفي الروتينات</a>';
	$cta .= '</p></aside>';

	return $meta . $content . $related . $cta;
}
add_filter( 'the_content', 'luvit_single_article' );

/**
 * التعليقات مقفولة على المقالات.
 *
 * 🔴 كان فورم تعليقات ووردبريس مفتوحاً بآخر كل مقال · مصيدة سبام على موقع
 *    تجاري ما فيه إدارة تعليقات، وشكله الخام بيكسر الإحساس بموقع مصمَّم.
 * ⚠️ وبينقفل **بالعرض** لا بالبيانات · ما بيلمس ولا تعليقاً محفوظاً (وما
 *    في ولا واحد الآن)، فلو ريّان بدّه يرجّعها بيشيل هالفلتر وبس.
 */
add_filter( 'comments_open', function ( $open, $post_id ) {
	return ( 'post' === get_post_type( $post_id ) ) ? false : $open;
}, 10, 2 );

/**
 * غلاف المقال كخلفية لشريط الرأس.
 *
 * بينطبع متغيّر CSS بالـhead، والـCSS بتركّبه تحت تدرّج غامق. وليش متغيّر
 * لا خاصية مباشرة: الستايل كله بـtokens.css (سنيبت واحد · مصدر حقيقة
 * واحد)، وهون بينمرّر **الرابط وبس**.
 *
 * ⚠️ والتدرّج فوق الصورة مش زينة · هو اللي بيضمن إن العنوان الأبيض يضل
 *    مقروءاً مهما كان الغلاف فاتحاً. غلاف «الترتيب» تحديداً شبه أبيض،
 *    وبلا الطبقة الغامقة العنوان بيختفي.
 * 🔴 والتباين **بينقاس** بعد أي تغيير على شفافية الطبقة · مش بينشاف.
 */
add_action( 'wp_head', function () {
	if ( ! is_singular( 'post' ) || ! has_post_thumbnail() ) {
		return;
	}
	$url = get_the_post_thumbnail_url( get_the_ID(), 'full' );
	if ( ! $url ) {
		return;
	}
	echo '<style id="luvit-art-cover">.single-post .page-header{--art-cover:url('
		. esc_url( $url ) . ')}</style>';
}, 20 );
