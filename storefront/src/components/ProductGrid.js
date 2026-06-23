"use client";

import { useMemo, useState } from "react";
import ProductCard from "./ProductCard";
import ProductModal from "./ProductModal";

export default function ProductGrid({ products }) {
  const categories = useMemo(
    () => ["Todos", ...Array.from(new Set(products.map((p) => p.category)))],
    [products]
  );
  const [active, setActive] = useState("Todos");
  const [selected, setSelected] = useState(null);

  const filtered =
    active === "Todos" ? products : products.filter((p) => p.category === active);

  return (
    <section id="productos" className="container-content py-16 sm:py-20">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-ink sm:text-3xl">
            Nuestros productos
          </h2>
          <p className="mt-2 text-ink-soft">
            Elegí tu suplemento y sumalo al carrito. Confirmás por WhatsApp.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setActive(c)}
              className={`chip px-3.5 py-1.5 transition ${
                active === c
                  ? "bg-ink text-white"
                  : "bg-white text-ink-soft ring-1 ring-ink/10 hover:ring-ink/30"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((p) => (
          <ProductCard key={p.id} product={p} onView={setSelected} />
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="mt-12 text-center text-ink-muted">
          No hay productos en esta categoría.
        </p>
      )}

      {selected && (
        <ProductModal product={selected} onClose={() => setSelected(null)} />
      )}
    </section>
  );
}
