import { NextResponse } from "next/server";
import { updateOrder, deleteOrder } from "@/lib/db";
import { checkAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

const ALLOWED_STATUSES = ["pendiente", "confirmada", "cancelada"];
const ALLOWED_PAYMENTS = ["efectivo", "transferencia", "", null];

export async function PATCH(req, { params }) {
  if (!checkAdmin()) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const body = await req.json();

  if (body.status !== undefined && !ALLOWED_STATUSES.includes(body.status)) {
    return NextResponse.json({ error: "Estado inválido." }, { status: 400 });
  }
  if (
    body.paymentMethod !== undefined &&
    !ALLOWED_PAYMENTS.includes(body.paymentMethod)
  ) {
    return NextResponse.json({ error: "Método de pago inválido." }, { status: 400 });
  }

  try {
    const result = await updateOrder(params.id, body);
    if (result === null) {
      return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
    }
    if (result.error) {
      return NextResponse.json(
        { error: result.error, conflicts: result.conflicts || [] },
        { status: 409 }
      );
    }
    return NextResponse.json({ order: result.order });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "No se pudo actualizar la orden." },
      { status: 500 }
    );
  }
}

// Elimina la orden del sistema. Si no estaba cancelada, el backend repone stock.
export async function DELETE(req, { params }) {
  if (!checkAdmin()) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  try {
    const ok = await deleteOrder(params.id);
    if (!ok) {
      return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "No se pudo eliminar la orden." },
      { status: 500 }
    );
  }
}
