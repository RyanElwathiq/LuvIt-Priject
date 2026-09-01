#!/usr/bin/env node
/**
 * ============================================================================
 * تفكيك الصفحة الرئيسية لعناصرها · split-page40.mjs
 * ============================================================================
 *   node _أدوات/split-page40.mjs
 *
 * بيقرا `_وارد/page40-before.json` (نزّلته صفحة الأدمن بممر serve.js)
 * وبيكتب عنصر HTML لكل ملف بـ`_وارد/page40/`.
 *
 * 🔴 ليش: الرئيسية **إلمنتور** مش جوتنبرج · فما بتنبني بـbuild-page.js.
 *    محتواها جوّا `_elementor_data` كسلسلة JSON، وكل سكشن عنصر `html`
 *    بحاوية جذر لحاله. التعديل = قراءة الشجرة، تبديل `settings.html`
 *    للعنصر المعني، وإرجاع الشجرة كما هي. **ولا مرة نعيد بناء العُقَد.**
 * ============================================================================
 */
import fs from 'node:fs';
import path from 'node:path';

const REPO = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const SRC = path.join(REPO, '_وارد', 'page40-before.json');
const OUT = path.join(REPO, '_وارد', 'page40');

const j = JSON.parse(fs.readFileSync(SRC, 'utf8'));
const tree = JSON.parse(j.meta._elementor_data);
fs.mkdirSync(OUT, { recursive: true });

const map = [];
tree.forEach((root, i) => {
  const stack = [root];
  while (stack.length) {
    const e = stack.shift();
    if (e.widgetType === 'html') {
      const html = (e.settings && e.settings.html) || '';
      const id = (html.match(/\sid="([^"]+)"/) || [])[1] || `sec${i}`;
      const name = `${String(i).padStart(2, '0')}-${id}.html`;
      fs.writeFileSync(path.join(OUT, name), html, 'utf8');
      map.push({ root: i, widgetId: e.id, domId: id, file: name, chars: html.length });
      continue;
    }
    if (e.elements) stack.push(...e.elements);
  }
});

fs.writeFileSync(path.join(OUT, '_map.json'), JSON.stringify(map, null, 1), 'utf8');
console.log(`عناصر جذر: ${tree.length} · عناصر html: ${map.length}`);
map.forEach((m) => console.log(`  ${m.file.padEnd(22)} ${String(m.chars).padStart(6)} · widget ${m.widgetId}`));
