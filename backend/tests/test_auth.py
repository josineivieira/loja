from app.security.passwords import hash_password, verify_password


def test_password_hash_is_not_plain_text() -> None:
    password_hash = hash_password("strong-password")

    assert password_hash != "strong-password"
    assert verify_password("strong-password", password_hash)

