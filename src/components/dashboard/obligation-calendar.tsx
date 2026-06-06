import { useMemo } from "react";
import { useI18n } from "@/lib/i18n";
import { AlertTriangle, CheckCircle2, Clock } from "lucide-react";

type Status = "submitted" | "upcoming" | "overdue";
interface Obligation {
  id: string;
  code: string; // G50, G11, G04
  labelFr: string;
  labelAr: string;
  labelEn: string;
  dueDate: string; // ISO yyyy-mm-dd
  status: Status;
  note?: string;
}

function daysBetween(a: Date, b: Date) {
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}

function buildMockObligations(today: Date): Obligation[] {
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  const addDays = (n: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() + n);
    return d;
  };
  return [
    {
      id: "g50-prev",
      code: "G50",
      labelFr: "G50 Avril 2026 — Déposé",
      labelAr: "G50 أفريل 2026 — مودع",
      labelEn: "G50 April 2026 — Submitted",
      dueDate: iso(addDays(-12)),
      status: "submitted",
    },
    {
      id: "g50-curr",
      code: "G50",
      labelFr: "G50 Mai 2026",
      labelAr: "G50 ماي 2026",
      labelEn: "G50 May 2026",
      dueDate: iso(addDays(5)),
      status: "upcoming",
    },
    {
      id: "g11",
      code: "G11",
      labelFr: "G11 — État annuel des salaires 2025",
      labelAr: "G11 — الكشف السنوي للأجور 2025",
      labelEn: "G11 — Annual wages statement 2025",
      dueDate: iso(addDays(3)),
      status: "upcoming",
    },
    {
      id: "g04",
      code: "G04",
      labelFr: "G04 — Acompte IBS",
      labelAr: "G04 — تسبيق IBS",
      labelEn: "G04 — IBS installment",
      dueDate: iso(addDays(-3)),
      status: "overdue",
      note: "Majoration 10% possible",
    },
  ];
}

export function getUpcomingAlertsCount(): number {
  const list = buildMockObligations(new Date());
  return list.filter((o) => o.status === "upcoming" || o.status === "overdue").length;
}

export function ObligationCalendar() {
  const { t, locale } = useI18n();
  const today = useMemo(() => new Date(), []);
  const obligations = useMemo(() => buildMockObligations(today), [today]);

  // 30-day grid starting at start of current week
  const days = useMemo(() => {
    const start = new Date(today);
    start.setDate(start.getDate() - 7); // include last week for context
    return Array.from({ length: 35 }, (_, i) => {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [today]);

  const byDate = useMemo(() => {
    const map = new Map<string, Obligation[]>();
    for (const o of obligations) {
      const arr = map.get(o.dueDate) ?? [];
      arr.push(o);
      map.set(o.dueDate, arr);
    }
    return map;
  }, [obligations]);

  const label = (o: Obligation) =>
    locale === "ar" ? o.labelAr : locale === "en" ? o.labelEn : o.labelFr;

  const weekdayNames =
    locale === "ar"
      ? ["إث", "ثل", "أر", "خم", "جم", "سب", "أح"]
      : locale === "en"
        ? ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
        : ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

  const statusDot = (s: Status) =>
    s === "submitted"
      ? "bg-success"
      : s === "upcoming"
        ? "bg-warning"
        : "bg-destructive";

  return (
    <div className="surface-card space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="title-text">{t("calendar.title")}</h2>
        <div className="flex flex-wrap items-center gap-3 text-xs text-ink-muted">
          <Legend dotClass="bg-success" label={t("calendar.legend_submitted")} />
          <Legend dotClass="bg-warning" label={t("calendar.legend_upcoming")} />
          <Legend dotClass="bg-destructive" label={t("calendar.legend_overdue")} />
        </div>
      </div>

      {/* Calendar grid */}
      <div>
        <div className="mb-1 grid grid-cols-7 gap-1 text-center text-[10px] uppercase text-ink-muted">
          {weekdayNames.map((w) => (
            <div key={w}>{w}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days.map((d) => {
            const key = d.toISOString().slice(0, 10);
            const isToday = key === today.toISOString().slice(0, 10);
            const items = byDate.get(key) ?? [];
            return (
              <div
                key={key}
                className={`relative aspect-square rounded-md border p-1 text-[10px] ${
                  isToday
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border bg-surface text-ink-muted"
                }`}
              >
                <div className="tabular-nums">{d.getDate()}</div>
                {items.length > 0 && (
                  <div className="absolute bottom-1 end-1 flex gap-0.5">
                    {items.map((o) => (
                      <span
                        key={o.id}
                        className={`h-1.5 w-1.5 rounded-full ${statusDot(o.status)}`}
                        title={label(o)}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Upcoming list */}
      <ul className="space-y-2">
        {obligations
          .slice()
          .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
          .map((o) => {
            const due = new Date(o.dueDate);
            const diff = daysBetween(today, due);
            const Icon =
              o.status === "submitted"
                ? CheckCircle2
                : o.status === "overdue"
                  ? AlertTriangle
                  : Clock;
            const iconColor =
              o.status === "submitted"
                ? "text-success"
                : o.status === "overdue"
                  ? "text-destructive"
                  : "text-warning";
            return (
              <li
                key={o.id}
                className="flex items-start justify-between gap-3 rounded-lg border border-border bg-surface p-3"
              >
                <div className="flex items-start gap-2">
                  <Icon size={16} className={`mt-0.5 ${iconColor}`} />
                  <div>
                    <div className="text-sm font-medium">{label(o)}</div>
                    <div className="text-xs text-ink-muted">
                      {due.toLocaleDateString(
                        locale === "ar" ? "ar-DZ" : locale === "en" ? "en-GB" : "fr-DZ",
                        { day: "2-digit", month: "long", year: "numeric" },
                      )}
                      {o.status === "upcoming" && diff >= 0 ? (
                        <span> · {t("calendar.in")} {diff} {t("calendar.days")}</span>
                      ) : null}
                      {o.status === "overdue" ? (
                        <span className="text-destructive"> · {o.note}</span>
                      ) : null}
                    </div>
                  </div>
                </div>
                <span className="rounded-md bg-muted px-2 py-0.5 font-mono text-[10px] uppercase text-ink-muted">
                  {o.code}
                </span>
              </li>
            );
          })}
      </ul>
    </div>
  );
}

function Legend({ dotClass, label }: { dotClass: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className={`h-2 w-2 rounded-full ${dotClass}`} /> {label}
    </span>
  );
}
