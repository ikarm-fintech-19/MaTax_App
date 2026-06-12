import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PlansMatrix } from "@/components/pricing/plans-matrix";
import { CreditCard, Building, ShieldCheck, HelpCircle } from "lucide-react";

export const Route = createFileRoute("/_app/settings")({ component: SettingsPage });

function SettingsPage() {
  const { user, subscriptionTier } = useAuth();
  const { t, locale } = useI18n();
  const [form, setForm] = useState({
    full_name: "",
    company_name: "",
    nif: "",
    rc: "",
    address: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data)
          setForm({
            full_name: data.full_name ?? "",
            company_name: data.company_name ?? "",
            nif: data.nif ?? "",
            rc: data.rc ?? "",
            address: data.address ?? "",
          });
      });
  }, [user]);

  const save = async () => {
    if (!user) return;
    setLoading(true);
    const { error } = await supabase.from("profiles").update(form).eq("id", user.id);
    setLoading(false);
    if (error) toast.error(error.message);
    else toast.success(t("settings.saved"));
  };

  const isRtl = locale === "ar";

  return (
    <div className="space-y-8 w-full max-w-6xl mx-auto" dir={isRtl ? "rtl" : "ltr"}>
      <header className={isRtl ? "text-right" : "text-left"}>
        <h1 className="headline-text text-3xl font-extrabold tracking-tight">{t("settings.title")}</h1>
      </header>

      <Tabs defaultValue="company" className="w-full">
        <TabsList className="flex w-full md:w-auto md:inline-flex justify-start border-b border-border bg-transparent p-0 rounded-none mb-6">
          <TabsTrigger 
            value="company" 
            className="flex items-center gap-2 px-6 py-3 border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none font-semibold text-sm cursor-pointer"
          >
            <Building className="h-4 w-4" />
            {t("settings.tab.company")}
          </TabsTrigger>
          <TabsTrigger 
            value="subscription" 
            className="flex items-center gap-2 px-6 py-3 border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none font-semibold text-sm cursor-pointer"
          >
            <CreditCard className="h-4 w-4" />
            {t("settings.tab.subscription")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="company" className="space-y-6 max-w-2xl mt-0">
          <section className="surface-card p-6 border border-border rounded-lg space-y-6">
            <h2 className="title-text text-xl font-bold border-b border-border/50 pb-3">{t("settings.company")}</h2>
            <div className="space-y-4">
              {(["full_name", "company_name", "nif", "rc", "address"] as const).map((key) => (
                <div key={key} className="space-y-1.5">
                  <label className="label-text text-sm font-medium block">
                    {key === "full_name"
                      ? t("common.fullName")
                      : key === "company_name"
                        ? t("settings.company_name")
                        : key === "nif"
                          ? t("settings.nif")
                          : key === "rc"
                            ? t("settings.rc")
                            : t("settings.address")}
                  </label>
                  <input
                    value={form[key]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    className="w-full rounded-lg border border-input bg-surface px-4 py-2.5 text-sm focus:border-primary focus:outline-none transition-colors"
                  />
                </div>
              ))}
            </div>
            <button
              onClick={save}
              disabled={loading}
              className="rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary-hover disabled:opacity-50 transition-colors cursor-pointer"
            >
              {t("common.save")}
            </button>
          </section>
        </TabsContent>

        <TabsContent value="subscription" className="space-y-8 mt-0">
          {/* Current plan brief card */}
          <div className="surface-card p-6 border border-border rounded-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-muted/20">
            <div className="space-y-1">
              <span className="text-xs uppercase tracking-wider font-bold text-muted-foreground">
                Plan Actuel / الحزمة الحالية
              </span>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-extrabold capitalize text-foreground">
                  {t(`pricing.plan.${subscriptionTier || "free"}`)}
                </h3>
                <span className="bg-primary/10 text-primary text-xs px-2.5 py-0.5 rounded-full font-semibold">
                  Active
                </span>
              </div>
            </div>
            <div className="text-xs text-muted-foreground flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <span>Algerian Compliance Standards Gated Tier</span>
            </div>
          </div>

          {/* Pricing Plans Matrix */}
          <div className="border border-border/80 rounded-xl p-8 bg-card">
            <PlansMatrix />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
