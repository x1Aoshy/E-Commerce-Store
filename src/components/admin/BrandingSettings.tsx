"use client";

import { useEffect, useRef, useState } from "react";
import { useToast } from "@/components/Toast";
import { useBranding } from "@/context/BrandingContext";
import MediaManager from "./MediaManager";

// Panel de Ajustes (branding): el dueño cambia el nombre de la tienda, el logo
// y el "Icon" (favicon del sitio + ícono del sidebar del admin). Las imágenes/
// SVG se suben al servidor con /api/upload y se guardan como URL.
//
// SEGURIDAD: un SVG subido se previsualiza/usa SIEMPRE vía <img src>, nunca
// inline, así no se ejecuta ningún script embebido.

const ACCEPT = "image/*,image/svg+xml";

// Subida de UNA sola imagen (logo o ícono). Muestra preview, permite
// reemplazar y quitar. `value` es la URL actual; `onChange` recibe la nueva
// (o "" al quitar).
function ImageUploader({ label, value, onChange }: any) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<any>(null);
  const inputRef = useRef<any>(null);
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
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [whatsappMessage, setWhatsappMessage] = useState("");
  const [heroImages, setHeroImages] = useState<any[]>([]);
  const [paymentInfo, setPaymentInfo] = useState("");
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
          setWhatsappNumber(data.settings.whatsappNumber || "");
          setWhatsappMessage(data.settings.whatsappMessage || "");
          setHeroImages(
            Array.isArray(data.settings.heroImages) ? data.settings.heroImages : []
          );
          setPaymentInfo(data.settings.paymentInfo || "");
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
        body: JSON.stringify({
          storeName,
          logoUrl,
          loginIconUrl,
          whatsappNumber,
          whatsappMessage,
          heroImages,
          paymentInfo,
        }),
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
          label="Icon"
          value={loginIconUrl}
          onChange={setLoginIconUrl}
        />
      </div>

      <div className="card space-y-4 p-5 shadow-soft">
        <h3 className="text-sm font-semibold text-ink">WhatsApp</h3>

        <div>
          <label className="label" htmlFor="wa-number">
            Número del chat
          </label>
          <input
            id="wa-number"
            className="input mt-2"
            type="text"
            inputMode="numeric"
            value={whatsappNumber}
            onChange={(e) =>
              setWhatsappNumber(e.target.value.replace(/[^\d]/g, ""))
            }
            placeholder="505XXXXXXXX"
          />
          <p className="mt-1 text-[11px] text-ink-muted">
            código de país + número, sin + ni espacios. Ej: 505XXXXXXXX
          </p>
        </div>

        <div>
          <label className="label" htmlFor="wa-message">
            Mensaje automático
          </label>
          <textarea
            id="wa-message"
            className="input mt-2 min-h-[80px] resize-none"
            value={whatsappMessage}
            onChange={(e) => setWhatsappMessage(e.target.value)}
            placeholder="¡Quiero confirmar este pedido!"
          />
        </div>
      </div>

      <div className="card space-y-3 p-5 shadow-soft">
        <div>
          <h3 className="text-sm font-semibold text-ink">Datos de pago</h3>
          <p className="mt-0.5 text-[11px] text-ink-muted">
            Se le muestran al cliente al confirmar su pedido y en el recibo QR.
            Ej: banco, número de cuenta, a nombre de quién, transferencia móvil.
          </p>
        </div>
        <textarea
          className="input min-h-[100px] resize-y"
          value={paymentInfo}
          onChange={(e) => setPaymentInfo(e.target.value.slice(0, 600))}
          placeholder={"BAC córdobas: 123456789\nA nombre de: Juan Pérez\nTambién aceptamos efectivo contra entrega."}
          maxLength={600}
        />
      </div>

      <div className="card space-y-3 p-5 shadow-soft">
        <div>
          <h3 className="text-sm font-semibold text-ink">Fondo del inicio</h3>
          <p className="mt-0.5 text-[11px] text-ink-muted">
            Imagen de fondo del hero (la portada de la tienda). Si subís más de
            una, rotan solas en carrusel. Lo ideal: una foto apaisada (horizontal).
          </p>
        </div>
        <MediaManager value={heroImages} onChange={setHeroImages} />
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
