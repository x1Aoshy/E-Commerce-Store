// Ninguna llamada a checkAdmin() puede quedarse sin `await`.
//
// Desde Next 16, `cookies()` sólo se puede leer de forma asíncrona, así que
// `checkAdmin()` devuelve una promesa. Una promesa siempre es truthy: si
// alguien escribe
//
//     if (!checkAdmin()) return NextResponse.json({ error: "No autorizado" });
//
// la condición nunca se cumple, el `return` no se ejecuta y la ruta atiende a
// cualquiera SIN sesión. Es un fallo silencioso: no lanza, no avisa en el log,
// y el panel de administración responde 200 con los pedidos, los cupones y el
// formulario de subida. La forma correcta es `if (!(await checkAdmin()))`.
//
// Esto TypeScript no lo atrapa. Con `strict: false` y `noImplicitAny: false`
// —que es como está configurado el repo— comprobar la veracidad de un objeto
// es código perfectamente válido, así que `tsc` pasa sin una queja. Tampoco lo
// atrapa el build. De ahí este script: es la única red que hay debajo.

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const RAÍZ = "src";
const EXTENSIONES = [".ts", ".tsx"];

// El nombre del guardia y el archivo donde se define (que hay que saltarse:
// ahí `checkAdmin()` no es una llamada sino la declaración).
const GUARDIA = "checkAdmin";
const DEFINICIÓN = /export\s+async\s+function\s+checkAdmin\s*\(/;

function* archivos(dir) {
  for (const entrada of readdirSync(dir)) {
    const ruta = join(dir, entrada);
    if (statSync(ruta).isDirectory()) yield* archivos(ruta);
    else if (EXTENSIONES.some((e) => entrada.endsWith(e))) yield ruta;
  }
}

// Sustituye por espacios el contenido de comentarios y cadenas, dejando los
// saltos de línea donde estaban para que los números de línea sigan cuadrando.
//
// Hace falta porque el propio aviso escrito en auth.ts menciona
// `!checkAdmin()` como ejemplo de lo que NO hay que hacer, y sin esto el
// script se delata a sí mismo. Un check que grita en falso se acaba ignorando,
// y entonces no protege nada.
function limpiar(código) {
  let salida = "";
  let estado = null; // "linea" | "bloque" | "'" | '"' | "`"

  for (let i = 0; i < código.length; i++) {
    const c = código[i];
    const siguiente = código[i + 1];
    const conservarSalto = (ch) => (ch === "\n" ? "\n" : " ");

    if (estado === "linea") {
      if (c === "\n") estado = null;
      salida += conservarSalto(c);
    } else if (estado === "bloque") {
      if (c === "*" && siguiente === "/") {
        estado = null;
        salida += "  ";
        i++;
      } else salida += conservarSalto(c);
    } else if (estado === "'" || estado === '"' || estado === "`") {
      if (c === "\\") {
        salida += "  ";
        i++;
      } else {
        if (c === estado) estado = null;
        salida += conservarSalto(c);
      }
    } else if (c === "/" && siguiente === "/") {
      estado = "linea";
      salida += "  ";
      i++;
    } else if (c === "/" && siguiente === "*") {
      estado = "bloque";
      salida += "  ";
      i++;
    } else if (c === "'" || c === '"' || c === "`") {
      estado = c;
      salida += " ";
    } else {
      salida += c;
    }
  }
  return salida;
}

const fallos = [];
let revisadas = 0;

for (const ruta of archivos(RAÍZ)) {
  const original = readFileSync(ruta, "utf8").split("\n");
  // Se escanea el código sin comentarios ni cadenas, pero se informa usando la
  // línea original para que el mensaje se pueda leer.
  const código = limpiar(readFileSync(ruta, "utf8")).split("\n");

  código.forEach((línea, i) => {
    // La declaración de la propia función no es una llamada.
    if (DEFINICIÓN.test(línea)) return;
    // El `import { checkAdmin }` no lleva paréntesis, así que no entra aquí,
    // pero lo descartamos explícitamente por si algún día se reescribe.
    if (/^\s*import\b/.test(línea)) return;

    // Cada aparición de `checkAdmin(` en la línea: se exige `await` justo antes.
    const patrón = new RegExp(`(\\w+\\s+)?${GUARDIA}\\s*\\(`, "g");
    for (const m of línea.matchAll(patrón)) {
      revisadas++;
      const precedente = (m[1] || "").trim();
      if (precedente !== "await") {
        fallos.push({
          ruta,
          línea: i + 1,
          texto: (original[i] || "").trim(),
        });
      }
    }
  });
}

if (fallos.length > 0) {
  console.error(
    `\n✗ ${fallos.length} llamada(s) a ${GUARDIA}() sin await.\n` +
      `  Una promesa siempre es truthy: el guardia deja pasar a cualquiera.\n` +
      `  Corrección: if (!(await ${GUARDIA}()))\n`
  );
  for (const f of fallos) {
    console.error(`  ${f.ruta}:${f.línea}`);
    console.error(`    ${f.texto}`);
  }
  console.error("");
  process.exit(1);
}

console.log(`✓ ${revisadas} llamada(s) a ${GUARDIA}(), todas con await.`);
