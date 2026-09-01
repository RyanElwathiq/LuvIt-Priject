#!/usr/bin/env node
/**
 * ============================================================================
 * توليد أغلفة المقالات · OpenRouter / Nano Banana Pro
 * ============================================================================
 *   node _أدوات/gen-covers.mjs            ← عرض الخطة والكلفة · بلا توليد
 *   node _أدوات/gen-covers.mjs --one      ← غلاف واحد للمعاينة
 *   node _أدوات/gen-covers.mjs --yes      ← الكل
 *
 * ── 🔴 المفتاح ────────────────────────────────────────────────────────
 * ولا مرة بينكتب بالمحادثة ولا بملف متتبَّع · ريّان بيحطّه بإيده.
 * بينقرا من: OPENROUTER_API_KEY  ثم  <جذر الريبو>/.openrouter-key
 * وما بينطبع ولا جزء منه · ولا برسائل الخطأ.
 *
 * ── 🔴 الكلفة · وما في إلغاء ──────────────────────────────────────────
 * سعر OpenRouter المعلَن **لكل توكن مخرَج** لا لكل صورة:
 *     google/gemini-3-pro-image · image_output = $0.00012/توكن
 * وصورة Gemini ≈ ١٢٩٠ توكناً → **≈ $0.155 للصورة**.
 * ⚠️ وهاد **تقدير من وثائق المزوّد**، والكلفة الحقيقية بترجع بـ
 *    `usage.cost` مع كل رد · والسكربت بيطبعها ويجمّعها.
 *
 * 🔴 ودرس مدفوع مسجَّل: استكشاف نقطة مدفوعة بقيمة غلط متعمّدة كلّف
 *    **$2.62** بلا رجعة (٣٠ آب · seconds:999 انقبلت). فما في «جرّب وشوف» ·
 *    بلا `--yes` أو `--one` السكربت **ما بيبعت ولا طلب**.
 *
 * ── 🔴 قواعد المحتوى · مش تفضيلات ────────────────────────────────────
 * ١ · **ولا نصّ بالصورة.** الموديلات بتكتب عربي مشوّهاً، وغلاف فيه حروف
 *     مكسورة أسوأ من غلاف فاضي.
 * ٢ · **ولا وجوه.** وجه مولَّد على موقع عناية بالبشرة بيقرا كوعد نتيجة ·
 *     وإحنا ما منوعد. (وصور النتائج الحقيقية إلها بندها الخاص بخطة
 *     الإطلاق، وبدها إذن مكتوب.)
 * ٣ · **ولا عبوات ولا ملصقات.** عبوة مولَّدة بتشبه عبوتنا = منتج مزيَّف.
 *     العبوات الحقيقية عنا مصوّرة أصلاً بـ`library/img/`.
 * ٤ · التجريد فقط: ماء · قطرات · زجاج · ضوء · نسيج. لغة العلامة نفسها.
 * ============================================================================
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '..');
const OUT = path.join(REPO, 'library', 'img', 'journal');

const MODEL = 'google/gemini-3-pro-image';
const EST_PER_IMAGE = 0.155;

/* لغة العلامة · بتنضاف لكل برومبت · مكتوبة مرة وحدة عشان الأغلفة تطلع
   عيلة وحدة لا صوراً متفرّقة */
const STYLE = [
  'Editorial abstract still life, underwater aesthetic.',
  'Palette strictly: deep teal #08262E and #124D5A in the depths,',
  'turquoise #4CC5DA and #29A9C0 in the light, soft near-white highlights.',
  'Soft caustic light rays from above, fine suspended bubbles, glassy translucency.',
  'Clean, calm, premium skincare brand mood. Shallow depth of field.',
  'Absolutely no text, no letters, no numbers, no logos, no watermarks.',
  'No people, no faces, no hands, no skin.',
  'No product bottles, no packaging, no labels.',
  '16:9 wide composition with clear empty space in the lower third.',
].join(' ');

