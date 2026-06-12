import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { calculateTfpc } from "@/lib/engines/tfpc";
import { formatCurrency, formatPercent } from "@/lib/format";
import { Info, HelpCircle, Lock, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useSaveDeclaration } from "@/hooks/use-save-declaration";
import { downloadTfpcPdf } from "@/lib/pdf/tfpc-pdf";

export const Route = createFileRoute("/_app/tfpc")({ component: Page });

function Page() {
  const { t, locale } = useI18n();
  const { subscriptionTier } = useAuth();
  const { save } = useSaveDeclaration();
  const hasAccess = subscriptionTier === "business" || subscriptionTier === "enterprise";

  // Inputs state
  const [grossPayroll, setGrossPayroll] = useState(6500000);
  const [trainingExpenses, setTrainingExpenses] = useState(45000);
  const [apprenticeshipExpenses, setApprenticeshipExpenses] = useState(25000);
  const [employeeCount, setEmployeeCount] = useState(25);
  const [year, setYear] = useState(2026);
  const [semester, setSemester] = useState<1 | 2>(1);
  const [isApprenticeshipGapJustified, setIsApprenticeshipGapJustified] = useState(true);

  const result = useMemo(() => {
    return calculateTfpc({
      grossPayroll,
      trainingExpenses,
      apprenticeshipExpenses,
      employeeCount,
      year,
      semester,
      isApprenticeshipGapJustified,
    });
  }, [
    grossPayroll,
    trainingExpenses,
    apprenticeshipExpenses,
    employeeCount,
    year,
    semester,
    isApprenticeshipGapJustified,
  ]);

  // Compute deadline dates
  const deadlineDate = useMemo(() => {
    if (semester === 1) {
      return locale === "ar"
        ? `20 جويلية ${year}`
        : locale === "en"
          ? `July 20, ${year}`
          : `20 juillet ${year}`;
    } else {
      return locale === "ar"
        ? `20 جانفي ${year + 1}`
        : locale === "en"
          ? `January 20, ${year + 1}`
          : `20 janvier ${year + 1}`;
    }
  }, [semester, year, locale]);

  return (
    <div className="space-y-8">
      {/* Breadcrumbs */}
      <div className="text-sm font-medium text-ink-muted flex items-center gap-2 mb-2">
        <Link to="/dashboard" className="hover:text-primary transition-colors">
          {locale === "ar" ? "لوحة التحكم" : locale === "en" ? "Dashboard" : "Tableau de bord"}
        </Link>
        <span>/</span>
        <span className="text-ink">{t("tfpc.title")}</span>
      </div>

      <header className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="headline-text">{t("tfpc.title")}</h1>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
              result.isSubjectToTax
                ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${result.isSubjectToTax ? "bg-emerald-500" : "bg-amber-500"}`}
            />
            {result.isSubjectToTax ? t("tfpc.subjectToTax") : t("tfpc.exemptSize")}
          </span>
        </div>
        <p className="text-ink-muted">{t("tfpc.subtitle")}</p>
      </header>

      {/* Main Grid */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Form panel */}
        <section className="surface-card space-y-4 lg:col-span-5 h-fit">
          <h2 className="title-text">
            {locale === "ar"
              ? "معطيات التصريح"
              : locale === "en"
                ? "Declaration parameters"
                : "Paramètres de la déclaration"}
          </h2>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-text mb-1 block">{t("tfpc.year")}</label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="w-full rounded-lg border border-input bg-surface px-3 py-2 focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="label-text mb-1 block">{t("tfpc.semester")}</label>
              <select
                value={semester}
                onChange={(e) => setSemester(Number(e.target.value) as 1 | 2)}
                className="w-full rounded-lg border border-input bg-surface px-3 py-2 focus:border-primary focus:outline-none"
              >
                <option value={1}>
                  {locale === "ar" ? "السداسي 1" : locale === "en" ? "Semester 1" : "Semestre 1"}
                </option>
                <option value={2}>
                  {locale === "ar" ? "السداسي 2" : locale === "en" ? "Semester 2" : "Semestre 2"}
                </option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-text mb-1 block">{t("tfpc.employeeCount")}</label>
              <input
                type="number"
                min={0}
                value={employeeCount}
                onChange={(e) => setEmployeeCount(Number(e.target.value))}
                className="w-full rounded-lg border border-input bg-surface px-3 py-2 focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="label-text mb-1 block">
                {locale === "ar"
                  ? "الهدف القانوني"
                  : locale === "en"
                    ? "Legal Target"
                    : "Taux cible"}
              </label>
              <div className="w-full rounded-lg bg-muted px-3 py-2 text-ink-muted text-sm border border-border">
                1.00 % ({locale === "ar" ? "لكل رسم" : locale === "en" ? "each tax" : "chaque taxe"}
                )
              </div>
            </div>
          </div>

          <div>
            <label className="label-text mb-1 block">{t("tfpc.payroll")}</label>
            <input
              type="number"
              min={0}
              step={1000}
              value={grossPayroll}
              onChange={(e) => setGrossPayroll(Number(e.target.value))}
              className="w-full rounded-lg border border-input bg-surface px-3 py-2 tabular-nums focus:border-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="label-text mb-1 block">{t("tfpc.trainingExpenses")}</label>
            <input
              type="number"
              min={0}
              step={100}
              value={trainingExpenses}
              onChange={(e) => setTrainingExpenses(Number(e.target.value))}
              className="w-full rounded-lg border border-input bg-surface px-3 py-2 tabular-nums focus:border-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="label-text mb-1 block">{t("tfpc.apprenticeshipExpenses")}</label>
            <input
              type="number"
              min={0}
              step={100}
              value={apprenticeshipExpenses}
              onChange={(e) => setApprenticeshipExpenses(Number(e.target.value))}
              className="w-full rounded-lg border border-input bg-surface px-3 py-2 tabular-nums focus:border-primary focus:outline-none"
            />
          </div>

          {result.isSubjectToTax && (
            <div className="flex items-start gap-2 pt-2 border-t border-border">
              <input
                id="gapJustified"
                type="checkbox"
                checked={isApprenticeshipGapJustified}
                onChange={(e) => setIsApprenticeshipGapJustified(e.target.checked)}
                className="mt-1 rounded border-input text-primary focus:ring-primary"
              />
              <label
                htmlFor="gapJustified"
                className="text-xs text-ink-muted cursor-pointer leading-tight"
              >
                {t("tfpc.justified")}
              </label>
            </div>
          )}
        </section>

        {/* Results panel */}
        <section className="space-y-6 lg:col-span-7 relative overflow-hidden">
          <div className={!hasAccess ? "blur-[5px] select-none pointer-events-none" : ""}>
            {/* Exemption alert */}
          {!result.isSubjectToTax && (
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-500 flex items-start gap-3">
              <Info className="h-5 w-5 shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold block mb-1">
                  {locale === "ar"
                    ? "إعفاء قانوني"
                    : locale === "en"
                      ? "Legal Exemption"
                      : "Exonération légale"}
                </strong>
                {locale === "ar"
                  ? "المؤسسات التي تشغل أقل من 20 عاملاً معفاة من هذه الرسوم وفقًا للمادة 196 مكرر من قانون الضرائب المباشرة."
                  : locale === "en"
                    ? "Employers with fewer than 20 workers are exempt from these taxes under Article 196 bis of direct tax code (CIDTA)."
                    : "Les employeurs occupant moins de 20 salariés sont exonérés de ces taxes selon l'article 196 bis du CIDTA."}
              </div>
            </div>
          )}

          {/* Cards for both taxes */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* TFPC details */}
            <div className="surface-card space-y-4">
              <div className="border-b border-border pb-2">
                <h3 className="font-semibold text-primary text-sm tracking-wide uppercase">
                  {locale === "ar"
                    ? "1- رسم التكوين المتواصل"
                    : locale === "en"
                      ? "1- Training Tax (TFPC)"
                      : "1- Taxe Formation (TFPC)"}
                </h3>
              </div>
              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-ink-muted">
                    {locale === "ar"
                      ? "الهدف (1%)"
                      : locale === "en"
                        ? "Target (1%)"
                        : "Cible (1%)"}
                  </span>
                  <span className="tabular-nums font-medium">
                    {formatCurrency(result.tfpcTarget, locale)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-muted">
                    {locale === "ar"
                      ? "النفقات المنجزة"
                      : locale === "en"
                        ? "Expenses"
                        : "Dépenses réalisées"}
                  </span>
                  <span className="tabular-nums text-emerald-500 font-medium">
                    − {formatCurrency(result.trainingExpenses, locale)}
                  </span>
                </div>
                <div className="flex justify-between border-t border-border/50 pt-2">
                  <span className="text-ink-muted">
                    {locale === "ar"
                      ? "نسبة الجهد"
                      : locale === "en"
                        ? "Effort Ratio"
                        : "Ratio d'effort"}
                  </span>
                  <span className="tabular-nums font-medium">
                    {formatPercent(result.trainingRatio, locale, 2)} / 1.00%
                  </span>
                </div>
                <div className="flex justify-between border-t border-border/50 pt-2 font-semibold text-ink">
                  <span>{t("tfpc.tfpcDue")}</span>
                  <span className="tabular-nums text-primary">
                    {formatCurrency(result.tfpcDue, locale)}
                  </span>
                </div>
              </div>
            </div>

            {/* TA details */}
            <div className="surface-card space-y-4">
              <div className="border-b border-border pb-2">
                <h3 className="font-semibold text-primary text-sm tracking-wide uppercase">
                  {locale === "ar"
                    ? "2- رسم التمهين"
                    : locale === "en"
                      ? "2- Apprenticeship Tax (TA)"
                      : "2- Taxe Apprentissage (TA)"}
                </h3>
              </div>
              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-ink-muted">
                    {locale === "ar"
                      ? "الهدف (1%)"
                      : locale === "en"
                        ? "Target (1%)"
                        : "Cible (1%)"}
                  </span>
                  <span className="tabular-nums font-medium">
                    {formatCurrency(result.taTarget, locale)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-muted">
                    {locale === "ar"
                      ? "النفقات المنجزة"
                      : locale === "en"
                        ? "Expenses"
                        : "Dépenses réalisées"}
                  </span>
                  <span className="tabular-nums text-emerald-500 font-medium">
                    − {formatCurrency(result.apprenticeshipExpenses, locale)}
                  </span>
                </div>
                {result.apprenticeshipOffsetApplied > 0 && (
                  <div className="flex justify-between text-xs text-indigo-500">
                    <span className="flex items-center gap-1">{t("tfpc.offset")}</span>
                    <span className="tabular-nums">
                      − {formatCurrency(result.apprenticeshipOffsetApplied, locale)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between border-t border-border/50 pt-2">
                  <span className="text-ink-muted">
                    {locale === "ar"
                      ? "نسبة الجهد"
                      : locale === "en"
                        ? "Effort Ratio"
                        : "Ratio d'effort"}
                  </span>
                  <span className="tabular-nums font-medium">
                    {formatPercent(result.apprenticeshipRatio, locale, 2)} / 1.00%
                  </span>
                </div>
                <div className="flex justify-between border-t border-border/50 pt-2 font-semibold text-ink">
                  <span>{t("tfpc.taDue")}</span>
                  <span className="tabular-nums text-primary">
                    {formatCurrency(result.taDue, locale)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Due Card */}
          <div className="surface-card bg-primary/[0.03] border-primary/20 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="label-text text-sm uppercase tracking-wider">
                  {locale === "ar"
                    ? "إجمالي الرسوم المستحقة"
                    : locale === "en"
                      ? "Total taxes due"
                      : "Total des taxes dues"}
                </span>
                <div className="mt-2 text-4xl font-bold tabular-nums text-primary">
                  {formatCurrency(result.totalDue, locale)}
                </div>
              </div>
              <div className="text-right hidden sm:block">
                <span className="text-xs text-ink-muted block">
                  {locale === "ar" ? "تاريخ الاستحقاق" : locale === "en" ? "Due Date" : "Échéance"}
                </span>
                <span className="text-sm font-semibold tabular-nums text-ink">{deadlineDate}</span>
              </div>
            </div>

            <div className="border-t border-border/50 pt-4 flex flex-col gap-2 text-xs text-ink-muted">
              <div className="flex items-center gap-2">
                <Info size={14} className="text-primary shrink-0" />
                <span>
                  {locale === "ar"
                    ? `يتعين إيداع هذا التصريح الخاص وسداده في موعد أقصاه ${deadlineDate} (المادة 196 سادسا).`
                    : locale === "en"
                      ? `This special return must be filed and paid by ${deadlineDate} at the latest (Article 196 sexies).`
                      : `Cette déclaration spéciale doit être souscrite et acquittée au plus tard le ${deadlineDate} (Article 196 sexies).`}
                </span>
              </div>
              {result.trainingSurplus > 0 && (
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 shrink-0" />
                  <span>
                    {locale === "ar"
                      ? `فائض نفقات التكوين المتوفر: ${formatCurrency(result.trainingSurplus, locale)}`
                      : locale === "en"
                        ? `Available excess training expenses: ${formatCurrency(result.trainingSurplus, locale)}`
                        : `Excédent disponible des dépenses de formation: ${formatCurrency(result.trainingSurplus, locale)}`}
                  </span>
                </div>
              )}
            </div>
          </div>
          </div>

          <button
            onClick={() => downloadTfpcPdf({ grossPayroll, trainingExpenses, apprenticeshipExpenses, employeeCount, year, semester, isApprenticeshipGapJustified }, result)}
            className="w-full rounded-lg border border-border px-4 py-2.5 text-sm font-medium hover:border-primary"
          >
            Télécharger PDF
          </button>

          {!hasAccess && (
            <div className="absolute inset-0 bg-background/70 backdrop-blur-[2px] flex flex-col items-center justify-center p-6 text-center z-10" dir={locale === "ar" ? "rtl" : "ltr"}>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10 text-amber-500 mb-4 animate-bounce">
                <Lock className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">
                {locale === "ar" ? "حسابات TFPC كاملة مقفلة" : "Calculs TFPC complets verrouillés"}
              </h3>
              <p className="text-xs text-ink-muted mb-5 max-w-[280px]">
                {locale === "ar"
                  ? "الوصول إلى تفاصيل احتساب رسم التكوين والتمهين يتطلب اشتراك Business أو Enterprise."
                  : "L'accès aux détails de calcul de la taxe formation et apprentissage requiert un abonnement Business ou Enterprise."}
              </p>
              <Link
                to="/settings"
                className="inline-flex h-9 items-center justify-center rounded-md bg-gradient-to-r from-amber-500 to-yellow-600 text-white px-4 text-xs font-semibold shadow hover:from-amber-600 hover:to-yellow-700 transition-all cursor-pointer"
              >
                <Sparkles className="mr-1 h-3.5 w-3.5" />
                {locale === "ar" ? "ترقية الحساب الآن" : "Mettre à niveau maintenant"}
              </Link>
            </div>
          )}
        </section>
      </div>

      {/* Compliance / Info footer section */}
      <section className="surface-card bg-muted/40 border border-border">
        <h2 className="title-text text-sm mb-3 uppercase tracking-wider">
          {locale === "ar"
            ? "مراجع قانونية - قانون المالية 2026"
            : locale === "en"
              ? "Legal references - Finance Act 2026"
              : "Références légales - Loi de Finances 2026"}
        </h2>
        <div className="grid gap-4 md:grid-cols-2 text-xs text-ink-muted">
          <div className="space-y-2">
            <p className="font-semibold text-ink">
              Art. 196 bis & quater CIDTA (Art. 18-19 LF 2026)
            </p>
            <p>
              {locale === "ar"
                ? "يخضع الأرباب الموظفون لرسمي التكوين والتمهين بمعدل 1% من الكتلة الأجرية الإجمالية السداسية لكل منهما. وتعرف الكتلة الأجرية بالمبالغ المدفوعة قبل أي خصم للضمان الاجتماعي أو للضريبة."
                : locale === "en"
                  ? "Employers are liable to training and apprenticeship taxes of 1% of the semestrial gross payroll each. Gross payroll means remunerations before any deductions for social security or IRG."
                  : "Les employeurs sont assujettis aux taxes de formation et d'apprentissage à hauteur de 1% de la masse salariale brute semestrielle chacune. La masse salariale brute s'entend avant cotisations et IRG."}
            </p>
          </div>
          <div className="space-y-2">
            <p className="font-semibold text-ink">
              Art. 196 quinquies & sexies CIDTA (Art. 20-21 LF 2026)
            </p>
            <p>
              {locale === "ar"
                ? "تُخصم نفقات التكوين والتمهين الفعلية المؤهلة من الضريبة المستحقة. ويسمح صراحةً بتحويل فائض نفقات التكوين المهني المتواصل لتغطية العجز في التمهين إذا تعذر بلوغ النسبة المطلوبة لأسباب مبررة."
                : locale === "en"
                  ? "Eligible training and apprenticeship expenditures reduce the tax liability. Training surplus can offset the apprenticeship deficit if the 1% threshold is not reached due to justified reasons."
                  : "Les dépenses éligibles réduisent le montant dû. L'excédent de dépenses de formation professionnelle continue est imputable sur le déficit de la taxe d'apprentissage si le taux de 1% n'est pas atteint pour motif justifié."}
            </p>
          </div>
        </div>
      </section>

      <button
        onClick={() =>
          save({
            type: "tfpc",
            fiscalYear: year,
            periodLabel: `S${semester} ${year}`,
            input: { grossPayroll, trainingExpenses, apprenticeshipExpenses, employeeCount, year, semester, isApprenticeshipGapJustified },
            result,
            totalDue: result.totalDue,
          })
        }
        className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
      >
        Enregistrer la déclaration
      </button>
    </div>
  );
}
