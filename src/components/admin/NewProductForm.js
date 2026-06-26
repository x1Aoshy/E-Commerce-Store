"use client";

import { useState } from "react";
import MediaManager from "./MediaManager";
import StatsEditor from "./StatsEditor";
import { useToast } from "@/components/Toast";

const EMPTY = {
  name: "",
  category: "",
  price: "",
  stock: "",
  short: "",
  description: "",
  featured: false,
  images: [],
  stats: [],
};

// Encabezado de sección: agrupa los campos en bloques claros para que el
// formulario se lea ordenado en PC y cómodo en mobile.
function Section({ title, hint, children }) {
  return (
    <section className="border-t border-white/[0.07] pt-5 first:border-0 first:pt-0">
      <div className="mb-3">
        <h4 className="text-[13px] font-semibold text-ink">{title}</h4>
        {hint && <p className="mt-0.5 text-[11px] text-ink-muted">{hint}</p>}
      </div>
      {children}
    </section>
  );
}

export default function NewProductForm({ categories = [], onCreated, onCancel }) {
  const [form, setForm] = useState({ ...EMPTY });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const toast = useToast();

  function set(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit(e) {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("El nombre es obligatorio.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          category: form.category.trim() || "General",
          price: Number(form.price) || 0,
          stock: Number(form.stock) || 0,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setForm({ ...EMPTY });
        onCreated(data.product);
        toast.success("Producto creado");
      } else {
        const msg = data.error || "No se pudo crear el producto.";
        setError(msg);
        toast.error(msg);
      }
    } catch {
      setError("Error de conexión.");
      toast.error("Error de conexión.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <Section title="Datos" hint="Lo esencial del producto.">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label">Nombre *</label>
            <input
              className="input"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Ej: Proteína Whey Isolate"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Categoría</label>
            <input
              className="input"
              list="cat-list"
              value={form.category}
              onChange={(e) => set("category", e.target.value)}
              placeholder="Proteínas, Salud…"
            />
            <datalist id="cat-list">
              {categories.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>
          <label className="flex cursor-pointer items-center gap-2.5 rounded-[4px] border border-white/10 bg-white/[0.03] px-3.5 py-2.5 sm:col-span-2">
            <input
              type="checkbox"
              checked={form.featured}
              onChange={(e) => set("featured", e.target.checked)}
              className="h-4 w-4 shrink-0 accent-accent-500"
            />
            <span className="text-sm text-ink-soft">
              Destacar este producto en la tienda
            </span>
          </label>
        </div>
      </Section>

      <Section title="Precio y stock">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Precio</label>
            <input
              className="input"
              inputMode="numeric"
              value={form.price}
              onChange={(e) => set("price", e.target.value.replace(/[^\d.]/g, ""))}
              placeholder="0"
            />
          </div>
          <div>
            <label className="label">Stock</label>
            <input
              className="input"
              inputMode="numeric"
              value={form.stock}
              onChange={(e) => set("stock", e.target.value.replace(/[^\d]/g, ""))}
              placeholder="0"
            />
          </div>
        </div>
      </Section>

      <Section title="Descripción">
        <div className="grid gap-3">
          <div>
            <label className="label">Descripción corta</label>
            <input
              className="input"
              value={form.short}
              onChange={(e) => set("short", e.target.value)}
              placeholder="Una línea que se muestra en la tarjeta"
            />
          </div>
          <div>
            <label className="label">Descripción completa</label>
            <textarea
              className="input min-h-[88px] resize-y"
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Detalle del producto para la ficha"
            />
          </div>
        </div>
      </Section>

      <Section title="Imágenes / video" hint="La primera imagen es la portada.">
        <MediaManager value={form.images} onChange={(imgs) => set("images", imgs)} />
      </Section>

      <Section
        title="Estadísticas (gráfico)"
        hint="Hasta 6 métricas (0–100) para los anillos de la ficha."
      >
        <StatsEditor value={form.stats} onChange={(s) => set("stats", s)} />
      </Section>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex items-center gap-2 border-t border-white/[0.07] pt-5">
        <button type="submit" disabled={saving} className="btn-accent px-5 py-2">
          {saving ? "Guardando…" : "Crear producto"}
        </button>
        <button type="button" onClick={onCancel} className="btn-ghost px-5 py-2">
          Cancelar
        </button>
      </div>
    </form>
  );
}
