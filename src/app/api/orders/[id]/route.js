import { NextResponse } from "next/server";
import { updateOrder } from "@/lib/db";
import { checkAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Estados válidos que puede recibir el PATCH. Cancelar/reactivar ajusta el
// stock dentro de updateOrder (ver src/lib/db.js).
const ALLOWED_STATUSES = ["pendiente", "confirmada", "cancelada"];

export async function PATCH(req, { params }) {
  if (!checkAdmin()) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const body = await req.json();

  // Si viene un status, debe ser uno de los permitidos.
  if (body.status !== undefined && !ALLOWED_STATUSES.includes(body.status)) {
    return NextResponse.json({ error: "Estado inválido." }, { status: 400 });
  }

  try {
    const order = await updateOrder(params.id, body);
    if (!order) {
      return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
    }
    return NextResponse.json({ order });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "No se pudo actualizar la orden." }, { status: 500 });
  }
}
