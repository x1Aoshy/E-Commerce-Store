import { NextResponse } from "next/server";
import { ADMIN_COOKIE, isValidPassword, checkAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ authed: checkAdmin() });
}

export async function POST(req) {
  const { password } = await req.json();
  if (!isValidPassword(password)) {
    return NextResponse.json(
      { ok: false, error: "Contraseña incorrecta." },
      { status: 401 }
    );
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, password, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
  return res;
}
