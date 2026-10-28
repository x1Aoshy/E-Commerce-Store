"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import {
  CURRENCY_COOKIE,
  formatPrice,
  normalizeCurrency,
  type Currency,
} from "@/lib/format";

const CurrencyContext = createContext<{
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  formatPrice: (value: unknown) => string;
}>({ currency: "NIO", setCurrency: () => {}, formatPrice });

export function CurrencyProvider({ children, initialCurrency = "NIO" }: {
  children: React.ReactNode;
  initialCurrency?: Currency;
}) {
  const [currency, setCurrencyState] = useState(initialCurrency);
  const pathname = usePathname();
  const setCurrency = useCallback((value: Currency) => {
    const next = normalizeCurrency(value);
    setCurrencyState(next);
    document.cookie = `${CURRENCY_COOKIE}=${next}; Path=/; Max-Age=31536000; SameSite=Lax`;
    const url = new URL(window.location.href);
    if (url.searchParams.has("currency")) {
      url.searchParams.set("currency", next);
      window.history.replaceState(window.history.state, "", url);
    }
  }, []);

  // Los enlaces y QR del recibo conservan la moneda elegida por quien lo emitió.
  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("currency");
    if (requested === "USD" || requested === "NIO") setCurrency(requested);
  }, [pathname, setCurrency]);

  const value = useMemo(() => ({
    currency,
    setCurrency,
    formatPrice: (amount: unknown) => formatPrice(amount, currency),
  }), [currency, setCurrency]);

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency() {
  return useContext(CurrencyContext);
}
