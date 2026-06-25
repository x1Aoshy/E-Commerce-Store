-- ============================================================================
--  Titan Supplements — Esquema de base de datos (Supabase / Postgres)
--
--  Cómo usarlo:
--    1. Entrá a tu proyecto en Supabase.
--    2. Menú lateral → "SQL Editor" → "New query".
--    3. Pegá TODO este archivo y apretá "Run".
--
--  Es idempotente: lo podés correr más de una vez sin romper nada.
--
--  ¿YA tenías la base creada antes? Corré igual este archivo: la sección 2.b
--  (MIGRACIÓN) agrega las columnas nuevas (método de pago, cargo extra,
--  vendedor y descuentos) sin borrar tus datos.
-- ============================================================================

-- 1) Productos ---------------------------------------------------------------
create table if not exists public.products (
  id          text primary key,
  slug        text unique not null,
  name        text not null,
  category    text not null default 'General',
  price       integer not null default 0,   -- precio en enteros (sin decimales)
  stock       integer not null default 0,
  featured    boolean not null default false,
  short       text not null default '',
  description text not null default '',
  compare_at  integer not null default 0,   -- precio anterior (para mostrar descuentos OFF)
  created_at  timestamptz not null default now()
);

-- 2.a) Órdenes / pedidos -----------------------------------------------------
create table if not exists public.orders (
  id             text primary key,
  code           text not null,
  items          jsonb not null default '[]'::jsonb,  -- [{id,name,price,quantity,subtotal}]
  total          integer not null default 0,          -- subtotal de productos
  status         text not null default 'pendiente',   -- pendiente | confirmada | cancelada
  customer       jsonb not null default '{}'::jsonb,   -- {name, note}
  payment_method text,                                 -- efectivo | transferencia | null
  extra          integer not null default 0,           -- cargo extra (ej. delivery)
  extra_label    text not null default '',             -- nombre del cargo extra
  seller         text not null default '',             -- quién facturó / atendió la venta
  created_at     timestamptz not null default now()
);

-- 2.b) MIGRACIÓN (para bases creadas antes): agrega las columnas nuevas. -----
alter table public.orders add column if not exists payment_method text;
alter table public.orders add column if not exists extra integer not null default 0;
alter table public.orders add column if not exists extra_label text not null default '';
alter table public.orders add column if not exists seller text not null default '';
alter table public.products add column if not exists compare_at integer not null default 0;

-- 3) Seguridad (RLS) ---------------------------------------------------------
alter table public.products enable row level security;
alter table public.orders   enable row level security;

-- 4) Catálogo inicial de ejemplo (precios en córdobas, ~1.000 a 3.000) -------
insert into public.products (id, slug, name, category, price, stock, featured, short, description) values
  ('p1','proteina-whey-isolate','Proteína Whey Isolate','Proteínas',2500,32,true,'Aislado de suero de alta pureza · 27g por porción.','Aislado de suero de leche de alta pureza con 27g de proteína por porción y mínima cantidad de grasas y carbohidratos. Sabor vainilla natural, sin azúcar agregada. Ideal post-entreno para recuperación y construcción muscular.'),
  ('p2','creatina-monohidrato','Creatina Monohidrato','Rendimiento',1800,45,true,'Creatina micronizada 100% pura · 100 porciones.','Creatina monohidrato micronizada 100% pura. Mejora la fuerza, la potencia y el rendimiento en entrenamientos de alta intensidad. Sin sabor, se mezcla fácil con agua o tu batido. 100 porciones.'),
  ('p3','pre-entreno-ignite','Pre-Entreno Ignite','Rendimiento',2200,18,true,'Energía y foco sostenido · sin caída brusca.','Fórmula de pre-entrenamiento con cafeína, beta-alanina y citrulina malato para energía limpia, foco y mejor bombeo muscular. Energía sostenida sin la caída brusca de otros pre-entrenos. Sabor frutos rojos.'),
  ('p4','omega-3-ultra','Omega 3 Ultra','Salud',1200,60,false,'1000mg EPA+DHA · salud cardiovascular.','Aceite de pescado purificado con 1000mg de EPA+DHA por porción. Apoya la salud cardiovascular, articular y cognitiva. Libre de metales pesados, con certificación de pureza.'),
  ('p5','multivitaminico-daily','Multivitamínico Daily','Salud',1000,50,false,'23 vitaminas y minerales · 1 cápsula al día.','23 vitaminas y minerales esenciales en una sola cápsula diaria. Apoya los niveles de energía, el sistema inmune y el bienestar general. Pensado para complementar tu alimentación del día a día.'),
  ('p6','bcaa-2-1-1','BCAA 2:1:1','Recuperación',1900,12,false,'Aminoácidos ramificados · sabor sandía.','Aminoácidos ramificados en proporción 2:1:1 (leucina, isoleucina, valina) para reducir el catabolismo y acelerar la recuperación muscular. Sabor sandía, sin azúcar. Ideal durante el entrenamiento.'),
  ('p7','colageno-hidrolizado-magnesio','Colágeno Hidrolizado + Magnesio','Salud',1600,27,true,'Colágeno tipo I y II con magnesio y vitamina C.','Colágeno hidrolizado tipo I y II combinado con magnesio y vitamina C para una mejor absorción. Apoya la salud de la piel, articulaciones, huesos y tejido conectivo. Sin sabor, fácil de disolver.'),
  ('p8','glutamina-pura','Glutamina Pura','Recuperación',1400,22,false,'L-Glutamina micronizada · sin sabor.','L-Glutamina micronizada para apoyar la recuperación muscular y la salud intestinal e inmune. Sin sabor, se integra fácilmente a cualquier líquido. Ideal en etapas de entrenamiento intenso.')
on conflict (id) do nothing;
