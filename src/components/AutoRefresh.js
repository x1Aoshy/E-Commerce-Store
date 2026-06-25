"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Mantiene la tienda al día SIN recargar la página: vuelve a pedir los datos del
// servidor (precios, stock, descuentos) cuando la pestaña vuelve al foco y cada
// cierto intervalo mientras está visible. Usa router.refresh(), así no se pierde
// el carrito ni la posición del scroll. Pensado para que un cambio hecho en el
// panel se vea en la tienda en segundos, sin apretar F5.
export default function AutoRefresh({ interval = 15000 }) {
  const router = useRouter();

  useEffect(() => {
    let timer = null;

    const refresh = () => {
      if (document.visibilityState === "visible") router.refresh();
    };

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
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [router, interval]);

  return null;
}
