import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { useSaveDeclaration } from "@/hooks/use-save-declaration";
import { downloadWithholdingPdf } from "@/lib/pdf/withholding-pdf";
import {
  calculateWithholding,
  WITHHOLDING_LABELS,
  WITHHOLDING_RATES,
  type WithholdingKind,
  type WithholdingLine,
} from "@/lib/engines/withholding";
import { formatCurrency, formatPercent } from "@/lib/format";
import { Plus, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_app/withholding")({ component: Page });

function Page() {
  const { t, locale } = useI18n();
  const { save } = useSaveDeclaration();
  const [lines, setLines] = useState<WithholdingLine[]>(() => {
    if (typeof window !== "undefined") {
      const stored = window.localStorage.getItem("matax_withholding_draft");
      if (stored) {
        try {
          return JSON.parse(stored) ?? [{ kind: "dividends_resident_individual", base: 0 }];
        } catch (e) {}
      }
    }
    return [{ kind: "dividends_resident_individual", base: 0 }];
  });

  useMemo(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("matax_withholding_draft", JSON.stringify(lines));
    }
  }, [lines]);

  const result = useMemo(() => calculateWithholding(lines), [lines]);
  const kinds = Object.keys(WITHHOLDING_RATES) as WithholdingKind[];

  return (
    <div className="space-y-8">
      <header>
        <h1 className="headline-text">{t("withholding.title")}</h1>
        <p className="text-ink-muted">{t("withholding.subtitle")}</p>
      </header>

      <section className="surface-card">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="title-text">{t("withholding.category")}</h2>
          <button
            onClick={() => setLines([...lines, { kind: "dividends_resident_individual", base: 0 }])}
            className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-sm hover:border-primary"
          >
            <Plus size={14} /> {t("common.add")}
          </button>
        </div>
        <div className="space-y-2">
          {lines.map((l, i) => (
            <div key={i} className="grid grid-cols-12 gap-2">
              <select
                value={l.kind}
                onChange={(e) =>
                  setLines(
                    lines.map((x, j) =>
                      j === i ? { ...x, kind: e.target.value as WithholdingKind } : x,
                    ),
                  )
                }
                className="col-span-7 rounded-lg border border-input bg-surface px-3 py-2 text-sm"
              >
                {kinds.map((k) => (
                  <option key={k} value={k}>
                    {WITHHOLDING_LABELS[k][locale]} —{" "}
                    {formatPercent(WITHHOLDING_RATES[k], locale, 0)}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min={0}
                value={l.base}
                onChange={(e) =>
                  setLines(
                    lines.map((x, j) => (j === i ? { ...x, base: Number(e.target.value) } : x)),
                  )
                }
                className="col-span-4 rounded-lg border border-input bg-surface px-3 py-2 text-sm tabular-nums"
              />
              <button
                onClick={() => setLines(lines.filter((_, j) => j !== i))}
                className="col-span-1 rounded-lg text-ink-muted hover:text-destructive"
              >
                <Trash2 size={16} className="mx-auto" />
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="surface-card space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="title-text mb-0">{t("common.summary")}</h2>
          <button
            onClick={() => downloadWithholdingPdf(lines, result)}
            className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:border-primary"
          >
            PDF
          </button>
        </div>
        <div className="space-y-1">
          {result.lines.map((l, i) => (
            <div key={i} className="flex justify-between text-sm tabular-nums">
              <span className="text-ink-muted">{WITHHOLDING_LABELS[l.kind][locale]}</span>
              <span>{formatCurrency(l.amount, locale)}</span>
            </div>
          ))}
        </div>
        <div className="my-3 h-px bg-border" />
        <div className="flex justify-between">
          <span className="label-text">{t("withholding.totalWithheld")}</span>
          <span className="title-text tabular-nums">
            {formatCurrency(result.totalWithheld, locale)}
          </span>
        </div>
        <button
          onClick={() =>
            save({
              type: "withholding",
              fiscalYear: new Date().getFullYear(),
              periodLabel: `${new Date().toLocaleDateString(locale === "ar" ? "fr-DZ" : locale, { month: "long", year: "numeric" })}`,
              input: { lines },
              result,
              totalDue: result.totalWithheld,
            })
          }
          className="mt-4 w-full rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          Enregistrer la déclaration
        </button>
      </section>
    </div>
  );
}
