"use client";

import { useEffect, useState } from "react";
import QRCodeLib from "qrcode";

// Genera un código QR (imagen PNG) a partir de un texto/URL. Oscuro sobre blanco
// para que siempre escanee bien, sin importar el tema de la página.
export default function QRCode({ value, size = 176, className = "" }) {
  const [src, setSrc] = useState("");

  useEffect(() => {
    if (!value) return;
    let active = true;
    QRCodeLib.toDataURL(value, {
      width: size * 2, // alta resolución para pantallas retina / impresión
      margin: 1,
      color: { dark: "#0a0c0d", light: "#ffffff" },
      errorCorrectionLevel: "M",
    })
      .then((url) => active && setSrc(url))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [value, size]);

  if (!src) {
    return (
      <div
        className={`animate-pulse rounded-[6px] bg-fill/10 ${className}`}
        style={{ width: size, height: size }}
        aria-hidden="true"
      />
    );
  }

  // eslint-disable-next-line @next/next/no-img-element
  return (
    <img
      src={src}
      alt="Código QR de tu pedido"
      width={size}
      height={size}
      className={`rounded-[6px] ${className}`}
    />
  );
}
