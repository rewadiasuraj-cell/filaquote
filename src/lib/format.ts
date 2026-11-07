import type { Currency } from "./pricing";

const moneyCache = new Map<string, Intl.NumberFormat>();

export function formatMoney(value: number, currency: Currency): string {
  const abs = Math.abs(value);
  const digits = abs < 100 ? 2 : 0;
  const key = `${currency}-${digits}`;
  let f = moneyCache.get(key);
  if (!f) {
    f = new Intl.NumberFormat(currency === "INR" ? "en-IN" : "en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    });
    moneyCache.set(key, f);
  }
  return f.format(Number.isFinite(value) ? value : 0);
}

export const currencySymbol = (c: Currency) => (c === "INR" ? "₹" : "$");

export function formatNumber(v: number, digits = 1): string {
  return v.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

export function formatDuration(hours: number): string {
  const mins = Math.round(hours * 60);
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
