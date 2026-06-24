// Fondo decorativo del sitio (tema OSCURO premium): grafito profundo con un
// glow verde muy sutil + textura de grano (ruido fractal) para dar profundidad
// y un toque orgánico. Puramente visual: va detrás de todo (-z-10), fijo al
// viewport y sin capturar clics. Server component (no necesita JS en cliente).

// Textura de ruido generada con feTurbulence y embebida como data-uri. En
// oscuro va sin blend "multiply" (que la ocultaría): el grano gris aclara
// apenas el fondo a baja opacidad.
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
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* (a) Base grafito con un glow verde tenue arriba a la derecha. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 80% at 82% -8%, rgba(23,189,96,0.10) 0%, rgba(10,12,13,0) 46%), linear-gradient(180deg, #0b0e0f 0%, #090b0c 58%, #0c1011 100%)",
        }}
      />

      {/* (c) Blobs muy difuminados y de baja opacidad para sumar profundidad,
          sin glow exagerado. */}
      <div className="absolute -left-40 top-1/4 h-[42rem] w-[42rem] rounded-full bg-accent-500/[0.07] blur-3xl" />
      <div className="absolute -bottom-56 -right-44 h-[46rem] w-[46rem] rounded-full bg-accent-400/[0.05] blur-3xl" />

      {/* (b) Grano fino por encima, a baja opacidad, en mosaico. */}
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage: NOISE_URL,
          backgroundRepeat: "repeat",
          backgroundSize: "180px 180px",
        }}
      />
    </div>
  );
}
