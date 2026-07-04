// Capa de acceso a datos sobre Supabase (Postgres).
//
// Toda la persistencia de productos y pedidos vive en Supabase. La conexión se
// hace SÓLO del lado del servidor con la service role key (ver ./supabase.js),
// por lo que estas funciones deben importarse únicamente desde Server
// Components o Route Handlers, nunca desde código cliente.
//
// REGLA DE STOCK: el inventario se descuenta SÓLO cuando una orden está en
// estado 'confirmada' (Completada). El checkout del cliente crea la orden como
// 'pendiente' SIN tocar stock; el stock se descuenta recién cuando el admin la
// marca como completada (y se repone si se la saca de ese estado o se elimina).
//
// El esquema SQL (y la migración de columnas) está en supabase/schema.sql.

import { getSupabase } from "./supabase";
import type {
  Product,
  Order,
  OrderItem,
  Review,
  Settings,
  Subscriber,
} from "./types";

const PRODUCT_COLUMNS =
  "id, slug, name, category, price, stock, featured, short, description, compareAt:compare_at, images, stats";
// "*" A PROPÓSITO: si pedimos columnas por nombre y alguna migración nueva no
// se corrió todavía (p. ej. `shipped`), TODA la consulta falla y se rompen los
// pedidos. Con "*" traemos lo que exista y mapOrder() completa lo que falte.
const ORDER_COLUMNS = "*";

const ORDER_STATUSES = ["pendiente", "confirmada", "cancelada"];
const PAYMENT_METHODS = ["efectivo", "transferencia"];

// Normaliza el arreglo de medios: sólo strings no vacíos, recortados, con tope
// de cantidad y de longitud por URL.
function sanitizeMedia(list) {
  if (!Array.isArray(list)) return [];
  return list
    .filter((u) => typeof u === "string")
    .map((u) => u.trim())
    .filter(Boolean)
    .slice(0, 12)
    .map((u) => u.slice(0, 1000));
}

// Normaliza las métricas del gráfico: arreglo de { label, value(0-100) }, hasta
// 6, con etiqueta no vacía. Devuelve [] si no hay nada válido.
function sanitizeStats(list) {
  if (!Array.isArray(list)) return [];
  return list
    .filter((s) => s && typeof s === "object")
    .map((s) => ({
      label: String(s.label || "").trim().slice(0, 30),
      value: Math.max(0, Math.min(100, Math.round(Number(s.value) || 0))),
    }))
    .filter((s) => s.label)
    .slice(0, 6);
}

function slugify(text) {
  return String(text || "producto")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function mapOrder(row) {
  if (!row) return null;
  return {
    id: row.id,
    code: row.code,
    items: row.items || [],
    total: row.total,
    status: row.status,
    customer: row.customer || { name: "", note: "" },
    createdAt: row.created_at,
    paymentMethod: row.payment_method || null,
    extra: Number(row.extra) || 0,
    extraLabel: row.extra_label || "",
    seller: row.seller || "",
    token: row.token || "",
    paid: !!row.paid,
    // Despachada / en camino: puramente informativa, no toca stock.
    shipped: !!row.shipped,
    // Cupón aplicado y monto descontado (total a cobrar = total - discount + extra).
    coupon: row.coupon || "",
    discount: Number(row.discount) || 0,
  };
}

// REGLA DE STOCK: el inventario se descuenta sólo cuando una orden está
// COMPLETADA (confirmada) **y** PAGADA. Mientras falte cualquiera de las dos, el
// stock no se toca (y se repone si deja de cumplirse).
function shouldHoldStock(status, paid) {
  return status === "confirmada" && !!paid;
}

// Token público largo e IMPOSIBLE de adivinar para el recibo por QR (la
// posesión del QR es la única llave; no requiere login).
function makeToken() {
  const rnd = () => Math.random().toString(36).slice(2);
  return (Date.now().toString(36) + rnd() + rnd()).slice(0, 32);
}

// Limpia el nombre del vendedor: recorta espacios y limita la longitud.
function cleanSeller(value) {
  return String(value || "").trim().slice(0, 60);
}

/* ------------------------------- Productos ------------------------------- */

export async function getProducts(): Promise<Product[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_COLUMNS)
    // Más nuevos PRIMERO: así un producto recién creado aparece arriba en la
    // tienda y en el inventario (antes salían al final y parecía que no se
    // agregaban).
    .order("created_at", { ascending: false })
    .order("id", { ascending: false });
  if (error) throw new Error(`No se pudieron leer los productos: ${error.message}`);
  const products = data || [];
  // Adjunta a cada producto su reseña destacada + promedio (para la tarjeta).
  const map = await reviewsByProductMap(products.map((p) => p.id));
  return products.map((p) => attachReviewSummary(p, map.get(p.id) || []));
}

