import { useEffect, useMemo, useRef, useState } from "react";
import { MessageSquare, Send, X, BookOpen } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import kb from "@/data/fiscal-kb.json";

interface KBEntry {
  id: string;
  tags: string[];
  question_fr: string;
  question_ar: string;
  answer_fr: string;
  answer_ar: string;
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

function scoreEntry(query: string, entry: KBEntry, locale: string): number {
  const q = normalize(query);
  if (!q.trim()) return 0;
  const tokens = q.split(/\s+/).filter((t) => t.length > 2);
  const haystack = normalize(
    [
      locale === "ar" ? entry.question_ar : entry.question_fr,
      locale === "ar" ? entry.answer_ar : entry.answer_fr,
      entry.tags.join(" "),
    ].join(" "),
  );
  let score = 0;
  for (const tok of tokens) if (haystack.includes(tok)) score += 1;
  for (const tag of entry.tags) if (q.includes(tag.toLowerCase())) score += 2;
  return score;
}

export function FiscalChat() {
  const { t, locale } = useI18n();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && msgs.length === 0) {
      setMsgs([{ role: "bot", text: t("assistant.greeting") }]);
    }
  }, [open, msgs.length, t]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [msgs]);

  const suggestions = useMemo(
    () => [
      t("assistant.sug_tva"),
      t("assistant.sug_g50"),
      t("assistant.sug_irg"),
    ],
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
        text: locale === "ar" ? top.answer_ar : top.answer_fr,
        refs: top.refs,
      };
    }
    setMsgs((prev) => [...prev, userMsg, botMsg]);
    setInput("");
  };

  return (
    <>
      {/* Floating trigger — hidden on small screens */}
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

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-end bg-black/40 p-0 md:p-6">
          <div className="flex h-[85vh] w-full max-w-md flex-col rounded-t-2xl border border-border bg-background shadow-2xl md:h-[600px] md:rounded-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div>
                <h3 className="text-sm font-semibold">{t("assistant.title")}</h3>
                <p className="text-[10px] text-ink-muted">{t("assistant.subtitle")}</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="rounded-md p-1 text-ink-muted hover:bg-muted"
                aria-label="close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Messages */}
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

            {/* Disclaimer */}
            <p className="border-t border-border bg-warning/5 px-4 py-2 text-[10px] text-warning">
              {t("assistant.disclaimer")}
            </p>

            {/* Input */}
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
          </div>
        </div>
      )}
    </>
  );
}
