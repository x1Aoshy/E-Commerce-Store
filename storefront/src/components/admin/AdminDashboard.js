"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { formatPrice } from "@/lib/format";
import InventoryRow from "./InventoryRow";
import NewProductForm from "./NewProductForm";
import OrderCard from "./OrderCard";

const STORE = process.env.NEXT_PUBLIC_STORE_NAME || "Aosh Suplementos";

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
  const [tab, setTab] = useState("inventario");
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [p, o] = await Promise.all([
        fetch("/api/products").then((r) => r.json()),
        fetch("/api/orders").then((r) => (r.ok ? r.json() : { orders: [] })),
      ]);
      setProducts(p.products || []);
      setOrders(o.orders || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function logout() {
    await fetch("/api/admin/verify", { method: "DELETE" });
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
    <div className="min-h-screen bg-accent-50/20">
      <header className="border-b border-ink/[0.07] bg-white">
        <div className="container-content flex h-16 items-center justify-between">
          <div className="flex items-center gap-2.5">
            <svg width="28" height="28" viewBox="0 0 32 32" aria-hidden="true">
              <rect width="32" height="32" rx="8" fill="#15191c" />
              <path
                d="M16 8c3.6 3.1 5.6 5.7 5.6 8.6A5.6 5.6 0 0 1 16 22.2a5.6 5.6 0 0 1-5.6-5.6C10.4 13.7 12.4 11.1 16 8z"
                fill="#2f9d77"
              />
            </svg>
            <div>
              <div className="text-sm font-semibold text-ink">{STORE}</div>
              <div className="text-xs text-ink-muted">Administración</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a href="/" className="btn-ghost px-4 py-2 text-[13px]">
              Ver tienda
            </a>
            <button onClick={logout} className="btn-ghost px-4 py-2 text-[13px]">
              Salir
            </button>
          </div>
        </div>
      </header>

      <main className="container-content py-8">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Productos" value={stats.count} />
          <Stat label="Valor inventario" value={formatPrice(stats.inventoryValue)} />
          <Stat label="Unidades en stock" value={stats.units} />
          <Stat label="Órdenes pendientes" value={stats.pending} />
        </div>

        <div className="mt-8 flex items-center gap-2">
          <button
            onClick={() => setTab("inventario")}
            className={`chip px-4 py-2 transition ${
              tab === "inventario"
                ? "bg-ink text-white"
                : "bg-white text-ink-soft ring-1 ring-ink/10 hover:ring-ink/30"
            }`}
          >
            Inventario
          </button>
          <button
            onClick={() => setTab("ordenes")}
            className={`chip gap-2 px-4 py-2 transition ${
              tab === "ordenes"
                ? "bg-ink text-white"
                : "bg-white text-ink-soft ring-1 ring-ink/10 hover:ring-ink/30"
            }`}
          >
            Órdenes
            {stats.pending > 0 && (
              <span className="rounded-full bg-accent-500 px-1.5 text-[10px] font-semibold text-white">
                {stats.pending}
              </span>
            )}
          </button>
        </div>

        {loading ? (
          <p className="mt-8 text-sm text-ink-muted">Cargando…</p>
        ) : tab === "inventario" ? (
          <section className="mt-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-ink">
                Inventario ({products.length})
              </h2>
              <button
                onClick={() => setShowNew((v) => !v)}
                className="btn-primary px-4 py-2 text-[13px]"
              >
                {showNew ? "Cerrar" : "+ Agregar producto"}
              </button>
            </div>

            {showNew && (
              <div className="mb-5">
                <NewProductForm
                  categories={categories}
                  onCreated={(created) => {
                    setProducts((prev) => [created, ...prev]);
                    setShowNew(false);
                  }}
                  onCancel={() => setShowNew(false)}
                />
              </div>
            )}

            <div className="card overflow-x-auto shadow-soft">
              <table className="w-full min-w-[680px] text-sm">
                <thead>
                  <tr className="border-b border-ink/[0.07] text-left text-xs uppercase tracking-wide text-ink-muted">
                    <th className="px-4 py-3 font-medium">Producto</th>
                    <th className="px-4 py-3 font-medium">Categoría</th>
                    <th className="px-4 py-3 font-medium">Precio</th>
                    <th className="px-4 py-3 font-medium">Stock</th>
                    <th className="px-4 py-3 font-medium">Destacado</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <InventoryRow
                      key={p.id}
                      product={p}
                      onUpdated={(updated) =>
                        setProducts((prev) =>
                          prev.map((x) => (x.id === updated.id ? updated : x))
                        )
                      }
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : (
          <section className="mt-5">
            <h2 className="mb-4 text-base font-semibold text-ink">
              Órdenes ({orders.length})
            </h2>
            {orders.length === 0 ? (
              <div className="card p-8 text-center text-sm text-ink-muted shadow-soft">
                Todavía no hay órdenes. Las que se generen desde la tienda
                aparecerán acá.
              </div>
            ) : (
              <div className="grid gap-3 lg:grid-cols-2">
                {orders.map((o) => (
                  <OrderCard
                    key={o.id}
                    order={o}
                    onUpdated={(updated) =>
                      setOrders((prev) =>
                        prev.map((x) => (x.id === updated.id ? updated : x))
                      )
                    }
                  />
                ))}
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
