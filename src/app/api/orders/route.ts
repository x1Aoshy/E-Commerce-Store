import { NextResponse } from "next/server";
import { createOrder, createManualOrder, getOrders, getSettings } from "@/lib/db";
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
  // Envolvemos todo (incluido el parseo del body) en try/catch para nunca dejar
  // escapar una excepción: la UI siempre recibe JSON con un error claro.
  try {
    const body = await req.json();

    // Alta MANUAL (admin): registra una venta hecha antes/offline. Reutiliza la
    // misma validación y descuento de stock que el checkout, pero responde sólo
    // { order } (sin whatsappUrl) y permite fijar el estado inicial.
    if (checkAdmin() && body.manual === true) {
      const result = await createManualOrder({
        items: body.items,
        customer: body.customer,
        status: body.status,
        paymentMethod: body.paymentMethod,
        extra: body.extra,
        extraLabel: body.extraLabel,
        seller: body.seller,
      });
      if (result.error) {
        return NextResponse.json(
          { error: result.error, conflicts: result.conflicts || [] },
          { status: 409 }
        );
      }
      return NextResponse.json({ order: result.order }, { status: 201 });
    }

    // Camino público (checkout): crea la orden y arma la URL de WhatsApp.
    const result = await createOrder({ items: body.items, customer: body.customer });

    if (result.error) {
      return NextResponse.json(
        { error: result.error, conflicts: result.conflicts || [] },
        { status: 409 }
      );
    }

    const s = await getSettings();
    // Origen del sitio para armar el link absoluto del recibo (QR).
    const origin =
      req.headers.get("origin") ||
      (req.headers.get("host")
        ? `https://${req.headers.get("host")}`
        : "");
    const receiptUrl =
      origin && result.order.token
        ? `${origin}/recibo/${result.order.token}`
        : "";
    const whatsappUrl = buildWhatsAppUrl({
      phone: s.whatsappNumber,
      order: result.order,
      storeName: s.storeName,
      message: s.whatsappMessage,
      receiptUrl,
    });

    return NextResponse.json({ order: result.order, whatsappUrl }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "No se pudo procesar el pedido." }, { status: 500 });
  }
}
