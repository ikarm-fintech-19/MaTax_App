import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { toast } from "sonner";

export type UserRole = "user" | "expert" | "admin";
export type PlanTier = "free" | "starter" | "pro" | "business" | "enterprise";

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: Tables<"profiles"> | null;
  role: UserRole;
  subscriptionTier: PlanTier;
  updateSubscription: (tier: PlanTier) => Promise<void>;
  loading: boolean;
  signOut: () => Promise<void>;
  isExpert: boolean;
  isAdmin: boolean;
  isUser: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function getDemoRole(): UserRole | null {
  if (typeof window === "undefined") return null;
  const demoRole = sessionStorage.getItem("matax_demo_role");
  if (demoRole === "expert" || demoRole === "admin" || demoRole === "user") {
    return demoRole;
  }
  return null;
}

function getDemoSubscriptionTier(): PlanTier | null {
  if (typeof window === "undefined") return null;
  const tier = sessionStorage.getItem("matax_demo_subscription_tier");
  if (tier === "free" || tier === "starter" || tier === "pro" || tier === "business" || tier === "enterprise") {
    return tier;
  }
  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Tables<"profiles"> | null>(null);
  const [subscriptionTierState, setSubscriptionTierState] = useState<PlanTier>("free");
  const [loading, setLoading] = useState(true);

  const demoRole = getDemoRole();
  const demoTier = getDemoSubscriptionTier();

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase.from("profiles").select("*").eq("id", userId).single();
    setProfile(data);
    if (data?.subscription_tier) {
      setSubscriptionTierState(data.subscription_tier as PlanTier);
    }
  };

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (s?.user) {
        if (typeof window !== "undefined") {
          sessionStorage.removeItem("matax_demo_role");
          sessionStorage.removeItem("matax_demo_subscription_tier");
        }
        fetchProfile(s.user.id);
      } else {
        setProfile(null);
        if (getDemoSubscriptionTier() === null) {
          setSubscriptionTierState("free");
        }
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session?.user) {
        if (typeof window !== "undefined") {
          sessionStorage.removeItem("matax_demo_role");
          sessionStorage.removeItem("matax_demo_subscription_tier");
        }
        fetchProfile(data.session.user.id);
      } else {
        const demo = getDemoSubscriptionTier();
        if (demo) {
          setSubscriptionTierState(demo);
        }
      }
      setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const updateSubscription = async (tier: PlanTier) => {
    if (getDemoRole() !== null) {
      sessionStorage.setItem("matax_demo_subscription_tier", tier);
      setSubscriptionTierState(tier);
      toast.success("Abonnement démo mis à jour");
      return;
    }
    
    const currentUser = session?.user;
    if (!currentUser) {
      sessionStorage.setItem("matax_demo_subscription_tier", tier);
      setSubscriptionTierState(tier);
      toast.success("Abonnement démo mis à jour");
      return;
    }
    
    const { error } = await supabase
      .from("profiles")
      .update({ subscription_tier: tier })
      .eq("id", currentUser.id);
      
    if (error) {
      toast.error(error.message);
      throw error;
    }
    setSubscriptionTierState(tier);
    toast.success("Abonnement mis à jour");
  };

  const role: UserRole = demoRole ?? profile?.role ?? "user";
  const subscriptionTier: PlanTier = demoTier ?? (profile?.subscription_tier as PlanTier) ?? subscriptionTierState;
  const isDemo = demoRole !== null;

  return (
    <AuthContext.Provider
      value={{
        session: isDemo ? null : session,
        user: isDemo ? null : (session?.user ?? null),
        profile: isDemo ? null : profile,
        role,
        subscriptionTier,
        updateSubscription,
        loading,
        signOut: async () => {
          sessionStorage.removeItem("matax_demo_role");
          sessionStorage.removeItem("matax_demo_subscription_tier");
          await supabase.auth.signOut();
          setProfile(null);
          setSubscriptionTierState("free");
        },
        isExpert: role === "expert",
        isAdmin: role === "admin",
        isUser: role === "user",
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside <AuthProvider>");
  return ctx;
}
