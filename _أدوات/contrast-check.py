# -*- coding: utf-8 -*-
"""
=============================================================================
تدقيق التباين · الشطر الثاني
=============================================================================
  set PYTHONIOENCODING=utf-8
  py _أدوات/contrast-check.py <dir-from-contrast-collect>

بيقرا at-<y>.png و at-<y>.json وبيحسب نسبة تباين WCAG لكل نص.

── 🔴 كيف بتنقاس الخلفية · وليش هيك ─────────────────────────────────
لون النص **معلَن** بالـCSS فبناخده كما هو · بس الخلفية **مرسومة**،
وممكن تكون canvas أو تدرّج أو صورة. `backgroundColor` بترجّع شفافاً
وكأنه ما في خلفية، فبتكذب.

فبنقيسها من البكسل: جوّا صندوق العنصر، بناخد البكسلات **الأبعد عن لون
النص** (٦٠٪ الأبعد) وبناخد **منوالها** المكمَّم. حروف العربي رفيعة
فبتشكّل أقلية، والمنوال بيمسك الأرضية.

⚠️ وممنوع طريقة «أغمق ٥٪ ضد أفتح ٥٪». جرّبناها وكذبت مرتين بيوم واحد:
   مرة أعطت ٥٫٢٧:١ لزر ريّان شافه بعينه وما بينقرا، ومرة نزلت الرقم
   لما فتّحنا الخلفية · لأنها بتقيس حواف التنعيم وظلال الخلفية، مش
   النص ضد أرضيته.

── الحدود · WCAG 2.1 AA ──────────────────────────────────────────────
  نص كبير (≥ 24px، أو ≥ 18.66px مع وزن ≥ 700)  →  3.0:1
  أي نص غيره                                    →  4.5:1
=============================================================================
"""
import json, os, re, sys
from collections import Counter
from PIL import Image


def srgb_to_lin(v):
    v /= 255.0
    return v / 12.92 if v <= 0.03928 else ((v + 0.055) / 1.055) ** 2.4


def luminance(c):
    r, g, b = (srgb_to_lin(x) for x in c[:3])
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def contrast(a, b):
    la, lb = luminance(a), luminance(b)
    return (max(la, lb) + 0.05) / (min(la, lb) + 0.05)


def parse_color(s):
    """rgb(a) -> (r,g,b,alpha). بيرجّع None لو ما انفهم."""
    m = re.match(r'rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,/\s]+([\d.]+))?', s or '')
    if not m:
        return None
    r, g, b = (int(round(float(m.group(i)))) for i in (1, 2, 3))
    a = float(m.group(4)) if m.group(4) is not None else 1.0
    return (r, g, b, a)


def dist2(p, q):
    return (p[0] - q[0]) ** 2 + (p[1] - q[1]) ** 2 + (p[2] - q[2]) ** 2


def background_of(img, box, text_rgb):
    """منوال البكسلات الأبعد عن لون النص · هي الأرضية."""
    x, y, w, h = box['x'], box['y'], box['w'], box['h']
    x, y = max(0, x), max(0, y)
    w = min(w, img.width - x)
    h = min(h, img.height - y)
    if w < 3 or h < 3:
        return None
    px = list(img.crop((x, y, x + w, y + h)).getdata())
    if not px:
        return None
    px.sort(key=lambda p: -dist2(p, text_rgb))       # الأبعد أولاً
    far = px[:max(1, int(len(px) * 0.60))]
    # تكميم لـ16 درجة عشان التنعيم ما يفتّت المنوال
    q = Counter(((p[0] // 16) * 16 + 8, (p[1] // 16) * 16 + 8, (p[2] // 16) * 16 + 8) for p in far)
    return q.most_common(1)[0][0]


def threshold(font_size, weight):
    try:
        w = int(weight)
    except (TypeError, ValueError):
        w = 700 if str(weight) == 'bold' else 400
    large = font_size >= 24 or (font_size >= 18.66 and w >= 700)
    return 3.0 if large else 4.5


def main():
    d = sys.argv[1] if len(sys.argv) > 1 else None
    if not d or not os.path.isdir(d):
        print('usage: py _أدوات/contrast-check.py <dir>')
        sys.exit(2)

    fails, total = [], 0
    for jf in sorted(f for f in os.listdir(d) if f.endswith('.json')):
        data = json.load(open(os.path.join(d, jf), encoding='utf-8'))
        png = os.path.join(d, jf[:-5] + '.png')
        if not os.path.exists(png):
            continue
        img = Image.open(png).convert('RGB')
        print(f"\n=== scrollY={data['scrollY']}  ·  {data['w']}x{data['h']}  ·  {len(data['elements'])} عنصراً ===")
        for el in data['elements']:
            col = parse_color(el['color'])
            if not col:
                continue
            text_rgb = col[:3]
            bg = background_of(img, el['box'], text_rgb)
            if bg is None:
                continue
            # شفافية العنصر بتمزج نصّه بالأرضية قبل ما نقيس
            a = col[3] * el.get('opacity', 1.0)
            eff = tuple(round(text_rgb[i] * a + bg[i] * (1 - a)) for i in range(3))
            r = contrast(eff, bg)
            need = threshold(el['fontSize'], el['fontWeight'])
            total += 1
            ok = r >= need
            mark = 'ok  ' if ok else 'FAIL'
            kind = 'زر ' if el['isButton'] else '   '
            line = (f"  {mark} {r:5.2f}:1 (>={need})  {kind}"
                    f"{el['fontSize']:.0f}px/{el['fontWeight']:<3}  "
                    f"نص{eff} على {bg}  |  {el['text'][:34]}")
            if not ok:
                fails.append((r, need, el, eff, bg, data['scrollY']))
                print(line)

    print('\n' + '=' * 62)
    print(f'المفحوص: {total} عنصراً  ·  الراسب: {len(fails)}')
    if fails:
        print('\n== الراسبون مرتّبين بالأسوأ ==')
        for r, need, el, eff, bg, y in sorted(fails, key=lambda t: t[0]):
            print(f'  {r:5.2f}:1 (لازم {need})  @{y}  {el["tag"]}.{el["cls"][:26]}  «{el["text"][:30]}»')
    else:
        print('✅ كل النصوص فوق حدّ AA')
    sys.exit(1 if fails else 0)


if __name__ == '__main__':
    main()