// Mapa productId -> reseñas APROBADAS (más nuevas primero). Resiliente: si la
// tabla `reviews` no existe todavía, devuelve un mapa vacío (no rompe la tienda).
async function reviewsByProductMap(productIds) {
  const ids = (productIds || []).filter(Boolean);
  if (ids.length === 0) return new Map();
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("reviews")
      .select(REVIEW_COLUMNS)
      .eq("approved", true)
      .in("product_id", ids)
      .order("created_at", { ascending: false });
    if (error) return new Map();
    const map = new Map();
    for (const row of data || []) {
      const r = mapReview(row);
      if (!r.productId) continue;
      if (!map.has(r.productId)) map.set(r.productId, []);
      map.get(r.productId).push(r);
    }
    return map;
  } catch {
    return new Map();
  }
}

// Resumen de reseñas para la tarjeta: cantidad, promedio y la reseña destacada
// (la mejor puntuada; entre iguales, la más reciente).
function attachReviewSummary(product, list) {
  const count = list.length;
  const avg = count ? list.reduce((s, r) => s + r.rating, 0) / count : 0;
  let featured = null;
  for (const r of list) {
    if (!featured || r.rating > featured.rating) featured = r;
  }
  return {
    ...product,
    reviewCount: count,
    ratingAvg: Math.round(avg * 10) / 10,
    featuredReview: featured
      ? { name: featured.name, rating: featured.rating, text: featured.text }
      : null,
  };
}

export async function getProductById(id): Promise<Product | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_COLUMNS)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`No se pudo leer el producto: ${error.message}`);
  return data || null;
}

export async function getProductBySlug(slug): Promise<Product | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_COLUMNS)
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw new Error(`No se pudo leer el producto: ${error.message}`);
  if (!data) return null;
  // Adjunta la lista completa de reseñas aprobadas (para la ficha del producto).
  const map = await reviewsByProductMap([data.id]);
  const list = map.get(data.id) || [];
  return { ...attachReviewSummary(data, list), reviews: list };
}

export async function createProduct(data) {
  const supabase = getSupabase();
  const id = "p" + (Date.now().toString(36) + Math.random().toString(36).slice(2, 5));
  const slug = (data.slug ? slugify(data.slug) : slugify(data.name)) + "-" + id.slice(-3);
  const product = {
    id,
    slug,
    name: (data.name || "").trim(),
    category: data.category || "General",
    price: Number(data.price) || 0,
    stock: Number(data.stock) || 0,
    featured: Boolean(data.featured),
    short: data.short || "",
    description: data.description || "",
    compare_at: Math.max(0, Number(data.compareAt) || 0),
    images: sanitizeMedia(data.images),
    stats: sanitizeStats(data.stats),
  };
  const { data: inserted, error } = await supabase
    .from("products")
    .insert(product)
    .select(PRODUCT_COLUMNS)
    .single();
  if (error) throw new Error(`No se pudo crear el producto: ${error.message}`);
  return inserted;
}

export async function updateProduct(id, patch) {
  const supabase = getSupabase();
  const next: any = {};
  if (patch.name !== undefined) next.name = patch.name;
  if (patch.category !== undefined) next.category = patch.category;
  if (patch.price !== undefined) next.price = Number(patch.price);
  if (patch.stock !== undefined) next.stock = Math.max(0, Number(patch.stock));
  if (patch.featured !== undefined) next.featured = Boolean(patch.featured);
  if (patch.short !== undefined) next.short = patch.short;
  if (patch.description !== undefined) next.description = patch.description;
  if (patch.compareAt !== undefined) next.compare_at = Math.max(0, Number(patch.compareAt) || 0);
  if (patch.images !== undefined) next.images = sanitizeMedia(patch.images);
  if (patch.stats !== undefined) next.stats = sanitizeStats(patch.stats);

  if (Object.keys(next).length === 0) return getProductById(id);

  const { data, error } = await supabase
    .from("products")
    .update(next)
    .eq("id", id)
    .select(PRODUCT_COLUMNS)
    .maybeSingle();
  if (error) throw new Error(`No se pudo actualizar el producto: ${error.message}`);
  return data || null;
}

export async function deleteProduct(id) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("products")
    .delete()
    .eq("id", id)
    .select("id");
  if (error) throw new Error(`No se pudo eliminar el producto: ${error.message}`);
  return Array.isArray(data) && data.length > 0;
}

/* ------------------------------ Stock helpers ---------------------------- */

