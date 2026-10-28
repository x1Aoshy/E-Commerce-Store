# Storefront Ecom

A clean and minimalist supplement storefront built with Next.js (App Router) and Tailwind CSS. Order management is handled seamlessly via WhatsApp (`wa.me` links), and inventory is automatically deducted upon order confirmation. All data (products and orders) is securely stored in Supabase (PostgreSQL).

## 🌟 Key Features

* **🛍️ Minimalist Storefront:** Features a hero section, a product grid with category filters, detailed product modals, and a slide-out shopping cart.
* **💬 WhatsApp Checkout:** The cart compiles the order and redirects the user to WhatsApp with a pre-filled summary addressed to the vendor's number. No traditional payment gateway is required.
* **📦 Real-Time Inventory:** Every order is validated against the current stock and deducted automatically. If there is insufficient stock, the order is rejected with detailed feedback.
* **🔐 Admin Dashboard (`/admin`):** A secure panel to manage pricing, update stock levels, highlight featured products, add new items, and view/confirm orders.

## 🎨 Design System — "Carbon & 24K"

The storefront runs on a small, opinionated design system. Read this before
touching styles: it explains *why* things look the way they do.

### Colour — three colours, three jobs

| Token | Role | Where it may appear |
| --- | --- | --- |
| `accent` (24K gold) | Brand, price, primary purchase action | Buy buttons, prices, brand marks |
| `ember` (hot orange) | **Urgency only** | Discounts, countdown, "only N left", cart badge |
| `green` | Trust / go | Stock status, WhatsApp, confirmations |

A colour with no job doesn't get used. `ember` in particular is never
decorative — if it shows up, there is something to lose.

Neutrals are semantic tokens (`ink`, `night`, `surface`, `line`, `fill`) backed
by CSS variables. Add `theme-dark` to any subtree that must stay dark
regardless of theme (the admin panel and the brand reel both do this).

### Light mode is its own theme, not an inversion

The first attempt just flipped the neutrals, and it fell apart: a pale gold that
glows on carbon is invisible on paper. Two rules came out of that.

**1. Colour used as *text* goes through a semantic token that retells the same
meaning in the tone the background needs.** Use these for text and icons —
never the fixed scales:

| Token | Meaning | Dark | Light | Contrast (light) |
| --- | --- | --- | --- | --- |
| `text-brand` | brand, price | gold `#f6ce4e` | bronze `#855a0c` | 5.8:1 |
| `text-urgent` | urgency | ember `#ff9a6b` | brick `#b22d0b` | 6.1:1 |
| `text-ok` | trust, stock | mint `#5fe0a0` | forest `#0a6940` | 6.8:1 |

The fixed scales (`bg-accent-400`, `bg-ember-500`…) stay for **fills**, where a
bright chip with dark text works identically in both themes.

**2. Anything sitting on a photo uses `scrim`, which never inverts.** Sold-out
overlays, "only 3 left" badges and gallery arrows were built on `bg-night`;
the moment the theme flipped they became pale boxes with pale text on a photo.
`bg-scrim/85` + `text-white` is always legible because a photo is always busy.

The light page itself is near-white paper (`#faf9f6`) with pure white cards, so
cards separate cleanly — the earlier cream-on-cream read as one beige smear.
Alternating section bands use `bg-surface-soft/50`, which is perceptible over
both carbon and paper; `bg-surface/25` was invisible on white.

### Type — one family, three weights

**Manrope** (variable) does everything. `.headline` is the same family at
weight 800 with tight tracking, in **sentence case** — an earlier version used a
condensed poster face in all-caps and it shouted over the product photography,
which is what actually sells. `.eyebrow` micro-labels use the *system*
monospace stack, so they cost nothing to download.

One family means one font file (~24 KB) instead of nine, which is most of why
the page scrolls smoothly on a mid-range phone.

### Geometry

Structural elements are **square** (zero radius): cards, buttons, inputs,
badges. Only chips and filters are pills. That hard/soft collision is the
signature — don't soften the rectangles. `.card-poster` and `shadow-hard` add
the offset screen-printed shadow for blocks that need to shout.

### Motion — and the performance budget behind it

Movement communicates; nothing moves for decoration. Primitives live in
`src/components/motion/` (`Marquee`, `Headline`, `CountUp`) plus
`src/lib/useReveal.ts` (scroll reveal, with variants) and
`src/lib/flyToCart.ts` (the add-to-cart flight).

**Rules, learned the hard way** — an earlier pass shipped continuously animated
blurred gradients and a moving `background-position`, and scrolling dropped to
roughly 13 fps on throttled mobile:

* Animate **`transform` and `opacity` only**. Never `background-position`,
  `filter`, `blur`, `width`, or `top` on a loop.
* **No large `mix-blend-mode` layers over moving content** — blending forces the
  whole area to recomposite every frame.
* **`backdrop-filter` is not free.** Sticky headers and filter bars use solid
  backgrounds instead.
* **Ambient loops pause when off-screen** (marquees observe their own
  visibility) and video pauses when the tab is hidden.
* **One infinite animation per concept**, not per item — a blinking dot on every
  card in a 20-product grid is 20 live animations for no added meaning.
* `prefers-reduced-motion` switches all of it off.

Reveal-on-scroll and `CountUp` both carry a 2.5 s failsafe: if the
`IntersectionObserver` never fires, the content and the real numbers appear
anyway. A missing animation is a detail; content that never appears is a lost
sale.

### The announcement bar

