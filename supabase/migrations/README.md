# Migraciones

`schema.sql` crea la base desde cero. Los archivos de esta carpeta son cambios
posteriores que hay que aplicar **en orden** sobre una base ya existente.

Cómo aplicarlos: Supabase → **SQL Editor** → *New query* → pegar el archivo
completo → **Run**. Todos son idempotentes.

| Archivo | Qué hace | ¿Obligatorio? |
|---|---|---|
| `0001_atomic_orders.sql` | Función `create_order_atomic`: reserva de stock, alta de la orden y conteo del cupón en una sola transacción. | **Sí** |

---

## ⚠️ 0001 hay que correrlo junto con el deploy

`src/lib/db.ts` ya **no** descuenta stock desde JS: llama a
`create_order_atomic`. Si desplegás el código sin correr la migración, el
checkout falla con un error explícito que apunta a este archivo.

Es a propósito. El camino anterior era el que sobrevendía, así que volver a él
cuando falta la función sería silenciar justo el bug que la migración arregla:
mejor un checkout que se queja durante dos minutos que uno que cobra dos veces
la última unidad.

**Orden recomendado:** correr `0001` primero, desplegar después. La función
sobra hasta que el código nuevo la usa, así que aplicarla antes no rompe nada.
