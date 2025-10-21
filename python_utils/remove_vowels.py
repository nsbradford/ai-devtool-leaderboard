VOWELS = set("aeiouAEIOU")

def remove_vowels(value: str) -> str:
    """Remove all vowels from the string."""
    return ''.join(ch for ch in value if ch not in VOWELS)
