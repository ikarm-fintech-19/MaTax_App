import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";
import { formatCurrency } from "@/lib/format";
import { Calculator, Receipt, Building2, Fuel, Coins, ShieldCheck, AlertTriangle, Phone, X, Mail, RefreshCw, Lock, Download } from "lucide-react";
import { downloadG50Pdf } from "@/lib/pdf/g50-pdf";
import { calculateG50 } from "@/lib/engines/tva";
import { Skeleton } from "@/components/ui/skeleton";
import { ObligationCalendar, getUpcomingAlertsCount } from "@/components/dashboard/obligation-calendar";
import { RegimeSelector } from "@/components/onboarding/regime-selector";
import { getUserRegime, isRegimeSet, type FiscalRegime } from "@/lib/regime-config";

export const Route = createFileRoute("/_app/dashboard")({
  component: Dashboard,
});

function handleDownloadExample() {
  const company = {
    raisonSociale: "SARL BatiPlus",
    nif: "0002167890345678",
    activite: "BTP / Construction",
    adresse: "12 Rue Didouche Mourad, Alger Centre",
    codeActivite: "4110",
  };
  const input = {
    period: { kind: "monthly" as const, year: 2026, month: 5 },
    operations: [
      { code: "E3B8", caHT: 1_500_000 },
      { code: "E3B10", caHT: 800_000 },
      { code: "E3B1", caHT: 200_000 },
      { code: "E3B30", caHT: 300_000 },
    ],
    deductions: {
      precompteAnterieur: 25_000,
      tvaAchatsBiensServices: 120_000,
      tvaAchatsBiens: 80_000,
      proRataDeductionComplementaire: 0,
      tvaFacturesAnnulees: 0,
      autresDeductions: 5_000,
    },
  };
  const result = calculateG50(input);
  downloadG50Pdf(company, input, result);
}

