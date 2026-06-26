"use client";

import { useEffect, useState } from "react";

const WORDS = ["PROTEÍNAS", "CREATINA", "PRE-ENTRENOS", "RESULTADOS"];
// Palabra más larga: la usamos como "molde" invisible para reservar el ancho y
// que el título no cambie de tamaño mientras se escribe/borra.
const LONGEST = WORDS.reduce((a, b) => (b.length > a.length ? b : a), "");

// Efecto máquina de escribir: escribe una palabra, la mantiene, la borra y pasa
// a la siguiente, en loop.
function useTypewriter(words, { type = 75, del = 40, hold = 1300 } = {}) {
  const [text, setText] = useState("");
  const [i, setI] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const word = words[i % words.length];
    let t;
    if (!deleting && text === word) {
      t = setTimeout(() => setDeleting(true), hold);
    } else if (deleting && text === "") {
      setDeleting(false);
      setI((v) => v + 1);
    } else {
      t = setTimeout(() => {
        setText((cur) =>
          deleting ? cur.slice(0, -1) : word.slice(0, cur.length + 1)
        );
      }, deleting ? del : type);
    }
    return () => clearTimeout(t);
  }, [text, deleting, i, words, type, del, hold]);

  return text;
}

export default function Hero() {
  const typed = useTypewriter(WORDS);

  return (
    <section id="top" className="relative overflow-hidden">
      <div className="container-content relative flex min-h-[80vh] flex-col justify-center pb-14 pt-10 sm:pt-16">
        <h1
          className="max-w-4xl animate-fade-in text-[2rem] font-extrabold leading-[1.04] text-ink min-[380px]:text-4xl sm:text-6xl md:text-7xl"
          style={{ animationDelay: "80ms", animationFillMode: "both" }}
        >
          Tu mejor versión
          <br />
          empieza con{" "}
          <span className="relative inline-block whitespace-nowrap text-accent-400">
            {/* Molde invisible: fija el ancho/alto al de la palabra más larga. */}
            <span className="invisible" aria-hidden="true">
              {LONGEST}
            </span>
            {/* Texto que se escribe, superpuesto con la misma línea base. */}
            <span className="absolute left-0 top-0 whitespace-nowrap">
              {typed}
              <span
                className="ml-1 inline-block w-[3px] animate-pulse bg-accent-400 align-[-0.1em]"
                style={{ height: "0.82em" }}
              />
            </span>
          </span>
        </h1>

        <p
          className="mt-6 max-w-xl animate-fade-in text-base leading-relaxed text-ink-soft sm:text-lg"
          style={{ animationDelay: "160ms", animationFillMode: "both" }}
        >
          Suplementos de alta pureza para entrenar, recuperarte y rendir al
          máximo. Elegí el tuyo y hacé tu pedido en segundos por WhatsApp.
        </p>

        <div
          className="mt-8 flex flex-wrap items-center gap-3 animate-fade-in"
          style={{ animationDelay: "240ms", animationFillMode: "both" }}
        >
          <a href="#productos" className="btn-accent px-6 py-3 text-[15px]">
            Ver productos
          </a>
          <a href="#beneficios" className="btn-ghost px-6 py-3 text-[15px]">
            Por qué Titan
          </a>
        </div>

        {/* Flecha animada que baja a los productos. */}
        <a
          href="#productos"
          aria-label="Ver productos"
          className="mt-16 inline-flex w-fit flex-col items-center gap-1 self-center text-ink-muted transition hover:text-accent-300"
        >
          <span className="text-[11px] uppercase tracking-[0.2em]">Mirá los productos</span>
          <svg className="animate-bounce" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M6 13l6 6 6-6" />
          </svg>
        </a>
      </div>
    </section>
  );
}