// Valida disponibilidad y DESCUENTA stock (todo-o-nada). Devuelve
// { ok:true } si descontó, o { ok:false, conflicts } si faltaba stock (sin
// tocar nada en ese caso). Se usa al pasar una orden a 'confirmada'.
async function reserveStock(items) {
  const supabase = getSupabase();
  const list = (Array.isArray(items) ? items : []).filter(
    (it) => it.id && (Number(it.quantity) || 0) > 0
  );
  if (list.length === 0) return { ok: true };

  const ids = list.map((it) => it.id);
  const { data: rows, error } = await supabase
    .from("products")
    .select("id, name, stock")
    .in("id", ids);
  if (error) throw new Error(`No se pudo validar el stock: ${error.message}`);
  const byId: Map<any, any> = new Map((rows || []).map((p: any) => [p.id, p]));

  const conflicts: any[] = [];
  for (const it of list) {
    const p = byId.get(it.id);
    const qty = Number(it.quantity) || 0;
    if (!p) {
      conflicts.push({ id: it.id, reason: "Producto no encontrado." });
    } else if (p.stock < qty) {
      conflicts.push({
        id: p.id,
        name: p.name,
        reason: `Sólo quedan ${p.stock} unidades.`,
        available: p.stock,
      });
    }
  }
  if (conflicts.length > 0) return { ok: false, conflicts };

  for (const it of list) {
    const p = byId.get(it.id);
    const qty = Number(it.quantity) || 0;
    const { error: ue } = await supabase
      .from("products")
      .update({ stock: Math.max(0, p.stock - qty) })
      .eq("id", it.id)
      .gte("stock", qty);
    if (ue) throw new Error(`No se pudo actualizar el stock: ${ue.message}`);
  }
  return { ok: true };
}

// Repone stock (al sacar una orden de 'confirmada' o eliminarla). Si un
// producto ya no existe, se ignora. Sumar nunca deja stock negativo.
async function restoreStock(items) {
  const supabase = getSupabase();
  const list = Array.isArray(items) ? items : [];
  for (const item of list) {
    const qty = Math.max(0, Number(item.quantity) || 0);
    if (!item.id || qty === 0) continue;
    const { data: product, error: readErr } = await supabase
      .from("products")
      .select("stock")
      .eq("id", item.id)
      .maybeSingle();
    if (readErr) throw new Error(`No se pudo leer el stock: ${readErr.message}`);
    if (!product) continue;
    const { error: updErr } = await supabase
      .from("products")
      .update({ stock: product.stock + qty })
      .eq("id", item.id);
    if (updErr) throw new Error(`No se pudo reponer el stock: ${updErr.message}`);
  }
}

/* -------------------------------- Órdenes -------------------------------- */

export async function getOrders(): Promise<Order[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("orders")
    .select(ORDER_COLUMNS)
    .order("created_at", { ascending: false });
  if (error) throw new Error(`No se pudieron leer las órdenes: ${error.message}`);
  return (data || []).map(mapOrder);
}

