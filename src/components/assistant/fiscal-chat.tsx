import { useEffect, useMemo, useRef, useState } from "react";
import { MessageSquare, Send, X, BookOpen, Lock } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/hooks/use-auth";
import { useIsMobile } from "@/hooks/use-mobile";
import { Link } from "@tanstack/react-router";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import kb from "@/data/fiscal-kb.json";

interface KBEntry {
  id: string;
  tags: string[];
  question_fr: string;
  question_ar: string;
  question_en: string;
  answer_fr: string;
  answer_ar: string;
  answer_en: string;
  refs: string[];
}

const KB = kb as KBEntry[];

interface Msg {
  role: "user" | "bot";
  text: string;
  refs?: string[];
}

function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ");
}

const STOP_WORDS = new Set([
  // French
  "le",
  "la",
  "les",
  "de",
  "des",
  "du",
  "un",
  "une",
  "et",
  "en",
  "est",
  "que",
  "qui",
  "pour",
  "sur",
  "pas",
  "ne",
  "se",
  "au",
  "aux",
  "son",
  "sa",
  "ses",
  "ce",
  "cette",
  "mais",
  "ou",
  "donc",
  "car",
  "je",
  "tu",
  "il",
  "nous",
  "vous",
  "ils",
  "elle",
  "elles",
  "mon",
  "ma",
  "mes",
  "ton",
  "ta",
  "tes",
  "notre",
  "votre",
  "leur",
  "leurs",
  "y",
  "a",
  "peut",
  "etre",
  "avoir",
  "fait",
  "tout",
  "tous",
  "toute",
  "toutes",
  "quel",
  "quelle",
  "quels",
  "quelles",
  "comment",
  "combien",
  "est",
  "sont",
  "etais",
  "etait",
  "sera",
  "sera",
  "avant",
  "apres",
  "avec",
  "sans",
  "dans",
  "par",
  "entre",
  "chez",
  "vers",
  "depuis",
  "sujet",
  "concernant",
  "aujourdhui",
  // English
  "the",
  "a",
  "an",
  "is",
  "are",
  "was",
  "were",
  "be",
  "been",
  "being",
  "have",
  "has",
  "had",
  "do",
  "does",
  "did",
  "will",
  "would",
  "could",
  "should",
  "may",
  "might",
  "shall",
  "can",
  "need",
  "dare",
  "ought",
  "used",
  "to",
  "of",
  "in",
  "for",
  "on",
  "with",
  "at",
  "by",
  "from",
  "as",
  "into",
  "through",
  "during",
  "before",
  "after",
  "above",
  "below",
  "between",
  "out",
  "off",
  "over",
  "under",
  "again",
  "further",
  "then",
  "once",
  "what",
  "which",
  "who",
  "whom",
  "this",
  "that",
  "these",
  "those",
  "and",
  "but",
  "or",
  "nor",
  "not",
  "so",
  "very",
  "just",
  "than",
  "too",
  "also",
  "how",
  "when",
  "where",
  "why",
  "all",
  "each",
  "every",
  "both",
  "few",
  "more",
  "most",
  "other",
  "some",
  "such",
  "no",
  "only",
  "own",
  "same",
  "about",
  "up",
  "here",
  "there",
  "now",
  "any",
]);

function tokenize(text: string): string[] {
  return normalize(text)
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOP_WORDS.has(t));
}

function getLocalizedField(entry: KBEntry, locale: string, field: "question" | "answer") {
  if (locale === "ar") return field === "question" ? entry.question_ar : entry.answer_ar;
  if (locale === "en") return field === "question" ? entry.question_en : entry.answer_en;
  return field === "question" ? entry.question_fr : entry.answer_fr;
}

function scoreEntry(query: string, entry: KBEntry, locale: string): number {
  const tokens = tokenize(query);
  if (tokens.length === 0) return 0;

  const question = normalize(getLocalizedField(entry, locale, "question"));
  const answer = normalize(getLocalizedField(entry, locale, "answer"));
  const tags = entry.tags.map((t) => t.toLowerCase());

  let score = 0;

  // Exact tag match (highest weight)
  for (const tag of tags) {
    if (tokens.includes(tag)) score += 5;
  }

  // Partial tag match
  for (const token of tokens) {
    for (const tag of tags) {
      if (tag.includes(token) || token.includes(tag)) score += 3;
    }
  }

  // Question token matches (high weight)
  const questionTokens = tokenize(question);
  for (const token of tokens) {
    if (questionTokens.includes(token)) score += 3;
    for (const qt of questionTokens) {
      if (qt.includes(token) || token.includes(qt)) score += 1;
    }
  }

  // Answer token matches (lower weight)
  for (const token of tokens) {
    if (answer.includes(token)) score += 1;
  }

  // Exact phrase match bonus
  if (question.includes(normalize(query))) score += 10;

  return score;
}

