// Cliente de Supabase para uso EXCLUSIVO del lado del servidor.
//
// Usa la "service role key", que omite las políticas RLS de la base. Por eso
// NUNCA debe importarse desde código que corra en el navegador: estas
// funciones se llaman sólo desde Server Components y Route Handlers.
//
// El cliente se crea de forma perezosa (lazy) la primera vez que se necesita,
// así el build de Next.js no falla aunque las variables todavía no estén.

import { createClient } from "@supabase/supabase-js";

let client = null;

export function getSupabase() {
  if (client) return client;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Faltan las variables de entorno de Supabase. Definí SUPABASE_URL y " +
        "SUPABASE_SERVICE_ROLE_KEY (ver storefront/.env.example)."
    );
  }

  client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  return client;
}
