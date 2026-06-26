"use client";

import { useEffect, useState } from "react";
import ProductCard from "./ProductCard";
import Reveal from "./Reveal";
import { readRecent } from "@/lib/recentlyViewed";

// Muestra los productos que el cliente vio recientemente (leídos del navegador),
// respetando el orden en que los abrió. Si no hay ninguno (o ya no existen en
// el catálogo), no renderiza nada. `excludeId` evita repetir el producto actual.
export default function RecentlyViewed({ products, excludeId = null, title = "Vistos recientemente" }) {
  const [ids, setIds] = useState([]);

  useEffect(() => {
    setIds(readRecent());
  }, []);

  const byId = new Map(products.map((p) => [p.id, p]));
  const items = ids
    .filter((id) => id !== excludeId)
    .map((id) => byId.get(id))
    .filter(Boolean)
    .slice(0, 4);

  if (items.length === 0) return null;

  return (
    <section className="container-content pb-4 pt-2">
      <Reveal>
        <h2 className="text-xl font-semibold text-ink sm:text-2xl">{title}</h2>
      </Reveal>
      <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {items.map((p, i) => (
          <Reveal key={p.id} delay={i * 60}>
            <ProductCard product={p} />
          </Reveal>
        ))}
      </div>
    </section>
  );
}