function Dashboard() {
  const { t, locale } = useI18n();
  const { user } = useAuth();
  const [consultOpen, setConsultOpen] = useState(false);
  const alertCount = getUpcomingAlertsCount();

  // Fiscal regime (client-side, localStorage). Committee demo: regime selector
  // skipped for stability — ?demo=true always lands on Régime Réel instantly.
  const isDemo = typeof window !== "undefined" &&
    (new URLSearchParams(window.location.search).get("demo") === "true" ||
      sessionStorage.getItem("matax_demo") === "1");
  const [regime, setRegime] = useState<FiscalRegime>("reel");
  const [regimeOpen, setRegimeOpen] = useState(false);
  const [v2Open, setV2Open] = useState(false);
  const [changeMode, setChangeMode] = useState(false);

  useEffect(() => {
    setRegime(getUserRegime());
    if (!isDemo && !isRegimeSet()) setRegimeOpen(true);
  }, [isDemo]);


  const { data: recent = [], isLoading } = useQuery({
    queryKey: ["declarations", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("declarations").select("*")
        .order("created_at", { ascending: false }).limit(8);
      if (error) throw error;
      return data;
    },
  });

  const actions = [
    { to: "/irg", icon: Calculator, label: t("nav.irg"), desc: "Impôt sur le Revenu Global (Salaires)", isComingSoon: false },
    { to: "/ibs", icon: Building2, label: t("nav.ibs"), desc: "Impôt sur les Bénéfices des Sociétés", isComingSoon: true },
    { to: "/tfpc", icon: Fuel, label: t("nav.tfpc"), desc: "Taxe de formation professionnelle", isComingSoon: true },
    { to: "/withholding", icon: Coins, label: t("nav.withholding"), desc: "Gestion des retenues à la source", isComingSoon: true },
  ];

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs text-primary">
            <ShieldCheck size={14} /> {t("dashboard.lf2026Badge")}
          </div>
          {alertCount > 0 && (
            <div className="inline-flex items-center gap-2 rounded-full border border-warning/30 bg-warning/10 px-3 py-1 text-xs font-medium text-warning">
              <AlertTriangle size={14} /> {alertCount} {t("alerts.this_week")}
            </div>
          )}
          <button
            onClick={() => { setChangeMode(true); setRegimeOpen(true); }}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs text-ink-muted hover:border-primary"
          >
            <RefreshCw size={13} /> {regime === "reel" ? t("regime.badge.reel") : t("regime.badge.forfaitaire")}
          </button>
        </div>

        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="headline-text mt-1">{t("dashboard.welcome")}, {user?.email?.split("@")[0]}</h1>
            <p className="text-ink-muted">{t("dashboard.subtitle")}</p>
          </div>
          <button
            onClick={() => setConsultOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium hover:border-primary"
          >
            <Phone size={14} /> {t("consultation.button")}
          </button>
        </div>
      </header>

      {regime === "forfaitaire" && (
        <div className="flex items-center gap-2 rounded-lg border border-warning/30 bg-warning/10 px-4 py-3 text-sm font-medium text-warning">
          <Lock size={16} /> {t("regime.forfaitaire_banner")}
        </div>
      )}

      <section>
        <h2 className="title-text mb-3">{t("dashboard.quickActions")}</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {regime === "reel" ? (
            <>
              {/* Primary Action */}
              <Link to="/g50" className="surface-card-interactive sm:col-span-2 lg:col-span-2 flex flex-col justify-between bg-primary text-primary-foreground hover:bg-primary-hover border-none">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-sm font-semibold uppercase tracking-wider text-primary-foreground/80">Déclaration Principale</div>
                    <h3 className="mt-1 text-2xl font-bold">{t("nav.g50")}</h3>
                    <p className="mt-2 max-w-sm text-sm text-primary-foreground/90">
                      Déclarez votre TVA mensuelle et calculez votre impôt net à payer en toute simplicité.
                    </p>
                  </div>
                  <div className="rounded-full bg-primary-foreground/20 p-3">
                    <Receipt size={24} />
                  </div>
                </div>
                <div className="mt-6 flex items-center text-sm font-medium">
                  Commencer la déclaration →
                </div>
              </Link>
              {actions.map(({ to, icon: Icon, label, desc, isComingSoon }) => (
                isComingSoon ? (
                  <div key={to} className="surface-card flex flex-col gap-3 opacity-60 cursor-not-allowed relative">
                    <div className="absolute top-3 right-3 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary uppercase">Bientôt</div>
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-muted p-2 text-ink-muted"><Icon size={20} /></div>
                      <div className="label-text">{label}</div>
                    </div>
                    <div className="text-sm text-ink-muted">{desc}</div>
                  </div>
                ) : (
                  <Link key={to} to={to} className="surface-card-interactive flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-primary/10 p-2 text-primary"><Icon size={20} /></div>
                      <div className="label-text">{label}</div>
                    </div>
                    <div className="text-sm text-ink-muted">{desc}</div>
                  </Link>
                )
              ))}
            </>
          ) : (
            <>
              {actions.map(({ to, icon: Icon, label }) => (
                <div
                  key={to}
                  title={t("regime.unavailable")}
                  className="surface-card flex cursor-not-allowed items-start gap-3 opacity-50"
                >
                  <div className="rounded-lg bg-muted p-2 text-ink-muted"><Icon size={20} /></div>
                  <div>
                    <div className="label-text">{label}</div>
                    <div className="text-[10px] uppercase text-ink-muted">{t("regime.unavailable")}</div>
                  </div>
                </div>
              ))}
              <button
                onClick={() => setV2Open(true)}
                className="surface-card-interactive flex items-start gap-3 text-start"
              >
                <div className="rounded-lg bg-muted p-2 text-primary"><Calculator size={20} /></div>
                <div><div className="label-text">{t("regime.irg_forfaitaire")}</div></div>
              </button>
            </>
          )}
        </div>
      </section>

      <section>
        <div className="rounded-lg border border-primary/20 bg-primary/10 p-4">
          <h4 className="label-text mb-1 flex items-center gap-2 text-primary">
            <Download size={16} /> {t("dashboard.exampleTitle")}
          </h4>
          <p className="mb-3 text-sm text-ink-muted">{t("dashboard.exampleDesc")}</p>
          <button
            onClick={handleDownloadExample}
            className="inline-flex items-center gap-2 rounded-lg border border-primary bg-surface px-4 py-2 text-sm font-medium text-primary transition hover:bg-primary hover:text-primary-foreground"
          >
            <Download size={16} /> {t("dashboard.exampleButton")}
          </button>
          <p className="mt-2 text-xs text-ink-muted">{t("dashboard.exampleFooter")}</p>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <ObligationCalendar />

        <div className="space-y-3">
          <h2 className="title-text">{t("dashboard.recent")}</h2>
          {isLoading ? (
            <div className="surface-card space-y-3">
              <Skeleton className="h-5 w-1/3" />
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-5 w-1/2" />
            </div>
          ) : recent.length === 0 ? (
            <div className="surface-card flex flex-col items-center justify-center p-12 text-center">
              <div className="mb-4 rounded-full bg-muted p-4 text-ink-muted">
                <Receipt size={32} />
              </div>
              <h3 className="title-text">{t("dashboard.empty")}</h3>
              <p className="mt-2 max-w-sm text-sm text-ink-muted">
                Toutes vos déclarations apparaîtront ici. Lancez votre premier calcul depuis le menu.
              </p>
            </div>
          ) : (
            <div className="surface-card overflow-hidden p-0">
              <table className="w-full text-sm">
                <thead className="bg-muted/60 text-start">
                  <tr className="text-start">
                    <th className="px-4 py-3 text-start label-text">Type</th>
                    <th className="px-4 py-3 text-start label-text">{t("common.period")}</th>
                    <th className="px-4 py-3 text-end label-text">{t("common.total")}</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((d) => (
                    <tr key={d.id} className="border-t border-border">
                      <td className="px-4 py-3 uppercase">{d.type}</td>
                      <td className="px-4 py-3 text-ink-muted">{d.period_label ?? "—"}</td>
                      <td className="px-4 py-3 text-end tabular-nums">
                        {d.total_due != null ? formatCurrency(Number(d.total_due), locale) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* Consultation modal */}
      {consultOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setConsultOpen(false)}>
          <div className="w-full max-w-md rounded-2xl border border-border bg-background p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="inline-block rounded-full bg-muted px-2 py-0.5 text-[10px] uppercase text-ink-muted">
                  {t("consultation.optional")}
                </span>
                <h3 className="title-text mt-2">{t("consultation.title")}</h3>
              </div>
              <button onClick={() => setConsultOpen(false)} className="rounded-md p-1 text-ink-muted hover:bg-muted">
                <X size={18} />
              </button>
            </div>
            <p className="mt-3 text-sm text-ink-muted">{t("consultation.desc")}</p>
            <div className="mt-4 rounded-lg border border-border bg-surface p-3">
              <div className="text-[10px] uppercase text-ink-muted">{t("consultation.email_label")}</div>
              <a href="mailto:experts@matax.dz" className="mt-1 inline-flex items-center gap-2 text-sm font-medium text-primary">
                <Mail size={14} /> experts@matax.dz
              </a>
            </div>
            <button
              onClick={() => setConsultOpen(false)}
              className="mt-4 w-full rounded-lg border border-border px-4 py-2 text-sm hover:border-primary"
            >
              {t("consultation.close")}
            </button>
          </div>
        </div>
      )}

      {/* Regime selector (onboarding + change) */}
      {regimeOpen && (
        <RegimeSelector
          initial={regime}
          showWarning={changeMode}
          onConfirm={(r) => { setRegime(r); setRegimeOpen(false); setChangeMode(false); }}
          onClose={changeMode ? () => { setRegimeOpen(false); setChangeMode(false); } : undefined}
        />
      )}

      {/* V2 placeholder modal */}
      {v2Open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setV2Open(false)}>
          <div className="w-full max-w-md rounded-2xl border border-border bg-background p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3">
              <h3 className="title-text">{t("regime.irg_forfaitaire")}</h3>
              <button onClick={() => setV2Open(false)} className="rounded-md p-1 text-ink-muted hover:bg-muted">
                <X size={18} />
              </button>
            </div>
            <p className="mt-3 text-sm text-ink-muted">{t("regime.v2note")}</p>
            <button onClick={() => setV2Open(false)} className="mt-4 w-full rounded-lg border border-border px-4 py-2 text-sm hover:border-primary">
              {t("consultation.close")}
            </button>
          </div>
        </div>
      )}
    </div>

  );
}
