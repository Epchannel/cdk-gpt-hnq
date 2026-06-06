# Design HNQ

Template tieu chuan cho landing page / web app tinh phong cach premium dark, co cam giac cong nghe, toc do va tin cay.

## 1. Tinh Than Thiet Ke

- Phong cach chinh: dark premium, high-contrast, tech product, motion vua du.
- Cam giac can dat: nhanh, sac, dang tin, co nang luong, khong lanh leo.
- Nen uu tien: giao dien dung duoc ngay, hero ro san pham/dich vu, CTA hien ro trong viewport dau.
- Tranh: qua nhieu gradient tim/xanh slate, card long lanh vo nghia, text hero qua dai, hieu ung gay roi.

## 2. Mau Sac

Dung token mau thong nhat:

```css
:root {
  --bg: #0a0a0a;
  --bg-2: #0f0f0f;
  --bg-3: #14140f;
  --ink: #f5f5f0;
  --ink-dim: #a8a89e;
  --ink-fade: #5a5a55;
  --line: rgba(245,245,240,.08);
  --line-strong: rgba(245,245,240,.18);
  --accent: #ff2d2d;
  --accent-2: #ffb800;
  --accent-3: #ff6a00;
  --glow: rgba(255,45,45,.5);
  --ok: #4ade80;
  --warn: #fbbf24;
  --err: #ff5e7a;
}
```

Nguyen tac dung mau:

- Nen chinh luon la `--bg`, section/card dung `--bg-2`.
- Text chinh dung `--ink`, text phu dung `--ink-dim`, metadata dung `--ink-fade`.
- Accent do/cam/vang chi dung cho CTA, logo mark, badge, icon, highlight gia, progress.
- Border dung `--line`; hover/focus moi tang len `--line-strong`.

## 3. Font Chu

Font khuyen nghi:

```html
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,300..800&family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">
```

```css
:root {
  --display: "Bricolage Grotesque", sans-serif;
  --serif: "Instrument Serif", serif;
  --mono: "JetBrains Mono", monospace;
}
```

Quy uoc:

- Body, nav, card title: `--display`.
- Tu khoa nhan manh trong heading: `--serif`, italic, gradient text.
- Badge, label, stat label, code-like text, price note: `--mono`.
- Letter spacing mac dinh nen bang 0 hoac gan 0. Chi dung spacing lon cho mono uppercase label.

## 4. Layout Chung

Khung trang:

- Nav sticky tren cung, nen den trong suot co blur, border-bottom nhe.
- Hero full-width, co grid nen, glow blob, spotlight theo chuot neu co JS.
- Noi dung max-width: `1180px` den `1400px`.
- Section padding desktop: `5rem 2rem`.
- Section padding mobile: `4rem 1rem`.
- Grid desktop thuong 3 cot, tablet 2 cot, mobile 1 cot.

Skeleton:

```html
<header class="nav">...</header>
<main>
  <section class="hero">...</section>
  <section class="section" id="features">...</section>
  <section class="section" id="pricing">...</section>
  <section class="section" id="faq">...</section>
  <section class="cta-band">...</section>
</main>
<footer class="footer">...</footer>
```

## 5. Hero Chuan

Hero nen co:

- Badge trang thai ngan.
- H1 ro literal offer/product.
- 1 doan subcopy duoi 2 dong desktop, 3-4 dong mobile.
- 2 CTA: primary va ghost.
- Stat row hoac trust row.
- Visual/mockup san pham o ben phai hoac ben duoi mobile.

Mau heading:

```html
<h1>
  Tai nguyen bo video <span class="gradient">chat luong goc</span>, khong watermark.
</h1>
```

Mau gradient text:

```css
.gradient {
  font-family: var(--serif);
  font-style: italic;
  font-weight: 400;
  background: linear-gradient(120deg, var(--accent), var(--accent-3) 45%, var(--accent-2));
  background-size: 200% auto;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: shimmer 5s linear infinite;
}
```

## 6. Component Tokens

