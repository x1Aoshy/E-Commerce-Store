"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

// Favoritos del cliente guardados en el navegador (localStorage). Sin cuentas:
// retiene al cliente dejándole guardar lo que le gustó para volver.
const FavoritesContext = createContext(null);
const STORAGE_KEY = "aosh_favs";

export function FavoritesProvider({ children }) {
  const [ids, setIds] = useState([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setIds(JSON.parse(raw));
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    } catch {
      /* ignore */
    }
  }, [ids, hydrated]);

  const toggle = useCallback((id) => {
    setIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [id, ...prev]
    );
  }, []);

  const isFav = useCallback((id) => ids.includes(id), [ids]);

  const value = useMemo(
    () => ({ ids, toggle, isFav, count: ids.length, hydrated }),
    [ids, toggle, isFav, hydrated]
  );

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx)
    return { ids: [], toggle: () => {}, isFav: () => false, count: 0, hydrated: false };
  return ctx;
}
