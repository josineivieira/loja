from decimal import Decimal

from app.services.checkout import money


def test_money_rounds_half_up() -> None:
    assert money(Decimal("10.005")) == Decimal("10.01")

