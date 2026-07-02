import { NextResponse } from "next/server";
import { addSubscriber, getSubscribers } from "@/lib/db";
import { checkAdmin } from "@/lib/auth";
import { rateLimitOk, clientIp } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";

// Lista de suscriptores (solo admin).
export async function GET() {
  if (!checkAdmin()) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  try {
    return NextResponse.json({ subscribers: await getSubscribers() });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "No se pudieron leer los contactos." },
      { status: 500 }
    );
  }
}

// Alta pública: el cliente deja su WhatsApp/email desde la tienda.
export async function POST(req) {
  try {
    // Anti-spam: 5 altas / 5 min por IP (suficiente para uso real).
    if (!rateLimitOk(`${clientIp(req)}:subscribe`, 5, 300_000)) {
      return NextResponse.json(
        { error: "Demasiados intentos. Esperá unos minutos." },
        { status: 429 }
      );
    }
    const body = await req.json().catch(() => ({}));
    const result = await addSubscriber({
      contact: body.contact,
      name: body.name,
      source: body.source || "web",
    });
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    // Tanto un alta nueva como un duplicado se responden como éxito (no le
    // revelamos al visitante si ya estaba en la lista).
    return NextResponse.json(
      { ok: true, duplicate: !!result.duplicate },
      { status: 201 }
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "No se pudo registrar el contacto." },
      { status: 500 }
    );
  }
}
