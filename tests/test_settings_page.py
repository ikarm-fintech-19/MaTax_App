def test_settings_tabs_exist():
    with open("src/routes/_app/settings.tsx", "r") as f:
        content = f.read()
    assert "settings.tab.company" in content
    assert "settings.tab.subscription" in content
    assert "PlansMatrix" in content
    assert "subscriptionTier" in content
