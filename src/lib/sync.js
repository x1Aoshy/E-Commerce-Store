"use client";

// Sincronización entre pestañas del MISMO navegador: cuando el admin cambia
// algo (alta/baja/edición de productos), avisa a la pestaña de la tienda para
// que se refresque al instante, sin esperar el intervalo del AutoRefresh.
// Usa BroadcastChannel y, como respaldo, el evento `storage` de localStorage.

const CHANNEL = "aosh-sync";
const KEY = "aosh_sync_ping";

export function notifyDataChanged() {
  if (typeof window === "undefined") return;
  try {
    if ("BroadcastChannel" in window) {
      const bc = new BroadcastChannel(CHANNEL);
      bc.postMessage(Date.now());
      bc.close();
    }
  } catch {
    /* ignore */
  }
  try {
    // Cambiar el valor dispara el evento `storage` en las otras pestañas.
    localStorage.setItem(KEY, String(Date.now()));
  } catch {
    /* ignore */
  }
}

export function onDataChanged(cb) {
  if (typeof window === "undefined") return () => {};
  let bc = null;
  try {
    if ("BroadcastChannel" in window) {
      bc = new BroadcastChannel(CHANNEL);
      bc.onmessage = () => cb();
    }
  } catch {
    /* ignore */
  }
  const onStorage = (e) => {
    if (e.key === KEY) cb();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    try {
      if (bc) bc.close();
    } catch {
      /* ignore */
    }
    window.removeEventListener("storage", onStorage);
  };
}
