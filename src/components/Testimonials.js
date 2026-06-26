import Reveal from "./Reveal";

// =====================================================================
//  IMPORTANTE (para el dueño de la tienda):
//  Estas reseñas son un EJEMPLO / plantilla. Reemplazalas por mensajes
//  REALES de tus clientes (ej. capturas de WhatsApp). No dejes testimonios
//  inventados publicados: la idea es mostrar prueba social verdadera.
// =====================================================================
const TESTIMONIALS = [
  {
    name: "Cliente de ejemplo",
    role: "Reemplazá con una reseña real",
    text: "La proteína llegó al día siguiente y el asesoramiento por WhatsApp fue clave para elegir bien. Volvería a comprar.",
  },
  {
    name: "Cliente de ejemplo",
    role: "Reemplazá con una reseña real",
    text: "Productos originales y precios justos. Me ayudaron a armar mi combo de creatina y pre-entreno sin problemas.",
  },
  {
    name: "Cliente de ejemplo",
    role: "Reemplazá con una reseña real",
    text: "Atención rápida y honesta. Pedí por el chat, confirmé y me llegó en tiempo. Recomendados.",
  },
];

function initials(name) {
  return (name || "?")
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function Testimonials() {
  return (
    <section className="border-t border-white/10 bg-white/[0.015]">
      <div className="container-content py-16 sm:py-20">
        <Reveal className="max-w-2xl">
          <h2 className="text-2xl font-semibold text-ink sm:text-3xl">
            Lo que dicen nuestros clientes
          </h2>
          <p className="mt-3 text-ink-soft">
            Personas reales entrenando con suplementos de verdad.
          </p>
        </Reveal>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <Reveal key={i} delay={i * 80}>
              <figure className="card h-full p-6 shadow-soft">
                <div className="flex gap-0.5 text-accent-400" aria-label="5 de 5">
                  {Array.from({ length: 5 }).map((_, s) => (
                    <svg
                      key={s}
                      viewBox="0 0 24 24"
                      className="h-4 w-4"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path d="m12 2 3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.27 5.82 22 7 14.14l-5-4.87 6.91-1.01z" />
                    </svg>
                  ))}
                </div>
                <blockquote className="mt-4 text-sm leading-relaxed text-ink-soft">
                  “{t.text}”
                </blockquote>
                <figcaption className="mt-5 flex items-center gap-3 border-t border-white/10 pt-4">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-500/15 text-xs font-semibold text-accent-300 ring-1 ring-accent-500/25">
                    {initials(t.name)}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-ink">
                      {t.name}
                    </span>
                    <span className="block text-xs text-ink-muted">{t.role}</span>
                  </span>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
