"use client";

import { useEffect } from "react";
import { pushRecent } from "@/lib/recentlyViewed";

// Registra el producto actual como "visto recientemente" (en el navegador).
// Se monta en la ficha del producto; no renderiza nada.
export default function TrackRecentlyViewed({ id }) {
  useEffect(() => {
    pushRecent(id);
  }, [id]);
  return null;
}
