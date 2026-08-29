#!/usr/bin/env node
/**
 * ============================================================================
 * اختبار قارئ أبعاد الصور · test-photo-reader.mjs
 * ============================================================================
 *   node _أدوات/test-photo-reader.mjs
 *
 * `check-product-photos.mjs` بيقرا أبعاد الصور بنفسه بلا أي مكتبة. وقارئ
 * ترويسات مكتوب بالإيد **بيرجّع رقماً غلط بصمت** لو فيه غلطة بالإزاحة —
 * ما بيرمي خطأ، بيعطي رقماً يبيّن معقولاً. وهاد أسوأ من الفشل.
 *
 * 🔴 فالتوقّعات تحت **مقيسة من فاكّات مستقلة**، مش من نفس الكود:
 *
 *   | الملف            | المرجع المستقل                        |
 *   |------------------|---------------------------------------|
 *   | فريم الهيرو WebP | **كروميوم** · `img.naturalWidth` بالمعاينة |
 *   | PNG              | **System.Drawing** تبع ويندوز          |
 *   | PSD              | ترويسة `8BPS` · وكل الـ٤٥ ملف بالأرشيف طلعوا نفس الرقم |
 *
 * والاختبار **بيستورد الدالة من الفاحص نفسه**، ما بيعيد كتابتها.
 * ============================================================================
 */

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { dimensions } from './check-product-photos.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '..');
const TMP  = fs.mkdtempSync(path.join(os.tmpdir(), 'luvit-imgtest-'));

/* الحقيقة المرجعية · كل سطر مقيس من برّا هذا الكود */
const FRAME  = path.join(REPO, 'hero-sequence', 'frames', 'frame_0000.webp');
const FRAMED = path.join(REPO, 'hero-sequence', 'frames-desktop', 'frame_0000.webp');

const cases = [];

/* ١ · WebP طولي · كروميوم قال 1080×1440 */
cases.push({ name: 'WebP طولي', file: FRAME, want: { w: 1080, h: 1440, kind: 'WebP' } });

/* ٢ · WebP عريض · كروميوم قال 1920×1080 */
cases.push({ name: 'WebP عريض', file: FRAMED, want: { w: 1920, h: 1080, kind: 'WebP' } });

/* ٣ · 🔴 الامتداد بيكذب · نفس الـWebP باسم .jpg
      لازم يرجّع WebP، مش يفشل ولا يقول JPEG */
const liar = path.join(TMP, 'اسمه-jpg-وجوّاه-webp.jpg');
fs.copyFileSync(FRAME, liar);
cases.push({ name: 'امتداد كاذب (.jpg وجوّاه WebP)', file: liar, want: { w: 1080, h: 1440, kind: 'WebP' } });

/* ٤ · ملف مقصوص لدرجة إنه ما بقي فيه ترويسة · لازم null مش رقم مخترع */
const tiny = path.join(TMP, 'مقصوص.webp');
fs.writeFileSync(tiny, fs.readFileSync(FRAME).subarray(0, 12));
cases.push({ name: 'ملف مقصوص', file: tiny, want: null });

/* ٥ · بايتات عشوائية باسم .png · لازم null */
const junk = path.join(TMP, 'زبالة.png');
fs.writeFileSync(junk, Buffer.from(Array.from({ length: 300 }, (_, i) => (i * 37 + 11) & 0xff)));
cases.push({ name: 'بايتات عشوائية', file: junk, want: null });

/* ٦ · ملف فاضي · لازم null مش انهيار */
const empty = path.join(TMP, 'فاضي.jpg');
fs.writeFileSync(empty, Buffer.alloc(0));
cases.push({ name: 'ملف فاضي', file: empty, want: null });

/* ٧ · PNG حقيقي · System.Drawing قال 3840×1600 */
const PNG_SRC = 'C:/Users/rayan/.claude/bundles/Claude-BugHunter/assets/banner.png';
if (fs.existsSync(PNG_SRC)) {
  cases.push({ name: 'PNG', file: PNG_SRC, want: { w: 3840, h: 1600, kind: 'PNG' } });
}

/* ٨ · JPEG مبني بالإيد · SOF0 بأبعاد معروفة سلفاً
      (ما لقيت JPEG حقيقياً بالمشروع — كله WebP — فبنيت واحداً صريحاً) */
const jpg = path.join(TMP, 'مبني.jpg');
fs.writeFileSync(jpg, Buffer.from([
  0xff, 0xd8,                                     // SOI
  0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, // APP0 · طوله 16
  0x00, 0x01, 0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00,
  0xff, 0xdb, 0x00, 0x04, 0x00, 0x00,             // DQT وهمي · طوله 4
  0xff, 0xc0, 0x00, 0x11, 0x08,                   // SOF0 · طوله 17 · دقة 8
  0x09, 0x60,                                     // الارتفاع 2400
  0x0c, 0x80,                                     // العرض   3200
  0x03, 0x01, 0x11, 0x00, 0x02, 0x11, 0x01, 0x03, 0x11, 0x01,
]));
cases.push({ name: 'JPEG (SOF0 خلف APP0 وDQT)', file: jpg, want: { w: 3200, h: 2400, kind: 'JPEG' } });

/* ٩ · PSD مبني بالإيد · ترويسة 8BPS بأبعاد الأرشيف الحقيقية */
const psd = path.join(TMP, 'مبني.psd');
const pb = Buffer.alloc(26);
pb.write('8BPS', 0, 'latin1');
pb.writeUInt16BE(1, 4);
pb.writeUInt16BE(3, 12);      // ٣ قنوات
pb.writeUInt32BE(4845, 14);   // ارتفاع
pb.writeUInt32BE(4845, 18);   // عرض
pb.writeUInt16BE(8, 22);
pb.writeUInt16BE(3, 24);
fs.writeFileSync(psd, pb);
cases.push({ name: 'PSD (زي أرشيف لَف إت)', file: psd, want: { w: 4845, h: 4845, kind: 'PSD' } });

/* ── التشغيل ─────────────────────────────────────────────────────────── */
console.log('');
console.log('🔬 اختبار قارئ أبعاد الصور · ' + cases.length + ' حالة');
console.log('═'.repeat(72));

let pass = 0, fail = 0;
for (const c of cases) {
  if (!fs.existsSync(c.file)) {
    console.log(`  ⏭️  ${c.name} · الملف مش موجود · انتخطّت`);
    continue;
  }
  let got;
  try { got = dimensions(c.file); }
  catch (e) { got = 'THREW: ' + e.message; }

  const w = c.want;
  const ok = w === null
    ? got === null
    : (got && got.w === w.w && got.h === w.h && got.kind === w.kind);

  const show = (v) => v === null ? 'null'
    : typeof v === 'string' ? v
    : `${v.w}×${v.h} ${v.kind}`;

  if (ok) { pass++; console.log(`  ✅ ${c.name.padEnd(34)} → ${show(got)}`); }
  else {
    fail++;
    console.log(`  🔴 ${c.name.padEnd(34)} → ${show(got)}   (المتوقّع: ${show(w)})`);
  }
}

fs.rmSync(TMP, { recursive: true, force: true });

console.log('═'.repeat(72));
console.log(`نجح ${pass} · فشل ${fail}`);
console.log('');
process.exit(fail ? 1 : 0);
