import { cookies } from "next/headers";

export const ADMIN_COOKIE = "aosh_admin";

function adminPassword() {
  return process.env.ADMIN_PASSWORD || "admin123";
}

// Verificación simple basada en cookie httpOnly. Suficiente para el preview;
// para producción conviene reemplazar por sesiones firmadas / hashing.
export function checkAdmin() {
  const token = cookies().get(ADMIN_COOKIE)?.value;
  return Boolean(token) && token === adminPassword();
}

export function isValidPassword(password) {
  return Boolean(password) && password === adminPassword();
}