`src/components/AnnouncementBar.tsx` is deliberately *not* a scrolling ticker.
One message shows at a time and rotates on a slot-style vertical transition, so
motion happens only at the change instead of continuously pulling the eye. A
segmented indicator fills in real time, each message links somewhere useful
(delivery and payment claims open the FAQ; support claims open WhatsApp), and
the whole bar is dismissible for the session — anything placed above the logo
without asking should be removable. It pauses on hover and when the tab is
hidden, and `prefers-reduced-motion` swaps the slide for a plain change.

### Video

Two ways to get motion footage on the home page, both handled by
`src/components/home/BrandFilm.tsx`:

1. **Upload real footage.** Add an `.mp4`/`.webm` to *Settings → Hero images* in
   the admin panel. It plays full-bleed and looping (muted, with play/pause and
   sound controls) both in the hero background and in the brand reel.
2. **No footage? The reel builds itself.** With no video uploaded, the section
   edits one from the store's own product photos: each shot gets a slow
   ken-burns push, the headline assembles word by word over it, and a progress
   bar tracks the cut — the Instagram-story language customers already read.

Product cards use the same idea at small scale: with two or more media, the
second one cross-fades in on hover, and if it's a video it plays by itself.

### Honesty rules (please keep them)

Sections hide themselves rather than show invented data. The deals band only
renders when products are genuinely discounted, the review wall only when real
approved reviews exist, and the hero's trust figures are computed from the live
catalogue (products in stock, real review average) — never hard-coded. Scarcity
copy ("only 3 left") is driven by actual stock. The countdown runs to midnight
tonight because the band is titled *today's deals*, and it resets honestly.

## 🚀 Getting Started

### Moneda

Todos los precios, descuentos y cargos se guardan en córdobas nicaragüenses
(NIO). La tienda y las facturas muestran `C$` por defecto. El selector de moneda
en la cabecera, el pie, el panel de administración y el recibo permite ver los
importes en dólares (`US$`); la selección se recuerda en el navegador.

La conversión usa **C$36.6243 por US$1**. Podés configurar otra tasa con
`NEXT_PUBLIC_USD_EXCHANGE_RATE` antes de compilar/desplegar la app. Los importes
se muestran con dos decimales; cambiar la moneda no modifica precios ni pedidos
guardados. Los campos de edición del inventario y los cargos extra se ingresan
siempre en C$, como indican sus etiquetas. Las facturas impresas, los mensajes
de WhatsApp y las exportaciones CSV usan la moneda seleccionada. El QR/enlace
del recibo incluye esa moneda para abrirlo en la misma presentación.

```bash
npm install
cp .env.example .env.local  # Add your environment variables (including Supabase credentials)
npm run dev                 # Starts the server at http://localhost:3000


Database Setup (Supabase)
Create a free project on Supabase.

Navigate to SQL Editor → New query, paste the contents of supabase/schema.sql, and click Run. This will create the products and orders tables and populate the database with a sample catalog.

Go to Project Settings → API and copy the following credentials:

Project URL → SUPABASE_URL

service_role key → SUPABASE_SERVICE_ROLE_KEY (Keep this secret!)

Add these values to your .env.local file (for local development) and/or to your Vercel environment variables (for production).

Note: The service_role key is strictly used server-side (within Server Components and Route Handlers) via src/lib/supabase.js. It is never exposed to the browser. The tables have Row Level Security (RLS) enabled, ensuring that the public API key cannot directly read or write to the database.


Variable,Description
NEXT_PUBLIC_WHATSAPP_NUMBER,"Vendor's phone number in international format, without the + sign or spaces. (e.g., 5491112345678)"
NEXT_PUBLIC_STORE_NAME,"Brand or store name (used in headers, titles, and messages)."
NEXT_PUBLIC_USD_EXCHANGE_RATE,Córdobas per US dollar for display conversion (defaults to 36.6243).
ADMIN_PASSWORD,Password for accessing the /admin dashboard.
SUPABASE_URL,Your Supabase Project URL.
SUPABASE_SERVICE_ROLE_KEY,"Your Supabase service_role key (must be kept secret, server-side only)."

Deployment on Vercel
Import the repository into Vercel.

Root Directory: Leave it set to the repository root (the Next.js app resides here).

Add the same environment variables listed in the table above under Settings → Environment Variables.

Click Deploy. Vercel will automatically generate preview deployments for every subsequent push.

Important: The product catalog and orders are managed through Supabase rather than the local filesystem, as Vercel's filesystem is read-only. This architecture ensures that the /admin dashboard remains fully functional in the production environment.


🔄 Database Migration
The data access interface is decoupled and isolated within src/lib/db.js (e.g., getProducts, createOrder). To migrate to Prisma, another PostgreSQL instance, or MySQL, simply replace the implementations of these functions. No modifications to the rest of the application are required.


src/
├── app/
│   ├── page.js                 # Main Storefront
│   ├── admin/page.js           # Admin Login & Dashboard
│   └── api/
│       ├── products/           # GET catalog · POST new product · PATCH edits
│       ├── orders/             # POST create order (deducts stock) · GET order list
│       └── admin/verify/       # Admin panel cookie-based login verification
├── components/                 # UI Components (Header, Hero, ProductGrid, CartDrawer, Admin, etc.)
├── context/CartContext.js      # Shopping cart state management (via localStorage)
└── lib/                        # Utilities (db/Supabase interface, Supabase client, WhatsApp logic, formatting, auth)
supabase/
└── schema.sql                  # Database tables, RLS policies, and initial catalog seed (run in Supabase)
