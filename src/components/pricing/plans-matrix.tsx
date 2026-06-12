import * as React from "react";
import { PRICING_PLANS, PricingPlan } from "@/data/pricing-plans";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/hooks/use-auth";
import { CheckoutModal } from "./checkout-modal";
import { Check, X, ShieldAlert, Sparkles, Building, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PlansMatrix() {
  const { t, locale } = useI18n();
  const { subscriptionTier } = useAuth();
  
  const [billingPeriod, setBillingPeriod] = React.useState<"monthly" | "annually">("monthly");
  const [selectedPlan, setSelectedPlan] = React.useState<PricingPlan | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = React.useState(false);

  const isRtl = locale === "ar";

  const handleUpgradeClick = (plan: PricingPlan) => {
    setSelectedPlan(plan);
    setIsCheckoutOpen(true);
  };

  return (
    <div className="w-full space-y-10" dir={isRtl ? "rtl" : "ltr"}>
      {/* Title Header */}
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          {t("pricing.title")}
        </h2>
        <p className="text-base text-muted-foreground">
          {t("pricing.subtitle")}
        </p>

        {/* Toggle Switch */}
        <div className="inline-flex items-center justify-center p-1 bg-muted/60 dark:bg-muted/30 border border-border rounded-full mt-4">
          <button
            onClick={() => setBillingPeriod("monthly")}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              billingPeriod === "monthly"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t("pricing.monthly")}
          </button>
          <button
            onClick={() => setBillingPeriod("annually")}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
              billingPeriod === "annually"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t("pricing.yearly")}
            <span className="bg-emerald-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full scale-90">
              -15%
            </span>
          </button>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-stretch">
        {PRICING_PLANS.map((plan) => {
          const isCurrent = subscriptionTier === plan.id;
          const isEnterprise = plan.id === "enterprise";
          const isFree = plan.id === "free";
          
          let priceText = "";
          let priceSub = "";

          if (isEnterprise) {
            priceText = t("pricing.custom_price");
          } else {
            const price = billingPeriod === "monthly" ? plan.priceMonthly : plan.priceAnnually;
            if (typeof price === "number") {
              priceText = `${price.toLocaleString()}`;
              priceSub = ` DZD ${billingPeriod === "monthly" ? t("pricing.duration.monthly") : t("pricing.duration.yearly")}`;
            }
          }

          // Special highlight for Pro plan
          const isPro = plan.id === "pro";

          return (
            <div
              key={plan.id}
              className={`flex flex-col relative rounded-xl border p-6 transition-all duration-300 ${
                isPro
                  ? "border-primary ring-2 ring-primary/20 bg-primary/5 dark:bg-primary/5 shadow-md scale-105 md:scale-105 z-10"
                  : "border-border hover:border-muted-foreground/30 bg-card shadow-sm"
              }`}
            >
              {isPro && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-sm">
                  <Sparkles className="h-3 w-3" />
                  Popular
                </div>
              )}

              <div className="space-y-4 flex-grow">
                <div>
                  <h3 className="text-lg font-bold text-foreground capitalize">
                    {t(`pricing.plan.${plan.id}`)}
                  </h3>
                  <div className="mt-4 flex items-baseline">
                    <span className="text-2xl font-extrabold tracking-tight text-foreground">
                      {priceText}
                    </span>
                    {priceSub && (
                      <span className="text-xs font-semibold text-muted-foreground ml-1">
                        {priceSub}
                      </span>
                    )}
                  </div>
                </div>

                {/* Plan limits */}
                <div className="space-y-2 py-4 border-y border-border/60 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span>
                      {plan.limits.companies === 999 
                        ? "Entreprises illimitées" 
                        : `${plan.limits.companies} ${plan.limits.companies > 1 ? "entreprises" : "entreprise"}`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span>
                      {plan.limits.users === 999
                        ? "Utilisateurs illimités"
                        : `${plan.limits.users} ${plan.limits.users > 1 ? "utilisateurs" : "utilisateur"}`}
                    </span>
                  </div>
                </div>

                {/* Features list */}
                <div className="space-y-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    {t("pricing.features_title")}
                  </p>
                  <ul className="space-y-2.5 text-sm">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2.5">
                        {feature.included ? (
                          <Check className="h-4.5 w-4.5 text-emerald-500 shrink-0 mt-0.5" />
                        ) : (
                          <X className="h-4.5 w-4.5 text-muted-foreground/40 shrink-0 mt-0.5" />
                        )}
                        <span className={`text-xs ${feature.included ? "text-foreground" : "text-muted-foreground/50"}`}>
                          {t(feature.textKey)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-6 pt-4">
                {isCurrent ? (
                  <Button
                    variant="outline"
                    className="w-full h-10 border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 font-semibold"
                    disabled
                  >
                    {t("pricing.current_plan")}
                  </Button>
                ) : isFree ? (
                  <Button
                    variant="outline"
                    className="w-full h-10 border-border text-foreground hover:bg-muted font-medium cursor-pointer"
                    onClick={() => handleUpgradeClick(plan)}
                  >
                    {t("pricing.upgrade")}
                  </Button>
                ) : (
                  <Button
                    variant={isPro ? "default" : "outline"}
                    className={`w-full h-10 font-semibold cursor-pointer ${
                      isPro 
                        ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md"
                        : "border-border text-foreground hover:bg-muted"
                    }`}
                    onClick={() => handleUpgradeClick(plan)}
                  >
                    {t("pricing.upgrade")}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Checkout Modal */}
      <CheckoutModal
        plan={selectedPlan}
        isOpen={isCheckoutOpen}
        onClose={() => {
          setIsCheckoutOpen(false);
          setSelectedPlan(null);
        }}
        billingPeriod={billingPeriod}
      />
    </div>
  );
}
