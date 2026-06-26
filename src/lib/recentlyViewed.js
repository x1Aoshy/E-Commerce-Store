"use client";

// "Vistos recientemente": guarda en el navegador los IDs de los últimos
// productos que el cliente abrió, para mostrárselos de nuevo y facilitar que
// retome la compra. Sin cuentas ni backend.

const KEY = "aosh_recent";
const MAX = 8;

export function readRecent() {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function pushRecent(id) {
  if (typeof window === "undefined" || !id) return;
  try {
    const prev = readRecent().filter((x) => x !== id);
    const next = [id, ...prev].slice(0, MAX);
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}
