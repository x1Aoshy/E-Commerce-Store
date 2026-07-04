"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useToast } from "@/components/Toast";
import { productImages, isVideo } from "@/lib/images";
import { formatPrice } from "@/lib/format";

// Editor del carrusel del inicio: el dueño elige QUÉ productos salen flotando
// en el hero, en qué ORDEN y con qué FOTO (una del producto o una subida
// aparte, ej. PNG con fondo transparente). Vacío = selección automática.
//
// `value` es [{ id, image }] (image "" = usa la primera foto del producto) y
// se guarda junto con el resto de Ajustes.

// Miniatura segura: si no hay foto muestra un placeholder.
function Thumb({ src, size = "h-14 w-14" }: any) {
  return (
    <div
      className={`${size} flex flex-none items-center justify-center overflow-hidden rounded-[4px] border border-white/10 bg-surface-soft`}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="h-full w-full object-contain" />
      ) : (
        <span className="px-1 text-center text-[9px] text-ink-muted">Sin foto</span>
      )}
    </div>
  );
}

export default function HeroShowcaseEditor({ value = [], onChange }: any) {
  const toast = useToast();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [toAdd, setToAdd] = useState("");
  // id del producto cuyo selector de foto está abierto (uno a la vez).
  const [pickerFor, setPickerFor] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<any>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/products");
        const data = await res.json().catch(() => ({}));
        if (alive && Array.isArray(data.products)) setProducts(data.products);
      } catch {
        /* la lista queda vacía; el editor avisa abajo */
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const byId = useMemo(() => {
    const m = new Map();
    for (const p of products) m.set(p.id, p);
    return m;
  }, [products]);

  const list = Array.isArray(value) ? value : [];
  const remaining = products.filter((p) => !list.some((it) => it.id === p.id));

  const firstPhoto = (p: any) =>
    (productImages(p) || []).find((u: any) => !isVideo(u)) || "";
  const photosOf = (p: any) =>
    (productImages(p) || []).filter((u: any) => !isVideo(u));

  const update = (next: any[]) => onChange(next);

  const add = () => {
    if (!toAdd || list.some((it) => it.id === toAdd)) return;
    if (list.length >= 8) {
      toast.error("Máximo 8 productos en el carrusel.");
      return;
    }
    update([...list, { id: toAdd, image: "" }]);
    setToAdd("");
  };

  const remove = (id: string) => {
    update(list.filter((it) => it.id !== id));
    if (pickerFor === id) setPickerFor("");
  };

  const move = (idx: number, dir: number) => {
    const next = [...list];
    const j = idx + dir;
    if (j < 0 || j >= next.length) return;
    [next[idx], next[j]] = [next[j], next[idx]];
    update(next);
  };

  const setImage = (id: string, image: string) => {
    update(list.map((it) => (it.id === id ? { ...it, image } : it)));
  };

  // Sube una foto especial para el carrusel (ej. PNG transparente) y la asigna
  // a la entrada abierta en el selector.
  async function handleUpload(fileList: any) {
    const file = (fileList || [])[0];
    if (!file || !pickerFor) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.url) {
        setImage(pickerFor, data.url);
        toast.success("Foto subida");
      } else {
        toast.error(data.error || "No se pudo subir la foto.");
      }
    } catch {
      toast.error("Error de conexión al subir.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  if (loading) {
    return <p className="text-xs text-ink-muted">Cargando productos…</p>;
  }

  return (
    <div className="space-y-3">
      {list.length === 0 && (
        <p className="rounded-[4px] border border-line/10 bg-fill/[0.03] px-3 py-2.5 text-[11px] text-ink-muted">
          Sin lista: el carrusel elige solo (productos destacados con foto y
          stock). Agregá productos acá para controlar cuáles salen, su orden y
          su foto.
        </p>
      )}

      {list.map((it, idx) => {
        const p = byId.get(it.id);
        if (!p) {
          // Producto borrado: se muestra para poder quitarlo de la lista.
          return (
            <div
              key={it.id}
              className="flex items-center justify-between gap-3 rounded-[4px] border border-red-500/25 bg-red-500/5 px-3 py-2"
            >
              <span className="text-xs text-red-300">Producto eliminado</span>
              <button
                type="button"
                onClick={() => remove(it.id)}
                className="btn-ghost px-2.5 py-1.5 text-[12px] text-red-300"
              >
                Quitar
              </button>
            </div>
          );
        }
        const shown = it.image || firstPhoto(p);
        const photos = photosOf(p);
        const out = (Number(p.stock) || 0) <= 0;
        const open = pickerFor === it.id;
        return (
          <div key={it.id} className="rounded-[4px] border border-line/10 bg-fill/[0.02] p-2.5">
            <div className="flex items-center gap-3">
              <Thumb src={shown} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium text-ink">
                  {p.name || p.slug}
                </p>
                <p className="mt-0.5 text-[11px] text-ink-muted">
                  {formatPrice(p.price)}
                  {it.image ? " · foto elegida" : " · foto automática"}
                </p>
                {out && (
                  <p className="mt-0.5 text-[11px] font-medium text-amber-300">
                    Agotado: no sale en la tienda hasta tener stock
                  </p>
                )}
              </div>
              <div className="flex flex-none items-center gap-1">
                <button
                  type="button"
                  onClick={() => move(idx, -1)}
                  disabled={idx === 0}
                  aria-label="Subir"
                  className="flex h-8 w-8 items-center justify-center rounded-[4px] border border-line/15 text-ink-soft transition hover:bg-fill/5 disabled:opacity-30"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => move(idx, 1)}
                  disabled={idx === list.length - 1}
                  aria-label="Bajar"
                  className="flex h-8 w-8 items-center justify-center rounded-[4px] border border-line/15 text-ink-soft transition hover:bg-fill/5 disabled:opacity-30"
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => setPickerFor(open ? "" : it.id)}
                  className={`rounded-[4px] border px-2.5 py-1.5 text-[12px] transition ${
                    open
                      ? "border-accent-500/50 bg-accent-500/10 text-accent-300"
                      : "border-line/15 text-ink-soft hover:bg-fill/5"
                  }`}
                >
                  Foto
                </button>
                <button
                  type="button"
                  onClick={() => remove(it.id)}
                  aria-label="Quitar del carrusel"
                  className="flex h-8 w-8 items-center justify-center rounded-[4px] border border-line/15 text-red-300 transition hover:bg-red-500/10"
                >
                  ✕
                </button>
              </div>
            </div>

            {open && (
              <div className="mt-2.5 border-t border-line/10 pt-2.5">
                <div className="flex flex-wrap items-center gap-2">
                  {/* "Automática" = primera foto del producto (se actualiza sola). */}
                  <button
                    type="button"
                    onClick={() => setImage(it.id, "")}
                    className={`rounded-[4px] border px-2.5 py-1.5 text-[11px] transition ${
                      !it.image
                        ? "border-accent-500/60 bg-accent-500/10 text-accent-300"
                        : "border-line/15 text-ink-soft hover:bg-fill/5"
                    }`}
                  >
                    Automática
                  </button>
                  {photos.map((u: string) => (
                    <button
                      key={u}
                      type="button"
                      onClick={() => setImage(it.id, u)}
                      className={`overflow-hidden rounded-[4px] border-2 transition ${
                        it.image === u
                          ? "border-accent-500"
                          : "border-transparent hover:border-line/30"
                      }`}
                      aria-label="Usar esta foto"
                    >
                      <Thumb src={u} size="h-12 w-12" />
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                    className="btn-ghost px-2.5 py-1.5 text-[11px] disabled:opacity-50"
                  >
                    {uploading ? "Subiendo…" : "Subir otra"}
                  </button>
                </div>
                {it.image && !photos.includes(it.image) && (
                  <p className="mt-2 flex items-center gap-2 text-[11px] text-ink-muted">
                    <Thumb src={it.image} size="h-8 w-8" />
                    Foto subida aparte (solo para el carrusel).
                  </p>
                )}
                <p className="mt-2 text-[11px] text-ink-muted">
                  Tip: un PNG con fondo transparente flota mucho mejor en el
                  inicio.
                </p>
              </div>
            )}
          </div>
        );
      })}

      {/* Agregar producto al carrusel. */}
      {remaining.length > 0 && list.length < 8 && (
        <div className="flex gap-2">
          <select
            value={toAdd}
            onChange={(e) => setToAdd(e.target.value)}
            aria-label="Producto a agregar"
            className="input flex-1"
          >
            <option value="">Elegir producto…</option>
            {remaining.map((p) => (
              <option key={p.id} value={p.id}>
                {(p.name || p.slug) +
                  ((Number(p.stock) || 0) <= 0 ? " (agotado)" : "")}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={add}
            disabled={!toAdd}
            className="btn-primary shrink-0 px-4 py-2 text-[13px] disabled:opacity-40"
          >
            Agregar
          </button>
        </div>
      )}
      {products.length === 0 && (
        <p className="text-[11px] text-ink-muted">
          Todavía no hay productos. Creá productos en Inventario y volvé acá.
        </p>
      )}

      {/* La foto sube desde el selector de la entrada abierta. */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => handleUpload(e.target.files)}
      />
    </div>
  );
}
