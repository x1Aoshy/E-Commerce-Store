"use client";

import { useState } from "react";
import { useLang } from "@/context/LanguageContext";

function Stars({ value, onChange }: any) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1" role="radiogroup" aria-label="Puntuación">
      {[1, 2, 3, 4, 5].map((n) => {
        const active = (hover || value) >= n;
        return (
          <button
            key={n}
            type="button"
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            onClick={() => onChange(n)}
            aria-label={`${n} estrella${n > 1 ? "s" : ""}`}
            aria-checked={value === n}
            role="radio"
            className="p-0.5 transition active:scale-90"
          >
            <svg
              viewBox="0 0 24 24"
              className={`h-7 w-7 transition-colors ${active ? "text-brand" : "text-line/20"}`}
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="m12 2 3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.27 5.82 22 7 14.14l-5-4.87 6.91-1.01z" />
            </svg>
          </button>
        );
      })}
    </div>
  );
}

// Formulario para que el cliente deje su reseña. Queda pendiente de aprobación
// del admin antes de mostrarse en la tienda (evita spam/reseñas falsas).
export default function ReviewForm({ productId = null, onClose }) {
  const { t } = useLang();
  const [name, setName] = useState("");
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [state, setState] = useState("idle"); // idle | loading | done | error
  const [msg, setMsg] = useState("");

  async function submit(e) {
    e.preventDefault();
    if (!text.trim()) {
      setState("error");
      setMsg("Escribí tu reseña.");
      return;
    }
    setState("loading");
    setMsg("");
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, name, rating, text }),
      });
      if (res.ok) {
        setState("done");
        setMsg("¡Gracias! Tu reseña fue enviada y se publicará al ser aprobada.");
        setName("");
        setText("");
        setRating(5);
      } else {
        const data = await res.json().catch(() => ({}));
        setState("error");
        setMsg(data.error || "No se pudo enviar. Probá de nuevo.");
      }
    } catch {
      setState("error");
      setMsg("Error de conexión. Probá de nuevo.");
    }
  }

  if (state === "done") {
    return (
      <div className="border-2 border-green-400/40 bg-green-400/10 p-6 text-center">
        <p className="text-sm text-ok">{msg}</p>
        {onClose && (
          <button onClick={onClose} className="btn-ghost mt-4 px-4 py-2 text-[13px]">
            Cerrar
          </button>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="border-2 border-line/85 bg-surface p-5 shadow-hard-sm sm:p-6">
      <h3 className="headline text-2xl text-ink">{t("rev.formTitle")}</h3>
      <p className="mt-1 text-sm text-ink-muted">
        {t("rev.formSub")}
      </p>

      <div className="mt-4">
        <span className="label">{t("rev.rating")}</span>
        <Stars value={rating} onChange={setRating} />
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label">{t("rev.name")}</label>
          <input
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("rev.namePh")}
            maxLength={80}
          />
        </div>
      </div>

      <div className="mt-3">
        <label className="label">{t("rev.text")}</label>
        <textarea
          className="input min-h-[90px] resize-y"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t("rev.textPh")}
          maxLength={600}
        />
      </div>

      {state === "error" && <p className="mt-2 text-sm text-urgent">{msg}</p>}

      <div className="mt-4 flex items-center justify-end gap-2">
        {onClose && (
          <button type="button" onClick={onClose} className="btn-ghost px-4 py-2 text-[13px]">
            {t("rev.cancel")}
          </button>
        )}
        <button type="submit" disabled={state === "loading"} className="btn-accent px-5 py-2.5 text-sm">
          {state === "loading" ? t("rev.sending") : t("rev.send")}
        </button>
      </div>
    </form>
  );
}
