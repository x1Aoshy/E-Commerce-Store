import { NextResponse } from "next/server";
import { deleteSubscriber } from "@/lib/db";
import { checkAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Elimina un contacto de la lista (sólo admin).
export async function DELETE(req, props) {
  const params = await props.params;
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  try {
    const deleted = await deleteSubscriber(params.id);
    if (!deleted) {
      return NextResponse.json({ error: "Contacto no encontrado" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "No se pudo eliminar el contacto." }, { status: 500 });
  }
}
