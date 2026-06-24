// Capa de acceso a datos sobre Supabase (Postgres).
//
// Toda la persistencia de productos y pedidos vive en Supabase. La conexión se
// hace SÓLO del lado del servidor con la service role key (ver ./supabase.js),
// por lo que estas funciones deben importarse únicamente desde Server
// Components o Route Handlers, nunca desde código cliente.
//
// Todas las funciones son asíncronas (devuelven Promesas): acordate de usar
// `await` en quien las llame.
//
// El esquema SQL de las tablas está en storefront/supabase/schema.sql.

import { getSupabase } from "./supabase";

const PRODUCT_COLUMNS =
  "id, slug, name, category, price, stock, featured, short, description";
const ORDER_COLUMNS = "id, code, items, total, status, customer, created_at";

function slugify(text) {
  return String(text || "producto")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Normaliza una fila de `orders` (created_at) al shape que usa la app
// (createdAt), conservando items/customer como objetos.
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
  };
}

/* ------------------------------- Productos ------------------------------- */

export async function getProducts() {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_COLUMNS)
    .order("created_at", { ascending: true })
    .order("id", { ascending: true });
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

// Borra un producto por id. Usamos .select() para saber si efectivamente se
// borró una fila: devuelve true si existía y se eliminó, false si no había
// ningún producto con ese id. Ante un error de Supabase, lanza Error.
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

// Estados de orden válidos al CREAR (público o manual).
const ORDER_STATUSES = ["pendiente", "confirmada", "cancelada"];

// Lógica compartida por createOrder (checkout público) y createManualOrder
// (alta manual desde el admin): valida items, arma los lineItems, chequea y
// DESCUENTA stock, e inserta la orden. Devuelve { order } (mapeada) en éxito,
// o { error, conflicts } si el carrito está vacío o falta stock.
//
// Parámetros:
//   items    -> [{ id, quantity }]
//   customer -> { name, note }
//   status   -> estado inicial de la orden (default "pendiente")
//   code     -> código de la orden (default "AOSH-" + 4 dígitos)
async function buildOrderWithStock({ items, customer, status, code }) {
  const supabase = getSupabase();

  if (!Array.isArray(items) || items.length === 0) {
    return { error: "El carrito está vacío." };
  }

  // Traemos en una sola consulta los productos involucrados.
  const ids = items.map((it) => it.id);
  const { data: rows, error: readErr } = await supabase
    .from("products")
    .select("id, name, price, stock")
    .in("id", ids);
  if (readErr) throw new Error(`No se pudo validar el stock: ${readErr.message}`);

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
    if (product.stock < qty) {
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
    return { error: "Stock insuficiente para algunos productos.", conflicts };
  }

  // Descontamos inventario. El update es condicional (stock >= qty) para no
  // dejar stock negativo si dos pedidos entran casi a la vez. Para un volumen
  // alto de concurrencia conviene mover esto a una función RPC transaccional.
  for (const li of lineItems) {
    const product = byId.get(li.id);
    const { error: updErr } = await supabase
      .from("products")
      .update({ stock: Math.max(0, product.stock - li.quantity) })
      .eq("id", li.id)
      .gte("stock", li.quantity);
    if (updErr) throw new Error(`No se pudo actualizar el stock: ${updErr.message}`);
  }

  const total = lineItems.reduce((sum, li) => sum + li.subtotal, 0);
  const order = {
    id: "o" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
    code: code || "AOSH-" + Math.floor(1000 + Math.random() * 9000),
    items: lineItems,
    total,
    status: ORDER_STATUSES.includes(status) ? status : "pendiente",
    customer: {
      name: (customer && customer.name) || "",
      note: (customer && customer.note) || "",
    },
  };

  const { data: inserted, error: insErr } = await supabase
    .from("orders")
    .insert(order)
    .select(ORDER_COLUMNS)
    .single();
  if (insErr) throw new Error(`No se pudo guardar la orden: ${insErr.message}`);

  return { order: mapOrder(inserted) };
}

// Crea una orden validando y descontando stock. Devuelve { order } en éxito,
// o { error, conflicts } si no hay stock suficiente.
export async function createOrder({ items, customer }) {
  return buildOrderWithStock({ items, customer, status: "pendiente" });
}

