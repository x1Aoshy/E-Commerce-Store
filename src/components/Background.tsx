// Atmósfera de la página: tres capas fijas detrás de todo (-z-10), sin capturar
// clics y sin JavaScript (server component).
//
// RENDIMIENTO — por qué esto ya no se mueve:
// La versión anterior animaba dos masas de luz de 70vh × 70vw con blur de
// 120px. Un desenfoque de ese radio obliga al navegador a re-samplear una
// superficie enorme en CADA cuadro, y encima iba con `mix-blend-mode` encima,
// lo que arrastra a recomponer toda la ventana. En un teléfono eso se come el
// hilo de composición y el scroll empieza a saltar.
//
// Ahora las mismas manchas son gradientes ESTÁTICOS: se pintan una vez, quedan
// cacheadas como textura y cuestan cero durante el scroll. Visualmente el
// resultado es casi idéntico — esa luz nunca se percibió moviéndose, sólo se
// sentía como profundidad, y eso se logra igual sin animar nada.

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
      {/* 1 · Base + luz. Las dos manchas van como gradientes de la MISMA capa:
             un solo elemento pintado una vez, en lugar de dos capas
             desenfocadas superpuestas. */}
      <div
        className="absolute inset-0 bg-night"
        style={{
          backgroundImage:
            "radial-gradient(70vw 60vh at 85% -10%, rgb(240 185 42 / var(--ambient-gold)), transparent 60%), radial-gradient(60vw 55vh at 10% 110%, rgb(255 107 53 / var(--ambient-ember)), transparent 60%)",
        }}
      />

      {/* 2 · Rejilla técnica (72px), desvanecida hacia abajo para no competir
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

      {/* 3 · Grano de película. Sin `mix-blend-mode`: mezclar toda la ventana
             es de lo más caro que se le puede pedir al compositor, y a esta
             opacidad la diferencia no se ve. */}
      <div
        className="absolute inset-0 opacity-[0.055]"
        style={{
          backgroundImage: NOISE_URL,
          backgroundRepeat: "repeat",
          backgroundSize: "180px 180px",
        }}
      />
    </div>
  );
}
