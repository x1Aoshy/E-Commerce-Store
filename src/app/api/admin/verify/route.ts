import { NextResponse } from "next/server";
import {
  ADMIN_COOKIE,
  isValidPassword,
  isAuthConfigured,
  checkAdmin,
  createSessionToken,
  SESSION_MAX_AGE,
} from "@/lib/auth";

export const dynamic = "force-dynamic";

// Rate limiting simple en memoria: máx. 8 intentos fallidos por IP cada 10 min.
// (Suficiente para frenar fuerza bruta en un proyecto chico.)
const WINDOW_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 8;
const attempts = new Map(); // ip -> { count, first }

function clientIp(req) {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}

function tooMany(ip) {
  const rec = attempts.get(ip);
  if (!rec) return false;
  if (Date.now() - rec.first > WINDOW_MS) {
    attempts.delete(ip);
    return false;
  }
  return rec.count >= MAX_ATTEMPTS;
}

function registerFail(ip) {
  const now = Date.now();
  const rec = attempts.get(ip);
  if (!rec || now - rec.first > WINDOW_MS) {
    attempts.set(ip, { count: 1, first: now });
  } else {
    rec.count += 1;
  }
}

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
} as const;

export async function GET() {
  return NextResponse.json({ authed: checkAdmin() });
}

export async function POST(req) {
  // Sin ADMIN_PASSWORD (o con una de ejemplo) el panel queda deshabilitado a
  // propósito: antes existía un fallback a "admin123" del que además se derivaba
  // la clave de firma, así que un despliegue sin configurar permitía forjar la
  // cookie de sesión. Mejor un 503 visible que un panel abierto.
  if (!isAuthConfigured()) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "El panel no está configurado en el servidor. Definí ADMIN_PASSWORD (y preferiblemente AUTH_SECRET).",
      },
      { status: 503 }
    );
  }

  const ip = clientIp(req);
  if (tooMany(ip)) {
    return NextResponse.json(
      { ok: false, error: "Demasiados intentos. Esperá unos minutos e intentá de nuevo." },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const password = body?.password;

  if (!isValidPassword(password)) {
    registerFail(ip);
    return NextResponse.json(
      { ok: false, error: "Contraseña incorrecta." },
      { status: 401 }
    );
  }

  // Login correcto: reseteamos el contador y emitimos un token de sesión firmado
  // (la cookie ya no guarda la contraseña).
  const token = createSessionToken();
  if (!token) {
    return NextResponse.json(
      { ok: false, error: "El panel no está configurado en el servidor." },
      { status: 503 }
    );
  }

  attempts.delete(ip);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, token, {
    ...cookieOptions,
    maxAge: SESSION_MAX_AGE,
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, "", { ...cookieOptions, maxAge: 0 });
  return res;
}