// Registra una orden MANUAL (ventas hechas antes/offline) desde el admin.
// Reutiliza la misma validación y descuento de stock que createOrder, pero el
// estado inicial lo define el parámetro `status` (default "confirmada"; sólo se
// aceptan "confirmada" o "pendiente", cualquier otro valor cae a "confirmada").
// El código lleva prefijo "AOSH-M" para distinguir las altas manuales.
// Devuelve { order } (mapeada) o { error, conflicts }.
export async function createManualOrder({ items, customer, status }) {
  const wanted = status === "pendiente" ? "pendiente" : "confirmada";
  const code = "AOSH-M" + Math.floor(1000 + Math.random() * 9000);
  return buildOrderWithStock({ items, customer, status: wanted, code });
}

// Devuelve al stock las cantidades de cada item de la orden (read-then-write,
// al estilo de createOrder). Se usa al CANCELAR un pedido para reponer lo que
// se había descontado en el checkout. Si un producto ya no existe, se ignora
// sin romper. No lleva guard porque sumar stock nunca lo deja negativo.
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
    if (!product) continue; // El producto ya no existe: lo ignoramos.
    const { error: updErr } = await supabase
      .from("products")
      .update({ stock: product.stock + qty })
      .eq("id", item.id);
    if (updErr) throw new Error(`No se pudo reponer el stock: ${updErr.message}`);
  }
}

// Vuelve a descontar el stock de cada item de la orden. Se usa al REACTIVAR un
// pedido que estaba cancelado (cancelada -> pendiente/confirmada), para no
// quedar con stock inflado. El update es condicional (stock >= qty) igual que
// en createOrder, así nunca dejamos stock negativo. Si un producto ya no existe
// se ignora.
async function consumeStock(items) {
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
    if (!product) continue; // El producto ya no existe: lo ignoramos.
    const { error: updErr } = await supabase
      .from("products")
      .update({ stock: Math.max(0, product.stock - qty) })
      .eq("id", item.id)
      .gte("stock", qty);
    if (updErr) throw new Error(`No se pudo actualizar el stock: ${updErr.message}`);
  }
}

// Cambia el estado de una orden ajustando el stock según la transición:
//   - hacia 'cancelada' (desde un estado no cancelado): repone el stock UNA vez.
//   - desde 'cancelada' hacia 'pendiente'/'confirmada' (reactivación): vuelve a
//     descontar el stock (con guard para no dejar negativo).
//   - cualquier otra transición (pendiente <-> confirmada, o re-setear el mismo
//     estado): sólo actualiza el status, sin tocar stock.
// Es idempotente: leemos el estado actual antes de mover stock, así cancelar
// una orden ya cancelada (o reactivar una ya activa) no duplica el ajuste.
// Devuelve la orden mapeada, o null si no existe.
export async function setOrderStatus(id, status) {
  const supabase = getSupabase();

  // Leemos la orden actual para conocer su estado e items.
  const { data: current, error: readErr } = await supabase
    .from("orders")
    .select(ORDER_COLUMNS)
    .eq("id", id)
    .maybeSingle();
  if (readErr) throw new Error(`No se pudo leer la orden: ${readErr.message}`);
  if (!current) return null;

  const wasCancelled = current.status === "cancelada";
  const willCancel = status === "cancelada";

  // Ajustamos stock ANTES de marcar el nuevo estado. Si el update de status
  // fallara, el stock podría quedar desincronizado; para garantías fuertes esto
  // debería ser una RPC transaccional, igual que el descuento en createOrder.
  if (willCancel && !wasCancelled) {
    // Cancelación: devolvemos al inventario lo que se había descontado.
    await restoreStock(current.items);
  } else if (!willCancel && wasCancelled) {
    // Reactivación: volvemos a descontar el inventario.
    await consumeStock(current.items);
  }

  const { data, error } = await supabase
    .from("orders")
    .update({ status })
    .eq("id", id)
    .select(ORDER_COLUMNS)
    .maybeSingle();
  if (error) throw new Error(`No se pudo actualizar la orden: ${error.message}`);
  return mapOrder(data);
}

export async function updateOrder(id, patch) {
  const supabase = getSupabase();
  if (patch.status === undefined) {
    const { data } = await supabase
      .from("orders")
      .select(ORDER_COLUMNS)
      .eq("id", id)
      .maybeSingle();
    return mapOrder(data);
  }

  // Delegamos en setOrderStatus para que el cambio de estado ajuste el stock
  // cuando corresponde (cancelar/reactivar). Para 'pendiente' <-> 'confirmada'
  // el stock no se toca.
  return setOrderStatus(id, patch.status);
}
