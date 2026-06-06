import { useState } from "react";
import { Check, Lock, X } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { REGIME_CONFIG, setUserRegime, type FiscalRegime } from "@/lib/regime-config";

interface RegimeSelectorProps {
  initial?: FiscalRegime;
  showWarning?: boolean;
  onConfirm: (regime: FiscalRegime) => void;
  onClose?: () => void;
}

export function RegimeSelector({ initial = "reel", showWarning = false, onConfirm, onClose }: RegimeSelectorProps) {
  const { t, locale } = useI18n();
  const [selected, setSelected] = useState<FiscalRegime>(initial);

  const confirm = (regime: FiscalRegime) => {
    setUserRegime(regime);
    onConfirm(regime);
  };

  const cards: FiscalRegime[] = ["reel", "forfaitaire"];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-2xl border border-border bg-background p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="title-text">{t("regime.selector.title")}</h2>
            <p className="mt-1 text-sm text-ink-muted">{t("regime.selector.subtitle")}</p>
          </div>
          {onClose && (
            <button onClick={onClose} aria-label="close" className="rounded-md p-1 text-ink-muted hover:bg-muted">
              <X size={18} />
            </button>
          )}
        </div>

        {showWarning && (
          <p className="mt-3 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-warning">
            {t("regime.change_warning")}
          </p>
        )}

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {cards.map((key) => {
            const cfg = REGIME_CONFIG[key];
            const active = selected === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelected(key)}
                className={`flex flex-col gap-3 rounded-xl border p-4 text-start transition-colors ${
                  active ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="label-text">{cfg.label[locale]}</span>
                  {cfg.available ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                      <Check size={12} /> {t("regime.selector.active")}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-ink-muted">
                      <Lock size={12} /> {t("regime.selector.v2")}
                    </span>
                  )}
                </div>
                <p className="text-xs text-ink-muted">{cfg.description[locale]}</p>
                <div className="flex flex-wrap gap-1">
                  {cfg.features.map((f) => (
                    <span key={f} className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-ink-muted">{f}</span>
                  ))}
                </div>
                {!cfg.available && "v2Note" in cfg && (
                  <p className="text-[11px] italic text-ink-muted">{cfg.v2Note[locale]}</p>
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button
            onClick={() => confirm("reel")}
            className="rounded-lg border border-border px-4 py-2 text-sm hover:border-primary"
          >
            {t("regime.selector.skip")}
          </button>
          <button
            onClick={() => confirm(selected)}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            {t("regime.selector.confirm")}
          </button>
        </div>
      </div>
    </div>
  );
}
