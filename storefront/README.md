# Aosh Suplementos — Storefront

Tienda de suplementos sobria y limpia, construida con **Next.js (App Router)** y
**Tailwind CSS**. Los pedidos se gestionan por **WhatsApp** (enlaces `wa.me`) y el
**inventario se descuenta automáticamente** al confirmar cada orden.

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
cp .env.example .env.local   # y completá tus valores
npm run dev                  # http://localhost:3000
```

El panel de administración está en `http://localhost:3000/admin`.

## Configuración (`.env.local`)

| Variable | Descripción |
|----------|-------------|
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | Número del vendedor en formato internacional, **sin** `+` ni espacios. Ej: `5491112345678`. |
| `NEXT_PUBLIC_STORE_NAME` | Nombre de la marca (header, títulos, mensajes). |
| `NEXT_PUBLIC_CURRENCY` | Símbolo de moneda para mostrar precios (`$` por defecto). |
| `ADMIN_PASSWORD` | Contraseña del panel `/admin`. |

## Datos

Para que el preview corra sin una base de datos externa, los datos se guardan en
un archivo JSON (`data/store.json`) que se genera automáticamente a partir de la
semilla en `src/lib/seed.js` la primera vez que se ejecuta.

- **Editar el catálogo inicial:** modificá `src/lib/seed.js` y borrá
  `data/store.json` para regenerarlo, o editá los productos desde `/admin`.
- **Migrar a una base de datos real:** la interfaz de acceso a datos está aislada
  en `src/lib/db.js`. Sólo hay que reemplazar la implementación de esas funciones
  (`getProducts`, `createOrder`, etc.) por Prisma / Postgres / MySQL, etc.

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
└── lib/                     # db (store JSON), whatsapp, format, auth, seed
```

## Próximo paso: WhatsApp Cloud API (opcional)

Hoy los pedidos usan enlaces `wa.me` (cero configuración). Para enviar
confirmaciones automáticas desde el servidor se puede sumar la **WhatsApp Cloud
API** de Meta: la lógica de creación de la orden ya está centralizada en
`POST /api/orders`, así que sólo habría que llamar a la API de Meta ahí mismo.
