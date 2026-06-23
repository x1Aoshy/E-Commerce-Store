# Aosh Suplementos — Storefront

Tienda de suplementos sobria y limpia, construida con **Next.js (App Router)** y
**Tailwind CSS**. Los pedidos se gestionan por **WhatsApp** (enlaces `wa.me`) y el
**inventario se descuenta automáticamente** al confirmar cada orden. Los datos
(productos y pedidos) se guardan en **Supabase (Postgres)**.

## Características

- 🛍️ **Storefront** sobrio: hero, grilla de productos con filtros por categoría,
  ficha de producto (modal) y carrito deslizable.
- 💬 **Checkout por WhatsApp**: el carrito arma el pedido y abre WhatsApp con el
  resumen pre-cargado hacia el número del vendedor. Sin pasarela de pago.
- 📦 **Inventario en tiempo real**: cada pedido valida y descuenta stock. Si no
  hay unidades suficientes, el pedido se rechaza con el detalle.
- 🔐 **Panel de administración** (`/admin`): editar precios y stock, destacar
  productos, dar de alta productos y ver/confirmar órdenes.

## Puesta en marcha

```bash
cd storefront
npm install
cp .env.example .env.local   # y completá tus valores (incluida la base Supabase)
npm run dev                  # http://localhost:3000
```

El panel de administración está en `http://localhost:3000/admin`.

## Base de datos (Supabase)

1. Creá un proyecto gratis en [supabase.com](https://supabase.com).
2. Abrí **SQL Editor → New query**, pegá el contenido de
   [`supabase/schema.sql`](./supabase/schema.sql) y apretá **Run**. Eso crea las
   tablas `products` y `orders` y carga el catálogo de ejemplo.
3. En **Project Settings → API** copiá:
   - **Project URL** → `SUPABASE_URL`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY` (¡es secreta!)
4. Pegá esos valores en `.env.local` (local) y/o en las variables de entorno de
   Vercel (producción).

> La `service_role key` se usa **sólo del lado del servidor** (Server Components
> y Route Handlers) a través de `src/lib/supabase.js`. Nunca se expone al
> navegador. Las tablas tienen RLS activado, así que la clave pública no puede
> leer ni escribir la base directamente.

## Configuración (`.env.local`)

| Variable | Descripción |
|----------|-------------|
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | Número del vendedor en formato internacional, **sin** `+` ni espacios. Ej: `5491112345678`. |
| `NEXT_PUBLIC_STORE_NAME` | Nombre de la marca (header, títulos, mensajes). |
| `NEXT_PUBLIC_CURRENCY` | Símbolo de moneda para mostrar precios (`$` por defecto). |
| `ADMIN_PASSWORD` | Contraseña del panel `/admin`. |
| `SUPABASE_URL` | Project URL de Supabase. |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role key de Supabase (secreta, sólo servidor). |

## Deploy en Vercel

1. Importá el repo en [vercel.com](https://vercel.com).
2. En **Root Directory** elegí `storefront` (el proyecto vive en esa subcarpeta).
3. Cargá las **mismas variables** de la tabla de arriba en
   **Settings → Environment Variables**.
4. **Deploy**. Cada push al PR genera además un preview automático.

> Importante: el catálogo y los pedidos viven en Supabase (no en el disco),
> porque el sistema de archivos de Vercel es de sólo lectura. Por eso el panel
> `/admin` funciona también en producción.

## Migrar a otra base de datos

La interfaz de acceso a datos está aislada en `src/lib/db.js` (`getProducts`,
`createOrder`, etc.). Para usar Prisma / otro Postgres / MySQL sólo hay que
reemplazar la implementación de esas funciones, sin tocar el resto de la app.

## Estructura

```
src/
├── app/
│   ├── page.js              # Storefront
│   ├── admin/page.js        # Login + panel admin
│   └── api/
│       ├── products/        # GET catálogo · POST alta · PATCH editar
│       ├── orders/          # POST crear pedido (descuenta stock) · GET listar
│       └── admin/verify/    # Login por cookie del panel
├── components/              # Header, Hero, ProductGrid, CartDrawer, admin/…
├── context/CartContext.js   # Estado del carrito (localStorage)
└── lib/                     # db (Supabase), supabase (cliente), whatsapp, format, auth
supabase/
└── schema.sql               # Tablas + RLS + catálogo inicial (pegar en Supabase)
```

## Próximo paso: WhatsApp Cloud API (opcional)

Hoy los pedidos usan enlaces `wa.me` (cero configuración). Para enviar
confirmaciones automáticas desde el servidor se puede sumar la **WhatsApp Cloud
API** de Meta: la lógica de creación de la orden ya está centralizada en
`POST /api/orders`, así que sólo habría que llamar a la API de Meta ahí mismo.
