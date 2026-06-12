import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";

import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Eye, EyeOff, Building2, Briefcase, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const { t, locale } = useI18n();
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [accountType, setAccountType] = useState<"user" | "expert">("user");
  const [submitting, setSubmitting] = useState(false);

  const isRtl = locale === "ar";

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).get("demo") === "true"
    ) {
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
          email: em,
          password: pw,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
            data: {
              full_name: fullName,
              role: accountType,
            },
          },
        });
        if (error) throw error;
        toast.success("Compte créé. Vérifiez votre e-mail.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: em,
          password: pw,
        });
        if (error) throw error;
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleEmail = async (e: FormEvent) => {
    e.preventDefault();
    await submitCredentials(email, password, mode === "signup");
  };

  const handleDemo = async (role: "user" | "expert" | "admin") => {
    setSubmitting(true);
    const creds: Record<string, { email: string; password: string }> = {
      user: { email: "demo-user@matax.dz", password: "demo1234" },
      expert: { email: "demo-expert@matax.dz", password: "demo1234" },
      admin: { email: "demo-admin@matax.dz", password: "demo1234" },
    };
    const { email, password } = creds[role];
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      sessionStorage.setItem("matax_demo_role", role);
      sessionStorage.setItem("matax_demo_subscription_tier", "enterprise");
      toast.info(t("auth.demoAutoFill"));
      navigate({ to: "/dashboard" });
    }
    setSubmitting(false);
  };

  const handleGoogle = async () => {
    setSubmitting(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin + "/dashboard",
      },
    });
    if (error) {
      toast.error(error.message);
      setSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen">
      {/* Brand Panel */}
      <div className="relative hidden w-1/2 flex-col justify-between bg-sidebar p-12 text-white lg:flex ltr:order-first rtl:order-last overflow-hidden">
        {/* Subtle grid pattern & glowing orbs */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
        <div className="absolute -left-1/4 -top-1/4 w-96 h-96 rounded-full bg-primary/10 blur-[100px] pointer-events-none" />
        <div className="absolute -right-1/4 -bottom-1/4 w-96 h-96 rounded-full bg-secondary/10 blur-[100px] pointer-events-none" />

        <div className="relative z-10">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors"
          >
            <ArrowLeft size={16} />
            {t("landing.hero.cta2") || "Retour à l'accueil"}
          </Link>
          <div className="mt-10">
            <img src="/logo.png" alt="MATAX" className="h-16 w-auto mb-8" />
            <h1 className="text-4xl font-bold tracking-tight leading-tight text-white">MATAX</h1>
            <p className="mt-3 text-lg text-white/70 max-w-sm font-light">{t("auth.subtitle")}</p>
          </div>
        </div>

        <div className="relative z-10 space-y-6">
          <div className="rounded-lg border border-white/10 bg-white/5 p-5">
            <blockquote className="text-sm leading-relaxed text-white/90 italic">
              "L'outil indispensable pour les experts-comptables et les dirigeants d'entreprise en
              Algérie."
            </blockquote>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md border border-white/15 bg-white/5 font-mono font-bold text-sm text-primary">
              LF
            </div>
            <div>
              <div className="font-semibold text-sm">Conformité Garantie</div>
              <div className="text-xs text-white/50">Loi de Finances 2026</div>
            </div>
          </div>
        </div>
      </div>

      {/* Form Panel */}
      <div className="flex w-full items-center justify-center bg-background px-4 py-8 lg:w-1/2 lg:py-12">
        <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out fill-mode-forwards">
          {/* Top bar */}
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link to="/" className="lg:hidden">
                <img src="/logo.png" alt="MATAX" className="h-8 w-auto" />
              </Link>
              <Link
                to="/"
                className="inline-flex items-center gap-1.5 text-xs text-ink-muted hover:text-primary transition-colors lg:hidden"
              >
                <ArrowLeft size={12} />
                {t("landing.hero.cta2") || "Retour"}
              </Link>
            </div>
            <div className="flex items-center gap-1.5">
              <LanguageSwitcher />
              <ThemeToggle />
            </div>
          </div>

          {/* Back to home - desktop only */}
          <Link
            to="/"
            className="mb-6 hidden items-center gap-1.5 text-sm text-ink-muted hover:text-primary transition-colors lg:inline-flex"
          >
            <ArrowLeft size={14} />
            {t("landing.hero.cta2") || "Retour à l'accueil"}
          </Link>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">{t("auth.title")}</h1>
            <p className="mt-1.5 text-sm text-ink-muted">{t("auth.subtitle")}</p>
          </div>

          {/* Mode Toggle */}
          <div className="mb-6 flex rounded-lg bg-muted p-1">
            <button
              type="button"
              onClick={() => setMode("signin")}
              className={`flex-1 rounded-md px-4 py-2.5 text-sm font-medium transition-all ${
                mode === "signin"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-ink-muted hover:text-foreground"
              }`}
            >
              {t("common.signIn")}
            </button>
            <button
              type="button"
              onClick={() => setMode("signup")}
              className={`flex-1 rounded-md px-4 py-2.5 text-sm font-medium transition-all ${
                mode === "signup"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-ink-muted hover:text-foreground"
              }`}
            >
              {t("common.signUp")}
            </button>
          </div>

          {/* Google Sign In */}
          <Button
            type="button"
            variant="outline"
            className="w-full py-5 text-sm md:py-6"
            onClick={handleGoogle}
            disabled={submitting}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" className="shrink-0">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            {t("auth.googleSignIn")}
          </Button>

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-ink-muted">{t("auth.or")}</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          {/* Form */}
          <form onSubmit={handleEmail} className="space-y-4">
            {mode === "signup" && (
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">
                  {t("common.fullName")}
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-3.5 py-3 text-sm placeholder:text-ink-muted/50 transition-all focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20 md:py-2.5"
                  placeholder="Votre nom complet"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">{t("common.email")}</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3.5 py-3 text-sm placeholder:text-ink-muted/50 transition-all focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20 md:py-2.5"
                placeholder="email@exemple.com"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">{t("common.password")}</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={4}
                  maxLength={50}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-3.5 py-3 pr-12 text-sm placeholder:text-ink-muted/50 transition-all focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20 md:py-2.5"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-1 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-md text-ink-muted hover:text-foreground hover:bg-muted/50 transition-colors"
                  tabIndex={-1}
                  aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <p className="text-xs text-ink-muted" title={t("auth.passwordHint")}>
                {t("auth.passwordHint")}
              </p>
            </div>

            {mode === "signup" && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Type de compte</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setAccountType("user")}
                    className={`flex items-start gap-3 rounded-lg border p-3.5 text-left transition-all md:p-4 ${
                      accountType === "user"
                        ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                        : "border-border hover:border-primary/40 hover:bg-muted/50"
                    }`}
                  >
                    <Building2
                      size={18}
                      className={`mt-0.5 shrink-0 ${
                        accountType === "user" ? "text-primary" : "text-ink-muted"
                      }`}
                    />
                    <div>
                      <div className="text-sm font-medium">Entreprise</div>
                      <div className="mt-0.5 text-xs text-ink-muted">Gérer mes déclarations</div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAccountType("expert")}
                    className={`flex items-start gap-3 rounded-lg border p-3.5 text-left transition-all md:p-4 ${
                      accountType === "expert"
                        ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                        : "border-border hover:border-primary/40 hover:bg-muted/50"
                    }`}
                  >
                    <Briefcase
                      size={18}
                      className={`mt-0.5 shrink-0 ${
                        accountType === "expert" ? "text-primary" : "text-ink-muted"
                      }`}
                    />
                    <div>
                      <div className="text-sm font-medium">Expert-comptable</div>
                      <div className="mt-0.5 text-xs text-ink-muted">Gérer mes clients</div>
                    </div>
                  </button>
                </div>
              </div>
            )}

            <Button type="submit" className="w-full py-5 text-sm md:py-6" disabled={submitting}>
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 size={16} className="animate-spin" />
                  {mode === "signin" ? t("common.signIn") : t("common.signUp")}
                </span>
              ) : mode === "signin" ? (
                t("common.signIn")
              ) : (
                t("common.signUp")
              )}
            </Button>
          </form>

          {/* Demo accounts */}
          <div className="mt-6 space-y-3">
            <Button
              type="button"
              variant="outline"
              className="w-full border-dashed border-primary/40 py-5 text-primary hover:bg-primary/5 hover:text-primary md:py-6"
              onClick={() => handleDemo("user")}
              disabled={submitting}
            >
              {t("auth.demoButton")}
            </Button>
            <div className="flex flex-col gap-2 sm:grid sm:grid-cols-2">
              <Button
                type="button"
                variant="outline"
                className="border-dashed border-success/40 py-4 text-success hover:bg-success/5 hover:text-success text-xs md:py-5"
                onClick={() => handleDemo("expert")}
                disabled={submitting}
              >
                {t("auth.demoExpert")}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="border-dashed border-destructive/40 py-4 text-destructive hover:bg-destructive/5 hover:text-destructive text-xs md:py-5"
                onClick={() => handleDemo("admin")}
                disabled={submitting}
              >
                {t("auth.demoAdmin")}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
