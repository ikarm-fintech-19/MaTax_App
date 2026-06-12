import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { useEffect, useState } from "react";
import {
  Calculator,
  Shield,
  Clock,
  FileText,
  ChevronRight,
  Check,
  Phone,
  Mail,
  ArrowRight,
  Star,
  Users,
  Zap,
  Menu,
  X,
} from "lucide-react";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

function LandingPage() {
  const { session, loading } = useAuth();
  const { t } = useI18n();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    if (!loading && session) {
      window.location.href = "/dashboard";
    }
  }, [loading, session]);

  const features = [
    {
      icon: Calculator,
      title: t("landing.feature1.title"),
      desc: t("landing.feature1.desc"),
    },
    {
      icon: Shield,
      title: t("landing.feature2.title"),
      desc: t("landing.feature2.desc"),
    },
    {
      icon: Clock,
      title: t("landing.feature3.title"),
      desc: t("landing.feature3.desc"),
    },
    {
      icon: FileText,
      title: t("landing.feature4.title"),
      desc: t("landing.feature4.desc"),
    },
    {
      icon: Users,
      title: t("landing.feature5.title"),
      desc: t("landing.feature5.desc"),
    },
    {
      icon: Zap,
      title: t("landing.feature6.title"),
      desc: t("landing.feature6.desc"),
    },
  ];

  const stats = [
    { value: "100%", label: t("landing.stats.compliant") },
    { value: "3", label: t("landing.stats.languages") },
    { value: "24/7", label: t("landing.stats.available") },
    { value: "Free", label: t("landing.stats.free") },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 md:px-8">
          <Link to="/" className="flex items-center gap-2">
            <img
              src="/logo.png"
              alt="MATAX - Conformité Fiscale Intelligente"
              className="h-10 w-auto"
            />
          </Link>
          <nav className="hidden items-center gap-6 md:flex">
            <a href="#features" className="text-sm text-ink-muted hover:text-primary">
              {t("landing.nav.features")}
            </a>
            <a href="#stats" className="text-sm text-ink-muted hover:text-primary">
              {t("landing.nav.advantages")}
            </a>
            <a href="#expert" className="text-sm text-ink-muted hover:text-primary">
              {t("landing.nav.experts")}
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <ThemeToggle />
            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileNavOpen(!mobileNavOpen)}
              aria-label="Menu"
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border text-foreground md:hidden"
            >
              {mobileNavOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <Link
              to="/login"
              className="hidden rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover md:inline-flex"
            >
              {t("common.signIn")}
            </Link>
          </div>
        </div>
        {/* Mobile nav menu */}
        {mobileNavOpen && (
          <div className="border-t border-border bg-background px-4 py-4 md:hidden">
            <nav className="flex flex-col gap-3">
              <a
                href="#features"
                onClick={() => setMobileNavOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-ink-muted hover:bg-muted hover:text-primary"
              >
                {t("landing.nav.features")}
              </a>
              <a
                href="#stats"
                onClick={() => setMobileNavOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-ink-muted hover:bg-muted hover:text-primary"
              >
                {t("landing.nav.advantages")}
              </a>
              <a
                href="#expert"
                onClick={() => setMobileNavOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-ink-muted hover:bg-muted hover:text-primary"
              >
                {t("landing.nav.experts")}
              </a>
              <hr className="border-border" />
              <Link
                to="/login"
                onClick={() => setMobileNavOpen(false)}
                className="flex items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground"
              >
                {t("common.signIn")}
              </Link>
            </nav>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 to-background">
        <div className="mx-auto max-w-6xl px-4 py-20 md:px-8 md:py-32">
          <div className="max-w-3xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <Star size={14} /> {t("landing.hero.badge")}
            </div>
            <h1 className="headline-text text-4xl md:text-6xl">
              {t("landing.hero.title1")}{" "}
              <span className="text-primary">{t("landing.hero.title2")}</span>{" "}
              {t("landing.hero.title3")}
            </h1>
            <p className="mt-6 text-lg text-ink-muted md:text-xl">{t("landing.hero.desc")}</p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary-hover"
              >
                {t("landing.hero.cta1")} <ArrowRight size={16} />
              </Link>
              <a
                href="#features"
                className="inline-flex items-center gap-2 rounded-lg border border-border px-6 py-3 text-sm font-medium hover:border-primary"
              >
                {t("landing.hero.cta2")}
              </a>
            </div>
          </div>
        </div>
        {/* Decorative gradient — Indigo primary glow */}
        <div className="absolute -end-20 -top-20 h-96 w-96 rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute -start-20 bottom-0 h-64 w-64 rounded-full bg-secondary/10 blur-3xl" />
      </section>

      {/* Stats */}
      <section id="stats" className="border-y border-border bg-surface/50">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-4 py-12 md:grid-cols-4 md:px-8">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="title-text text-3xl text-primary">{stat.value}</div>
              <div className="mt-1 text-sm text-ink-muted">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-4 py-20 md:px-8">
        <div className="mb-12 text-center">
          <h2 className="title-text text-3xl">{t("landing.features.title")}</h2>
          <p className="mt-3 text-ink-muted">{t("landing.features.desc")}</p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="surface-card group cursor-default transition-all hover:border-primary hover:bg-surface-elevated"
            >
              <div className="mb-4 inline-flex rounded-md bg-primary/10 p-3 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <f.icon size={24} />
              </div>
              <h3 className="label-text mb-2">{f.title}</h3>
              <p className="text-sm leading-relaxed text-ink-muted">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Expert Section */}
      <section id="expert" className="border-y border-border bg-surface/50">
        <div className="mx-auto max-w-6xl px-4 py-20 md:px-8">
          <div className="grid items-center gap-12 md:grid-cols-2">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                <Users size={14} /> {t("landing.expert.badge")}
              </div>
              <h2 className="title-text text-3xl">{t("landing.expert.title")}</h2>
              <p className="mt-4 text-ink-muted">{t("landing.expert.desc")}</p>
              <ul className="mt-6 space-y-3">
                {[
                  t("landing.expert.bullet1"),
                  t("landing.expert.bullet2"),
                  t("landing.expert.bullet3"),
                  t("landing.expert.bullet4"),
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm">
                    <Check size={16} className="text-success" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                to="/login"
                className="mt-8 inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary-hover"
              >
                {t("landing.expert.cta")} <ChevronRight size={16} />
              </Link>
            </div>
            <div className="surface-card p-8">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Users size={20} />
                  </div>
                  <div>
                    <div className="label-text">12 {t("landing.expert.card.active_clients")}</div>
                    <div className="text-xs text-ink-muted">
                      3 {t("landing.expert.card.pending")}
                    </div>
                  </div>
                </div>
                <div className="h-px bg-border" />
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg bg-muted/50 p-3 text-center">
                    <div className="title-text text-2xl text-primary">28</div>
                    <div className="text-xs text-ink-muted">
                      {t("landing.expert.card.declarations")}
                    </div>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-3 text-center">
                    <div className="title-text text-2xl text-primary">5</div>
                    <div className="text-xs text-ink-muted">
                      {t("landing.expert.card.pending_label")}
                    </div>
                  </div>
                </div>
                <div className="rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm text-warning">
                  3 {t("landing.expert.card.deadlines")}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 py-20 md:px-8">
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-8 text-center md:p-12">
          <h2 className="title-text text-3xl text-foreground">{t("landing.cta.title")}</h2>
          <p className="mx-auto mt-4 max-w-xl text-ink-muted">{t("landing.cta.desc")}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary-hover"
            >
              {t("landing.cta.create")} <ArrowRight size={16} />
            </Link>
            <a
              href="mailto:contact@matax.dz"
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-6 py-3 text-sm font-medium text-foreground hover:border-primary"
            >
              <Mail size={16} /> {t("landing.cta.contact")}
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-surface/50">
        <div className="mx-auto max-w-6xl px-4 py-12 md:px-8">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div>
              <Link to="/" className="block">
                <img src="/logo.png" alt="MATAX" className="h-12 w-auto" />
              </Link>
              <p className="mt-2 max-w-sm text-sm text-ink-muted">{t("landing.footer.desc")}</p>
            </div>
            <div className="flex items-center gap-6 text-sm text-ink-muted">
              <a href="mailto:contact@matax.dz" className="hover:text-primary">
                contact@matax.dz
              </a>
              <a href="tel:+213555000000" className="hover:text-primary">
                +213 555 00 00 00
              </a>
            </div>
          </div>
          <div className="mt-8 border-t border-border pt-6 text-center text-xs text-ink-muted">
            {t("landing.footer.rights")}
          </div>
        </div>
      </footer>
    </div>
  );
}
