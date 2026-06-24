// Fondo decorativo (tema oscuro Titan): grafito profundo plano + textura de
// grano ("granizado"). Sin glows ni blobs difuminados: la profundidad viene del
// grano. Puramente visual: detrás de todo (-z-10), fijo y sin capturar clics.
// Server component.

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
      {/* Base grafito casi plana: gradiente muy sutil, casi sólido. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, #0a0c0d 0%, #0b0e0f 58%, #0c1011 100%)",
        }}
      />

      {/* Grano fino por encima: el "granizado" da la profundidad. */}
      <div
        className="absolute inset-0 opacity-[0.09]"
        style={{
          backgroundImage: NOISE_URL,
          backgroundRepeat: "repeat",
          backgroundSize: "180px 180px",
        }}
      />
    </div>
  );
}
