import { createFileRoute, Outlet, Link, useNavigate, useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  LayoutDashboard,
  Receipt,
  Calculator,
  Building2,
  Fuel,
  Coins,
  Settings,
  LogOut,
  Menu,
  Users,
  Shield,
  ChevronDown,
  Home,
} from "lucide-react";
import { FiscalChat } from "@/components/assistant/fiscal-chat";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetHeader } from "@/components/ui/sheet";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

function AppLayout() {
  const { session, loading, signOut, role, isExpert, isAdmin } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const [navOpen, setNavOpen] = useState(false);

  const isDemo =
    typeof window !== "undefined" && sessionStorage.getItem("matax_demo_role") !== null;

  useEffect(() => {
    if (!loading && !session && !isDemo) navigate({ to: "/login" });
  }, [loading, session, isDemo, navigate]);

  useEffect(() => {
    setNavOpen(false);
  }, [location.pathname]);

  if (!isDemo && (loading || !session)) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <span className="text-ink-muted">{t("common.loading")}</span>
      </main>
    );
  }

  // Build nav groups based on role
  const navGroups: Array<{
    label: string;
    items: Array<{
      to: string;
      icon: React.ComponentType<{ size?: number }>;
      label: string;
    }>;
  }> = [];

  // Tools group - available to all
  const toolItems = [
    { to: "/dashboard", icon: LayoutDashboard, label: t("nav.dashboard") },
    { to: "/g50", icon: Receipt, label: t("nav.g50") },
    { to: "/irg", icon: Calculator, label: t("nav.irg") },
    { to: "/ibs", icon: Building2, label: t("nav.ibs") },
    { to: "/tfpc", icon: Fuel, label: t("nav.tfpc") },
    { to: "/withholding", icon: Coins, label: t("nav.withholding") },
  ];
  navGroups.push({ label: "OUTILS", items: toolItems });

  // Expert group
  if (isExpert || isAdmin) {
    navGroups.push({
      label: "EXPERT",
      items: [{ to: "/expert", icon: Users, label: "Mes clients" }],
    });
  }

  // Admin group
  if (isAdmin) {
    navGroups.push({
      label: "ADMIN",
      items: [{ to: "/admin", icon: Shield, label: "Administration" }],
    });
  }

  // Account group
  navGroups.push({
    label: "COMPTE",
    items: [{ to: "/settings", icon: Settings, label: t("nav.settings") }],
  });

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
                  <Link
                    key={to}
                    to={to}
                    aria-current={active ? "page" : undefined}
                    className={`relative flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-all ${
                      active
                        ? "bg-sidebar-accent text-white font-semibold"
                        : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                    }`}
                  >
                    {active && (
                      <span className="absolute inset-y-2.5 start-0 w-1 rounded-full bg-primary" />
                    )}
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
        <div className="flex items-center justify-between gap-2">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
        <div className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-ink-muted">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
              isAdmin
                ? "bg-destructive/10 text-destructive"
                : isExpert
                  ? "bg-success/10 text-success"
                  : "bg-muted text-ink-muted"
            }`}
          >
            {isAdmin && <Shield size={10} />}
            {isExpert && <Users size={10} />}
            {role}
          </span>
        </div>
        <button
          onClick={() => {
            sessionStorage.removeItem("matax_demo_role");
            signOut().then(() => navigate({ to: "/login" }));
          }}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink-muted hover:bg-sidebar-accent"
        >
          <LogOut size={16} /> {t("common.signOut")}
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 start-0 hidden w-64 border-e border-sidebar-border bg-sidebar md:flex md:flex-col">
        <div className="px-6 py-6">
          <Link to="/dashboard" className="block">
            <img
              src="/logo.png"
              alt="MATAX - Conformité Fiscale Intelligente"
              className="h-16 w-auto"
            />
          </Link>
          <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
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
            <button
              aria-label="Menu"
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border text-foreground active:bg-sidebar-accent"
            >
              <Menu size={20} />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 bg-sidebar p-0 flex flex-col">
            <SheetHeader className="px-6 py-5 text-start">
              <SheetTitle className="flex items-center gap-3">
                <img src="/logo.png" alt="MATAX" className="h-10 w-auto" />
              </SheetTitle>
              <p className="caption-text">{t("app.tagline")}</p>
            </SheetHeader>
            {NavList}
          </SheetContent>
        </Sheet>
        <Link to="/dashboard" className="flex items-center gap-2">
          <img src="/logo.png" alt="MATAX" className="h-8 w-auto" />
        </Link>
        <ThemeToggle />
      </header>

      <main className="md:ms-64 h-full min-h-screen">
        <div
          key={location.pathname}
          className="mx-auto max-w-6xl px-4 py-6 pb-24 md:px-8 md:py-8 animate-in fade-in duration-300 ease-out fill-mode-forwards"
        >
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 inset-x-0 z-40 border-t border-border bg-background/95 backdrop-blur md:hidden safe-area-bottom">
        <div className="flex items-center justify-around overflow-x-auto px-1 py-1.5">
          {[
            { to: "/dashboard", icon: LayoutDashboard, label: t("nav.dashboard") },
            { to: "/g50", icon: Receipt, label: "G50" },
            { to: "/irg", icon: Calculator, label: "IRG" },
            { to: "/ibs", icon: Building2, label: "IBS" },
            { to: "/tfpc", icon: Fuel, label: "TFPC" },
            { to: "/withholding", icon: Coins, label: "Ret." },
            ...(isExpert || isAdmin
              ? [{ to: "/expert", icon: Users, label: t("expert.clients") as string }]
              : []),
            ...(isAdmin ? [{ to: "/admin", icon: Shield, label: "Admin" }] : []),
            { to: "/settings", icon: Settings, label: t("nav.settings") },
          ].map(({ to, icon: Icon, label }) => {
            const active = location.pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className={`bottom-nav-link flex flex-col items-center gap-0.5 rounded-lg px-2.5 py-1 text-[10px] font-medium transition-all duration-150 ${
                  active
                    ? "bottom-nav-active"
                    : "text-ink-muted"
                }`}
              >
                <Icon size={20} />
                <span className="whitespace-nowrap">{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      <FiscalChat />
    </div>
  );
}