// Crea una orden. `reserve` indica si debe DESCONTAR stock (sólo cuando nace
// ya 'confirmada', ej. una venta manual ya concretada). El checkout público
// nace 'pendiente' con reserve:false (no toca stock). Toma un snapshot de
// precio/nombre de cada producto. Devuelve { order } o { error, conflicts }.
async function buildOrder({
  items,
  customer,
  status,
  code,
  extra,
  extraLabel,
  paymentMethod,
  seller,
  reserve,
  paid,
  couponCode,
}: any) {
  const supabase = getSupabase();

  if (!Array.isArray(items) || items.length === 0) {
    return { error: "El carrito está vacío." };
  }

  // Cupón (opcional): se valida SIEMPRE en el servidor (el % que vio el
  // cliente en el carrito es solo un preview). Si el código no es válido, el
  // pedido NO se crea: mejor avisar que cobrar de más en silencio.
  let coupon: any = null;
  if (couponCode) {
    const res = await findValidCoupon(couponCode);
    if (!res.coupon) {
      return { error: res.error || "El cupón no es válido." };
    }
    coupon = res.coupon;
  }

  const ids = items.map((it) => it.id);
  const { data: rows, error: readErr } = await supabase
    .from("products")
    .select("id, name, price, stock")
    .in("id", ids);
  if (readErr) throw new Error(`No se pudo leer el catálogo: ${readErr.message}`);
  const byId: Map<any, any> = new Map((rows || []).map((p: any) => [p.id, p]));

  const lineItems: any[] = [];
  const conflicts: any[] = [];

  for (const item of items) {
    const product = byId.get(item.id);
    const qty = Math.max(1, Number(item.quantity) || 0);
    if (!product) {
      conflicts.push({ id: item.id, reason: "Producto no encontrado." });
      continue;
    }
    if (reserve && product.stock < qty) {
      conflicts.push({
        id: product.id,
        name: product.name,
        reason: `Sólo quedan ${product.stock} unidades.`,
        available: product.stock,
      });
      continue;
    }
    lineItems.push({
      id: product.id,
      name: product.name,
      price: product.price,
      quantity: qty,
      subtotal: product.price * qty,
    });
  }

  if (conflicts.length > 0) {
    return {
      error: reserve
        ? "Stock insuficiente para algunos productos."
        : "Algún producto ya no está disponible.",
      conflicts,
    };
  }

  if (reserve) {
    for (const li of lineItems) {
      const product = byId.get(li.id);
      const { error: updErr } = await supabase
        .from("products")
        .update({ stock: Math.max(0, product.stock - li.quantity) })
        .eq("id", li.id)
        .gte("stock", li.quantity);
      if (updErr) throw new Error(`No se pudo actualizar el stock: ${updErr.message}`);
    }
  }

  const total = lineItems.reduce((sum, li) => sum + li.subtotal, 0);
  // Descuento del cupón sobre el subtotal de productos (no sobre el extra).
  const discount = coupon
    ? Math.min(total, Math.round((total * coupon.percent) / 100))
    : 0;

  const order: any = {
    id: "o" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
    code: code || "TS-" + Math.floor(1000 + Math.random() * 9000),
    items: lineItems,
    total,
    status: ORDER_STATUSES.includes(status) ? status : "pendiente",
    customer: {
      name: (customer && customer.name) || "",
      note: (customer && customer.note) || "",
      // Teléfono opcional para coordinar la entrega (con tope de longitud).
      phone: String((customer && customer.phone) || "").trim().slice(0, 30),
    },
    extra: Math.max(0, Number(extra) || 0),
    extra_label: extraLabel || "",
    payment_method: PAYMENT_METHODS.includes(paymentMethod) ? paymentMethod : null,
    seller: cleanSeller(seller),
    token: makeToken(),
    paid: !!paid,
  };
  // Las columnas de cupón se incluyen SÓLO si hay cupón: así un pedido normal
  // sigue funcionando aunque la migración de cupones no se haya corrido.
  if (coupon) {
    order.coupon = coupon.code;
    order.discount = discount;
  }

  const { data: inserted, error: insErr } = await supabase
    .from("orders")
    .insert(order)
    .select(ORDER_COLUMNS)
    .single();
  if (insErr) throw new Error(`No se pudo guardar la orden: ${insErr.message}`);

  // Cuenta el uso del cupón (después del insert exitoso; si falla, no bloquea).
  if (coupon) {
    try {
      await supabase
        .from("coupons")
        .update({ uses: (Number(coupon.uses) || 0) + 1 })
        .eq("id", coupon.id);
    } catch {
      /* el pedido ya está creado; el conteo es informativo */
    }
  }

  return { order: mapOrder(inserted) };
}

// Checkout público: crea la orden como 'pendiente' SIN reservar stock.
export async function createOrder({ items, customer, couponCode }: any) {
  return buildOrder({ items, customer, couponCode, status: "pendiente", reserve: false });
}

// Busca una orden por su token público (para el recibo por QR). RESILIENTE: si
// la columna no existe (migración sin correr) o no se encuentra, devuelve null.
export async function getOrderByToken(token): Promise<Order | null> {
  const clean = String(token || "").replace(/[^a-z0-9]/gi, "").slice(0, 64);
  if (!clean) return null;
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("orders")
      .select(ORDER_COLUMNS)
      .eq("token", clean)
      .maybeSingle();
    if (error) return null;
    return data ? mapOrder(data) : null;
  } catch {
    return null;
  }
}

// Alta manual desde el admin. Si nace 'confirmada' (default) DESCUENTA stock
// (es una venta ya concretada); si nace 'pendiente', no toca stock.
export async function createManualOrder({
  items,
  customer,
  status,
  paymentMethod,
  extra,
  extraLabel,
  seller,
}: any) {
  const wanted = status === "pendiente" ? "pendiente" : "confirmada";
  // Una venta manual COMPLETADA es una venta ya concretada y cobrada: nace
  // pagada y descuenta stock. Si nace pendiente, no toca stock ni se marca paga.
  const paid = wanted === "confirmada";
  const code = "TS-M" + Math.floor(1000 + Math.random() * 9000);
  return buildOrder({
    items,
    customer,
    status: wanted,
    code,
    extra,
    extraLabel,
    paymentMethod,
    seller,
    paid,
    reserve: shouldHoldStock(wanted, paid),
  });
}

