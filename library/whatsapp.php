/**
 * LUV IT · the WhatsApp button, on the thank-you page and inside customer emails.
 *
 * Ryan, 2 Sept: «حطلي زر الواتساب بالايميل وصفحة تم الطلب».
 *
 * WHY THIS IS THE MECHANISM AND NOT A PLACEHOLDER FOR THE PAID API
 *
 * Meta charges for every message the BUSINESS starts. It charges nothing for a
 * conversation the CUSTOMER starts: her first message opens a 24 hour service
 * window, and inside it the shop may reply freely, as many times as it likes,
 * at no cost.
 *
 * So this button is not a cheap stand-in for the Cloud API. It is the thing
 * that makes the free path work: she taps, the window opens, and every
 * follow-up Ryan wants (thank you, being prepared, tips, arrival) happens
 * inside it for nothing. The paid API is for the customers who never tap.
 *
 * THE NUMBER IS DELIBERATELY EMPTY
 *
 * 0797666883 is the brand's published phone, from the schema data Ryan sent on
 * 1 Sept. It has NOT been confirmed as the WhatsApp number, and a wa.me link
 * built on a number that is not on WhatsApp opens a dead "phone number shared
 * via url is invalid" screen. That is worse than no button, which is exactly
 * why the footer icon was removed on 1 Sept rather than left pointing at «#».
 *
 * So: this file ships INERT. Every hook returns early while the constant is
 * empty, the site renders exactly as it does today, and turning the feature on
 * is one string. Nothing else has to change.
 *
 * Format: international, digits only, no «+», no spaces, no leading zero.
 * Jordan mobile 0797666883 becomes 962797666883.
 */

/** 🔴 The one line to fill. Empty means every hook below is a no-op. */
/* ✅ **الرقم أكّده ريّان ٧ أيلول ٢٠٢٦: 0797666883** · وهو رقم واتساب
 * البزنس (للبني آدمين)، وهو نفسه اللي بينعرض بكل مكان بالموقع.
 *
 * 🔴 **والرقم القديم 0797940176 كان غلط وكان حيّاً** · بالسكيما على كل
 *    صفحة وبصفحة التواصل. ريّان: «في مكان بالموقع مش متذكّر وين حطّيت
 *    رقم صاحب الموقع بشكل مؤقّت · الرقم الشخصي».
 *
 * ⚠️ **وهالملف لساه مش منشوراً كسنيبت** · كتابة الرقم هون ما بتشغّل
 *    ولا إشي لحالها. النشر قرار منفصل، ولازم قبله ريّان يضغط الرابط
 *    مرة ويتأكّد إنه بيفتح محادثة لا شاشة «رقم غير صالح».
 *
 * ⤷ ورقم الـAPI **رقم تاني بينشترى** · ريّان ٧ أيلول: «بكرا رح أشتري
 *   رقماً ثانياً عادياً وعشوائياً للـAPI، وهاي بدها دراسة معمّقة».
 *   [[two-numbers-premium-human-plain-api]] */
const LUVIT_WA_NUMBER = '962797666883';

/**
 * The wa.me URL, with her order number pre-typed into the message box.
 *
 * WHY PRE-FILL: she taps, WhatsApp opens with «مرحبا، بخصوص طلبي #192»
 * already written, and whoever answers knows which order she means before she
 * types a word. Without it the first two messages of every conversation are
 * spent working out who is calling.
 *
 * Returns '' when the number is unset, so callers can test one thing.
 */
function luvit_wa_url( $order = null ) {

	if ( '' === LUVIT_WA_NUMBER ) {
		return '';
	}

	$text = 'مرحبا';

	if ( $order instanceof WC_Order ) {
		/* The order number is a Latin run inside Arabic. In the WhatsApp
		   compose box there is no CSS to isolate it, so it is placed at the
		   END of the sentence where a bidi flip has nothing after it to
		   disturb. See the recorded «brand-name-rtl-bug» trap. */
		$text = 'مرحبا، بخصوص طلبي رقم ' . $order->get_order_number();
	}

	return 'https://wa.me/' . LUVIT_WA_NUMBER . '?text=' . rawurlencode( $text );
}

