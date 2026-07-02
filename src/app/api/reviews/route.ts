import { NextResponse } from "next/server";
import { addReview, getApprovedReviews, getAllReviews } from "@/lib/db";
import { checkAdmin } from "@/lib/auth";
import { rateLimitOk, clientIp } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";

// GET: por defecto devuelve las reseñas APROBADAS (público). Con ?all=1 y sesión
// de admin, devuelve TODAS (para moderar).
export async function GET(req) {
  try {
    const all = new URL(req.url).searchParams.get("all");
    if (all && checkAdmin()) {
      return NextResponse.json({ reviews: await getAllReviews() });
    }
    return NextResponse.json({ reviews: await getApprovedReviews() });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ reviews: [] });
  }
}

// POST: el cliente deja una reseña (queda PENDIENTE de aprobación). Si es admin
// y manda manual:true, la reseña nace ya aprobada.
export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const isAdmin = checkAdmin();
    const asAdmin = isAdmin && body.manual === true;
    // Anti-spam para el público (el admin no se limita): 3 reseñas / 5 min.
    if (!asAdmin && !rateLimitOk(`${clientIp(req)}:reviews`, 3, 300_000)) {
      return NextResponse.json(
        { error: "Demasiadas reseñas seguidas. Esperá unos minutos." },
        { status: 429 }
      );
    }
    const result = await addReview({
      productId: body.productId,
      name: body.name,
      rating: body.rating,
      text: body.text,
      approved: asAdmin, // admin: aprobada; cliente: pendiente
      source: asAdmin ? "admin" : "cliente",
    });
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json(
      { ok: true, review: asAdmin ? result.review : null, pending: !asAdmin },
      { status: 201 }
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "No se pudo guardar la reseña." }, { status: 500 });
  }
}
