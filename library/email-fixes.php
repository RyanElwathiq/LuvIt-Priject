/**
 * LUV IT · two things wrong with the order emails, both of them WooCommerce's.
 *
 * Ryan, 2 Sept: «الاعلانات اللي بتيجي مع الايميل تبع ووكومرس لتطبيقهم مالها داعي».
 *
 * Everything below is cited to WooCommerce 11.0.0 source with line numbers. No
 * hook name here is written from memory, because a hook that does not exist
 * fails silently and reads exactly like a hook that does.
 *
 * NOT HERE, and deliberately:
 *
 *   The subjects and the footer text. Those are `{site_title}` in WooCommerce's
 *   own settings, and WC_Email::__construct() freezes $this->placeholders with
 *   '{site_title}' => $this->get_blogname() at class-wc-email.php:317, long
 *   before any render hook runs. No filter reaches them. They are typed
 *   literally in the WooCommerce settings and recorded in email-copy.json.
 *
 *   The site name inside the header. The Site Title is now `Luv it` in Latin
 *   (Ryan, 2 Sept), so there is nothing left to rewrite at render time.
 *
 *   The Levantine month names. That one has a site-wide blast radius and is
 *   Ryan's call, not ours.
 */

/**
 * 1 · The WooCommerce mobile-app advert, out of the shop's own order email.
 *
 * «Process your orders on the go. Get the app» is WooCommerce advertising
 * WooCommerce, wedged into an operational email that carries a customer's
 * order. It is not template text, so gettext cannot touch it: it is a method
 * bound to a hook.
 *
 *   add_action( 'woocommerce_email_footer', array( $this, 'mobile_messaging' ), 9 );
 *   class-wc-email-new-order.php:52
 *
 * Removing it needs the SAME object instance the hook was registered with, so
 * this runs on `woocommerce_email`, which fires at the end of
 * WC_Emails::__construct() (class-wc-emails.php:274) AFTER $this->init()
 * (line 240) has populated the array. Any earlier and the instance does not
 * exist yet; any later and the footer has already rendered.
 *
 * The isset() guard is not decoration. If a WooCommerce release renames the
 * class or restructures the array, this stops quietly instead of throwing a
 * fatal in the middle of sending an order email.
 */
add_action(
	'woocommerce_email',
	function ( $wc_emails ) {

		if ( ! isset( $wc_emails->emails['WC_Email_New_Order'] ) ) {
			return;
		}

		remove_action(
			'woocommerce_email_footer',
			array( $wc_emails->emails['WC_Email_New_Order'], 'mobile_messaging' ),
			9
		);
	}
);

/**
 * 2 · The admin order email arrives in English. The customer's does not.
 *
 * MEASURED on order #192, two renders of the same template four minutes apart:
 *
 *   customer copy · lang="ar"    dir="rtl"   «ملخص الطلب» «عنوان الفاتورة»
 *   admin copy    · lang="en-US" dir="ltr"   "Order summary" "Billing address"
 *
 * So the Arabic translation is NOT missing. Both copies read the same
 * translation files. WooCommerce simply refuses to switch locale for admin
 * mail, and the refusal is hard-coded rather than filtered:
 *
 *   WC_Email::setup_locale()  ·  class-wc-email.php:429
 *   if ( $switch_email_locale && $this->is_customer_email() && ... )
 *
 * `is_customer_email()` sits inside the condition, not behind a filter, so
 * `woocommerce_email_setup_locale` can switch the behaviour OFF but cannot
 * switch it ON for an admin email.
 *
 * 🔴 And this is not only a wording problem. With lang="en-US", is_rtl()
 *    returns false, so snippet 209 (library/email-rtl.php) returns on its
 *    first line and adds no CSS at all. Fixing the strings without fixing the
 *    locale would deliver Arabic text left-aligned inside an ltr wrapper,
 *    which is worse than English. The locale comes first.
 *
 * So switch around the trigger itself. The nine hooks below are copied
 * verbatim from WC_Email_New_Order::__construct() (class-wc-email-new-order.php
 * lines 43 to 51). WooCommerce registers its own handler on each at priority
 * 10, so we open at 5 and close at 15.
 *
 * Nesting is safe: WordPress stacks locale switches through
 * WP_Locale_Switcher, so if the customer email switches inside ours it
 * restores to ours, and ours restores to the original after.
 */
