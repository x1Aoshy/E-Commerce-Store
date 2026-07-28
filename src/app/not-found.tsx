import Link from "next/link";

// 404 con carácter de marca: el número gigante contorneado ocupa la pantalla y
// debajo van las DOS salidas útiles (catálogo e inicio). Un 404 sin salida es
// una visita perdida; con salida, es una visita que sigue comprando.
export default function NotFound() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 text-center">
      <span
        className="headline pointer-events-none absolute select-none text-[38vw] leading-none text-outline"
        aria-hidden="true"
      >
        404
      </span>

      <div className="relative">
        <p className="eyebrow">Error 404</p>
        <h1 className="headline mt-3 text-4xl text-ink sm:text-6xl">
          Esta página
          <br />
          no existe
        </h1>
        <p className="mx-auto mt-5 max-w-sm text-[14.5px] leading-relaxed text-ink-soft">
          El producto o la página que buscás no existe, cambió de nombre o fue
          retirada del catálogo.
        </p>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/#productos" className="btn-accent px-8 py-4 text-sm">
            Ver el catálogo
          </Link>
          <Link href="/" className="btn-ghost px-8 py-4 text-sm">
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
