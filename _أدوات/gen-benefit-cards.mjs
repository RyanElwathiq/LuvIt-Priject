#!/usr/bin/env node
/**
 * ============================================================================
 * بطاقات الفوائد · gen-benefit-cards.mjs
 * ============================================================================
 *   node _أدوات/gen-benefit-cards.mjs            ← الكل
 *   node _أدوات/gen-benefit-cards.mjs L101       ← منتج واحد بالرمز
 *
 * ── 🔴 ليش انبنت · من جرد موقع الوكالة ٤ أيلول ────────────────────────
 * أكثر نوع صورة عندهم **مش لقطة منتج ولا موديل** · هو **بطاقة الفوائد**:
 * ٥٨ صورة من أصل ١٨٥، أكثر من عدد منتجاتهم نفسها. والإنفوجرافيك بيغلب
 * اللايف ستايل عندهم **٤:١** (٨١ مقابل ٢٠). وأهم من هيك: صورة الهوفر على
 * كرت المنتج بالشبكة **هي بطاقة الفوائد** لا لقطة موديل.
 *
 * ⤷ يعني الصورة اللي بتبيع عندهم **منتَجة لا مصوَّرة**. وهاي أرخص وأسرع
 *   طريق عندنا كمان: ما بدها مصوّراً ولا صاحب العلامة ولا رصيد توليد.
 *
 * ── 🔴 ولا رقم ولا نصّ مخترَع ─────────────────────────────────────────
 * كل نسبة واسم ودور بينقرا من `_خطة/بيانات-المنتجات-الرسمية.json` ·
 * ومصدرها بروفايل الصيدلية، أو العبوة نفسها للمنتجات اللي برّاه
 * (ألفا أربوتين · وحقله `_مصدر_النِسَب` بيقول هاد صراحة).
 * **لو منتج بلا `actives` بينتخطّى بصوت** · ما بينترسم بصفوف فاضية.
 *
 * ── الألوان ──────────────────────────────────────────────────────────
 * الخلفية بتتغيّر بعمق الأزرق حسب خطّ المنتج، **وكلها من سُلّم `--aqua`**
 * تبعنا · فالبطاقات بتتفرّق عن بعض وبتضل عيلة وحدة.
 * 🔴 والفوشيا `#D02D86` **ما بتنستعمل خلفيةً أبداً** · قاعدة العلامة.
 *
 * ── ⚠️ فخّان مسجَّلان وانحسبوا هون ────────────────────────────────────
 *   ١ · الخطوط بتنزل من الشبكة، وبلا `document.fonts.ready` + `check()`
 *       كروميوم بيبدّل لخط نظام **بصمت** والعربي بيطلع غلط بلا أي خطأ.
 *       فالسكربت **بيفشل بصوت** لو ما نزل خط.
 *   ٢ · النسبة لاتينية بسياق عربي · فبدها عزلاً ومحاذاة صريحة وإلا
 *       بتنقلب. `unicode-bidi: isolate` على كل رقم.
 *
 * ── 🔴 وبوابة العين بعده ──────────────────────────────────────────────
 * السكربت بيقيس الأبعاد والحجم، **بس ما بيقدر يشوف عبوة مقصوصة غلط ولا
 * حرفاً مكسوراً**. افتح صورة على الأقل وشوفها بعينك قبل الرفع.
 * ============================================================================
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '..');
const LIB = path.join(REPO, 'library');
const OUT = path.join(LIB, 'img', 'benefits');
const SHOTS = path.resolve(REPO, '..', 'صور-المنتجات', '_للويب');

/* 🔴 نفس مسار البورتفوليو المسجَّل بالقواعد · وإذا فشل، الأمر الوحيد
   اللي بيصلّحه: cd "D:/Ryan-Portfolio/site" && npx playwright install chromium */
const require = createRequire('D:/Ryan-Portfolio/site/');
const { chromium } = require('playwright');
const sharp = require('sharp');

const cat = JSON.parse(fs.readFileSync(path.join(REPO, '_خطة', 'بيانات-المنتجات-الرسمية.json'), 'utf8'));
const woo = JSON.parse(fs.readFileSync(path.join(REPO, '_وارد', 'woo-products.json'), 'utf8'));

/* عمق الخلفية حسب خطّ المنتج · كلها من سُلّم aqua تبع tokens.css */
const GROUND = {
  BRIGHTENING:      ['#EAFAFD', '#BDEDF6'],
  EQUALIZING:       ['#E6F7FB', '#A9E4F0'],
  MOISTURIZING:     ['#EDFBFD', '#CBF0F7'],
  'OIL CONTROL':    ['#E4F5F9', '#B4E4EE'],
  CLARIFYING:       ['#E9F8FB', '#C2EBF3'],
  SERUMS:           ['#EAFAFD', '#C9EFF6'],
  DEFAULT:          ['#EAFAFD', '#C9EFF6'],
};

const only = process.argv.slice(2).filter((a) => !a.startsWith('--'));

function shotFor(slug) {
  const tries = [
    path.join(LIB, 'img', `luvit-${slug}-1-bottle-soft.webp`),
    path.join(SHOTS, `luvit-${slug}-1-bottle.webp`),
    path.join(SHOTS, `luvit-${slug}-2-box-front.webp`),
  ];
  return tries.find((p) => fs.existsSync(p)) || null;
}

