import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <p className="text-sm font-semibold text-accent-300">404</p>
      <h1 className="mt-2 text-2xl font-semibold text-ink">
        Página no encontrada
      </h1>
      <p className="mt-2 max-w-sm text-ink-muted">
        El producto o la página que buscás no existe o fue movida.
      </p>
      <Link href="/" className="btn-accent mt-6 px-6 py-3">
        Volver a la tienda
      </Link>
    </div>
  );
}
