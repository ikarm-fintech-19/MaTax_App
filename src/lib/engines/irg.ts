// IRG (Impôt sur le Revenu Global) — salary income tax engine.
// Algerian Loi de Finances 2026 brackets (annual, in DZD).
// Source: Article 104 CIDTA as amended by recent LF.

export interface IrgBracket {
  /** Inclusive lower bound, annual DZD */
  from: number;
  /** Exclusive upper bound, annual DZD. null = no upper bound */
  to: number | null;
  /** Marginal rate */
  rate: number;
}

export const IRG_BRACKETS_ANNUAL: IrgBracket[] = [
  { from: 0, to: 240_000, rate: 0.0 },
  { from: 240_000, to: 480_000, rate: 0.23 },
  { from: 480_000, to: 960_000, rate: 0.27 },
  { from: 960_000, to: 1_920_000, rate: 0.3 },
  { from: 1_920_000, to: 3_840_000, rate: 0.33 },
  { from: 3_840_000, to: null, rate: 0.35 },
];

export interface IrgInput {
  /** Gross monthly salary in DZD */
  grossMonthly: number;
  /** Social-security contributions (CNAS 9%) — typically auto */
  cnasRate?: number;
  /** Additional monthly deductions (mutuelle, retraite complémentaire…) */
  otherDeductions?: number;
  /** Number of dependent children (informational; LF 2022+ has no per-child rebate) */
  children?: number;
  /** Marital status (informational) */
  maritalStatus?: "single" | "married";
  /** Whether the worker is a retiree or has visual, mental, motor, or hearing disabilities */
  isHandicappedOrRetiree?: boolean;
}

export interface IrgResult {
  grossMonthly: number;
  cnas: number;
  otherDeductions: number;
  taxableMonthly: number;
  taxableAnnual: number;
  /** Raw monthly IRG before abatement */
  irgBase: number;
  /** Low-salary abatement applied (Art. 104 bis) */
  abatement: number;
  /** IRG after abatement but before lissage */
  irgAbated: number;
  /** Monthly IRG due (after lissage/exemptions) */
  irgMonthly: number;
  /** Net monthly salary */
  netMonthly: number;
  isHandicappedOrRetiree: boolean;
  /** Per-bracket breakdown */
  breakdown: Array<{
    bracket: IrgBracket;
    taxableInBracket: number;
    tax: number;
  }>;
}

function computeAnnualIrg(taxableAnnual: number): {
  total: number;
  breakdown: IrgResult["breakdown"];
} {
  let remaining = taxableAnnual;
  let total = 0;
  const breakdown: IrgResult["breakdown"] = [];
  for (const b of IRG_BRACKETS_ANNUAL) {
    if (remaining <= 0) break;
    const width = b.to == null ? remaining : Math.max(0, b.to - b.from);
    if (taxableAnnual <= b.from) break;
    const taxableInBracket = Math.min(taxableAnnual - b.from, width);
    if (taxableInBracket <= 0) break;
    const tax = taxableInBracket * b.rate;
    total += tax;
    breakdown.push({ bracket: b, taxableInBracket, tax });
  }
  return { total, breakdown };
}

export function calculateIrg(input: IrgInput): IrgResult {
  const gross = Math.max(0, input.grossMonthly || 0);
  const cnasRate = input.cnasRate ?? 0.09;
  const cnas = gross * cnasRate;
  const otherDeductions = Math.max(0, input.otherDeductions || 0);
  const taxableMonthly = Math.max(0, gross - cnas - otherDeductions);
  const taxableAnnual = taxableMonthly * 12;

  const { total: annualIrg, breakdown } = computeAnnualIrg(taxableAnnual);
  const baseMonthly = annualIrg / 12;

  let abatement = 0;
  let irgAbated = 0;
  let irgMonthly = 0;
  const isHandicapped = !!input.isHandicappedOrRetiree;

  if (taxableMonthly <= 30000) {
    // Exempt under Art. 104 bis
    abatement = 0;
    irgAbated = 0;
    irgMonthly = 0;
  } else {
    // 40% proportional abatement, min 1000, max 1500 DZD, capped at baseMonthly itself
    abatement = baseMonthly * 0.4;
    abatement = Math.min(baseMonthly, Math.min(1500, Math.max(1000, abatement)));
    irgAbated = Math.max(0, baseMonthly - abatement);

    if (isHandicapped) {
      // Disabled workers & general retirees lissage: 30,001 to 42,500 DZD
      if (taxableMonthly <= 42500) {
        irgMonthly = Math.max(0, irgAbated * (93 / 61) - 81213 / 41);
      } else {
        irgMonthly = irgAbated;
      }
    } else {
      // Standard worker lissage: 30,001 to 35,000 DZD
      if (taxableMonthly <= 35000) {
        irgMonthly = Math.max(0, irgAbated * (137 / 51) - 27925 / 8);
      } else {
        irgMonthly = irgAbated;
      }
    }
  }

  // Round IRG to nearest decimal/integer if needed, but let's keep precise double and let the view format it
  const netMonthly = gross - cnas - otherDeductions - irgMonthly;

  return {
    grossMonthly: gross,
    cnas,
    otherDeductions,
    taxableMonthly,
    taxableAnnual,
    irgBase: baseMonthly,
    abatement,
    irgAbated,
    irgMonthly,
    netMonthly,
    isHandicappedOrRetiree: isHandicapped,
    breakdown,
  };
}
