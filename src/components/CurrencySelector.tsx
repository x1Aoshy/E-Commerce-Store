"use client";

import { useCurrency } from "@/context/CurrencyContext";
import { useLang } from "@/context/LanguageContext";
import { normalizeCurrency, USD_EXCHANGE_RATE } from "@/lib/format";

export default function CurrencySelector() {
  const { currency, setCurrency } = useCurrency();
  const { lang } = useLang();
  return (
    <select
      aria-label={lang === "en" ? "Currency" : "Moneda"}
      value={currency}
      onChange={(event) => setCurrency(normalizeCurrency(event.target.value))}
      title={`US$1 = C$${USD_EXCHANGE_RATE}`}
      className="h-9 w-32 border border-line/20 bg-night px-2 text-xs font-semibold text-ink focus:border-accent-400 focus:outline-none"
    >
      <option value="NIO">C$ · {lang === "en" ? "Cordobas" : "Córdobas"}</option>
      <option value="USD">US$ · {lang === "en" ? "Dollars" : "Dólares"}</option>
    </select>
  );
}
