"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { onDataChanged } from "@/lib/sync";

// Mantiene la tienda al día SIN recargar la página: vuelve a pedir los datos del
// servidor (precios, stock, descuentos) cuando la pestaña vuelve al foco, cada
// cierto intervalo mientras está visible, y AL INSTANTE cuando el panel avisa de
// un cambio (alta/baja/edición de productos) vía BroadcastChannel. Usa
// router.refresh(), así no se pierde el carrito ni la posición del scroll.
export default function AutoRefresh({ interval = 10000 }) {
  const router = useRouter();

  useEffect(() => {
    let timer = null;

    const refresh = () => {
      if (document.visibilityState === "visible") router.refresh();
    };

    // Aviso en vivo desde el panel admin (otra pestaña del mismo navegador).
    const offSync = onDataChanged(() => router.refresh());

    // Refresco inmediato al montar: al llegar a la tienda desde el panel (misma
    // pestaña), limpia el Router Cache del cliente y trae los datos frescos sin
    // esperar al primer intervalo.
    refresh();

    const stop = () => {
      if (timer) clearInterval(timer);
      timer = null;
    };
    const start = () => {
      stop();
      timer = setInterval(refresh, interval);
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        refresh();
        start();
      } else {
        stop();
      }
    };

    start();
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      stop();
      offSync();
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [router, interval]);

  return null;
}
