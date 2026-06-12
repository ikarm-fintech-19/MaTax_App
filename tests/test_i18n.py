def test_pricing_keys_present():
    with open("src/lib/i18n.tsx", "r") as f:
        content = f.read()
    assert "pricing.features.g50_pdf" in content
