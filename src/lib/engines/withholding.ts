// Dividend / foreign withholding tax engine.
// Rates from G50 form and CIDTA articles.

export type WithholdingKind =
  | "dividends_resident_individual" // 10%
  | "dividends_nonresident" // 15%
  | "foreign_services" // 24% (prestations étrangères)
  | "foreign_royalties" // 24% (brevets, marques)
  | "foreign_artists" // 15%
  | "interest_resident" // 10%
  | "interest_savings_low" // 1% (≤ 50 000)
  | "interest_savings_high" // 10% (> 50 000)
  | "capital_gains_resident" // 15%
  | "capital_gains_nonresident"; // 20%

export const WITHHOLDING_RATES: Record<WithholdingKind, number> = {
  dividends_resident_individual: 0.10,
  dividends_nonresident: 0.15,
  foreign_services: 0.24,
  foreign_royalties: 0.24,
  foreign_artists: 0.15,
  interest_resident: 0.10,
  interest_savings_low: 0.01,
  interest_savings_high: 0.10,
  capital_gains_resident: 0.15,
  capital_gains_nonresident: 0.20,
};

export const WITHHOLDING_LABELS: Record<
  WithholdingKind,
  { fr: string; ar: string; en: string }
> = {
  dividends_resident_individual: {
    fr: "Dividendes — personne physique résidente",
    ar: "أرباح موزعة - شخص طبيعي مقيم",
    en: "Dividends — resident individual",
  },
  dividends_nonresident: {
    fr: "Dividendes — non-résident",
    ar: "أرباح موزعة - غير مقيم",
    en: "Dividends — non-resident",
  },
  foreign_services: {
    fr: "Prestations de services — entreprise étrangère",
    ar: "خدمات - مؤسسة أجنبية",
    en: "Services — foreign company",
  },
  foreign_royalties: {
    fr: "Redevances brevets/marques — étranger",
    ar: "إتاوات براءات - أجنبي",
    en: "Royalties — foreign",
  },
  foreign_artists: {
    fr: "Cachets d'artistes étrangers",
    ar: "أتعاب الفنانين الأجانب",
    en: "Foreign artist fees",
  },
  interest_resident: {
    fr: "Intérêts des créances/dépôts",
    ar: "فوائد الديون والودائع",
    en: "Interest on debts/deposits",
  },
  interest_savings_low: {
    fr: "Intérêts livret épargne — fraction ≤ 50 000 DA",
    ar: "فوائد دفتر الادخار - الجزء ≤ 50 000 د.ج",
    en: "Savings interest — share ≤ 50,000 DZD",
  },
  interest_savings_high: {
    fr: "Intérêts livret épargne — fraction > 50 000 DA",
    ar: "فوائد دفتر الادخار - الجزء > 50 000 د.ج",
    en: "Savings interest — share > 50,000 DZD",
  },
  capital_gains_resident: {
    fr: "Plus-values cession d'actions — résident",
    ar: "أرباح رأس المال - مقيم",
    en: "Capital gains on shares — resident",
  },
  capital_gains_nonresident: {
    fr: "Plus-values cession d'actions — non-résident",
    ar: "أرباح رأس المال - غير مقيم",
    en: "Capital gains on shares — non-resident",
  },
};

export interface WithholdingLine {
  kind: WithholdingKind;
  base: number;
}

export interface WithholdingResult {
  totalBase: number;
  totalWithheld: number;
  lines: Array<{ kind: WithholdingKind; base: number; rate: number; amount: number }>;
}

export function calculateWithholding(lines: WithholdingLine[]): WithholdingResult {
  const out = lines.map((l) => {
    const rate = WITHHOLDING_RATES[l.kind];
    const base = Math.max(0, l.base || 0);
    return { kind: l.kind, base, rate, amount: base * rate };
  });
  return {
    totalBase: out.reduce((s, l) => s + l.base, 0),
    totalWithheld: out.reduce((s, l) => s + l.amount, 0),
    lines: out,
  };
}
