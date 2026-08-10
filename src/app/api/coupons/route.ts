import { NextResponse } from "next/server";
import { getCoupons, createCoupon } from "@/lib/db";
import { checkAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Lista de cupones (solo admin).
export async function GET() {
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  try {
    return NextResponse.json({ coupons: await getCoupons() });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "No se pudieron leer los cupones (¿corriste la migración?)." },
      { status: 500 }
    );
  }
}

// Crea un cupón (solo admin).
export async function POST(req) {
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  try {
    const body = await req.json().catch(() => ({}));
    const result = await createCoupon({
      code: body.code,
      percent: body.percent,
      maxUses: body.maxUses,
    });
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ coupon: result.coupon }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "No se pudo crear el cupón." },
      { status: 500 }
    );
  }
}
