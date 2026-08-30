#!/usr/bin/env node
/**
 * ============================================================================
 * توليد فيديو الهيرو · OpenRouter / Seedance 2.5
 * ============================================================================
 *   node _أدوات/gen-video.mjs <ملف-المهام.json> [--yes]
 *
 * ── 🔴 المفتاح ────────────────────────────────────────────────────────
 * ولا مرة بينكتب المفتاح بالمحادثة ولا بملف متتبَّع · ريّان بيحطّه بإيده.
 * بينقرا من: OPENROUTER_API_KEY  ثم  <جذر الريبو>/.openrouter-key
 * (المسار إنجليزي بالكامل عشان أوامر ريّان تضل بلا حرف عربي · ترميز 437)
 * وما بينطبع ولا جزء منه · ولا برسائل الخطأ.
 *
 * ── 🔴 الكلفة · أرقام مقيسة مش معلَنة ─────────────────────────────────
 * صفحة الموديل بتكتب "from $0.1028/second" · وهاد أوطى دقة، مش سعرنا.
 * المقيس من فاتورة حقيقية ٣٠ آب ٢٠٢٦: 1920x1080 · 5.04ث = $2.6218
 * يعني $0.52 للثانية · أغلى بخمس مرات من المعلَن.
 *
 * ── 🔴 ما في إلغاء ────────────────────────────────────────────────────
 * جُرّب DELETE /videos/{id} و POST /videos/{id}/cancel · الاثنان 404.
 * أول ما ينبعت الطلب، المصاري انصرفت. فالتأكيد قبل الإرسال إلزامي.
 * وممنوع فحص النقطة بقيم غلط متعمّدة — seconds:999 انقبلت وكلّفت $2.62.
 *
 * ── العقد · مثبت من ردود السيرفر ──────────────────────────────────────
 * POST /api/v1/videos              { model, prompt, size }  → 202 {id, polling_url}
 * GET  /api/v1/videos/{id}         → { status, unsigned_urls[], usage.cost }
 * GET  /api/v1/videos/{id}/content?index=0  → الـMP4
 * · model و prompt إلزاميان · size لازم دقة ونسبة قياسيتين
 * · الافتراضي ٥ ثوانٍ x ٢٤ = ١٢٠ فريماً = عقد سلسلة الهيرو بالضبط،
 *   فما بنمرّر seconds إلا لو في سبب.
 * ============================================================================
 */
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '..');
const OUT_DIR = path.join(REPO, 'hero-sequence');
const MODEL = 'bytedance/seedance-2.5';
const API = 'https://openrouter.ai/api/v1/videos';

/* تقدير الكلفة · $/ثانية حسب عدد البكسلات · مرساة مقيسة عند 1080p */
const MEASURED = { px: 1920 * 1080, perSec: 0.5244 };
function estimate(size, seconds) {
  const [w, h] = String(size).split('x').map(Number);
  if (!w || !h) return null;
  return ((w * h) / MEASURED.px) * MEASURED.perSec * Number(seconds || 5);
}

