// IBS — Impôt sur les Bénéfices des Sociétés (corporate income tax).
// Rates per Article 150 CIDTA (LF 2026): activity-dependent.

export type IbsActivity =
  | "production" // 19% — production of goods
  | "btp_tourism" // 23% — BTP, tourism, thermal activities (excl. travel agencies)
  | "services_trade" // 26% — services, trade, other
  | "banks_insurance"; // 26% — banks and insurance (since LF 2023)

export const IBS_RATES: Record<IbsActivity, number> = {
  production: 0.19,
  btp_tourism: 0.23,
  services_trade: 0.26,
  banks_insurance: 0.26,
};

export const IBS_ACTIVITY_LABELS: Record<IbsActivity, { fr: string; ar: string; en: string }> = {
  production: { fr: "Production de biens", ar: "إنتاج السلع", en: "Production of goods" },
  btp_tourism: { fr: "BTP & tourisme", ar: "البناء و السياحة", en: "Construction & tourism" },
  services_trade: { fr: "Services & commerce", ar: "الخدمات و التجارة", en: "Services & trade" },
  banks_insurance: {
    fr: "Banques & assurances",
    ar: "البنوك و التأمينات",
    en: "Banks & insurance",
  },
};

export interface IbsInput {
  activity: IbsActivity;
  /** Annual taxable profit, DZD */
  taxableProfit: number;
  /** Optional credits / withheld at source already paid */
  creditsAlreadyPaid?: number;
}

export interface IbsResult {
  activity: IbsActivity;
  rate: number;
  taxableProfit: number;
  /** Gross IBS due */
  ibs: number;
  /** Minimum IBS (10,000 DZD per Art. 137 CIDTA) */
  minimumDue: number;
  /** IBS after minimum is applied */
  ibsDue: number;
  /** Net after credits */
  netDue: number;
  /** Acomptes provisionnels (3 × 30% of N-1) */
  installments: { first: number; second: number; third: number };
}

const MINIMUM_IBS = 10_000;

export function calculateIbs(input: IbsInput): IbsResult {
  const rate = IBS_RATES[input.activity];
  const profit = Math.max(0, input.taxableProfit || 0);
  const ibs = profit * rate;
  const ibsDue = Math.max(ibs, MINIMUM_IBS);
  const credits = Math.max(0, input.creditsAlreadyPaid || 0);
  const netDue = Math.max(0, ibsDue - credits);
  const installment = ibsDue * 0.3;
  return {
    activity: input.activity,
    rate,
    taxableProfit: profit,
    ibs,
    minimumDue: MINIMUM_IBS,
    ibsDue,
    netDue,
    installments: { first: installment, second: installment, third: installment },
  };
}
