import { NextResponse } from "next/server";
import { getSettings, updateSettings } from "@/lib/db";
import { checkAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET es PÚBLICO: la tienda necesita el nombre/logo aunque no haya sesión admin.
export async function GET() {
  return NextResponse.json({ settings: await getSettings() });
}

// PATCH es sólo admin: actualiza el branding (nombre, logo, ícono de login).
export async function PATCH(req) {
  if (!checkAdmin()) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  try {
    const body = await req.json().catch(() => ({}));
    const settings = await updateSettings({
      storeName: body.storeName,
      logoUrl: body.logoUrl,
      loginIconUrl: body.loginIconUrl,
      whatsappNumber: body.whatsappNumber,
      whatsappMessage: body.whatsappMessage,
      heroImages: body.heroImages,
    });
    return NextResponse.json({ settings });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "No se pudieron guardar los ajustes." },
      { status: 500 }
    );
  }
}
