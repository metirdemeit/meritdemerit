from backend.utils.security import hash_password, is_password_hashed, verify_password


def test_hash_and_verify():
    hashed = hash_password("s3cret")
    assert is_password_hashed(hashed)
    assert hashed != "s3cret"
    assert verify_password("s3cret", hashed)
    assert not verify_password("wrong", hashed)


def test_legacy_plaintext_still_verifies():
    assert not is_password_hashed("s3cret")
    assert verify_password("s3cret", "s3cret")
    assert not verify_password("wrong", "s3cret")


def test_empty_values_never_verify():
    assert not verify_password("", "")
    assert not verify_password("x", None)
    assert not verify_password("", hash_password("x"))
