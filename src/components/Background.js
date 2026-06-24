// Fondo decorativo del sitio: gradiente cálido muy tenue + textura de grano
// (ruido fractal) para dar profundidad y un toque orgánico tipo "tierra".
// Es puramente visual: va detrás de todo (-z-10), fijo al viewport y sin
// capturar clics. Server component (no necesita JS en el cliente).

// Textura de ruido generada con feTurbulence y embebida como data-uri.
// fractalNoise + baseFrequency alto da un grano fino y parejo; la opacidad
// baja del SVG (ver className) evita que ensucie la lectura del contenido.
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
      {/* (a) Gradiente base: blanco cálido hacia un mint apenas perceptible y un
          beige/tierra muy tenue. Bajo contraste, pensado para tema claro. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, #fafaf8 0%, #f0faf6 45%, #f7f5f0 100%)",
        }}
      />

      {/* (c) Blobs grandes muy difuminados para sumar profundidad. Opacidad muy
          baja y sin glow: solo insinúan color en las esquinas. */}
      <div className="absolute -left-32 -top-40 h-[40rem] w-[40rem] rounded-full bg-accent-200/20 blur-3xl" />
      <div className="absolute -bottom-48 -right-40 h-[44rem] w-[44rem] rounded-full bg-accent-100/25 blur-3xl" />

      {/* (b) Grano/ruido fino mezclado por encima, a baja opacidad. Se repite en
          mosaico para cubrir cualquier tamaño de viewport. */}
      <div
        className="absolute inset-0 opacity-[0.045] mix-blend-multiply"
        style={{
          backgroundImage: NOISE_URL,
          backgroundRepeat: "repeat",
          backgroundSize: "180px 180px",
        }}
      />
    </div>
  );
}
