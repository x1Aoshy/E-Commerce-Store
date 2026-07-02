"use client";

// Exportación a CSV (abre directo en Excel) de las órdenes del panel.
// Todo del lado del cliente: arma el texto desde los datos ya cargados y
// dispara la descarga. Con BOM (﻿) para que Excel respete las tildes.

function esc(v: any): string {
  const s = String(v ?? "");
  // Comillas dobles escapadas y celda entre comillas si tiene separadores.
  if (/[",\n;]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
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

export function downloadOrdersCsv(orders: any[], filename?: string) {
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
      Number(o.total) || 0,
      discount,
      o.coupon || "",
      extra,
      o.extraLabel || "",
      grand,
      items,
      o.customer?.note || "",
    ]
      .map(esc)
      .join(",");
  });

  const csv = "﻿" + [headers.map(esc).join(","), ...rows].join("\n");
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
