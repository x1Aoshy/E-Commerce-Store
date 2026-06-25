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

const PRODUCT_COLUMNS =
  "id, slug, name, category, price, stock, featured, short, description, compareAt:compare_at, images";
const ORDER_COLUMNS =
  "id, code, items, total, status, customer, created_at, payment_method, extra, extra_label, seller";

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
  };
}

// Limpia el nombre del vendedor: recorta espacios y limita la longitud.
function cleanSeller(value) {
  return String(value || "").trim().slice(0, 60);
}

/* ------------------------------- Productos ------------------------------- */

export async function getProducts() {
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
  return data || [];
}

export async function getProductById(id) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_COLUMNS)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`No se pudo leer el producto: ${error.message}`);
  return data || null;
}

export async function getProductBySlug(slug) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_COLUMNS)
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw new Error(`No se pudo leer el producto: ${error.message}`);
  return data || null;
}

export async function createProduct(data) {
  const supabase = getSupabase();
  const id = "p" + (Date.now().toString(36) + Math.random().toString(36).slice(2, 5));
  const slug = (data.slug ? slugify(data.slug) : slugify(data.name)) + "-" + id.slice(-3);
  const product = {
    id,
    slug,
    name: data.name || "Producto sin nombre",
    category: data.category || "General",
    price: Number(data.price) || 0,
    stock: Number(data.stock) || 0,
    featured: Boolean(data.featured),
    short: data.short || "",
    description: data.description || "",
    compare_at: Math.max(0, Number(data.compareAt) || 0),
    images: sanitizeMedia(data.images),
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
  const next = {};
  if (patch.name !== undefined) next.name = patch.name;
  if (patch.category !== undefined) next.category = patch.category;
  if (patch.price !== undefined) next.price = Number(patch.price);
  if (patch.stock !== undefined) next.stock = Math.max(0, Number(patch.stock));
  if (patch.featured !== undefined) next.featured = Boolean(patch.featured);
  if (patch.short !== undefined) next.short = patch.short;
  if (patch.description !== undefined) next.description = patch.description;
  if (patch.compareAt !== undefined) next.compare_at = Math.max(0, Number(patch.compareAt) || 0);
  if (patch.images !== undefined) next.images = sanitizeMedia(patch.images);

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
  const byId = new Map((rows || []).map((p) => [p.id, p]));

  const conflicts = [];
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

export async function getOrders() {
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
}) {
  const supabase = getSupabase();

  if (!Array.isArray(items) || items.length === 0) {
    return { error: "El carrito está vacío." };
  }

  const ids = items.map((it) => it.id);
  const { data: rows, error: readErr } = await supabase
    .from("products")
    .select("id, name, price, stock")
    .in("id", ids);
  if (readErr) throw new Error(`No se pudo leer el catálogo: ${readErr.message}`);
  const byId = new Map((rows || []).map((p) => [p.id, p]));

  const lineItems = [];
  const conflicts = [];

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
  const order = {
    id: "o" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
    code: code || "TS-" + Math.floor(1000 + Math.random() * 9000),
    items: lineItems,
    total,
    status: ORDER_STATUSES.includes(status) ? status : "pendiente",
    customer: {
      name: (customer && customer.name) || "",
      note: (customer && customer.note) || "",
    },
    extra: Math.max(0, Number(extra) || 0),
    extra_label: extraLabel || "",
    payment_method: PAYMENT_METHODS.includes(paymentMethod) ? paymentMethod : null,
    seller: cleanSeller(seller),
  };

  const { data: inserted, error: insErr } = await supabase
    .from("orders")
    .insert(order)
    .select(ORDER_COLUMNS)
    .single();
  if (insErr) throw new Error(`No se pudo guardar la orden: ${insErr.message}`);

  return { order: mapOrder(inserted) };
}

// Checkout público: crea la orden como 'pendiente' SIN reservar stock.
export async function createOrder({ items, customer }) {
  return buildOrder({ items, customer, status: "pendiente", reserve: false });
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
}) {
  const wanted = status === "pendiente" ? "pendiente" : "confirmada";
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
    reserve: wanted === "confirmada",
  });
}