// Aplica cambios de estado y/o de "pagada" ajustando el stock según la regla
// "el stock se descuenta sólo cuando está COMPLETADA y PAGADA":
//   - cuando la orden EMPIEZA a cumplir ambas (completada+pagada): descuenta
//     stock (valida disponibilidad; si falta, NO aplica el cambio y devuelve
//     error con los conflictos).
//   - cuando DEJA de cumplir ambas: repone stock.
// Devuelve { order } | { error, conflicts } | null (no existe).
async function applyOrderState(id, { status, paid }: any = {}) {
  const supabase = getSupabase();

  const { data: current, error: readErr } = await supabase
    .from("orders")
    .select(ORDER_COLUMNS)
    .eq("id", id)
    .maybeSingle();
  if (readErr) throw new Error(`No se pudo leer la orden: ${readErr.message}`);
  if (!current) return null;

  const newStatus = status !== undefined ? status : current.status;
  const newPaid = paid !== undefined ? !!paid : !!current.paid;
  const wasHolding = shouldHoldStock(current.status, current.paid);
  const willHold = shouldHoldStock(newStatus, newPaid);

  if (willHold && !wasHolding) {
    const r = await reserveStock(current.items);
    if (!r.ok) {
      return {
        error: "No hay stock suficiente para descontar este pedido.",
        conflicts: r.conflicts,
      };
    }
  } else if (!willHold && wasHolding) {
    await restoreStock(current.items);
  }

  const fields: any = {};
  if (status !== undefined) fields.status = status;
  if (paid !== undefined) fields.paid = !!paid;
  if (Object.keys(fields).length === 0) return { order: mapOrder(current) };

  const { data, error } = await supabase
    .from("orders")
    .update(fields)
    .eq("id", id)
    .select(ORDER_COLUMNS)
    .maybeSingle();
  if (error) throw new Error(`No se pudo actualizar la orden: ${error.message}`);
  return { order: mapOrder(data) };
}

// Compat: cambiar sólo el estado de una orden.
export async function setOrderStatus(id, status) {
  return applyOrderState(id, { status });
}

// Actualiza una orden: estado (ajusta stock) y/o método de pago / cargo extra.
// Devuelve { order } | { error, conflicts } | null (no existe).
export async function updateOrder(id, patch) {
  const supabase = getSupabase();

  // Estado y/o "pagada" se procesan juntos para ajustar el stock una sola vez.
  if (patch.status !== undefined || patch.paid !== undefined) {
    const res = await applyOrderState(id, {
      status: patch.status,
      paid: patch.paid,
    });
    if (res === null) return null;
    if (res.error) return res; // sin stock para descontar
  }

  const fields: any = {};
  if (patch.paymentMethod !== undefined) {
    fields.payment_method = PAYMENT_METHODS.includes(patch.paymentMethod)
      ? patch.paymentMethod
      : null;
  }
  if (patch.extra !== undefined) fields.extra = Math.max(0, Number(patch.extra) || 0);
  if (patch.extraLabel !== undefined) fields.extra_label = patch.extraLabel || "";
  if (patch.seller !== undefined) fields.seller = cleanSeller(patch.seller);
  // "En camino" es informativo: NO pasa por applyOrderState porque no afecta
  // el stock (la regla de stock depende sólo de completada + pagada).
  if (patch.shipped !== undefined) fields.shipped = !!patch.shipped;

  if (Object.keys(fields).length > 0) {
    const { data, error } = await supabase
      .from("orders")
      .update(fields)
      .eq("id", id)
      .select(ORDER_COLUMNS)
      .maybeSingle();
    if (error) throw new Error(`No se pudo actualizar la orden: ${error.message}`);
    if (!data) return null;
    return { order: mapOrder(data) };
  }

  const { data } = await supabase
    .from("orders")
    .select(ORDER_COLUMNS)
    .eq("id", id)
    .maybeSingle();
  if (!data) return null;
  return { order: mapOrder(data) };
}

// Elimina una orden del sistema. Si tenía stock descontado (completada y
// pagada), lo repone. El resto no tiene stock reservado.
export async function deleteOrder(id) {
  const supabase = getSupabase();
  const { data: current, error: readErr } = await supabase
    .from("orders")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (readErr) throw new Error(`No se pudo leer la orden: ${readErr.message}`);
  if (!current) return false;

  if (shouldHoldStock(current.status, current.paid)) {
    await restoreStock(current.items);
  }

  const { error: delErr } = await supabase.from("orders").delete().eq("id", id);
  if (delErr) throw new Error(`No se pudo eliminar la orden: ${delErr.message}`);
  return true;
}

/* ------------------------------- Ajustes --------------------------------- */
// Branding de la tienda: nombre, logo e ícono de login. Tabla de una sola fila
// (id = 1). Ver supabase/schema.sql.

