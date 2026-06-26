"use client";

import { useState } from "react";

// Captura de contacto: el cliente deja su WhatsApp o email para recibir ofertas
// y avisos de reposición. Se guarda en la lista de suscriptores (admin).
export default function NewsletterSignup() {
  const [contact, setContact] = useState("");
  const [state, setState] = useState("idle"); // idle | loading | done | error
  const [msg, setMsg] = useState("");

  async function submit(e) {
    e.preventDefault();
    const value = contact.trim();
    if (!value) {
      setState("error");
      setMsg("Dejá tu WhatsApp o email.");
      return;
    }
    setState("loading");
    setMsg("");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contact: value, source: "footer" }),
      });
      if (res.ok) {
        setState("done");
        setMsg("¡Listo! Te avisaremos de las próximas ofertas. 🎉");
        setContact("");
      } else {
        const data = await res.json().catch(() => ({}));
        setState("error");
        setMsg(data.error || "No se pudo registrar. Probá de nuevo.");
      }
    } catch {
      setState("error");
      setMsg("Error de conexión. Probá de nuevo.");
    }
  }

  return (
    <div>
      <h4 className="text-sm font-semibold">Ofertas y novedades</h4>
      <p className="mt-3 text-sm text-ink-muted">
        Dejanos tu WhatsApp o email y te avisamos de promos y reposiciones.
      </p>
      {state === "done" ? (
        <p className="mt-4 rounded-[4px] border border-green-500/30 bg-green-500/10 px-3 py-2.5 text-sm text-green-300">
          {msg}
        </p>
      ) : (
        <form onSubmit={submit} className="mt-4 flex flex-col gap-2 sm:flex-row">
          <input
            type="text"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            placeholder="Tu WhatsApp o email"
            aria-label="WhatsApp o email"
            className="input flex-1"
          />
          <button
            type="submit"
            disabled={state === "loading"}
            className="btn-accent shrink-0 px-4 py-2.5 text-sm"
          >
            {state === "loading" ? "Enviando…" : "Quiero ofertas"}
          </button>
        </form>
      )}
      {state === "error" && (
        <p className="mt-2 text-xs text-red-400">{msg}</p>
      )}
    </div>
  );
}
