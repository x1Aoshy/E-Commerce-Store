export type Currency = "NIO" | "USD";

export const CURRENCY_COOKIE = "aosh_currency";
const configuredRate = Number(process.env.NEXT_PUBLIC_USD_EXCHANGE_RATE);
export const USD_EXCHANGE_RATE =
  Number.isFinite(configuredRate) && configuredRate > 0 ? configuredRate : 36.6243;

export function normalizeCurrency(value: unknown): Currency {
  return value === "USD" ? "USD" : "NIO";
}

// Los importes persistidos siempre están en córdobas. Convertir sólo al mostrar.
export function convertPrice(value: unknown, currency: Currency = "NIO") {
  const number = Number(value);
  const amount = Number.isFinite(number) ? number : 0;
  return currency === "USD" ? amount / USD_EXCHANGE_RATE : amount;
}

export function formatPrice(value: unknown, currency: Currency = "NIO") {
  const symbol = currency === "USD" ? "US$" : "C$";
  return `${symbol}${convertPrice(value, currency).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
