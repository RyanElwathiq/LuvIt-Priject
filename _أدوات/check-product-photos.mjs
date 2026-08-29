#!/usr/bin/env node
/**
 * ============================================================================
 * فحص صور المنتجات قبل الرفع · check-product-photos.mjs
 * ============================================================================
 *   node _أدوات/check-product-photos.mjs
 *
 * بيقرا `صور-المنتجات/` وبيقول شو ناقص وشو مكسور. **ما بيرفع ولا بيعدّل ولا
 * بيحذف ولا إشي** — قراءة بحتة.
 *
 * 🔴 والأبعاد **بتنقرا من ترويسة الملف نفسه**، مش من الامتداد ولا من الاسم.
 *    ملف اسمه `.jpg` وجوّاه PNG بينكشف هون.
 *
 * ⚠️ **وهاد فاحص، مش ناصح.** بيطلّع 🔴 بس لإشي **بيوقف الشغل فعلاً**:
 *    خانة فاضية · ملف ما بينقرا · دقة بتقتل الزوم. وأي إشي تاني بينعرض كمعلومة.
 *    (لينتر بيصرخ على شي سليم بينتجاهل · صار معنا فعلاً بـlint-php-snippet)
 * ============================================================================
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const BASE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'صور-المنتجات');
/* المفروزة لو موجودة · وإلا الجذر. الأصل الخام بينتخطّى دايماً. */
const SORTED = path.join(BASE, 'مرتّبة');
const ROOT = fs.existsSync(SORTED) ? SORTED : BASE;

/* الزوم بيموت تحت هالرقم · ووكومرس بيتجاهل الزوم لما الأصل مش أكبر من مقاس العرض */
const MIN_PX = 1200;

/* ── قراءة الأبعاد من الترويسة ────────────────────────────────────────────
   بلا أي مكتبة. كل صيغة بتنقرا بطريقتها، واللي ما بينعرف بيرجّع null صراحةً
   بدل ما نخمّن. */

function readJPEG(b) {
  if (b[0] !== 0xff || b[1] !== 0xd8) return null;
  let i = 2;
  while (i < b.length - 9) {
    if (b[i] !== 0xff) { i++; continue; }
    const m = b[i + 1];
    if (m === 0xd8 || m === 0x01 || (m >= 0xd0 && m <= 0xd7)) { i += 2; continue; }
    if (m === 0xd9) return null;
    const len = b.readUInt16BE(i + 2);
    /* SOF0..SOF15 بلا DHT(C4) وDNL(C8) وDAC(CC) */
    if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) {
      return { w: b.readUInt16BE(i + 7), h: b.readUInt16BE(i + 5), kind: 'JPEG' };
    }
    if (len < 2) return null;
    i += 2 + len;
  }
  return null;
}

function readPNG(b) {
  if (b.length < 24) return null;
  if (b.readUInt32BE(0) !== 0x89504e47) return null;
  if (b.toString('latin1', 12, 16) !== 'IHDR') return null;
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20), kind: 'PNG' };
}

function readWEBP(b) {
  if (b.length < 30) return null;
  if (b.toString('latin1', 0, 4) !== 'RIFF' || b.toString('latin1', 8, 12) !== 'WEBP') return null;
  const t = b.toString('latin1', 12, 16);
  if (t === 'VP8 ') return { w: b.readUInt16LE(26) & 0x3fff, h: b.readUInt16LE(28) & 0x3fff, kind: 'WebP' };
  if (t === 'VP8L') {
    const n = b.readUInt32LE(21);
    return { w: (n & 0x3fff) + 1, h: ((n >> 14) & 0x3fff) + 1, kind: 'WebP' };
  }
  if (t === 'VP8X') {
    const rd = (o) => b[o] | (b[o + 1] << 8) | (b[o + 2] << 16);
    return { w: rd(24) + 1, h: rd(27) + 1, kind: 'WebP' };
  }
  return null;
}

function readPSD(b) {
  if (b.length < 26) return null;
  if (b.toString('latin1', 0, 4) !== '8BPS') return null;
  return { w: b.readUInt32BE(18), h: b.readUInt32BE(14), kind: 'PSD' };
}

function readTIFF(b) {
  if (b.length < 8) return null;
  const le = b.toString('latin1', 0, 2) === 'II';
  const be = b.toString('latin1', 0, 2) === 'MM';
  if (!le && !be) return null;
  const u16 = (o) => (le ? b.readUInt16LE(o) : b.readUInt16BE(o));
  const u32 = (o) => (le ? b.readUInt32LE(o) : b.readUInt32BE(o));
  if (u16(2) !== 42) return null;
  const ifd = u32(4);
  if (ifd + 2 > b.length) return null;
  const n = u16(ifd);
  let w = null, h = null;
  for (let k = 0; k < n; k++) {
    const e = ifd + 2 + k * 12;
    if (e + 12 > b.length) break;
    const tag = u16(e), type = u16(e + 2);
    const val = type === 3 ? u16(e + 8) : u32(e + 8);
    if (tag === 256) w = val;
    if (tag === 257) h = val;
  }
  return w && h ? { w, h, kind: 'TIFF' } : null;
}

const READERS = [readPNG, readJPEG, readWEBP, readPSD, readTIFF];

export function dimensions(file) {
  const fd = fs.openSync(file, 'r');
  const buf = Buffer.alloc(Math.min(131072, fs.fstatSync(fd).size));
  fs.readSync(fd, buf, 0, buf.length, 0);
  fs.closeSync(fd);
  for (const r of READERS) {
    try { const d = r(buf); if (d && d.w > 0 && d.h > 0) return d; } catch { /* الصيغة الجاية */ }
  }
  return null;
}

