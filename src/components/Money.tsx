"use client";

import { useCurrency } from "@/context/CurrencyContext";

export default function Money({ value }: { value: number }) {
  const { formatPrice } = useCurrency();
  return <>{formatPrice(value)}</>;
}
