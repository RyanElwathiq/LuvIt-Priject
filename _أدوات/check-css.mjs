#!/usr/bin/env node
/**
 * ============================================================================
 * فاحص tokens.css · بيمشي زي ما بيمشي محلّل المتصفح
 * ============================================================================
 *   node _<tools>/check-css.mjs
 *   (<tools> = النجمة · مكتوبة هيك لأن النجمة مع سلاش بتقفل تعليق الكتلة)
 *
 * ── ليش انبنى · ٣ أيلول ٢٠٢٦ ────────────────────────────────────────
 * لصقت كتلة CSS من ملف مواصفة تصميم، والملف ما كان CSS خالصاً: كان بآخره
 * **ماركداون** (سياج ``` وفقرة شرح). فانزرعت ١٦٨ محرفاً من الماركداون
 * بنصّ الورقة.
 *
 * والنتيجة إن **كل قاعدة انكتبت بعدها انرمت بصمت**: المتصفح بيلاقي
 * ``` كمُحدِّد غلط، وبيبلع لقدّام لحد ما يلاقي نقطة تعافٍ.
 *
 * 🔴 ووَلا فحص من فحوصاتنا مسكها:
 *      · عدّ الأقواس رجّع 1784/1784 **متوازن**
 *      · عدّ التعليقات رجّع متوازن
 *      · الملف انحفظ وانرفع وما طلع ولا خطأ
 *   اللي كشفها إن قاعدة جديدة **ما اشتغلت على الموقع** وأنا فحصت ليش:
 *   `el.sheet.cssRules` رجّعت 1464 قاعدة وآخرها media query، والقاعدة
 *   الجديدة مش فيهن أصلاً.
 *
 * ⤷ فهاد الفاحص بيسأل السؤال الصح: **شو اللي برّا التعليقات وبرّا
 *   الكتل؟** أي نصّ حرّ بالمستوى الأعلى مش اسم مُحدِّد = زبالة.
 * ============================================================================
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const FILE = path.join(HERE, '..', 'library', 'tokens.css');
const src = fs.readFileSync(FILE, 'utf8').split('\r').join('');

let i = 0, line = 1, depth = 0;
let inComment = false, commentLine = 0;
let atTop = '';            /* النصّ المتجمّع بالمستوى الأعلى قبل `{` */
let atTopLine = 0;
const problems = [];
const openLines = [];

while (i < src.length) {
  const ch = src[i], nx = src[i + 1];
  if (ch === '\n') line++;

  if (!inComment && ch === '/' && nx === '*') { inComment = true; commentLine = line; i += 2; continue; }
  if (inComment) {
    if (ch === '*' && nx === '/') { inComment = false; i += 2; continue; }
    i++; continue;
  }

  if (ch === '{') {
    if (depth === 0) atTop = '';
    depth++; openLines.push(line); i++; continue;
  }
  if (ch === '}') {
    depth--; openLines.pop();
    if (depth < 0) { problems.push({ line, kind: 'قوس إغلاق زيادة' }); depth = 0; }
    i++; continue;
  }

  /* بالمستوى الأعلى بس · بنجمّع النصّ اللي قبل أول `{` */
  if (depth === 0) {
    if (!atTop.trim()) atTopLine = line;
    atTop += ch;
    /* فاصلة منقوطة بالمستوى الأعلى برّا at-rule = سطر ضايع */
    if (ch === ';' && !atTop.trim().startsWith('@')) {
      problems.push({ line, kind: 'سطر بالمستوى الأعلى بلا كتلة', text: atTop.trim().slice(0, 70) });
      atTop = '';
    }
  }
  i++;
}

if (inComment) problems.push({ line: commentLine, kind: '🔴 تعليق ما انسكّر' });
if (depth !== 0) problems.push({ line: openLines[openLines.length - 1] || 0, kind: '🔴 كتلة ما انسكّرت · ' + depth });

/* ── الفحص الحاسم: نصّ حرّ بالمستوى الأعلى ────────────────────────
   المُحدِّد الشرعي بيتكوّن من: . # [ ] : ( ) > + ~ * , = " ' - _ حروف
   وأرقام ومسافات و@ للـat-rules. أي إشي غير هيك = زبالة انلصقت. */
{
  let j = 0, ln = 1, d = 0, cm = false, buf = '', bufLine = 1;
  const junk = [];
  while (j < src.length) {
    const ch = src[j], nx = src[j + 1];
    if (ch === '\n') ln++;
    if (!cm && ch === '/' && nx === '*') { cm = true; j += 2; continue; }
    if (cm) { if (ch === '*' && nx === '/') { cm = false; j += 2; continue; } j++; continue; }
    if (ch === '{') { if (d === 0) { const s = buf.trim(); if (s && /[`|]|^\*\*|```/.test(s)) junk.push({ ln: bufLine, s: s.slice(0, 80) }); buf = ''; } d++; j++; continue; }
    if (ch === '}') { d--; if (d === 0) { buf = ''; bufLine = ln; } j++; continue; }
    if (d === 0) { if (!buf.trim()) bufLine = ln; buf += ch; }
    j++;
  }
  /* اللي ضل بالمخزن بعد آخر كتلة */
  const rest = buf.trim();
  if (rest) junk.push({ ln: bufLine, s: rest.slice(0, 80) });
  junk.forEach(x => problems.push({ line: x.ln, kind: '🔴 نصّ مش CSS بالمستوى الأعلى', text: x.s }));
}

const rules = (src.match(/\}/g) || []).length;
console.log('tokens.css · ' + line + ' سطر · ' + src.length + ' محرف · ~' + rules + ' كتلة');

if (!problems.length) {
  console.log('OK  الملف نضيف · ولا نصّ حرّ ولا تعليق مفتوح ولا قوس ناقص');
  process.exit(0);
}
console.log('');
problems.forEach(p => {
  console.log('X  ' + String(p.line).padStart(6) + '  ' + p.kind + (p.text ? '  ::  ' + p.text : ''));
});
console.log('');
console.log('🔴 ' + problems.length + ' مشكلة · وكل قاعدة بعد أول وحدة منهن **بتنرمى بصمت** بالمتصفح.');
process.exit(1);
