#!/usr/bin/env node
/**
 * ============================================================================
 * كرت المشاركة · og:image · ٣ أيلول
 * ============================================================================
 *   node "_أدوات/gen-og-card.mjs"
 *
 * ليش مركَّب لا مولَّد بالذكاء الاصطناعي: الكرت فيه **نصّ عربي واللوجو**،
 * و`gen-covers.mjs` قاعدته الأولى «ولا نصّ بالصورة» لأن الموديلات بتكتب
 * عربي مشوّهاً. فهون HTML وخطوط حقيقية ولقطة · صفر كلفة وصفر تشويه.
 *
 * ── 🔴 فخّ الخطوط · مسجَّل وكلّفنا قبل ─────────────────────────────────
 * كروميوم **بيستبدل الخط بصمت** لو ما حمّله، والعربي بيطلع بخط نظام بلا
 * أي رسالة خطأ. فالسكربت:
 *   ١ · بينتظر `document.fonts.ready`
 *   ٢ · وبيسأل `document.fonts.check()` لكل خط **وبيفشل بصوت** لو ما نزل
 * ما منسلّم كرتاً بخط غلط.
 *
 * ── ⚠️ واللوجو ────────────────────────────────────────────────────────
 * المستعمَل `library/img/og/luvit-logo.png` · **RGBA بشفافية** (مفحوص:
 * colorType 6). ولا تستعمل `_وارد/luvit-logo-email.png` · ذاك **مسطَّح
 * على أبيض** للإيميل، وبيطلع مستطيلاً أبيض على أي أرضية ملوّنة.
 *
 * ── والقياس ───────────────────────────────────────────────────────────
 * 1200×630 · وهاي نسبة 1.905 اللي بتطلبها فيسبوك وواتساب وتويتر.
 * ============================================================================
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '..');
const LOGO = path.join(REPO, 'library', 'img', 'og', 'luvit-logo.png');
const OUT = path.join(REPO, 'library', 'img', 'og', 'luvit-share-card.png');

/* 🔴 بلاي‌رايت بيتحمّل من البورتفوليو · فخّ مسجَّل: لما ينحدّث بيدوّر على
   رقم بناء أحدث من المنزّل وبتوقف كل المولّدات دفعة وحدة. الحل أمر واحد:
     cd "D:/Ryan-Portfolio/site" && npx playwright install chromium   */
const require = createRequire('D:/Ryan-Portfolio/site/package.json');
const { chromium } = require('playwright');

if (!fs.existsSync(LOGO)) {
  console.log('X اللوجو مش موجود: ' + LOGO);
  process.exit(1);
}
const logoB64 = fs.readFileSync(LOGO).toString('base64');

/* ── المحتوى · كل كلمة منقولة من الموقع، ولا وحدة مخترعة ──────────────
   العنوان = عنوان الصفحة الرئيسية الحيّ.
   السطر   = من وصف الميتا الحيّ. */
const HEADLINE = 'روتين عناية مبني على حاجة بشرتك';
const LINE = 'توصيل لكل محافظات الأردن · والدفع عند الاستلام';