/**
 * The button markup, styled inline.
 *
 * WHY INLINE AND NOT A CLASS: this same markup goes into an email, and email
 * clients drop <style> blocks. WooCommerce does run its output through
 * style_inline(), but only for CSS it was given via the woocommerce_email_styles
 * filter, and adding a rule there for one button means snippet 209 and this file
 * both own email CSS. One owner is better.
 *
 * 🔴 AND NO !important. The project uses it in snippet 209 because there it
 * fights WooCommerce's own inline template styles and nothing else can win.
 * Here the markup is ours and has no opponent, so !important would be cargo
 * cult. Same reasoning, opposite conclusion.
 *
 * Colours are the brand tokens: #29A9C0 is the UI primary. WhatsApp green is
 * deliberately not used · the button belongs to Luvit, not to WhatsApp, and a
 * green blob is the single most common way a brand email starts looking like a
 * plugin default.
 */
function luvit_wa_button( $url, $label, $note = '' ) {

	$out  = '<table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin:24px auto;border-collapse:collapse;">';
	$out .= '<tr><td align="center" style="border-radius:12px;background:#29A9C0;">';
	$out .= '<a href="' . esc_url( $url ) . '" target="_blank" rel="noopener"';
	$out .= ' style="display:inline-block;padding:14px 28px;color:#ffffff;';
	$out .= 'font-size:16px;font-weight:600;text-decoration:none;border-radius:12px;';
	$out .= 'font-family:\'IBM Plex Sans Arabic\',Tahoma,Arial,sans-serif;">';
	$out .= esc_html( $label );
	$out .= '</a></td></tr>';

	if ( '' !== $note ) {
		$out .= '<tr><td align="center" style="padding-top:8px;color:#787c82;font-size:13px;';
		$out .= 'font-family:\'IBM Plex Sans Arabic\',Tahoma,Arial,sans-serif;">';
		$out .= esc_html( $note );
		$out .= '</td></tr>';
	}

	$out .= '</table>';

	return $out;
}

/**
 * In the email · customer messages only.
 *
 * WHY NOT THE ADMIN EMAILS: woocommerce_email_before_order_table fires for the
 * shop's own «new order» notice too, and a button inviting the shop to WhatsApp
 * itself is noise in the one inbox that has to stay scannable.
 *
 * The allow-list is explicit rather than a «not admin» test, because a plugin
 * can register its own email and it would otherwise inherit this silently.
 */
add_action(
	'woocommerce_email_before_order_table',
	function ( $order, $sent_to_admin, $plain_text, $email ) {

		if ( $sent_to_admin || $plain_text ) {
			return;
		}

		$url = luvit_wa_url( $order );
		if ( '' === $url ) {
			return;
		}

		$allowed = array(
			'customer_processing_order',
			'customer_completed_order',
			'customer_on_hold_order',
			'customer_invoice',
		);

		if ( ! isset( $email->id ) || ! in_array( $email->id, $allowed, true ) ) {
			return;
		}

		/* The copy addresses her in the feminine, and it invites rather than
		   deflects: the brand's whole position is «منكون معها أول بأول». A
		   support-desk phrasing would open the same window and say the
		   opposite thing. */
		echo luvit_wa_button(
			$url,
			'كلّمينا واتساب',
			'أي سؤال عن طلبك أو عن روتينك · إحنا معك'
		); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	},
	20,
	4
);

/**
 * On the thank-you page.
 *
 * This is the highest-intent moment there is: she has just ordered and is
 * looking at the screen. If she is ever going to open the free window, it is
 * here, which is why the button sits above the order details rather than under
 * them.
 */
add_action(
	'woocommerce_thankyou',
	function ( $order_id ) {

		$order = wc_get_order( $order_id );
		if ( ! $order ) {
			return;
		}

		$url = luvit_wa_url( $order );
		if ( '' === $url ) {
			return;
		}

		echo luvit_wa_button(
			$url,
			'كلّمينا واتساب',
			'أي سؤال عن طلبك أو عن روتينك · إحنا معك'
		); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	},
	5
);