if ( ! function_exists( 'luvit_email_switch_locale' ) ) {

	function luvit_email_switch_locale() {
		if ( function_exists( 'wc_switch_to_site_locale' ) ) {
			wc_switch_to_site_locale();
		}
	}

	function luvit_email_restore_locale() {
		if ( function_exists( 'wc_restore_locale' ) ) {
			wc_restore_locale();
		}
	}
}

foreach (
	array(
		'woocommerce_order_status_pending_to_processing_notification',
		'woocommerce_order_status_pending_to_completed_notification',
		'woocommerce_order_status_pending_to_on-hold_notification',
		'woocommerce_order_status_failed_to_processing_notification',
		'woocommerce_order_status_failed_to_completed_notification',
		'woocommerce_order_status_failed_to_on-hold_notification',
		'woocommerce_order_status_cancelled_to_processing_notification',
		'woocommerce_order_status_cancelled_to_completed_notification',
		'woocommerce_order_status_cancelled_to_on-hold_notification',
	) as $luvit_order_email_hook
) {
	add_action( $luvit_order_email_hook, 'luvit_email_switch_locale', 5 );
	add_action( $luvit_order_email_hook, 'luvit_email_restore_locale', 15 );
}
unset( $luvit_order_email_hook );

/**
 * 2b · And the same for a manual resend from the order screen.
 *
 * MEASURED, and it is the reason this block exists: the nine hooks above fire
 * on a real status transition and NOT on «Resend new order notification».
 * That admin action calls the email's trigger() directly:
 *
 *   do_action( 'woocommerce_before_resend_order_emails', $order, 'new_order' );
 *   WC()->mailer()->emails['WC_Email_New_Order']->trigger( ... );
 *   do_action( 'woocommerce_after_resend_order_email', $order, 'new_order' );
 *   includes/admin/meta-boxes/class-wc-meta-box-order-actions.php
 *
 * So the first test of block 2 came back in English and looked like a failed
 * fix. It was a test that never ran the code. Covering the resend path makes
 * the behaviour identical whether an order arrives by itself or someone
 * presses the button, and it is the only way to verify this without placing a
 * real order every time.
 */
add_action( 'woocommerce_before_resend_order_emails', 'luvit_email_switch_locale', 5 );
add_action( 'woocommerce_after_resend_order_email', 'luvit_email_restore_locale', 15 );

/**
 * 3 · Month names. Levantine, not Gulf.
 *
 * Ryan, 2 Sept, approving the blast radius below: «اه اعمله».
 *
 * The order email prints «٢١ أغسطس ٢٠٢٦». Jordan says «آب». Both are correct
 * Arabic; they are simply different regional conventions, and a Jordanian
 * brand writing to Jordanian women should use the Jordanian one.
 *
 * The source is NOT WooCommerce, not the template, and not our gettext filter:
 *
 *   WP_Locale::init()  ·  wp-includes/class-wp-locale.php
 *   $this->month['08'] = __( 'August' );          ← domain `default`
 *
 * 🔴 So the gettext filter in snippet 200 provably cannot reach it: that
 *    filter returns early for any domain that is not `woocommerce`. And even
 *    without the guard it would need BOTH `gettext` and `gettext_with_context`,
 *    because month_genitive is built with _x().
 *
 * Writing to the object directly is simpler and has no domain problem.
 *
 * TWO hooks, and the second is the one that matters:
 *   `init`          · covers the front end and wp-admin.
 *   `change_locale` · WP_Locale_Switcher::change_locale() does
 *                     `$wp_locale = new WP_Locale();` and THEN fires
 *                     `change_locale`. Every locale switch rebuilds the object
 *                     and wipes our values, so we rewrite after each one.
 *                     Customer emails switch locale, and block 2 above now
 *                     switches it for admin emails too, so both are covered.
 *
 * 🔴 month_abbrev is keyed by the FULL month name, not by the number, so it
 *    has to be rebuilt from the new names. Skip that and the `M` date format
 *    returns empty.
 *
 * ⚠️ Guarded to Arabic locales. Without the guard, an English admin profile
 *    would see «كانون الثاني» inside English admin screens.
 *
 * ⚠️ SCOPE, stated plainly because Ryan approved it knowing this: the whole
 *    site in Arabic, not just email. Journal post dates and the my-account
 *    order list become «آب» too. That is the consistent choice for a Jordanian
 *    brand, and it is a bigger blast radius than an email fix.
 */
