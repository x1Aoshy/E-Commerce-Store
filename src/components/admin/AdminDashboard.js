"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { formatPrice } from "@/lib/format";
import Logo from "@/components/Logo";
import AdminSidebar from "./AdminSidebar";
import DashboardCharts from "./DashboardCharts";
import InventoryRow from "./InventoryRow";
import NewProductForm from "./NewProductForm";
import OrderCard from "./OrderCard";

const VIEW_TITLES = {
  resumen: "Resumen",
  inventario: "Inventario",
  ordenes: "Órdenes",
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
    <div className="min-h-screen">
      <AdminSidebar
        active={activeView}
        onChange={setActiveView}
        onLogout={logout}
        pending={stats.pending}
      />

      {/* Offset por el sidebar: a la izquierda en desktop, abajo en mobile. */}
      <div className="pb-20 md:pb-0 md:pl-16">
        <header className="border-b border-white/10 bg-surface/40">
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
          {loading ? (
            <p className="text-sm text-ink-muted">Cargando…</p>
          ) : activeView === "resumen" ? (
            <ResumenView stats={stats} products={products} orders={orders} />
          ) : activeView === "inventario" ? (
            <InventarioView
              products={products}
              categories={categories}
              showNew={showNew}
              setShowNew={setShowNew}
              setProducts={setProducts}
            />
          ) : (
            <OrdenesView orders={orders} setOrders={setOrders} />
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

function InventarioView({
  products,
  categories,
  showNew,
  setShowNew,
  setProducts,
}) {
  return (
    <section className="animate-fade-in">
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
            <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wide text-ink-muted">
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
  );
}

function OrdenesView({ orders, setOrders }) {
  return (
    <section className="animate-fade-in">
      <h2 className="mb-4 text-base font-semibold text-ink">
        Órdenes ({orders.length})
      </h2>
      {orders.length === 0 ? (
        <div className="card p-8 text-center text-sm text-ink-muted shadow-soft">
          Todavía no hay órdenes. Las que se generen desde la tienda aparecerán
          acá.
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
  );
}