// Valores por defecto cuando la tabla todavía no existe (migración sin correr)
// o ante cualquier error. NUNCA lanza: la tienda y el admin siguen andando con
// el logo/nombre por defecto.
function defaultSettings() {
  return {
    storeName: process.env.NEXT_PUBLIC_STORE_NAME || "Titan Supplements",
    logoUrl: "",
    loginIconUrl: "",
    whatsappNumber: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "",
    whatsappMessage: "",
    heroImages: [],
    heroShowcase: [],
    paymentInfo: "",
    instagramUrl: "",
    facebookUrl: "",
  };
}

// Carrusel del hero curado: lista de { id de producto, url de foto elegida }.
// Sanea forma, deduplica por producto y limita a 8 entradas.
function sanitizeShowcase(list: any) {
  if (!Array.isArray(list)) return [];
  const seen = new Set();
  const out: any[] = [];
  for (const it of list) {
    const id = String(it?.id || "").trim().slice(0, 80);
    const image = String(it?.image || "").trim().slice(0, 1000);
    if (!id || seen.has(id)) continue;
    seen.add(id);
    out.push({ id, image });
    if (out.length >= 8) break;
  }
  return out;
}

function mapSettings(row) {
  if (!row) return defaultSettings();
  const def = defaultSettings();
  return {
    // Si hay fila, respetamos el nombre TAL CUAL (incluso vacío: el dueño puede
    // dejarlo en blanco si su logo ya trae el nombre). El default sólo aplica
    // cuando no hay fila (migración sin correr).
    storeName: row.store_name ?? def.storeName,
    logoUrl: row.logo_url || "",
    loginIconUrl: row.login_icon_url || "",
    whatsappNumber: row.whatsapp_number || def.whatsappNumber,
    whatsappMessage: row.whatsapp_message || "",
    heroImages: Array.isArray(row.hero_images) ? row.hero_images : [],
    heroShowcase: sanitizeShowcase(row.hero_showcase),
    // Datos de pago (banco/cuenta/transferencia móvil) que se le muestran al
    // cliente al confirmar el pedido y en el recibo.
    paymentInfo: row.payment_info || "",
    instagramUrl: row.instagram_url || "",
    facebookUrl: row.facebook_url || "",
  };
}

// Lee la única fila de ajustes. RESILIENTE: si la tabla no existe o hay
// cualquier error, devuelve los valores por defecto sin lanzar.
export async function getSettings(): Promise<Settings> {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("settings")
      .select("*")
      .eq("id", 1)
      .maybeSingle();
    if (error) return defaultSettings();
    return mapSettings(data);
  } catch {
    return defaultSettings();
  }
}

// Upsert de la fila id=1 con los campos provistos en `patch`. Recorta longitudes
// (nombre 60, URLs 1000) y siempre setea updated_at. Devuelve los ajustes
// mapeados a camelCase.
export async function updateSettings(patch: any = {}) {
  const supabase = getSupabase();
  const next: any = { id: 1, updated_at: new Date().toISOString() };
  if (patch.storeName !== undefined) {
    next.store_name = String(patch.storeName || "").trim().slice(0, 60);
  }
  if (patch.logoUrl !== undefined) {
    next.logo_url = String(patch.logoUrl || "").trim().slice(0, 1000);
  }
  if (patch.loginIconUrl !== undefined) {
    next.login_icon_url = String(patch.loginIconUrl || "").trim().slice(0, 1000);
  }
  if (patch.whatsappNumber !== undefined) {
    // Sólo dígitos (formato wa.me), tope razonable.
    next.whatsapp_number = String(patch.whatsappNumber || "").replace(/[^\d]/g, "").slice(0, 20);
  }
  if (patch.whatsappMessage !== undefined) {
    next.whatsapp_message = String(patch.whatsappMessage || "").trim().slice(0, 400);
  }
  if (patch.heroImages !== undefined) {
    // Fondo del hero: arreglo de URLs (reusa el saneador de medios).
    next.hero_images = sanitizeMedia(patch.heroImages);
  }
  if (patch.heroShowcase !== undefined) {
    // Carrusel curado: [{ id de producto, foto elegida }] en el orden a mostrar.
    next.hero_showcase = sanitizeShowcase(patch.heroShowcase);
  }
  if (patch.paymentInfo !== undefined) {
    // Datos de pago (texto libre multilínea: banco, cuenta, a nombre de quién).
    next.payment_info = String(patch.paymentInfo || "").trim().slice(0, 600);
  }
  if (patch.instagramUrl !== undefined) {
    next.instagram_url = String(patch.instagramUrl || "").trim().slice(0, 300);
  }
  if (patch.facebookUrl !== undefined) {
    next.facebook_url = String(patch.facebookUrl || "").trim().slice(0, 300);
  }

  // RESILIENCIA: si una columna nueva todavía no existe (migración sin correr),
  // NO rompemos todo el guardado — se descarta esa columna y se reintenta. El
  // campo descartado no persiste (el admin lo detecta comparando la respuesta).
  let { data, error } = await supabase
    .from("settings")
    .upsert(next, { onConflict: "id" })
    .select("*")
    .maybeSingle();
  for (let i = 0; i < 3 && error; i++) {
    const m = /column "?([a-z0-9_]+)"?/i.exec(error.message || "");
    const col = m && m[1];
    if (!col || !(col in next) || col === "id") break;
    delete next[col];
    ({ data, error } = await supabase
      .from("settings")
      .upsert(next, { onConflict: "id" })
      .select("*")
      .maybeSingle());
  }
  if (error) throw new Error(`No se pudieron guardar los ajustes: ${error.message}`);
  return mapSettings(data);
}