if ( ! function_exists( 'luvit_levant_month_names' ) ) {

	function luvit_levant_month_names( $locale = '' ) {

		global $wp_locale;

		if ( ! ( $wp_locale instanceof WP_Locale ) ) {
			return;
		}

		if ( '' === $locale || ! is_string( $locale ) ) {
			$locale = function_exists( 'determine_locale' ) ? determine_locale() : get_locale();
		}

		if ( 0 !== strpos( $locale, 'ar' ) ) {
			return;
		}

		$luvit_months = array(
			'01' => 'كانون الثاني',
			'02' => 'شباط',
			'03' => 'آذار',
			'04' => 'نيسان',
			'05' => 'أيار',
			'06' => 'حزيران',
			'07' => 'تموز',
			'08' => 'آب',
			'09' => 'أيلول',
			'10' => 'تشرين الأول',
			'11' => 'تشرين الثاني',
			'12' => 'كانون الأول',
		);

		$wp_locale->month          = $luvit_months;
		$wp_locale->month_genitive = $luvit_months;

		/* Arabic has no month abbreviations, so the abbreviation IS the name.
		   The key must be the new name, not the number. */
		$wp_locale->month_abbrev = array();
		foreach ( $luvit_months as $luvit_month_name ) {
			$wp_locale->month_abbrev[ $luvit_month_name ] = $luvit_month_name;
		}
	}
}

add_action( 'init', 'luvit_levant_month_names', 20 );
add_action( 'change_locale', 'luvit_levant_month_names' );

/* If WPCode runs this snippet after `init` has already passed, the direct call
   covers the current request. Safe to call twice: it checks the object and the
   locale itself. */
luvit_levant_month_names();

/**
 * 4 · The product thumbnail in order emails. OFF, for now.
 *
 * It is not broken: it loads fine and renders a SOLID BLACK SQUARE. Measured
 * 2 Sept: the file the template actually requests is `-100x100.webp`, an
 * extended WebP with an ALPH chunk; 8,998 of 10,000 pixels fully transparent
 * and 8,394 of those carry RGB (0,0,0). Gmail's image proxy converts WebP to
 * JPEG, JPEG cannot carry alpha, and the transparent area flattens onto the
 * black underneath. Same root cause as the logo that was caught the same day
 * (see the flattened `luvit-logo-email.png`).
 *
 * NOT fixed with `woocommerce_order_item_thumbnail` returning '' — the
 * `<td class="email-order-item-thumbnail" style="width:72px">` is echoed
 * WITH that filter inline (email-order-items.php), so emptying it leaves a
 * permanent 72px gutter beside every product name. The `if ( $show_image )`
 * gate wraps the whole cell, so the args filter is the right lever.
 *
 * NOT fixed with bgcolor or a CSS background either: the alpha is flattened
 * by the proxy before any CSS runs, and `bgcolor` is not in kses' img
 * allowlist. And not with a data: URI (wp_allowed_protocols has no `data`).
 *
 * Ryan, 2 Sept: stage 8 replaces every product image with the real photos
 * from the site owner. The cheapest correct path is to make "no transparency
 * in the email version" a rule of that handover and keep this off until then.
 */
add_filter( 'woocommerce_email_order_items_args', function ( $args ) {
	if ( is_array( $args ) ) {
		$args['show_image'] = false;
	}
	return $args;
}, 20 );
