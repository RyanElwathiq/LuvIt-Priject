# LUVIT — Elementor + WordPress Integration Guide
### Liquid Glass v1 component library

This is the manual for using the library on **plasmajo.com** (WordPress + Elementor Pro
+ WooCommerce + CartFlows + WPCode + LiteSpeed).

---

## PART 1 — ONE-TIME SETUP (do this once, then never again)

Everything the library needs lives in **three WPCode snippets**. Nothing else is
installed, and no files are uploaded.

Go to **WPCode → Code Snippets → + Add Snippet → Add Your Custom Code (New Snippet)**.

### Snippet 1 — the styles

| Setting | Value |
|---|---|
| **Name** | `LUVIT — tokens.css` |
| **Code Type** | **CSS Snippet** |
| **Location** | Auto Insert → **Site Wide Header** |
| **Priority** | `10` |
| **Content** | paste the **entire** contents of `library/tokens.css` |

### Snippet 2 — GSAP (the animation engine)

| Setting | Value |
|---|---|
| **Name** | `LUVIT — GSAP` |
| **Code Type** | **HTML Snippet** |
| **Location** | Auto Insert → **Site Wide Footer** |
| **Priority** | **`5`** ← must be LOWER than snippet 3 |
| **Content** | see below |

```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js"></script>
```

### Snippet 3 — the behaviour

| Setting | Value |
|---|---|
| **Name** | `LUVIT — motion.js` |
| **Code Type** | **HTML Snippet** |
| **Location** | Auto Insert → **Site Wide Footer** |
| **Priority** | **`10`** ← must be HIGHER than snippet 2 |
| **Content** | `<script>` + the **entire** contents of `library/motion.js` + `</script>` |

> **The priority numbers are not optional.** WPCode outputs snippets in priority
> order, lowest first. `motion.js` calls `gsap.registerPlugin()` on its first line,
> so if it runs before GSAP has loaded, **the whole library's JavaScript dies** and
> you get no bubbles, no droplet, no drawer, no validation. GSAP `5`, motion `10`.

> **Why Footer, not Header, for the JS?** Scripts in the header run before the page
> exists, so they find nothing to attach to. Footer means the HTML is already there.

### After ANY snippet change
1. Save / Update the snippet.
2. **LiteSpeed Cache → Toolbox → Purge All.**
3. Check in an **incognito window** (a normal reload may serve you the old cache).

---

## PART 2 — HOW TO ADD COMPONENTS TO A PAGE

**Always use the Elementor `HTML` widget.** Drag it in, paste the markup, done.

**Why not the styled Elementor Button / Form widgets?** Their "CSS Classes" field puts
your class on the *wrapper div*, not on the actual `<a>` or `<input>`, and their own
styles then fight ours. The HTML widget gives us the exact markup the library expects.
(For CartFlows / WooCommerce, which generate their own markup, see Part 6.)

### Buttons
```html
<a href="/shop" class="luvit-btn">تسوّقي الآن</a>
<a href="/routines" class="luvit-btn luvit-btn--arrow">اكتشفي روتينك</a>
<a href="/about" class="luvit-btn luvit-btn--ghost">تعرّفي علينا</a>
```
On a dark/water section, add `luvit-btn--on-dark` to the ghost variant.

### Cards
```html
<div class="luvit-card-grid" data-luvit="stagger">
  <article class="luvit-card luvit-card--product">
    <div class="luvit-card__media">
      <span class="luvit-card__badge">جديد</span>
      <img src="…" alt="وصف المنتج" loading="lazy" decoding="async">
    </div>
    <div class="luvit-card__body">
      <h3 class="luvit-card__title"><a class="luvit-card__link" href="/product/x">اسم المنتج</a></h3>
      <p class="luvit-card__text">وصف قصير.</p>
      <div class="luvit-card__footer">
        <span class="luvit-card__price">12.00 JOD</span>
        <button type="button" class="luvit-btn">أضيفي إلى السلة</button>
      </div>
    </div>
  </article>
</div>
```
Variants: `--product` (4:5) · `--routine` (16:9) · `--feature` (no photo) ·
`--glass` (frosted, dark sections only) · `--on-dark`.
Grid: `luvit-card-grid` (2/3/4 cols) or `luvit-card-grid--wide` (1/2/3 cols).

**Photos:** crop to **4:5** yourself, export **WebP**, ~**800px** wide, and keep the
bottom of the frame clean — the waterline sits there.