const html = `<!doctype html>
<html lang="ar" dir="rtl"><head><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=El+Messiri:wght@600;700&family=IBM+Plex+Sans+Arabic:wght@400;500&display=swap" rel="stylesheet">
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  html,body{width:1200px;height:630px;overflow:hidden}
  body{
    position:relative;isolation:isolate;
    display:flex;flex-direction:column;justify-content:center;
    padding:0 88px;
    background-color:#EAFAFD;
    font-family:'IBM Plex Sans Arabic',sans-serif;
    letter-spacing:0;
  }
  /* نفس مفردة الماء تبع رؤوس الصفحات · بلومان ساكنان */
  body::before{
    content:"";position:absolute;inset:-20% -10%;z-index:-1;
    background:
      radial-gradient(38% 46% at 22% 18%, rgba(255,255,255,.92), transparent 72%),
      radial-gradient(40% 48% at 84% 76%, rgba(76,197,218,.30), transparent 74%);
  }
  /* الموجة السفلية · نفس منحنى موجات الموقع */
  .wave{position:absolute;inset-inline:0;bottom:0;height:96px;z-index:-1}
  .logo{width:214px;height:auto;margin-bottom:38px;display:block}
  /* 🔴 max-width هون بتتحكّم بمكان الكسر لا بالعرض وبس · على 900px كان
     بينكسر بعد «حاجة» فبتقعد «بشرتك» يتيمة بسطر لحالها. على 700px بينكسر
     بعد «مبني» فبيصير سطران متوازنان. مقيس بالرندر لا بالحساب.
     وولا باكتيك بهالتعليق · هو جوّا قالب نصّي بجافاسكربت وبينهيه بدري. */
  h1{
    font-family:'El Messiri',serif;font-weight:700;
    font-size:70px;line-height:1.28;color:#1A2529;
    max-width:700px;
  }
  .line{
    margin-top:26px;font-size:29px;font-weight:500;color:#196B7D;
  }
  .rule{
    margin-top:34px;width:132px;height:4px;border-radius:2px;
    background:#4CC5DA;
  }
</style></head><body>
  <img class="logo" src="data:image/png;base64,${logoB64}" alt="">
  <h1>${HEADLINE}</h1>
  <p class="line">${LINE}</p>
  <div class="rule"></div>
  <svg class="wave" viewBox="0 0 1200 96" preserveAspectRatio="none" aria-hidden="true">
    <path d="M0,52 C170,96 330,10 520,34 C700,56 860,96 1040,62 C1110,49 1160,40 1200,34 L1200,96 L0,96 Z" fill="#FFFFFF"/>
  </svg>
</body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 2 });
await page.setContent(html, { waitUntil: 'networkidle' });

/* 🔴 الحارس · الخطوط نزلت فعلاً؟ */
await page.evaluate(() => document.fonts.ready);
const fonts = await page.evaluate(() => ({
  messiri: document.fonts.check('700 70px "El Messiri"'),
  plex: document.fonts.check('500 29px "IBM Plex Sans Arabic"'),
}));
if (!fonts.messiri || !fonts.plex) {
  await browser.close();
  console.log('X الخطوط ما نزلت · ' + JSON.stringify(fonts));
  console.log('  كروميوم بيستبدل بصمت · فما بنسلّم كرتاً بخط غلط.');
  process.exit(1);
}

/* 🔴 وحارس تاني · اللوجو انرسم فعلاً بعرض معقول؟ */
const logoBox = await page.evaluate(() => {
  const i = document.querySelector('.logo');
  const r = i.getBoundingClientRect();
  return { w: Math.round(r.width), h: Math.round(r.height), complete: i.complete, nat: i.naturalWidth };
});
if (!logoBox.complete || logoBox.nat === 0 || logoBox.w < 100) {
  await browser.close();
  console.log('X اللوجو ما انرسم · ' + JSON.stringify(logoBox));
  process.exit(1);
}

fs.mkdirSync(path.dirname(OUT), { recursive: true });
await page.screenshot({ path: OUT });
await browser.close();

/* ── الفحص بعد الحفظ · الأبعاد والمحتوى ── */
const b = fs.readFileSync(OUT);
const w = b.readUInt32BE(16), h = b.readUInt32BE(20);
console.log('OK ' + path.relative(REPO, OUT));
console.log('   ' + w + '×' + h + ' · ' + Math.round(b.length / 1024) + ' KB');
console.log('   fonts: El Messiri ✓ · IBM Plex Sans Arabic ✓');
console.log('   logo: ' + logoBox.w + '×' + logoBox.h + ' (طبيعي ' + logoBox.nat + 'px)');
if (w !== 2400 || h !== 1260) {
  console.log('   ⚠️ متوقّع 2400×1260 (1200×630 عند deviceScaleFactor 2)');
}
