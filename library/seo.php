<?php
/**
 * ============================================================================
 * LUV IT · كيان العلامة بالسكيما · seo.php
 * ============================================================================
 * سنيبت WPCode من نوع PHP · التشغيل: Run Everywhere
 *
 * ── 🔴 ليش انبنى ─────────────────────────────────────────────────────────
 * كيان `Organization` اللي بيطلّعه Rank Math كان **فيه ثلاث خانات بس**:
 *     { "@type": "Organization", "@id": "...", "name": "plasmajo.com" }
 * ولا شعار · ولا حسابات تواصل · ولا نطاق خدمة · والاسم **اسم نطاق لا اسم
 * علامة**. وهاد كيان ضعيف: جوجل ما بيقدر يربط الموقع بعلامة معروفة.
 *
 * ⚠️ وليش فلتر PHP لا إعدادات Rank Math:
 *    `POST /wp-json/rankmath/v1/updateSettings` بترجّع **403** (بدها صلاحية
 *    مختلفة عن نونس الأدمن العادي)، وواجهة Titles & Meta تطبيق React ما
 *    بيعرض حقوله للقراءة الآلية. فالفلتر أوثق **وبينحفظ بالريبو** مثل
 *    tokens.css وmotion.js وjournal.php.
 *
 * ── 🔴 قاعدة المحتوى ────────────────────────────────────────────────────
 * ولا معلومة مخترعة. اللي تحت **كله مثبت**:
 *   · الاسم «لَف إت» · مكتوب بـCLAUDE.md كاسم العلامة
 *   · الشعار · نفس الملف المستعمل بالهيدر الحيّ (`luvit-logo.png`)
 *   · إنستغرام `luvit.skin.jordan` · ظاهر كاسم الحساب بمنشورات العلامة
 *     نفسها وبتاغاتها (لقطات بعتها ريّان ٣١ آب · `_وارد-ريان/`)
 *   · نطاق الخدمة الأردن · الموقع بيوصّل للأردن وحده والدفع عند الاستلام
 *
 * 🔴 **والناقص مقصود فاضي** · العنوان والهاتف وباقي الحسابات ما إلها مصدر
 *    موثّق بعد. ريّان عرض يبعتهم ١ أيلول · لما يوصلوا بتنضاف هون **وبس**.
 *    ⤷ وقيمة فاضية أحسن من قيمة مخمَّنة · العنوان الغلط بسكيما محلية
 *      بيضرّ أكثر من غيابه.
 * ============================================================================
 */

/**
 * تعبئة كيان Organization بالرسم البياني تبع Rank Math.
 *
 * ⚠️ المرشّح بينده على **كل** صفحة، والعقدة بتتلاقى بـ`@type` لا بمفتاح
 *    ثابت · Rank Math بيستعمل مفاتيح زي `organization` أو `publisher` حسب
 *    السياق، فالبحث بالنوع أثبت.
 */
add_filter( 'rank_math/json_ld', function ( $data ) {
	if ( ! is_array( $data ) ) {
		return $data;
	}

	foreach ( $data as $key => $node ) {
		if ( ! is_array( $node ) || empty( $node['@type'] ) ) {
			continue;
		}
		$types = (array) $node['@type'];
		if ( ! in_array( 'Organization', $types, true ) ) {
			continue;
		}

		$node['name']        = 'لَف إت';
		$node['alternateName'] = 'Luv it';
		$node['url']         = home_url( '/' );
		$node['areaServed']  = array(
			'@type' => 'Country',
			'name'  => 'الأردن',
		);
		$node['sameAs'] = array(
			'https://www.instagram.com/luvit.skin.jordan/',
		);

		/* الشعار · بينسحب من مكتبة الوسائط بالاسم لا برقم مثبَّت،
		   عشان ما ينكسر لو انرفع من جديد */
		$logo = get_posts( array(
			'post_type'      => 'attachment',
			'name'           => 'luvit-logo',
			'posts_per_page' => 1,
			'fields'         => 'ids',
		) );
		if ( ! empty( $logo[0] ) ) {
			$src = wp_get_attachment_image_src( $logo[0], 'full' );
			if ( $src ) {
				$node['logo'] = array(
					'@type'  => 'ImageObject',
					'url'    => $src[0],
					'width'  => $src[1],
					'height' => $src[2],
				);
				$node['image'] = $node['logo'];
			}
		}

		$data[ $key ] = $node;
	}

	return $data;
}, 20 );

/**
 * لغة الصفحة بـOpen Graph · الأردن لا العربية العامة.
 *
 * ووردبريس ما عنده لغة `ar_JO` أصلاً (العربي عنده `ar` وبس)، فـRank Math
 * بيشتقّ `ar_AR`. والسوق الأردن، فالأدقّ `ar_JO`.
 *
 * ⚠️ **وأثره متواضع بصراحة:** `og:locale` بتستعمله فيسبوك بالعرض، وجوجل
 *    **ما بيعتمد عليها** بالاستهداف الجغرافي · هو بياخد الاستهداف من
 *    Search Console ومن إشارات الكيان (العنوان · نطاق الخدمة · الحسابات).
 *    فاللي فوق بهالملف أثقل من هالسطر بكثير · وهاد مكتوب عشان ما ينحسب
 *    إنجازاً أكبر من حجمه.
 */
add_filter( 'rank_math/opengraph/facebook/og_locale', function ( $locale ) {
	return 'ar_JO';
} );

/**
 * صفحة `noindex` ما بتنحط بخريطة الموقع.
 *
 * 🔴 كانت `/cart/` و`/checkout/` و`/my-account/` **بالخريطة وهنّ
 *    `noindex, follow`** · وهاد تناقض: الخريطة بتقول لجوجل «هاي مهمة
 *    ازحفها» والوسم بيقول «لا تفهرسها». نفس الحالة كانت مع `/shop/`
 *    وهي تحويل ٣٠١.
 *
 * ⚠️ وليش فلتر لا إعداد: ضبط `rank_math_robots` على الصفحات **انحفظ
 *    فعلاً** (رد 200) و**الخريطة ما تغيّرت** · وRank Math بيخزّن الخريطة
 *    وما لقيت اسم إجراء يمسح كاشها من `toolsAction` (جرّبت أربعة).
 *    فالاستبعاد هون بينحسب وقت التوليد ومش معتمداً على كاش.
 *
 * ⤷ وهو **عام لا قائمة أسماء**: أي صفحة تتعلّم `noindex` بالمستقبل
 *   بتختفي من الخريطة لحالها بلا ما نعدّل هون.
 */
add_filter( 'rank_math/sitemap/entry', function ( $url, $type, $object ) {
	if ( 'post' !== $type || empty( $object->ID ) ) {
		return $url;
	}
	$robots = get_post_meta( $object->ID, 'rank_math_robots', true );
	if ( is_array( $robots ) && in_array( 'noindex', $robots, true ) ) {
		return false;
	}
	return $url;
}, 10, 3 );
