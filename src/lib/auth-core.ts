import crypto from "crypto";

/*
 * Lógica pura de autenticación: sin dependencias de Next.
 *
 * Está separada de `auth.ts` para poder ejercitarla desde tests. `next/headers`
 * sólo resuelve dentro del bundler de Next, así que mientras la firma de tokens
 * viviera en el mismo módulo que `cookies()` no había forma de probarla — y es
 * justo la parte donde un error se traduce en "cualquiera entra al panel".
 */

export const ADMIN_COOKIE = "aosh_admin";

// Duración de la sesión: 8 horas.
export const SESSION_MAX_AGE = 60 * 60 * 8;

/**
 * Contraseñas que NUNCA se aceptan, aunque estén en el entorno.
 *
 * `admin123` viaja en `.env.example`; sin esta lista, copiar el ejemplo tal
 * cual dejaba el panel abierto con una contraseña pública. Fallar aquí es
 * ruidoso y se arregla en un minuto; arrancar con ella no se nota nunca.
 */
const REJECTED_PASSWORDS = new Set(["admin123", "admin", "password", "changeme"]);

/** Longitud mínima de `AUTH_SECRET` cuando se define explícitamente. */
const MIN_SECRET_LENGTH = 32;

let warnedMisconfigured = false;

function warnOnce(message: string): void {
  if (warnedMisconfigured) return;
  warnedMisconfigured = true;
  console.error(`[auth] ${message} El panel /admin queda DESHABILITADO.`);
}

/**
 * Contraseña del panel, o `null` si el entorno no está configurado.
 *
 * Devolver `null` en vez de un valor por defecto es deliberado: antes existía
 * un fallback a "admin123" y, como el secreto de firma se derivaba de él, un
 * despliegue sin configurar no sólo tenía una contraseña pública sino una
 * clave HMAC predecible — cualquiera podía FORJAR una cookie de sesión válida
 * sin llegar a probar la contraseña. Sin contraseña configurada, nadie entra.
 */
function adminPassword(): string | null {
  const value = process.env.ADMIN_PASSWORD;

  if (!value) {
    warnOnce("Falta ADMIN_PASSWORD.");
    return null;
  }

  if (REJECTED_PASSWORDS.has(value.toLowerCase())) {
    warnOnce(
      "ADMIN_PASSWORD es una contraseña de ejemplo conocida (revisá .env.example)."
    );
    return null;
  }

  return value;
}

/**
 * Clave para firmar el token de sesión.
 *
 * Si `AUTH_SECRET` está definida se usa esa. Si no, se deriva de la contraseña
 * mediante HKDF: ahora es seguro porque la contraseña es obligatoria y secreta
 * (cambiarla invalida las sesiones abiertas, que es el comportamiento deseado).
 * Devuelve `null` cuando no hay con qué firmar, y todo lo que dependa de firmar
 * falla cerrado.
 */
function secret(): Buffer | null {
  const explicit = process.env.AUTH_SECRET;

  if (explicit) {
    if (explicit.length < MIN_SECRET_LENGTH) {
      warnOnce(
        `AUTH_SECRET mide ${explicit.length} caracteres; el mínimo es ${MIN_SECRET_LENGTH} (usá \`openssl rand -hex 32\`).`
      );
      return null;
    }
    return Buffer.from(explicit, "utf8");
  }

  const password = adminPassword();
  if (!password) return null;

  // HKDF con salt fijo: convierte una contraseña legible en una clave de 32
  // bytes uniforme. El salt no necesita ser secreto, sólo estable.
  return Buffer.from(
    crypto.hkdfSync("sha256", Buffer.from(password, "utf8"), "aosh:auth:v1", "session-token", 32)
  );
}

function sign(value: string | number, key: Buffer): Buffer {
  return crypto.createHmac("sha256", key).update(String(value)).digest();
}

/**
 * Token de sesión con la forma "<expira>.<firma>". NO contiene la contraseña,
 * así que aunque se filtre la cookie no se expone el secreto.
 *
 * Devuelve `null` si el entorno no está configurado: quien lo llame debe
 * tratar ese caso como "no se puede iniciar sesión".
 */
export function createSessionToken(): string | null {
  // Se exige la configuración COMPLETA, no sólo una clave con la que firmar.
  // Con AUTH_SECRET definido pero sin ADMIN_PASSWORD había con qué firmar y
  // esto emitía un token: hoy nadie llega hasta aquí sin pasar por
  // isValidPassword(), pero emitir sesiones para una configuración incompleta
  // es exactamente la forma de fallo que este módulo quiere eliminar.
  if (!isAuthConfigured()) return null;

  const key = secret();
  if (!key) return null;

  const exp = Date.now() + SESSION_MAX_AGE * 1000;
  return `${exp}.${sign(exp, key).toString("hex")}`;
}

export function isValidToken(token: string | undefined): boolean {
  const key = secret();
  if (!key) return false;
  if (!token) return false;

  const [exp, sig] = token.split(".");
  if (!exp || !sig) return false;

  // La firma recibida se decodifica desde hex y se compara como bytes contra la
  // esperada. `timingSafeEqual` exige buffers del mismo tamaño, así que primero
  // se descarta cualquier longitud distinta (no filtra nada: el tamaño de un
  // HMAC-SHA256 es público y siempre 32 bytes).
  let received: Buffer;
  try {
    received = Buffer.from(sig, "hex");
  } catch {
    return false;
  }

  const expected = sign(exp, key);
  if (received.length !== expected.length) return false;
  if (!crypto.timingSafeEqual(received, expected)) return false;

  // Firma válida... y todavía no vencida.
  const expiresAt = Number(exp);
  return Number.isFinite(expiresAt) && expiresAt > Date.now();
}

/**
 * Comprueba la contraseña en tiempo constante.
 *
 * Se comparan los HMAC y no las cadenas: `timingSafeEqual` exige buffers del
 * mismo tamaño, y compararlas directamente obligaría a chequear antes la
 * longitud, filtrándola.
 */
export function isValidPassword(password: unknown): boolean {
  if (typeof password !== "string" || password.length === 0) return false;

  const expected = adminPassword();
  const key = secret();
  if (!expected || !key) return false;

  return crypto.timingSafeEqual(sign(password, key), sign(expected, key));
}

/**
 * ¿Está el panel configurado? Permite que la UI distinga "contraseña
 * incorrecta" de "el servidor no está configurado" sin filtrar cuál es.
 */
export function isAuthConfigured(): boolean {
  return adminPassword() !== null && secret() !== null;
}