/* بينضّف المفتاح: BOM · مسافات · أسطر · اقتباسات لو انلصقت معه */
const clean = (s) => String(s).replace(/^﻿/, '').trim().replace(/^["']|["']$/g, '');

function readKey() {
  if (process.env.OPENROUTER_API_KEY) return clean(process.env.OPENROUTER_API_KEY);
  for (const f of [path.join(REPO, '.openrouter-key'), path.join(HERE, '.openrouter-key')]) {
    if (fs.existsSync(f)) { const k = clean(fs.readFileSync(f, 'utf8')); if (k) return k; }
  }
  console.error('🔴 ما لقيت مفتاح OpenRouter.');
  console.error('   حطّه بـ OPENROUTER_API_KEY أو بملف .openrouter-key بجذر الريبو.');
  console.error('   ⚠️ والملف مستثنى من git · ما بينرفع.');
  process.exit(1);
}

const specPath = process.argv[2];
if (!specPath || !fs.existsSync(specPath)) {
  console.error('usage: node _أدوات/gen-video.mjs <ملف-المهام.json> [--yes]');
  process.exit(2);
}
const jobs = [].concat(JSON.parse(fs.readFileSync(specPath, 'utf8')));
for (const j of jobs) {
  if (!j.name || !j.prompt || !j.size) {
    console.error('🔴 كل مهمة بدها: name · prompt · size');
    process.exit(1);
  }
}

/* ── الكلفة المتوقّعة · قبل أي إرسال ─────────────────────────────── */
let total = 0;
console.log('المهمّات: ' + jobs.length + '\n');
for (const j of jobs) {
  const c = estimate(j.size, j.seconds);
  total += c || 0;
  console.log('  - ' + j.name.padEnd(16) + j.size.padEnd(12) +
              (j.seconds || 5) + 's   ~ $' + (c ? c.toFixed(2) : '?'));
}
console.log('\nالكلفة المتوقّعة ~ $' + total.toFixed(2) +
            '   (تقدير · الفاتورة الحقيقية بتطلع بالآخر)');

if (!process.argv.includes('--yes')) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const a = await new Promise((r) => rl.question('\nأكمل؟ اكتب yes: ', r));
  rl.close();
  if (a.trim().toLowerCase() !== 'yes') {
    console.log('انلغى · ما انصرف ولا قرش.');
    process.exit(0);
  }
}

const KEY = readKey();
const H = { Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json' };
const hide = (s) => String(s).split(KEY).join('[محجوب]');
const balance = async () => {
  const r = await fetch('https://openrouter.ai/api/v1/credits', { headers: H });
  const d = (await r.json()).data || {};
  return { bought: Number(d.total_credits || 0), used: Number(d.total_usage || 0) };
};

fs.mkdirSync(OUT_DIR, { recursive: true });
const b0 = await balance();
console.log('\nالرصيد قبل: $' + (b0.bought - b0.used).toFixed(2));

async function run(job) {
  console.log('\n-- ' + job.name + ' --');
  const body = { model: MODEL, prompt: job.prompt, size: job.size };
  if (job.duration) body.duration = Number(job.duration);
  else if (job.seconds) body.seconds = String(job.seconds);
  if (job.generate_audio === false) body.generate_audio = false;

  /* ── الصور المرجعية ────────────────────────────────────────────────
     input_references = مرجع محتوى/أسلوب · الموديل بيسترشد فيها.
     frame_images     = فريم أول/آخر بالضبط · وهاي **بتغلب** الأولى
                        (لو انبعتوا سوا بيصير image-to-video).
     🔴 والصور بتنبعت **كروابط عامة**، مش ملفات محلية · فحصنا إن
        مجلد رفع plasmajo واصل من برّا رغم قفل Coming Soon. */
  if (job.input_references) {
    body.input_references = job.input_references.map((u) => ({
      type: 'image_url', image_url: { url: u },
    }));
  }
  if (job.frame_images) {
    body.frame_images = job.frame_images.map((f) => ({
      type: 'image_url', image_url: { url: f.url }, frame_type: f.frame_type,
    }));
  }
  const refs = (body.input_references || []).length + (body.frame_images || []).length;
  if (refs) console.log('   ' + refs + ' صورة مرجعية');

  const res = await fetch(API, { method: 'POST', headers: H, body: JSON.stringify(body) });
  const txt = await res.text();
  if (!res.ok) { console.error('   🔴 ' + res.status + ' · ' + hide(txt).slice(0, 300)); return null; }

  /* الرد بيجي مسبوقاً بأسطر إبقاء-حيّة فاضية · فبنلقط آخر JSON فيه */
  const m = txt.match(/\{[\s\S]*\}\s*$/);
  const j = JSON.parse(m ? m[0] : txt);
  console.log('   انبعت · ' + j.id);
  const url = j.polling_url || (API + '/' + j.id);

  for (let i = 0; i < 90; i++) {
    await new Promise((r) => setTimeout(r, 10000));
    const pj = await (await fetch(url, { headers: H })).json().catch(() => ({}));
    const st = pj.status || '?';
    if (i % 3 === 0) console.log('   ... ' + st + '  (' + ((i + 1) * 10) + 's)');
    if (/complet|succe/i.test(st)) {
      const cost = pj.usage && pj.usage.cost;
      console.log('   💰 الفاتورة الحقيقية: $' + (cost != null ? Number(cost).toFixed(4) : '?'));
      const c = await fetch(API + '/' + j.id + '/content?index=0', { headers: H });
      if (!c.ok) { console.error('   🔴 التنزيل فشل · ' + c.status); return null; }
      const buf = Buffer.from(await c.arrayBuffer());
      const out = path.join(OUT_DIR, job.name + '.mp4');
      fs.writeFileSync(out, buf);
      console.log('   ✅ ' + path.relative(REPO, out) + ' · ' + Math.round(buf.length / 1024) + ' KB');
      return out;
    }
    if (/fail|error|cancel/i.test(st)) {
      console.error('   🔴 فشلت · ' + JSON.stringify(pj).slice(0, 240));
      return null;
    }
  }
  console.error('   🔴 انتهت المهلة (١٥ دقيقة) · والمصاري على الأغلب انصرفت');
  return null;
}

const made = [];
for (const j of jobs) { const f = await run(j); if (f) made.push(f); }

const b1 = await balance();
console.log('\n' + '='.repeat(58));
console.log('طلع ' + made.length + ' من ' + jobs.length);
console.log('انصرف فعلياً: $' + (b1.used - b0.used).toFixed(4) +
            '   ·   المتبقّي: $' + (b1.bought - b1.used).toFixed(2));
if (made.length) {
  console.log('\nالخطوة الجاية · استخراج الفريمات:');
  for (const f of made) {
    const b = path.basename(f, '.mp4');
    console.log('  py hero-sequence/extract_frames.py --input hero-sequence/' + b +
                '.mp4 --out hero-sequence/frames-' + b + ' --frames 120 --width 1080 --quality 80');
  }
}
