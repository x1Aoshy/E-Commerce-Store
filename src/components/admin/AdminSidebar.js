"use client";

// Barra lateral fija (no desplegable). Es un rail de íconos: al hacer hover
// sobre un ítem aparece su nombre a la derecha con una transición suave
// (fade + slide). En mobile se convierte en una barra inferior fija para no
// invadir el contenido, manteniendo los mismos íconos.

const ICON_PROPS = {
  width: 22,
  height: 22,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
};

function ResumenIcon() {
  return (
    <svg {...ICON_PROPS}>
      <rect x="3" y="3" width="7.5" height="7.5" rx="1.5" />
      <rect x="13.5" y="3" width="7.5" height="4.5" rx="1.5" />
      <rect x="13.5" y="11" width="7.5" height="10" rx="1.5" />
      <rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5" />
    </svg>
  );
}

function InventarioIcon() {
  return (
    <svg {...ICON_PROPS}>
      <path d="M3 8.5 12 4l9 4.5-9 4.5-9-4.5z" />
      <path d="M3 8.5v7L12 20l9-4.5v-7" />
      <path d="M12 13v7" />
    </svg>
  );
}

function OrdenesIcon() {
  return (
    <svg {...ICON_PROPS}>
      <path d="M5 3.5h11l3 3V20a.5.5 0 0 1-.75.43L16.5 19l-1.75 1.4a.5.5 0 0 1-.62 0L12 19l-2.13 1.4a.5.5 0 0 1-.62 0L7.5 19l-1.75 1.43A.5.5 0 0 1 5 20V3.5z" />
      <path d="M8.5 8.5h7" />
      <path d="M8.5 12h7" />
    </svg>
  );
}

function StoreIcon() {
  return (
    <svg {...ICON_PROPS}>
      <path d="M4 9.5V20a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V9.5" />
      <path d="M3 9.5 4.5 4h15L21 9.5a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0z" />
    </svg>
  );
}

function ExternalIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M9 6h9v9" />
      <path d="M18 6 7 17" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg {...ICON_PROPS}>
      <path d="M14 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4" />
      <path d="M10 8 6 12l4 4" />
      <path d="M6 12h11" />
    </svg>
  );
}

const NAV_ITEMS = [
  { key: "resumen", label: "Resumen", Icon: ResumenIcon },
  { key: "inventario", label: "Inventario", Icon: InventarioIcon },
  { key: "ordenes", label: "Órdenes", Icon: OrdenesIcon },
];

// Etiqueta que aparece a la derecha del ícono al hacer hover/focus.
// Usa group-hover/group-focus-within para el fade + slide suave.
function HoverLabel({ children, tone = "ink" }) {
  const base =
    "pointer-events-none absolute left-full top-1/2 z-50 ml-3 hidden -translate-y-1/2 -translate-x-1 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-[12px] font-medium opacity-0 shadow-soft transition-all duration-200 ease-out group-hover:translate-x-0 group-hover:opacity-100 group-focus-within:translate-x-0 group-focus-within:opacity-100 md:block";
  const tones = {
    ink: "bg-ink text-white",
    accent: "bg-accent-600 text-white",
    danger: "bg-red-600 text-white",
  };
  return <span className={`${base} ${tones[tone] || tones.ink}`}>{children}</span>;
}

export default function AdminSidebar({ active, onChange, onLogout, pending = 0 }) {
  return (
    <nav
      aria-label="Navegación del panel"
      className="fixed inset-x-0 bottom-0 z-40 flex h-16 flex-row items-center justify-around border-t border-ink/[0.08] bg-white px-2 md:inset-y-0 md:left-0 md:right-auto md:h-screen md:w-16 md:flex-col md:justify-start md:gap-1.5 md:border-r md:border-t-0 md:py-4"
    >
      {/* Logo de la tienda (sólo en desktop, arriba del rail). */}
      <div className="hidden md:mb-3 md:flex md:h-10 md:w-10 md:items-center md:justify-center">
        <svg width="30" height="30" viewBox="0 0 32 32" aria-hidden="true">
          <rect width="32" height="32" rx="8" fill="#15191c" />
          <path
            d="M16 8c3.6 3.1 5.6 5.7 5.6 8.6A5.6 5.6 0 0 1 16 22.2a5.6 5.6 0 0 1-5.6-5.6C10.4 13.7 12.4 11.1 16 8z"
            fill="#2f9d77"
          />
        </svg>
      </div>

      {NAV_ITEMS.map(({ key, label, Icon }) => {
        const isActive = active === key;
        return (
          <div key={key} className="group relative">
            <button
              type="button"
              onClick={() => onChange(key)}
              aria-label={label}
              aria-current={isActive ? "page" : undefined}
              className={`relative flex h-11 w-11 items-center justify-center rounded-xl transition-colors duration-200 ${
                isActive
                  ? "bg-ink text-white"
                  : "text-ink-soft hover:bg-accent-50 hover:text-accent-700"
              }`}
            >
              <Icon />
              {key === "ordenes" && pending > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-accent-500 px-1 text-[10px] font-semibold text-white ring-2 ring-white">
                  {pending}
                </span>
              )}
            </button>
            <HoverLabel>{label}</HoverLabel>
          </div>
        );
      })}

      {/* Separador flexible: empuja las acciones al fondo en desktop. */}
      <div className="hidden md:block md:flex-1" />

      {/* Ver tienda */}
      <div className="group relative">
        <a
          href="/"
          aria-label="Ver tienda"
          className="relative flex h-11 w-11 items-center justify-center rounded-xl text-ink-soft transition-colors duration-200 hover:bg-accent-50 hover:text-accent-700"
        >
          <StoreIcon />
        </a>
        <HoverLabel tone="accent">
          <span className="inline-flex items-center gap-1.5">
            Ver tienda <ExternalIcon />
          </span>
        </HoverLabel>
      </div>

      {/* Salir */}
      <div className="group relative">
        <button
          type="button"
          onClick={onLogout}
          aria-label="Salir"
          className="relative flex h-11 w-11 items-center justify-center rounded-xl text-ink-soft transition-colors duration-200 hover:bg-red-50 hover:text-red-600"
        >
          <LogoutIcon />
        </button>
        <HoverLabel tone="danger">Salir</HoverLabel>
      </div>
    </nav>
  );
}
