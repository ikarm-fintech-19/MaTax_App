import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState, useId } from "react";
import { toast } from "sonner";
import { Download, Plus, Trash2, ShieldCheck, Sparkles, Lock } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/hooks/use-auth";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  G50_OPERATION_LINES,
  calculateG50,
  emptyDeductions,
  type DeductionsInput,
  type G50Input,
  type OperationLineInput,
} from "@/lib/engines/tva";
import { formatCurrency } from "@/lib/format";
import { generateId } from "@/lib/utils";
import { downloadG50Pdf, type G50CompanyInfo } from "@/lib/pdf/g50-pdf";
import { useSaveDeclaration } from "@/hooks/use-save-declaration";

export const Route = createFileRoute("/_app/g50")({ component: G50Page });

const COMPANY_KEY = "matax.company";
const DRAFT_KEY = "matax.g50.draft";

const DEFAULT_COMPANY: G50CompanyInfo = {
  raisonSociale: "",
  nif: "",
  activite: "",
  adresse: "",
  articleImposition: "",
  codeActivite: "",
};

function loadCompany(): G50CompanyInfo {
  if (typeof window === "undefined") return DEFAULT_COMPANY;
  try {
    const raw = window.localStorage.getItem(COMPANY_KEY);
    return raw ? { ...DEFAULT_COMPANY, ...JSON.parse(raw) } : DEFAULT_COMPANY;
  } catch {
    return DEFAULT_COMPANY;
  }
}

interface DraftLine extends OperationLineInput {
  id: string;
}