/* ----------------------------- Suscriptores ------------------------------ */
// Lista de contactos (WhatsApp/email) que el cliente deja para recibir ofertas
// y avisos de reposición. Ver tabla `subscribers` en supabase/schema.sql.

function mapSubscriber(row) {
  if (!row) return null;
  return {
    id: row.id,
    contact: row.contact,
    name: row.name || "",
    source: row.source || "web",
    createdAt: row.created_at,
  };
}

// Da de alta un contacto. Normaliza, evita duplicados (devuelve el existente)
// y nunca lanza por la restricción única (lo trata como "ya estaba").
// Devuelve { subscriber } o { error } con un mensaje claro.
export async function addSubscriber({ contact, name, source }: any = {}) {
  const clean = String(contact || "").trim().slice(0, 120);
  if (!clean) return { error: "Dejá un WhatsApp o email válido." };

  const supabase = getSupabase();
  const row = {
    id: "s" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
    contact: clean,
    name: String(name || "").trim().slice(0, 80),
    source: String(source || "web").trim().slice(0, 30) || "web",
  };

  const { data, error } = await supabase
    .from("subscribers")
    .insert(row)
    .select("id, contact, name, source, created_at")
    .single();

  if (error) {
    // 23505 = violación de índice único → el contacto ya estaba suscripto.
    if (error.code === "23505") return { subscriber: null, duplicate: true };
    throw new Error(`No se pudo guardar el contacto: ${error.message}`);
  }
  return { subscriber: mapSubscriber(data) };
}

export async function getSubscribers(): Promise<Subscriber[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("subscribers")
    .select("id, contact, name, source, created_at")
    .order("created_at", { ascending: false });
  if (error) throw new Error(`No se pudieron leer los contactos: ${error.message}`);
  return (data || []).map(mapSubscriber);
}

export async function deleteSubscriber(id) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("subscribers")
    .delete()
    .eq("id", id)
    .select("id");
  if (error) throw new Error(`No se pudo eliminar el contacto: ${error.message}`);
  return Array.isArray(data) && data.length > 0;
}

/* ------------------------------- Reseñas --------------------------------- */
// Prueba social: el cliente deja su reseña (queda pendiente de aprobación) y el
// admin la publica; el admin también puede cargar reseñas reales a mano.

const REVIEW_COLUMNS = "id, product_id, name, rating, text, approved, source, created_at";

function mapReview(row) {
  if (!row) return null;
  return {
    id: row.id,
    productId: row.product_id || null,
    name: row.name || "",
    rating: Math.max(1, Math.min(5, Number(row.rating) || 5)),
    text: row.text || "",
    approved: !!row.approved,
    source: row.source || "cliente",
    createdAt: row.created_at,
  };
}

// Crea una reseña. Desde la tienda nace SIN aprobar (source 'cliente'); desde el
// admin nace aprobada (source 'admin'). Devuelve { review } o { error }.
export async function addReview({ productId, name, rating, text, approved, source }: any = {}) {
  const cleanText = String(text || "").trim().slice(0, 600);
  const cleanName = String(name || "").trim().slice(0, 80);
  if (!cleanText) return { error: "Escribí tu reseña." };

  const supabase = getSupabase();
  const row = {
    id: "r" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
    product_id: productId ? String(productId).slice(0, 60) : null,
    name: cleanName,
    rating: Math.max(1, Math.min(5, Math.round(Number(rating) || 5))),
    text: cleanText,
    approved: !!approved,
    source: source === "admin" ? "admin" : "cliente",
  };

  const { data, error } = await supabase
    .from("reviews")
    .insert(row)
    .select(REVIEW_COLUMNS)
    .single();
  if (error) throw new Error(`No se pudo guardar la reseña: ${error.message}`);
  return { review: mapReview(data) };
}