### Forms
Full markup is in `library/forms-demo.html`. The shape of every field:
```html
<div class="luvit-field">
  <label class="luvit-field__label" for="UNIQUE_ID">الاسم <span class="luvit-field__req">*</span></label>
  <div class="luvit-field__control">
    <input class="luvit-input" id="UNIQUE_ID" name="name" type="text" autocomplete="name" required>
  </div>
  <p class="luvit-field__error"></p>   <!-- leave EMPTY — filled by motion.js -->
</div>
```
Rules: `for` must match `id`; leave the error `<p>` empty; use the right
`type`/`inputmode`; never lower the font below **16px** (iOS zooms the page).

---

## PART 3 — THE NAVIGATION BAR (the part you asked about)

### 3.1 Where the nav goes

The bar must appear on **every page**, so it belongs in a **header template**, not on
individual pages.

1. **Templates → Theme Builder → Header → Add New Header.**
2. Give it a **single-column** section.
3. Drop in one **HTML widget**.
4. Paste the whole nav block from `library/nav-demo.html` — that's the `<header class="luvit-nav">`,
   the `<div class="luvit-drawer">`, and the `<nav class="luvit-dock">` **all three together**.
5. **Publish → Display Conditions → Entire Site.**

> Paste all three pieces into the **same** HTML widget. The drawer and dock are
> `position: fixed`, so it doesn't matter where they sit in the document — but the
> JavaScript expects to find them, and keeping them together means one place to edit.

Then, so the fixed bar doesn't cover your content, add these classes to each page's
outer section (Advanced → CSS Classes):
- `luvit-nav-offset` — pads the top by the bar's height
- `luvit-dock-offset` — pads the bottom past the mobile dock

---

### 3.2 ⭐ THE DARK / LIGHT SECTIONS — how to implement it

**The problem this solves:** the bar's default styling is white text on translucent
glass, which is correct over the dark hero. Over a white content section it becomes
**white text on white — invisible**.

**The solution:** every section declares whether its background is dark or light, and
the bar re-colours itself as that section passes behind it.

#### What you add to each section

In Elementor, select the **Section / Container** (not a widget inside it), then:

**Advanced tab → Attributes** *(Elementor Pro feature; it sits near the bottom,
under Custom CSS and Motion Effects)*

Type **one attribute per line**, using a **pipe** `|` between key and value:

```
data-nav-bg|dark
```
or
```
data-nav-bg|light
```

> ⚠️ The separator is a pipe `|`, **not** an equals sign. `data-nav-bg=dark` will not work.

#### Which value to use

| Your section's background | Use | The bar becomes |
|---|---|---|
| Hero, underwater, deep teal, any dark photo | `data-nav-bg\|dark` | white text, white glass |
| White, cream, `--color-canvas`, light photo | `data-nav-bg\|light` | dark ink text, white frosted panel, aqua droplet |

#### The rules

1. **Tag EVERY section on the page.** A section with no attribute is treated as dark —
   so a forgotten light section = invisible white text. This is the #1 thing to check
   if the bar ever looks wrong.
2. **Judge by what sits behind the BAR**, not by the section's average colour. If a
   section is dark at the top and light at the bottom, what matters is the part the
   bar crosses.
3. Sections can alternate freely — dark, light, dark, light. It re-themes each time,
   in both scroll directions.

#### How it works (so you can debug it)
`motion.js` places a **1px detection band exactly at the bar's centre line** and
watches which tagged section crosses it, then adds `.is-on-light` or `.is-on-dark`
to the nav. It uses `IntersectionObserver`, so nothing runs on every scroll frame.

#### Testing it
Scroll slowly through the page. At each section boundary the bar should cross-fade
(260ms) between white and dark. If one section doesn't switch → that section is
missing its attribute.

---

### 3.3 The links (three lists that must stay in sync)

The same navigation appears in three places:

| Where | Class | How many |
|---|---|---|
| Top bar (desktop) | `.luvit-nav__link` | 5–6 max, or the pill gets too wide |
| Bottom dock (mobile) | `.luvit-dock__item` | **4** — UX guidance caps a dock at 5 |
| Drawer (mobile) | `.luvit-drawer__link` | everything, including overflow |

Mark the current page with `aria-current="page"` — **in all three lists, one link each**.
It drives the droplet's resting position, the dock highlight, and screen readers.

### 3.4 The cart count
```js
document.querySelector('#luvit-cart-count').textContent = 3;
```
Add the `hidden` attribute when the cart is empty. To wire it to WooCommerce, update
this on the `added_to_cart` / `removed_from_cart` jQuery events.

