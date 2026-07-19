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
**Utility (pre-existing):** `luvit-glass` · `luvit-water-bg` · `luvit-badge` · `luvit-price` ·
`luvit-eyebrow` · `luvit-skeleton`
**Motion attributes:** `data-luvit="reveal|stagger|slide|parallax|float|counter"`
**JS API:** `LUVIT.bubblePress()` · `LUVIT.nav.*` · `LUVIT.form.*` · `LUVIT.reveal()` ·
`LUVIT.batchReveal()` · `LUVIT.bubbles()`
