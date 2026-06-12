import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

function getAdminClient() {
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export const createUser = createServerFn({ method: "POST" })
  .handler(async (data: { email: string; password: string; fullName: string; companyName?: string; nif?: string; role: "user" | "expert" | "admin" }) => {
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
