from app.security.jwt import create_access_token, decode_token


def test_access_token_contains_roles() -> None:
    token = create_access_token("user-id", ["admin"])
    payload = decode_token(token)

    assert payload["sub"] == "user-id"
    assert payload["type"] == "access"
    assert payload["roles"] == ["admin"]

