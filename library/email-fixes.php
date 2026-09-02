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
