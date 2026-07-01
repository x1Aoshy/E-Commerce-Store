// Tipos compartidos de la tienda (Titan Supplements).
//
// Inferidos del código de acceso a datos (src/lib/db.ts) y del esquema SQL
// (supabase/schema.sql). Pragmáticos: donde la forma exacta de una fila de
// Supabase es difícil o riesgosa de tipar, se usa `any`/campos opcionales en
// lugar de bloquear el build. Una compilación verde importa más que la
// cobertura total de tipos.

/* ------------------------------- Productos ------------------------------- */

// Una métrica del gráfico del producto ([{ label, value(0-100) }]).
export interface ProductStat {
  label: string;
  value: number;
}

// Reseña destacada que se adjunta a la tarjeta del producto.
export interface FeaturedReview {
  name: string;
  rating: number;
  text: string;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  featured: boolean;
  short: string;
  description: string;
  // Mapeado desde la columna `compare_at` (alias en la query de Supabase).
  compareAt?: number;
  images?: string[];
  stats?: ProductStat[];
  // Compatibilidad con el viejo campo `image` (string único). Ver lib/images.ts.
  image?: string;
  // Resumen de reseñas que adjunta attachReviewSummary() (db.ts).
  reviewCount?: number;
  ratingAvg?: number;
  featuredReview?: FeaturedReview | null;
  // Lista completa de reseñas aprobadas (sólo en la ficha del producto).
  reviews?: Review[];
}

/* ------------------------------- Reseñas --------------------------------- */

export interface Review {
  id: string;
  productId: string | null;
  name: string;
  rating: number;
  text: string;
  approved: boolean;
  source: string; // "cliente" | "admin"
  createdAt: string;
}

/* -------------------------------- Órdenes -------------------------------- */

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
}

export interface OrderCustomer {
  name: string;
  note: string;
  /** WhatsApp/teléfono opcional del cliente (para coordinar la entrega). */
  phone?: string;
}

export type OrderStatus = "pendiente" | "confirmada" | "cancelada";
export type PaymentMethod = "efectivo" | "transferencia";

export interface Order {
  id: string;
  code: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus | string;
  customer: OrderCustomer;
  createdAt: string;
  paymentMethod: PaymentMethod | string | null;
  extra: number;
  extraLabel: string;
  seller: string;
  token: string;
  paid: boolean;
  /** Pedido despachado / en camino. Informativo: NO afecta el stock. */
  shipped: boolean;
}

// Producto en el carrito (CartContext). Es un subconjunto de Product + cantidad.
export interface CartItem {
  id: string;
  name: string;
  price: number;
  stock?: number;
  category?: string;
  quantity: number;
}

/* ------------------------------- Ajustes --------------------------------- */

export interface Settings {
  storeName: string;
  logoUrl: string;
  loginIconUrl: string;
  whatsappNumber: string;
  whatsappMessage: string;
  heroImages: string[];
  /** Datos de pago (banco/cuenta/transferencia) mostrados al cliente. */
  paymentInfo: string;
}

/* ----------------------------- Suscriptores ------------------------------ */

export interface Subscriber {
  id: string;
  contact: string;
  name: string;
  source: string;
  createdAt: string;
}
