// Spinner SSR-safe (sin "use client": es puramente presentacional). Anillo
// giratorio en `currentColor`; el tamaño se controla con className.

export default function Spinner({ className = "" }) {
  return (
    <svg
      className={`spin-ring h-5 w-5 ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      role="status"
      aria-label="Cargando"
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

// Bloque centrado con fade-in suave para mostrar dentro de un panel mientras
// cargan datos. No es un modal de pantalla completa.
export function LoadingOverlay({ label = "Cargando…" }) {
  return (
    <div className="flex animate-fade-in flex-col items-center justify-center gap-3 px-6 py-12 text-center">
      <Spinner className="h-6 w-6 text-accent-300" />
      <p className="text-sm text-ink-muted">{label}</p>
    </div>
  );
}
