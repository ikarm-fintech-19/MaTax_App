import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { calculateIbs, IBS_RATES, IBS_ACTIVITY_LABELS, type IbsActivity } from "@/lib/engines/ibs";
import { formatCurrency, formatPercent } from "@/lib/format";

export const Route = createFileRoute("/_app/ibs")({ component: IbsPage });

function IbsPage() {
  const { t, locale } = useI18n();
  const [profit, setProfit] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = window.localStorage.getItem("matax_ibs_draft");
      if (stored) {
        try {
          return JSON.parse(stored).profit ?? 1_000_000;
        } catch (e) {}
      }
    }
    return 1_000_000;
  });
  const [activity, setActivity] = useState<IbsActivity>(() => {
    if (typeof window !== "undefined") {
      const stored = window.localStorage.getItem("matax_ibs_draft");
      if (stored) {
        try {
          return JSON.parse(stored).activity ?? "services_trade";
        } catch (e) {}
      }
    }
    return "services_trade";
  });
  const [credits, setCredits] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = window.localStorage.getItem("matax_ibs_draft");
      if (stored) {
        try {
          return JSON.parse(stored).credits ?? 0;
        } catch (e) {}
      }
    }
    return 0;
  });

  useMemo(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("matax_ibs_draft", JSON.stringify({
        profit,
        activity,
        credits
      }));
    }
  }, [profit, activity, credits]);

  const result = useMemo(() => calculateIbs({ activity, taxableProfit: profit, creditsAlreadyPaid: credits }), [profit, activity, credits]);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="headline-text">{t("ibs.title")}</h1>
        <p className="text-ink-muted">{t("ibs.subtitle")}</p>
      </header>
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="surface-card space-y-4">
          <div>
            <label className="label-text mb-1 block">{t("ibs.activity")}</label>
            <select value={activity} onChange={(e) => setActivity(e.target.value as IbsActivity)}
              className="w-full rounded-lg border border-input bg-surface px-3 py-2 focus:border-primary focus:outline-none">
              {(Object.keys(IBS_RATES) as IbsActivity[]).map((a) => (
                <option key={a} value={a}>{IBS_ACTIVITY_LABELS[a][locale]} — {formatPercent(IBS_RATES[a], locale, 0)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label-text mb-1 block">{t("ibs.profit")}</label>
            <input type="number" min={0} value={profit} onChange={(e) => setProfit(Number(e.target.value))}
              className="w-full rounded-lg border border-input bg-surface px-3 py-2 tabular-nums focus:border-primary focus:outline-none" />
          </div>
          <div>
            <label className="label-text mb-1 block">{t("ibs.credits")}</label>
            <input type="number" min={0} value={credits} onChange={(e) => setCredits(Number(e.target.value))}
              className="w-full rounded-lg border border-input bg-surface px-3 py-2 tabular-nums focus:border-primary focus:outline-none" />
          </div>
        </section>
        <section className="surface-card space-y-3">
          <h2 className="title-text">{t("common.summary")}</h2>
          <Row label={t("common.rate")} value={formatPercent(result.rate, locale, 0)} />
          <Row label={t("ibs.minimum")} value={formatCurrency(result.minimumDue, locale)} />
          <Row label={t("ibs.due")} value={formatCurrency(result.netDue, locale)} emphasis />
          <div className="my-3 h-px bg-border" />
          <p className="label-text">{t("ibs.installments")}</p>
          <div className="grid grid-cols-3 gap-2 text-sm tabular-nums">
            <div className="rounded-lg bg-muted p-3"><div className="caption-text">1</div>{formatCurrency(result.installments.first, locale)}</div>
            <div className="rounded-lg bg-muted p-3"><div className="caption-text">2</div>{formatCurrency(result.installments.second, locale)}</div>
            <div className="rounded-lg bg-muted p-3"><div className="caption-text">3</div>{formatCurrency(result.installments.third, locale)}</div>
          </div>
        </section>
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
