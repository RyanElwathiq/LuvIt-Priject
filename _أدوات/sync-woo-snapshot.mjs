#!/usr/bin/env node
/**
 * ============================================================================
 * تجديد لقطة منتجات ووكومرس · _وارد/woo-products.json
 * ============================================================================
 *   node _أدوات/sync-woo-snapshot.mjs [--check]
 *
 * `--check` بيقارن وبيرجّع exit 1 لو اللقطة بايتة · بلا ما يكتب.
 *
 * ── 🔴 ليش انبنت ─────────────────────────────────────────────────────
 * اللقطة كانت **مكتوبة بالإيد**، وبنيت بـ٣٠ آب. بـ٣١ آب صار الموقع فيه
 * **١٥ منتجاً واللقطة ١٤** — واقي الشمس انتنشر وما انتسجّل.
 *
 * والمشكلة إن `build-routine-pages.mjs` و`build-shop-page.mjs` بيقرا
 * منها **كمصدر حقيقة**. يعني صفحة بتنبنى اليوم بتنبنى على واقع مبارح،
 * **وبلا أي رسالة خطأ** — المولّد بيقول «تمام» وهو بيبني على ناقص.
 *
 * ── الواجهة ──────────────────────────────────────────────────────────
 * `wc/store/v1/products` **عامة، بلا مفاتيح** · وبتعطي السعر والصور
 * والفئات. (وwc/v3 بده مفاتيح، وwp/v2/product ما بيعطي سعراً.)
 *
 * ⚠️ والأسعار بتيجي بوحدات صغرى: `prices.price = "1795"` مع
 *    `currency_minor_unit = 2` يعني **17.95**. القسمة على ١٠٠ ثابتة
 *    غلط · بنقرا المنازل من الرد نفسه.
 * ============================================================================
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '..');
const OUT = path.join(REPO, '_وارد', 'woo-products.json');
const BASE = 'https://plasmajo.com/wp-json/wc/store/v1/products';
const CHECK = process.argv.includes('--check');

async function fetchAll() {
  const all = [];
  for (let page = 1; page <= 20; page++) {
    const r = await fetch(`${BASE}?per_page=100&page=${page}`);
    if (!r.ok) throw new Error('HTTP ' + r.status + ' على صفحة ' + page);
    const batch = await r.json();
    if (!Array.isArray(batch) || !batch.length) break;
    all.push(...batch);
    const total = Number(r.headers.get('x-wp-totalpages') || 1);
    if (page >= total) break;
  }
  return all;
}

const live = await fetchAll();
if (!live.length) { console.error('🔴 ما رجّع ولا منتج'); process.exit(1); }

/* 🔴 السعر من الوحدات الصغرى · والمنازل من الرد لا مفترضة */
const money = (p) => {
  const minor = Number(p?.currency_minor_unit ?? 2);
  const raw = Number(p?.price ?? 0);
  return (raw / Math.pow(10, minor)).toFixed(2);
};

const منتجات = live
  .filter((p) => p.type !== 'variation')
  .sort((a, b) => a.id - b.id)
  .map((p) => ({
    id: p.id,
    slug: p.slug,
    name: (p.name || '').trim(),
    price: money(p.prices),
    permalink: p.permalink,
    stock: p.is_in_stock ? 'instock' : 'outofstock',
    cats: (p.categories || []).map((c) => c.name),
    short: (p.short_description || '').replace(/<[^>]+>/g, '').trim(),
    images: (p.images || []).map((i) => ({ src: i.src, alt: i.alt || '' })),
  }));

const فئات = [...new Set(منتجات.flatMap((p) => p.cats))].sort();

const next = {
  _مصدر: BASE,
  _ملاحظة: 'مولَّدة بـ_أدوات/sync-woo-snapshot.mjs · لا تعدّلها بالإيد · شغّل الأداة.',
  _تاريخ: new Date().toISOString().slice(0, 10),
  فئات,
  منتجات,
};

const prevRaw = fs.existsSync(OUT) ? fs.readFileSync(OUT, 'utf8') : '{"منتجات":[]}';
const prev = JSON.parse(prevRaw);
const prevIds = new Set((prev.منتجات || []).map((p) => p.id));
const nextIds = new Set(منتجات.map((p) => p.id));
const added = منتجات.filter((p) => !prevIds.has(p.id));
const removed = (prev.منتجات || []).filter((p) => !nextIds.has(p.id));
const priced = منتجات.filter((p) => {
  const o = (prev.منتجات || []).find((x) => x.id === p.id);
  return o && o.price !== p.price;
});

console.log(`الموقع: ${منتجات.length} منتجاً  ·  اللقطة كانت: ${(prev.منتجات || []).length}`);
added.forEach((p) => console.log(`  + ${p.id}  ${p.name}  ${p.price}`));
removed.forEach((p) => console.log(`  - ${p.id}  ${p.name}`));
priced.forEach((p) => {
  const o = prev.منتجات.find((x) => x.id === p.id);
  console.log(`  ~ ${p.id}  ${p.name}  ${o.price} → ${p.price}`);
});

const stale = added.length || removed.length || priced.length;
if (CHECK) {
  console.log(stale ? '🔴 اللقطة بايتة · شغّل الأداة بلا --check' : '✅ اللقطة مطابقة للموقع');
  process.exit(stale ? 1 : 0);
}
if (!stale) { console.log('✅ ولا فرق · ما انكتب شي'); process.exit(0); }

fs.writeFileSync(OUT, JSON.stringify(next, null, 1) + '\n', 'utf8');
console.log('✅ انكتبت ' + path.relative(REPO, OUT));
