import { cookies } from "next/headers";
import crypto from "crypto";

export const ADMIN_COOKIE = "aosh_admin";

// Duración de la sesión: 8 horas.
export const SESSION_MAX_AGE = 60 * 60 * 8;

function adminPassword() {
  return process.env.ADMIN_PASSWORD || "admin123";
}

// Clave para firmar el token de sesión. Si definís AUTH_SECRET en el entorno,
// se usa esa; si no, se deriva de la contraseña (cambiar la contraseña deja
// inválidas las sesiones viejas).
function secret() {
  return process.env.AUTH_SECRET || `aosh:${adminPassword()}`;
}

function sign(value) {
  return crypto.createHmac("sha256", secret()).update(String(value)).digest("hex");
}

// Comparación en tiempo constante (evita timing attacks). Compara hashes para
// que ambos lados midan siempre lo mismo y no se filtre la longitud.
function safeEqual(a, b) {
  const ha = Buffer.from(sign(a), "hex");
  const hb = Buffer.from(sign(b), "hex");
  return crypto.timingSafeEqual(ha, hb);
}

// Token de sesión con la forma "<expira>.<firma>". NO contiene la contraseña,
// así que aunque se filtre la cookie no se expone el secreto.
export function createSessionToken() {
  const exp = Date.now() + SESSION_MAX_AGE * 1000;
  return `${exp}.${sign(exp)}`;
}

function isValidToken(token) {
  if (!token || typeof token !== "string") return false;
  const [exp, sig] = token.split(".");
  if (!exp || !sig) return false;
  // Firma válida... (comparamos las cadenas hex como bytes, sin decodificar la
  // firma recibida, para no arriesgar errores con entradas inválidas).
  const expected = sign(exp);
  if (sig.length !== expected.length) return false;
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return false;
  // ...y todavía no vencida.
  return Number(exp) > Date.now();
}

// Verificación de sesión (cookie httpOnly firmada).
export function checkAdmin() {
  const token = cookies().get(ADMIN_COOKIE)?.value;
  return isValidToken(token);
}

export function isValidPassword(password) {
  return Boolean(password) && safeEqual(password, adminPassword());
}
