import { NextResponse } from "next/server";
import { setCouponActive, deleteCoupon } from "@/lib/db";
import { checkAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Activa / pausa un cupón (solo admin).
export async function PATCH(req, { params }) {
  if (!checkAdmin()) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  try {
    const body = await req.json().catch(() => ({}));
    const coupon = await setCouponActive(params.id, body.active);
    if (!coupon) {
      return NextResponse.json({ error: "Cupón no encontrado" }, { status: 404 });
    }
    return NextResponse.json({ coupon });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "No se pudo actualizar el cupón." },
      { status: 500 }
    );
  }
}

// Elimina un cupón (solo admin).
export async function DELETE(req, { params }) {
  if (!checkAdmin()) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  try {
    const ok = await deleteCoupon(params.id);
    if (!ok) {
      return NextResponse.json({ error: "Cupón no encontrado" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "No se pudo eliminar el cupón." },
      { status: 500 }
    );
  }
}
