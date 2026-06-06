// Fiscal regime configuration (client-side, localStorage-backed).
// Lets the user pick between the Régime Réel (full MVP) and the
// Régime Forfaitaire (V2 placeholder). No DB / schema changes.

export type FiscalRegime = "reel" | "forfaitaire";

export const REGIME_CONFIG = {
  reel: {
    label: { fr: "Régime Réel", en: "Actual System", ar: "النظام الحقيقي" },
    description: {
      fr: "TVA mensuelle/trimestrielle, IBS, IRG professionnel — conforme DGI 2026",
      en: "Monthly/quarterly TVA, IBS, professional IRG — DGI 2026 compliant",
      ar: "ضريبة القيمة المضافة شهرية/ربع سنوية، ضريبة الأرباح، الضريبة على الدخل المهني — متوافق مع المديرية العامة للضرائب 2026",
    },
    features: ["G50", "G11", "G04", "TVA", "IRG", "IBS"],
    available: true,
  },
  forfaitaire: {
    label: { fr: "Régime Forfaitaire", en: "Flat-Rate System", ar: "النظام الجزافي" },
    description: {
      fr: "Imposition forfaitaire simplifiée — disponible en V2",
      en: "Simplified flat-rate taxation — available in V2",
      ar: "الضريبة الجزافية المبسطة — متاح في الإصدار الثاني",
    },
    features: ["IRG_Forfaitaire", "G50_Simplified"],
    available: false, // V2 placeholder
    v2Note: {
      fr: "Cette fonctionnalité sera disponible en V2 pour les auto-entrepreneurs et petits commerçants.",
      en: "This feature will be available in V2 for auto-entrepreneurs and small traders.",
      ar: "ستكون هذه الميزة متاحة في الإصدار الثاني للمقاولين الذاتيين والتجار الصغار.",
    },
  },
} as const;

const REGIME_KEY = "matax_regime";
const REGIME_SET_KEY = "matax_regime_set";

export function getUserRegime(): FiscalRegime {
  if (typeof window === "undefined") return "reel";
  const r = localStorage.getItem(REGIME_KEY) as FiscalRegime | null;
  return r === "forfaitaire" ? "forfaitaire" : "reel";
}

export function setUserRegime(regime: FiscalRegime) {
  if (typeof window === "undefined") return;
  localStorage.setItem(REGIME_KEY, regime);
  localStorage.setItem(REGIME_SET_KEY, "1");
}

export function isRegimeSet(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(REGIME_SET_KEY) === "1";
}
