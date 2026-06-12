import os

def test_pricing_components_exist():
    assert os.path.exists("src/components/pricing/checkout-modal.tsx")
    assert os.path.exists("src/components/pricing/plans-matrix.tsx")

def test_pricing_components_content():
    with open("src/components/pricing/checkout-modal.tsx", "r") as f:
        checkout = f.read()
    assert "export function CheckoutModal" in checkout
    assert "cardBrand" in checkout
    assert "updateSubscription" in checkout

    with open("src/components/pricing/plans-matrix.tsx", "r") as f:
        matrix = f.read()
  
    assert "export function PlansMatrix" in matrix
    assert "billingPeriod" in matrix
    assert "CheckoutModal" in matrix
