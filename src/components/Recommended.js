import Reveal from "./Reveal";
import ProductCard from "./ProductCard";

// Sección de recomendados: muestra los productos destacados (featured) para que
// el usuario vea opciones relevantes ni bien entra, sin tener que buscar.
export default function Recommended({ products = [] }) {
  const featured = products.filter((p) => p.featured).slice(0, 3);
  if (featured.length === 0) return null;

  return (
    <section className="container-content pt-16 sm:pt-20">
      <Reveal>
        <div className="flex items-center gap-3 text-accent-300">
          <span className="h-px w-8 bg-accent-400/70" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.22em]">
            Recomendados
          </span>
        </div>
        <h2 className="mt-3 text-2xl font-semibold text-ink sm:text-3xl">
          Elegidos para vos
        </h2>
        <p className="mt-2 text-ink-soft">
          Los favoritos de nuestros clientes para arrancar con el pie derecho.
        </p>
      </Reveal>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {featured.map((p, i) => (
          <Reveal key={p.id} delay={i * 60}>
            <ProductCard product={p} />
          </Reveal>
        ))}
      </div>
    </section>
  );
}
