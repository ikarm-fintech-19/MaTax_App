import { createFileRoute, Outlet, Link, useNavigate, useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/language-switcher";
import { LayoutDashboard, Receipt, Calculator, Building2, Fuel, Coins, Settings, LogOut, Menu } from "lucide-react";
import { FiscalChat } from "@/components/assistant/fiscal-chat";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetHeader } from "@/components/ui/sheet";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

function AppLayout() {
  const { session, loading, signOut } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const [navOpen, setNavOpen] = useState(false);

  // Demo bypass: ?demo=true sets a session flag and skips real auth.
  const isDemo = (() => {
    if (typeof window === "undefined") return false;
    if (new URLSearchParams(window.location.search).get("demo") === "true") {
      sessionStorage.setItem("matax_demo", "1");
      return true;
    }
    return sessionStorage.getItem("matax_demo") === "1";
  })();

  useEffect(() => {
    if (!loading && !session && !isDemo) navigate({ to: "/login" });
  }, [loading, session, isDemo, navigate]);

  // Close mobile nav on route change
  useEffect(() => { setNavOpen(false); }, [location.pathname]);

  if (!isDemo && (loading || !session)) {
    return <main className="flex min-h-screen items-center justify-center bg-background"><span className="text-ink-muted">{t("common.loading")}</span></main>;
  }

  const navGroups = [
    {
      label: "OUTILS",
      items: [
        { to: "/dashboard", icon: LayoutDashboard, label: t("nav.dashboard") },
        { to: "/g50", icon: Receipt, label: t("nav.g50") },
        { to: "/irg", icon: Calculator, label: t("nav.irg") },
        { to: "/ibs", icon: Building2, label: t("nav.ibs") },
        { to: "/tfpc", icon: Fuel, label: t("nav.tfpc") },
        { to: "/withholding", icon: Coins, label: t("nav.withholding") },
      ]
    },
    {
      label: "COMPTE",
      items: [
        { to: "/settings", icon: Settings, label: t("nav.settings") },
      ]
    }
  ];

  const NavList = (
    <>
      <div className="flex-1 overflow-y-auto px-3 py-2">
        {navGroups.map((group, idx) => (
          <div key={idx} className="mb-6">
            <div className="mb-2 px-3 text-xs font-semibold tracking-wider text-ink-muted">
              {group.label}
            </div>
            <nav className="space-y-1">
              {group.items.map(({ to, icon: Icon, label }) => {
                const active = location.pathname === to;
                return (
                  <Link key={to} to={to} aria-current={active ? "page" : undefined}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                      active ? "bg-primary text-primary-foreground"
                        : "text-sidebar-foreground hover:bg-sidebar-accent"
                    }`}>
                    <Icon size={18} />
                    <span className="truncate">{label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        ))}
      </div>
      <div className="border-t border-sidebar-border px-3 py-4 space-y-2">
        <LanguageSwitcher />
        <button onClick={() => { sessionStorage.removeItem("matax_demo"); signOut().then(() => navigate({ to: "/login" })); }}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink-muted hover:bg-sidebar-accent">
          <LogOut size={16} /> {t("common.signOut")}
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 start-0 hidden w-64 border-e border-sidebar-border bg-sidebar md:flex md:flex-col">
        <div className="px-6 py-8">
          <Link to="/dashboard" className="title-text text-primary text-2xl">Matax</Link>
          <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-primary"></span>
            LF 2026
          </div>
        </div>
        {NavList}
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between gap-2 border-b border-border bg-background/95 px-4 py-3 backdrop-blur md:hidden">
        <Sheet open={navOpen} onOpenChange={setNavOpen}>
          <SheetTrigger asChild>
            <button aria-label="Menu" className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border text-foreground active:bg-sidebar-accent">
              <Menu size={20} />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 bg-sidebar p-0 flex flex-col">
            <SheetHeader className="px-6 py-5 text-start">
              <SheetTitle className="title-text text-primary">Matax</SheetTitle>
              <p className="caption-text">{t("app.tagline")}</p>
            </SheetHeader>
            {NavList}
          </SheetContent>
        </Sheet>
        <Link to="/dashboard" className="title-text text-primary">Matax</Link>
        <div className="w-10" />
      </header>

      <main className="md:ms-64 h-full min-h-screen">
        <div key={location.pathname} className="mx-auto max-w-6xl px-4 py-6 pb-24 md:px-8 md:py-8 animate-in fade-in duration-300 ease-out fill-mode-forwards">
          <Outlet />
        </div>
      </main>
      <FiscalChat />
    </div>
  );
}
