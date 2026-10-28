"use client";
import { convertPrice, type Currency } from "./format";

// Exportación a CSV (abre directo en Excel) de las órdenes del panel.
// Todo del lado del cliente: arma el texto desde los datos ya cargados y
// dispara la descarga.
//
// IMPORTANTE: el Excel en español usa PUNTO Y COMA (;) como separador — con
// comas mete todo en una sola columna y "queda mal". Por eso separamos con ;
// y anteponemos el BOM (﻿) para que respete las tildes/ñ.

const SEP = ";";

function esc(v: any): string {
  const s = String(v ?? "");
  // Comillas dobles escapadas y celda entre comillas si tiene separadores.
  if (/[";,\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function fmtDate(iso: any): string {
  try {
    return new Date(iso).toLocaleString("es-NI", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return String(iso || "");
  }
}

export function buildOrdersCsv(orders: any[], currency: Currency = "NIO") {
  const amount = (value: unknown) => convertPrice(value, currency).toFixed(2);
  const headers = [
    "Código",
    "Fecha",
    "Estado",
    "Pagada",
    "En camino",
    "Cliente",
    "Teléfono",
    "Vendedor",
    "Método de pago",
    "Moneda",
    "Subtotal",
    "Descuento",
    "Cupón",
    "Extra",
    "Concepto extra",
    "Total",
    "Productos",
    "Nota",
  ];

  const rows = (orders || []).map((o) => {
    const discount = Number(o.discount) || 0;
    const extra = Number(o.extra) || 0;
    const grand = Math.max(0, (Number(o.total) || 0) - discount) + extra;
    const items = (o.items || [])
      .map((it: any) => `${it.quantity}x ${it.name || "Producto"}`)
      .join(" | ");
    return [
      o.code,
      fmtDate(o.createdAt),
      o.status,
      o.paid ? "Sí" : "No",
      o.shipped ? "Sí" : "No",
      o.customer?.name || "",
      o.customer?.phone || "",
      o.seller || "",
      o.paymentMethod || "",
      currency,
      amount(o.total),
      amount(discount),
      o.coupon || "",
      amount(extra),
      o.extraLabel || "",
      amount(grand),
      items,
      o.customer?.note || "",
    ]
      .map(esc)
      .join(SEP);
  });

  // BOM explícito (﻿): sin él, Excel muestra "Ã³" en vez de "ó".
  return "\uFEFF" + [headers.map(esc).join(SEP), ...rows].join("\r\n");
}

export function downloadOrdersCsv(orders: any[], filename?: string, currency: Currency = "NIO") {
  const csv = buildOrdersCsv(orders, currency);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download =
    filename || `ordenes-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
