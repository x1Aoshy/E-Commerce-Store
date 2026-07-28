"use client";

// Titular cinético: cada palabra vive dentro de una máscara y sube a su turno,
// como un cartel que se arma solo. Es el gesto que abre la página — por eso
// entra al montar (no al scroll): tiene que estar en movimiento antes de que
// el ojo se pose.
//
// Se corta por PALABRAS, no por letras: partir letra a letra rompe la lectura
// en móvil y dispara decenas de nodos animados por titular.
export default function Headline({
  text,
  className = "",
  wordClassName = "",
  delay = 0,
  step = 85,
  play = true,
}: {
  text: string;
  className?: string;
  /** Clases extra por palabra (p. ej. resaltar la última en oro). */
  wordClassName?: string;
  delay?: number;
  step?: number;
  play?: boolean;
}) {
  const words = String(text || "").split(/\s+/).filter(Boolean);

  return (
    <span className={className}>
      {words.map((word, i) => (
        <span
          key={`${word}-${i}`}
          // La máscara recorta lo que sobresale por abajo mientras la palabra
          // sube. `pb-[0.12em]` deja aire para las colas (g, y, p).
          className="mr-[0.24em] inline-block overflow-hidden pb-[0.12em] align-bottom"
        >
          <span
            className={`inline-block ${play ? "animate-word-up" : ""} ${wordClassName}`}
            style={{ animationDelay: `${delay + i * step}ms` }}
          >
            {word}
          </span>
        </span>
      ))}
    </span>
  );
}
