"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

// Sistema de notificaciones "toast" plano y cuadrado, acorde al tema oscuro
// (dorado de acento, bordes finos, grano sutil). Sin librerías externas.
//
// Uso:
//   const toast = useToast();
//   toast.success("Guardado");
//   const id = toast.loading("Subiendo…");  // no se cierra solo
//   toast.dismiss(id);
//
// Si se llama useToast() fuera del provider, devuelve no-ops (no rompe).

const ToastContext = createContext(null);

const MAX_VISIBLE = 3;
const DURATION = {
  success: 2800,
  info: 2800,
  error: 4000,
  loading: 0, // 0 = no auto-cierra
};
// Tiempo de la animación de salida antes de remover del DOM.
const EXIT_MS = 220;

// No-op estable para cuando se usa fuera del provider.
const NOOP_ID = "";
const noopApi = {
  success: () => NOOP_ID,
  error: () => NOOP_ID,
  info: () => NOOP_ID,
  loading: () => NOOP_ID,
  dismiss: () => {},
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);
  // Map<id, timeoutId> para los auto-cierres y las salidas pendientes.
  const timers = useRef(new Map());

  const clearTimer = useCallback((id) => {
    const t = timers.current.get(id);
    if (t) {
      clearTimeout(t);
      timers.current.delete(id);
    }
  }, []);

  // Quita definitivamente del estado (tras la animación de salida).
  const remove = useCallback(
    (id) => {
      clearTimer(id);
      setToasts((list) => list.filter((t) => t.id !== id));
    },
    [clearTimer]
  );

  // Marca el toast como "saliendo" y lo elimina cuando termina la transición.
  const dismiss = useCallback(
    (id) => {
      if (id == null) return;
      clearTimer(id);
      setToasts((list) => {
        // Si no existe o ya está saliendo, no hacemos nada.
        const found = list.find((t) => t.id === id);
        if (!found || found.leaving) return list;
        return list.map((t) => (t.id === id ? { ...t, leaving: true } : t));
      });
      const t = setTimeout(() => remove(id), EXIT_MS);
      timers.current.set(id, t);
    },
    [clearTimer, remove]
  );

  const push = useCallback(
    (type, message) => {
      const id = ++idRef.current;
      setToasts((list) => {
        const next = [...list, { id, type, message, leaving: false }];
        // Limita la cantidad visible: si nos pasamos, sacamos los más viejos
        // que no estén ya saliendo.
        const active = next.filter((t) => !t.leaving);
        if (active.length > MAX_VISIBLE) {
          const overflow = active.length - MAX_VISIBLE;
          const toKill = active.slice(0, overflow).map((t) => t.id);
          // Marcamos para salida (con animación) los excedentes.
          for (const killId of toKill) {
            clearTimer(killId);
            const tt = setTimeout(() => remove(killId), EXIT_MS);
            timers.current.set(killId, tt);
          }
          return next.map((t) =>
            toKill.includes(t.id) ? { ...t, leaving: true } : t
          );
        }
        return next;
      });

      const ms = DURATION[type] ?? 0;
      if (ms > 0) {
        const t = setTimeout(() => dismiss(id), ms);
        timers.current.set(id, t);
      }
      return id;
    },
    [clearTimer, dismiss, remove]
  );

  // API estable expuesta por el contexto.
  const apiRef = useRef(null);
  if (!apiRef.current) {
    apiRef.current = {
      success: (m) => push("success", m),
      error: (m) => push("error", m),
      info: (m) => push("info", m),
      loading: (m) => push("loading", m),
      dismiss: (id) => dismiss(id),
    };
  }
  // Mantenemos las funciones actualizadas sin cambiar la identidad del objeto.
  apiRef.current.success = (m) => push("success", m);
  apiRef.current.error = (m) => push("error", m);
  apiRef.current.info = (m) => push("info", m);
  apiRef.current.loading = (m) => push("loading", m);
  apiRef.current.dismiss = (id) => dismiss(id);

  // Limpieza de todos los timers al desmontar.
  useEffect(() => {
    const map = timers.current;
    return () => {
      for (const t of map.values()) clearTimeout(t);
      map.clear();
    };
  }, []);

  return (
    <ToastContext.Provider value={apiRef.current}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  // Fuera del provider: no-op para no romper componentes que lo invoquen.
  return ctx ?? noopApi;
}

/* ------------------------------- UI interna ------------------------------- */

function ToastViewport({ toasts, onDismiss }) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="false"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center gap-2 px-4 pt-4"
      style={{
        paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 1rem)",
      }}
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onDismiss }) {
  const { id, type, message, leaving } = toast;
  return (
    <div
      className="pointer-events-auto relative flex w-full max-w-sm items-start gap-2.5 overflow-hidden rounded-[4px] border border-white/12 bg-surface px-3.5 py-2.5 shadow-card motion-reduce:!animate-none"
      style={{
        animation: `${leaving ? "toast-out" : "toast-in"} ${EXIT_MS}ms ease forwards`,
      }}
    >
      {/* Grano sutil por encima del color, detrás del contenido. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.10] mix-blend-overlay"
        style={{ backgroundImage: "var(--grain)", backgroundSize: "150px 150px" }}
      />
      <span className="relative mt-0.5 flex h-4 w-4 flex-none items-center justify-center">
        <ToastIcon type={type} />
      </span>
      <p className="relative min-w-0 flex-1 break-words text-sm leading-snug text-ink">
        {message}
      </p>
      <button
        type="button"
        onClick={() => onDismiss(id)}
        aria-label="Cerrar"
        className="relative -mr-1 mt-0.5 flex h-4 w-4 flex-none items-center justify-center rounded-[3px] text-ink-muted transition hover:text-ink"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>
    </div>
  );
}

function ToastIcon({ type }) {
  if (type === "success") {
    return (
      <svg className="h-4 w-4 text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 13l4 4L19 7" />
      </svg>
    );
  }
  if (type === "error") {
    return (
      <svg className="h-4 w-4 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
        <path d="M6 6l12 12M18 6L6 18" />
      </svg>
    );
  }
  if (type === "loading") {
    return (
      <svg className="spin-ring h-4 w-4 text-accent-300" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
        <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      </svg>
    );
  }
  // info: punto dorado.
  return <span className="h-2 w-2 rounded-[1px] bg-accent-300" />;
}
