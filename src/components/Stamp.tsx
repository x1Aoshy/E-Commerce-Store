// Sello circular "de etiqueta" (CALIDAD · ORIGINAL), levemente girado, como el
// estampado de un frasco de suplemento. SVG autocontenido: texto en círculo +
// doble anillo. Decorativo (aria-hidden). Server component.
export default function Stamp({
  size = 96,
  className = "",
  text = "CALIDAD PREMIUM · PRODUCTOS ORIGINALES · ",
}: {
  size?: number;
  className?: string;
  text?: string;
}) {
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={`-rotate-12 text-accent-400 ${className}`}
      aria-hidden="true"
    >
      <defs>
        <path
          id="stamp-circle"
          d="M 50,50 m -33,0 a 33,33 0 1,1 66,0 a 33,33 0 1,1 -66,0"
        />
      </defs>
      {/* Doble anillo del sello */}
      <circle cx="50" cy="50" r="47" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="50" cy="50" r="42.5" fill="none" stroke="currentColor" strokeWidth="0.8" strokeDasharray="2.5 2.5" />
      {/* Texto girando alrededor */}
      <text
        fontSize="8.2"
        fontFamily="var(--font-plexmono), ui-monospace, monospace"
        fontWeight="600"
        letterSpacing="1.4"
        fill="currentColor"
      >
        <textPath href="#stamp-circle">{text}</textPath>
      </text>
      {/* Rayo central (marca de la casa) */}
      <path
        d="M54 28 40 54h9l-4 18 15-27h-9l3-17z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}
