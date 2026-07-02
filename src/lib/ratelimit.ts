// Límite de peticiones (anti-spam) para los endpoints PÚBLICOS: pedidos,
// reseñas, suscripciones y validación de cupones. Sin dependencias: ventana
// deslizante en memoria por IP+ruta.
//
// HONESTIDAD TÉCNICA: en serverless (Vercel) cada instancia tiene su propia
// memoria, así que el límite es "por instancia" y se reinicia al escalar. Aun
// así corta en seco a un bot simple que martilla el mismo endpoint, que es el
// ataque realista para una tienda de este tamaño. Si el negocio crece, el
// upgrade natural es Upstash/Redis con la misma interfaz.

type Bucket = number[]; // timestamps (ms) de las peticiones recientes

const buckets = new Map<string, Bucket>();

// Poda periódica para que el Map no crezca sin límite en instancias longevas.
const MAX_KEYS = 5000;

function prune(now: number, windowMs: number) {
  if (buckets.size < MAX_KEYS) return;
  for (const [key, times] of buckets) {
    const alive = times.filter((t) => now - t < windowMs);
    if (alive.length === 0) buckets.delete(key);
    else buckets.set(key, alive);
  }
}

/**
 * Devuelve true si la petición está DENTRO del límite (permitida).
 * @param key   identificador (ej. `${ip}:orders`)
 * @param limit máximo de peticiones por ventana
 * @param windowMs ventana en milisegundos
 */
export function rateLimitOk(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  prune(now, windowMs);
  const times = (buckets.get(key) || []).filter((t) => now - t < windowMs);
  if (times.length >= limit) {
    buckets.set(key, times);
    return false;
  }
  times.push(now);
  buckets.set(key, times);
  return true;
}

// IP del cliente detrás del proxy de Vercel (primer valor de x-forwarded-for).
export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for") || "";
  return fwd.split(",")[0].trim() || "unknown";
}
