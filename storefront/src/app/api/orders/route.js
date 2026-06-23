import { NextResponse } from "next/server";
import { createOrder, getOrders } from "@/lib/db";
import { checkAdmin } from "@/lib/auth";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!checkAdmin()) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  try {
    return NextResponse.json({ orders: await getOrders() });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "No se pudieron leer las órdenes." }, { status: 500 });
  }
}

export async function POST(req) {
  const body = await req.json();

  let result;
  try {
    result = await createOrder({ items: body.items, customer: body.customer });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "No se pudo procesar el pedido." }, { status: 500 });
  }

  if (result.error) {
    return NextResponse.json(
      { error: result.error, conflicts: result.conflicts || [] },
      { status: 409 }
    );
  }

  const storeName = process.env.NEXT_PUBLIC_STORE_NAME || "Aosh Suplementos";
  const phone = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "";
  const whatsappUrl = buildWhatsAppUrl({ phone, order: result.order, storeName });

  return NextResponse.json({ order: result.order, whatsappUrl }, { status: 201 });
}
