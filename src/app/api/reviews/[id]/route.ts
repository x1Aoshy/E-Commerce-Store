import { NextResponse } from "next/server";
import { setReviewApproved, deleteReview } from "@/lib/db";
import { checkAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Aprueba / desaprueba una reseña (sólo admin).
export async function PATCH(req, { params }) {
  if (!checkAdmin()) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  try {
    const body = await req.json().catch(() => ({}));
    const review = await setReviewApproved(params.id, body.approved);
    if (!review) {
      return NextResponse.json({ error: "Reseña no encontrada" }, { status: 404 });
    }
    return NextResponse.json({ review });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "No se pudo actualizar la reseña." }, { status: 500 });
  }
}

// Elimina una reseña (sólo admin).
export async function DELETE(req, { params }) {
  if (!checkAdmin()) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  try {
    const deleted = await deleteReview(params.id);
    if (!deleted) {
      return NextResponse.json({ error: "Reseña no encontrada" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "No se pudo eliminar la reseña." }, { status: 500 });
  }
}
