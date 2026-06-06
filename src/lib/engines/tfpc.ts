// TFPC (Taxe de Formation Professionnelle Continue) and TA (Taxe d'Apprentissage) engine.
// Grounded in LF 2026 (Articles 18-21) / Articles 196 bis to sexies of CIDTA.

export interface TfpcInput {
  /** Semestrial gross payroll (Masse salariale brute semestrielle - MSBS) in DZD */
  grossPayroll: number;
  /** Professional training expenses in DZD */
  trainingExpenses: number;
  /** Apprenticeship and student internship expenses in DZD */
  apprenticeshipExpenses: number;
  /** Whether the gap in apprenticeship target is justified (allowing excess training offset) */
  isApprenticeshipGapJustified?: boolean;
  /** Number of employees in the company (tax applies only if >= 20 employees) */
  employeeCount: number;
  /** The year of the declaration */
  year: number;
  /** The semester (1 or 2) */
  semester: 1 | 2;
}

export interface TfpcResult {
  grossPayroll: number;
  employeeCount: number;
  year: number;
  semester: 1 | 2;
  isSubjectToTax: boolean;

  // TFPC Metrics
  tfpcTarget: number; // 1% of payroll
  trainingExpenses: number;
  trainingRatio: number;
  tfpcDue: number; // Final TFPC due

  // TA Metrics
  taTarget: number; // 1% of payroll
  apprenticeshipExpenses: number;
  apprenticeshipRatio: number;
  taDueBeforeOffset: number;
  trainingSurplus: number; // Excess training expenses that can offset TA
  isApprenticeshipGapJustified: boolean;
  apprenticeshipOffsetApplied: number;
  taDue: number; // Final TA due

  // Totals
  totalDue: number; // tfpcDue + taDue
}

export function calculateTfpc(input: TfpcInput): TfpcResult {
  const payroll = Math.max(0, input.grossPayroll || 0);
  const employeeCount = Math.max(0, input.employeeCount || 0);
  const trainingExpenses = Math.max(0, input.trainingExpenses || 0);
  const apprenticeshipExpenses = Math.max(0, input.apprenticeshipExpenses || 0);
  const isApprenticeshipGapJustified = input.isApprenticeshipGapJustified ?? true;

  const isSubjectToTax = employeeCount >= 20;

  const tfpcTarget = payroll * 0.01;
  const taTarget = payroll * 0.01;

  const trainingRatio = payroll > 0 ? trainingExpenses / payroll : 0;
  const apprenticeshipRatio = payroll > 0 ? apprenticeshipExpenses / payroll : 0;

  // TFPC due: 1% of payroll minus eligible training expenses
  const tfpcDue = isSubjectToTax ? Math.max(0, tfpcTarget - trainingExpenses) : 0;

  // Training surplus: spending above the 1% target
  const trainingSurplus = Math.max(0, trainingExpenses - tfpcTarget);

  // TA due before offset: 1% of payroll minus apprenticeship expenses
  const taDueBeforeOffset = isSubjectToTax ? Math.max(0, taTarget - apprenticeshipExpenses) : 0;

  // Offset applied: if the gap is justified, we can use the training surplus to reduce the TA due
  const apprenticeshipOffsetApplied = (isSubjectToTax && isApprenticeshipGapJustified)
    ? Math.min(taDueBeforeOffset, trainingSurplus)
    : 0;

  const taDue = isSubjectToTax ? Math.max(0, taDueBeforeOffset - apprenticeshipOffsetApplied) : 0;
  const totalDue = tfpcDue + taDue;

  return {
    grossPayroll: payroll,
    employeeCount,
    year: input.year,
    semester: input.semester,
    isSubjectToTax,
    tfpcTarget,
    trainingExpenses,
    trainingRatio,
    tfpcDue,
    taTarget,
    apprenticeshipExpenses,
    apprenticeshipRatio,
    taDueBeforeOffset,
    trainingSurplus,
    isApprenticeshipGapJustified,
    apprenticeshipOffsetApplied,
    taDue,
    totalDue,
  };
}