function loadDraft(): {
  lines: DraftLine[];
  deductions: DeductionsInput;
  period: G50Input["period"];
} | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function G50Page() {
  const { t, locale } = useI18n();
  const { subscriptionTier } = useAuth();
  const { save } = useSaveDeclaration();
  const [isLockOpen, setIsLockOpen] = useState(false);
  const now = new Date();

  const [company, setCompany] = useState<G50CompanyInfo>(DEFAULT_COMPANY);
  const [period, setPeriod] = useState<G50Input["period"]>({
    kind: "monthly",
    year: now.getFullYear(),
    month: now.getMonth() + 1,
  });
  const [lines, setLines] = useState<DraftLine[]>([{ id: generateId(), code: "E3B8", caHT: 0 }]);
  const [deductions, setDeductions] = useState<DeductionsInput>(emptyDeductions());

  const hasAccessToPdf =
    subscriptionTier === "pro" ||
    subscriptionTier === "business" ||
    subscriptionTier === "enterprise";

  // Hydrate from localStorage on mount + handle ?demo=true seed.
  // In demo mode (?demo=true or sessionStorage.matax_demo) the tab is
  // pre-populated with example data so the tester does not have to click
  // "Charger un exemple PME" manually before each demo run.
  useEffect(() => {
    const storedCompany = loadCompany();
    setCompany(storedCompany);

    if (typeof window === "undefined") return;
    const isDemoSession =
      new URLSearchParams(window.location.search).get("demo") === "true" ||
      sessionStorage.getItem("matax_demo") === "1";

    if (isDemoSession) {
      seedDemo({ forceCompany: !storedCompany.raisonSociale });
      return;
    }
    const draft = loadDraft();
    if (draft) {
      setLines(draft.lines.length ? draft.lines : [{ id: generateId(), code: "E3B8", caHT: 0 }]);
      setDeductions({ ...emptyDeductions(), ...draft.deductions });
      setPeriod(draft.period);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function seedDemo(opts: { forceCompany?: boolean } = {}) {
    // Période Mai 2026 — mois en cours pour la démo.
    const now = new Date();
    setPeriod({ kind: "monthly", year: now.getFullYear(), month: now.getMonth() + 1 });

    setLines([
      { id: generateId(), code: "E3B8", caHT: 2_500_000 }, // Production 19%
      { id: generateId(), code: "E3B9", caHT: 1_200_000 }, // Revente 19%
      { id: generateId(), code: "E3B1", caHT: 800_000 }, // Taux réduit 9%
      { id: generateId(), code: "E3B30", caHT: 450_000 }, // Export (exonéré)
      { id: generateId(), code: "E3B25", caHT: 220_000 }, // 1ère nécessité (exonéré)
    ]);
    setDeductions({
      precompteAnterieur: 32_500,
      tvaAchatsBiensServices: 285_000,
      tvaAchatsBiens: 95_000,
      proRataDeductionComplementaire: 0,
      tvaFacturesAnnulees: 18_500,
      autresDeductions: 4_200,
    });
    setCompany((prev) => {
      if (prev.raisonSociale && !opts.forceCompany) return prev;
      return {
        raisonSociale: "SARL Démo Atlas",
        nif: "099916001234567",
        activite: "Commerce et services",
        adresse: "12 rue Didouche Mourad, Alger",
        articleImposition: "16-001-1234",
        codeActivite: "604101",
      };
    });
    toast.success(t("g50.demo_loaded"));
  }

  // Persist draft on change
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify({ lines, deductions, period }));
  }, [lines, deductions, period]);

  const input: G50Input = useMemo(
    () => ({
      period,
      operations: lines.map((l) => ({ code: l.code, caHT: l.caHT })),
      deductions,
    }),
    [period, lines, deductions],
  );

  const result = useMemo(() => calculateG50(input), [input]);

  const updateLine = (id: string, patch: Partial<DraftLine>) =>
    setLines((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  const addLine = () => setLines((prev) => [...prev, { id: generateId(), code: "E3B8", caHT: 0 }]);
  const removeLine = (id: string) => setLines((prev) => prev.filter((l) => l.id !== id));

  const saveCompany = (next: G50CompanyInfo) => {
    setCompany(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(COMPANY_KEY, JSON.stringify(next));
    }
  };

  const months = [
    "Janvier",
    "Février",
    "Mars",
    "Avril",
    "Mai",
    "Juin",
    "Juillet",
    "Août",
    "Septembre",
    "Octobre",
    "Novembre",
    "Décembre",
  ];

  const handleExport = () => {
    if (!hasAccessToPdf) {
      setIsLockOpen(true);
      return;
    }
    if (!company.raisonSociale.trim() || !company.nif.trim()) {
      toast.error("Renseignez au moins la raison sociale et le NIF avant l'export.");
      return;
    }
    const periodName =
      input.period.kind === "monthly" && input.period.month
        ? `${months[input.period.month - 1]} ${input.period.year}`
        : `T${input.period.quarter} ${input.period.year}`;

    downloadG50Pdf(company, input, result);
    toast.success(`Déclaration G50 exportée avec succès pour ${periodName}.`);
  };

  const handleDemoExport = () => {
    if (!hasAccessToPdf) {
      setIsLockOpen(true);
      return;
    }
    const now = new Date();
    const demoInput: G50Input = {
      period: { kind: "monthly", year: now.getFullYear(), month: now.getMonth() + 1 },
      operations: [
        { code: "E3B8", caHT: 2_500_000 },
        { code: "E3B9", caHT: 1_200_000 },
        { code: "E3B1", caHT: 800_000 },
        { code: "E3B30", caHT: 450_000 },
        { code: "E3B25", caHT: 220_000 },
      ],
      deductions: {
        precompteAnterieur: 32_500,
        tvaAchatsBiensServices: 285_000,
        tvaAchatsBiens: 95_000,
        proRataDeductionComplementaire: 0,
        tvaFacturesAnnulees: 18_500,
        autresDeductions: 4_200,
      },
    };
    const demoCompany: G50CompanyInfo = {
      raisonSociale: "SARL Démo Atlas",
      nif: "099916001234567",
      activite: "Commerce et services",
      adresse: "12 rue Didouche Mourad, Alger",
      articleImposition: "16-001-1234",
      codeActivite: "604101",
    };
    const demoResult = calculateG50(demoInput);
    seedDemo();
    downloadG50Pdf(demoCompany, demoInput, demoResult);
    toast.success(`Déclaration G50 exportée avec succès pour ${now.getMonth() + 1} ${now.getFullYear()}.`);
  };

  return (
    <div className="space-y-6">
      <div className="text-sm font-medium text-ink-muted flex items-center gap-2 mb-2">
        <Link to="/dashboard" className="hover:text-primary transition-colors">
          Tableau de bord
        </Link>
        <span>/</span>
        <span className="text-ink">G50</span>
      </div>
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="headline-text">{t("g50.title")}</h1>
          <p className="text-ink-muted">{t("g50.subtitle")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => seedDemo()}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium hover:border-primary"
          >
            <Sparkles size={14} /> {t("g50.load_demo")}
          </button>
          <button
            onClick={handleDemoExport}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-all hover:opacity-90"
          >
            <Download size={16} /> {t("g50.load_and_export")}
          </button>
          <button
            onClick={handleExport}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              hasAccessToPdf
                ? "bg-primary text-primary-foreground hover:opacity-90 cursor-pointer"
                : "bg-gradient-to-r from-amber-500 to-yellow-600 text-white shadow-lg hover:from-amber-600 hover:to-yellow-700 hover:scale-[1.02] cursor-pointer"
            }`}
          >
            {hasAccessToPdf ? <Download size={16} /> : <Lock size={16} className="text-yellow-100" />}
            {t("common.export_pdf")}
          </button>
        </div>
      </header>

      {/* Identification */}
      <section className="space-y-3">
        <SectionHeader title="Identification du contribuable" />
        <div className="surface-card grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field
            label="Raison sociale"
            value={company.raisonSociale}
            onChange={(v) => saveCompany({ ...company, raisonSociale: v })}
          />
          <Field
            label="NIF"
            value={company.nif}
            onChange={(v) => saveCompany({ ...company, nif: v.replace(/\D/g, "").slice(0, 20) })}
          />
          <Field
            label="Activité / Profession"
            value={company.activite}
            onChange={(v) => saveCompany({ ...company, activite: v })}
          />
          <Field
            label="Code activité"
            value={company.codeActivite ?? ""}
            onChange={(v) => saveCompany({ ...company, codeActivite: v })}
          />
          <Field
            label="Article d'imposition"
            value={company.articleImposition ?? ""}
            onChange={(v) => saveCompany({ ...company, articleImposition: v })}
          />
          <Field
            label="Adresse"
            value={company.adresse}
            onChange={(v) => saveCompany({ ...company, adresse: v })}
          />
        </div>
      </section>

      {/* Période */}
      <section className="space-y-3">
        <SectionHeader title={t("common.period")} />
        <div className="surface-card flex flex-wrap items-end gap-3">
          <div className="inline-flex rounded-lg border border-border p-1">
            {(["monthly", "quarterly"] as const).map((k) => (
              <button
                key={k}
                onClick={() =>
                  setPeriod({
                    ...period,
                    kind: k,
                    month: k === "monthly" ? (period.month ?? 1) : undefined,
                    quarter: k === "quarterly" ? (period.quarter ?? 1) : undefined,
                  })
                }
                className={`rounded-md px-4 py-1.5 text-sm ${period.kind === k ? "bg-primary text-primary-foreground" : "text-ink-muted"}`}
              >
                {k === "monthly" ? t("common.month") : t("common.quarter")}
              </button>
            ))}
          </div>
          {period.kind === "monthly" ? (
            <select
              value={period.month ?? 1}
              onChange={(e) => setPeriod({ ...period, month: Number(e.target.value) })}
              className="rounded-lg border border-input bg-surface px-3 py-2 text-sm"
            >
              {months.map((m, i) => (
                <option key={i} value={i + 1}>
                  {m}
                </option>
              ))}
            </select>
          ) : (
            <select
              value={period.quarter ?? 1}
              onChange={(e) => setPeriod({ ...period, quarter: Number(e.target.value) })}
              className="rounded-lg border border-input bg-surface px-3 py-2 text-sm"
            >
              {[1, 2, 3, 4].map((q) => (
                <option key={q} value={q}>
                  T{q}
                </option>
              ))}
            </select>
          )}
          <input
            type="number"
            value={period.year}
            onChange={(e) => setPeriod({ ...period, year: Number(e.target.value) })}
            className="w-28 rounded-lg border border-input bg-surface px-3 py-2 text-sm tabular-nums"
          />
        </div>
      </section>

      {/* A — Opérations */}
      <section className="space-y-4">
        <SectionHeader
          letter="A"
          title="Chiffres d'affaires imposables"
          subtitle="Sélectionnez le code officiel (E3B…) puis saisissez le CA HT."
        />
        <div className="surface-card">
          <div className="mb-4 flex items-center justify-end">
            <button
              onClick={addLine}
              className="inline-flex min-h-[44px] items-center gap-1 rounded-lg border border-border px-4 py-2 text-sm hover:border-primary hover:bg-surface-elevated"
            >
              <Plus size={14} /> {t("common.add")}
            </button>
          </div>
          <div className="space-y-3">
            {lines.map((l) => {
              const def = G50_OPERATION_LINES.find((d) => d.code === l.code);
              const tva = def && def.kind === "imposable" ? l.caHT * def.rate : 0;
              return (
                <div
                  key={l.id}
                  className="rounded-lg border border-border p-3 sm:border-0 sm:p-0 sm:grid sm:grid-cols-12 sm:items-center sm:gap-2"
                >
                  <select
                    value={l.code}
                    onChange={(e) => updateLine(l.id, { code: e.target.value })}
                    className="w-full rounded-lg border border-input bg-surface px-3 py-2 text-sm sm:col-span-7"
                  >
                    {G50_OPERATION_LINES.map((d) => (
                      <option key={d.code} value={d.code}>
                        {d.code} — {d.label}{" "}
                        {d.kind === "exonere" ? "(exonéré)" : `(${(d.rate * 100).toFixed(0)}%)`}
                      </option>
                    ))}
                  </select>
                  <div className="mt-2 flex items-center gap-2 sm:col-span-5 sm:mt-0 sm:contents">
                    <input
                      type="number"
                      min={0}
                      value={l.caHT || ""}
                      onChange={(e) => {
                        const v = Number(e.target.value);
                        if (v < 0) {
                          toast.error(t("g50.error_negative"));
                          return;
                        }
                        updateLine(l.id, { caHT: v });
                      }}
                      placeholder="CA HT"
                      className="flex-1 rounded-lg border border-input bg-surface px-3 py-2 text-sm tabular-nums sm:col-span-3"
                    />
                    <div className="min-w-[5rem] text-right text-xs tabular-nums text-ink-muted sm:col-span-1">
                      {formatCurrency(tva, locale)}
                    </div>
                    <button
                      onClick={() => removeLine(l.id)}
                      aria-label="Remove"
                      className="rounded-lg p-2 text-ink-muted hover:text-destructive sm:col-span-1"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* B — Déductions */}
      <section className="space-y-4">
        <SectionHeader letter="B" title="Déductions à opérer" />
        <div className="surface-card space-y-3">
          <DeductionField
            code="E3B90"
            label="Précompte antérieur"
            value={deductions.precompteAnterieur}
            onChange={(v) => setDeductions({ ...deductions, precompteAnterieur: v })}
          />
          <DeductionField
            code="E3B91"
            label="TVA sur achats biens/services (art. 29)"
            value={deductions.tvaAchatsBiensServices}
            onChange={(v) => setDeductions({ ...deductions, tvaAchatsBiensServices: v })}
          />
          <DeductionField
            code="E3B92"
            label="TVA sur achat de biens (art. 38)"
            value={deductions.tvaAchatsBiens}
            onChange={(v) => setDeductions({ ...deductions, tvaAchatsBiens: v })}
          />
          <DeductionField
            code="E3B93"
            label="Régularisation prorata (déduction complémentaire)"
            value={deductions.proRataDeductionComplementaire}
            onChange={(v) => setDeductions({ ...deductions, proRataDeductionComplementaire: v })}
          />
          <DeductionField
            code="E3B94"
            label="TVA factures annulées/impayées (art. 18)"
            value={deductions.tvaFacturesAnnulees}
            onChange={(v) => setDeductions({ ...deductions, tvaFacturesAnnulees: v })}
          />
          <DeductionField
            code="E3B95"
            label="Autres déductions"
            value={deductions.autresDeductions}
            onChange={(v) => setDeductions({ ...deductions, autresDeductions: v })}
          />
        </div>
      </section>

      {/* Récapitulatif */}
      <section className="space-y-4">
        <SectionHeader title={t("common.summary")} />
        <div className="surface-card space-y-3">
          <Row label="CA imposable HT" value={formatCurrency(result.totalCAImposable, locale)} />
          <Row label="CA exonéré" value={formatCurrency(result.totalCAExonere, locale)} />
          {result.byRate.map((b) => (
            <Row
              key={b.rate}
              label={`TVA collectée @ ${(b.rate * 100).toFixed(0)}%`}
              value={formatCurrency(b.tva, locale)}
            />
          ))}
          <Row
            label="E3B96 — Total des droits dus"
            value={formatCurrency(result.totalDroitsDus, locale)}
          />
          <Row
            label="E3B110 − Total déductions (B)"
            value={`− ${formatCurrency(result.totalDeductions, locale)}`}
          />
          <div className="my-4 h-px bg-border" />

          {/* Result card — payable OR credit */}
          {result.precompteAReporter > 0 ? (
            <div className="rounded-2xl border border-primary/30 bg-primary/5 p-6 shadow-sm">
              <div className="label-text text-sm uppercase tracking-wider text-primary">
                {t("g50.credit_title")}
              </div>
              <div className="mt-2 text-4xl font-bold tabular-nums text-primary">
                {formatCurrency(result.precompteAReporter, locale)}
              </div>
              <p className="mt-3 text-sm leading-relaxed text-ink-muted">{t("g50.credit_desc")}</p>
              <p className="mt-2 font-mono text-[10px] text-primary/70">
                E3B130 — Précompte à reporter
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
              <div className="label-text text-sm uppercase tracking-wider">
                {t("g50.to_pay_title")}
              </div>
              <div className="mt-2 text-4xl font-bold tabular-nums">
                {formatCurrency(result.totalTvaAPayer, locale)}
              </div>
              <p className="mt-1 font-mono text-[10px] text-ink-muted">
                11 — TOTAL TVA à payer (C/500020) · E3B120 ={" "}
                {formatCurrency(result.tvaAPayer, locale)}
                {result.tvaAutoLiquidee > 0
                  ? ` + E3B140 = ${formatCurrency(result.tvaAutoLiquidee, locale)}`
                  : ""}
              </p>
            </div>
          )}

          {/* Compliance badge */}
          <div className="mt-6 flex w-fit items-center gap-2 rounded-full border border-success/30 bg-success/10 px-4 py-2 text-sm font-medium text-success">
            <ShieldCheck size={16} /> {t("g50.compliance_badge")}
          </div>
        </div>
      </section>
      {/* Mobile Sticky Summary Bar */}
      <div className="mobile-sticky-summary">
        <div className="flex items-center justify-between mx-auto max-w-6xl">
          <div className="flex items-center gap-4">
            <div className="text-sm font-medium text-ink-muted uppercase tracking-wider">
              {result.precompteAReporter > 0 ? t("g50.credit_title") : t("g50.to_pay_title")}
            </div>
            <div
              className={`text-xl font-bold tabular-nums ${result.precompteAReporter > 0 ? "text-primary" : ""}`}
            >
              {formatCurrency(
                result.precompteAReporter > 0 ? result.precompteAReporter : result.totalTvaAPayer,
                locale,
              )}
            </div>
          </div>
          <button
            onClick={() =>
              save({
                type: "g50",
                fiscalYear: period.year,
                periodLabel: `${period.month}/${period.year}`,
                input: { period, lines: lines.map(({ id, ...rest }) => rest), deductions, company },
                result,
                totalDue: result.precompteAReporter > 0 ? -result.precompteAReporter : result.totalTvaAPayer,
              })
            }
            className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
          >
            Enregistrer
          </button>
        </div>
      </div>

      <Dialog open={isLockOpen} onOpenChange={setIsLockOpen}>
        <DialogContent className="sm:max-w-[450px] bg-background border border-border p-6 rounded-lg shadow-xl" dir={locale === "ar" ? "rtl" : "ltr"}>
          <DialogHeader className={locale === "ar" ? "text-right" : "text-left"}>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Lock className="h-5 w-5 text-amber-500" />
              {locale === "ar" ? "تصدير PDF مغلق" : "Export PDF Verrouillé"}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground mt-2 text-sm leading-relaxed">
              {locale === "ar"
                ? "تصدير تصريحات G50 الرسمية بصيغة PDF يتطلب اشتراك Pro أو Business أو Enterprise."
                : "L'exportation des déclarations G50 officielles au format PDF est réservée aux abonnés des plans Pro, Business ou Enterprise."}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center p-4 border border-amber-200 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/20 rounded-lg text-center space-y-2 mt-4">
            <Sparkles className="h-6 w-6 text-amber-500 animate-pulse" />
            <p className="text-xs text-amber-800 dark:text-amber-300 font-medium">
              {locale === "ar"
                ? "احصل على المستندات الرسمية المعبأة تلقائياً وفقاً لقانون المالية 2026."
                : "Obtenez des documents officiels préremplis conformes à la Loi de Finances 2026."}
            </p>
          </div>
          <div className={`flex items-center justify-end gap-3 mt-6 ${locale === "ar" ? "flex-row-reverse" : ""}`}>
            <button
              onClick={() => setIsLockOpen(false)}
              className="px-4 py-2 text-sm font-medium rounded-lg border border-border bg-surface hover:bg-surface-elevated text-foreground cursor-pointer"
            >
              {t("common.cancel")}
            </button>
            <Link
              to="/settings"
              onClick={() => setIsLockOpen(false)}
              className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shadow cursor-pointer"
            >
              {locale === "ar" ? "ترقية الاشتراك" : "Mettre à niveau"}
            </Link>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SectionHeader({
  letter,
  title,
  subtitle,
}: {
  letter?: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-2">
      <div className="flex items-center gap-3">
        {letter && (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 font-bold text-primary">
            {letter}
          </div>
        )}
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
        <div className="h-px flex-1 bg-border" />
      </div>
      {subtitle && (
        <p className={`mt-2 text-sm text-ink-muted ${letter ? "ms-11" : ""}`}>{subtitle}</p>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const id = useId();
  return (
    <div className="block">
      <label htmlFor={id} className="label-text mb-1 block text-xs">
        {label}
      </label>
      <input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-input bg-surface px-3 py-2 text-sm"
      />
    </div>
  );
}

function DeductionField({
  code,
  label,
  value,
  onChange,
}: {
  code: string;
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex flex-col gap-1 border-b border-border/60 py-2 last:border-0 sm:grid sm:grid-cols-12 sm:items-center sm:gap-2 sm:border-0 sm:py-0">
      <div className="flex items-center gap-2 sm:contents">
        <span className="font-mono text-xs text-ink-muted sm:col-span-2">{code}</span>
        <span className="text-sm sm:col-span-7">{label}</span>
      </div>
      <input
        type="number"
        min={0}
        value={value || ""}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full rounded-lg border border-input bg-surface px-3 py-2 text-sm tabular-nums sm:col-span-3"
      />
    </div>
  );
}

function Row({ label, value, emphasis }: { label: string; value: string; emphasis?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className={emphasis ? "label-text" : "text-ink-muted text-sm"}>{label}</span>
      <span className={`tabular-nums ${emphasis ? "title-text" : "text-sm"}`}>{value}</span>
    </div>
  );
}
