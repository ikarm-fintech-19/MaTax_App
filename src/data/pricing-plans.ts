export type PlanTier = "free" | "starter" | "pro" | "business" | "enterprise";

export interface PlanFeature {
  textKey: string;
  included: boolean;
}

export interface PricingPlan {
  id: PlanTier;
  priceMonthly: number | "custom";
  priceAnnually: number | "custom";
  limits: {
    companies: number;
    users: number;
  };
  features: PlanFeature[];
}

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: "free",
    priceMonthly: 0,
    priceAnnually: 0,
    limits: { companies: 1, users: 1 },
    features: [
      { textKey: "pricing.features.basic_calculators", included: true },
      { textKey: "pricing.features.obligations_timeline", included: true },
      { textKey: "pricing.features.g50_pdf", included: false },
      { textKey: "pricing.features.expert_consultation", included: false },
      { textKey: "pricing.features.ai_fiscal_assistant", included: false },
    ]
  },
  {
    id: "starter",
    priceMonthly: 4500,
    priceAnnually: 45000,
    limits: { companies: 1, users: 1 },
    features: [
      { textKey: "pricing.features.basic_calculators", included: true },
      { textKey: "pricing.features.obligations_timeline", included: true },
      { textKey: "pricing.features.g50_pdf", included: false },
      { textKey: "pricing.features.expert_consultation", included: false },
      { textKey: "pricing.features.ai_fiscal_assistant", included: false },
    ]
  },
  {
    id: "pro",
    priceMonthly: 12000,
    priceAnnually: 120000,
    limits: { companies: 3, users: 2 },
    features: [
      { textKey: "pricing.features.basic_calculators", included: true },
      { textKey: "pricing.features.obligations_timeline", included: true },
      { textKey: "pricing.features.g50_pdf", included: true },
      { textKey: "pricing.features.expert_consultation", included: false },
      { textKey: "pricing.features.ai_fiscal_assistant", included: true },
    ]
  },
  {
    id: "business",
    priceMonthly: 25000,
    priceAnnually: 250000,
    limits: { companies: 10, users: 5 },
    features: [
      { textKey: "pricing.features.basic_calculators", included: true },
      { textKey: "pricing.features.obligations_timeline", included: true },
      { textKey: "pricing.features.g50_pdf", included: true },
      { textKey: "pricing.features.expert_consultation", included: true },
      { textKey: "pricing.features.ai_fiscal_assistant", included: true },
    ]
  },
  {
    id: "enterprise",
    priceMonthly: "custom",
    priceAnnually: "custom",
    limits: { companies: 999, users: 999 },
    features: [
      { textKey: "pricing.features.basic_calculators", included: true },
      { textKey: "pricing.features.obligations_timeline", included: true },
      { textKey: "pricing.features.g50_pdf", included: true },
      { textKey: "pricing.features.expert_consultation", included: true },
      { textKey: "pricing.features.ai_fiscal_assistant", included: true },
    ]
  }
];
