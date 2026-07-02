"use client";

import { useEffect } from "react";
import { useBranding } from "@/context/BrandingContext";

// Mantiene el favicon = ícono subido en Ajustes (preferimos el Icon de login;
// si no, el logo; si no hay ninguno, /icon-default.svg). El layout ya lo
// renderiza correcto desde el servidor; este componente sólo lo actualiza EN
// VIVO si el admin lo cambia sin recargar. Purga cualquier <link rel=icon>
// previo para que no compita un ícono viejo cacheado.
export default function BrandFavicon() {
  const { loginIconUrl, logoUrl } = useBranding();
  const icon = loginIconUrl || logoUrl || "/icon-default.svg";

  useEffect(() => {
    if (typeof document === "undefined") return;
    // Elimina TODOS los links de ícono existentes (los inyectados por Next y
    // los nuestros anteriores) y deja uno solo con el ícono correcto.
    document
      .querySelectorAll("link[rel~='icon'], link[rel='shortcut icon'], link[rel='apple-touch-icon']")
      .forEach((el) => el.remove());
    const link = document.createElement("link");
    link.setAttribute("rel", "icon");
    link.setAttribute("href", icon);
    document.head.appendChild(link);
  }, [icon]);

  return null;
}
