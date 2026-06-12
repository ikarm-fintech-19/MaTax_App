def test_db_types_have_subscription_tier():
    # Verify profiles schema types contains subscription_tier
    with open("src/integrations/supabase/types.ts", "r") as f:
        content = f.read()
    assert "subscription_tier: string" in content or "subscription_tier?: string" in content