// Reseñas aprobadas para mostrar en la tienda (más nuevas primero).
export async function getApprovedReviews(limit = 12): Promise<Review[]> {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("reviews")
      .select(REVIEW_COLUMNS)
      .eq("approved", true)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) return [];
    return (data || []).map(mapReview);
  } catch {
    return [];
  }
}

// Todas las reseñas (admin), para moderar.
export async function getAllReviews(): Promise<Review[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("reviews")
    .select(REVIEW_COLUMNS)
    .order("created_at", { ascending: false });
  if (error) throw new Error(`No se pudieron leer las reseñas: ${error.message}`);
  return (data || []).map(mapReview);
}

export async function setReviewApproved(id, approved) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("reviews")
    .update({ approved: !!approved })
    .eq("id", id)
    .select(REVIEW_COLUMNS)
    .maybeSingle();
  if (error) throw new Error(`No se pudo actualizar la reseña: ${error.message}`);
  return data ? mapReview(data) : null;
}

export async function deleteReview(id) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("reviews")
    .delete()
    .eq("id", id)
    .select("id");
  if (error) throw new Error(`No se pudo eliminar la reseña: ${error.message}`);
  return Array.isArray(data) && data.length > 0;
}

/* -------------------------------- Cupones -------------------------------- */
// Cupones de descuento por porcentaje. El admin los crea/pausa; el cliente los
// escribe en el checkout. La validez SIEMPRE se decide en el servidor.

function mapCoupon(row: any) {
  if (!row) return null;
  return {
    id: row.id,
    code: row.code || "",
    percent: Math.max(1, Math.min(90, Number(row.percent) || 0)),
    active: !!row.active,
    maxUses: row.max_uses === null || row.max_uses === undefined ? null : Number(row.max_uses),
    uses: Number(row.uses) || 0,
    createdAt: row.created_at,
  };
}

function cleanCouponCode(code: any) {
  // Mayúsculas, solo letras/números/guiones, tope de largo.
  return String(code || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, "")
    .slice(0, 24);
}

// Busca un cupón USABLE por código: activo y con usos disponibles. RESILIENTE:
// si la tabla no existe (migración sin correr) devuelve un error claro, nunca
// lanza. Devuelve { coupon } o { error }.
export async function findValidCoupon(code: any) {
  const clean = cleanCouponCode(code);
  if (!clean) return { coupon: null, error: "Escribí un código de cupón." };
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("coupons")
      .select("*")
      .ilike("code", clean)
      .maybeSingle();
    if (error) return { coupon: null, error: "Los cupones no están disponibles." };
    const c = mapCoupon(data);
    if (!c) return { coupon: null, error: "Ese cupón no existe." };
    if (!c.active) return { coupon: null, error: "Ese cupón ya no está activo." };
    if (c.maxUses !== null && c.uses >= c.maxUses) {
      return { coupon: null, error: "Ese cupón ya se agotó." };
    }
    return { coupon: c };
  } catch {
    return { coupon: null, error: "Los cupones no están disponibles." };
  }
}

export async function getCoupons() {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("coupons")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(`No se pudieron leer los cupones: ${error.message}`);
  return (data || []).map(mapCoupon);
}

// Crea un cupón. Devuelve { coupon } o { error } (código repetido/invalido).
export async function createCoupon({ code, percent, maxUses }: any) {
  const clean = cleanCouponCode(code);
  if (!clean) return { error: "El código no puede estar vacío." };
  const pct = Math.round(Number(percent) || 0);
  if (pct < 1 || pct > 90) {
    return { error: "El porcentaje debe estar entre 1 y 90." };
  }
  const supabase = getSupabase();
  const row = {
    id: "c" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
    code: clean,
    percent: pct,
    active: true,
    max_uses:
      maxUses === null || maxUses === undefined || maxUses === ""
        ? null
        : Math.max(1, Number(maxUses) || 1),
  };
  const { data, error } = await supabase
    .from("coupons")
    .insert(row)
    .select("*")
    .single();
  if (error) {
    if ((error as any).code === "23505") {
      return { error: "Ya existe un cupón con ese código." };
    }
    throw new Error(`No se pudo crear el cupón: ${error.message}`);
  }
  return { coupon: mapCoupon(data) };
}

// Activa/pausa un cupón.
export async function setCouponActive(id: any, active: any) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("coupons")
    .update({ active: !!active })
    .eq("id", id)
    .select("*")
    .maybeSingle();
  if (error) throw new Error(`No se pudo actualizar el cupón: ${error.message}`);
  return data ? mapCoupon(data) : null;
}

export async function deleteCoupon(id: any) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("coupons")
    .delete()
    .eq("id", id)
    .select("id");
  if (error) throw new Error(`No se pudo eliminar el cupón: ${error.message}`);
  return Array.isArray(data) && data.length > 0;
}