const rows = [];
for (const rec of cat['منتجات']) {
  if (only.length && !only.includes(rec.sku)) continue;
  const w = woo['منتجات'].find((x) => x.id === rec.woo);
  if (!w) { console.log('   تخطّي ' + rec.sku + ' · مش بووكومرس'); continue; }
  if (!rec.actives || !rec.actives.length) { console.log('   تخطّي ' + rec.sku + ' · بلا مكوّنات'); continue; }
  const shot = shotFor(w.slug);
  if (!shot) { console.log('🔴 تخطّي ' + rec.sku + ' · ما لقيت لقطة عبوة لـ' + w.slug); continue; }
  rows.push({ rec, w, shot });
}

if (!rows.length) { console.error('🔴 ولا بطاقة للتوليد'); process.exit(1); }

fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();
let made = 0;

for (const { rec, w, shot } of rows) {
  const g = GROUND[rec.line] || GROUND[rec.cat] || GROUND.DEFAULT;
  /* 🔴 القصّ هون لا بالاعتماد على ملف '-soft' جاهز.
     مصادر العبوات ٢٠٠٠×٢٠٠٠ ومعظمها شفاف · وبلا قصّ البطاقة بتحسب
     الحشوة جزءاً من الصورة فالعبوة بتطلع **صغيرة بزاوية**. صار فعلاً
     بأول تشغيل: عبوة فيتامين سي (عندها ملف مقصوص) طلعت مضبوطة وعلبة
     ألفا أربوتين (بلا ملف مقصوص) طلعت ربع الحجم.
     ⤷ والقصّ بالمولّد بيوحّدهم كلهم بلا ما نعتمد على شو انصادف موجوداً. */
  const trimmed = await sharp(shot).trim({ threshold: 1 }).toBuffer();
  const b64 = trimmed.toString('base64');
  const name = rec['ar_رسمي'] || rec['ar_بالموقع'] || w.name;

  const html = `<!doctype html><html dir="rtl" lang="ar"><head><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=El+Messiri:wght@600;700&family=IBM+Plex+Sans+Arabic:wght@400;500;600&display=swap" rel="stylesheet">
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{width:1200px;height:1200px;display:flex;align-items:center;
       background:linear-gradient(150deg, ${g[0]} 0%, ${g[1]} 100%);
       font-family:'IBM Plex Sans Arabic',sans-serif;overflow:hidden}
  .wrap{display:flex;align-items:center;gap:44px;padding:70px;width:100%}
  .pack{flex:0 0 380px;display:flex;align-items:center;justify-content:center}
  .pack img{max-width:100%;max-height:1000px;display:block;
            filter:drop-shadow(0 26px 46px rgba(2,26,30,.22))}
  .card{flex:1 1 auto;background:#FFFFFF;border-radius:38px;padding:52px 46px;
        box-shadow:0 26px 60px rgba(2,26,30,.12)}
  .title{font-family:'El Messiri',serif;font-weight:700;font-size:52px;
         line-height:1.25;color:#0C333C;margin-bottom:14px}
  .kicker{font-size:24px;font-weight:500;color:#196B7D;margin-bottom:38px}
  .row{display:flex;align-items:flex-start;gap:22px;padding:22px 0;
       border-top:1px solid #E4F1F4}
  .row:first-of-type{border-top:0;padding-top:0}
  .pct{flex:0 0 106px;height:106px;border-radius:50%;
       background:#EAFAFD;border:2px solid #D0F3F9;color:#124D5A;
       display:flex;align-items:center;justify-content:center;
       font-family:'El Messiri',serif;font-weight:700;font-size:34px;
       direction:ltr;unicode-bidi:isolate}
  .body{padding-top:12px}
  .nm{font-size:31px;font-weight:600;color:#0C333C;line-height:1.3}
  .rl{font-size:25px;font-weight:400;color:#4B6169;line-height:1.45;margin-top:6px}
</style></head><body>
  <div class="wrap">
    <div class="card">
      <p class="title">${name}</p>
      <p class="kicker">شو جوّاه، وشو بتعمل كل مادة</p>
      ${rec.actives.map((a) => `<div class="row">
        <span class="pct">${a.pct}</span>
        <div class="body"><p class="nm">${a.name}</p><p class="rl">${a.role}</p></div>
      </div>`).join('')}
    </div>
    <div class="pack"><img src="data:image/webp;base64,${b64}" alt=""></div>
  </div>
</body></html>`;

  const page = await browser.newPage({ viewport: { width: 1200, height: 1200 }, deviceScaleFactor: 1 });
  await page.setContent(html, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);

  /* 🔴 الفشل بصوت · كروميوم بيبدّل الخط بصمت والعربي بيطلع غلط */
  const ok = await page.evaluate(() => ({
    messiri: document.fonts.check('700 52px "El Messiri"'),
    plex: document.fonts.check('600 31px "IBM Plex Sans Arabic"'),
  }));
  if (!ok.messiri || !ok.plex) {
    await browser.close();
    console.error('🔴 الخطوط ما نزلت · ' + JSON.stringify(ok));
    process.exit(1);
  }

  const png = await page.screenshot({ type: 'png' });
  await page.close();

  const file = path.join(OUT, `luvit-${w.slug}-benefits.webp`);
  await sharp(png).webp({ quality: 88, effort: 5 }).toFile(file);
  const kb = Math.round(fs.statSync(file).size / 1024);
  console.log(`✅ ${(rec.sku + ' · ' + w.slug).padEnd(46)} ${rec.actives.length} مواد · ${kb} كيلو`);
  made++;
}

await browser.close();
console.log('');
console.log(`✅ ${made} بطاقة · ${OUT}`);
console.log('🔴 افتح وحدة على الأقل وشوفها بعينك قبل الرفع.');
