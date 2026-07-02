"use client";

import { useEffect } from "react";
import { useBranding } from "@/context/BrandingContext";

// Mantiene el favicon = ícono subido en Ajustes. El layout ya lo renderiza
// correcto desde el servidor (generateMetadata); esto sólo lo actualiza EN
// VIVO si el admin lo cambia sin recargar.
//
// IMPORTANTE: NUNCA remover los <link> del head — esos nodos los administra
// React (los renderiza el metadata del layout) y borrarlos rompe la
// reconciliación con una excepción client-side en toda la app. Sólo se
// actualiza el atributo href (o se agrega un link propio si no existe ninguno).
export default function BrandFavicon() {
  const { loginIconUrl, logoUrl } = useBranding();
  const icon = loginIconUrl || logoUrl || "/icon-default.svg";

  useEffect(() => {
    if (typeof document === "undefined" || !icon) return;
    const links = document.querySelectorAll("link[rel~='icon']");
    if (links.length === 0) {
      const link = document.createElement("link");
      link.setAttribute("rel", "icon");
      link.setAttribute("href", icon);
      document.head.appendChild(link);
      return;
    }
    links.forEach((el) => {
      if (el.getAttribute("href") !== icon) el.setAttribute("href", icon);
    });
  }, [icon]);

  return null;
}
