"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

// Branding de la tienda (nombre, logo, ícono de login) compartido con toda la
// app. Se busca una sola vez al montar desde /api/settings (público). Si se usa
// fuera del provider devuelve los valores por defecto (no rompe nada), por lo
// que la tienda funciona aunque la migración no se haya corrido todavía.

const DEFAULTS = {
  storeName: "Titan Supplements",
  logoUrl: "",
  loginIconUrl: "",
  whatsappNumber: "",
  whatsappMessage: "",
  heroImages: [],
  paymentInfo: "",
  instagramUrl: "",
  facebookUrl: "",
};

const BrandingContext = createContext(null);

export function BrandingProvider({ children, initial }) {
  // Sembrado con los ajustes leídos en el server (sin parpadeo del default al
  // recargar). Igual se refresca al montar para tomar cambios en vivo.
  const [branding, setBranding] = useState({ ...DEFAULTS, ...(initial || {}) });

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/settings");
      const data = await res.json().catch(() => ({}));
      if (data && data.settings) {
        setBranding({
          // ?? (no ||): un nombre vacío a propósito se respeta (no se reemplaza
          // por el default), porque el logo puede traer el nombre.
          storeName: data.settings.storeName ?? DEFAULTS.storeName,
          logoUrl: data.settings.logoUrl || "",
          loginIconUrl: data.settings.loginIconUrl || "",
          whatsappNumber: data.settings.whatsappNumber || "",
          whatsappMessage: data.settings.whatsappMessage || "",
          heroImages: Array.isArray(data.settings.heroImages)
            ? data.settings.heroImages
            : [],
          paymentInfo: data.settings.paymentInfo || "",
          instagramUrl: data.settings.instagramUrl || "",
          facebookUrl: data.settings.facebookUrl || "",
        });
      }
    } catch {
      /* deja los valores por defecto */
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <BrandingContext.Provider value={{ ...branding, refresh }}>
      {children}
    </BrandingContext.Provider>
  );
}

// Devuelve { storeName, logoUrl, loginIconUrl, refresh }. Seguro fuera del
// provider: cae a los valores por defecto con un refresh no-op.
export function useBranding() {
  const ctx = useContext(BrandingContext);
  if (!ctx) return { ...DEFAULTS, refresh: () => {} };
  return ctx;
}
