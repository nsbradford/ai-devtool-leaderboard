def is_palindrome(value: str) -> bool:
    """Return True if the string reads the same forwards and backwards (case-insensitive, ignoring spaces)."""
    normalized = ''.join(ch.lower() for ch in value if not ch.isspace())
    return normalized == normalized[::-1]
