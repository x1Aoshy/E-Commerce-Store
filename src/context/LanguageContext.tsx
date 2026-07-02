"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { DICTS, type Lang } from "@/lib/i18n";

// Idioma de la TIENDA (es/en), guardado en el navegador. Español por defecto.
// `t(clave, vars)` traduce con reemplazo simple de {vars}; si falta la clave
// cae al español y nunca rompe. El cambio es instantáneo (sin recargar).
const LanguageContext = createContext<any>(null);
const KEY = "aosh_lang";

export function LanguageProvider({ children }: any) {
  const [lang, setLangState] = useState<Lang>("es");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(KEY);
      if (saved === "en" || saved === "es") setLangState(saved);
    } catch {
      /* ignore */
    }
  }, []);

  // Refleja el idioma en <html lang> (accesibilidad / traductores del navegador).
  useEffect(() => {
    try {
      document.documentElement.lang = lang;
    } catch {
      /* ignore */
    }
  }, [lang]);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem(KEY, l);
    } catch {
      /* ignore */
    }
  }, []);

  const t = useCallback(
    (key: string, vars?: Record<string, any>) => {
      let s = DICTS[lang]?.[key] ?? DICTS.es[key] ?? key;
      if (vars) {
        for (const [k, v] of Object.entries(vars)) {
          s = s.replaceAll(`{${k}}`, String(v));
        }
      }
      return s;
    },
    [lang]
  );

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

// Seguro fuera del provider: devuelve español y un setLang no-op.
export function useLang() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    return {
      lang: "es" as Lang,
      setLang: () => {},
      t: (key: string, vars?: Record<string, any>) => {
        let s = DICTS.es[key] ?? key;
        if (vars) {
          for (const [k, v] of Object.entries(vars)) {
            s = s.replaceAll(`{${k}}`, String(v));
          }
        }
        return s;
      },
    };
  }
  return ctx;
}
