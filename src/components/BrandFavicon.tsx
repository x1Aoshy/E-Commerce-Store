"use client";

import { useEffect } from "react";
import { useBranding } from "@/context/BrandingContext";

// Reemplaza el favicon del sitio por el ícono subido en Ajustes (preferimos el
// ícono de login; si no, el logo). Si no hay ninguno, queda el icon.svg por
// defecto. Actualiza el <link rel="icon"> en el head del documento.
export default function BrandFavicon() {
  const { loginIconUrl, logoUrl } = useBranding();
  const icon = loginIconUrl || logoUrl;

  useEffect(() => {
    if (!icon || typeof document === "undefined") return;
    let link = document.querySelector("link[rel~='icon']");
    const created = !link;
    if (!link) {
      link = document.createElement("link");
      link.setAttribute("rel", "icon");
      document.head.appendChild(link);
    }
    const prev = link.getAttribute("href");
    link.setAttribute("href", icon);
    return () => {
      if (created) link.remove();
      else if (prev) link.setAttribute("href", prev);
    };
  }, [icon]);

  return null;
}
