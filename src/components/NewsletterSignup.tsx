"use client";

import { useState } from "react";
import { useLang } from "@/context/LanguageContext";

// Captura de contacto: el cliente deja su WhatsApp o email para recibir ofertas
// y avisos de reposición. Se guarda en la lista de suscriptores (admin).
//
// En una tienda que vende por chat, esta lista ES el activo: permite avisar de
// una reposición y cerrar la venta sin pagar publicidad. Por eso el bloque
// tiene peso visual propio (recuadro con borde grueso y sombra dura) y no es
// una línea más perdida en el pie.
export default function NewsletterSignup() {
  const { t } = useLang();
  const [contact, setContact] = useState("");
  const [state, setState] = useState("idle"); // idle | loading | done | error
  const [msg, setMsg] = useState("");

  async function submit(e: any) {
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
        setMsg(t("footer.newsDone"));
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
    <div className="border-2 border-line/85 bg-surface p-5 shadow-hard-sm">
      <h4 className="headline text-2xl text-ink">{t("footer.newsTitle")}</h4>
      <p className="mt-2 text-[12.5px] leading-relaxed text-ink-muted">
        {t("footer.newsSub")}
      </p>

      {state === "done" ? (
        <p className="mt-4 border border-green-400/40 bg-green-400/10 px-3.5 py-3 text-[13px] font-medium text-green-300">
          {msg}
        </p>
      ) : (
        <form onSubmit={submit} className="mt-4 flex flex-col gap-2">
          <input
            type="text"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            placeholder={t("footer.newsPh")}
            aria-label="WhatsApp o email"
            className="input h-11 min-h-0 text-sm"
          />
          <button
            type="submit"
            disabled={state === "loading"}
            className="btn-accent h-11 min-h-0 w-full text-[11px]"
          >
            {state === "loading" ? "…" : t("footer.newsBtn")}
          </button>
        </form>
      )}

      {state === "error" && <p className="mt-2 text-xs text-ember-400">{msg}</p>}
    </div>
  );
}
