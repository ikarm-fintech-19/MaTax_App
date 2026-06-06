// G50 — Algerian VAT (TVA) engine.
// Mirrors the official "Série G n°50 (2025)" form, section 11 (TVA),
// part A (Chiffres d'affaires imposables) and part B (Déductions).
// All amounts are DZD. CA is entered HT (hors taxe). Negative inputs are
// clamped to 0 to keep arithmetic safe.

export type TvaRate = 0 | 0.09 | 0.19;

/** A single operation line in section A of the G50, identified by its
 *  official code (e.g. E3B1, E3B8). The rate is fixed by the form. */
export interface OperationLineDef {
  code: string;
  /** French label as it appears on the form. */
  label: string;
  rate: TvaRate;
  /** "imposable" = taxed at `rate`, "exonere" = exonerated (rate 0, CA only). */
  kind: "imposable" | "exonere";
}

/** User-entered amount per operation line. */
export interface OperationLineInput {
  code: string;
  /** Chiffre d'affaires (HT) for this line. */
  caHT: number;
}

/** B/ Déductions à opérer — codes E3B90..E3B95. */
export interface DeductionsInput {
  /** E3B90 — Précompte antérieur. */
  precompteAnterieur: number;
  /** E3B91 — TVA sur achats biens/services (art. 29). */
  tvaAchatsBiensServices: number;
  /** E3B92 — TVA sur achat de biens (art. 38). */
  tvaAchatsBiens: number;
  /** E3B93 — Régularisation prorata (déduction complémentaire) art. 40. */
  proRataDeductionComplementaire: number;
  /** E3B94 — TVA à récupérer sur factures annulées/impayées (art. 18). */
  tvaFacturesAnnulees: number;
  /** E3B95 — Autres déductions. */
  autresDeductions: number;
}

export interface G50Input {
  period: { kind: "monthly" | "quarterly"; year: number; month?: number; quarter?: number };
  operations: OperationLineInput[];
  deductions: DeductionsInput;
  /** E3B97 — Régularisation prorata (+), déduction excédentaire à rappeler. */
  regularisationProrataPlus?: number;
  /** E3B98 — Régularisation régime acomptes (+). */
  regularisationAcomptes?: number;
  /** E3B99 — Reversement de la déduction (art. 38) (+). */
  reversementDeduction?: number;
  /** E3B140 — TVA auto-liquidée à payer (art. 83). Adds to TVA due. */
  tvaAutoLiquidee?: number;
}

export interface G50LineResult {
  code: string;
  label: string;
  rate: TvaRate;
  caHT: number;
  tva: number;
}

export interface G50Result {
  /** Section A lines with computed TVA. */
  lines: G50LineResult[];
  /** A) Total des droits dus = sum of TVA on imposable lines (E3B96). */
  totalDroitsDus: number;
  /** Total CA imposable HT. */
  totalCAImposable: number;
  /** Total CA exonéré. */
  totalCAExonere: number;
  /** Total CA global. */
  totalCAGlobal: number;
  /** Subtotals by rate (for the recap). */
  byRate: Array<{ rate: TvaRate; caHT: number; tva: number }>;
  /** B) Total des déductions à opérer (E3B110). */
  totalDeductions: number;
  /** C) Total à rappeler — droits dus + régularisations + reversement (E3B100). */
  totalRappeler: number;
  /** E3B120 — TVA à payer (C - B), >= 0. */
  tvaAPayer: number;
  /** E3B130 — Précompte à reporter (B - C), >= 0. */
  precompteAReporter: number;
  /** E3B140 — TVA auto-liquidée à payer. */
  tvaAutoLiquidee: number;
  /** Final amount that ends up in the recap line "11- TVA à payer C/500020". */
  totalTvaAPayer: number;
}

/** Catalogue of official G50 operation lines, in the order they appear on
 *  the form. Source: Série G n°50 (2025), section 11/A. */
export const G50_OPERATION_LINES: OperationLineDef[] = [
  // 1) Opérations assujetties à la TVA — taux réduit 9%
  { code: "E3B1", label: "Biens, produits et denrées visés à l'art. 23 du CTCA", rate: 0.09, kind: "imposable" },
  { code: "E3B2", label: "Prestations de services visées à l'art. 23 du CTCA", rate: 0.09, kind: "imposable" },
  { code: "E3B3", label: "Opérations immobilières visées à l'art. 23 du CTCA", rate: 0.09, kind: "imposable" },
  { code: "E3B4", label: "Actes médicaux", rate: 0.09, kind: "imposable" },
  { code: "E3B5", label: "Commissionnaires et courtiers", rate: 0.09, kind: "imposable" },
  { code: "E3B6", label: "Fourniture d'énergie (9%)", rate: 0.09, kind: "imposable" },
  { code: "E3B7", label: "Autres opérations à 9%", rate: 0.09, kind: "imposable" },
  // 2) Opérations assujetties à la TVA — taux normal 19%
  { code: "E3B8", label: "Productions : biens, produits et denrées (art. 21 CTCA)", rate: 0.19, kind: "imposable" },
  { code: "E3B9", label: "Revente en l'état : biens, produits et denrées (art. 21 CTCA)", rate: 0.19, kind: "imposable" },
  { code: "E3B10", label: "Travaux immobiliers autres que ceux soumis au taux de 9%", rate: 0.19, kind: "imposable" },
  { code: "E3B11", label: "Professions libérales", rate: 0.19, kind: "imposable" },
  { code: "E3B12", label: "Opérations de téléphone et d'internet", rate: 0.19, kind: "imposable" },
  { code: "E3B13", label: "Tabacs et allumettes", rate: 0.19, kind: "imposable" },
  { code: "E3B14", label: "Spectacles, jeux et divertissements (art. 21 CTCA)", rate: 0.19, kind: "imposable" },
  { code: "E3B15", label: "TVA produits pétroliers", rate: 0.19, kind: "imposable" },
  { code: "E3B16", label: "Concessionnaires autos", rate: 0.19, kind: "imposable" },
  { code: "E3B17", label: "Producteurs de médicaments", rate: 0.19, kind: "imposable" },
  { code: "E3B18", label: "Importateurs de médicaments", rate: 0.19, kind: "imposable" },
  { code: "E3B19", label: "Banques et établissements financiers", rate: 0.19, kind: "imposable" },
  { code: "E3B20", label: "Assurances", rate: 0.19, kind: "imposable" },
  { code: "E3B21", label: "Fourniture d'énergie (19%)", rate: 0.19, kind: "imposable" },
  { code: "E3B22", label: "Régime des acomptes TVA (19%)", rate: 0.19, kind: "imposable" },
  { code: "E3B23", label: "Régime des acomptes TVA (9%)", rate: 0.09, kind: "imposable" },
  // 3) Chiffre d'affaires non-imposable / exonéré (art. 9 CTCA)
  { code: "E3B30", label: "Exportation (exonérée)", rate: 0, kind: "exonere" },
  { code: "E3B31", label: "Médicaments (exonérés)", rate: 0, kind: "exonere" },
  { code: "E3B25", label: "Produits de première nécessité (art. 9/2 CTCA)", rate: 0, kind: "exonere" },
];

