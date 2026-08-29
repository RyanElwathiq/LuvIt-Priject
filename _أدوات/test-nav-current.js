/* ============================================================================
 * فحص تمييز الصفحة الحالية بالقائمة · test-nav-current.js
 * ============================================================================
 * محاكي DOM صغير · بيشغّل luvitNavCurrent الحقيقي من motion.js بلا متصفح،
 * عشان نشوف المطابقة على كل حالة حدّية.
 *
 * 🔴 صُلّح بالدمج ٣٠ آب · وكان فيه عطلان بيلغوا قيمته:
 *
 *   ١. **مصفوفة روابط مكتوبة بالإيد** فيها /shop و/products الاثنين.
 *      يعني الفحص كان بيفحص هيدراً **من راسه** مش الهيدر المنشور، وبيضل
 *      يقول «تمام» بعد ما الهيدر الحقيقي يتغيّر. صار بيقرا
 *      library/header-79.html · نفس الملف اللي بينلصق بقالب إلمنتور ٧٩.
 *
 *   ٢. **ما كان فيه process.exit(1) أبداً.** كان يطبع 🔴 ويرجّع صفر، يعني
 *      أي أوتوميشن بيعتبره ناجحاً. وحالة الانهيار (ولا عنصر بينضوي) كانت
 *      بتنطبع «·» وتعدّي كأنها نتيجة عادية. صار لكل حالة **عدد متوقَّع**
 *      وبيرجّع ١ لو أي وحدة خالفت.
 *
 *   node _أدوات/test-nav-current.js
 * ============================================================================ */
const fs = require('fs');
const path = require('path');
const REPO = path.resolve(__dirname, '..');

/* ── الدالة الحقيقية من motion.js ─────────────────────────────────────── */
const src = fs.readFileSync(path.join(REPO, 'library', 'motion.js'), 'utf8');
const i = src.indexOf('function luvitNavCurrent()');
const j = src.indexOf('if (document.readyState', i);
if (i < 0 || j < 0) throw new Error('ما لقيت قسم luvitNavCurrent بـmotion.js');
const fnSrc = src.slice(i, j);

/* ── الروابط الحقيقية · بتنقرا من الهيدر المنشور مش من راسي ───────────── */
const HEADER = path.join(REPO, 'library', 'header-79.html');
const header = fs.readFileSync(HEADER, 'utf8');

const CLASSES = ['luvit-nav__link', 'luvit-drawer__link', 'luvit-dock__item', 'luvit-nav__icon-btn'];
const LINKS = [];
for (const m of header.matchAll(/<a\b[^>]*>/g)) {
  const tag = m[0];
  const cls = CLASSES.find((c) => tag.includes('class="' + c) || tag.includes(' ' + c + ' ') || tag.includes(' ' + c + '"'));
  if (!cls) continue;
  const href = (tag.match(/href="([^"]*)"/) || [])[1];
  if (href === undefined) continue;
  LINKS.push(['.' + cls, href]);
}
if (!LINKS.length) throw new Error('ما لقيت ولا رابط بالهيدر · تغيّرت الكلاسات؟');

/* ودخلاء صناعيان لازم ينتخطوا · مش موجودين بالهيدر الحقيقي */
LINKS.push(['.luvit-nav__link', '#main']);
LINKS.push(['.luvit-nav__link', 'https://plasmajo.com/products']);

function run(pathname) {
  const els = LINKS.map(([cls, href]) => ({
    cls, attrs: { href },
    getAttribute(k) { return k in this.attrs ? this.attrs[k] : null },
    setAttribute(k, v) { this.attrs[k] = v },
    removeAttribute(k) { delete this.attrs[k] },
  }));
  const document = { querySelectorAll: () => els };
  const window = { location: { pathname } };
  const fn = new Function('document', 'window', fnSrc + '\nreturn luvitNavCurrent;')(document, window);
  fn();
  return els.filter((e) => 'aria-current' in e.attrs).map((e) => e.cls + ' ' + e.attrs.href);
}

/* ── الحالات · [المسار، العدد المتوقَّع، ليش] ──────────────────────────
   العدد مشتق من بنية الهيدر مش من مخرَج التشغيل:
     · وجهة موجودة بالشريط والدرج والدوك → ٣
     · السلة → ٢ (الدوك + زر الأيقونة بالشريط)
     · صفحة بالدرج بس → ١
     · صفحة بلا رابط → ٠                                                  */
const CASES = [
  ['/',                              3, 'الرئيسية · بالثلاثة'],
  ['/products',                      3, 'المتجر الموحّد · بالثلاثة'],
  ['/products/',                     3, 'نفس /products بعد التطبيع'],
  ['/products/anything',             3, 'مسار فرعي بيستعير أباه'],
  ['/product/بكج-الروتين',            3, 'صفحة منتج · اسم عربي خام'],
  ['/product/%d8%a8%d9%83%d8%ac',    3, 'صفحة منتج · اسم مرمّز'],
  ['/product-tag/x',                 3, 'أرشيف وسم'],
  ['/product-category/singles',      3, 'أرشيف فئة'],
  ['/shop',                          3, '🔴 حارس الدمج · /shop تحويل ولازم تستعير المتجر'],
  ['/shop/',                         3, '🔴 نفس الحارس بشرطة أخيرة'],
  ['/cart',                          2, 'الدوك + زر الأيقونة'],
  ['/checkout',                      0, 'ما إلها رابط بالقائمة'],
  ['/my-account',                    1, 'بالدرج بس'],
  ['/my-account/orders',             1, 'مسار فرعي بيستعير أباه'],
  ['/checkout/order-received/123',   2, 'بيستعير السلة · المسار الحقيقي بووكومرس'],
  ['/order-received/123',            0, 'المسار القديم كان غلط وما بيطابق'],
  ['/faq',                           1, 'بالدرج الصغير'],
  ['/PRODUCTS',                      0, 'المطابقة حسّاسة للأحرف · مقصود'],
  ['//',                             3, 'بتتطبّع لـ/ فبتطابق الرئيسية'],
  ['/%zz-مكسور',                     0, 'decodeURI بيرمي · بتنقرا خام وما بتطابق'],
];

let fails = 0;
console.log('الروابط المقروءة من ' + path.relative(REPO, HEADER) + ' · ' + (LINKS.length - 2) + ' رابط\n');

for (const [p, want, why] of CASES) {
  let got, detail;
  try {
    got = run(p);
    detail = got.length ? got.join(' | ') : 'ولا عنصر';
  } catch (e) {
    got = null;
    detail = '🔴 استثناء: ' + e.message;
  }
  const n = got ? got.length : -1;
  const ok = n === want;
  if (!ok) fails++;
  console.log((ok ? '✅' : '🔴') + ' ' + p.padEnd(30) + ' متوقَّع ' + want + ' · طلع ' + (n < 0 ? 'استثناء' : n) +
              '   [' + why + ']' + (ok ? '' : '\n      ' + detail));
}

console.log('\n' + (fails ? '🔴 فشل ' + fails + ' من ' + CASES.length : '✅ نجح ' + CASES.length + ' من ' + CASES.length));
process.exit(fails ? 1 : 0);
