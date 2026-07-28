// Atmósfera de la página. Cuatro capas fijas detrás de todo (-z-10), sin
// capturar clics y sin JavaScript (server component):
//
//   1. Base de color (token, se invierte con el tema).
//   2. Rejilla técnica muy tenue — le da al fondo la métrica de un plano, que
//      es lo que hace que el contenido se sienta "compuesto" y no flotando.
//   3. Dos masas de luz que derivan lentísimo (oro y brasa). Es la capa que
//      da sensación de metraje: el fondo nunca está exactamente igual.
//   4. Grano de película por encima, que une todo y mata el degradado plano.

const NOISE_SVG = encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180">
    <filter id="grano">
      <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" stitchTiles="stitch"/>
      <feColorMatrix type="saturate" values="0"/>
    </filter>
    <rect width="100%" height="100%" filter="url(#grano)"/>
  </svg>`
);

const NOISE_URL = `url("data:image/svg+xml,${NOISE_SVG}")`;

export default function Background() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      {/* 1 · Base */}
      <div className="absolute inset-0 bg-night" />

      {/* 2 · Rejilla técnica (72px). Se desvanece hacia abajo para no competir
             con el contenido de las secciones bajas. */}
      <div
        className="absolute inset-0"
        style={{
          opacity: "var(--ambient-grid)",
          backgroundImage:
            "linear-gradient(to right, rgb(var(--c-line)) 1px, transparent 1px), linear-gradient(to bottom, rgb(var(--c-line)) 1px, transparent 1px)",
          backgroundSize: "72px 72px",
          maskImage: "linear-gradient(to bottom, #000 0%, transparent 70%)",
          WebkitMaskImage: "linear-gradient(to bottom, #000 0%, transparent 70%)",
        }}
      />

      {/* 3 · Luz viva: oro arriba a la derecha, brasa abajo a la izquierda.
             Radios enormes y opacidad baja: se percibe, no se mira. */}
      <div
        className="absolute -right-[15%] -top-[20%] h-[70vh] w-[70vw] animate-drift rounded-full blur-[120px]"
        style={{
          opacity: "var(--ambient-gold)",
          background: "radial-gradient(circle, #f0b92a 0%, transparent 65%)",
        }}
      />
      <div
        className="absolute -bottom-[25%] -left-[15%] h-[60vh] w-[60vw] animate-drift rounded-full blur-[130px]"
        style={{
          opacity: "var(--ambient-ember)",
          background: "radial-gradient(circle, #ff6b35 0%, transparent 65%)",
          animationDelay: "-9s",
          animationDuration: "31s",
        }}
      />

      {/* 4 · Grano de película */}
      <div
        className="absolute inset-0 opacity-[0.10] mix-blend-overlay"
        style={{
          backgroundImage: NOISE_URL,
          backgroundRepeat: "repeat",
          backgroundSize: "180px 180px",
        }}
      />
    </div>
  );
}
