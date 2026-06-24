export default function Hero() {
  return (
    <section id="top" className="relative overflow-hidden">
      <div className="container-content relative pb-16 pt-14 sm:pb-24 sm:pt-20">
        <span
          className="chip animate-fade-in bg-accent-500/10 text-accent-300 ring-1 ring-accent-500/30"
          style={{ animationFillMode: "both" }}
        >
          Suplementos premium · Calidad certificada
        </span>

        <h1
          className="mt-5 max-w-3xl animate-fade-in text-4xl font-semibold leading-[1.08] text-ink sm:text-5xl md:text-6xl"
          style={{ animationDelay: "80ms", animationFillMode: "both" }}
        >
          Rendimiento real,
          <br />
          fórmulas honestas.
        </h1>

        <p
          className="mt-5 max-w-xl animate-fade-in text-base leading-relaxed text-ink-soft sm:text-lg"
          style={{ animationDelay: "160ms", animationFillMode: "both" }}
        >
          Una selección sobria de suplementos de alta pureza para entrenar,
          recuperarte y cuidar tu salud. Sin relleno, sin promesas vacías. Hacé
          tu pedido en segundos por WhatsApp.
        </p>

        <div
          className="mt-8 flex flex-wrap items-center gap-3 animate-fade-in"
          style={{ animationDelay: "240ms", animationFillMode: "both" }}
        >
          <a href="#productos" className="btn-accent px-6 py-3 text-[15px]">
            Ver productos
          </a>
          <a href="#beneficios" className="btn-ghost px-6 py-3 text-[15px]">
            Por qué elegirnos
          </a>
        </div>

        <dl
          className="mt-14 grid max-w-2xl grid-cols-3 gap-6 border-t border-white/10 pt-8 animate-fade-in"
          style={{ animationDelay: "320ms", animationFillMode: "both" }}
        >
          <div>
            <dt className="text-2xl font-semibold text-ink sm:text-3xl">100%</dt>
            <dd className="mt-1 text-sm text-ink-muted">Pureza certificada</dd>
          </div>
          <div>
            <dt className="text-2xl font-semibold text-ink sm:text-3xl">24h</dt>
            <dd className="mt-1 text-sm text-ink-muted">Despacho del pedido</dd>
          </div>
          <div>
            <dt className="text-2xl font-semibold text-ink sm:text-3xl">+2.500</dt>
            <dd className="mt-1 text-sm text-ink-muted">Clientes activos</dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
