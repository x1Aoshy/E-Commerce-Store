// Ilustración de producto autocontenida (sin imágenes externas), variando el
// ícono según la categoría. Si un producto tiene `image` (URL), se usa esa.

const ICONS = {
  Proteínas: (
    <>
      <path d="M20 26h24v26a4 4 0 0 1-4 4H24a4 4 0 0 1-4-4z" />
      <path d="M18 20h28v6H18z" />
      <path d="M27 38h10M27 45h7" />
    </>
  ),
  Rendimiento: <path d="M34 10 18 36h12l-4 18 20-30H32z" />,
  Recuperación: (
    <path d="M32 12c8 10 12 16 12 22a12 12 0 0 1-24 0c0-6 4-12 12-22z" />
  ),
  Salud: (
    <>
      <path d="M20 44c0-14 12-24 26-24 0 14-10 26-26 24z" />
      <path d="M26 39c6-4 10-9 12-15" />
    </>
  ),
  default: (
    <>
      <path d="M20 26h24v26a4 4 0 0 1-4 4H24a4 4 0 0 1-4-4z" />
      <path d="M18 20h28v6H18z" />
    </>
  ),
};

export default function ProductImage({ product, className = "" }) {
  const category = product?.category || "default";
  if (product?.image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={product.image}
        alt={product.name || ""}
        className={`h-full w-full object-cover ${className}`}
      />
    );
  }
  const icon = ICONS[category] || ICONS.default;
  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden bg-gradient-to-br from-accent-50 to-white ${className}`}
    >
      <div className="absolute h-28 w-28 rounded-full bg-accent-100/50 blur-2xl" />
      <svg
        viewBox="0 0 64 64"
        className="relative h-20 w-20 text-ink/75"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {icon}
      </svg>
    </div>
  );
}
