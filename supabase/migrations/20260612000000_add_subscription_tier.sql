-- supabase/migrations/20260612000000_add_subscription_tier.sql
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS subscription_tier text NOT NULL DEFAULT 'free';