/* ── المشي على المجلدات ──────────────────────────────────────────────── */

/* 🔴 بس لما ينشغّل مباشرة · عشان `test-photo-reader.mjs` يقدر يستورد
   `dimensions` **من هذا الملف نفسه** بدل ما يعيد كتابتها.
   (نفس مبدأ test-quiz.js: الاختبار بيفحص المصدر مش نسخة منه) */
if (!import.meta.main) { /* مستورَد · وقّف هون */ }
else {

if (!fs.existsSync(ROOT)) {
  console.error('🔴 ما لقيت المجلد: ' + ROOT);
  process.exit(2);
}

const folders = fs.readdirSync(ROOT, { withFileTypes: true })
  .filter((e) => e.isDirectory())
  .map((e) => e.name)
  .sort();

if (!folders.length) {
  console.error('🔴 ' + ROOT + ' فاضي من المجلدات');
  process.exit(2);
}

const IMG = /\.(jpe?g|png|webp|psd|tiff?|avif|heic)$/i;
const blockers = [];
const notes = [];
let filled = 0, expected = 0;

console.log('');
console.log('📸 فحص صور المنتجات · ' + folders.length + ' منتج');
console.log('═'.repeat(66));

for (const folder of folders) {
  const dir = path.join(ROOT, folder);
  const files = fs.readdirSync(dir).filter((f) => IMG.test(f) && !f.startsWith('.'));

  /* الخانة بتنعرف من أول رقم بالاسم · `1.jpg` و`1-front.jpg` و`صورة1.png` كلهم خانة ١ */
  const slots = { 1: [], 2: [], 3: [], 4: [] };
  const stray = [];
  for (const f of files) {
    const m = path.basename(f, path.extname(f)).match(/[1-4]/);
    if (m) slots[m[0]].push(f); else stray.push(f);
  }

  const label = folder.replace(/^(\d+)-/, '$1 · ').replace(/-/g, ' ');
  console.log('');
  console.log('── ' + label);

  const ratios = [];
  for (const n of ['1', '2', '3', '4']) {
    expected++;
    const got = slots[n];

    if (got.length === 0) {
      console.log(`   ${n}  ☐  فاضية`);
      blockers.push(`${folder} · خانة ${n} فاضية`);
      continue;
    }
    if (got.length > 1) {
      blockers.push(`${folder} · خانة ${n} فيها ${got.length} ملفات: ${got.join(' · ')}`);
      console.log(`   ${n}  🔴 ${got.length} ملفات بنفس الخانة · ${got.join(' · ')}`);
      continue;
    }

    const f = got[0];
    const full = path.join(dir, f);
    const kb = Math.round(fs.statSync(full).size / 1024);
    const d = dimensions(full);

    if (!d) {
      blockers.push(`${folder}/${f} · ما انقرأت · الصيغة مش مدعومة أو الملف مكسور`);
      console.log(`   ${n}  🔴 ${f} · ما انقرأت (${kb} كيلو)`);
      continue;
    }

    filled++;
    const long = Math.max(d.w, d.h);
    const ratio = d.w / d.h;
    ratios.push({ n, ratio, f });

    const flag = long < MIN_PX ? '🔴' : '✅';
    if (long < MIN_PX) blockers.push(`${folder}/${f} · ${long}px بس · الزوم ما بيشتغل تحت ${MIN_PX}`);

    const shape = Math.abs(ratio - 1) < 0.02 ? 'مربّعة'
                : ratio > 1 ? 'عرضية' : 'طولية';
    console.log(
      `   ${n}  ${flag} ${f.padEnd(22).slice(0, 22)} ${String(d.w).padStart(5)}×${String(d.h).padEnd(5)}` +
      ` ${d.kind.padEnd(5)} ${shape.padEnd(6)} ${String(kb).padStart(6)} كيلو`
    );
  }

  if (stray.length) {
    notes.push(`${folder} · ${stray.length} ملف بلا رقم من ١ لـ٤: ${stray.join(' · ')}`);
    console.log(`      ℹ️  ${stray.length} ملف بلا رقم · انتجاهلوا`);
  }

  /* نسب مختلفة = الصور بترقص لما الزبونة تبدّل بينهم · ملاحظة مش حاجز */
  if (ratios.length > 1) {
    const mn = Math.min(...ratios.map((r) => r.ratio));
    const mx = Math.max(...ratios.map((r) => r.ratio));
    if (mx / mn > 1.05) {
      notes.push(`${folder} · النسب مش متطابقة (${mn.toFixed(2)} لـ${mx.toFixed(2)}) · الصور بترقص بالمعرض`);
      console.log(`      ℹ️  النسب مختلفة · ${mn.toFixed(2)} لـ${mx.toFixed(2)}`);
    }
  }
}

/* ── الخلاصة ─────────────────────────────────────────────────────────── */
console.log('');
console.log('═'.repeat(66));
console.log(`الصور الجاهزة: ${filled} من ${expected}`);

if (notes.length) {
  console.log('');
  console.log('ملاحظات · ما بتوقف الرفع:');
  notes.forEach((x) => console.log('   ℹ️  ' + x));
}

if (blockers.length) {
  console.log('');
  console.log('🔴 بتوقف الرفع:');
  blockers.forEach((x) => console.log('   · ' + x));
  console.log('');
  process.exit(1);
}

console.log('');
console.log('✅ كل الصور موجودة ومقروءة · جاهزين للرفع');
console.log('');

}   /* نهاية كتلة import.meta.main */
