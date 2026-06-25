"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { formatPrice } from "@/lib/format";
import Logo from "@/components/Logo";
import Modal from "@/components/Modal";
import { LoadingOverlay } from "@/components/Spinner";
import { useToast } from "@/components/Toast";
import AdminSidebar from "./AdminSidebar";
import DashboardCharts from "./DashboardCharts";
import InventoryRow from "./InventoryRow";
import NewProductForm from "./NewProductForm";
import ManualOrderForm from "./ManualOrderForm";
import MediaManager from "./MediaManager";
import OrderCard from "./OrderCard";
import BrandingSettings from "./BrandingSettings";

const VIEW_TITLES = {
  resumen: "Resumen",
  inventario: "Inventario",
  ordenes: "Órdenes",
  finanzas: "Finanzas",
  ajustes: "Ajustes",
};

function Stat({ label, value }) {
  return (
    <div className="card p-4 shadow-soft">
      <div className="text-xs font-medium uppercase tracking-wide text-ink-muted">
        {label}
      </div>
      <div className="mt-1.5 text-xl font-semibold text-ink">{value}</div>
    </div>
  );
}

export default function AdminDashboard({ onLogout }) {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [activeView, setActiveView] = useState("resumen");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [pRes, oRes] = await Promise.all([
        fetch("/api/products"),
        fetch("/api/orders"),
      ]);
      if (!pRes.ok) throw new Error("No se pudieron leer los productos.");
      const p = await pRes.json();
      const o = oRes.ok ? await oRes.json() : { orders: [] };
      setProducts(p.products || []);
      setOrders(o.orders || []);
    } catch (err) {
      console.error(err);
      setLoadError(
        "No se pudieron cargar los datos. Revisá tu conexión e intentá de nuevo."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function logout() {
    try {
      await fetch("/api/admin/verify", { method: "DELETE" });
    } catch {
      /* ignore */
    }
    onLogout();
  }

  const stats = useMemo(() => {
    const inventoryValue = products.reduce((s, p) => s + p.price * p.stock, 0);
    const units = products.reduce((s, p) => s + p.stock, 0);
    const pending = orders.filter((o) => o.status === "pendiente").length;
    return { count: products.length, inventoryValue, units, pending };
  }, [products, orders]);

  const categories = useMemo(
    () => Array.from(new Set(products.map((p) => p.category))),
    [products]
  );

  return (
    <div className="min-h-screen">
      <AdminSidebar
        active={activeView}
        onChange={setActiveView}
        onLogout={logout}
        pending={stats.pending}
      />

      {/* Offset por el sidebar: a la izquierda en desktop, abajo en mobile. */}
      <div className="pb-20 md:pb-0 md:pl-16">
        <header className="border-b border-white/10 bg-surface">
          <div className="container-content flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <Logo />
              <span className="hidden text-xs text-ink-muted sm:inline">
                · {VIEW_TITLES[activeView]}
              </span>
            </div>
          </div>
        </header>

        <main className="container-content py-8">
          {loadError && (
            <div className="mb-6 flex flex-col items-start justify-between gap-3 rounded-[4px] border border-amber-400/30 bg-amber-400/10 p-4 text-sm text-amber-200 sm:flex-row sm:items-center">
              <p>{loadError}</p>
              <button
                onClick={load}
                className="shrink-0 rounded-[4px] border border-amber-400/40 px-4 py-1.5 text-[13px] font-medium text-amber-100 transition hover:bg-amber-400/15"
              >
                Reintentar
              </button>
            </div>
          )}

          {loading ? (
            <LoadingOverlay />
          ) : activeView === "resumen" ? (
            <ResumenView stats={stats} products={products} orders={orders} />
          ) : activeView === "inventario" ? (
            <InventarioView
              products={products}
              categories={categories}
              setProducts={setProducts}
            />
          ) : activeView === "finanzas" ? (
            <FinanceView orders={orders} />
          ) : activeView === "ajustes" ? (
            <BrandingSettings />
          ) : (
            <OrdenesView orders={orders} setOrders={setOrders} products={products} />
          )}
        </main>
      </div>
    </div>
  );
}

function ResumenView({ stats, products, orders }) {
  return (
    <div className="animate-fade-in">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Productos" value={stats.count} />
        <Stat label="Valor inventario" value={formatPrice(stats.inventoryValue)} />
        <Stat label="Unidades en stock" value={stats.units} />
        <Stat label="Órdenes pendientes" value={stats.pending} />
      </div>

      <h2 className="mb-4 mt-8 text-base font-semibold text-ink">
        Métricas del negocio
      </h2>
      <DashboardCharts products={products} orders={orders} />
    </div>
  );
}

// Formulario de restock (dentro de un modal): suma unidades al stock actual.
function RestockForm({ product, onDone }) {
  const [units, setUnits] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const toast = useToast();
  const add = Number(units) || 0;
  const next = Number(product.stock) + add;

  async function submit(e) {
    e.preventDefault();
    if (add <= 0) {
      setError("Ingresá una cantidad mayor a 0.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stock: next }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        onDone(data.product);
        toast.success("Stock actualizado");
      } else {
        const msg = data.error || "No se pudo actualizar el stock.";
        setError(msg);
        toast.error(msg);
      }
    } catch {
      setError("Error de conexión.");
      toast.error("Error de conexión.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit}>
      <p className="text-sm text-ink-soft">
        Stock actual:{" "}
        <span className="font-semibold text-ink">{product.stock}</span>
      </p>
      <label className="label mt-4">Unidades a agregar</label>
      <input
        className="input"
        inputMode="numeric"
        autoFocus
        value={units}
        onChange={(e) => setUnits(e.target.value.replace(/[^\d]/g, ""))}
        placeholder="Ej: 20"
      />
      {add > 0 && (
        <p className="mt-2 text-xs text-ink-muted">
          Nuevo stock: <span className="text-accent-300">{next}</span>
        </p>
      )}
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
      <button type="submit" disabled={saving} className="btn-accent mt-5 w-full py-3">
        {saving ? "Guardando…" : "Agregar al stock"}
      </button>
    </form>
  );
}

// Editor de medios (dentro de un modal): sube/quita fotos y videos del producto
// y guarda el arreglo de URLs.
function ProductMediaForm({ product, onSaved, onClose }) {
  const [images, setImages] = useState(
    Array.isArray(product.images) ? product.images : []
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const toast = useToast();

  // Persiste apenas se sube o se quita un medio: no hay botón "guardar" que se
  // pueda olvidar. El preview local cambia al instante y se publica en la tienda.
  async function persist(next) {
    setImages(next);
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ images: next }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        onSaved?.(data.product);
        toast.success("Imágenes actualizadas");
      } else {
        const msg = data.error || "No se pudieron guardar las imágenes.";
        setError(msg);
        toast.error(msg);
      }
    } catch {
      setError("Error de conexión.");
      toast.error("Error de conexión.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <MediaManager value={images} onChange={persist} />
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
      <div className="mt-3 flex items-center justify-end gap-3">
        {saving && <span className="text-xs text-ink-muted">Guardando…</span>}
        <button onClick={onClose} className="btn-primary px-4 py-2 text-[13px]">
          Listo
        </button>
      </div>
    </div>
  );
}

function InventarioView({ products, categories, setProducts }) {
  const [addOpen, setAddOpen] = useState(false);
  const [restock, setRestock] = useState(null); // producto a reabastecer
  const [mediaProduct, setMediaProduct] = useState(null); // producto a editar medios
  const [query, setQuery] = useState("");

  // Filtra la tabla por nombre y categoría mientras se escribe.
  const filtered = useMemo(() => {
    const q = normalize(query.trim());
    if (!q) return products;
    return products.filter(
      (p) => normalize(p.name).includes(q) || normalize(p.category).includes(q)
    );
  }, [products, query]);

  return (
    <section className="animate-fade-in">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold text-ink">
          Inventario ({products.length})
        </h2>
        <button
          onClick={() => setAddOpen(true)}
          className="btn-primary px-4 py-2 text-[13px]"
        >
          + Agregar producto
        </button>
      </div>

      {products.length === 0 ? (
        <div className="card p-8 text-center text-sm text-ink-muted shadow-soft">
          Todavía no hay productos. Tocá “+ Agregar producto” para cargar el
          primero.
        </div>
      ) : (
        <>
          <div className="mb-4 relative max-w-xs">
            <svg
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.2-3.2" />
            </svg>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nombre o categoría…"
              aria-label="Buscar productos"
              className="input pl-10"
            />
          </div>

          {filtered.length === 0 ? (
            <div className="card p-8 text-center text-sm text-ink-muted shadow-soft">
              No hay productos que coincidan con la búsqueda.
            </div>
          ) : (
            <div className="card overflow-x-auto shadow-soft">
              <table className="w-full min-w-[700px] text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wide text-ink-muted">
                    <th className="px-4 py-3 font-medium">Producto</th>
                    <th className="px-4 py-3 font-medium">Categoría</th>
                    <th className="px-4 py-3 font-medium">Precio</th>
                    <th className="px-4 py-3 font-medium">Stock</th>
                    <th className="px-4 py-3 font-medium">Destacado</th>
                    <th className="px-4 py-3 text-right font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => (
                    <InventoryRow
                      key={p.id}
                      product={p}
                      onUpdated={(updated) =>
                        setProducts((prev) =>
                          prev.map((x) => (x.id === updated.id ? updated : x))
                        )
                      }
                      onDeleted={(id) =>
                        setProducts((prev) => prev.filter((x) => x.id !== id))
                      }
                      onRestock={(prod) => setRestock(prod)}
                      onEditMedia={(prod) => setMediaProduct(prod)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Nuevo producto">
        <NewProductForm
          categories={categories}
          onCreated={(created) => {
            setProducts((prev) => [created, ...prev]);
            setAddOpen(false);
          }}
          onCancel={() => setAddOpen(false)}
        />
      </Modal>

      <Modal
        open={!!restock}
        onClose={() => setRestock(null)}
        title={restock ? `Restock · ${restock.name}` : "Restock"}
        maxW="max-w-sm"
      >
        {restock && (
          <RestockForm
            product={restock}
            onDone={(updated) => {
              setProducts((prev) =>
                prev.map((x) => (x.id === updated.id ? updated : x))
              );
              setRestock(null);
            }}
          />
        )}
      </Modal>

      <Modal
        open={!!mediaProduct}
        onClose={() => setMediaProduct(null)}
        title={mediaProduct ? `Imágenes · ${mediaProduct.name}` : "Imágenes"}
      >
        {mediaProduct && (
          <ProductMediaForm
            product={mediaProduct}
            onSaved={(updated) =>
              setProducts((prev) =>
                prev.map((x) => (x.id === updated.id ? updated : x))
              )
            }
            onClose={() => setMediaProduct(null)}
          />
        )}
      </Modal>
    </section>
  );
}

// Normaliza para buscar sin distinguir mayúsculas ni acentos.
function normalize(str) {
  return (str || "")
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function OrdenesView({ orders, setOrders, products }) {
  const [manualOpen, setManualOpen] = useState(false);
  const [tab, setTab] = useState("todas"); // todas | pendiente | confirmada | cancelada
  const [query, setQuery] = useState("");

  // Conteos por estado para mostrar en cada tab.
  const counts = useMemo(() => {
    const c = { todas: orders.length, pendiente: 0, confirmada: 0, cancelada: 0 };
    for (const o of orders) {
      if (o.status === "pendiente") c.pendiente += 1;
      else if (o.status === "confirmada") c.confirmada += 1;
      else if (o.status === "cancelada") c.cancelada += 1;
    }
    return c;
  }, [orders]);

  // Lista de personas que ya facturaron antes, para autocompletar (datalist).
  const sellers = useMemo(
    () =>
      Array.from(
        new Set(orders.map((o) => (o.seller || "").trim()).filter(Boolean))
      ).sort((a, b) => a.localeCompare(b, "es")),
    [orders]
  );

  // "Completadas" es la etiqueta para el estado 'confirmada' (no cambia el dato).
  const tabs = [
    { id: "todas", label: "Todas" },
    { id: "pendiente", label: "Pendientes" },
    { id: "confirmada", label: "Completadas" },
    { id: "cancelada", label: "Canceladas" },
  ];

  // Filtra por tab (estado) + buscador (código, cliente y nombre de producto).
  const filtered = useMemo(() => {
    const q = normalize(query.trim());
    return orders.filter((o) => {
      if (tab !== "todas" && o.status !== tab) return false;
      if (!q) return true;
      const haystack = [
        o.code,
        o.customer?.name,
        ...(o.items || []).map((it) => it.name),
      ];
      return haystack.some((campo) => normalize(campo).includes(q));
    });
  }, [orders, tab, query]);

  return (
    <section className="animate-fade-in">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold text-ink">
          Órdenes ({orders.length})
        </h2>
        <button
          onClick={() => setManualOpen(true)}
          className="btn-primary px-4 py-2 text-[13px]"
        >
          + Pedido manual
        </button>
      </div>

      {orders.length === 0 ? (
        <div className="card p-8 text-center text-sm text-ink-muted shadow-soft">
          Todavía no hay órdenes. Las de la tienda aparecen acá, o cargá una con
          “+ Pedido manual”.
        </div>
      ) : (
        <>
          {/* Tabs por estado con conteo + buscador. Funciona como historial. */}
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`chip shrink-0 whitespace-nowrap px-3.5 py-1.5 transition active:scale-95 ${
                    tab === t.id
                      ? "bg-accent-500 text-night"
                      : "bg-white/5 text-ink-soft ring-1 ring-white/10 hover:ring-white/30"
                  }`}
                >
                  {t.label} ({counts[t.id]})
                </button>
              ))}
            </div>

            <div className="relative w-full sm:max-w-xs">
              <svg
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.2-3.2" />
              </svg>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar por código, cliente o producto…"
                aria-label="Buscar órdenes"
                className="input pl-10"
              />
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="card p-8 text-center text-sm text-ink-muted shadow-soft">
              No hay órdenes que coincidan con el filtro o la búsqueda.
            </div>
          ) : (
            <div className="grid items-start gap-3 lg:grid-cols-2">
              {filtered.map((o) => (
                <OrderCard
                  key={o.id}
                  order={o}
                  sellers={sellers}
                  onUpdated={(updated) =>
                    setOrders((prev) =>
                      prev.map((x) => (x.id === updated.id ? updated : x))
                    )
                  }
                  onDeleted={(id) =>
                    setOrders((prev) => prev.filter((x) => x.id !== id))
                  }
                />
              ))}
            </div>
          )}
        </>
      )}

      <Modal
        open={manualOpen}
        onClose={() => setManualOpen(false)}
        title="Cargar pedido manual"
      >
        <ManualOrderForm
          products={products}
          sellers={sellers}
          onCreated={(order) => {
            setOrders((prev) => [order, ...prev]);
            setManualOpen(false);
          }}
          onCancel={() => setManualOpen(false)}
        />
      </Modal>
    </section>
  );
}

// Tab de Finanzas: cuánto dinero se hizo, cuánto se vendió y por qué método.
function FinanceView({ orders }) {
  const f = useMemo(() => {
    let confirmedTotal = 0;
    let pendingTotal = 0;
    let efectivo = 0;
    let transferencia = 0;
    let unidades = 0;
    let confirmadas = 0;
    for (const o of orders) {
      const g = (Number(o.total) || 0) + (Number(o.extra) || 0);
      if (o.status === "confirmada") {
        confirmedTotal += g;
        confirmadas += 1;
        unidades += (o.items || []).reduce(
          (s, it) => s + (Number(it.quantity) || 0),
          0
        );
        if (o.paymentMethod === "efectivo") efectivo += g;
        else if (o.paymentMethod === "transferencia") transferencia += g;
      } else if (o.status === "pendiente") {
        pendingTotal += g;
      }
    }
    const sinAsignar = Math.max(0, confirmedTotal - efectivo - transferencia);
    return {
      confirmedTotal,
      pendingTotal,
      efectivo,
      transferencia,
      sinAsignar,
      unidades,
      confirmadas,
    };
  }, [orders]);

  const methodRows = [
    { label: "Efectivo", value: f.efectivo, tone: "bg-green-500" },
    { label: "Transferencia", value: f.transferencia, tone: "bg-accent-500" },
    { label: "Sin asignar", value: f.sinAsignar, tone: "bg-white/25" },
  ];
  const maxMethod = Math.max(1, ...methodRows.map((r) => r.value));

  return (
    <div className="animate-fade-in">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Ingresos confirmados" value={formatPrice(f.confirmedTotal)} />
        <Stat label="Pendiente por cobrar" value={formatPrice(f.pendingTotal)} />
        <Stat label="Unidades vendidas" value={f.unidades} />
        <Stat label="Pedidos confirmados" value={f.confirmadas} />
      </div>

      <div className="mt-6 grid gap-3 lg:grid-cols-2">
        <div className="card p-5 shadow-soft">
          <h3 className="text-sm font-semibold text-ink">
            Ingresos por método de pago
          </h3>
          <div className="mt-4 space-y-3">
            {methodRows.map((r) => (
              <div key={r.label}>
                <div className="mb-1 flex items-baseline justify-between text-sm">
                  <span className="text-ink-soft">{r.label}</span>
                  <span className="font-medium text-ink">
                    {formatPrice(r.value)}
                  </span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-[3px] bg-white/[0.07]">
                  <div
                    className={`h-full rounded-[3px] ${r.tone} transition-all duration-500`}
                    style={{ width: `${Math.round((r.value / maxMethod) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5 shadow-soft">
          <h3 className="text-sm font-semibold text-ink">Resumen</h3>
          <ul className="mt-4 divide-y divide-white/[0.07] text-sm">
            <li className="flex items-center justify-between py-2.5">
              <span className="text-ink-soft">Ingresos confirmados</span>
              <span className="font-semibold text-green-300">
                {formatPrice(f.confirmedTotal)}
              </span>
            </li>
            <li className="flex items-center justify-between py-2.5">
              <span className="text-ink-soft">Pendiente por cobrar</span>
              <span className="font-semibold text-amber-300">
                {formatPrice(f.pendingTotal)}
              </span>
            </li>
            <li className="flex items-center justify-between py-2.5">
              <span className="text-ink-soft">Unidades vendidas</span>
              <span className="font-semibold text-ink">{f.unidades}</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
