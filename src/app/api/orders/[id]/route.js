import { NextResponse } from "next/server";
import { updateOrder } from "@/lib/db";
import { checkAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function PATCH(req, { params }) {
  if (!checkAdmin()) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const body = await req.json();
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