---

## PART 4 — TUNING (change the number, nothing else)

All of these are in the `:root` blocks of `tokens.css`.

| To change | Token |
|---|---|
| Button colour depth | `--btn-fill-top` / `--btn-fill-bottom` |
| Card hover lift speed | `--card-duration` |
| Waterline resting level / depth | `--card-waterline-rest` / `--card-waterline-h` |
| Wave shape | `--card-wave` (see the NOTE A comment in the file) |
| Nav droplet springiness | `--nav-spring` / `--nav-spring-ms` |
| Drawer rise speed | `--drawer-ms` |
| Field height / spacing | `--field-h` / `--field-stack` |
| Switch size | `--switch-w` / `--switch-h` / `--switch-drop` |

`tokens.css` also contains a **TUNING PANEL** comment block (search for that phrase)
listing every card/animation knob with safe ranges.

> **Never** move the `luvit-water-drift` animation outside the `:hover` / `:active`
> rules. If it always runs, every card on the page repaints continuously.

---

## PART 5 — PERFORMANCE RULES (these are not suggestions)

1. **`backdrop-filter` is the most expensive thing in this library.** Only two things
   use it: `.luvit-card--glass` and the nav bar.
   - Max **3–4 glass cards** on screen at once. For full product grids use
     `.luvit-card--on-dark` — looks close, costs nothing.
   - Never put glass over the scrolling hero sequence.
2. **LiteSpeed JS optimisation breaks animations.** If the hero, droplet or drawer
   stops working, go to **LiteSpeed → Page Optimization → JS Settings** and turn off
   **JS Combine** and **JS Defer**, then purge. Test one at a time.
3. All animation runs on `transform` / `opacity` only. If you add anything, keep to
   that — animating `width`, `height`, `top` or `left` forces layout every frame.

---

## PART 6 — WOOCOMMERCE & CARTFLOWS

WooCommerce (shop loop, checkout) and CartFlows (funnels, optins) **render their own
markup**, so our classes never land on their fields. `tokens.css` therefore ends with a
**compatibility layer** that maps our look onto their selectors:

- `.woocommerce form .form-row input.input-text` (and textarea/select)
- `.wcf-embed-checkout-form input/textarea/select`
- `.cartflows-container input/select`
- their validation states (`.woocommerce-invalid`, `.woocommerce-validated`)
- their submit buttons (`#place_order`, `button[type="submit"]`)

This includes the **16px font rule**, so their fields don't trigger the iOS zoom either.

**If a plugin field still looks unstyled:** right-click it → Inspect → copy its class,
and add that selector to the compatibility block. It's built to be extended that way.

**Still to do (a separate job):** the WooCommerce **product grid** on `/shop` is
generated by Woo, so it does not use `.luvit-card`. Matching it needs either template
overrides or a CSS mapping like the one above.

---

## PART 7 — TROUBLESHOOTING

| Symptom | Cause |
|---|---|
| Nav text invisible on a section | That section is missing `data-nav-bg\|light` |
| No bubbles / droplet / drawer / validation | GSAP priority is not lower than motion.js, or LiteSpeed JS Combine is on |
| Animations dead after an edit | LiteSpeed cache — purge, then test in incognito |
| Fields overlap in a narrow Elementor column | A wrapper is missing `min-width: 0` — grid/flex children won't shrink below an input's built-in width. Our fields already set it; a custom wrapper of yours may not |
| Page zooms when tapping a field on iPhone | Something set the input font below 16px |
| Error messages appear in English | A field is relying on the browser's own message — our Arabic text comes from `motion.js`; make sure the empty `<p class="luvit-field__error"></p>` is present |
| Sideways scrollbar appears | Usually a `100vw` element plus the scrollbar width — see the `html, body { overflow-x: hidden }` note in the hero section |

---

## PART 8 — THE REST OF THE LIBRARY (components 5–14)

Added after the first four. All follow the same rule: paste the markup into an
Elementor **HTML widget**. Full working examples live in `home-preview.html`.

### 5 · Testimonials — `.luvit-testimonials`
Swipeable card stack. **One dot per card**, or the dots desync.
Drag, arrows, dots and keyboard all work. Needs `motion.js`.

### 6 · Wave divider — `.luvit-wave`
The seam between two sections, as water.
```html
<div class="luvit-wave" style="--wave-fill:#FFFFFF;background:#0B9198"></div>
```
`--wave-fill` = colour of the section **below**. `background` = colour **above**.