Button primary:

```css
.btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: .55rem;
  min-height: 46px;
  padding: .84rem 1.45rem;
  border: 0;
  border-radius: 999px;
  background: linear-gradient(135deg, var(--accent), var(--accent-2));
  color: #000;
  font-weight: 750;
  box-shadow: 0 14px 34px -12px var(--glow);
}
```

Card:

```css
.card {
  position: relative;
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: 18px;
  background: linear-gradient(180deg, rgba(255,255,255,.035), rgba(255,255,255,.015));
}
```

Badge:

```css
.badge {
  display: inline-flex;
  align-items: center;
  gap: .5rem;
  padding: .4rem .85rem;
  border: 1px solid rgba(255,45,45,.25);
  border-radius: 999px;
  background: rgba(255,45,45,.08);
  color: var(--accent-2);
  font: 700 .7rem var(--mono);
  letter-spacing: .12em;
  text-transform: uppercase;
}
```

## 7. Hieu Ung

Dung motion co muc dich:

- Scroll reveal cho section/card.
- Marquee cho thong so hoac keyword.
- Progress bar doc trang.
- Hover card nang nhe `translateY(-3px)` den `-6px`.
- Hero visual float nhe.

Motion rules:

- Duration reveal: `.55s` den `.75s`.
- Easing: `cubic-bezier(.16,1,.3,1)`.
- Khong de animation quan trong hon noi dung.
- Luon ton trong `prefers-reduced-motion`.

Reveal mau:

```css
.reveal {
  opacity: 0;
  transform: translateY(22px);
  transition: opacity .65s cubic-bezier(.16,1,.3,1),
              transform .65s cubic-bezier(.16,1,.3,1);
}
.reveal.in {
  opacity: 1;
  transform: translateY(0);
}
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation: none !important;
    transition: none !important;
  }
  .reveal {
    opacity: 1;
    transform: none;
  }
}
```

JS reveal:

```js
const reveals = document.querySelectorAll(".reveal");
const io = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("in");
      io.unobserve(entry.target);
    }
  });
}, { threshold: 0.16, rootMargin: "0px 0px -8% 0px" });
reveals.forEach((el) => io.observe(el));
```

## 8. Responsive Rules

- Desktop: hero 2 cot, visual ben phai.
- Tablet duoi `980px`: hero 1 cot, grid 2 cot.
- Mobile duoi `720px`: an nav links, grid 1 cot, padding ngang `1rem`.
- Kiem tra bat buoc: khong `overflow-x`, text khong bi cat, CTA khong qua hep.

Mau breakpoint:

```css
@media (max-width: 980px) {
  .hero-inner { grid-template-columns: 1fr; }
  .grid-3 { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 720px) {
  .nav-links { display: none; }
  .grid-3 { grid-template-columns: 1fr; }
  .section, .hero { padding-inline: 1rem; }
}
```

## 9. Noi Dung Va Copy

Copy nen:

- Noi thang loi ich, tranh slogan rong.
- Gia tri cu the: toc do, so luong, chat luong, gia.
- Moi section co eyebrow ngan, title ro, desc ngan.
- CTA dung dong tu hanh dong: "Dang ky", "Tai ngay", "Xem bang gia", "Bat dau".

Mau section header:

```html
<div class="section-header">
  <div class="eyebrow reveal">Tinh nang</div>
  <h2 class="section-title reveal">Tai nhanh, tai du, <span class="gradient">tai an toan</span></h2>
  <p class="section-desc reveal">Mot cau mo ta ngan, noi dung, khong trang tri qua da.</p>
</div>
```

## 10. Checklist Truoc Khi Ban Giao

- Desktop khong loi console.
- Mobile 375px khong tran ngang.
- CTA trong hero nhin thay trong viewport dau.
- Font da load fallback on.
- Tat ca link backend gia lap de `#` neu la web tinh.
- `prefers-reduced-motion` da co.
- Mau khong lech khoi token chinh.
- Section khong dung nested card qua sau.

