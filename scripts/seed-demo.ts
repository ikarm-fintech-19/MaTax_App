// Creates 3 demo auth users + updates profiles to enterprise tier.
// Usage: npx tsx scripts/seed-demo.ts

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_SERVICE_ROLE_KEY env var");
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const DEMO_USERS = [
  {
    email: "demo-user@matax.dz",
    password: "demo1234",
    meta: { full_name: "Demo Entreprise", role: "user" },
    profile: { full_name: "Demo Entreprise", company_name: "SARL Demo Algérie", nif: "199012345678901", rc: "16B1234567", role: "user", subscription_tier: "enterprise" },
  },
  {
    email: "demo-expert@matax.dz",
    password: "demo1234",
    meta: { full_name: "Demo Expert", role: "expert" },
    profile: { full_name: "Demo Expert", company_name: "Cabinet Demo Expert", nif: "198512345678902", rc: "16B7654321", role: "expert", subscription_tier: "enterprise" },
  },
  {
    email: "demo-admin@matax.dz",
    password: "demo1234",
    meta: { full_name: "Demo Admin", role: "admin" },
    profile: { full_name: "Demo Admin", company_name: "MaTax Administration", nif: "198012345678903", rc: "16B1111111", role: "admin", subscription_tier: "enterprise" },
  },
];

async function main() {
  const userIds: Record<string, string> = {};

  for (const u of DEMO_USERS) {
    const { data: existing } = await admin.auth.admin.listUsers();
    const found = existing?.users?.find((x) => x.email === u.email);

    if (found) {
      console.log(`User ${u.email} already exists (${found.id}), updating profile…`);
      userIds[u.email] = found.id;
      const { error: upErr } = await admin.from("profiles").update(u.profile).eq("id", found.id);
      if (upErr) console.error(`  Profile update error:`, upErr.message);
      else console.log(`  Profile updated.`);
      continue;
    }

    const { data, error } = await admin.auth.admin.createUser({
      email: u.email,
      password: u.password,
      email_confirm: true,
      user_metadata: u.meta,
    });

    if (error) {
      console.error(`Error creating ${u.email}:`, error.message);
      continue;
    }

    const userId = data.user.id;
    userIds[u.email] = userId;
    console.log(`Created ${u.email} (${userId})`);

    const { error: upErr } = await admin.from("profiles").update(u.profile).eq("id", userId);
    if (upErr) console.error(`  Profile update error:`, upErr.message);
    else console.log(`  Profile updated.`);
  }

  // Link demo-expert as expert of demo-user
  const expertId = userIds["demo-expert@matax.dz"];
  const clientId = userIds["demo-user@matax.dz"];

  if (expertId && clientId) {
    const { data: existingLink } = await admin
      .from("expert_clients")
      .select("id")
      .eq("expert_id", expertId)
      .eq("client_id", clientId)
      .maybeSingle();

    if (!existingLink) {
      const { error: linkErr } = await admin
        .from("expert_clients")
        .insert({ expert_id: expertId, client_id: clientId });
      if (linkErr) console.error("Link error:", linkErr.message);
      else console.log("Linked demo-expert -> demo-user");
    } else {
      console.log("Expert-client link already exists");
    }
  } else {
    console.log("Skipping expert-client link: missing IDs");
  }

  console.log("\nDone. Demo credentials:");
  console.log("  Entreprise: demo-user@matax.dz / demo1234");
  console.log("  Expert:     demo-expert@matax.dz / demo1234");
  console.log("  Admin:      demo-admin@matax.dz / demo1234");
}

main().catch(console.error);
