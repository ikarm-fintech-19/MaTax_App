import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { calculateIrg, IRG_BRACKETS_ANNUAL } from "@/lib/engines/irg";
import { formatCurrency, formatPercent } from "@/lib/format";

export const Route = createFileRoute("/_app/irg")({
  component: IrgPage,
});

function IrgPage() {
  const { t, locale } = useI18n();
  const [gross, setGross] = useState(60000);
  const [otherDeductions, setOther] = useState(0);
  const [marital, setMarital] = useState<"single" | "married">("single");
  const [children, setChildren] = useState(0);
  const [isHandicapped, setIsHandicapped] = useState(false);

  const result = useMemo(() => calculateIrg({
    grossMonthly: gross,
    otherDeductions,
    maritalStatus: marital,
    children,
    isHandicappedOrRetiree: isHandicapped,
  }), [gross, otherDeductions, marital, children, isHandicapped]);

  return (
    <div className="space-y-8">
      <div className="text-sm font-medium text-ink-muted flex items-center gap-2 mb-2">
        <Link to="/dashboard" className="hover:text-primary transition-colors">Tableau de bord</Link>
        <span>/</span>
        <span className="text-ink">IRG Salaire</span>
      </div>
      <header>
        <h1 className="headline-text">{t("irg.title")}</h1>
        <p className="text-ink-muted">{t("irg.subtitle")}</p>
      </header>

      <div className="grid gap-6 lg:grid-cols-12">
        <section className="surface-card space-y-4 lg:col-span-5 h-fit">
          <div>
            <label className="label-text mb-1 block">{t("irg.gross")}</label>
            <input type="number" min={0} value={gross} onChange={(e) => setGross(Number(e.target.value))}
              className="w-full rounded-lg border border-input bg-surface px-3 py-2 tabular-nums focus:border-primary focus:outline-none" />
          </div>
          <div>
            <label className="label-text mb-1 block">{t("irg.otherDeductions")}</label>
            <input type="number" min={0} value={otherDeductions} onChange={(e) => setOther(Number(e.target.value))}
              className="w-full rounded-lg border border-input bg-surface px-3 py-2 tabular-nums focus:border-primary focus:outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-text mb-1 block">{t("irg.marital")}</label>
              <select value={marital} onChange={(e) => setMarital(e.target.value as "single" | "married")}
                className="w-full rounded-lg border border-input bg-surface px-3 py-2 focus:border-primary focus:outline-none">
                <option value="single">{t("irg.single")}</option>
                <option value="married">{t("irg.married")}</option>
              </select>
            </div>
            <div>
              <label className="label-text mb-1 block">{t("irg.children")}</label>
              <input type="number" min={0} value={children} onChange={(e) => setChildren(Number(e.target.value))}
                className="w-full rounded-lg border border-input bg-surface px-3 py-2 tabular-nums focus:border-primary focus:outline-none" />
            </div>
          </div>

          <div className="flex items-start gap-2 pt-3 border-t border-border">
            <input
              id="isHandicapped"
              type="checkbox"
              checked={isHandicapped}
              onChange={(e) => setIsHandicapped(e.target.checked)}
              className="mt-0.5 rounded border-input text-primary focus:ring-primary"
            />
            <label htmlFor="isHandicapped" className="text-xs text-ink-muted cursor-pointer leading-tight">
              {locale === "ar" 
                ? "عامل ذو احتياجات خاصة أو متقاعد (تخفيض إضافي لغاية 42,500 د.ج)" 
                : locale === "en" 
                ? "Disabled worker or retiree (additional lissage up to 42,500 DZD)" 
                : "Travailleur handicapé ou retraité (lissage étendu jusqu'à 42 500 DA)"}
            </label>
          </div>
        </section>

        <section className="surface-card space-y-3 lg:col-span-7 flex flex-col">
          <h2 className="title-text">{t("common.summary")}</h2>
          <div className="flex-1 space-y-3">
            <Row label={t("irg.cnas")} value={formatCurrency(result.cnas, locale)} />
            <Row label={t("irg.taxable")} value={formatCurrency(result.taxableMonthly, locale)} />
            {result.irgBase > 0 && (
              <Row 
                label={locale === "ar" ? "الضريبة الخام" : locale === "en" ? "Raw IRG" : "IRG brut progressif"} 
                value={formatCurrency(result.irgBase, locale)} 
              />
            )}
            {result.abatement > 0 && <Row label={t("irg.abatement")} value={"− " + formatCurrency(result.abatement, locale)} />}
            {result.irgAbated !== result.irgMonthly && result.irgAbated > 0 && (
              <Row 
                label={locale === "ar" ? "الضريبة بعد التخفيض" : locale === "en" ? "IRG after abatement" : "IRG après abattement"} 
                value={formatCurrency(result.irgAbated, locale)} 
              />
            )}
            <Row label={t("irg.irgDue")} value={formatCurrency(result.irgMonthly, locale)} emphasis />
          </div>
          
          <div className="mt-6 rounded-2xl border border-border bg-muted/40 p-6">
            <div className="label-text text-sm uppercase tracking-wider">{t("irg.net")}</div>
            <div className="mt-2 text-4xl font-bold tabular-nums">
              {formatCurrency(result.netMonthly, locale)}
            </div>
            <p className="mt-3 text-sm text-ink-muted">{t("irg.annualProjection")}: <span className="tabular-nums font-medium text-foreground">{formatCurrency(result.irgMonthly * 12, locale)}</span></p>
          </div>
        </section>
      </div>

      <section className="surface-card">
        <h2 className="title-text mb-3">{t("irg.brackets")}</h2>
        <table className="w-full text-sm">
          <thead className="text-start">
            <tr className="border-b border-border">
              <th className="py-2 text-start label-text">Tranche annuelle</th>
              <th className="py-2 text-end label-text">{t("common.rate")}</th>
              <th className="py-2 text-end label-text">{t("common.amount")}</th>
            </tr>
          </thead>
          <tbody className="tabular-nums">
            {IRG_BRACKETS_ANNUAL.map((b, i) => {
              const detail = result.breakdown.find((d) => d.bracket === b);
              const isActive = detail && detail.tax > 0;
              return (
                <tr key={i} className={`border-b border-border last:border-0 ${isActive ? "bg-primary/10 font-medium text-primary" : "text-ink-muted"}`}>
                  <td className="py-2 px-2 rounded-l-md">{formatCurrency(b.from, locale)} → {b.to ? formatCurrency(b.to, locale) : "∞"}</td>
                  <td className="py-2 text-end">{formatPercent(b.rate, locale, 0)}</td>
                  <td className="py-2 text-end px-2 rounded-r-md">{detail ? formatCurrency(detail.tax, locale) : "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      {/* Mobile Sticky Summary Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-surface/95 p-4 backdrop-blur md:hidden shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
        <div className="flex items-center justify-between mx-auto max-w-6xl">
          <div className="text-sm font-medium text-ink-muted uppercase tracking-wider">
            {t("irg.net")}
          </div>
          <div className="text-xl font-bold tabular-nums">
            {formatCurrency(result.netMonthly, locale)}
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, emphasis }: { label: string; value: string; emphasis?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className={emphasis ? "label-text" : "text-ink-muted"}>{label}</span>
      <span className={`tabular-nums ${emphasis ? "title-text" : ""}`}>{value}</span>
    </div>
  );
}
