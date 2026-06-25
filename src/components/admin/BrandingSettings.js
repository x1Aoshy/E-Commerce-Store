"use client";

import { useEffect, useRef, useState } from "react";
import { useToast } from "@/components/Toast";
import { useBranding } from "@/context/BrandingContext";

// Panel de Ajustes (branding): el dueño cambia el nombre de la tienda, el logo
// y el ícono de la pantalla de login. Las imágenes/SVG se suben al servidor con
// /api/upload (igual que el gestor de medios) y se guardan como URL.
//
// SEGURIDAD: un SVG subido se previsualiza/usa SIEMPRE vía <img src>, nunca
// inline, así no se ejecuta ningún script embebido.

const ACCEPT = "image/*,image/svg+xml";

// Subida de UNA sola imagen (logo o ícono). Muestra preview, permite
// reemplazar y quitar. `value` es la URL actual; `onChange` recibe la nueva
// (o "" al quitar).
function ImageUploader({ label, value, onChange }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);
  const toast = useToast();

  async function handleFile(fileList) {
    const file = (fileList || [])[0];
    if (!file) return;
    setBusy(true);
    setError(null);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.url) {
        onChange(data.url);
      } else {
        const msg = data.error || "No se pudo subir el archivo.";
        setError(msg);
        toast.error(msg);
      }
    } catch {
      setError("Error de conexión al subir.");
      toast.error("Error de conexión al subir.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div>
      <div className="label">{label}</div>
      <div className="mt-2 flex items-center gap-3">
        <div className="flex h-16 w-16 flex-none items-center justify-center overflow-hidden rounded-[4px] border border-white/10 bg-surface-soft">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="h-full w-full object-contain" />
          ) : (
            <span className="text-[10px] text-ink-muted">Sin imagen</span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="btn-primary px-3 py-2 text-[13px] disabled:opacity-50"
          >
            {busy ? "Subiendo…" : value ? "Reemplazar" : "Subir"}
          </button>
          {value && (
            <button
              type="button"
              onClick={() => onChange("")}
              disabled={busy}
              className="btn-ghost px-3 py-2 text-[13px] text-red-300 disabled:opacity-50"
            >
              Quitar
            </button>
          )}
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        hidden
        onChange={(e) => handleFile(e.target.files)}
      />
      {error && <p className="mt-2 text-xs text-red-300">{error}</p>}
    </div>
  );
}

export default function BrandingSettings() {
  const toast = useToast();
  const branding = useBranding();
  const [storeName, setStoreName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [loginIconUrl, setLoginIconUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Carga los ajustes actuales al montar.
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/settings");
        const data = await res.json().catch(() => ({}));
        if (alive && data && data.settings) {
          setStoreName(data.settings.storeName || "");
          setLogoUrl(data.settings.logoUrl || "");
          setLoginIconUrl(data.settings.loginIconUrl || "");
        }
      } catch {
        /* deja los campos vacíos */
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeName, logoUrl, loginIconUrl }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        toast.success("Ajustes guardados");
        branding.refresh?.();
      } else {
        toast.error(data.error || "No se pudieron guardar los ajustes.");
      }
    } catch {
      toast.error("Error de conexión.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="animate-fade-in text-sm text-ink-muted">Cargando…</div>
    );
  }

  return (
    <section className="animate-fade-in max-w-xl space-y-4">
      <h2 className="text-base font-semibold text-ink">Ajustes</h2>

      <div className="card space-y-4 p-5 shadow-soft">
        <div>
          <label className="label" htmlFor="store-name">
            Nombre de la tienda
          </label>
          <input
            id="store-name"
            className="input mt-2"
            value={storeName}
            onChange={(e) => setStoreName(e.target.value.slice(0, 60))}
            placeholder="Titan Supplements"
            maxLength={60}
          />
        </div>

        <ImageUploader label="Logo" value={logoUrl} onChange={setLogoUrl} />

        <ImageUploader
          label="Ícono de login"
          value={loginIconUrl}
          onChange={setLoginIconUrl}
        />
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="btn-accent px-6 py-2.5 disabled:opacity-50"
        >
          {saving ? "Guardando…" : "Guardar"}
        </button>
      </div>
    </section>
  );
}
