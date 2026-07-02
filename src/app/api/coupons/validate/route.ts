import { NextResponse } from "next/server";
import { findValidCoupon } from "@/lib/db";
import { rateLimitOk, clientIp } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";

// Valida un cupón desde el checkout (PÚBLICO). Devuelve el % para mostrar el
// descuento como preview; al crear el pedido se re-valida en el servidor.
export async function POST(req) {
  try {
    // Anti-spam: 10 validaciones por minuto por IP (evita probar códigos a
    // fuerza bruta sin molestar a un cliente real que se equivoca al tipear).
    if (!rateLimitOk(`${clientIp(req)}:coupon`, 10, 60_000)) {
      return NextResponse.json(
        { error: "Demasiados intentos. Esperá un momento." },
        { status: 429 }
      );
    }
    const body = await req.json().catch(() => ({}));
    const result = await findValidCoupon(body.code);
    if (!result.coupon) {
      return NextResponse.json({ valid: false, error: result.error }, { status: 400 });
    }
    return NextResponse.json({
      valid: true,
      code: result.coupon.code,
      percent: result.coupon.percent,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { valid: false, error: "No se pudo validar el cupón." },
      { status: 500 }
    );
  }
}
