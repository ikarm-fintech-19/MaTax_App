import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import type { TablesInsert } from "@/integrations/supabase/types";
import { toast } from "sonner";

type DeclarationType = TablesInsert<"declarations">["type"];

function isDemo(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem("matax_demo_role") !== null;
}

export function useSaveDeclaration() {
  const { session } = useAuth();

  const save = useCallback(
    async ({
      type,
      fiscalYear,
      periodLabel,
      input,
      result,
      totalDue,
    }: {
      type: DeclarationType;
      fiscalYear?: number;
      periodLabel?: string;
      input?: unknown;
      result?: unknown;
      totalDue?: number;
    }) => {
      if (isDemo()) {
        const saved = JSON.parse(
          typeof window !== "undefined"
            ? window.localStorage.getItem("matax_saved_declarations") || "[]"
            : "[]",
        );
        saved.push({ type, fiscalYear, periodLabel, input, result, totalDue, savedAt: new Date().toISOString() });
        if (typeof window !== "undefined") {
          window.localStorage.setItem("matax_saved_declarations", JSON.stringify(saved));
        }
        toast.success("Déclaration sauvegardée (mode démo)");
        return;
      }

      const userId = session?.user?.id;
      if (!userId) {
        toast.error("Connectez-vous pour enregistrer une déclaration");
        return;
      }

      const { error } = await supabase.from("declarations").insert({
        user_id: userId,
        type,
        status: "draft",
        fiscal_year: fiscalYear ?? new Date().getFullYear(),
        period_label: periodLabel,
        input: input as any,
        result: result as any,
        total_due: totalDue,
      });

      if (error) {
        toast.error(error.message);
        throw error;
      }

      toast.success("Déclaration enregistrée");
    },
    [session],
  );

  return { save };
}
