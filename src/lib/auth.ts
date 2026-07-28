import { cookies } from "next/headers";

import { ADMIN_COOKIE, isValidToken } from "./auth-core";

/*
 * Capa de sesión sobre `auth-core`. Todo lo criptográfico vive allí, sin
 * dependencias del framework, para que tenga tests.
 */

export {
  ADMIN_COOKIE,
  SESSION_MAX_AGE,
  createSessionToken,
  isValidPassword,
  isAuthConfigured,
  isValidToken,
} from "./auth-core";

/** Verificación de sesión (cookie httpOnly firmada). */
export function checkAdmin(): boolean {
  return isValidToken(cookies().get(ADMIN_COOKIE)?.value);
}
