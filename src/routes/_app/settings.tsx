import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/settings")({ component: SettingsPage });

function SettingsPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const [form, setForm] = useState({ full_name: "", company_name: "", nif: "", rc: "", address: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle().then(({ data }) => {
      if (data) setForm({
        full_name: data.full_name ?? "", company_name: data.company_name ?? "",
        nif: data.nif ?? "", rc: data.rc ?? "", address: data.address ?? "",
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

  return (
    <div className="space-y-8 max-w-2xl">
      <header>
        <h1 className="headline-text">{t("settings.title")}</h1>
      </header>
      <section className="surface-card space-y-4">
        <h2 className="title-text">{t("settings.company")}</h2>
        {(["full_name", "company_name", "nif", "rc", "address"] as const).map((key) => (
          <div key={key}>
            <label className="label-text mb-1 block">
              {key === "full_name" ? t("common.fullName")
                : key === "company_name" ? t("settings.company")
                : key === "nif" ? t("settings.nif")
                : key === "rc" ? t("settings.rc")
                : t("settings.address")}
            </label>
            <input value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              className="w-full rounded-lg border border-input bg-surface px-3 py-2 focus:border-primary focus:outline-none" />
          </div>
        ))}
        <button onClick={save} disabled={loading}
          className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-50">
          {t("common.save")}
        </button>
      </section>
    </div>
  );
}