const LINE_BY_CODE: Map<string, OperationLineDef> = new Map(
  G50_OPERATION_LINES.map((l) => [l.code, l]),
);

function clamp(n: unknown): number {
  const v = typeof n === "number" ? n : Number(n);
  return Number.isFinite(v) && v > 0 ? v : 0;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function emptyDeductions(): DeductionsInput {
  return {
    precompteAnterieur: 0,
    tvaAchatsBiensServices: 0,
    tvaAchatsBiens: 0,
    proRataDeductionComplementaire: 0,
    tvaFacturesAnnulees: 0,
    autresDeductions: 0,
  };
}

export function calculateG50(input: G50Input): G50Result {
  const lines: G50LineResult[] = [];
  let totalDroitsDus = 0;
  let totalCAImposable = 0;
  let totalCAExonere = 0;
  const rateMap = new Map<TvaRate, { caHT: number; tva: number }>();

  for (const op of input.operations) {
    const def = LINE_BY_CODE.get(op.code);
    if (!def) continue;
    const caHT = clamp(op.caHT);
    if (caHT === 0) continue;
    const tva = def.kind === "exonere" ? 0 : round2(caHT * def.rate);
    lines.push({ code: def.code, label: def.label, rate: def.rate, caHT, tva });
    if (def.kind === "exonere") {
      totalCAExonere += caHT;
    } else {
      totalCAImposable += caHT;
      totalDroitsDus += tva;
      const cur = rateMap.get(def.rate) ?? { caHT: 0, tva: 0 };
      rateMap.set(def.rate, { caHT: cur.caHT + caHT, tva: round2(cur.tva + tva) });
    }
  }

  const d = input.deductions;
  const totalDeductions = round2(
    clamp(d.precompteAnterieur) +
      clamp(d.tvaAchatsBiensServices) +
      clamp(d.tvaAchatsBiens) +
      clamp(d.proRataDeductionComplementaire) +
      clamp(d.tvaFacturesAnnulees) +
      clamp(d.autresDeductions),
  );

  const totalRappeler = round2(
    totalDroitsDus +
      clamp(input.regularisationProrataPlus) +
      clamp(input.regularisationAcomptes) +
      clamp(input.reversementDeduction),
  );

  const balance = round2(totalRappeler - totalDeductions);
  const tvaAPayer = balance > 0 ? balance : 0;
  const precompteAReporter = balance < 0 ? -balance : 0;
  const tvaAutoLiquidee = clamp(input.tvaAutoLiquidee);
  const totalTvaAPayer = round2(tvaAPayer + tvaAutoLiquidee);

  return {
    lines,
    totalDroitsDus: round2(totalDroitsDus),
    totalCAImposable: round2(totalCAImposable),
    totalCAExonere: round2(totalCAExonere),
    totalCAGlobal: round2(totalCAImposable + totalCAExonere),
    byRate: Array.from(rateMap.entries()).map(([rate, v]) => ({ rate, ...v })),
    totalDeductions,
    totalRappeler,
    tvaAPayer,
    precompteAReporter,
    tvaAutoLiquidee,
    totalTvaAPayer,
  };
}

/** Tiny self-test invoked from a unit-test runner if/when one is added. */
export function _testCalculateG50() {
  const result = calculateG50({
    period: { kind: "monthly", year: 2026, month: 5 },
    operations: [
      { code: "E3B8", caHT: 1_000_000 }, // 19% → 190 000
      { code: "E3B1", caHT: 500_000 }, //  9% →  45 000
      { code: "E3B30", caHT: 200_000 }, // export exonéré
    ],
    deductions: {
      ...emptyDeductions(),
      tvaAchatsBiensServices: 80_000,
      precompteAnterieur: 5_000,
    },
  });
  // collected = 235 000, deductions = 85 000, à payer = 150 000
  if (result.totalDroitsDus !== 235_000) throw new Error("droits dus");
  if (result.totalDeductions !== 85_000) throw new Error("deductions");
  if (result.tvaAPayer !== 150_000) throw new Error("tvaAPayer");
  if (result.totalCAExonere !== 200_000) throw new Error("exonere");
  return result;
}
