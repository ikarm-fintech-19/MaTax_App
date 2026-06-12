def test_auth_context_exposes_subscription():
    with open("src/hooks/use-auth.tsx", "r") as f:
        content = f.read()
    assert "subscriptionTier: PlanTier" in content
    assert "updateSubscription: (tier: PlanTier) => Promise<void>" in content
