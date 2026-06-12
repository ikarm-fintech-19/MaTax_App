import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import WebSocket from "ws";

function getAdminClient() {
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    realtime: { transport: WebSocket },
  });
}

export const createUser = createServerFn({ method: "POST" })
  .handler(async (data: { email: string; password: string; fullName: string; companyName?: string; nif?: string; role: "user" | "expert" | "admin" }) => {
    if (!data.email?.trim()) throw new Error("L'adresse email est obligatoire");
    if (!data.password?.trim()) throw new Error("Le mot de passe est obligatoire");
    if (!data.fullName?.trim()) throw new Error("Le nom complet est obligatoire");
    const admin = getAdminClient();
    const { data: authData, error } = await admin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { full_name: data.fullName, role: data.role },
    });
    if (error) throw new Error(error.message);
    const { error: profileError } = await admin.from("profiles").update({
      full_name: data.fullName,
      company_name: data.companyName ?? null,
      nif: data.nif ?? null,
      role: data.role,
      subscription_tier: "enterprise",
    }).eq("id", authData.user.id);
    if (profileError) throw new Error(profileError.message);
    return { id: authData.user.id, email: data.email, fullName: data.fullName };
  });

export const deleteUser = createServerFn({ method: "POST" })
  .handler(async (data: { userId: string }) => {
    const admin = getAdminClient();
    const { error } = await admin.auth.admin.deleteUser(data.userId);
    if (error) throw new Error(error.message);
    return { success: true };
  });

export const searchUsersByNif = createServerFn({ method: "POST" })
  .handler(async (data: { query: string }) => {
    const admin = getAdminClient();
    const { data: profiles, error } = await admin
      .from("profiles")
      .select("id, full_name, company_name, nif")
      .or(`nif.ilike.%${data.query}%,full_name.ilike.%${data.query}%,company_name.ilike.%${data.query}%`)
      .eq("role", "user")
      .limit(10);
    if (error) throw new Error(error.message);
    return profiles;
  });

export const addExpertClient = createServerFn({ method: "POST" })
  .handler(async (data: { expertId: string; clientId: string }) => {
    const admin = getAdminClient();
    const { error } = await admin.from("expert_clients").insert({
      expert_id: data.expertId,
      client_id: data.clientId,
    });
    if (error) throw new Error(error.message);
    return { success: true };
  });

export const removeExpertClient = createServerFn({ method: "POST" })
  .handler(async (data: { assignmentId: string }) => {
    const admin = getAdminClient();
    const { error } = await admin.from("expert_clients").delete().eq("id", data.assignmentId);
    if (error) throw new Error(error.message);
    return { success: true };
  });

export const saveClientDeclaration = createServerFn({ method: "POST" })
  .handler(async (data: { clientId: string; type: string; fiscalYear: number; periodLabel: string; input: unknown; result: unknown; totalDue: number }) => {
    const admin = getAdminClient();
    const { error } = await admin.from("declarations").insert({
      user_id: data.clientId,
      type: data.type,
      status: "draft",
      fiscal_year: data.fiscalYear,
      period_label: data.periodLabel,
      input: data.input as any,
      result: data.result as any,
      total_due: data.totalDue,
    });
    if (error) throw new Error(error.message);
    return { success: true };
  });