export function FiscalChat() {
  const { t, locale } = useI18n();
  const { subscriptionTier } = useAuth();
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [input, setInput] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const hasAccess =
    subscriptionTier === "pro" ||
    subscriptionTier === "business" ||
    subscriptionTier === "enterprise";

  useEffect(() => {
    if (open && msgs.length === 0 && hasAccess) {
      setMsgs([{ role: "bot", text: t("assistant.greeting") }]);
    }
  }, [open, msgs.length, t, hasAccess]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [msgs]);

  const suggestions = useMemo(
    () => [t("assistant.sug_tva"), t("assistant.sug_g50"), t("assistant.sug_irg")],
    [t],
  );

  const ask = (q: string) => {
    if (!q.trim()) return;
    const userMsg: Msg = { role: "user", text: q };
    const ranked = KB.map((e) => ({ e, s: scoreEntry(q, e, locale) }))
      .filter((r) => r.s > 0)
      .sort((a, b) => b.s - a.s);
    let botMsg: Msg;
    if (ranked.length === 0) {
      botMsg = { role: "bot", text: t("assistant.no_match") };
    } else {
      const top = ranked[0].e;
      botMsg = {
        role: "bot",
        text: getLocalizedField(top, locale, "answer"),
        refs: top.refs,
      };
    }
    setMsgs((prev) => [...prev, userMsg, botMsg]);
    setInput("");
  };

  const isRtl = locale === "ar";

  const chatContent = (inDrawer: boolean) => (
    <>
      {/* Header */}
      <div className={`flex items-center justify-between border-b border-border px-4 py-3 ${inDrawer ? '' : ''}`}>
        <div className={isRtl ? "text-right" : "text-left"}>
          <h3 className="text-sm font-semibold">{t("assistant.title")}</h3>
          <p className="text-[10px] text-ink-muted">{t("assistant.subtitle")}</p>
        </div>
        <button
          onClick={() => { setOpen(false); setDrawerOpen(false); }}
          className="rounded-md p-1 text-ink-muted hover:bg-muted"
          aria-label="close"
        >
          <X size={18} />
        </button>
      </div>

      {!hasAccess ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4">
          <div className="p-4 rounded-full bg-primary/10 text-primary">
            <Lock className="h-10 w-10" />
          </div>
          <h3 className="text-base font-bold text-foreground">
            {isRtl ? "المساعد الجبائي الذكي مغلق" : "Assistant Fiscal IA verrouillé"}
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed max-w-xs">
            {isRtl 
              ? "يرجى ترقية اشتراكك إلى حزمة Pro أو Business أو Enterprise لفتح المساعد الجبائي الذكي المستند إلى قانون المالية 2026."
              : "Mettez à niveau votre abonnement vers le plan Pro, Business ou Enterprise pour débloquer l'assistant fiscal IA basé sur la Loi de Finances 2026."}
          </p>
          <Link
            to="/settings"
            onClick={() => { setOpen(false); setDrawerOpen(false); }}
            className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shadow"
          >
            {isRtl ? "ترقية الاشتراك" : "Mettre à niveau"}
          </Link>
        </div>
      ) : (
        <>
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
            {msgs.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                    m.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.text}</p>
                  {m.refs && m.refs.length > 0 && (
                    <div className="mt-2 flex flex-wrap items-center gap-1 border-t border-border/40 pt-2">
                      <BookOpen size={12} className="text-ink-muted" />
                      {m.refs.map((r) => (
                        <span
                          key={r}
                          className="rounded bg-background/60 px-1.5 py-0.5 font-mono text-[10px] text-ink-muted"
                        >
                          {r}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {msgs.length <= 1 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => ask(s)}
                    className="rounded-full border border-border bg-surface px-3 py-1 text-xs text-ink-muted hover:border-primary hover:text-primary"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          <p className="border-t border-border bg-warning/5 px-4 py-2 text-[10px] text-warning">
            {t("assistant.disclaimer")}
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              ask(input);
            }}
            className="flex items-center gap-2 border-t border-border p-3"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t("assistant.placeholder")}
              className="flex-1 rounded-lg border border-input bg-surface px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
            <button
              type="submit"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground hover:opacity-90"
              aria-label="send"
            >
              <Send size={16} />
            </button>
          </form>
        </>
      )}
    </>
  );

  return (
    <>
      {/* Desktop floating trigger */}
      <div className="fixed bottom-6 end-6 z-40 hidden items-center gap-4 md:flex">
        {!open && (
          <div className="relative animate-in fade-in slide-in-from-bottom-2 rounded-xl border border-border bg-background px-4 py-2.5 text-sm shadow-md">
            Une question fiscale ? <span className="font-semibold text-primary">Posez-la ici</span>
            <div className="absolute top-1/2 -end-1.5 h-3 w-3 -translate-y-1/2 rotate-45 border-r border-t border-border bg-background" />
          </div>
        )}
        <button
          onClick={() => setOpen(true)}
          aria-label={t("assistant.title")}
          className="flex h-14 items-center justify-center gap-3 rounded-full bg-primary px-5 text-primary-foreground shadow-lg transition hover:scale-105"
        >
          <MessageSquare size={22} />
          <span className="hidden font-medium lg:inline-block">Assistant</span>
        </button>
      </div>

      {/* Desktop chat overlay */}
      {open && !isMobile && (
        <div className="fixed inset-0 z-50 flex items-end justify-end bg-black/40 p-0 md:p-6" dir={isRtl ? "rtl" : "ltr"}>
          <div className="flex h-[85vh] w-full max-w-md flex-col rounded-t-2xl border border-border bg-background shadow-2xl md:h-[600px] md:rounded-2xl">
            {chatContent(false)}
          </div>
        </div>
      )}

      {/* Mobile FAB + Drawer */}
      <div className="md:hidden">
        <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
          <DrawerTrigger asChild>
            <button
              aria-label={t("assistant.title")}
              className="mobile-fab mobile-fab-enter"
            >
              <MessageSquare size={22} />
            </button>
          </DrawerTrigger>
          <DrawerContent className="flex h-[85vh] flex-col rounded-t-[10px] border border-border bg-background p-0">
            <DrawerHeader className="sr-only">
              <DrawerTitle>{t("assistant.title")}</DrawerTitle>
            </DrawerHeader>
            <div className="flex flex-1 flex-col overflow-hidden" dir={isRtl ? "rtl" : "ltr"}>
              {chatContent(true)}
            </div>
          </DrawerContent>
        </Drawer>
      </div>
    </>
  );
}