// Cambia el estado de una orden ajustando stock según la regla "el stock se
// descuenta sólo en 'confirmada'":
//   - al ENTRAR a 'confirmada' (desde pendiente/cancelada): descuenta stock
//     (valida disponibilidad; si falta, NO cambia el estado y devuelve error).
//   - al SALIR de 'confirmada' (a pendiente/cancelada): repone stock.
//   - cualquier otra transición no toca stock.
// Devuelve { order } en éxito, { error, conflicts } si no hay stock para
// completar, o null si la orden no existe.
export async function setOrderStatus(id, status) {
  const supabase = getSupabase();

  const { data: current, error: readErr } = await supabase
    .from("orders")
    .select(ORDER_COLUMNS)
    .eq("id", id)
    .maybeSingle();
  if (readErr) throw new Error(`No se pudo leer la orden: ${readErr.message}`);
  if (!current) return null;

  const wasHolding = current.status === "confirmada";
  const willHold = status === "confirmada";

  if (willHold && !wasHolding) {
    const r = await reserveStock(current.items);
    if (!r.ok) {
      return {
        error: "No hay stock suficiente para completar el pedido.",
        conflicts: r.conflicts,
      };
    }
  } else if (!willHold && wasHolding) {
    await restoreStock(current.items);
  }

  const { data, error } = await supabase
    .from("orders")
    .update({ status })
    .eq("id", id)
    .select(ORDER_COLUMNS)
    .maybeSingle();
  if (error) throw new Error(`No se pudo actualizar la orden: ${error.message}`);
  return { order: mapOrder(data) };
}

// Actualiza una orden: estado (ajusta stock) y/o método de pago / cargo extra.
// Devuelve { order } | { error, conflicts } | null (no existe).
export async function updateOrder(id, patch) {
  const supabase = getSupabase();

  if (patch.status !== undefined) {
    const res = await setOrderStatus(id, patch.status);
    if (res === null) return null;
    if (res.error) return res; // sin stock para completar
  }

  const fields = {};
  if (patch.paymentMethod !== undefined) {
    fields.payment_method = PAYMENT_METHODS.includes(patch.paymentMethod)
      ? patch.paymentMethod
      : null;
  }
  if (patch.extra !== undefined) fields.extra = Math.max(0, Number(patch.extra) || 0);
  if (patch.extraLabel !== undefined) fields.extra_label = patch.extraLabel || "";
  if (patch.seller !== undefined) fields.seller = cleanSeller(patch.seller);

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

// Elimina una orden del sistema. Si estaba 'confirmada' (tenía stock
// descontado), lo repone. Pendientes/canceladas no tienen stock reservado.
export async function deleteOrder(id) {
  const supabase = getSupabase();
  const { data: current, error: readErr } = await supabase
    .from("orders")
    .select("id, status, items")
    .eq("id", id)
    .maybeSingle();
  if (readErr) throw new Error(`No se pudo leer la orden: ${readErr.message}`);
  if (!current) return false;

  if (current.status === "confirmada") {
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
  };
}

function mapSettings(row) {
  if (!row) return defaultSettings();
  return {
    storeName: row.store_name || defaultSettings().storeName,
    logoUrl: row.logo_url || "",
    loginIconUrl: row.login_icon_url || "",
  };
}

// Lee la única fila de ajustes. RESILIENTE: si la tabla no existe o hay
// cualquier error, devuelve los valores por defecto sin lanzar.
export async function getSettings() {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("settings")
      .select("store_name, logo_url, login_icon_url")
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
export async function updateSettings(patch = {}) {
  const supabase = getSupabase();
  const next = { id: 1, updated_at: new Date().toISOString() };
  if (patch.storeName !== undefined) {
    next.store_name = String(patch.storeName || "").trim().slice(0, 60);
  }
  if (patch.logoUrl !== undefined) {
    next.logo_url = String(patch.logoUrl || "").trim().slice(0, 1000);
  }
  if (patch.loginIconUrl !== undefined) {
    next.login_icon_url = String(patch.loginIconUrl || "").trim().slice(0, 1000);
  }

  const { data, error } = await supabase
    .from("settings")
    .upsert(next, { onConflict: "id" })
    .select("store_name, logo_url, login_icon_url")
    .maybeSingle();
  if (error) throw new Error(`No se pudieron guardar los ajustes: ${error.message}`);
  return mapSettings(data);
}
