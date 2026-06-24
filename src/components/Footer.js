const STORE = process.env.NEXT_PUBLIC_STORE_NAME || "Aosh Suplementos";
const PHONE = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "").replace(/[^\d]/g, "");

export default function Footer() {
  const waUrl = PHONE
    ? `https://wa.me/${PHONE}?text=${encodeURIComponent(
        "¡Hola! Tengo una consulta sobre los suplementos."
      )}`
    : "https://wa.me/";

  return (
    <footer
      id="contacto"
      className="border-t border-white/10 bg-surface/40 text-ink"
    >
      <div className="container-content py-14">
        <div className="grid gap-10 md:grid-cols-[1.5fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-2.5">
              <svg width="30" height="30" viewBox="0 0 32 32" aria-hidden="true">
                <rect width="32" height="32" rx="8" fill="#1b2125" />
                <path
                  d="M16 8c3.6 3.1 5.6 5.7 5.6 8.6A5.6 5.6 0 0 1 16 22.2a5.6 5.6 0 0 1-5.6-5.6C10.4 13.7 12.4 11.1 16 8z"
                  fill="#2bd673"
                />
              </svg>
              <span className="text-[15px] font-semibold">{STORE}</span>
            </div>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-ink-muted">
              Suplementos de alta pureza, seleccionados para acompañar tu
              entrenamiento, tu recuperación y tu salud.
            </p>
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-accent-500 px-5 py-2.5 text-sm font-semibold text-night transition hover:bg-accent-400"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 3a9 9 0 0 0-7.7 13.6L3 21l4.5-1.2A9 9 0 1 0 12 3z" />
                <path d="M8.5 9c0 4 2.5 6.5 6.5 6.5" />
              </svg>
              Escribinos por WhatsApp
            </a>
          </div>

          <div>
            <h4 className="text-sm font-semibold">Tienda</h4>
            <ul className="mt-4 space-y-2.5 text-sm text-ink-muted">
              <li>
                <a href="/#productos" className="transition hover:text-ink">
                  Productos
                </a>
              </li>
              <li>
                <a href="/#beneficios" className="transition hover:text-ink">
                  Beneficios
                </a>
              </li>
              <li>
                <a href="/admin" className="transition hover:text-ink">
                  Panel de administración
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold">Categorías</h4>
            <ul className="mt-4 space-y-2.5 text-sm text-ink-muted">
              <li>Proteínas</li>
              <li>Rendimiento</li>
              <li>Recuperación</li>
              <li>Salud</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-3 border-t border-white/10 pt-6 text-xs text-ink-muted sm:flex-row sm:items-center">
          <span>
            © {new Date().getFullYear()} {STORE}. Todos los derechos reservados.
          </span>
          <span>Hecho con cuidado · Pedidos por WhatsApp</span>
        </div>
      </div>
    </footer>
  );
}