⚠️ **Adding `--drift` (a moving wave)?** The path must tile or it visibly jumps:
its `viewBox` must be `0 0 2880 70` (two identical cycles, second one's control
points = first's with x + 1440), and it must **start, pass x=1440, and end at
the same y**. Both rules are documented in the CSS. Elementor's own Shape
Divider is a fine alternative.

### 7 · Trust bar — `.luvit-trust`
Delivery / COD / authenticity. 2-up on phones, 4-up on desktop.

### 8 · Steps — `.luvit-steps`
"كيف تطلبي". Numbered, joined by a water line on desktop.

### 9 · Accordion — `.luvit-acc`
Built on native `<details>`, so keyboard and screen readers work **with no
JavaScript**. Add `data-acc-single` to the wrapper so opening one closes the rest.

### 10 · Footer — `.luvit-footer`
The deepest water on the site. In Elementor put this in
**Theme Builder → Footer**, same as the header.

### 11 · Living deep water — `.luvit-deep`
Makes a dark section breathe instead of sitting as a flat gradient.
```html
<section class="luvit-deep" data-luvit-bubbles="12">
  <span class="luvit-deep__rays"></span>
  … content …
</section>
```
Drifting caustics + light rays (CSS) and a bubble field (`data-luvit-bubbles`).
Cycles are 34–44s **on purpose** — if you can consciously watch it move, it
reads as "animated" rather than "alive". Content needs no extra class; the
component already lifts it above the water layers.

### 12 · Ingredients — `.luvit-ing`
Prints real percentages. **There are no percentage bars, deliberately** —
actives sit at 2–5%, so a bar would either look negligible or need scaling up,
which misrepresents the dose. The number is the truth.
🔴 **Verify every percentage against the actual bottle before publishing.**

### 13 · Before / after — `.luvit-compare`
Wipe slider. The control is a real `<input type="range">`, so keyboard and
screen readers work for free.
⚠️ Everything in it is **physical, not logical** (`left`/`right`, and the range
is forced `direction: ltr`). Do not "fix" it to logical properties for RTL —
that was the original bug: the divider line and the reveal moved in opposite
directions.

### 14 · Quiz teaser — `.luvit-quiz`
One question inline. Reuses the option cards from the forms component.

### Section helpers
`.luvit-section` + `__inner` `__head` `__eyebrow` `__title` `__sub` ·
`--dark` for dark bands · `.luvit-cta` + `__panel` `__title` `__sub` `__accent`

⚠️ **`.luvit-cta__accent`**: use an aqua. `--fuchsia-500` measures ~2.1:1 on deep
teal — unreadable — however well it works on the white cart badge.

### Scroll motion, applied as attributes
```html
data-luvit="reveal"    fade + rise as it enters view   (use on section heads)
data-luvit="stagger"   children appear one by one      (use on card grids)
data-luvit="counter"   count a number up
data-luvit-bubbles="12"  bubble field (on .luvit-deep)
```

---

## PART 9 — BUILDING THE HOME PAGE IN ELEMENTOR

`library/home-preview.html` is the finished reference. Each numbered section
there becomes one Elementor section, in this order:

| # | Section | Component |
|---|---|---|
| 1 | Hero + 5 story chapters | the scroll sequence (HTML widget) |
| 2 | Trust bar | `.luvit-trust` |
| 3 | Routines | `.luvit-card--routine` |
| 4 | Quiz teaser | `.luvit-quiz` on `.luvit-deep` |
| 5 | Products | `.luvit-card--product` |
| 6 | Ingredients | `.luvit-ing` on `.luvit-deep` |
| 7 | Before / after | `.luvit-compare` |
| 8 | Why LUVIT | `.luvit-card--feature` on `.luvit-deep` |
| 9 | How to order | `.luvit-steps` |
| 10 | Testimonials | `.luvit-testimonials` |
| 11 | FAQ | `.luvit-acc` |
| 12 | Closing CTA | `.luvit-cta` |
| 13 | Footer | `.luvit-footer` (Theme Builder) |

**Every section needs `data-nav-bg|dark` or `|light`** (Advanced → Attributes),
or the navigation bar can't re-theme itself. See Part 3.2.

**Suggested order of work:** start with the **trust bar** — it's the simplest,
has no motion, and proves the whole pipeline works before you tackle anything
harder. Leave the hero until last; it's the most complex piece.

🔴 **Before going live:** every image in the preview is a placeholder SVG, and
every number (percentages, prices, delivery times, testimonials) is example
text written during the build. All of it must be replaced with real content.

---

## QUICK REFERENCE — every class

**Buttons:** `luvit-btn` · `--ghost` · `--arrow` · `--on-dark`
**Cards:** `luvit-card` · `--product` `--routine` `--feature` `--glass` `--on-dark` ·
`luvit-card__media/__badge/__body/__eyebrow/__title/__link/__text/__footer/__price/__head/__step/__more/__icon` ·
`luvit-card-grid` · `--wide`
**Nav:** `luvit-nav` · `__bar/__brand/__links/__link/__drop/__actions/__icon-btn/__count/__toggle/__burger` ·
`luvit-drawer` · `__water/__panel/__link/__sep/__small` · `luvit-dock` · `__item` ·
`luvit-skip` · `luvit-nav-offset` · `luvit-dock-offset`
**Forms:** `luvit-form` · `--on-dark` · `__row` `__row--2` `__status` · `luvit-fieldset` · `__legend` ·
`luvit-field` · `__label/__req/__control/__hint/__error/__success/__prefix` ·
`luvit-input` · `luvit-textarea` · `luvit-select` · `luvit-check` · `--radio` · `__box` ·
`luvit-switch` · `__track/__drop` · `luvit-option` · `__icon/__label` · `luvit-optiongrid`
**Testimonials:** `luvit-testimonials` · `--on-dark` · `__stack` `__controls` `__btn` `__dots` `__dot` ·
`luvit-testimonial` · `--glass` · `__avatar/__stars/__quote/__author/__role/__mark`
**Wave:** `luvit-wave` · `--drift` · `--flip` (set `--wave-fill`)
**Trust:** `luvit-trust` · `--on-dark` · `__item/__icon/__title/__note`
**Steps:** `luvit-steps` · `luvit-step` · `__num/__body/__title/__text`
**Accordion:** `luvit-acc` (+ `data-acc-single`) · `__item/__q/__sign/__a`
**Footer:** `luvit-footer` · `__inner/__brand/__tag/__h/__list/__social/__bar/__pay`
**Deep water:** `luvit-deep` · `__rays` (+ `data-luvit-bubbles="12"`)
**Ingredients:** `luvit-ing` · `--on-dark` · `__row/__pct/__body/__name/__note`
**Compare:** `luvit-compare` · `__after/__label/__label--before/__label--after/__line/__grip/__range`
**Quiz:** `luvit-quiz` · `--on-dark` · `__q/__foot/__hint`
**Sections:** `luvit-section` · `--tight` `--dark` · `__inner/__head/__eyebrow/__title/__sub` ·
`luvit-cta` · `__panel/__title/__sub/__accent` · `luvit-nav-offset` · `luvit-dock-offset`
**Utility (pre-existing):** `luvit-glass` · `luvit-water-bg` · `luvit-badge` · `luvit-price` ·
`luvit-eyebrow` · `luvit-skeleton` · `luvit-sr-only`
**Motion attributes:** `data-luvit="reveal|stagger|slide|parallax|float|counter"` ·
`data-luvit-bubbles="12"` · `data-nav-bg="light|dark"` · `data-acc-single`
**JS API:** `LUVIT.bubblePress()` · `LUVIT.nav.*` · `LUVIT.form.*` · `LUVIT.testimonials.*` ·
`LUVIT.accordion.*` · `LUVIT.compare.*` · `LUVIT.reveal()` · `LUVIT.batchReveal()` · `LUVIT.bubbles()`

---

## FILE MAP

```
D:\luvit\
├── library\                    ← the component library
│   ├── tokens.css              ← ALL styles (paste into WPCode)
│   ├── motion.js               ← ALL behaviour (paste into WPCode)
│   ├── ELEMENTOR-GUIDE.md      ← this file
│   ├── home-preview.html       ← the finished HOME page reference
│   └── *-demo.html             ← one demo per component
└── hero-sequence\              ← the scroll-frame hero
    ├── scroll-sequence.html    ← the drop-in (live plasmajo.com URLs)
    ├── hero-chapters-preview.html
    ├── frames\  frames-desktop\
    └── *.mp4
```

**To preview locally** (needed — the browser blocks `fetch()` on `file://`):
```
node serve.js "D:\luvit" 4322
http://localhost:4322/library/home-preview.html
```
