import { useI18n, type Locale } from "@/lib/i18n";

const LABELS: Record<Locale, string> = { fr: "FR", ar: "ع", en: "EN" };

export function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();
  return (
    <div className="inline-flex rounded-lg border border-border bg-surface p-1" role="group">
      {(["fr", "ar", "en"] as Locale[]).map((l) => (
        <button
          key={l}
          onClick={() => setLocale(l)}
          aria-pressed={locale === l}
          className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
            locale === l
              ? "bg-primary text-primary-foreground"
              : "text-ink-muted hover:text-foreground"
          }`}
        >
          {LABELS[l]}
        </button>
      ))}
    </div>
  );
}
