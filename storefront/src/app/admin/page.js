"use client";

import { useEffect, useState } from "react";
import AdminDashboard from "@/components/admin/AdminDashboard";

const STORE = process.env.NEXT_PUBLIC_STORE_NAME || "Aosh Suplementos";

export default function AdminPage() {
  const [status, setStatus] = useState("loading"); // loading | login | authed
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

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
    <div className="flex min-h-screen items-center justify-center bg-accent-50/30 px-5">
      <div className="card w-full max-w-sm p-8 shadow-card">
        <div className="flex items-center gap-2.5">
          <svg width="30" height="30" viewBox="0 0 32 32" aria-hidden="true">
            <rect width="32" height="32" rx="8" fill="#15191c" />
            <path
              d="M16 8c3.6 3.1 5.6 5.7 5.6 8.6A5.6 5.6 0 0 1 16 22.2a5.6 5.6 0 0 1-5.6-5.6C10.4 13.7 12.4 11.1 16 8z"
              fill="#2f9d77"
            />
          </svg>
          <span className="font-semibold text-ink">{STORE}</span>
        </div>
        <h1 className="mt-6 text-lg font-semibold text-ink">
          Panel de administración
        </h1>
        <p className="mt-1 text-sm text-ink-muted">
          Ingresá la contraseña para gestionar inventario y pedidos.
        </p>

        <form onSubmit={login} className="mt-6 space-y-3">
          <div>
            <label className="label" htmlFor="admin-pass">
              Contraseña
            </label>
            <input
              id="admin-pass"
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoFocus
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="btn-primary w-full py-3"
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