const COVERS = [
  {
    slug: 'oily-skin-why-moisturize',
    ar: 'بشرتي دهنية · ليش بدي أرطّب؟',
    idea: 'Water beading into perfect round droplets on a smooth translucent surface, '
      + 'some droplets merging into a thin even film. The contrast between scattered beads '
      + 'and a calm continuous layer is the subject.',
  },
  {
    slug: 'why-layer-order-matters',
    ar: 'ليش الترتيب بيفرق · من الأخف للأتقل',
    idea: 'Four distinct translucent liquid layers of increasing density stacked in clear water, '
      + 'lightest and most transparent at the top, densest and most saturated at the bottom, '
      + 'with clean visible boundaries between them.',
  },
  {
    slug: 'niacinamide-what-it-does',
    ar: 'نياسيناميد · شو بيعمل وشو ما بيعمل',
    idea: 'A single large crystal-clear droplet suspended in deep water, refracting the light '
      + 'above it into a soft ring. Around it, much smaller droplets drifting out of focus.',
  },

  /* ── الدفعة الثانية · ١ أيلول ────────────────────────────────────────
     🔴 وكل فكرة **موضوعها موضوع مقالها** لا زينة مائية عامة · الغلاف
        اللي بيشرح شي بينقرا، واللي بس حلو بينتنسى. */
  {
    slug: 'what-free-from-labels-mean',
    ar: 'شهادات العبوة · شو بتعني فعلاً',
    /* المقال عن **الغياب**: خالٍ من العطور · من الكحول · من الملوّنات */
    idea: 'A tall pane of perfectly clear glass standing upright in still water, its surface '
      + 'completely unmarked and holding not one bubble or particle, while the water all '
      + 'around it carries fine drifting specks and motes. The contrast between the spotless '
      + 'pane and the busy water is the subject.',
  },
  {
    slug: 'how-often-to-exfoliate',
    ar: 'التقشير · كم مرة وشو تتجنّبي',
    /* الطبقات بترتفع وحدة وحدة · لا كشط ولا عنف */
    idea: 'Extremely thin translucent films lifting one at a time from a smooth surface '
      + 'underwater and drifting slowly upward, revealing an even clean surface beneath. '
      + 'Gentle and unhurried, only a few films in motion.',
  },
  {
    slug: 'why-results-take-time',
    ar: 'ليش النتيجة بتاخد وقت',
    /* الزمن · حلقة بتتسع ببطء عبر مساحة واسعة */
    idea: 'A single drop has struck a vast still water surface and its ripple is spreading '
      + 'outward in wide, slow, evenly spaced concentric rings, the outermost ones so faint '
      + 'they almost vanish at the edges of the frame. Nothing else in the scene.',
  },
  {
    slug: 'panthenol-the-quiet-one',
    ar: 'بانثينول · المكوّن الهادي',
    /* المساند اللي ما حدا بيلاحظه · هالة بتحمل اللي حواليها */
    idea: 'A wide soft diffuse halo of pale light underwater, cradling several smaller, '
      + 'brighter, sharply focused droplets. The halo is so gentle it is almost invisible '
      + 'until you look for it, and the bright droplets clearly sit inside it.',
  },
];

/* ── المفتاح ─────────────────────────────────────────────────────────── */
function key() {
  if (process.env.OPENROUTER_API_KEY) return process.env.OPENROUTER_API_KEY.trim();
  const f = path.join(REPO, '.openrouter-key');
  if (fs.existsSync(f)) return fs.readFileSync(f, 'utf8').trim();
  console.error('🔴 ما في مفتاح OpenRouter.');
  console.error('   حطّه بـ OPENROUTER_API_KEY أو بملف .openrouter-key بجذر الريبو.');
  process.exit(1);
}

