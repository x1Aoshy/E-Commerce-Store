"use client";

import { useEffect, useState } from "react";
import AdminDashboard from "@/components/admin/AdminDashboard";
import Logo from "@/components/Logo";

export default function AdminPage() {
  const [status, setStatus] = useState("loading"); // loading | login | authed
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [showPass, setShowPass] = useState(false);

  useEffect(() => {
    fetch("/api/admin/verify")
      .then((r) => r.json())
      .then((d) => setStatus(d.authed ? "authed" : "login"))
      .catch(() => setStatus("login"));
  }, []);

  async function login(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus("authed");
      } else {
        setError(data.error || "No se pudo iniciar sesión.");
      }
    } catch {
      setError("Error de conexión.");
    } finally {
      setSubmitting(false);
    }
  }

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center text-ink-muted">
        Cargando…
      </div>
    );
  }

  if (status === "authed") {
    return <AdminDashboard onLogout={() => setStatus("login")} />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-5 py-10">
      <div className="card w-full max-w-sm p-8 shadow-card">
        <div className="flex flex-col items-center text-center">
          <Logo />
        </div>

        <form onSubmit={login} className="mt-6 space-y-3">
          <div>
            <label className="label" htmlFor="admin-pass">
              Contraseña
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="4" y="10.5" width="16" height="10" rx="2" />
                  <path d="M8 10.5V7a4 4 0 0 1 8 0v3.5" />
                </svg>
              </span>
              <input
                id="admin-pass"
                type={showPass ? "text" : "password"}
                className="input pl-10 pr-10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPass((v) => !v)}
                className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-[4px] text-ink-muted transition hover:text-ink"
                aria-label={showPass ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showPass ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8" />
                    <path d="M9.4 5.1A9.3 9.3 0 0 1 12 4.8c5 0 8.4 4.2 9.2 5.6.2.4.2.8 0 1.2-.4.7-1.3 2-2.6 3.1M6.2 6.7C4.3 8 3 9.8 2.8 10.4c-.2.4-.2.8 0 1.2C3.6 13 7 17.2 12 17.2c1 0 1.9-.2 2.7-.5" />
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2.8 12c.8-1.4 4.2-5.6 9.2-5.6S20.4 10.6 21.2 12c.2.4.2.8 0 1.2-.8 1.4-4.2 5.6-9.2 5.6S3.6 14.6 2.8 13.2a1.2 1.2 0 0 1 0-1.2z" />
                    <circle cx="12" cy="12" r="2.5" />
                  </svg>
                )}
              </button>
            </div>
          </div>
          {error && (
            <p className="rounded-[4px] bg-red-500/10 px-3 py-2 text-sm text-red-300 ring-1 ring-red-500/20">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="btn-accent w-full py-3"
          >
            {submitting ? "Verificando…" : "Ingresar"}
          </button>
        </form>

        <a
          href="/"
          className="mt-5 block text-center text-sm text-ink-muted underline-offset-2 hover:text-ink hover:underline"
        >
          ← Volver a la tienda
        </a>
      </div>
    </div>
  );
}
