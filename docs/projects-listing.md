# Projects Listing — Build Guide

The full projects/portfolio page card grid. Each card reveals a video (or
just dims the static image, if no video) on hover. On touch devices the
hover state is triggered by scroll-into-view instead.

Hero variant on the homepage uses a different component with always-visible
meta — see that component's own notes when we build it on SS Master.

---

## Final structure (Webflow Designer)

```
projects-listing                              Section
└── projects-listing__inner                   Div Block (container)
    └── projects-listing__list                Div Block (CMS list later)
        └── projects-listing__item × N        Div Block
            ├── u-link-cover                  Link Block (absolute, inset 0, z-index 10)
            └── projects-listing__media       Div Block (absolute, inset 0, overflow: clip)
                ├── projects-listing__image-wrap   Div Block
                │   └── projects-listing__image    Image
                ├── projects-listing__overlay      Div Block (dark veil)
                └── projects-listing__video        Custom Element <video> (conditional)
                    └── projects-listing__video-source   Custom Element <source>
        ── HTML Embed (paste the <style> block from the bottom of this doc)
```

DOM order inside `__media` matters — image first (bottom of stack),
overlay second, video last (top of stack). The flip-up depends on this.

`projects-listing__meta` is intentionally absent. Meta lives on the hero
component only.

---

## Per-element styling

### `projects-listing` (Section)
```css
padding: 6rem 0;            /* or your section spacing variable */
width: 100%;
```

### `projects-listing__inner` (Div Block)
```css
width: 100%;
max-width: 80rem;            /* or your container variable */
margin: 0 auto;
padding: 0 1.5rem;
```

### `projects-listing__list` (Div Block)
```css
display: grid;
grid-template-columns: repeat(3, 1fr);
gap: 1.5rem;
width: 100%;
```
- **Tablet:** `grid-template-columns: repeat(2, 1fr);`
- **Mobile:** `grid-template-columns: 1fr;`

### `projects-listing__item` (Div Block)
```css
position: relative;
aspect-ratio: 4 / 5;         /* tweak: 1/1, 3/4, 16/9, etc. */
width: 100%;
overflow: hidden;
border-radius: 1rem;
```

### `u-link-cover` (Link Block)
```css
position: absolute;
inset: 0;
width: 100%;
height: 100%;
z-index: 10;
```

### `projects-listing__media` (Div Block)
```css
position: absolute;
inset: 0;
width: 100%;
height: 100%;
overflow: clip;
border-radius: 1rem;
z-index: 1;
```

### `projects-listing__image-wrap` (Div Block)
```css
position: absolute;
inset: 0;
width: 100%;
height: 100%;
```

### `projects-listing__image` (Image)
```css
width: 100%;
height: 100%;
object-fit: cover;
display: block;
```
Bind CMS Thumbnail Image field.

### `projects-listing__overlay` (Div Block)
```css
position: absolute;
inset: 0;
width: 100%;
height: 100%;
background-color: rgba(10, 10, 10, 0.6);
opacity: 0;                  /* base hidden — embed fades it in on hover */
```

### `projects-listing__video` (Custom Element, tag: `video`)

**Attributes (Element Settings panel):**
- `autoplay` = `autoplay`
- `muted` = `muted`
- `loop` = `loop`
- `playsinline` *(no value)*
- `webkit-playsinline` *(no value)*

**Conditional visibility:** *Visible only if Thumbnail Video Source is set.*

**Style panel:**
```css
position: absolute;
inset: 0;
width: 100%;
height: 100%;
object-fit: cover;
display: block;
opacity: 0;
```
Don't set the `transform` here — the embed CSS owns it so it animates cleanly.

### `projects-listing__video-source` (Custom Element, tag: `source`)
No styles. Attributes only:
- `src` bound to CMS Thumbnail Video field
- `type` = `video/mp4`

---

## HTML Embed — paste as last child of `projects-listing`

```html
<style>
  /* === Projects Listing hover effect === */

  .projects-listing__video {
    transform: scale(0.95) perspective(600px) translateY(75%) rotateX(18deg);
    transform-style: preserve-3d;
    transform-origin: center bottom;
    transition:
      opacity 0.15s cubic-bezier(0.25, 0, 0.25, 1),
      transform 0.85s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .projects-listing__overlay {
    transition:
      opacity 0.2s cubic-bezier(0.25, 0, 0.25, 1),
      backdrop-filter 0.85s cubic-bezier(0.16, 1, 0.3, 1);
  }

  @media (hover: hover) and (pointer: fine) {
    .projects-listing__item:hover .projects-listing__video {
      opacity: 1;
      transform: scale(1) translateY(0) rotateX(0);
    }
    .projects-listing__item:hover .projects-listing__overlay {
      opacity: 1;
      backdrop-filter: blur(2px) sepia();
    }
  }

  @media (hover: none) or (pointer: coarse) {
    .projects-listing__item.is-active .projects-listing__video {
      opacity: 1;
      transform: scale(1) translateY(0) rotateX(0);
    }
    .projects-listing__item.is-active .projects-listing__overlay {
      opacity: 1;
      backdrop-filter: blur(2px) sepia();
    }
  }
</style>
```

---

## Touch fallback — bundle module

For touch devices, scroll-into-view adds `.is-active` to each item.
Module lives at `src/projects-listing.js` and is registered in
`src/transitions.js` next to the other init/destroy pairs.

The item is "active" while it sits roughly in the middle of the
viewport. No work to do here as long as the markup follows the
structure above — it picks up `[data-projects-listing-item]` on each
card (already wired via the class — see the module).

---

## Z-index stack recap

Going bottom to top inside `projects-listing__item`:

| Layer | Element | z-index |
|---|---|---|
| 1 | `__media` wrapper | 1 |
| 2 | `__image` (inside media) | auto |
| 3 | `__overlay` (inside media) | auto |
| 4 | `__video` (inside media, last in DOM) | auto |
| 5 | `u-link-cover` | 10 |

Inside `__media`, DOM order does the work: image → overlay → video.
Link sits on top of everything.

---

## Gotchas

1. **DOM order inside `__media`**: image → overlay → video. Critical for
   the flip-up to read correctly.
2. **`__media` needs `overflow: clip`** (not just `hidden`) — `clip`
   doesn't form a scroll container.
3. **`u-link-cover` z-index** must be higher than anything inside the
   card so clicks land on the link.
4. **The video must have `playsinline`** or iOS will fullscreen on play.
5. **No video on a card?** The conditional visibility hides `__video`
   entirely. Overlay still fades in on hover; static image stays. No
   extra logic needed.
