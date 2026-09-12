import re


def normalize_email(value: str) -> str:
    return value.strip().lower()


def normalize_isbn(value: str) -> str:
    normalized = re.sub(r"[\s-]", "", value).upper()
    if not re.fullmatch(r"(?:\d{9}[\dX]|\d{13})", normalized):
        raise ValueError("ISBN must contain 10 or 13 digits")
    return normalized
