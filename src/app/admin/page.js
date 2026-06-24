"use client";

import { useEffect, useState } from "react";
import AdminDashboard from "@/components/admin/AdminDashboard";
import Logo from "@/components/Logo";

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
    <div className="flex min-h-screen items-center justify-center px-5">
      <div className="card w-full max-w-sm p-8 shadow-card">
        <Logo />
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
          {error && <p className="text-sm text-red-400">{error}</p>}
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
