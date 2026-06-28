"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

// Tema de la tienda (cliente): "system" (según el dispositivo), "light" u
// "dark". Se guarda en el navegador. El modo oscuro es el predeterminado; el
// claro aplica la clase `.light` en <html> (ver globals.css).
const ThemeContext = createContext(null);
const KEY = "aosh_theme";

function systemPrefersLight() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-color-scheme: light)").matches
  );
}

// Aplica el tema efectivo: agrega/quita la clase `.light` en <html>.
function applyTheme(pref) {
  if (typeof document === "undefined") return;
  const light = pref === "light" || (pref !== "dark" && systemPrefersLight());
  document.documentElement.classList.toggle("light", light);
}

export function ThemeProvider({ children }) {
  const [pref, setPref] = useState("system");

  useEffect(() => {
    let saved = "system";
    try {
      saved = localStorage.getItem(KEY) || "system";
    } catch {
      /* ignore */
    }
    setPref(saved);
    applyTheme(saved);

    // Si está en "system", reacciona a los cambios del dispositivo en vivo.
    const mq = window.matchMedia("(prefers-color-scheme: light)");
    const onChange = () => {
      try {
        if ((localStorage.getItem(KEY) || "system") === "system") {
          applyTheme("system");
        }
      } catch {
        /* ignore */
      }
    };
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);

  const setTheme = useCallback((next) => {
    setPref(next);
    try {
      localStorage.setItem(KEY, next);
    } catch {
      /* ignore */
    }
    applyTheme(next);
  }, []);

  // Cicla: sistema → claro → oscuro → sistema.
  const cycleTheme = useCallback(() => {
    setPref((curr) => {
      const next =
        curr === "system" ? "light" : curr === "light" ? "dark" : "system";
      try {
        localStorage.setItem(KEY, next);
      } catch {
        /* ignore */
      }
      applyTheme(next);
      return next;
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ pref, setTheme, cycleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return (
    useContext(ThemeContext) || {
      pref: "system",
      setTheme: () => {},
      cycleTheme: () => {},
    }
  );
}
