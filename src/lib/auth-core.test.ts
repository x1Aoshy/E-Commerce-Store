import { test, describe, beforeEach } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";

import {
  createSessionToken,
  isValidPassword,
  isValidToken,
  isAuthConfigured,
  SESSION_MAX_AGE,
} from "./auth-core.ts";

/*
 * Regresiones del panel de administración.
 *
 * El bug que motiva este archivo: `ADMIN_PASSWORD` caía a "admin123" y
 * `AUTH_SECRET` se derivaba de esa misma contraseña, así que un despliegue sin
 * configurar no sólo tenía credenciales públicas — tenía una clave HMAC
 * predecible, y con ella se podía FORJAR la cookie de sesión sin llegar a
 * probar la contraseña.
 */

function setEnv(password?: string, secret?: string) {
  if (password === undefined) delete process.env.ADMIN_PASSWORD;
  else process.env.ADMIN_PASSWORD = password;

  if (secret === undefined) delete process.env.AUTH_SECRET;
  else process.env.AUTH_SECRET = secret;
}

const STRONG_SECRET = "a".repeat(64);

beforeEach(() => setEnv(undefined, undefined));

describe("configuración ausente → falla cerrado", () => {
  test("sin ADMIN_PASSWORD no se puede iniciar sesión", () => {
    setEnv(undefined, STRONG_SECRET);
    assert.equal(isAuthConfigured(), false);
    assert.equal(isValidPassword("admin123"), false);
    assert.equal(isValidPassword(""), false);
    assert.equal(createSessionToken(), null);
  });

  test("las contraseñas de ejemplo se rechazan aunque estén en el entorno", () => {
    for (const weak of ["admin123", "ADMIN123", "admin", "password", "changeme"]) {
      setEnv(weak, STRONG_SECRET);
      assert.equal(isAuthConfigured(), false, `${weak} debería rechazarse`);
      assert.equal(isValidPassword(weak), false, `${weak} no debería autenticar`);
    }
  });

  test("un AUTH_SECRET corto se rechaza en vez de usarse", () => {
    setEnv("una-contraseña-larga-y-propia", "demasiado-corto");
    assert.equal(isAuthConfigured(), false);
    assert.equal(createSessionToken(), null);
  });
});

describe("verificación de contraseña", () => {
  beforeEach(() => setEnv("una-contraseña-larga-y-propia", STRONG_SECRET));

  test("acepta la correcta y rechaza el resto", () => {
    assert.equal(isValidPassword("una-contraseña-larga-y-propia"), true);
    assert.equal(isValidPassword("otra-cosa"), false);
    // Sin coincidencias por prefijo ni por longitud.
    assert.equal(isValidPassword("una-contraseña-larga-y-propi"), false);
    assert.equal(isValidPassword("una-contraseña-larga-y-propiaX"), false);
  });

  test("los valores no-string no autentican", () => {
    for (const value of [null, undefined, 0, 1, {}, [], true]) {
      assert.equal(isValidPassword(value), false);
    }
  });
});

describe("token de sesión", () => {
  beforeEach(() => setEnv("una-contraseña-larga-y-propia", STRONG_SECRET));

  test("el token que emitimos se valida", () => {
    const token = createSessionToken();
    assert.ok(token);
    assert.equal(isValidToken(token), true);
  });

  test("el token no contiene la contraseña", () => {
    assert.ok(!createSessionToken()!.includes("una-contraseña-larga-y-propia"));
  });

  test("una firma manipulada se rechaza", () => {
    const [exp, sig] = createSessionToken()!.split(".");
    const flipped = (sig[0] === "0" ? "1" : "0") + sig.slice(1);
    assert.equal(isValidToken(`${exp}.${flipped}`), false);
  });

  test("no se puede extender la caducidad sin volver a firmar", () => {
    const [exp, sig] = createSessionToken()!.split(".");
    const later = String(Number(exp) + 60_000);
    assert.equal(isValidToken(`${later}.${sig}`), false);
  });

  test("un token vencido se rechaza aunque la firma sea válida", () => {
    // Con AUTH_SECRET explícito la clave es conocida, así que podemos firmar
    // correctamente una fecha pasada: el único motivo de rechazo es la
    // caducidad, no la firma.
    const past = Date.now() - 1000;
    const sig = crypto
      .createHmac("sha256", Buffer.from(STRONG_SECRET, "utf8"))
      .update(String(past))
      .digest("hex");

    // Comprobación de control: la misma firma sobre una fecha futura sí vale.
    const future = Date.now() + 60_000;
    const futureSig = crypto
      .createHmac("sha256", Buffer.from(STRONG_SECRET, "utf8"))
      .update(String(future))
      .digest("hex");
    assert.equal(isValidToken(`${future}.${futureSig}`), true);

    assert.equal(isValidToken(`${past}.${sig}`), false);
  });

  test("entradas malformadas no revientan", () => {
    for (const bad of ["", "sin-punto", ".", "a.b", "zzz.zzz", "1.", ".1"]) {
      assert.equal(isValidToken(bad), false, `"${bad}" debería rechazarse`);
    }
    assert.equal(isValidToken(undefined), false);
  });

  test("REGRESIÓN: un token firmado con el secreto viejo por defecto no vale", () => {
    // Antes el secreto era `aosh:${password}` con password = "admin123", así que
    // era reproducible por cualquiera. Se reconstruye aquí y NO debe validar.
    const legacySecret = "aosh:admin123";
    const exp = Date.now() + SESSION_MAX_AGE * 1000;
    const forged = `${exp}.${crypto
      .createHmac("sha256", legacySecret)
      .update(String(exp))
      .digest("hex")}`;

    assert.equal(isValidToken(forged), false);
  });

  test("cambiar la contraseña invalida las sesiones abiertas", () => {
    const token = createSessionToken()!;
    assert.equal(isValidToken(token), true);

    // Sin AUTH_SECRET explícito, la clave se deriva de la contraseña.
    setEnv("una-contraseña-larga-y-propia", undefined);
    const derived = createSessionToken()!;
    assert.equal(isValidToken(derived), true);

    setEnv("otra-contraseña-completamente-distinta", undefined);
    assert.equal(isValidToken(derived), false);
  });
});
