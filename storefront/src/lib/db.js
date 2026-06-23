// Almacén de datos basado en un archivo JSON (data/store.json).
// Es deliberadamente simple para que el preview corra sin una base de datos
// externa. La interfaz (getProducts, createOrder, etc.) está pensada para que
// migrar a Postgres/MySQL/Prisma más adelante sea directo: sólo se reemplaza
// la implementación de estas funciones.

import fs from "fs";
import path from "path";
import { seedProducts } from "./seed";

const DATA_DIR = path.join(process.cwd(), "data");
const STORE_PATH = path.join(DATA_DIR, "store.json");

function slugify(text) {
  return String(text || "producto")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function ensureStore() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(STORE_PATH)) {
    const initial = { products: seedProducts, orders: [] };
    fs.writeFileSync(STORE_PATH, JSON.stringify(initial, null, 2), "utf-8");
  }
}

function readStore() {
  ensureStore();
  const raw = fs.readFileSync(STORE_PATH, "utf-8");
  try {
    return JSON.parse(raw);
  } catch {
    const initial = { products: seedProducts, orders: [] };
    writeStore(initial);
    return initial;
  }
}

function writeStore(store) {
  ensureStore();
  fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), "utf-8");
}

/* ------------------------------- Productos ------------------------------- */

export function getProducts() {
  return readStore().products;
}

export function getProductById(id) {
  return readStore().products.find((p) => p.id === id) || null;
}

export function getProductBySlug(slug) {
  return readStore().products.find((p) => p.slug === slug) || null;
}

export function createProduct(data) {
  const store = readStore();
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
  store.products.push(product);
  writeStore(store);
  return product;
}

export function updateProduct(id, patch) {
  const store = readStore();
  const idx = store.products.findIndex((p) => p.id === id);
  if (idx === -1) return null;
  const current = store.products[idx];
  const next = { ...current };
  if (patch.name !== undefined) next.name = patch.name;
  if (patch.category !== undefined) next.category = patch.category;
  if (patch.price !== undefined) next.price = Number(patch.price);
  if (patch.stock !== undefined) next.stock = Math.max(0, Number(patch.stock));
  if (patch.featured !== undefined) next.featured = Boolean(patch.featured);
  if (patch.short !== undefined) next.short = patch.short;
  if (patch.description !== undefined) next.description = patch.description;
  store.products[idx] = next;
  writeStore(store);
  return next;
}

/* -------------------------------- Órdenes -------------------------------- */

export function getOrders() {
  return readStore()
    .orders.slice()
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

// Crea una orden validando y descontando stock. Devuelve { order } en éxito,
// o { error, conflicts } si no hay stock suficiente.
export function createOrder({ items, customer }) {
  const store = readStore();

  if (!Array.isArray(items) || items.length === 0) {
    return { error: "El carrito está vacío." };
  }

  const lineItems = [];
  const conflicts = [];

  for (const item of items) {
    const product = store.products.find((p) => p.id === item.id);
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

  // Descontar inventario
  for (const li of lineItems) {
    const product = store.products.find((p) => p.id === li.id);
    product.stock = Math.max(0, product.stock - li.quantity);
  }

  const total = lineItems.reduce((sum, li) => sum + li.subtotal, 0);
  const order = {
    id: "o" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
    code: "AOSH-" + Math.floor(1000 + Math.random() * 9000),
    items: lineItems,
    total,
    status: "pendiente",
    customer: {
      name: (customer && customer.name) || "",
      note: (customer && customer.note) || "",
    },
    createdAt: new Date().toISOString(),
  };

  store.orders.push(order);
  writeStore(store);
  return { order };
}

export function updateOrder(id, patch) {
  const store = readStore();
  const idx = store.orders.findIndex((o) => o.id === id);
  if (idx === -1) return null;
  if (patch.status !== undefined) store.orders[idx].status = patch.status;
  writeStore(store);
  return store.orders[idx];
}
