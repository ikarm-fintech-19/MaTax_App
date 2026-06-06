// Locale-aware number, currency, and date formatters for Matax.
// All amounts are in DZD (Algerian Dinar).

export type Locale = "fr" | "ar" | "en";

const intlLocale: Record<Locale, string> = {
  fr: "fr-DZ",
  ar: "ar-DZ",
  en: "en-DZ",
};

export function formatCurrency(amount: number, locale: Locale = "fr"): string {
  if (!Number.isFinite(amount)) return "—";
  return new Intl.NumberFormat(intlLocale[locale], {
    style: "currency",
    currency: "DZD",
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatNumber(n: number, locale: Locale = "fr", digits = 2): string {
  if (!Number.isFinite(n)) return "—";
  return new Intl.NumberFormat(intlLocale[locale], {
    maximumFractionDigits: digits,
    minimumFractionDigits: 0,
  }).format(n);
}

export function formatPercent(n: number, locale: Locale = "fr", digits = 2): string {
  return new Intl.NumberFormat(intlLocale[locale], {
    style: "percent",
    maximumFractionDigits: digits,
  }).format(n);
}

export function parseAmount(input: string): number {
  if (!input) return 0;
  const cleaned = input.replace(/[^\d.,-]/g, "").replace(/\s/g, "").replace(",", ".");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}
