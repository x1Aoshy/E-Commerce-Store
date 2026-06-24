// Marca Titan Supplements. Logo recreado en SVG (dorado + verde oscuro) como
// placeholder editable. Cuando tengas el PNG/SVG real, colocalo en /public y
// reemplazá <LogoMark/> por una <img src="/logo.png" .../>.

export function LogoMark({ size = 32 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
    >
      {/* Escudo: relleno verde oscuro, borde dorado. */}
      <path
        d="M16 2.5l11 3.8v7.9c0 8-5.2 12.2-11 14.3-5.8-2.1-11-6.3-11-14.3V6.3z"
        fill="#16382b"
        stroke="#d4a82f"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      {/* Pico/cumbre dorada (fuerza). */}
      <path
        d="M10 20.5l6-10 6 10"
        fill="none"
        stroke="#e7c454"
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M12.3 20.5h7.4" stroke="#e7c454" strokeWidth="2.1" strokeLinecap="round" />
    </svg>
  );
}

export default function Logo({ size = 32, className = "" }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark size={size} />
      <span className="flex flex-col leading-none">
        <span className="text-[15px] font-extrabold tracking-wide text-accent-300">
          TITAN
        </span>
        <span className="text-[8px] font-medium tracking-[0.35em] text-ink-soft">
          SUPPLEMENTS
        </span>
      </span>
    </span>
  );
}
