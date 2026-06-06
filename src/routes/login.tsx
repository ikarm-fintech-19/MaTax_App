import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/language-switcher";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const { t } = useI18n();
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" &&
        new URLSearchParams(window.location.search).get("demo") === "true") {
      sessionStorage.setItem("matax_demo", "1");
      navigate({ to: "/dashboard" });
      return;
    }
    if (!loading && session) navigate({ to: "/dashboard" });
  }, [loading, session, navigate]);

  // MVP: Validation simplifiée pour adoption rapide. Durcissement post-labellisation prévu.
  const submitCredentials = async (em: string, pw: string, signup: boolean) => {
    if (pw.length < 4 || pw.length > 50) {
      toast.error(t("auth.passwordMin"));
      return;
    }
    setSubmitting(true);
    try {
      if (signup) {
        const { error } = await supabase.auth.signUp({
          email: em, password: pw,
          options: { emailRedirectTo: `${window.location.origin}/dashboard` },
        });
        if (error) throw error;
        toast.success("Compte créé. Vérifiez votre e-mail.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: em, password: pw });
        if (error) throw error;
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally { setSubmitting(false); }
  };

  const handleEmail = async (e: FormEvent) => {
    e.preventDefault();
    await submitCredentials(email, password, mode === "signup");
  };

  const handleDemo = async () => {
    setEmail("demo@matax.dz");
    setPassword("demo123");
    toast.info(t("auth.demoAutoFill"));
    sessionStorage.setItem("matax_demo", "1");
    // Simulate slight network delay for UI feedback
    setTimeout(() => {
      navigate({ to: "/dashboard" });
    }, 600);
  };

  const handleGoogle = async () => {
    setSubmitting(true);
    const res = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/dashboard" });
    if (res.error) { toast.error(res.error.message); setSubmitting(false); return; }
  };

  return (
    <main className="flex min-h-screen">
      {/* Brand Panel - Hidden on mobile */}
      <div className="hidden w-1/2 flex-col justify-between bg-primary p-12 text-primary-foreground lg:flex ltr:order-first rtl:order-last">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Matax</h1>
          <p className="mt-4 text-lg text-primary-foreground/80">
            Conformité fiscale algérienne. Simple, précise et sécurisée.
          </p>
        </div>
        <div className="space-y-4">
          <blockquote className="text-xl leading-relaxed">
            "L'outil indispensable pour les experts-comptables et les dirigeants d'entreprise en Algérie."
          </blockquote>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-foreground/20 font-bold">
              LF
            </div>
            <div>
              <div className="font-semibold">Conformité Garantie</div>
              <div className="text-sm text-primary-foreground/80">Loi de Finances 2026</div>
            </div>
          </div>
        </div>
      </div>

      {/* Form Panel */}
      <div className="flex w-full items-center justify-center bg-background px-4 py-12 lg:w-1/2">
        <div className="w-full max-w-md">
          <div className="mb-6 flex items-center justify-between">
            <Link to="/" className="title-text text-primary lg:hidden">Matax</Link>
            <div className="hidden lg:block" />
            <LanguageSwitcher />
          </div>
          <div className="surface-card border-none shadow-none lg:border-solid lg:border-border lg:shadow-sm">
          <h1 className="title-text">{t("auth.title")}</h1>
          <p className="caption-text mt-1">{t("auth.subtitle")}</p>

          <button
            onClick={handleGoogle}
            disabled={submitting}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-surface px-4 py-3 text-sm font-medium hover:border-primary disabled:opacity-50"
          >
            <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            {t("auth.googleSignIn")}
          </button>

          <div className="my-6 flex items-center gap-3 text-xs text-ink-muted">
            <div className="h-px flex-1 bg-border" />{t("auth.or")}<div className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={handleEmail} className="space-y-4">
            <div>
              <label className="label-text mb-1 block">{t("common.email")}</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-input bg-surface px-3 py-2 focus:border-primary focus:outline-none" />
            </div>
            <div>
              <label className="label-text mb-1 block">{t("common.password")}</label>
              {/* MVP: Validation simplifiée pour adoption rapide. Durcissement post-labellisation prévu. */}
              <input type="password" required minLength={4} maxLength={50} value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-input bg-surface px-3 py-2 focus:border-primary focus:outline-none" />
              <p className="mt-1 text-xs text-ink-muted" title={t("auth.passwordHint")}>
                {t("auth.passwordHint")}
              </p>
            </div>
            <button type="submit" disabled={submitting}
              className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-50">
              {mode === "signin" ? t("common.signIn") : t("common.signUp")}
            </button>
          </form>

          <button onClick={handleDemo} disabled={submitting}
            className="mt-3 w-full rounded-lg border border-dashed border-primary/50 bg-primary/5 px-4 py-3 text-sm font-medium text-primary hover:bg-primary/10 disabled:opacity-50">
            {t("auth.demoButton")}
          </button>

          <button onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            className="mt-4 w-full text-center text-sm text-ink-muted hover:text-primary">
            {mode === "signin" ? t("auth.noAccount") : t("auth.haveAccount")}
          </button>
          </div>
        </div>
      </div>
    </main>
  );
}
