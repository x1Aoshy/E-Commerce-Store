-- ============================================================================
--  Aosh Suplementos — Esquema de base de datos (Supabase / Postgres)
--
--  Cómo usarlo:
--    1. Entrá a tu proyecto en Supabase.
--    2. Menú lateral → "SQL Editor" → "New query".
--    3. Pegá TODO este archivo y apretá "Run".
--
--  Es idempotente: lo podés correr más de una vez sin romper nada (las tablas
--  se crean sólo si no existen y el catálogo inicial no se duplica).
-- ============================================================================

-- 1) Productos ---------------------------------------------------------------
create table if not exists public.products (
  id          text primary key,
  slug        text unique not null,
  name        text not null,
  category    text not null default 'General',
  price       integer not null default 0,   -- precio en unidades enteras (sin decimales)
  stock       integer not null default 0,
  featured    boolean not null default false,
  short       text not null default '',
  description text not null default '',
  created_at  timestamptz not null default now()
);

-- 2) Órdenes / pedidos -------------------------------------------------------
create table if not exists public.orders (
  id          text primary key,
  code        text not null,
  items       jsonb not null default '[]'::jsonb,   -- [{id,name,price,quantity,subtotal}]
  total       integer not null default 0,
  status      text not null default 'pendiente',     -- 'pendiente' | 'confirmada'
  customer    jsonb not null default '{}'::jsonb,     -- {name, note}
  created_at  timestamptz not null default now()
);

-- 3) Seguridad (RLS) ---------------------------------------------------------
--  Activamos Row Level Security y NO creamos políticas públicas. El sitio
--  accede con la service role key (sólo del servidor), que omite RLS. Así la
--  clave pública (anon) no puede leer ni escribir la base directamente.
alter table public.products enable row level security;
alter table public.orders   enable row level security;

-- 4) Catálogo inicial de ejemplo --------------------------------------------
--  Podés editarlo/borrarlo después desde el panel /admin.
insert into public.products (id, slug, name, category, price, stock, featured, short, description) values
  ('p1','proteina-whey-isolate','Proteína Whey Isolate','Proteínas',24990,32,true,'Aislado de suero de alta pureza · 27g por porción.','Aislado de suero de leche de alta pureza con 27g de proteína por porción y mínima cantidad de grasas y carbohidratos. Sabor vainilla natural, sin azúcar agregada. Ideal post-entreno para recuperación y construcción muscular.'),
  ('p2','creatina-monohidrato','Creatina Monohidrato','Rendimiento',15990,45,true,'Creatina micronizada 100% pura · 100 porciones.','Creatina monohidrato micronizada 100% pura. Mejora la fuerza, la potencia y el rendimiento en entrenamientos de alta intensidad. Sin sabor, se mezcla fácil con agua o tu batido. 100 porciones.'),
  ('p3','pre-entreno-ignite','Pre-Entreno Ignite','Rendimiento',19990,18,true,'Energía y foco sostenido · sin caída brusca.','Fórmula de pre-entrenamiento con cafeína, beta-alanina y citrulina malato para energía limpia, foco y mejor bombeo muscular. Energía sostenida sin la caída brusca de otros pre-entrenos. Sabor frutos rojos.'),
  ('p4','omega-3-ultra','Omega 3 Ultra','Salud',12990,60,false,'1000mg EPA+DHA · salud cardiovascular.','Aceite de pescado purificado con 1000mg de EPA+DHA por porción. Apoya la salud cardiovascular, articular y cognitiva. Libre de metales pesados, con certificación de pureza.'),
  ('p5','multivitaminico-daily','Multivitamínico Daily','Salud',9990,50,false,'23 vitaminas y minerales · 1 cápsula al día.','23 vitaminas y minerales esenciales en una sola cápsula diaria. Apoya los niveles de energía, el sistema inmune y el bienestar general. Pensado para complementar tu alimentación del día a día.'),
  ('p6','bcaa-2-1-1','BCAA 2:1:1','Recuperación',17990,0,false,'Aminoácidos ramificados · sabor sandía.','Aminoácidos ramificados en proporción 2:1:1 (leucina, isoleucina, valina) para reducir el catabolismo y acelerar la recuperación muscular. Sabor sandía, sin azúcar. Ideal durante el entrenamiento.'),
  ('p7','colageno-hidrolizado-magnesio','Colágeno Hidrolizado + Magnesio','Salud',16990,27,true,'Colágeno tipo I y II con magnesio y vitamina C.','Colágeno hidrolizado tipo I y II combinado con magnesio y vitamina C para una mejor absorción. Apoya la salud de la piel, articulaciones, huesos y tejido conectivo. Sin sabor, fácil de disolver.'),
  ('p8','glutamina-pura','Glutamina Pura','Recuperación',13990,22,false,'L-Glutamina micronizada · sin sabor.','L-Glutamina micronizada para apoyar la recuperación muscular y la salud intestinal e inmune. Sin sabor, se integra fácilmente a cualquier líquido. Ideal en etapas de entrenamiento intenso.')
on conflict (id) do nothing;
