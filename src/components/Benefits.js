const BENEFITS = [
  {
    title: "Calidad certificada",
    text: "Cada lote pasa controles de pureza. Sólo trabajamos marcas y materias primas que usaríamos nosotros.",
    icon: (
      <>
        <path d="M12 3 4 6v6c0 5 3.4 8 8 9 4.6-1 8-4 8-9V6z" />
        <path d="m9 12 2 2 4-4" />
      </>
    ),
  },
  {
    title: "Asesoramiento real",
    text: "Te ayudamos a elegir según tu objetivo. Escribinos y armamos tu plan de suplementación.",
    icon: (
      <>
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </>
    ),
  },
  {
    title: "Despacho rápido",
    text: "Preparamos y despachamos tu pedido dentro de las 24 horas hábiles tras la confirmación.",
    icon: (
      <>
        <path d="M3 7h11v8H3z" />
        <path d="M14 9h4l3 3v3h-7z" />
        <circle cx="7" cy="18" r="1.6" />
        <circle cx="17" cy="18" r="1.6" />
      </>
    ),
  },
  {
    title: "Pedido por WhatsApp",
    text: "Sin formularios largos ni pasos de pago complicados. Confirmás tu compra por chat en segundos.",
    icon: (
      <>
        <path d="M12 3a9 9 0 0 0-7.7 13.6L3 21l4.5-1.2A9 9 0 1 0 12 3z" />
        <path d="M8.5 9c0 4 2.5 6.5 6.5 6.5" />
      </>
    ),
  },
];

export default function Benefits() {
  return (
    <section id="beneficios" className="border-t border-ink/[0.06] bg-accent-50/30">
      <div className="container-content py-16 sm:py-20">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-semibold text-ink sm:text-3xl">
            Suplementación seria, sin vueltas
          </h2>
          <p className="mt-3 text-ink-soft">
            Una experiencia simple y transparente, desde que elegís tu producto
            hasta que llega a tu puerta.
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {BENEFITS.map((b) => (
            <div key={b.title} className="card p-6 shadow-soft">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-ink text-white">
                <svg
                  viewBox="0 0 24 24"
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  {b.icon}
                </svg>
              </div>
              <h3 className="mt-4 text-base font-semibold text-ink">{b.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                {b.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
