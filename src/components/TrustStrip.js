// Tira de confianza: propuestas de valor reales (no inventamos números). Va
// justo debajo del hero para reforzar por qué comprar acá.
const BADGES = [
  {
    title: "Productos originales",
    text: "Marcas y materias primas seleccionadas.",
    icon: (
      <>
        <path d="M12 3 4 6v6c0 5 3.4 8 8 9 4.6-1 8-4 8-9V6z" />
        <path d="m9 12 2 2 4-4" />
      </>
    ),
  },
  {
    title: "Envío en 24h",
    text: "Despachamos al confirmar tu pedido.",
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
    title: "Atención por WhatsApp",
    text: "Te asesoramos antes y después de comprar.",
    icon: (
      <>
        <path d="M12 3a9 9 0 0 0-7.7 13.6L3 21l4.5-1.2A9 9 0 1 0 12 3z" />
        <path d="M8.5 9c0 4 2.5 6.5 6.5 6.5" />
      </>
    ),
  },
  {
    title: "Compra sin vueltas",
    text: "Pedís por chat, sin formularios largos.",
    icon: (
      <>
        <path d="m5 13 4 4L19 7" />
      </>
    ),
  },
];

export default function TrustStrip() {
  return (
    <section className="border-y border-white/10 bg-white/[0.02]">
      <div className="container-content grid grid-cols-2 gap-x-4 gap-y-5 py-6 sm:grid-cols-4 sm:py-7">
        {BADGES.map((b) => (
          <div key={b.title} className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[4px] bg-accent-500/15 text-accent-300 ring-1 ring-accent-500/25">
              <svg
                viewBox="0 0 24 24"
                width="18"
                height="18"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                {b.icon}
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-semibold leading-tight text-ink">
                {b.title}
              </p>
              <p className="truncate text-xs text-ink-muted">{b.text}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
