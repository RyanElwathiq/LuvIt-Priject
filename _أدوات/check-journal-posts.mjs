#!/usr/bin/env node
/**
 * ============================================================================
 * فحص مقالات المدوّنة · check-journal-posts.mjs
 * ============================================================================
 *   node _أدوات/check-journal-posts.mjs
 *
 * بيفحص ملفات `library/journal/*.html` قبل ما تنرفع.
 *
 * ── 🔴 والفحص الأهم: النِسَب ───────────────────────────────────────────
 * أي رقم بصيغة نسبة مذكور بالمقال **لازم يكون موجوداً بالكتالوج الرسمي**
 * (`_خطة/بيانات-المنتجات-الرسمية.json`). ولا رقم بينكتب من الراس.
 *
 * وهاد مش فحص نظري · المقال القديم عن النياسيناميد كان بيقول «بمنتجاتنا
 * النسبة 2%» و**هاد غلط**: النياسيناميد عنا بخمس نِسَب (0.5 · 0.8 · 2 ·
 * 2 · 10). الجملة كانت بتقرا كحقيقة وهي مش دقيقة، وضلّت منشورة.
 *
 * ⚠️ والفحص بيقبل كمان النِسَب اللي بالكتالوج **بأي منتج**، مش بس بالمنتج
 *    المذكور · لأن المقال ممكن يقارن بين منتجات. يعني هو **شبكة أمان
 *    ضد الاختراع**، مش تدقيقاً على الربط الصح · وهاد بينقرا بالعين.
 * ============================================================================
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '..');
const DIR = path.join(REPO, 'library', 'journal');

const cat = JSON.parse(fs.readFileSync(path.join(REPO, '_خطة', 'بيانات-المنتجات-الرسمية.json'), 'utf8'));

/* كل نسبة معروفة بالكتالوج · مخزّنة كنصّ منظّف («0.5%» و«5% + 0.5%») */
const KNOWN = new Set();
for (const p of cat.منتجات) {
  for (const a of p.actives || []) {
    for (const m of String(a.pct).matchAll(/(\d+(?:\.\d+)?)\s*%/g)) KNOWN.add(m[1]);
  }
}

/* الصفحات الحيّة · أي رابط داخلي غيرها بيوقف الفحص.
   🔴 `/routines/oily` و`/routines/dry` و`/routines/combination` **انشالوا
      ٣٠ آب** وبيرجّعوا 404 · والمقال ٢٢٥ كان لساه بيربط على الأول. */
const LIVE = new Set([
  '/', '/products', '/cart', '/checkout', '/my-account', '/track', '/routines',
  '/quiz', '/shipping', '/faq', '/journal', '/about', '/contact', '/returns',
  '/privacy', '/terms',
  '/routines/hydration', '/routines/glow', '/routines/clarify',
]);

const files = fs.readdirSync(DIR).filter((f) => f.endsWith('.html')).sort();
let bad = 0;

for (const f of files) {
  const html = fs.readFileSync(path.join(DIR, f), 'utf8');
  const errs = [];

  /* ١ · تعليقات جوتنبرج متوازنة · كل فتح إله إغلاق بنفس الاسم */
  const opens = [...html.matchAll(/<!--\s+wp:([a-z-]+)(?:\s+\{[^}]*\})?\s+-->/g)].map((m) => m[1]);
  const closes = [...html.matchAll(/<!--\s+\/wp:([a-z-]+)\s+-->/g)].map((m) => m[1]);
  const tally = {};
  opens.forEach((x) => { tally[x] = (tally[x] || 0) + 1; });
  closes.forEach((x) => { tally[x] = (tally[x] || 0) - 1; });
  for (const [k, v] of Object.entries(tally)) if (v !== 0) errs.push(`كتلة wp:${k} غير متوازنة (${v > 0 ? 'ناقصها إغلاق' : 'إغلاق زيادة'})`);

  /* ٢ · وسوم HTML متوازنة */
  for (const t of ['p', 'h2', 'h3', 'ul', 'ol', 'li', 'strong', 'a', 'blockquote', 'table', 'tr', 'td', 'th', 'thead', 'tbody', 'figure']) {
    const o = (html.match(new RegExp('<' + t + '(?=[\\s>])', 'g')) || []).length;
    const c = (html.match(new RegExp('</' + t + '>', 'g')) || []).length;
    if (o !== c) errs.push(`<${t}> ${o}/${c}`);
  }

  /* ٣ · الشرطة الطويلة ممنوعة */
  if (html.includes('—')) errs.push('شرطة طويلة');

  /* ٤ · النِسَب · شبكة الأمان ضد الاختراع */
  const used = [...new Set([...html.matchAll(/(\d+(?:\.\d+)?)\s*%/g)].map((m) => m[1]))];
  const invented = used.filter((x) => !KNOWN.has(x));
  if (invented.length) errs.push('نِسَب مش بالكتالوج: ' + invented.join(' · '));

  /* ٥ · الروابط الداخلية */
  for (const m of html.matchAll(/href="([^"]+)"/g)) {
    const h = m[1];
    if (h === '#') { errs.push('رابط ميت href="#"'); continue; }
    if (h.startsWith('http') || h.startsWith('#')) continue;
    const p = h.split('#')[0].replace(/\/$/, '') || '/';
    if (!LIVE.has(p)) errs.push('رابط مش حيّ: ' + h);
  }

  /* ٦ · وعود ممنوعة · صياغات بتوعد بنتيجة أو بمدة */
  const PROMISE = [
    /\bخلال\s+(أسبوع|أسبوعين|شهر|\d+)/,
    /\bبيعالج\b/, /\bبيشفي\b/, /\bبيقضي على\b/,
    /\bمضمون\b/, /\bنتيجة مضمونة\b/,
    /\b100\s*٪?\s*(فعّال|مضمون)/,
  ];
  for (const re of PROMISE) {
    const m = html.match(re);
    if (m) errs.push('صيغة وعد: «' + m[0] + '»');
  }

  const words = html.replace(/<!--[\s\S]*?-->/g, '').replace(/<[^>]+>/g, ' ')
    .trim().split(/\s+/).filter(Boolean).length;

  if (errs.length) {
    bad++;
    console.log('🔴 ' + f);
    errs.forEach((e) => console.log('     ' + e));
  } else {
    console.log('✅ ' + f.padEnd(38) + String(words).padStart(4) + ' كلمة  · نِسَب: ' + (used.join('/') || 'ولا وحدة'));
  }
}

console.log('');
if (bad) { console.error('🔴 ' + bad + ' من ' + files.length + ' فيهم مشاكل'); process.exit(1); }
console.log('✅ ' + files.length + ' مقالات · كل النِسَب من الكتالوج · وكل الروابط حيّة');