/* ── التوليد ─────────────────────────────────────────────────────────── */
async function generate(c, KEY) {
  const prompt = c.idea + ' ' + STYLE;
  const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + KEY,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://plasmajo.com',
      'X-Title': 'LUV IT journal covers',
    },
    body: JSON.stringify({
      model: MODEL,
      modalities: ['image', 'text'],
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  const txt = await r.text();
  if (!r.ok) {
    /* ⚠️ الرد ممكن يحمل المفتاح بالصدى · بنطبع الحالة والرسالة وبس */
    let msg = '';
    try { msg = (JSON.parse(txt).error || {}).message || ''; } catch { msg = txt.slice(0, 160); }
    throw new Error(r.status + ' · ' + msg);
  }

  const j = JSON.parse(txt);
  const m = j.choices?.[0]?.message;
  const url = m?.images?.[0]?.image_url?.url;
  if (!url) {
    throw new Error('ولا صورة بالرد · ' + JSON.stringify(Object.keys(m || {})));
  }
  const b64 = url.split(',')[1];
  if (!b64) throw new Error('الصورة مش data URI');

  fs.mkdirSync(OUT, { recursive: true });
  const file = path.join(OUT, c.slug + '.png');
  fs.writeFileSync(file, Buffer.from(b64, 'base64'));

  return {
    file,
    kb: (fs.statSync(file).size / 1024).toFixed(0),
    cost: j.usage?.cost,
    tokens: j.usage?.completion_tokens,
  };
}

/* ── التشغيل ─────────────────────────────────────────────────────────── */
const argv = process.argv.slice(2);
const ONE = argv.includes('--one');
const ALL = argv.includes('--yes');
const list = ONE ? COVERS.slice(0, 1) : COVERS;

console.log('الموديل : ' + MODEL);
console.log('الأغلفة : ' + list.length + ' من ' + COVERS.length);
console.log('التقدير : ≈ $' + (list.length * EST_PER_IMAGE).toFixed(2)
  + '   ($' + EST_PER_IMAGE + ' للصورة · تقدير من الوثائق لا فاتورة)');
console.log('المخرَج  : ' + OUT);
console.log('');
list.forEach((c) => console.log('  · ' + c.slug.padEnd(28) + c.ar));
console.log('');

if (!ONE && !ALL) {
  console.log('🔴 ما انبعت ولا طلب · شغّله بـ--one لوحدة أو --yes للكل.');
  process.exit(0);
}

const KEY = key();
let total = 0;
for (const c of list) {
  /* 🔴 الموجود ما بينتولّد مرتين · كل استدعاء مصاري، وما في إلغاء.
     لإعادة توليد وحدة: احذف ملفها ثم شغّل، أو مرّر --force.

     ⚠️ **والفحص بيشوف `.webp` كمان · وهاد كلّفنا $0.42.**
        النسخة الأولى كانت بتدوّر على `.png` بس، والأنبوب بيحوّل المخرَج
        لـ`.webp` **وبيحذف الـPNG** · فأول ما شغّلت الدفعة الثانية،
        التلات أغلفة القديمة ما انلقيوا وانولّدوا من جديد بلا داعي.
     ⤷ الدرس: فحص «موجود؟» لازم يسأل عن **الشكل النهائي** للمخرَج، مش
       عن الشكل الوسيط اللي بينحذف بالطريق. */
  const dst = path.join(OUT, c.slug + '.png');
  const done = fs.existsSync(dst) || fs.existsSync(dst.replace(/\.png$/, '.webp'));
  if (done && !argv.includes('--force')) {
    console.log('  · ' + c.slug + ' ... موجودة · انتخطّت (--force لإعادتها)');
    continue;
  }
  process.stdout.write('  ⏳ ' + c.slug + ' ... ');
  try {
    const res = await generate(c, KEY);
    total += Number(res.cost || 0);
    console.log('✅ ' + res.kb + 'KB'
      + (res.cost !== undefined ? '  ·  $' + Number(res.cost).toFixed(4) : '')
      + (res.tokens ? '  ·  ' + res.tokens + ' توكن' : ''));
  } catch (e) {
    console.log('🔴 ' + e.message);
  }
}
console.log('');
console.log('الكلفة الحقيقية المجموعة: $' + total.toFixed(4)
  + '   (التقدير كان $' + (list.length * EST_PER_IMAGE).toFixed(2) + ')');
