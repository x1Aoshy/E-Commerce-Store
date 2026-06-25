"use client";

import { useState } from "react";
import MediaManager from "./MediaManager";
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
};

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
    <form onSubmit={submit}>
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
        <div>
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
        <div className="grid grid-cols-2 gap-2">
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
        <div className="sm:col-span-2">
          <label className="label">Descripción corta</label>
          <input
            className="input"
            value={form.short}
            onChange={(e) => set("short", e.target.value)}
            placeholder="Una línea que se muestra en la tarjeta"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="label">Descripción completa</label>
          <textarea
            className="input min-h-[64px] resize-none"
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder="Detalle del producto para la ficha"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="label">Imágenes / video</label>
          <MediaManager value={form.images} onChange={(imgs) => set("images", imgs)} />
        </div>
      </div>

      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}

      <div className="mt-4 flex items-center gap-2">
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
