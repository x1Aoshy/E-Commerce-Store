-- 0001_atomic_orders.sql
-- Crea la orden, reserva el stock y cuenta el uso del cupón en UNA transacción.
--
-- QUÉ ARREGLA
-- ---------------------------------------------------------------------------
-- El camino anterior hacía read-modify-write desde la aplicación:
--
--   1. leer stock  →  2. update ... .gte('stock', qty)  →  3. insert de la orden
--
-- Tres problemas, todos reproducibles con dos compradores simultáneos:
--
--   a) SOBREVENTA SILENCIOSA. Cuando el guard `.gte()` no casaba, el UPDATE
--      afectaba 0 filas y NO devolvía error, así que la orden se insertaba
--      igual. Dos clientes podían comprar la misma última unidad.
--   b) SIN ROLLBACK. El stock se descontaba en un bucle antes del insert; si el
--      insert fallaba, el stock quedaba descontado sin orden que lo respaldara.
--   c) CUPONES POR ENCIMA DEL LÍMITE. `uses = uses + 1` calculado en JS pierde
--      incrementos concurrentes, de modo que `max_uses` se podía exceder.
--
-- CÓMO
-- ---------------------------------------------------------------------------
-- Un único `select` con `for update` bloquea todas las filas de producto
-- implicadas ANTES de comprobar nada. El `order by id` es deliberado: fija un
-- orden de adquisición de locks para que dos pedidos que compartan productos se
-- serialicen en lugar de bloquearse mutuamente (deadlock).
--
-- Con los locks tomados se valida TODO el carrito y sólo entonces se descuenta,
-- así no existe el estado intermedio "medio reservado". Cualquier excepción
-- aborta la transacción de PostgREST y revierte los descuentos.
--
-- Aplicar en Supabase → SQL Editor → New query → pegar y Run. Es idempotente.

begin;

create or replace function public.create_order_atomic(
  p_order     jsonb,
  p_reserve   boolean default false,
  p_coupon_id text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_items     jsonb := coalesce(p_order->'items', '[]'::jsonb);
  v_conflicts jsonb := '[]'::jsonb;
  v_item      jsonb;
  v_stock     integer;
  v_name      text;
  v_qty       integer;
  v_rows      integer;
  v_inserted  public.orders%rowtype;
begin
  if jsonb_array_length(v_items) = 0 then
    raise exception 'empty_cart' using errcode = 'P0001';
  end if;

  if p_reserve then
    -- Bloquea en orden de id todas las filas implicadas. Orden determinista =
    -- sin deadlocks entre pedidos concurrentes que compartan productos.
    perform 1
      from public.products
     where id in (select jsonb_array_elements(v_items)->>'id')
     order by id
       for update;

    -- Con los locks tomados, comprobar el carrito ENTERO antes de tocar nada.
    for v_item in select * from jsonb_array_elements(v_items)
    loop
      v_qty := coalesce((v_item->>'quantity')::int, 0);

      select stock, name into v_stock, v_name
        from public.products
       where id = v_item->>'id';

      if not found then
        v_conflicts := v_conflicts || jsonb_build_object(
          'id',     v_item->>'id',
          'reason', 'Producto no encontrado.'
        );
      elsif v_stock < v_qty then
        v_conflicts := v_conflicts || jsonb_build_object(
          'id',        v_item->>'id',
          'name',      v_name,
          'available', v_stock,
          'reason',    'Sólo quedan ' || v_stock || ' unidades.'
        );
      end if;
    end loop;

    if jsonb_array_length(v_conflicts) > 0 then
      -- El detalle viaja como JSON para que la app pinte qué producto falló.
      raise exception 'stock_conflict'
        using errcode = 'P0001', detail = v_conflicts::text;
    end if;

    -- Sin conflictos: ahora sí, descontar.
    for v_item in select * from jsonb_array_elements(v_items)
    loop
      update public.products
         set stock = stock - coalesce((v_item->>'quantity')::int, 0)
       where id = v_item->>'id';
    end loop;
  end if;

  -- Cupón: el incremento y la comprobación de max_uses ocurren en el mismo
  -- UPDATE, así que no hay ventana entre "leer uses" y "escribir uses + 1".
  if p_coupon_id is not null then
    update public.coupons
       set uses = uses + 1
     where id = p_coupon_id
       and (max_uses is null or uses < max_uses);

    get diagnostics v_rows = row_count;
    if v_rows = 0 then
      raise exception 'coupon_exhausted' using errcode = 'P0001';
    end if;
  end if;

  -- Columnas explícitas a propósito: `jsonb_populate_record` dejaría que quien
  -- llame fije cualquier columna de la tabla, incluidas las que no debería.
  insert into public.orders (
    id, code, items, total, status, customer,
    payment_method, extra, extra_label, seller, token, paid, coupon, discount
  ) values (
    p_order->>'id',
    p_order->>'code',
    coalesce(p_order->'items', '[]'::jsonb),
    coalesce((p_order->>'total')::int, 0),
    coalesce(p_order->>'status', 'pendiente'),
    coalesce(p_order->'customer', '{}'::jsonb),
    nullif(p_order->>'payment_method', ''),
    coalesce((p_order->>'extra')::int, 0),
    coalesce(p_order->>'extra_label', ''),
    coalesce(p_order->>'seller', ''),
    p_order->>'token',
    coalesce((p_order->>'paid')::boolean, false),
    coalesce(p_order->>'coupon', ''),
    coalesce((p_order->>'discount')::int, 0)
  )
  returning * into v_inserted;

  return to_jsonb(v_inserted);
end;
$$;

-- La tienda llama a esta función con la service role desde el servidor. Nadie
-- más necesita ejecutarla, y al ser SECURITY DEFINER conviene no regalarla.
revoke all on function public.create_order_atomic(jsonb, boolean, text) from public, anon, authenticated;
grant execute on function public.create_order_atomic(jsonb, boolean, text) to service_role;

commit;
