// Fondo decorativo (tema oscuro Titan): grafito profundo con glows sutiles en
// dorado y verde + textura de grano. Puramente visual: detrás de todo (-z-10),
// fijo y sin capturar clics. Server component.

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
      {/* Base grafito con un glow dorado tenue arriba a la derecha. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 80% at 84% -8%, rgba(201,154,43,0.10) 0%, rgba(10,12,13,0) 46%), linear-gradient(180deg, #0b0e0f 0%, #090b0c 58%, #0c1011 100%)",
        }}
      />

      {/* Blobs muy difuminados: verde (marca) y dorado, baja opacidad. */}
      <div className="absolute -left-40 top-1/4 h-[42rem] w-[42rem] rounded-full bg-green-600/[0.07] blur-3xl" />
      <div className="absolute -bottom-56 -right-44 h-[46rem] w-[46rem] rounded-full bg-accent-500/[0.05] blur-3xl" />

      {/* Grano fino por encima. */}
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
