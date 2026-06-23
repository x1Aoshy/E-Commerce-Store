// Catálogo inicial de ejemplo. Editá libremente estos productos desde el
// panel /admin (los cambios se guardan en data/store.json) o cambiá la
// semilla acá y borrá data/store.json para regenerar el catálogo.

export const seedProducts = [
  {
    id: "p1",
    slug: "proteina-whey-isolate",
    name: "Proteína Whey Isolate",
    category: "Proteínas",
    price: 24990,
    stock: 32,
    featured: true,
    short: "Aislado de suero de alta pureza · 27g por porción.",
    description:
      "Aislado de suero de leche de alta pureza con 27g de proteína por porción y mínima cantidad de grasas y carbohidratos. Sabor vainilla natural, sin azúcar agregada. Ideal post-entreno para recuperación y construcción muscular.",
  },
  {
    id: "p2",
    slug: "creatina-monohidrato",
    name: "Creatina Monohidrato",
    category: "Rendimiento",
    price: 15990,
    stock: 45,
    featured: true,
    short: "Creatina micronizada 100% pura · 100 porciones.",
    description:
      "Creatina monohidrato micronizada 100% pura. Mejora la fuerza, la potencia y el rendimiento en entrenamientos de alta intensidad. Sin sabor, se mezcla fácil con agua o tu batido. 100 porciones.",
  },
  {
    id: "p3",
    slug: "pre-entreno-ignite",
    name: "Pre-Entreno Ignite",
    category: "Rendimiento",
    price: 19990,
    stock: 18,
    featured: true,
    short: "Energía y foco sostenido · sin caída brusca.",
    description:
      "Fórmula de pre-entrenamiento con cafeína, beta-alanina y citrulina malato para energía limpia, foco y mejor bombeo muscular. Energía sostenida sin la caída brusca de otros pre-entrenos. Sabor frutos rojos.",
  },
  {
    id: "p4",
    slug: "omega-3-ultra",
    name: "Omega 3 Ultra",
    category: "Salud",
    price: 12990,
    stock: 60,
    featured: false,
    short: "1000mg EPA+DHA · salud cardiovascular.",
    description:
      "Aceite de pescado purificado con 1000mg de EPA+DHA por porción. Apoya la salud cardiovascular, articular y cognitiva. Libre de metales pesados, con certificación de pureza.",
  },
  {
    id: "p5",
    slug: "multivitaminico-daily",
    name: "Multivitamínico Daily",
    category: "Salud",
    price: 9990,
    stock: 50,
    featured: false,
    short: "23 vitaminas y minerales · 1 cápsula al día.",
    description:
      "23 vitaminas y minerales esenciales en una sola cápsula diaria. Apoya los niveles de energía, el sistema inmune y el bienestar general. Pensado para complementar tu alimentación del día a día.",
  },
  {
    id: "p6",
    slug: "bcaa-2-1-1",
    name: "BCAA 2:1:1",
    category: "Recuperación",
    price: 17990,
    stock: 0,
    featured: false,
    short: "Aminoácidos ramificados · sabor sandía.",
    description:
      "Aminoácidos ramificados en proporción 2:1:1 (leucina, isoleucina, valina) para reducir el catabolismo y acelerar la recuperación muscular. Sabor sandía, sin azúcar. Ideal durante el entrenamiento.",
  },
  {
    id: "p7",
    slug: "colageno-hidrolizado-magnesio",
    name: "Colágeno Hidrolizado + Magnesio",
    category: "Salud",
    price: 16990,
    stock: 27,
    featured: true,
    short: "Colágeno tipo I y II con magnesio y vitamina C.",
    description:
      "Colágeno hidrolizado tipo I y II combinado con magnesio y vitamina C para una mejor absorción. Apoya la salud de la piel, articulaciones, huesos y tejido conectivo. Sin sabor, fácil de disolver.",
  },
  {
    id: "p8",
    slug: "glutamina-pura",
    name: "Glutamina Pura",
    category: "Recuperación",
    price: 13990,
    stock: 22,
    featured: false,
    short: "L-Glutamina micronizada · sin sabor.",
    description:
      "L-Glutamina micronizada para apoyar la recuperación muscular y la salud intestinal e inmune. Sin sabor, se integra fácilmente a cualquier líquido. Ideal en etapas de entrenamiento intenso.",
  },
];
