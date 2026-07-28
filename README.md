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
by CSS variables, so light mode is a token flip rather than a class rewrite.
Add `theme-dark` to any subtree that must stay dark regardless of theme (the
admin panel and the brand reel both do this).

### Type — three voices

* **Anton** (`font-display`, via the `.headline` class) — poster headlines only.
  Uppercase, very tight leading. Used big and used sparingly.
* **Manrope** (`font-sans`) — all UI and body copy; clear figures for prices.
* **JetBrains Mono** (`font-mono`, via `.eyebrow`) — technical micro-labels.

`h1`/`h2` deliberately stay in Manrope so the admin panel reads normally;
poster type is opt-in with `.headline`.

### Geometry

Structural elements are **square** (zero radius): cards, buttons, inputs,
badges. Only chips and filters are pills. That hard/soft collision is the
signature — don't soften the rectangles. `.card-poster` and `shadow-hard` add
the offset screen-printed shadow for blocks that need to shout.

### Motion

Movement communicates; nothing moves for decoration. Primitives live in
`src/components/motion/` (`Marquee`, `Headline`, `CountUp`) plus
`src/lib/useReveal.ts` (scroll reveal, with variants) and
`src/lib/flyToCart.ts` (the add-to-cart flight). Everything animates
`transform`/`opacity` only, ambient loops pause when off-screen or when the tab
is hidden, and `prefers-reduced-motion` switches all of it off.

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
NEXT_PUBLIC_CURRENCY,Currency symbol used for displaying prices (defaults to $).
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
